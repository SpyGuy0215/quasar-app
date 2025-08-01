import { use, useEffect, useState } from "react";
import { Image } from "react-native";

export default function SafeImage({
    defaultURL,
    backupURL,
    style,
    resizeMode = "cover",
    onLoad,
    onLoadStart,
    onLoadEnd,
    className = "",
}) {
    const [error, setError] = useState(false);
    if (error || !defaultURL) {
        console.warn(
            `Error loading image from ${defaultURL}, falling back to backup URL: ${backupURL}`
        );
        return (
            <Image
                source={{ uri: backupURL }}
                style={style}
                resizeMode={resizeMode}
                onLoadStart={onLoadStart}
                onLoadEnd={onLoadEnd}
                onLoad={onLoad}
                onError={() => console.error("Error loading image")}
                className={className}
            />
        );
    }
    return (
        <Image
            source={{ uri: defaultURL }}
            style={style}
            resizeMode={resizeMode}
            onLoadStart={onLoadStart}
            onLoadEnd={onLoadEnd}
            className={className}
            onLoad={onLoad}
            onError={(e) => {
                console.error("[SafeImage] Error loading image:", e.nativeEvent.error);
                setError(true);
            }}
        />
    );
}
