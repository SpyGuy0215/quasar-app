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
import { useTheme } from "../ThemeContext";

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

const APODTab = ({ loading, apodData, onImagePress, isDarkMode }) => {
  const backgroundColor = isDarkMode ? "#000" : "#fff";
  const textColor = isDarkMode ? "#fff" : "#000";

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
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
                <Image
                  style={{
                    width: "100%",
                    height: 288,
                    borderRadius: 20,
                    marginBottom: 16,
                  }}
                  source={{ uri: apodData.hdurl }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <Text style={{ fontSize: 16, lineHeight: 24, color: textColor, marginBottom: 48}}>
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
    const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

    await MediaLibrary.createAssetAsync(downloadResult.uri);
    Alert.alert("Download Complete", "Image has been saved to your photos.");
  } catch (error) {
    console.error("Download failed:", error);
    Alert.alert("Download Failed", "An error occurred while downloading the image.");
  }
}

const NASAIVLTab = ({ nasaIVLData, onImagePress, isDarkMode }) => {
  const backgroundColor = isDarkMode ? "#000" : "#fff";

  return (
    <View style={{ flex: 1, backgroundColor }}>
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
      <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: isDarkMode ? "#000" : "#fff" }}
      >
        <Text style={{ fontSize: 18, color: isDarkMode ? "#fff" : "#000" }}>Loading...</Text>
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
            <APODTab loading={loading} apodData={apodData} onImagePress={onImagePress} isDarkMode={isDarkMode} />
          ),
          second: () => (
            <NASAIVLTab nasaIVLData={nasaIVLData} onImagePress={onImagePress} isDarkMode={isDarkMode} />
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
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
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
          <Text
            style={{
              color: "#fff",
              marginTop: 16,
              fontSize: 18,
              fontWeight: "600",
            }}
          >
            Tap anywhere to close
          </Text>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
