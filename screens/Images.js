import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    ScrollView,
    FlatList,
    Modal,
    TouchableOpacity,
    Dimensions,
    Alert,
} from "react-native";
import { SceneMap, TabView, TabBar } from "react-native-tab-view";
import ImageDownloadModal from "../components/ImageDownloadModal";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useTheme } from "../ThemeContext";

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const APODTab = ({ loading, apodData, onImagePress }) => {
    const backgroundColor = isDarkMode ? "#000" : "#fff";
    const textColor = isDarkMode ? "#fff" : "#000";
    const [imageLoading, setImageLoading] = useState(true);

    return (
        <View style={{ flex: 1, backgroundColor }}>
            {loading ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Text
                        style={{
                            marginTop: 8,
                            fontSize: 18,
                            fontWeight: "600",
                            color: textColor,
                        }}
                    >
                        Loading Astronomy Picture...
                    </Text>
                </View>
            ) : (
                <ScrollView style={{ flex: 1 }}>
                    {apodData && (
                        <View style={{ padding: 16 }}>
                            <Text
                                style={{
                                    fontSize: 24,
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    marginBottom: 16,
                                    color: textColor,
                                }}
                            >
                                {apodData.title}
                            </Text>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => onImagePress(apodData.hdurl)}
                            >
                                <View style={{ position: "relative" }}>
                                    <Image
                                        style={{
                                            width: "100%",
                                            height: 288,
                                            borderRadius: 20,
                                            marginBottom: 16,
                                        }}
                                        source={{ uri: apodData.hdurl }}
                                        resizeMode="contain"
                                        onLoadStart={() =>
                                            setImageLoading(true)
                                        }
                                        onLoadEnd={() => setImageLoading(false)}
                                    />
                                    {imageLoading && (
                                        <View
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                top: 0,
                                                width: "100%",
                                                height: 288,
                                                justifyContent: "center",
                                                alignItems: "center",
                                                borderRadius: 20,
                                                backgroundColor: isDarkMode
                                                    ? "rgba(0,0,0,0.6)"
                                                    : "rgba(255,255,255,0.6)",
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    color: textColor,
                                                    fontSize: 18,
                                                    fontWeight: "600",
                                                }}
                                            >
                                                Loading image...
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                            <Text
                                style={{
                                    fontSize: 16,
                                    lineHeight: 24,
                                    color: textColor,
                                    marginBottom: 48,
                                }}
                            >
                                {apodData.explanation}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
};

async function downloadImage(imageUrl) {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
        Alert.alert(
            "Permission Denied",
            "Media library permission is required to download images."
        );
        return;
    }

    try {
        const fileName = imageUrl.split("/").pop();
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        const downloadResult = await FileSystem.downloadAsync(
            imageUrl,
            fileUri
        );

        await MediaLibrary.createAssetAsync(downloadResult.uri);
        Alert.alert(
            "Download Complete",
            "Image has been saved to your photos."
        );
    } catch (error) {
        console.error("Download failed:", error);
        Alert.alert(
            "Download Failed",
            "An error occurred while downloading the image."
        );
    }
}

const NASAIVLTab = ({ nasaIVLData, onImagePress, isDarkMode, isModalVisible, modalImageInfo, setModalVisible }) => {
    const backgroundColor = isDarkMode ? "#000" : "#fff";
    console.log("NASAIVLTab modalImageInfo:", modalImageInfo);

    return (
        <View style={{ flex: 1, backgroundColor }}>
            <ImageDownloadModal
                isVisible={isModalVisible}
                imageUri={modalImageInfo?.uri || modalImageInfo?.links?.[0] || modalImageInfo}
                imageInfo={modalImageInfo}
                onClose={() => setModalVisible(false)}
            />
            <FlatList
                data={nasaIVLData}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onImagePress(item)}
                        style={{ flex: 1 / 2, margin: 4 }}
                    >
                        <Image
                            style={{
                                width: "100%",
                                height: 230,
                                borderRadius: 20,
                            }}
                            source={{ uri: item }}
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                )}
                numColumns={2}
                contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8 }}
            />
        </View>
    );
};

export default function ImagesScreen() {
    const [apodData, setApodData] = useState(null);
    const [nasaIVLData, setNASAIVLData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [index, setIndex] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalImageInfo, setModalImageInfo] = useState(null);
    const routes = [
        { key: "first", title: "Daily Astronomy Picture" },
        { key: "second", title: "NASA Wallpapers" },
    ];

    const { isDarkMode } = useTheme();

    useEffect(() => {
        getAPOD().then((data) => {
            if (data) setApodData(data);
            setLoading(false);
        });

        getNASAIVL().then((data) => {
            const parsedData = data.map((item) => item.links[0].href);
            setNASAIVLData(parsedData);
        });
    }, []);

    const onImagePress = (info) => {
        console.log("Info is the image press stuff right here:    " + info);
        setModalImageInfo(info);
        setModalVisible(true);
    };

    if (!apodData && nasaIVLData.length === 0) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: isDarkMode ? "#000" : "#fff",
                }}
            >
                <Text
                    style={{
                        fontSize: 18,
                        color: isDarkMode ? "#fff" : "#000",
                    }}
                >
                    Loading...
                </Text>
            </View>
        );
    }

    const renderTabBar = (props) => (
        <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: "white", height: 3 }}
            style={{ backgroundColor: "#000" }}
            labelStyle={{
                color: "white",
                fontWeight: "bold",
                textTransform: "none",
            }}
            activeColor="#fff"
            inactiveColor="#888"
        />
    );

    return (
        <>
            <TabView
                navigationState={{ index, routes }}
                renderScene={SceneMap({
                    first: () => (
                        <APODTab
                            loading={loading}
                            apodData={apodData}
                            onImagePress={onImagePress}
                            isDarkMode={isDarkMode}
                        />
                    ),
                    second: () => (
                        <NASAIVLTab
                            nasaIVLData={nasaIVLData}
                            onImagePress={onImagePress}
                            isDarkMode={isDarkMode}
                            isModalVisible={modalVisible}
                            modalImageInfo={modalImageInfo}
                            setModalVisible={setModalVisible}
                        />
                    ),
                })}
                onIndexChange={setIndex}
                renderTabBar={renderTabBar}
            />
        </>
    );
}
