// AI.js
import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { GiftedChat, InputToolbar } from "react-native-gifted-chat";
import "../global.css";
import Ionicons from "@expo/vector-icons/Ionicons";
import Markdown from "react-native-markdown-display";
import { useTheme } from "../ThemeContext"; // Import useTheme

export default function AI() {
    const { isDarkMode } = useTheme(); // Get dark mode value from context

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
            "You are a helpful assistant that answers questions about space. You are part of a mobile app called Quasar. You are friendly, concise, and informative. You just said 'how may I answer your questions about space?' Generally, only respond to the last statement or question from the user. Don't use previous context unless you need to, because the way the data is formatted for you, you oftentimes don't see that you have already responded. No emojis, no emojis, and most importantly, no emojis. Be serious",
    };

    const [messages, setMessages] = useState([defaultBotMessage]);
    const [formattedMsgs, setFormattedMsgs] = useState([defaultSystemMessage]);

    const resetChat = () => {
        setMessages([defaultBotMessage]);
        setFormattedMsgs([defaultSystemMessage]);
    };

    const onSend = useCallback(
        (msg = []) => {
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
        [formattedMsgs]
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

            console.log("AI response:", messageText);
            let botMsg = {
                _id: Math.random().toString(36).substring(7),
                text: messageText || "I don't know how to respond to that.",
                createdAt: new Date(),
                user: {
                    _id: 2,
                    name: "Quasar AI",
                    avatar: require("../assets/quasar-ai-pfp.png"), // Ensure the path is correct
                },
            };
            setMessages((previousMessages) =>
                GiftedChat.append(previousMessages, botMsg)
            );
            setFormattedMsgs((previousMessages) =>
                GiftedChat.append(previousMessages, [
                    {
                        role: "system",
                        content: data.choices[0].message.content,
                    },
                ])
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
            <TouchableOpacity
                onPress={resetChat}
                style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    padding: 10,
                    borderRadius: 50,
                    zIndex: 20,
                    backgroundColor: isDarkMode ? "#fff" : "#000",
                }}
            >
                <Ionicons
                    name="refresh"
                    size={24}
                    color={isDarkMode ? "#000" : "#fff"}
                />
            </TouchableOpacity>
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
