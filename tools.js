export async function recentNews(publishedAfterTimestamp, summaryContainsOne=null){
    console.log("[Tools] recentNews called"); 
    
    // Call Spaceflight API to get recent news
    const response = await fetch(
        "https://api.spaceflightnewsapi.net/v4/articles?ordering=-published_at&limit=5&published_at_gte=" + publishedAfterTimestamp
    + (summaryContainsOne ? "&summary_contains_one=" + summaryContainsOne : ""));
    if (!response.ok) {
        console.error("[Tools] fetching recent news failed");
        console.error(response.message);
        return "Failed to fetch recent news.";
    }
    const data = await response.json();
    console.log(data);
    const dataStr = JSON.stringify(data);
    console.log("[Tools] recentNews returning response"); 
    return dataStr;
}

export async function searchWikipedia(query){
   console.log("[Tools] searchWikipedia called")
   const response = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(query))
   console.log(response.status);
   if (!response.ok) {
       console.log("[Tools] searching Wikipedia failed with query: " + query)
       return "This topic was not found on Wikipedia."
   }
   const data = await response.json()
   const dataObj = {
       title: data.title,
       thumbnail: data.thumbnail ? data.thumbnail.source : null,
       originalImage: data.originalimage ? data.originalimage.source : null,
       description: data.description,
       extract: data.extract,
       timestamp: data.timestamp,
   }
   // turn dataObj into a string so that it can be sent to the model
   const dataStr = JSON.stringify(dataObj)
   console.log("[Tools] searchWikipedia returning response")
   return dataStr
}

export async function searchNASAIVL(query){
    console.log("[Tools] searchNASAIVL called with query:", query, "type:", typeof query);
    
    // Validate the query parameter
    if (!query || query === 'undefined' || typeof query !== 'string' || query.trim() === '') {
        console.error("[Tools] Invalid query parameter:", query);
        return "Invalid search query provided. Please provide a valid search term.";
    }
    
    const cleanQuery = query.trim();
    console.log("[Tools] Using cleaned query:", cleanQuery);
    
    try {
        const response = await fetch("https://images-api.nasa.gov/search?media_type=image&q=" + encodeURIComponent(cleanQuery) + "&page_size=5");
        console.log(response.status);
        
        if (!response.ok) {
            console.error("[Tools] searching NASA IVL failed with query: " + cleanQuery);
            return "This topic was not found in the NASA Image and Video Library.";
        }
        
        const data = await response.json();
        console.log("[Tools] NASA IVL raw response data:", data);
        
        // Check if we got valid data
        if (!data.collection || !data.collection.items) {
            console.warn("[Tools] NASA IVL returned invalid data structure");
            return "No images found in the NASA Image and Video Library for this query.";
        }
        
        // Process the data to extract usable information
        const items = data.collection.items || [];
        const processedResults = items.map(item => {
            const title = item.data?.[0]?.title || "Untitled";
            const description = item.data?.[0]?.description || "";
            const dateCreated = item.data?.[0]?.date_created || "";
            const keywords = item.data?.[0]?.keywords || [];
            
            // Find the best quality image link
            let imageUrl = null;
            if (item.links && item.links.length > 0) {
                // Filter for image files and sort by potential quality
                const imageLinks = item.links.filter(link => 
                    link.href && (link.href.endsWith('.jpg') || link.href.endsWith('.png') || link.href.endsWith('.jpeg'))
                );
                
                if (imageLinks.length > 0) {
                    // Sort by size if available, otherwise take first
                    imageLinks.sort((a, b) => (b.size || 0) - (a.size || 0));
                    imageUrl = imageLinks[0].href;
                }
            }
            
            return {
                title,
                description: description.slice(0, 300) + (description.length > 300 ? "..." : ""), // Truncate long descriptions
                imageUrl,
                dateCreated,
                keywords: Array.isArray(keywords) ? keywords.slice(0, 5) : [], // Limit keywords
                nasaId: item.data?.[0]?.nasa_id || ""
            };
        }).filter(item => item.imageUrl); // Only include items with valid image URLs
        
        if (processedResults.length === 0) {
            return "No images with valid URLs found in the NASA Image and Video Library for this query.";
        }
        
        const result = {
            query,
            totalResults: data.collection.metadata?.total_hits || 0,
            results: processedResults.slice(0, 3) // Limit to 3 results to avoid overwhelming the AI
        };
        
        console.log("[Tools] searchNASAIVL processed results:", processedResults.length);
        return JSON.stringify(result);
        
    } catch (error) {
        console.error("[Tools] Error searching NASA IVL:", error);
        return "Error occurred while searching the NASA Image and Video Library. Please try again later.";
    }
}