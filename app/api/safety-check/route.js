import { NextResponse } from 'next/server'
import axios from 'axios'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request) {
  try {
    const { dateName, dateLocation, dateAge, imageBase64 } = await request.json()

    let photoResults = null
    
    // If image provided, do reverse image search
    if (imageBase64) {
      try {
        console.log('Starting image upload to Cloudinary...')
        
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imageBase64, {
          folder: 'homesafe-checks',
          resource_type: 'auto'
        })
        
        const imageUrl = uploadResult.secure_url
        console.log('Image uploaded to:', imageUrl)
        
        // Reverse image search with SerpApi
        console.log('Starting reverse image search...')
        const imageSearchResponse = await axios.get('https://serpapi.com/search', {
          params: {
            engine: 'google_lens',
            url: imageUrl,
            api_key: process.env.SERPAPI_KEY,
            hl: 'en'
          }
        })
        
        const visualMatches = imageSearchResponse.data.visual_matches || []
        console.log(`Found ${visualMatches.length} visual matches`)
        
        photoResults = {
          totalMatches: visualMatches.length,
          profiles: visualMatches.slice(0, 10).map(match => ({
            title: match.title || 'Unknown',
            source: match.source || 'Unknown source',
            link: match.link,
            thumbnail: match.thumbnail
          }))
        }
        
        // Optional: Delete image from Cloudinary after search to save space
        // await cloudinary.uploader.destroy(uploadResult.public_id)
        
      } catch (imageError) {
        console.error('Image search error:', imageError.response?.data || imageError.message)
        // Continue with name search even if image fails
      }
    }

    // Name-based search
    if (!dateName || dateName.trim() === '') {
      // If no name but have photo results, return those
      if (photoResults) {
        return NextResponse.json({
          success: true,
          photoMatches: photoResults.totalMatches,
          photoProfiles: photoResults.profiles,
          extractedNames: [],
          newsResults: [],
          socialProfiles: [],
          confidence: calculatePhotoConfidence(photoResults.totalMatches)
        })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Please enter the date\'s name or upload a photo'
      }, { status: 400 })
    }

    const name = dateName.trim()
    const location = dateLocation?.trim() || ''
    const age = dateAge?.trim() || ''
    
    // Build search query with exact matching
    let newsQuery = `"${name}"`
    
    if (location) {
      newsQuery += ` "${location}"`
    }
    
    if (age) {
      const ageNum = parseInt(age)
      if (!isNaN(ageNum)) {
        newsQuery += ` (age ${ageNum-2} OR age ${ageNum-1} OR age ${ageNum} OR age ${ageNum+1} OR age ${ageNum+2})`
      }
    }
    
    newsQuery += ` (arrested OR convicted OR charged OR assault OR "domestic violence" OR "domestic abuse" OR court OR sentenced OR jailed OR fraud OR scam)`
    newsQuery += ` -site:facebook.com -site:instagram.com -site:twitter.com -site:linkedin.com -site:tiktok.com`
    
    console.log('Searching for:', newsQuery)
    
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

    // Filter to only relevant results
    const nameParts = name.toLowerCase().split(' ')
    articles = articles.filter(article => {
      const titleLower = article.title.toLowerCase()
      const snippetLower = article.snippet?.toLowerCase() || ''
      return nameParts.every(part => 
        titleLower.includes(part) || snippetLower.includes(part)
      )
    })

    // Social media search
    let socialQuery = `"${name}"`
    if (location) socialQuery += ` "${location}"`
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

    // Calculate overall confidence
    let confidence = 'HIGH'
    
    // Photo confidence (overrides if worse)
    if (photoResults) {
      if (photoResults.totalMatches > 10) confidence = 'VERY_LOW'
      else if (photoResults.totalMatches > 3) confidence = 'LOW'
      else if (photoResults.totalMatches > 1) confidence = 'MEDIUM'
    }
    
    // News confidence
    if (articles.length > 2 && confidence === 'HIGH') {
      confidence = 'LOW'
    }
    
    const hasSeriousCrime = articles.some(a => {
      const text = (a.title + ' ' + a.snippet).toLowerCase()
      return text.includes('convicted') || 
             text.includes('sentenced') || 
             text.includes('assault') ||
             text.includes('domestic violence') ||
             text.includes('domestic abuse')
    })

    if (hasSeriousCrime) confidence = 'VERY_LOW'

    let searchSummary = `${name}`
    if (location) searchSummary += `, ${location}`
    if (age) searchSummary += `, age ~${age}`

    return NextResponse.json({
      success: true,
      photoMatches: photoResults?.totalMatches || 0,
      photoProfiles: photoResults?.profiles || [],
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

function calculatePhotoConfidence(matches) {
  if (matches === 0) return 'UNKNOWN'
  if (matches === 1) return 'HIGH'
  if (matches <= 3) return 'MEDIUM'
  if (matches <= 10) return 'LOW'
  return 'VERY_LOW'
}