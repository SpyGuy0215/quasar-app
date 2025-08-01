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
    const [error, setError] = useState(false);
    if (error || !defaultURL) {
        return (
            <Image
                source={{ uri: backupURL }}
                style={style}
                contentFit={resizeMode}
                onLoadStart={onLoadStart}
                onLoadEnd={onLoadEnd}
                onLoad={onLoad}
                onProgress={onProgress}
                cachePolicy={"memory-disk"}
                onError={() => console.error("[SafeImage] Error loading image")}
                className={className}
            />
        );
    }
    return (
        <Image
            source={{ uri: defaultURL }}
            style={style}
            contentFit={resizeMode}
            cachePolicy={"memory-disk"}
            onLoad={onLoad}
            onLoadStart={onLoadStart}
            onLoadEnd={onLoadEnd}
            onProgress={onProgress}
            className={className}
            onError={(e) => {
                console.error("[SafeImage] Error loading image, attempting backup:", e.nativeEvent.error);
                setError(true);
            }}
        />
    );
}
