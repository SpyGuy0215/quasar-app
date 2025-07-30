import React, { useEffect } from "react";
import {
    View,
    Image,
    Text,
    ScrollView,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import ImageActionsModal from "../components/ImageActionsModal";
import { useTheme } from "../ThemeContext";
import { Haptics } from "../helper";
import { Picker } from "@react-native-picker/picker";

export default function WallpapersScreen() {
    const [images, setImages] = React.useState([]);
    const [page, setPage] = React.useState(1);
    const [selectedSearchTerm, setSelectedSearchTerm] = React.useState([]); // Default search term
    const [modalInfo, setModalInfo] = React.useState({
        isVisible: false,
        imageUrl: "",
        authorName: "",
        date: "",
        title: "",
    });
    const [loadingImages, setLoadingImages] = React.useState({}); // Track loading state for images
    const { isDarkMode } = useTheme();

    useEffect(() => {
        console.log("Fetching images for page:", page);
        fetchImages();
    }, [page, selectedSearchTerm]); // Add selectedSearchTerm to the dependency array

    function fetchImages() {
        const keywords = selectedSearchTerm.join(","); // Convert array to comma-separated string
        console.log("Fetching images with keywords:", keywords);
        let url = `https://images-api.nasa.gov/search?keywords=[${keywords}]&media_type=image&page_size=20&page=${page}`;
        if (keywords.length === 0) {
            url = `https://images-api.nasa.gov/search?media_type=image&page_size=20&page=${page}`;
        }
        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                const items = data.collection.items;

                // manipulate data to get the highest resolution image from each collection item
                // check based on image size property
                items.forEach((item) => {
                    if (item.links && item.links.length > 0) {
                        item.links.sort((a, b) => {
                            return b.size - a.size; // sort by size property
                        });
                    }
                    // remove links that do not end with .jpg or .png
                    item.links = item.links.filter(
                        (link) =>
                            link.href.endsWith(".jpg") ||
                            link.href.endsWith(".png")
                    );
                    // if no links left, remove the item
                    if (item.links.length === 0) {
                        item.links = [
                            { href: "https://via.placeholder.com/150" },
                        ]; // fallback image
                    }
                });

                setImages((prevImages) => [...prevImages, ...items]);
            })
            .catch((error) => {
                console.error("Error fetching images:", error);
            });
    }

    return (
        <View className="flex-1">
            <ImageActionsModal
                isVisible={modalInfo.isVisible}
                onClose={() => setModalInfo({ ...modalInfo, isVisible: false })}
                imageUrl={modalInfo.imageUrl}
                authorName={modalInfo.authorName}
                date={modalInfo.date}
                title={modalInfo.title}
            />
            <Picker
                selectedValue={selectedSearchTerm}
                onValueChange={(itemValue) => {
                    setSelectedSearchTerm(itemValue);
                    setPage(1); // Reset page to 1
                    setImages([]); // Clear current images
                }}
                style={{ margin: 10, height: 50, backgroundColor: isDarkMode ? "#333" : "#eee", color: isDarkMode ? "#fff" : "#000"}}
            >
                <Picker.Item label="All" value={[]} />
                <Picker.Item
                    label="Spacecraft"
                    value={[
                        "rocket",
                        "rockets",
                        "spacecraft",
                        "space shuttle",
                        "shuttle",
                        "launch",
                        "satellite",
                    ]}
                />
                <Picker.Item
                    label="Space Telescope"
                    value={["hubble", "telescope", "space telescope"]}
                />
                <Picker.Item label="Stars" value={["star", "stars", "sun"]} />
                <Picker.Item
                    label="Planets"
                    value={[
                        "planet",
                        "planetary",
                        "Mercury",
                        "Venus",
                        "Earth",
                        "Mars",
                        "Jupiter",
                        "Saturn",
                        "Uranus",
                        "Neptune",
                    ]}
                />
                <Picker.Item
                    label="Galaxies"
                    value={["galaxy", "galaxies", "milky way"]}
                />
                <Picker.Item label="Nebulae" value={["nebula", "nebulae"]} />
            </Picker>
            <FlatList
                data={images}
                keyExtractor={(item, index) => index.toString()}
                onEndReached={() => {
                    setPage(page + 1);
                }}
                onEndReachedThreshold={1}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            const imageUrl =
                                item.links && item.links[0]
                                    ? item.links[0].href
                                    : "https://via.placeholder.com/150";
                            setModalInfo({
                                isVisible: true,
                                imageUrl: imageUrl,
                                authorName:
                                    item.data && item.data[0]
                                        ? item.data[0].photographer || "Unknown"
                                        : "Unknown",
                                date:
                                    item.data && item.data[0]
                                        ? item.data[0].date_created || "Unknown"
                                        : "Unknown",
                                title:
                                    item.data && item.data[0]
                                        ? item.data[0].title || "Unknown"
                                        : "Unknown",
                            });
                            Haptics.soft();
                        }}
                        style={{ flex: 1 / 2, margin: 4 }}
                    >
                        {loadingImages[
                            item.links && item.links[0]
                                ? item.links[0].href
                                : ""
                        ] && (
                            <ActivityIndicator
                                size="large"
                                color={isDarkMode ? "#fff" : "#000"}
                                style={{
                                    position: "absolute",
                                    alignSelf: "center",
                                    top: 100,
                                }}
                            />
                        )}
                        <Image
                            style={{
                                width: "100%",
                                height: 230,
                                borderRadius: 20,
                            }}
                            source={{
                                uri:
                                    item.links && item.links[1]
                                        ? item.links[1].href
                                        : "https://via.placeholder.com/150",
                            }}
                            resizeMode="cover"
                            onLoadStart={() => {
                                const imageUrl =
                                    item.links && item.links[1]
                                        ? item.links[1].href
                                        : "";
                                setLoadingImages((prev) => ({
                                    ...prev,
                                    [imageUrl]: true,
                                }));
                            }}
                            onLoadEnd={() => {
                                const imageUrl =
                                    item.links && item.links[1]
                                        ? item.links[1].href
                                        : "";
                                setLoadingImages((prev) => ({
                                    ...prev,
                                    [imageUrl]: false,
                                }));
                            }}
                        />
                    </TouchableOpacity>
                )}
                numColumns={2}
                contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 8 }}
            />
        </View>
    );
}
