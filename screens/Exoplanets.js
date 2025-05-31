import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    FlatList,
    TextInput,
    TouchableOpacity,
    ScrollView
} from "react-native";
import * as FileSystem from "expo-file-system";
import { useTheme } from "../ThemeContext";

const BASE_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
const DEFAULT_QUERY = "?query=select+distinct(pl_name)+pl_name,discoverymethod,pl_masse,pl_orbper+from+ps+order+by+pl_name+asc&format=json";

export default function ExoplanetsScreen() {
    const { isDarkMode } = useTheme();

    const [exoplanetsData, setExoplanetsData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPlanet, setSelectedPlanet] = useState(null);

    useEffect(() => {
        const fetchExoplanets = async () => {
            setLoading(true);
            try {
                const fileUri = FileSystem.documentDirectory + "exoplanets.json";
                const fileExists = await FileSystem.getInfoAsync(fileUri);

                if (fileExists.exists) {
                    const localData = await FileSystem.readAsStringAsync(fileUri);
                    const parsedData = JSON.parse(localData);
                    setExoplanetsData(parsedData);
                    setFilteredData(parsedData);
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${BASE_URL}${DEFAULT_QUERY}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch exoplanets data");
                }

                const data = await response.json();
                const uniqueData = Array.from(new Set(data.map(item => item.pl_name)))
                    .map(name => data.find(item => item.pl_name === name));

                setExoplanetsData(uniqueData || []);
                setFilteredData(uniqueData || []);
                await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(uniqueData));
            } catch (error) {
                console.error("Error fetching exoplanets data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchExoplanets();
    }, []);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim() === "") {
            setFilteredData(exoplanetsData);
        } else {
            const filtered = exoplanetsData.filter((item) =>
                (item.pl_name || "").toLowerCase().includes(query.toLowerCase())
            );
            setFilteredData(filtered);
        }
    };

    const backgroundColor = isDarkMode ? "#000" : "#fff";
    const textColor = isDarkMode ? "#fff" : "#000";
    const inputBackground = isDarkMode ? "#1a1a1a" : "#fff";
    const borderColor = isDarkMode ? "#333" : "#ccc";

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor }}>
                <ActivityIndicator size="large" color={textColor} />
                <Text style={{ marginTop: 16, fontSize: 18, color: textColor }}>Loading Exoplanets...</Text>
            </View>
        );
    }

    if (selectedPlanet) {
        return (
            <View style={{ flex: 1, backgroundColor, padding: 16 }}>
                <TouchableOpacity
                    style={{
                        marginBottom: 16,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        backgroundColor: isDarkMode ? "#333" : "#e5e5e5",
                        borderRadius: 999,
                        width: 100,
                    }}
                    onPress={() => setSelectedPlanet(null)}
                >
                    <Text style={{ color: textColor, textAlign: "center", fontWeight: "600" }}>Back</Text>
                </TouchableOpacity>
                <ScrollView>
                    <Text style={{ fontSize: 28, fontWeight: "bold", color: textColor, marginBottom: 16 }}>
                        {selectedPlanet.kepler_name || selectedPlanet.pl_name || "Unknown Exoplanet"}
                    </Text>
                    {Object.entries(selectedPlanet).map(([key, value]) => (
                        <View key={key} style={{ marginBottom: 12 }}>
                            <Text style={{ fontWeight: "600", color: textColor, textTransform: "capitalize" }}>
                                {key.replace(/_/g, " ")}:
                            </Text>
                            <Text style={{ color: textColor }}>{value !== null ? value.toString() : "Unknown"}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor, padding: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: textColor, marginBottom: 16 }}>
                Named Exoplanets
            </Text>
            <TextInput
                style={{
                    backgroundColor: inputBackground,
                    color: textColor,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor,
                    marginBottom: 16,
                }}
                placeholder="Search by exoplanet name..."
                placeholderTextColor={isDarkMode ? "#aaa" : "#999"}
                value={searchQuery}
                onChangeText={handleSearch}
            />
            <FlatList
                data={filteredData}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={{
                            marginBottom: 16,
                            padding: 16,
                            backgroundColor: inputBackground,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: isDarkMode ? "#444" : "#ccc",
                        }}
                        onPress={() => setSelectedPlanet(item)}
                    >
                        <Text style={{ fontSize: 18, fontWeight: "bold", color: textColor }}>
                            {item.kepler_name || item.pl_name || "Unknown Exoplanet"}
                        </Text>
                        <Text style={{ fontSize: 14, color: textColor, marginTop: 8 }}>
                            Discovery Method: {item.discoverymethod || "Unknown"}
                        </Text>
                        <Text style={{ fontSize: 14, color: textColor, marginTop: 8 }}>
                            Orbital Period: {item.pl_orbper ? `${item.pl_orbper} days` : "Unknown"}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}
