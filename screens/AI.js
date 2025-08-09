// AI.js
import React, { useCallback, useState, useEffect, useRef, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Switch,
    Dimensions,
} from "react-native";
import { GiftedChat, InputToolbar } from "react-native-gifted-chat";
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import "../global.css";
import Ionicons from "@expo/vector-icons/Ionicons";
import Markdown from "react-native-markdown-display";
import { useTheme } from "../ThemeContext"; // Import useTheme
import Dropdown from "../components/Dropdown"; // Model selection dropdown
import AsyncStorage from "@react-native-async-storage/async-storage";
// Tools removed from fetchAIResponse; no imports needed

// Memoized tool toggle box (label + description + switch in one container)
const ToolToggleBox = React.memo(function ToolToggleBox({ label, description, value, onToggle, isDarkMode }) {
    const textColor = isDarkMode ? '#fff' : '#000';
    const descColor = isDarkMode ? '#aaa' : '#555';
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onToggle()}
            style={{
                paddingVertical: 12,
                paddingHorizontal: 14
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: value }}
            accessibilityLabel={label}
        >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: textColor, marginBottom: 4 }} numberOfLines={2}>
                        {label}
                    </Text>
                    <Text style={{ fontSize: 13, lineHeight: 17, color: descColor }}>
                        {description}
                    </Text>
                </View>
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    style={{ marginTop: 2 }}
                />
            </View>
        </TouchableOpacity>
    );
});

const ToolsSheet = React.memo(function ToolsSheet({ isDarkMode, toolSettings, toggleTool, bottomSheetRef }) {
    const headerColor = isDarkMode ? '#fff' : '#000';
    return (
        <BottomSheetView style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}>
            <View style={{ alignItems: 'center', marginBottom: 4, justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: headerColor }}>Tools</Text>
                <TouchableOpacity
                    onPress={() => bottomSheetRef.current?.close()}
                    accessibilityLabel="Close tools"
                    style={{ position: 'absolute', right: 0, padding: 4 }}
                >
                    <Ionicons name="close" size={22} color={headerColor} />
                </TouchableOpacity>
            </View>
            <View style={{ height: 8 }} />
            <ToolToggleBox
                label="Wikipedia Search"
                description="Augments answers with information from Wikipedia when relevant."
                value={toolSettings.wikipediaSearch}
                onToggle={() => toggleTool('wikipediaSearch')}
                isDarkMode={isDarkMode}
            />
            <ToolToggleBox
                label="Recent News"
                description="Pulls the latest space news headlines for up-to-date context."
                value={toolSettings.recentNews}
                onToggle={() => toggleTool('recentNews')}
                isDarkMode={isDarkMode}
            />
        </BottomSheetView>
    );
});

