import { NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request) {
  try {
    const { dateName, dateLocation, dateAge } = await request.json()

    if (!dateName || dateName.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Please enter the date\'s name to run a safety check'
      }, { status: 400 })
    }

    const name = dateName.trim()
    const location = dateLocation?.trim() || ''
    const age = dateAge?.trim() || ''
    
    // Use exact phrase matching with quotes and location
    // Add -site:facebook.com to exclude social media noise
    let newsQuery = `"${name}"`
    
    if (location) {
      newsQuery += ` "${location}"`
    }
    
    if (age) {
      // Add age range (e.g., if they say 25, search 23-27)
      const ageNum = parseInt(age)
      if (!isNaN(ageNum)) {
        newsQuery += ` (age ${ageNum-2} OR age ${ageNum-1} OR age ${ageNum} OR age ${ageNum+1} OR age ${ageNum+2})`
      }
    }
    
    // Add crime-related keywords
    newsQuery += ` (arrested OR convicted OR charged OR assault OR "domestic violence" OR "domestic abuse" OR court OR sentenced OR jailed OR fraud OR scam)`
    
    // Exclude social media and generic sites
    newsQuery += ` -site:facebook.com -site:instagram.com -site:twitter.com -site:linkedin.com -site:tiktok.com`
    
    console.log('Searching for:', newsQuery)
    
    // Search for news articles
    const newsResponse = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google',
        q: newsQuery,
        api_key: process.env.SERPAPI_KEY,
        num: 20,
        gl: 'uk',
        hl: 'en'
      }
    })

    let articles = newsResponse.data.organic_results?.map(result => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      source: result.displayed_link || result.link,
      date: result.date || 'Date unknown'
    })) || []

    // Filter results - only keep if name appears in title or snippet
    const nameParts = name.toLowerCase().split(' ')
    articles = articles.filter(article => {
      const titleLower = article.title.toLowerCase()
      const snippetLower = article.snippet?.toLowerCase() || ''
      
      // Must contain at least first name AND last name
      return nameParts.every(part => 
        titleLower.includes(part) || snippetLower.includes(part)
      )
    })

    // Search for their online presence separately (for verification)
    let socialQuery = `"${name}"`
    if (location) {
      socialQuery += ` "${location}"`
    }
    socialQuery += ` (linkedin OR facebook OR "about me")`
    
    const socialResponse = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google',
        q: socialQuery,
        api_key: process.env.SERPAPI_KEY,
        num: 5,
        gl: 'uk'
      }
    })

    const socialProfiles = socialResponse.data.organic_results?.slice(0, 3).map(result => ({
      title: result.title,
      link: result.link,
      source: result.displayed_link || result.link
    })) || []

    // Calculate confidence
    let confidence = 'HIGH'
    if (articles.length === 0) {
      confidence = 'HIGH' // No news = good sign
    } else if (articles.length <= 2) {
      confidence = 'MEDIUM' // A few articles, might be minor
    } else if (articles.length > 2) {
      confidence = 'LOW' // Multiple articles = concerning
    }

    // Extra red flag if serious crimes mentioned
    const hasSeriousCrime = articles.some(a => {
      const text = (a.title + ' ' + a.snippet).toLowerCase()
      return text.includes('convicted') || 
             text.includes('sentenced') || 
             text.includes('assault') ||
             text.includes('domestic violence') ||
             text.includes('domestic abuse')
    })

    if (hasSeriousCrime) {
      confidence = 'VERY_LOW'
    }

    let searchSummary = `${name}`
    if (location) searchSummary += `, ${location}`
    if (age) searchSummary += `, age ~${age}`

    return NextResponse.json({
      success: true,
      photoMatches: 0,
      extractedNames: [name],
      searchSummary: searchSummary,
      newsResults: [{
        name: searchSummary,
        articles: articles
      }],
      socialProfiles: socialProfiles,
      confidence: confidence,
      totalResults: articles.length
    })

  } catch (error) {
    console.error('Safety check error:', error.response?.data || error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}