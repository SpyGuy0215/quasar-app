// AI.js
import React, {
    useCallback,
    useState,
    useEffect,
    useRef,
    useMemo,
} from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Switch,
    Dimensions,
    Animated,
    ScrollView,
} from "react-native";
import { GiftedChat, InputToolbar } from "react-native-gifted-chat";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import "../global.css";
import Ionicons from "@expo/vector-icons/Ionicons";
import Markdown from "react-native-markdown-display";
import { useTheme } from "../ThemeContext"; // Import useTheme
import Dropdown from "../components/Dropdown"; // Model selection dropdown
import AsyncStorage from "@react-native-async-storage/async-storage";
import { tools, systemPrompt } from "../constants"; // Tool definitions
import { recentNews, searchWikipedia, searchNASAIVL } from "../tools";
import SafeImage from "../components/SafeImage"; // Import SafeImage component
import ImageActionsModal from "../components/ImageActionsModal"; // Import ImageActionsModal
// Tools removed from fetchAIResponse; no imports needed

// Memoized tool toggle box (label + description + switch in one container)
const ToolToggleBox = React.memo(function ToolToggleBox({
    label,
    description,
    value,
    onToggle,
    isDarkMode,
}) {
    const textColor = isDarkMode ? "#fff" : "#000";
    const descColor = isDarkMode ? "#aaa" : "#555";
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onToggle()}
            style={{
                paddingVertical: 12,
                paddingHorizontal: 14,
            }}
            accessibilityRole="switch"
            accessibilityState={{ checked: value }}
            accessibilityLabel={label}
        >
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text
                        style={{
                            fontSize: 15,
                            fontWeight: "600",
                            color: textColor,
                            marginBottom: 4,
                        }}
                        numberOfLines={2}
                    >
                        {label}
                    </Text>
                    <Text
                        style={{
                            fontSize: 13,
                            lineHeight: 17,
                            color: descColor,
                        }}
                    >
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

const ToolsSheet = React.memo(function ToolsSheet({
    isDarkMode,
    toolSettings,
    toggleTool,
    bottomSheetRef,
}) {
    const headerColor = isDarkMode ? "#fff" : "#000";
    return (
        <BottomSheetView
            style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}
        >
            <View
                style={{
                    alignItems: "center",
                    marginBottom: 4,
                    justifyContent: "center",
                }}
            >
                <Text
                    style={{
                        fontSize: 18,
                        fontWeight: "600",
                        color: headerColor,
                    }}
                >
                    Tools
                </Text>
                <TouchableOpacity
                    onPress={() => bottomSheetRef.current?.close()}
                    accessibilityLabel="Close tools"
                    style={{ position: "absolute", right: 0, padding: 4 }}
                >
                    <Ionicons name="close" size={22} color={headerColor} />
                </TouchableOpacity>
            </View>
            <View style={{ height: 8 }} />
            <ToolToggleBox
                label="Wikipedia Search"
                description="Augments answers with information from Wikipedia when relevant."
                value={toolSettings.searchWikipedia}
                onToggle={() => toggleTool("searchWikipedia")}
                isDarkMode={isDarkMode}
            />
            <ToolToggleBox
                label="Recent News"
                description="Pulls the latest space news headlines for up-to-date context."
                value={toolSettings.recentNews}
                onToggle={() => toggleTool("recentNews")}
                isDarkMode={isDarkMode}
            />
            <ToolToggleBox
                label="NASA Image & Video Library"
                description="Search NASA's Image and Video Library for relevant space imagery."
                value={toolSettings.searchNASAIVL}
                onToggle={() => toggleTool("searchNASAIVL")}
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
        },
    };
    const defaultSystemMessage = {
        role: "system",
        content: systemPrompt,
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
        searchWikipedia: true,
        recentNews: true,
        searchNASAIVL: true,
    });
    // Tool usage indicator state
    const [isUsingTool, setIsUsingTool] = useState(false);
    const [currentToolAction, setCurrentToolAction] = useState("");
    const pulseAnim = useRef(new Animated.Value(1)).current;
    
    // Image modal state
    const [modalInfo, setModalInfo] = useState({
        isVisible: false,
        imageUrl: "",
        backupImageUrl: "",
        authorName: "NASA",
        date: "",
        title: "",
    });

    // Pulse animation for tool indicator
    useEffect(() => {
        if (isUsingTool) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.3,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [isUsingTool, pulseAnim]);
    const bottomSheetRef = useRef(null);
    const snapPoints = React.useMemo(() => ["40%", "70%"], []);

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
                    console.log(
                        "[AI] No saved model; defaulting to:",
                        modelOptions[0]
                    );
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
                        searchWikipedia:
                            typeof parsed.searchWikipedia === "boolean"
                                ? parsed.searchWikipedia
                                : prev.searchWikipedia,
                        recentNews:
                            typeof parsed.recentNews === "boolean"
                                ? parsed.recentNews
                                : prev.recentNews,
                        searchNASAIVL:
                            typeof parsed.searchNASAIVL === "boolean"
                                ? parsed.searchNASAIVL
                                : prev.searchNASAIVL,
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
        setToolSettings((prev) => {
            const newValue = !prev[key];
            console.log(key + " is now " + (newValue ? "enabled" : "disabled"));
            return { ...prev, [key]: newValue };
        });
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
            // Format the new user message but do NOT update formattedMsgs yet
            const formattedMsg = {
                role: "user",
                content: msg[0].text,
            };
            // Send only previous messages + new message to the model
            const allMessages = [...formattedMsgs, formattedMsg];
            fetchAIResponse(allMessages);
        },
        [formattedMsgs, isModelReady, model, toolSettings]
    );
    function formatData(msg) {
        // This function is now only used for formatting, not updating state
        return {
            role: "user",
            content: msg[0].text,
        };
    }

    // Separate function to handle API requests with retry logic
    async function sendAPIRequest(requestBody, maxRetries = 5) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[AI] API request attempt ${attempt}/${maxRetries}`);
                
                const response = await fetch(
                    "https://ai.hackclub.com/chat/completions",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(requestBody),
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log(`[AI] API request successful on attempt ${attempt}`);
                return data;
            } catch (error) {
                lastError = error;
                console.warn(`[AI] API request attempt ${attempt} failed:`, error.message);
                
                // Don't retry on the last attempt
                if (attempt === maxRetries) {
                    break;
                }
                
                // Exponential backoff: wait 2^attempt seconds (2s, 4s, 8s, 16s)
                const delayMs = Math.pow(2, attempt) * 1000;
                console.log(`[AI] Retrying in ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        
        console.error(`[AI] API request failed after ${maxRetries} attempts:`, lastError);
        throw lastError;
    }

    async function fetchAIResponse(msgs) {
        try {
            console.log("[Quasar AI] Using model:", model);
            setIsUsingTool(false);
            setCurrentToolAction("");

            // remove turned off tools from the tools dictionary
            let enabledTools = [...tools];

            console.log("TOOL TOGGLE \n---------------------------");
            for (const [key, value] of Object.entries(toolSettings)) {
                console.log(`- ${key}: ${value ? "enabled" : "disabled"}`);
            }

            enabledTools = enabledTools.filter((tool) => {
                const toolName = tool.function.name;
                return toolSettings[toolName] === true;
            });
            console.log("ENABLED TOOLS: \n---------------------------");
            console.log(enabledTools);
            console.log(enabledTools.length + " tools enabled.");

            let requestBody;

            if (enabledTools.length === 0) {
                requestBody = {
                    model: model,
                    messages: msgs,
                };
            }

            else{
                requestBody = {
                    model: model,
                    messages: msgs,
                    tools: enabledTools,
                    tool_choice: "auto",
                };
            }

            // Use the separate API request function
            let data = await sendAPIRequest(requestBody);
            while (data.choices[0].finish_reason === "tool_calls") {
                console.log(
                    "[Quasar AI] Tool call requested:",
                    data.choices[0].message.tool_calls
                );

                setIsUsingTool(true);

                // add AI response to msgs
                console.log(data);
                console.log("finish reason: " + data.choices[0].finish_reason);
                msgs = [
                    ...msgs,
                    {
                        role: data.choices[0].message.role,
                        tool_calls: data.choices[0].message.tool_calls,
                        content: "",
                    },
                ];
                tool_call_id = data.choices[0].message.tool_calls?.[0]?.id;
                let contentStr = "";
                for (let toolCall of data.choices[0].message.tool_calls || []) {
                    console.log(toolCall.function.name);
                    let argsObj = JSON.parse(toolCall.function.arguments);
                    switch (toolCall.function.name) {
                        case "searchWikipedia":
                            console.log("[AI] Calling searchWikipedia()");
                            setCurrentToolAction("Searching Wikipedia...");
                            const wikiReturnVal = await searchWikipedia(
                                argsObj.query
                            );
                            contentStr += wikiReturnVal;
                            break;
                        case "recentNews":
                            console.log("[AI] Calling recentNews()");
                            setCurrentToolAction("Fetching recent news...");
                            // Handle recent news fetch
                            console.log(argsObj);
                            const recentNewsReturnVal = await recentNews(
                                argsObj.publishedAfterTimestamp,
                                argsObj.summaryContainsOne
                            );
                            contentStr += recentNewsReturnVal;
                            break;
                        case "searchNASAIVL":
                            console.log("[AI] Calling searchNASAIVL()");
                            console.log("[AI] argsObj for NASA search:", argsObj);
                            setCurrentToolAction(
                                "Searching NASA Image and Video Library..."
                            );
                            const nasaReturnVal = await searchNASAIVL(
                                argsObj.query
                            );
                            contentStr += nasaReturnVal;
                            break;
                        default:
                            console.warn(
                                "[Quasar AI] Unknown tool call:",
                                toolCall
                            );
                    }
                }
                // add tool response into msgs
                msgs = [
                    ...msgs,
                    {
                        role: "tool",
                        tool_call_id: tool_call_id,
                        content: contentStr,
                    },
                ];


                // Use the separate API request function for tool calls
                data = await sendAPIRequest({
                    model: model,
                    messages: msgs,
                    tools: enabledTools, // assuming if you get here, tools are enabled
                    tool_choice: "auto"
                });
            }
            console.log("[Quasar AI] Final response data:", data);

            // Clear tool usage indicators
            setIsUsingTool(false);
            setCurrentToolAction("");

            const responseText = data?.choices?.[0]?.message?.content || "";
            const messageText = responseText
                .replace(/<think>[\s\S]*?<\/think>/gi, "")
                .trim();

            let botMsg = {
                _id: Math.random().toString(36).substring(7),
                text: messageText || "I don't know how to respond to that.",
                createdAt: new Date(),
                user: {
                    _id: 2,
                    name: "Quasar AI",
                },
            };
            setMessages((previousMessages) =>
                GiftedChat.append(previousMessages, botMsg)
            );
            setFormattedMsgs((previousMessages) =>
                GiftedChat.append(previousMessages, [
                    { role: "system", content: responseText },
                ])
            );
        } catch (error) {
            console.error("Error fetching or setting AI response:", error);

            // Clear tool usage indicators on error
            setIsUsingTool(false);
            setCurrentToolAction("");

            setMessages((prev) =>
                GiftedChat.append(prev, [
                    {
                        _id: Math.random().toString(36).substring(7),
                        text:
                            "Error: failed to get response. " +
                            (error.message || ""),
                        createdAt: new Date(),
                        user: {
                            _id: 2,
                            name: "Quasar AI",
                            avatar: require("../assets/quasar-ai-pfp.png"),
                        },
                    },
                ])
            );
        }
    }

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: isDarkMode ? "#000" : "#fff",
                paddingBottom: 60,
                paddingHorizontal: 5,
            }}
        >
            <ImageActionsModal
                isVisible={modalInfo.isVisible}
                onClose={() => setModalInfo({ ...modalInfo, isVisible: false })}
                imageUrl={modalInfo.imageUrl}
                backupImageUrl={modalInfo.backupImageUrl}
                authorName={modalInfo.authorName}
                date={modalInfo.date}
                title={modalInfo.title}
            />
            <BottomSheetModal
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose
                backgroundStyle={{
                    backgroundColor: isDarkMode ? "#111" : "#fafafa",
                }}
                handleIndicatorStyle={{
                    backgroundColor: isDarkMode ? "#444" : "#999",
                }}
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
                    paddingHorizontal: 5,
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

            {/* Tool Usage Indicator */}
            {isUsingTool && (
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        marginBottom: 8,
                        backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isDarkMode ? "#333" : "#e0e0e0",
                    }}
                >
                    <Animated.View
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#3b82f6",
                            marginRight: 8,
                            opacity: pulseAnim,
                        }}
                    />
                    <Text
                        style={{
                            fontSize: 14,
                            color: isDarkMode ? "#ccc" : "#666",
                            fontWeight: "500",
                        }}
                    >
                        {currentToolAction || "Using tools..."}
                    </Text>
                </View>
            )}

            {useMemo(
                () => (
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
                                    backgroundColor: isDarkMode
                                        ? "#000"
                                        : "#fff",
                                    borderTopWidth: 0,
                                }}
                            />
                        )}
                        renderAvatar={null}
                        renderBubble={(props) => {
                            const isUser = props.currentMessage.user._id === 1;
                            return (
                                <View
                                    style={{
                                        backgroundColor: isUser
                                            ? isDarkMode
                                                ? "#23272f"
                                                : "#f3f4f6"
                                            : isDarkMode
                                            ? "#18181b"
                                            : "#f9fafb",
                                        padding: 5,
                                        borderRadius: 20,
                                        marginBottom: 5,
                                        maxWidth: isUser ? "85%" : "100%",
                                        width: isUser ? "auto" : "100%",
                                        alignSelf: isUser
                                            ? "flex-end"
                                            : "flex-start",
                                    }}
                                >
                                    <Markdown
                                        rules={{
                                            image: (node, children, parent, styles) => {
                                                const rawImageUrl = node.attributes.src;
                                                const altText = node.attributes.alt || "";
                                                
                                                // Clean and decode the URL to handle any encoding issues
                                                const cleanURL = (url) => {
                                                    if (!url) return url;
                                                    
                                                    try {
                                                        // Decode URL-encoded characters
                                                        let cleanedUrl = decodeURIComponent(url);
                                                        
                                                        // Remove any surrounding brackets that might have been encoded
                                                        cleanedUrl = cleanedUrl.replace(/^\[/, '').replace(/\]$/, '');
                                                        
                                                        // Handle markdown link format [text](url) - extract just the URL
                                                        const markdownLinkMatch = cleanedUrl.match(/\[.*?\]\((.*?)\)/);
                                                        if (markdownLinkMatch) {
                                                            cleanedUrl = markdownLinkMatch[1];
                                                        }
                                                        
                                                        return cleanedUrl;
                                                    } catch (error) {
                                                        console.warn("[AI] Error cleaning URL:", error);
                                                        return url; // Return original if cleaning fails
                                                    }
                                                };
                                                
                                                const imageUrl = cleanURL(rawImageUrl);
                                                console.log("[AI] Raw image URL:", rawImageUrl);
                                                console.log("[AI] Cleaned image URL:", imageUrl);
                                                
                                                // Try to extract NASA ID from URL for better metadata
                                                let nasaId = "";
                                                let authorName = "NASA";
                                                let imageTitle = altText || "NASA Image";
                                                
                                                // Check if this is a NASA image URL
                                                if (imageUrl && imageUrl.includes('images-assets.nasa.gov')) {
                                                    const urlParts = imageUrl.split('/');
                                                    if (urlParts.length > 0) {
                                                        const filename = urlParts[urlParts.length - 1];
                                                        nasaId = filename.split('~')[0] || filename.split('.')[0];
                                                    }
                                                }
                                                
                                                return (
                                                    <TouchableOpacity 
                                                        key={node.key} 
                                                        style={{ marginVertical: 8 }}
                                                        activeOpacity={0.8}
                                                        onPress={() => {
                                                            setModalInfo({
                                                                isVisible: true,
                                                                imageUrl: imageUrl,
                                                                backupImageUrl: "https://placehold.co/800x600?text=Image+Not+Available",
                                                                authorName: authorName,
                                                                date: new Date().toLocaleDateString(),
                                                                title: imageTitle,
                                                            });
                                                        }}
                                                    >
                                                        <SafeImage
                                                            defaultURL={imageUrl}
                                                            backupURL="https://placehold.co/300x200?text=Image+Not+Available"
                                                            style={{
                                                                width: '100%',
                                                                height: 200,
                                                                borderRadius: 8,
                                                                marginBottom: 4
                                                            }}
                                                            resizeMode="cover"
                                                        />
                                                        {altText && (
                                                            <Text style={{
                                                                fontSize: 14,
                                                                fontStyle: 'italic',
                                                                color: isDarkMode ? "#aaa" : "#666",
                                                                textAlign: 'center',
                                                                paddingHorizontal: 8
                                                            }}>
                                                                {altText}
                                                            </Text>
                                                        )}
                                                        <Text style={{
                                                            fontSize: 12,
                                                            color: isDarkMode ? "#888" : "#999",
                                                            textAlign: 'center',
                                                            paddingHorizontal: 8,
                                                            marginTop: 4
                                                        }}>
                                                            Tap to download
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            },
                                            table: (node, children, parent, styles) => {
                                                // Count columns from the first row to set consistent widths
                                                const firstRow = node.children.find(child => child.type === 'thead' || child.type === 'tbody')?.children[0];
                                                const columnCount = firstRow?.children?.length || 3;
                                                const columnWidth = Math.max(120, 300 / columnCount);
                                                
                                                return (
                                                    <ScrollView 
                                                        horizontal 
                                                        showsHorizontalScrollIndicator={true}
                                                        style={{ marginVertical: 12 }}
                                                    >
                                                        <View style={{
                                                            borderWidth: 1,
                                                            borderColor: isDarkMode ? '#444' : '#ccc',
                                                            borderRadius: 8,
                                                            overflow: 'hidden',
                                                            minWidth: columnWidth * columnCount
                                                        }}>
                                                            {children}
                                                        </View>
                                                    </ScrollView>
                                                );
                                            },
                                            thead: (node, children, parent, styles) => (
                                                <View style={{ flexDirection: 'column' }}>
                                                    {children}
                                                </View>
                                            ),
                                            tbody: (node, children, parent, styles) => (
                                                <View style={{ flexDirection: 'column' }}>
                                                    {children}
                                                </View>
                                            ),
                                            tr: (node, children, parent, styles) => {
                                                const isHeader = parent.type === 'thead';
                                                const firstRow = node.parent?.parent?.children.find(child => child.type === 'thead' || child.type === 'tbody')?.children[0];
                                                const columnCount = firstRow?.children?.length || children.length;
                                                const columnWidth = Math.max(120, 300 / columnCount);
                                                
                                                return (
                                                    <View style={{ 
                                                        flexDirection: 'row',
                                                        backgroundColor: isHeader ? (isDarkMode ? '#333' : '#e9e9e9') : 'transparent'
                                                    }}>
                                                        {children.map((child, index) => (
                                                            <View key={index} style={{ 
                                                                width: columnWidth, 
                                                                minWidth: columnWidth,
                                                                maxWidth: columnWidth
                                                            }}>
                                                                {child}
                                                            </View>
                                                        ))}
                                                    </View>
                                                );
                                            }
                                        }}
                                        style={{
                                            body: {
                                                color: isDarkMode
                                                    ? "#e5e7eb"
                                                    : "#222",
                                                backgroundColor: isUser
                                                    ? isDarkMode
                                                        ? "#23272f"
                                                        : "#f3f4f6"
                                                    : isDarkMode
                                                    ? "#18181b"
                                                    : "#f9fafb",
                                                fontSize: 17,
                                                lineHeight: 28,
                                                letterSpacing: 0.2,
                                                borderRadius: 14,
                                                paddingVertical: 8,
                                                paddingHorizontal: 10,
                                            },
                                            heading1: {
                                                fontSize: 24,
                                                fontWeight: "700",
                                                marginBottom: 10,
                                                color: isDarkMode
                                                    ? "#e5e7eb"
                                                    : "#222",
                                            },
                                            heading2: {
                                                fontSize: 20,
                                                fontWeight: "700",
                                                marginBottom: 8,
                                                color: isDarkMode
                                                    ? "#e5e7eb"
                                                    : "#222",
                                            },
                                            heading3: {
                                                fontSize: 18,
                                                fontWeight: "600",
                                                marginBottom: 6,
                                                color: isDarkMode
                                                    ? "#e5e7eb"
                                                    : "#222",
                                            },
                                            paragraph: {
                                                marginBottom: 12,
                                                lineHeight: 28,
                                                letterSpacing: 0.2,
                                            },
                                            list_item: {
                                                fontSize: 17,
                                                color: isDarkMode
                                                    ? "#e5e7eb"
                                                    : "#222",
                                                marginBottom: 10,
                                                lineHeight: 28,
                                                letterSpacing: 0.2,
                                            },
                                            link: {
                                                color: "#3b82f6",
                                                textDecorationLine: "underline",
                                            },
                                            fence: {
                                                backgroundColor: isDarkMode
                                                    ? "#23272f"
                                                    : "#f3f4f6",
                                                padding: 12,
                                                color: isDarkMode
                                                    ? "#e5e7eb"
                                                    : "#222",
                                                borderRadius: 8,
                                                fontFamily: "monospace",
                                                fontSize: 15,
                                            },
                                            blockquote: {
                                                borderLeftWidth: 4,
                                                borderLeftColor: "#3b82f6",
                                                backgroundColor: isDarkMode
                                                    ? "#18181b"
                                                    : "#f1f5f9",
                                                paddingLeft: 12,
                                                marginBottom: 8,
                                            },
                                            table: {
                                                borderCollapse: 'collapse',
                                                width: '100%',
                                            },
                                            thead: {
                                                backgroundColor: 'transparent',
                                            },
                                            tbody: {
                                                backgroundColor: 'transparent',
                                            },
                                            th: {
                                                borderWidth: 1,
                                                borderColor: isDarkMode ? '#444' : '#ccc',
                                                padding: 8,
                                                textAlign: 'left',
                                                fontWeight: '600',
                                                backgroundColor: isDarkMode ? '#333' : '#e9e9e9',
                                                color: isDarkMode ? "#e5e7eb" : "#222",
                                                fontSize: 14,
                                                flex: 1,
                                            },
                                            td: {
                                                borderWidth: 1,
                                                borderColor: isDarkMode ? '#444' : '#ccc',
                                                padding: 8,
                                                textAlign: 'left',
                                                color: isDarkMode ? "#e5e7eb" : "#222",
                                                fontSize: 14,
                                                flex: 1,
                                            },
                                        }}
                                    >
                                        {props.currentMessage.text}
                                    </Markdown>
                                </View>
                            );
                        }}
                    />
                ),
                [messages, isDarkMode, onSend]
            )}
        </View>
    );
}