export default function AI() {
    const { isDarkMode } = useTheme(); // Get dark mode value from context

    // Constants
    const defaultBotMessage = {
        _id: 1,
        text: "Hello! How may I answer your questions about space?",
        createdAt: new Date(),
        user: {
            _id: 2,
            name: "Quasar AI",
            avatar: require("../assets/quasar-ai-pfp.png"), // Ensure the path is correct
        },
    };
    const defaultSystemMessage = {
        role: "system",
        content:
            "You are a helpful assistant that answers questions about space. You are part of a mobile app called Quasar. You are friendly, concise, and informative. You just said 'how may I answer your questions about space?' Generally, only respond to the last statement or question from the user. Don't use previous context unless you need to, because the way the data is formatted for you, you oftentimes don't see that you have already responded. No emojis, no emojis, and most importantly, no emojis. Be serious, and try to keep your answers succinct. Don't use tables unless absolutely necessary.",
    };
    const modelOptions = [
        // Put your preferred default first so initial render uses it if no saved value exists
        "openai/gpt-oss-120b",
        "qwen/qwen3-32b",
        "openai/gpt-oss-20b",
    ];

    // State & refs
    const [messages, setMessages] = useState([defaultBotMessage]);
    const [formattedMsgs, setFormattedMsgs] = useState([defaultSystemMessage]);
    // Delay model initialization until we check persisted storage; fallback to first option
    const [model, setModel] = useState(null);
    const [isModelReady, setIsModelReady] = useState(false);
    const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
    const [toolSettings, setToolSettings] = useState({
        wikipediaSearch: false,
        recentNews: false,
    });
    const bottomSheetRef = useRef(null);
    const snapPoints = React.useMemo(() => ['40%', '70%'], []);

    // Model persistence
    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem("selectedModel");
                if (stored && modelOptions.includes(stored)) {
                    setModel(stored);
                    console.log("[AI] Loaded saved model:", stored);
                } else {
                    // No saved value or invalid — use preferred default
                    setModel(modelOptions[0]);
                    console.log("[AI] No saved model; defaulting to:", modelOptions[0]);
                }
            } catch (e) {
                console.warn("Failed to load saved model", e);
                // On error, still set a sane default so UI remains usable
                setModel(modelOptions[0]);
            } finally {
                setIsModelReady(true);
            }
        })();
    }, []);
    useEffect(() => {
        if (!isModelReady || !model) return; // avoid saving null/initial during boot
        (async () => {
            try {
                await AsyncStorage.setItem("selectedModel", model);
            } catch (e) {
                console.warn("Failed to save model", e);
            }
        })();
    }, [model, isModelReady]);

    // Tool setting persistence
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem("toolSettings");
                if (raw) {
                    const parsed = JSON.parse(raw);
                    setToolSettings((prev) => ({
                        wikipediaSearch:
                            typeof parsed.wikipediaSearch === "boolean"
                                ? parsed.wikipediaSearch
                                : prev.wikipediaSearch,
                        recentNews:
                            typeof parsed.recentNews === "boolean"
                                ? parsed.recentNews
                                : prev.recentNews,
                    }));
                }
            } catch (e) {
                console.warn("[AI] Failed to load tool settings", e);
            }
        })();
    }, []);
    useEffect(() => {
        (async () => {
            try {
                await AsyncStorage.setItem(
                    "toolSettings",
                    JSON.stringify(toolSettings)
                );
            } catch (e) {
                console.warn("[AI] Failed to save tool settings", e);
            }
        })();
    }, [toolSettings]);

    // Callbacks & helper functions
    const toggleTool = useCallback((key) => {
        console.log("[AI] Toggling tool:", key);
        setToolSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);
    const resetChat = () => {
        setMessages([defaultBotMessage]);
        setFormattedMsgs([defaultSystemMessage]);
    };
    const onSend = useCallback(
        (msg = []) => {
            if (!isModelReady || !model) {
                console.warn("[AI] Model not ready yet; ignoring send.");
                return;
            }
            setMessages((previousMessages) =>
                GiftedChat.append(previousMessages, msg)
            );
            const formattedMsg = [formatData(msg)];
            setFormattedMsgs((previousMessages) =>
                GiftedChat.append(previousMessages, formattedMsg)
            );
            const allMessages = [...formattedMsgs, ...formattedMsg];
            fetchAIResponse(allMessages);
        },
        [formattedMsgs, isModelReady, model]
    );
    function formatData(msg) {
        const formattedMsg = {
            role: "user",
            content: msg[0].text,
        };
        setFormattedMsgs((prevMsgs) => [...prevMsgs, formattedMsg]);
        return formattedMsg;
    }
    async function fetchAIResponse(msgs) {
        console.log("Fetching AI response with messages:", msgs);
        try {
            console.log("[Quasar AI] Using model:", model);

            const response = await fetch("https://ai.hackclub.com/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: model, messages: msgs })
            });
            const data = await response.json();
            const responseText = data?.choices?.[0]?.message?.content || '';
            const messageText = responseText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

            let botMsg = {
                _id: Math.random().toString(36).substring(7),
                text: messageText || "I don't know how to respond to that.",
                createdAt: new Date(),
                user: {
                    _id: 2,
                    name: "Quasar AI",
                    avatar: require("../assets/quasar-ai-pfp.png"),
                },
            };
            setMessages((previousMessages) => GiftedChat.append(previousMessages, botMsg));
            setFormattedMsgs((previousMessages) => GiftedChat.append(previousMessages, [ { role: "system", content: responseText } ]));
        } catch (error) {
            console.error("Error fetching or setting AI response:", error);
            setMessages(prev => GiftedChat.append(prev, [{
                _id: Math.random().toString(36).substring(7),
                text: 'Error: failed to get response. ' + (error.message || ''),
                createdAt: new Date(),
                user: { _id: 2, name: 'Quasar AI', avatar: require('../assets/quasar-ai-pfp.png') }
            }]));
        }
    }

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: isDarkMode ? "#000" : "#fff",
                paddingBottom: 60,
                paddingHorizontal: 10
            }}
        >
            <BottomSheetModal
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: isDarkMode ? '#111' : '#fafafa' }}
                handleIndicatorStyle={{ backgroundColor: isDarkMode ? '#444' : '#999' }}
                onDismiss={() => setIsToolsModalOpen(false)}
            >
                <ToolsSheet
                    isDarkMode={isDarkMode}
                    toolSettings={toolSettings}
                    toggleTool={toggleTool}
                    bottomSheetRef={bottomSheetRef}
                />
            </BottomSheetModal>
            {/* Top Controls: Model dropdown + inline icon buttons */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 12,
                    marginBottom: 4,
                }}
            >
                <View style={{ flex: 1, paddingRight: 8 }}>
                    <Dropdown
                        items={modelOptions}
                        selectedItem={model ?? modelOptions[0]}
                        onSelect={(m) => setModel(m)}
                        tailwindStyles="mb-2 mt-1"
                    />
                </View>
                <TouchableOpacity
                    onPress={() => {
                        if (!isToolsModalOpen) {
                            bottomSheetRef.current?.present();
                            setIsToolsModalOpen(true);
                        } else {
                            bottomSheetRef.current?.dismiss();
                        }
                    }}
                    style={{
                        width: 48,
                        height: 48,
                        marginTop: 4,
                        marginBottom: 8,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: isDarkMode ? "#222" : "#ccc",
                        backgroundColor: isDarkMode ? "#111" : "#eee",
                        marginRight: 8,
                    }}
                    accessibilityLabel="Open Tools"
                >
                    <Ionicons
                        name="construct"
                        size={22}
                        color={isDarkMode ? "#fff" : "#000"}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={resetChat}
                    style={{
                        width: 48,
                        height: 48,
                        marginTop: 4,
                        marginBottom: 8,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: isDarkMode ? "#222" : "#ccc",
                        backgroundColor: isDarkMode ? "#111" : "#eee",
                    }}
                    accessibilityLabel="Reset Chat"
                >
                    <Ionicons
                        name="refresh"
                        size={22}
                        color={isDarkMode ? "#fff" : "#000"}
                    />
                </TouchableOpacity>
            </View>
            {useMemo(() => (
                <GiftedChat
                    messages={messages}
                    key={isDarkMode ? "dark" : "light"}
                    onSend={onSend}
                    user={{
                        _id: 1,
                        name: "User",
                        avatar: "https://placeimg.com/140/140/any",
                    }}
                    renderUsernameOnMessage
                    placeholder="Type a message about the cosmos..."
                    textInputStyle={{
                        backgroundColor: isDarkMode ? "#333" : "#ddd",
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 12,
                        fontSize: 16,
                        color: isDarkMode ? "#fff" : "#000",
                        borderWidth: 1,
                        borderColor: isDarkMode ? "#555" : "#ccc",
                        minHeight: 50,
                    }}
                    renderInputToolbar={(props) => (
                        <InputToolbar
                            {...props}
                            containerStyle={{
                                backgroundColor: isDarkMode ? "#000" : "#fff",
                                borderTopWidth: 0,
                            }}
                        />
                    )}
                    renderBubble={(props) => {
                        const isUser = props.currentMessage.user._id === 1;
                        return (
                            <View
                                style={{
                                    backgroundColor: isUser
                                        ? isDarkMode
                                            ? "#444"
                                            : "#ccc"
                                        : isDarkMode
                                        ? "#222"
                                        : "#eee",
                                    padding: 10,
                                    borderRadius: 10,
                                    marginBottom: 5,
                                    maxWidth: "85%",
                                    alignSelf: isUser ? "flex-end" : "flex-start",
                                }}
                            >
                                <Markdown
                                    style={{
                                        body: {
                                            color: isDarkMode ? "#fff" : "#000",
                                            fontSize: 16,
                                            backgroundColor: isUser
                                                ? isDarkMode
                                                    ? "#444"
                                                    : "#ccc"
                                                : isDarkMode
                                                ? "#222"
                                                : "#eee",
                                        },
                                        fence: {
                                            backgroundColor: isDarkMode
                                                ? "#000"
                                                : "#fff",
                                            padding: 10,
                                            color: isDarkMode ? "#fff" : "#000",
                                            borderRadius: 5,
                                        },
                                    }}
                                >
                                    {props.currentMessage.text}
                                </Markdown>
                            </View>
                        );
                    }}
                />
            ), [messages, isDarkMode, onSend])}
        </View>
    );
}
