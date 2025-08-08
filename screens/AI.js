// AI.js
import React, { useCallback, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput, FlatList } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GiftedChat, InputToolbar } from "react-native-gifted-chat";
import "../global.css";
import Ionicons from "@expo/vector-icons/Ionicons";
import Markdown from "react-native-markdown-display";
import { useTheme } from "../ThemeContext"; // Import useTheme

export default function AI() {
    const { isDarkMode } = useTheme();

    // Default chat template
    const defaultBotMessage = {
        _id: 1,
        text: "Hello! How may I answer your questions about space?",
        createdAt: new Date(),
        user: {
            _id: 2,
            name: "Quasar AI",
            avatar: require("../assets/quasar-ai-pfp.png"),
        },
    };
    const defaultSystemMessage = {
        role: "system",
        content:
            "You are a helpful assistant that answers questions about space. You are part of a mobile app called Quasar. You are friendly, concise, and informative. You just said 'how may I answer your questions about space?' Generally, only respond to the last statement or question from the user. Don't use previous context unless you need to, because the way the data is formatted for you, you oftentimes don't see that you have already responded. No emojis, no emojis, and most importantly, no emojis. Be serious",
    };

    // Chat management state
    const [chats, setChats] = useState([
        {
            id: 1,
            name: "Chat 1",
            messages: [defaultBotMessage],
            formattedMsgs: [defaultSystemMessage],
        },
    ]);
    const [currentChatId, setCurrentChatId] = useState(1);

    // Load chats and currentChatId from AsyncStorage on mount
    useEffect(() => {
        (async () => {
            try {
                const savedChats = await AsyncStorage.getItem('quasar_chats');
                const savedChatId = await AsyncStorage.getItem('quasar_currentChatId');
                if (savedChats) {
                    setChats(JSON.parse(savedChats));
                }
                if (savedChatId) {
                    setCurrentChatId(Number(savedChatId));
                }
            } catch (e) {
                // ignore
            }
        })();
    }, []);

    // Save chats and currentChatId to AsyncStorage whenever they change
    useEffect(() => {
        AsyncStorage.setItem('quasar_chats', JSON.stringify(chats));
    }, [chats]);
    useEffect(() => {
        AsyncStorage.setItem('quasar_currentChatId', String(currentChatId));
    }, [currentChatId]);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [renameModalVisible, setRenameModalVisible] = useState(false);
    const [newChatModalVisible, setNewChatModalVisible] = useState(false);
    const [chatNameInput, setChatNameInput] = useState("");
    const [chatToRename, setChatToRename] = useState(null);

    // Get current chat object
    const currentChat = chats.find((c) => c.id === currentChatId) || chats[0];
    const messages = currentChat.messages;
    const formattedMsgs = currentChat.formattedMsgs;

    // Reset current chat
    const resetChat = () => {
        setChats((prev) =>
            prev.map((c) =>
                c.id === currentChatId
                    ? { ...c, messages: [defaultBotMessage], formattedMsgs: [defaultSystemMessage] }
                    : c
            )
        );
    };

    // Add new chat
    const addChat = (name) => {
        const newId = Math.max(...chats.map((c) => c.id)) + 1;
        const newChat = {
            id: newId,
            name: name || `Chat ${newId}`,
            messages: [defaultBotMessage],
            formattedMsgs: [defaultSystemMessage],
        };
        setChats((prev) => [...prev, newChat]);
        setCurrentChatId(newId);
    };

    // Rename chat
    const renameChat = (id, newName) => {
        setChats((prev) => prev.map((c) => (c.id === id ? { ...c, name: newName } : c)));
    };

    // Delete chat
    const deleteChat = (id) => {
        let filtered = chats.filter((c) => c.id !== id);
        if (filtered.length === 0) {
            // Always keep at least one chat
            filtered = [
                {
                    id: 1,
                    name: "Chat 1",
                    messages: [defaultBotMessage],
                    formattedMsgs: [defaultSystemMessage],
                },
            ];
        }
        setChats(filtered);
        setCurrentChatId(filtered[0].id);
    };

    const onSend = useCallback(
        (msg = []) => {
            setChats((prev) =>
                prev.map((c) =>
                    c.id === currentChatId
                        ? {
                              ...c,
                              messages: GiftedChat.append(c.messages, msg),
                              formattedMsgs: GiftedChat.append(
                                  c.formattedMsgs,
                                  [formatData(msg)]
                              ),
                          }
                        : c
                )
            );
            const formattedMsg = [formatData(msg)];
            const allMessages = [...formattedMsgs, ...formattedMsg];
            fetchAIResponse(allMessages);
        },
        [formattedMsgs, currentChatId]
    );

    function formatData(msg) {
        return {
            role: "user",
            content: msg[0].text,
        };
    }

    async function fetchAIResponse(msgs) {
        try {
            const response = await fetch(
                "https://ai.hackclub.com/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ messages: msgs }),
                }
            );
            const data = await response.json();
            const responseText = data.choices[0].message.content;
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
                    avatar: require("../assets/quasar-ai-pfp.png"),
                },
            };
            setChats((prev) =>
                prev.map((c) =>
                    c.id === currentChatId
                        ? {
                              ...c,
                              messages: GiftedChat.append(c.messages, botMsg),
                              formattedMsgs: GiftedChat.append(
                                  c.formattedMsgs,
                                  [
                                      {
                                          role: "system",
                                          content: data.choices[0].message.content,
                                      },
                                  ]
                              ),
                          }
                        : c
                )
            );
        } catch (error) {
            console.error("Error fetching or setting AI response:", error);
        }
    }

    return (
        <View
            style={{
                flex: 1,
                paddingBottom: 60,
                paddingHorizontal: 10,
                backgroundColor: isDarkMode ? "#000" : "#fff",
            }}
        >
            {/* Dropdown menu for chat management */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 10 }}>
                <TouchableOpacity
                    onPress={() => setDropdownVisible(true)}
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: isDarkMode ? "#222" : "#eee",
                        borderRadius: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        marginRight: 10,
                    }}
                >
                    <Text style={{ color: isDarkMode ? "#fff" : "#000", fontWeight: "bold", fontSize: 16, marginRight: 8 }}>
                        {currentChat.name}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={isDarkMode ? "#fff" : "#000"} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={resetChat}
                    style={{
                        padding: 10,
                        borderRadius: 50,
                        backgroundColor: isDarkMode ? "#fff" : "#000",
                    }}
                >
                    <Ionicons
                        name="refresh"
                        size={24}
                        color={isDarkMode ? "#000" : "#fff"}
                    />
                </TouchableOpacity>
            </View>

            {/* Dropdown Modal */}
            <Modal
                visible={dropdownVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDropdownVisible(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
                    activeOpacity={1}
                    onPress={() => setDropdownVisible(false)}
                >
                    <View style={{ position: "absolute", top: 60, left: 20, right: 20, backgroundColor: isDarkMode ? "#222" : "#fff", borderRadius: 12, padding: 12, elevation: 5 }}>
                        <FlatList
                            data={chats}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                    <TouchableOpacity
                                        style={{ flex: 1, paddingVertical: 8 }}
                                        onPress={() => {
                                            setCurrentChatId(item.id);
                                            setDropdownVisible(false);
                                        }}
                                    >
                                        <Text style={{ color: isDarkMode ? "#fff" : "#000", fontWeight: item.id === currentChatId ? "bold" : "normal", fontSize: 16 }}>{item.name}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setChatToRename(item);
                                            setChatNameInput(item.name);
                                            setRenameModalVisible(true);
                                            setDropdownVisible(false);
                                        }}
                                        style={{ marginHorizontal: 6 }}
                                    >
                                        <Ionicons name="pencil" size={18} color={isDarkMode ? "#fff" : "#000"} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            deleteChat(item.id);
                                            setDropdownVisible(false);
                                        }}
                                        style={{ marginHorizontal: 6 }}
                                        disabled={chats.length === 1}
                                    >
                                        <Ionicons name="trash" size={18} color={chats.length === 1 ? (isDarkMode ? "#555" : "#ccc") : (isDarkMode ? "#fff" : "#000")} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                        <TouchableOpacity
                            style={{ marginTop: 10, flexDirection: "row", alignItems: "center" }}
                            onPress={() => {
                                setNewChatModalVisible(true);
                                setDropdownVisible(false);
                            }}
                        >
                            <Ionicons name="add-circle" size={20} color="#2196f3" style={{ marginRight: 6 }} />
                            <Text style={{ color: "#2196f3", fontWeight: "bold", fontSize: 16 }}>New Chat</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Rename Chat Modal */}
            <Modal
                visible={renameModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setRenameModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }}>
                    <View style={{ backgroundColor: isDarkMode ? "#222" : "#fff", borderRadius: 12, padding: 20, width: 300 }}>
                        <Text style={{ color: isDarkMode ? "#fff" : "#000", fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>Rename Chat</Text>
                        <TextInput
                            value={chatNameInput}
                            onChangeText={setChatNameInput}
                            style={{ backgroundColor: isDarkMode ? "#333" : "#eee", color: isDarkMode ? "#fff" : "#000", borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 16 }}
                            autoFocus
                        />
                        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                            <TouchableOpacity onPress={() => setRenameModalVisible(false)} style={{ marginRight: 16 }}>
                                <Text style={{ color: "#888", fontSize: 16 }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (chatToRename && chatNameInput.trim()) {
                                        renameChat(chatToRename.id, chatNameInput.trim());
                                    }
                                    setRenameModalVisible(false);
                                }}
                            >
                                <Text style={{ color: "#2196f3", fontWeight: "bold", fontSize: 16 }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* New Chat Modal */}
            <Modal
                visible={newChatModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setNewChatModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }}>
                    <View style={{ backgroundColor: isDarkMode ? "#222" : "#fff", borderRadius: 12, padding: 20, width: 300 }}>
                        <Text style={{ color: isDarkMode ? "#fff" : "#000", fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>New Chat</Text>
                        <TextInput
                            value={chatNameInput}
                            onChangeText={setChatNameInput}
                            style={{ backgroundColor: isDarkMode ? "#333" : "#eee", color: isDarkMode ? "#fff" : "#000", borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 16 }}
                            placeholder="Chat name"
                            autoFocus
                        />
                        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                            <TouchableOpacity onPress={() => setNewChatModalVisible(false)} style={{ marginRight: 16 }}>
                                <Text style={{ color: "#888", fontSize: 16 }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (chatNameInput.trim()) {
                                        addChat(chatNameInput.trim());
                                        setChatNameInput("");
                                    }
                                    setNewChatModalVisible(false);
                                }}
                            >
                                <Text style={{ color: "#2196f3", fontWeight: "bold", fontSize: 16 }}>Create</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Chat UI */}
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
                                        color: isDarkMode
                                            ? "#fff" : "#000",
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
                                    }
                                }}
                            >
                                {props.currentMessage.text}
                            </Markdown>
                        </View>
                    );
                }}
            />
        </View>
    );
}
