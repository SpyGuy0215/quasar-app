import React, { useEffect } from "react";
import {
    View,
    Image,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from "react-native";
import ImageActionsModal from "../components/ImageActionsModal";
import { FlashList } from "@shopify/flash-list";
import { useTheme } from "../ThemeContext";
import { Haptics } from "../helper";
import SafeImage from "../components/SafeImage";
import Dropdown from "../components/Dropdown";

const TOPICS = [
    "All",
    "Scenic",
    "Spacecraft",
    "Telescopes",
    "Planets",
    "Stars",
    "Galaxies",
    "Nature",
    "Wallpapers",
];
const KEYWORDS = {
    All: [],
    Wallpapers: ["wallpaper", "background"],
    Scenic: ["landscape", "mountain", "ocean", "forest"],
    Spacecraft: [
        "spacecraft",
        "satellite",
        "probe",
        "rocket",
        "plane",
        "shuttle",
        "launch",
    ],
    Telescopes: ["telescope", "observatory", "Hubble", "James Webb", "HST", "JWST"],
    Planets: ["planet", "earth", "mars", "jupiter"],
    Stars: ["star", "sun", "supernova"],
    Galaxies: ["galaxy", "milky way", "andromeda"],
    Nature: [
        "nature",
        "forest",
        "waterfall",
        "wildlife",
        "flora",
        "fauna",
        "animals",
        "plants",
    ],
};

export default function WallpapersScreen() {
    const [images, setImages] = React.useState([]);
    const [page, setPage] = React.useState(1);
    const [selectedSearchTerm, setSelectedSearchTerm] = React.useState("All");
    const [selectedSearchKeywords, setSelectedSearchKeywords] = React.useState(
        []
    ); // Default search term
    const [modalInfo, setModalInfo] = React.useState({
        isVisible: false,
        imageUrl: "",
        backupURL: "",
        authorName: "",
        date: "",
        title: "",
    });
    const [loadingImages, setLoadingImages] = React.useState({}); // Track loading state for images
    const { isDarkMode } = useTheme();

    useEffect(() => {
        console.log("Fetching images for page:", page);
        fetchImages();
    }, [page, selectedSearchKeywords]); // Add selectedSearchTerm to the dependency array

    function fetchImages() {
        console.log("Selected search term:", selectedSearchKeywords);
        let keywords = [];
        if (selectedSearchKeywords.length === 0) {
            console.log("No search term selected, fetching default images");
        } else {
            keywords = selectedSearchKeywords.join(","); // Convert array to comma-separated string
            console.log("Fetching images with keywords:", keywords);
        }
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

    function handleDropdownSelect(item) {
        setSelectedSearchKeywords(KEYWORDS[item] || []);
        setSelectedSearchTerm(item);
        console.log("Selected search term:", item);
        setImages([]);
        setPage(1);
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
            <Dropdown
                placeholder="Select a category"
                items={TOPICS}
                selectedItem={
                    selectedSearchTerm?.length > 0 ? selectedSearchTerm : "All"
                }
                onSelect={(item) => {
                    handleDropdownSelect(item);
                }}
                tailwindStyles="my-3"
            />
            <FlashList
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
                            const imageUrl  = item.links[0] ? item.links[0].href : null;
                            const backupImageUrl = item.links[1] ? item.links[1].href : null;
                            setModalInfo({
                                isVisible: true,
                                imageUrl: imageUrl,
                                backupImageUrl: backupImageUrl,
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
                        <SafeImage
                            style={{
                                width: "100%",
                                height: 230,
                                borderRadius: 20,
                            }}
                            defaultURL={item.links[1]? item.links[1].href : null}
                            backupURL={item.links[0]? item.links[0].href : ""}
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
