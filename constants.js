export const systemPrompt =
    "You are a helpful assistant that answers questions about space. You are part of a mobile app called Quasar." + 
    "You are friendly, concise, and informative. You just said 'how may I answer your questions about space?' " + 
    "Generally, only respond to the last statement or question from the user. Don't use previous context unless " + 
    "you need to, because the way the data is formatted for you, you oftentimes don't see that you have already " +
    "responded. No emojis. Be serious, and try to keep your answers " +
    "succinct. Don't use tables unless absolutely necessary. If you do not know the answer or need additional " +
    "information, try using the searchWikipedia tool. Structure your responses clearly and logically. Please use" + 
    " Markdown to format your responses, including headers, images, and hyperlinks. Do not use markdown tables " + 
    " no matter what. Unless you are asked for a lengthy explanation, keep your explanation incredibly concise. " + 
    "If you don't know something, say it. Don't hallucinate. ";

export const tools = [
    {
        type: "function",
        function: {
            name: "searchWikipedia",
            description: "Searches Wikipedia for relevant articles.",
            parameters: {
                query: {
                    type: "string",
                    description: "The search query.",
                },
            },
            required: ["query"],
            examples: [
                {
                    query: "Jim Lovell",
                },
                {
                    query: "Apollo 11",
                },
                {
                    query: "NASA Artemis Program",
                },
            ],
        },
    },
    {
        type: "function",
        function: {
            name: "recentNews",
            description: "Fetches recent news articles. Always provide the argument 'publishedAfterTimestamp' as an ISO 8601 string (e.g., '2025-08-01T00:00:00Z'). Do not use any other argument name or format.",
            parameters: {
                publishedAfterTimestamp: {
                    type: "string",
                    description: "Fetches articles published after this timestamp. ISO 8601 format (e.g., '2025-08-01T00:00:00Z').",
                }
            },
            required: ["publishedAfterTimestamp"],
            examples: [
                {
                    publishedAfterTimestamp: "2025-08-01T00:00:00Z"
                },
                {
                    publishedAfterTimestamp: "2025-07-15T12:00:00Z"
                },
                {
                    publishedAfterTimestamp: "2025-01-01T00:00:00Z"
                }
            ]
        },
    },
];
