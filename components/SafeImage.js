import { use, useEffect, useState } from "react";
import { Image } from "expo-image";
import { cssInterop } from "nativewind";

cssInterop(Image, {className: "style"}); // Fixes nativewind className support for Image component

export default function SafeImage({
    defaultURL,
    backupURL,
    style,
    resizeMode = "cover",
    onLoad,
    onLoadStart,
    onLoadEnd,
    onProgress,
    className = "",
}) {
    // Clean and decode the URL to handle any encoding issues
    const cleanURL = (url) => {
        if (!url) return url;
        
        // Decode URL-encoded characters
        let cleanedUrl = decodeURIComponent(url);
        
        // Remove any surrounding brackets that might have been encoded
        cleanedUrl = cleanedUrl.replace(/^\[/, '').replace(/\]$/, '');
        
        // Handle markdown link format [text](url) - extract just the URL
        const markdownLinkMatch = cleanedUrl.match(/\[.*?\]\((.*?)\)/);
        if (markdownLinkMatch) {
            cleanedUrl = markdownLinkMatch[1];
        }
        
        return cleanedUrl;
    };
    
    const cleanedDefaultURL = cleanURL(defaultURL);
    const cleanedBackupURL = cleanURL(backupURL);
    
    console.log("[SafeImage] Original URL:", defaultURL);
    console.log("[SafeImage] Cleaned URL:", cleanedDefaultURL);
    
    const [error, setError] = useState(false);
    if (error || !cleanedDefaultURL) {
        console.log("[SafeImage] Using backup URL:", cleanedBackupURL);
        return (
            <Image
                source={{ uri: cleanedBackupURL }}
                style={style}
                contentFit={resizeMode}
                onLoadStart={onLoadStart}
                onLoadEnd={onLoadEnd}
                onLoad={onLoad}
                onProgress={onProgress}
                recyclingKey={cleanedBackupURL} // Helps with reloading images when URL changes
                cachePolicy={"memory-disk"}
                onError={() => console.error("[SafeImage] Error loading backup image")}
                className={className}
            />
        );
    }
    return (
        <Image
            source={{ uri: cleanedDefaultURL }}
            style={style}
            contentFit={resizeMode}
            cachePolicy={"memory-disk"}
            onLoad={onLoad}
            onLoadStart={onLoadStart}
            onLoadEnd={onLoadEnd}
            onProgress={onProgress}
            recyclingKey={cleanedDefaultURL} // Helps with reloading images when URL changes
            className={className}
            onError={(e) => {
                console.error("[SafeImage] Error loading image, attempting backup:", e.nativeEvent?.error || e);
                setError(true);
            }}
        />
    );
}
