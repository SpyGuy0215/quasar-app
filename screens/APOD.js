import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {getAPOD} from "../helper";
import { useColorScheme } from "react-native";
import { useTheme } from "../ThemeContext";
import ImageActionsModal from "../components/ImageActionsModal";
import { Haptics } from "../helper";

export default function APODScreen(){
    const [data, setData] = useState(null);
    const {isDarkMode} = useTheme();
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const apodData = await getAPOD();
            console.log(apodData);
            setData(apodData);
        }
        fetchData();
    }, []);

    return (
        <View>
            {data ? (
                <ScrollView className="flex flex-col">
                    <ImageActionsModal
                        isVisible={isModalVisible}
                        onClose={() => setIsModalVisible(false)}
                        imageUrl={data.hdurl}
                        authorName={data.copyright || "NASA"}
                        date={data.date || ""}
                        title={data.title || "Image"}
                    />
                    <TouchableOpacity className="w-full h-[90vw] mb-4" onPress={() => {
                        Haptics.soft();
                        setIsModalVisible(true);
                    }}>
                        <Image source={{ uri: data.hdurl }} className="w-full h-[90vw] object-cover mb-4"/>
                    </TouchableOpacity>
                    <Text className={"text-4xl font-extrabold text-center mt-2 mb-2 mx-2 px-4"} style={{
                        color: isDarkMode ? "#fff" : "#000"
                    }}>{data.title}</Text>
                    <View className="flex flex-row justify-between mx-2 mt-2 mb-2 px-4 font-semibold">
                        <Text className="font-semibold my-auto" style={{
                            color: isDarkMode ? "#aaa" : "#555"
                        }}>{data.copyright}</Text>
                        <Text className="font-semibold my-auto" style={{
                            color: isDarkMode ? "#aaa" : "#555"
                        }}>{new Date(data.date).toLocaleDateString()}</Text>
                    </View>
                    <Text className="text-lg mt-6 mb-20 mx-2 leading-relaxed px-4" style={{
                        color: isDarkMode ? "#fff" : "#000"
                    }}>{data.explanation}</Text>
                </ScrollView>
            ) : (
                <Text className="text-lg text-center mt-10">Loading...</Text>
            )}
        </View>
    )
}