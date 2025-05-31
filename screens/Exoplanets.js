import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, TextInput, TouchableOpacity, ScrollView } from "react-native";
import * as FileSystem from "expo-file-system";

const BASE_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
const DEFAULT_QUERY = "?query=select+distinct(pl_name)+pl_name,discoverymethod,pl_masse,pl_orbper+from+ps+order+by+pl_name+asc&format=json";

export default function ExoplanetsScreen() {
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

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#000" />
                <Text className="mt-4 text-lg text-black">Loading Exoplanets...</Text>
            </View>
        );
    }

    if (selectedPlanet) {

        return (
            <View className="flex-1 bg-white p-4">
                <TouchableOpacity
                    className="mb-4 px-4 py-2 bg-gray-200 rounded-full w-24"
                    onPress={() => setSelectedPlanet(null)}
                >
                    <Text className="text-black text-center font-semibold">Back</Text>
                </TouchableOpacity>
                <ScrollView>
                    <Text className="text-3xl font-bold text-black mb-4">
                        {selectedPlanet.kepler_name || selectedPlanet.pl_name || "Unknown Exoplanet"}
                    </Text>
                    {Object.entries(selectedPlanet).map(([key, value]) => (
                        <View key={key} className="mb-3">
                            <Text className="font-semibold text-black capitalize">{key.replace(/_/g, " ")}:</Text>
                            <Text className="text-black">{value !== null ? value.toString() : "Unknown"}</Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white p-4">
            <Text className="text-2xl font-bold text-black mb-4">Named Exoplanets</Text>
            <TextInput
                className="bg-white text-black p-2 rounded-lg border border-gray-300 mb-4"
                placeholder="Search by exoplanet name..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={handleSearch}
            />
            <FlatList
                data={filteredData}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        className="mb-4 p-4 bg-white rounded-xl border border-gray-400"
                        onPress={() => setSelectedPlanet(item)}
                    >
                        <Text className="text-xl font-bold text-black">
                            {item.kepler_name || item.pl_name || "Unknown Exoplanet"}
                        </Text>
                        <Text className="text-sm text-black mt-2">
                            Discovery Method: {item.discoverymethod || "Unknown"}
                        </Text>
                        <Text className="text-sm text-black mt-2">
                            Orbital Period: {item.pl_orbper ? `${item.pl_orbper} days` : "Unknown"}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}
