import { NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request) {
  try {
    const { imageUrl, dateName } = await request.json()

    // For now, let's use a simpler approach - just search by name
    // Image search with base64 is causing issues
    
    if (!dateName || dateName.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Please enter the date\'s name to run a safety check'
      }, { status: 400 })
    }

    const name = dateName.trim()
    
    // Search for concerning news about this person
    const newsResponse = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google',
        q: `"${name}" (arrest OR convicted OR assault OR fraud OR scam) UK`,
        api_key: process.env.SERPAPI_KEY,
        num: 10
      }
    })

    const articles = newsResponse.data.organic_results?.map(result => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      source: result.displayed_link || result.link,
      date: result.date || 'Date unknown'
    })) || []

    // Also search for general info
    const generalResponse = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google',
        q: `"${name}" UK social media linkedin instagram`,
        api_key: process.env.SERPAPI_KEY,
        num: 5
      }
    })

    const socialProfiles = generalResponse.data.organic_results?.map(result => ({
      title: result.title,
      link: result.link,
      source: result.displayed_link || result.link
    })) || []

    return NextResponse.json({
      success: true,
      photoMatches: 0, // We'll add photo search later
      extractedNames: [name],
      newsResults: [{
        name: name,
        articles: articles
      }],
      socialProfiles: socialProfiles,
      confidence: articles.length > 0 ? 'MEDIUM' : 'HIGH'
    })

  } catch (error) {
    console.error('Safety check error:', error.response?.data || error.message)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}