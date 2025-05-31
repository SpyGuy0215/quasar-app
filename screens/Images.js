import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Modal,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { SceneMap, TabView, TabBar } from "react-native-tab-view";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

const API_KEY = "B1yWxg9mEnZ6PIpWwDiJ8EWUSAkyj4V6re9N3Y6l";

async function getAPOD() {
  try {
    const response = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  } catch (error) {
    console.error("Error fetching APOD:", error);
    return null;
  }
}

async function getNASAIVL() {
  try {
    const response = await fetch(
      `https://images-api.nasa.gov/search?q=space&media_type=image`
    );
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data.collection.items;
  } catch (error) {
    console.error("Error fetching NASA IVL:", error);
    return [];
  }
}

const windowWidth = Dimensions.get("window").width;
const windowHeight = Dimensions.get("window").height;

const APODTab = ({ loading, apodData, onImagePress }) => {
  return (
    <View className="flex-1 bg-white">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="small" color="#000" />
          <Text className="mt-2 text-lg text-black font-semibold">
            Loading Astronomy Picture...
          </Text>
        </View>
      ) : (
        <ScrollView className="flex">
          {apodData && (
            <View className="p-4">
              <Text className="text-2xl font-bold text-center mb-4 text-black">
                {apodData.title}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onImagePress(apodData.hdurl)}
              >
                <Image
                  className="w-full h-72 rounded-2xl mb-4"
                  source={{ uri: apodData.hdurl }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text className="text-lg text-black leading-6">
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
  // Request media library permissions
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Permission Denied",
      "Media library permission is required to download images."
    );
    return;
  }

  try {
    // Download the image to a temporary file
    const fileName = imageUrl.split("/").pop();
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

    // Save the file to the user's media library
    await MediaLibrary.createAssetAsync(downloadResult.uri);
    Alert.alert("Download Complete", "Image has been saved to your photos.");
  } catch (error) {
    console.error("Download failed:", error);
    Alert.alert("Download Failed", "An error occurred while downloading the image.");
  }
}

const NASAIVLTab = ({ nasaIVLData, onImagePress }) => {
  return (
    <View className="flex-1 bg-white">
      <FlatList
        data={nasaIVLData}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onImagePress(item)}
            className="mb-4"
            style={{ flex: 1 / 2, margin: 4 }}
          >
            <Image
              style={{ width: "100%", height: 230, borderRadius: 20 }}
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

const routes = [
  { key: "first", title: "Daily Astronomy Picture" },
  { key: "second", title: "NASA Wallpapers" },
];

export default function ImagesScreen() {
  const [apodData, setApodData] = useState(null);
  const [nasaIVLData, setNASAIVLData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalImageUri, setModalImageUri] = useState(null);

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

  const onImagePress = (uri) => {
    Alert.alert(
        "Download Image",
        "Do you want to save this image to your photos?",
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Download",
                onPress: () => downloadImage(uri),
            },
        ]
    );
};

  if (!apodData && nasaIVLData.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-lg text-black">Loading...</Text>
      </View>
    );
  }

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: "white", height: 3 }} // underline
      style={{ backgroundColor: "#000" }} // tab bar bg
      labelStyle={{
        color: "white",
        fontWeight: "bold",
        textTransform: "none",
      }} // tab text
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
              onImagePress={onImagePress} // Pass onImagePress here
            />
          ),
          second: () => (
            <NASAIVLTab
              nasaIVLData={nasaIVLData}
              onImagePress={onImagePress} // Pass onImagePress here
            />
          ),
        })}
        onIndexChange={setIndex}
        renderTabBar={renderTabBar}
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black bg-opacity-90 justify-center items-center"
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <Image
            source={{ uri: modalImageUri }}
            style={{
              width: windowWidth * 0.9,
              height: windowHeight * 0.7,
              borderRadius: 20,
            }}
            resizeMode="contain"
          />
          <Text className="text-white mt-4 text-lg font-semibold">
            Tap anywhere to close
          </Text>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
