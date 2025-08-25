export async function recentNews(publishedAfterTimestamp){
    console.log("[Tools] recentNews called"); 
    console.log("Published After Timestamp: " + publishedAfterTimestamp);
    
    // Call Spaceflight API to get recent news
    const response = await fetch("https://api.spaceflightnewsapi.net/v4/articles?ordering=-published_at&limit=5&published_at_gte=" + publishedAfterTimestamp);
    if (!response.ok) {
        console.error("[Tools] fetching recent news failed");
        console.error(response.message);
        return "Failed to fetch recent news.";
    }
    const data = await response.json();
    console.log(data);
    return data;
}

export async function searchWikipedia(query){
   console.log("[Tools] searchWikipedia called")
   const response = await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(query))
   console.log(response.status);
   if (!response.ok) {
       console.error("[Tools] searching Wikipedia failed with query: " + query)
       return "This topic was not found on Wikipedia."
   }
   const data = await response.json()
   console.log(data);
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
   return dataStr
}