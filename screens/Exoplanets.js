
import React, { useState, useEffect } from "react";
import { WebView } from 'react-native-webview';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image
} from "react-native";
import { useTheme } from "../ThemeContext";

// API endpoints
const WIKI_API = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const NASA_APOD_API = "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY";
const SOLAR_SYSTEM_API = "https://api.le-systeme-solaire.net/rest/bodies/";
const SPACEX_API = "https://api.spacexdata.com/v4/launches/latest";

const CATEGORIES = [
  { key: "planets", label: "Planets" },
  { key: "moons", label: "Moons" },
  { key: "missions", label: "Missions" },
  { key: "astronauts", label: "Astronauts" },
  { key: "exoplanets", label: "Exoplanets" },
  { key: "space_weather", label: "Space Weather" },
];

export default function SpaceWikiScreen() {
  const { isDarkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [wikiSummary, setWikiSummary] = useState("");
  const [wikiImage, setWikiImage] = useState(null);
  const [wikiHtml, setWikiHtml] = useState("");
  const [apod, setApod] = useState(null);
  const [error, setError] = useState("");

  const backgroundColor = isDarkMode ? "#000" : "#fff";
  const textColor = isDarkMode ? "#fff" : "#000";
  const inputBackground = isDarkMode ? "#1a1a1a" : "#fff";
  const borderColor = isDarkMode ? "#333" : "#ccc";

  // Fetch NASA APOD for homepage
  useEffect(() => {
    const fetchApod = async () => {
      try {
        const res = await fetch(NASA_APOD_API);
        const data = await res.json();
        setApod(data);
      } catch {}
    };
    fetchApod();
  }, []);

  // Search Wikipedia for multiple space-related articles
  const searchWiki = async (query) => {
    setLoading(true);
    setError("");
    try {
      // Use Wikipedia search API to get multiple results
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const res = await fetch(searchUrl);
      const data = await res.json();
      let articles = data.query?.search || [];
      // Improved space-related filtering
      const spaceKeywords = [
        "planet", "star", "galaxy", "astronomy", "nasa", "moon", "mars", "venus", "jupiter", "saturn", "exoplanet", "cosmos", "solar", "telescope", "asteroid", "comet", "nebula", "rocket", "mission", "orbit", "astronaut", "universe", "satellite", "apollo", "hubble", "spacex", "iss", "cosmic", "lunar", "extraterrestrial", "interstellar", "black hole", "supernova", "quasar", "meteor", "eclipse", "observatory"
      ];
      const nonSpaceTitles = ["Bruno Mars", "Mars (mythology)", "Mars (chocolate)", "Mars, Incorporated", "Mars (band)", "Mars (TV series)", "Mars (film)", "Mars (surname)", "Mars (given name)", "Mars (god)", "Mars (music)", "Mars (album)", "Mars (opera)", "Mars (comics)", "Mars (video game)", "Mars (software)", "Mars (restaurant)", "Mars (car)", "Mars (ship)", "Mars (rocket)", "Mars (satellite)", "Mars (vehicle)", "Mars (company)", "Mars (brand)", "Mars (person)", "Mars (fictional character)"];
      // Fetch summary and image for each article, and filter for space context
      const results = await Promise.all(articles.slice(0, 15).map(async (a) => {
        if (nonSpaceTitles.includes(a.title)) return null;
        try {
          const summaryUrl = WIKI_API + encodeURIComponent(a.title);
          const summaryRes = await fetch(summaryUrl);
          if (!summaryRes.ok) return null;
          const summaryData = await summaryRes.json();
          // Only include if summary/title/description contains a space keyword
          const textToCheck = `${summaryData.title} ${summaryData.extract} ${summaryData.description || ""}`.toLowerCase();
          if (!spaceKeywords.some(kw => textToCheck.includes(kw))) return null;
          return {
            title: summaryData.title,
            summary: summaryData.extract,
            image: summaryData.thumbnail?.source,
            pageid: a.pageid
          };
        } catch {
          return null;
        }
      }));
      setResults(results.filter(r => r));
      if (results.filter(r => r).length === 0) setError("No space-related Wikipedia articles found.");
    } catch (e) {
      setError("No Wikipedia article found.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Solar System bodies for Planets/Moons
  const fetchSolarSystemBodies = async (type) => {
    setLoading(true);
    setError("");
    try {
      const url = SOLAR_SYSTEM_API;
      const res = await fetch(url);
      const data = await res.json();
      let bodies = data.bodies || [];
      if (type === "planets") bodies = bodies.filter(b => b.isPlanet);
      if (type === "moons") bodies = bodies.filter(b => b.aroundPlanet);
      setResults(bodies.map(b => ({ title: b.englishName, summary: b.discoveryDate ? `Discovered: ${b.discoveryDate}` : "", info: b })));
    } catch {
      setError("Failed to fetch solar system data.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch SpaceX latest launch for Missions
  const fetchSpaceXMissions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(SPACEX_API);
      const data = await res.json();
      setResults([{ title: data.name, summary: data.details, image: data.links?.patch?.small }]);
    } catch {
      setError("Failed to fetch SpaceX data.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Exoplanets and format as Wikipedia-style articles
  const fetchExoplanets = async () => {
    setLoading(true);
    setError("");
    try {
      const url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+pl_name,discoverymethod,pl_orbper,pl_masse,pl_rade,pl_orbeccen,pl_orbincl,pl_disc,pl_hostname+from+ps+order+by+pl_name+asc&format=json";
      const res = await fetch(url);
      const data = await res.json();
      setResults(data.map(e => ({
        title: e.pl_name,
        summary: `'''${e.pl_name}''' is an exoplanet discovered by ${e.discoverymethod || "Unknown method"} in ${e.pl_disc || "Unknown year"}. It orbits the star ${e.pl_hostname || "Unknown"} with an orbital period of ${e.pl_orbper || "Unknown"} days. Its mass is ${e.pl_masse || "Unknown"} Earth masses and radius is ${e.pl_rade || "Unknown"} Earth radii.`,
        details: {
          Discovery_Method: e.discoverymethod,
          Discovery_Year: e.pl_disc,
          Host_Star: e.pl_hostname,
          Orbital_Period: e.pl_orbper,
          Mass_Earth: e.pl_masse,
          Radius_Earth: e.pl_rade,
          Eccentricity: e.pl_orbeccen,
          Inclination: e.pl_orbincl
        }
      })));
    } catch {
      setError("Failed to fetch exoplanet data.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle category selection
  const handleCategory = (cat) => {
    setSelectedCategory(cat);
    setSelectedItem(null);
    setResults([]);
    setError("");
    if (cat === "planets" || cat === "moons") fetchSolarSystemBodies(cat);
    if (cat === "missions") fetchSpaceXMissions();
    if (cat === "exoplanets") fetchExoplanets();
    // Astronauts and Space Weather can be added similarly
  };

  // Handle item selection (fetch full Wikipedia HTML article)
  const handleItemSelect = async (item) => {
    setSelectedItem(item);
    setWikiSummary("");
    setWikiImage(null);
    setWikiHtml("");
    setLoading(true);
    try {
      // Fetch summary for fallback image
      const summaryUrl = WIKI_API + encodeURIComponent(item.title);
      const summaryRes = await fetch(summaryUrl);
      let image = null;
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        image = summaryData.thumbnail?.source || null;
      }
      setWikiImage(image);
      // Fetch full HTML content
      const htmlUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(item.title)}`;
      const htmlRes = await fetch(htmlUrl);
      if (!htmlRes.ok) throw new Error("Not found");
      const htmlContent = await htmlRes.text();
      setWikiHtml(htmlContent);
    } catch {
      setWikiHtml("<div style='padding:16px;font-size:18px;color:#c00;'>No Wikipedia article found.</div>");
    } finally {
      setLoading(false);
    }
  };

  // Live search screen: Space Wikipedia title, search bar, and results as cards
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchWiki(searchQuery);
      } else {
        setResults([]);
        setError("");
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  if (!selectedItem) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor, padding: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: textColor, marginBottom: 12, textAlign: "center" }}>
            Space Wikipedia
          </Text>
        </View>
        <TextInput
          style={{
            backgroundColor: inputBackground,
            color: textColor,
            padding: 14,
            borderRadius: 10,
            borderWidth: 1,
            borderColor,
            marginBottom: 18,
            fontSize: 18,
          }}
          placeholder="Search any space topic (e.g. Mars, Hubble, Apollo 11)..."
          placeholderTextColor={isDarkMode ? "#aaa" : "#999"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {loading && <ActivityIndicator size="large" color={textColor} style={{ marginTop: 16 }} />}
        {error ? <Text style={{ color: "red", marginTop: 8 }}>{error}</Text> : null}
        {results.length > 0 && (
          <View style={{ marginTop: 8 }}>
            {results.map((item, idx) => (
              <TouchableOpacity key={idx} onPress={() => handleItemSelect(item)} style={{ marginBottom: 16 }}>
                <View style={{ backgroundColor: inputBackground, borderRadius: 12, padding: 14, borderWidth: 1, borderColor }}>
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: textColor }}>{item.title}</Text>
                  {item.image && <Image source={{ uri: item.image }} style={{ width: "100%", height: 140, borderRadius: 8, marginVertical: 8 }} />}
                  <Text style={{ color: textColor, fontSize: 16 }}>{item.summary}</Text>
                  {/* Exoplanet details as Wikipedia-style infobox */}
                  {item.details && (
                    <View style={{ marginTop: 10, marginBottom: 4, backgroundColor: isDarkMode ? "#222" : "#f5f5f5", borderRadius: 8, padding: 10 }}>
                      <Text style={{ fontWeight: "600", color: textColor, fontSize: 16, marginBottom: 6 }}>Exoplanet Infobox</Text>
                      {Object.entries(item.details).map(([key, value]) => (
                        <View key={key} style={{ marginBottom: 4 }}>
                          <Text style={{ color: textColor, fontWeight: "600" }}>{key.replace(/_/g, " ")}: <Text style={{ fontWeight: "400" }}>{value?.toString() || "Unknown"}</Text></Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  // Category results list
  if (selectedCategory && !selectedItem) {
    return (
      <View style={{ flex: 1, backgroundColor, padding: 16 }}>
        <TouchableOpacity
          style={{ marginBottom: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: isDarkMode ? "#333" : "#e5e5e5", borderRadius: 999, width: 100 }}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={{ color: textColor, textAlign: "center", fontWeight: "600" }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: textColor, marginBottom: 16 }}>{CATEGORIES.find(c => c.key === selectedCategory)?.label}</Text>
        {loading && <ActivityIndicator size="large" color={textColor} style={{ marginTop: 16 }} />}
        {error ? <Text style={{ color: "red", marginTop: 8 }}>{error}</Text> : null}
        <FlatList
          data={results}
          keyExtractor={(item, idx) => idx.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleItemSelect(item)} style={{ marginBottom: 16 }}>
              <View style={{ backgroundColor: inputBackground, borderRadius: 12, padding: 12, borderWidth: 1, borderColor }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: textColor }}>{item.title}</Text>
                <Text style={{ color: textColor }}>{item.summary}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  // Detailed article view
  if (selectedItem) {
    return (
      <View style={{ flex: 1, backgroundColor }}>
        <TouchableOpacity
          style={{ margin: 16, marginBottom: 0, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: isDarkMode ? "#333" : "#e5e5e5", borderRadius: 999, width: 100 }}
          onPress={() => setSelectedItem(null)}
        >
          <Text style={{ color: textColor, textAlign: "center", fontWeight: "600" }}>Back</Text>
        </TouchableOpacity>
        {wikiImage && <Image source={{ uri: wikiImage }} style={{ width: "100%", height: 180, borderRadius: 12, margin: 16, marginBottom: 0 }} />}
        {loading ? (
          <ActivityIndicator size="large" color={textColor} style={{ marginTop: 32 }} />
        ) : (
          <WebView
            originWhitelist={["*"]}
            source={{ html: `
              <html>
                <head>
                  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                  <style>
                    body {
                      background: ${backgroundColor};
                      color: ${textColor};
                      font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
                      padding: 0;
                      margin: 0;
                      font-size: 18px;
                    }
                    .header-bar {
                      background: ${isDarkMode ? '#222' : '#f5f5f5'};
                      color: ${textColor};
                      font-size: 2rem;
                      font-weight: bold;
                      padding: 18px 24px 12px 24px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                      border-bottom: 1px solid ${isDarkMode ? '#333' : '#ddd'};
                      margin-bottom: 0;
                      text-align: center;
                      letter-spacing: 0.5px;
                    }
                    .content {
                      padding: 24px 12px 32px 12px;
                      max-width: 900px;
                      margin: 0 auto;
                    }
                    a { color: #1a73e8; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                    img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin: 12px 0; }
                    h1, h2, h3 { font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; }
                    table { width: 100%; border-collapse: collapse; margin: 18px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
                    th, td { border: 1px solid ${isDarkMode ? '#444' : '#ccc'}; padding: 8px 10px; text-align: left; }
                    th { background: ${isDarkMode ? '#333' : '#e9e9e9'}; font-weight: 600; }
                    .infobox {
                      background: ${isDarkMode ? '#222' : '#f5f5f5'};
                      border-radius: 8px;
                      padding: 14px;
                      margin-bottom: 18px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
                      font-size: 16px;
                    }
                    ul, ol { margin-left: 1.5em; }
                  </style>
                </head>
                <body>
                  <div class="header-bar">${selectedItem.title}</div>
                  <div class="content">${wikiHtml}</div>
                </body>
              </html>
            ` }}
            style={{ flex: 1, minHeight: 600 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    );
  }
}
