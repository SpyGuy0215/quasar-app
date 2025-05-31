import React from "react";
import { View, Text, Image } from "react-native";
import { truncateText } from '../helper';

export default function NewsCard({ title, description, imageUrl, url, publishedAt }) {
    description = truncateText(description, 130);

    return (
        <View className="bg-white rounded-3xl p-4 mx-5 my-2 border border-gray-200">
            <Text className="text-black text-2xl font-bold mb-2">{title}</Text>
            <Text className="text-gray-600 text-sm mb-1">{publishedAt}</Text>
            <Text className="text-black mb-4">{description}</Text>
            {imageUrl && (
                <Image
                    source={{ uri: imageUrl }}
                    className="w-full h-[170px] rounded-2xl mb-1"
                    resizeMode="cover"
                />
            )}
        </View>
    );
}
