import React, { useState } from "react"; // Add useState for managing loading state
import {
    Modal,
    View,
    Text,
    Image,
    TouchableOpacity,
    Alert,
    Platform,
    Linking,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext"; // Import useTheme for dark mode support
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Haptics } from "../helper"; // Import Haptics for feedback
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

export default function ImageActionsModal({
    isVisible,
    onClose,
    imageUrl,
    albumName = "Quasar",
    authorName = "NASA",
    title = "Image",
    date = "",
}) {
    const { isDarkMode } = useTheme(); // Get dark mode value from context
    const [isLoading, setIsLoading] = useState(true); // State to track image loading
    console.log("Image URL:", imageUrl);

    async function checkImageStatus() {
        // get the name of the image from the URL
        const fileName = imageUrl.split("/").pop();
        const localUri = FileSystem.documentDirectory + fileName;
        console.log("Local URI:", localUri);

        // Check if file already exists locally
        const info = await FileSystem.getInfoAsync(localUri);
        let finalUri = localUri;
        if (!info.exists) {
            console.log("File does not exist, downloading...");
            console.log(localUri);
            const { uri } = await FileSystem.downloadAsync(imageUrl, localUri);
            finalUri = uri;
        }

        // Check if asset already in gallery
        const assetIdKey = "asset-id-" + fileName;
        const savedAssetId = await AsyncStorage.getItem(assetIdKey);

        console.log("checking if asset in gallery...");
        if (Platform.OS == "ios") {
            if (savedAssetId) {
                try {
                    const assetInfo = await MediaLibrary.getAssetInfoAsync(
                        savedAssetId
                    );
                    if (assetInfo && assetInfo.id) {
                        return { alreadyInGallery: true, finalUri };
                    }
                } catch (e) {
                    // Manually deleted
                    return { alreadyInGallery: false, finalUri };
                }
            }
            return { alreadyInGallery: false, finalUri };
        } else {
            const album = await MediaLibrary.getAlbumAsync(albumName);
            if (album) {
                let after = null;
                let hasNextPage = true;

                while (hasNextPage) {
                    const {
                        assets,
                        endCursor,
                        hasNextPage: nextPage,
                    } = await MediaLibrary.getAssetsAsync({
                        album,
                        mediaType: "photo",
                        first: 50,
                        after,
                    });

                    // Check if any asset has the matching filename
                    if (assets.some((asset) => asset.filename === fileName)) {
                        return { alreadyInGallery: true, finalUri };
                    }
                    after = endCursor;
                    hasNextPage = nextPage;
                }
            }
            return { alreadyInGallery: false, finalUri };
        }
    }

    async function handleDownload() {
        // check if already downloaded
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
            alert("Permission to access media library is required!");
            Haptics.notificationError();
            return;
        }
        try {
            let { alreadyInGallery, finalUri } = await checkImageStatus();
            if (alreadyInGallery) {
                Haptics.notificationSuccess();
                Alert.alert(
                    "Already Downloaded",
                    "This image has already been downloaded to your gallery."
                );
                return;
            }

            const fileName = imageUrl.split("/").pop();
            const assetIdKey = "asset-id-" + fileName;
            const savedAssetId = await AsyncStorage.getItem(assetIdKey);
            const newAsset = await MediaLibrary.createAssetAsync(finalUri);
            let album = await MediaLibrary.getAlbumAsync(albumName);
            if (!album) {
                await MediaLibrary.createAlbumAsync(albumName, newAsset, false);
            } else {
                await MediaLibrary.addAssetsToAlbumAsync(
                    [newAsset],
                    album,
                    false
                );
            }

            // Save the asset ID to AsyncStorage
            await AsyncStorage.setItem(assetIdKey, newAsset.id);
            console.log("Image downloaded and saved to gallery:", newAsset.id);

            Alert.alert(
                "Download Complete",
                "Image has been saved to your photos."
            );
            Haptics.notificationSuccess();
        } catch (error) {
            console.error("Download failed:", error);
            Alert.alert(
                "Download Failed",
                "An error occurred while downloading the image."
            );
            Haptics.notificationError();
        }
    }

    return (
        <Modal
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
            animationType="slide"
        >
            <View className="flex flex-col flex-1 bg-zinc-100">
                <View
                    style={{
                        flex: 1, // Ensure the parent View takes up the full screen
                        position: "relative", // Ensure child elements are positioned relative to this View
                    }}
                >
                    {isLoading && (
                        <View
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                justifyContent: "center",
                                alignItems: "center",
                                backgroundColor: "rgba(0, 0, 0, 0.7)", // Darker semi-transparent background
                                elevation: 10, // For Android z-index equivalent
                                zIndex: 100, // Ensure it appears above all elements
                            }}
                        >
                            <ActivityIndicator
                                size="large"
                                color={isDarkMode ? "#fff" : "#000"}
                            />
                        </View>
                    )}
                    <Image
                        source={{ uri: imageUrl }}
                        className="w-full h-[70vh] "
                        onLoad={() => setIsLoading(false)} // Set loading to false when image loads
                        onError={() => setIsLoading(false)} // Handle error case
                    />
                    <TouchableOpacity
                        onPress={onClose}
                        style={{
                            position: "absolute",
                            top: Platform.OS === "android" ? 20 : 50,
                            right: 20,
                            backgroundColor: "rgba(0,0,0,0.6)",
                            borderRadius: 9999,
                            padding: 10,
                            zIndex: 10,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View
                        className={"w-full h-[30vh]"}
                        style={{
                            backgroundColor: isDarkMode ? "#000" : "#fff",
                        }}
                    >
                        <Text
                            className={
                                "text-3xl font-extrabold text-center mt-4 mx-2 px-4"
                            }
                            style={{
                                color: isDarkMode ? "#fff" : "#000",
                            }}
                        >
                            {title}
                        </Text>
                        <View className="flex flex-row justify-between items-center mb-6 mx-8">
                            <Text
                                className="font-semibold my-auto"
                                style={{
                                    color: isDarkMode ? "#aaa" : "#555",
                            }}
                            >
                                {authorName}
                            </Text>
                            <Text
                                className="font-semibold my-auto"
                                style={{
                                    color: isDarkMode ? "#aaa" : "#555",
                            }}
                            >
                                {date == ""
                                    ? "Unknown Date"
                                    : new Date(date).toLocaleDateString()}
                            </Text>
                        </View>

                        <TouchableOpacity
                            className={
                                "rounded-lg flex flex-row justify-center items-center mx-12"
                            }
                            style={{
                                backgroundColor: isDarkMode ? "#333" : "#ddd",
                                color: isDarkMode ? "#fff" : "#000",
                            }}
                            onPress={handleDownload}
                        >
                            <Ionicons
                                name="download"
                                size={25}
                                color={isDarkMode ? "#fff" : "#000"}
                                className={"text-center mr-3"}
                            />
                            <Text
                                className={
                                    "text-2xl font-semibold text-center py-4 rounded-xl"
                            }
                            style={{
                                color: isDarkMode ? "#fff" : "#000",
                            }}
                            >
                                Download
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
