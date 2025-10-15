import { NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request) {
  try {
    const { imageUrl, dateName } = await request.json()

    // Step 1: Reverse Image Search
    const imageSearchResponse = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_lens',
        url: imageUrl,
        api_key: process.env.SERPAPI_KEY
      }
    })

    const imageResults = imageSearchResponse.data

    // Extract names from image search results
    const extractedNames = extractNamesFromResults(imageResults, dateName)

    // Step 2: Search news for each name
    const newsResults = []
    
    for (const name of extractedNames) {
      // Search for concerning news
      const newsResponse = await axios.get('https://serpapi.com/search', {
        params: {
          engine: 'google',
          q: `"${name}" (arrest OR convicted OR assault OR fraud OR scam) UK`,
          api_key: process.env.SERPAPI_KEY,
          num: 5
        }
      })

      if (newsResponse.data.organic_results) {
        newsResults.push({
          name: name,
          articles: newsResponse.data.organic_results.map(result => ({
            title: result.title,
            link: result.link,
            snippet: result.snippet,
            source: result.displayed_link || result.link,
            date: result.date || 'Date unknown'
          }))
        })
      }
    }

    // Step 3: Check for social media profiles
    const socialProfiles = imageResults.visual_matches?.slice(0, 10).map(match => ({
      title: match.title,
      link: match.link,
      source: match.source
    })) || []

    return NextResponse.json({
      success: true,
      photoMatches: imageResults.visual_matches?.length || 0,
      extractedNames: extractedNames,
      newsResults: newsResults,
      socialProfiles: socialProfiles,
      confidence: calculateConfidence(imageResults, extractedNames)
    })

  } catch (error) {
    console.error('Safety check error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

function extractNamesFromResults(results, providedName) {
  const names = new Set()
  
  // Add provided name if exists
  if (providedName && providedName.trim()) {
    names.add(providedName.trim())
  }

  // Extract names from visual matches
  if (results.visual_matches) {
    results.visual_matches.slice(0, 10).forEach(match => {
      const title = match.title || ''
      
      // Simple name extraction pattern (First Last)
      const namePattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g
      const matches = title.match(namePattern)
      
      if (matches) {
        matches.forEach(name => names.add(name))
      }
    })
  }

  return Array.from(names).slice(0, 5) // Limit to 5 names max
}

function calculateConfidence(imageResults, names) {
  const matchCount = imageResults.visual_matches?.length || 0
  
  if (matchCount === 0) return 'UNKNOWN'
  if (matchCount === 1) return 'HIGH'
  if (matchCount <= 3) return 'MEDIUM'
  if (matchCount <= 10) return 'LOW'
  return 'VERY_LOW'
}