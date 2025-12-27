
export interface ProcessedBlogData {
    cleanedMessages: any[];
    imageMap: Map<string, string>;
}

export function prepareMessagesForBlog(messages: any[]): ProcessedBlogData {
    const imageMap = new Map<string, string>();
    let counter = 0;

    const cleanedMessages = messages.map(msg => {
        const newMsg = { ...msg };

        // Handle content if it is a string (Markdown images)
        if (typeof newMsg.content === 'string') {
            newMsg.content = newMsg.content.replace(/!\[(.*?)\]\((.*?)\)/g, (match: string, alt: string, url: string) => {
                // If it's a data URL or a very long URL, replace it
                if (url.startsWith('data:') || url.length > 500) {
                    const key = `__CLIENT_IMG_${counter++}__`;
                    imageMap.set(key, url);
                    return `![${alt}](${key})`;
                }
                return match;
            });
        }

        // Handle attachment array if present (experimental_attachments)
        if (newMsg.experimental_attachments && Array.isArray(newMsg.experimental_attachments)) {
            newMsg.experimental_attachments = newMsg.experimental_attachments.map((att: any) => {
                const newAtt = { ...att };
                if (newAtt.url && (newAtt.url.startsWith('data:') || newAtt.url.length > 500)) {
                    const key = `__CLIENT_IMG_${counter++}__`;
                    imageMap.set(key, newAtt.url);
                    newAtt.url = key;
                }
                return newAtt;
            });
        }

        // Handle content if it is complex array (parts)
        if (Array.isArray(newMsg.content)) {
            // Not strictly needed for current app logic which mostly uses string content for user/assistant
            // but good for completeness if structure changes.
            // Skipping for now to avoid complexity as ChatApp mostly flattens to string or uses attachments.
        }

        return newMsg;
    });

    return { cleanedMessages, imageMap };
}

export function restoreBlogImages(markdown: string, imageMap: Map<string, string>): string {
    let restored = markdown;
    imageMap.forEach((url, key) => {
        // Replace all occurrences of the placeholder with the original URL/Base64
        // Scaping key for regex in case it has special chars (unlikely with our pattern)
        restored = restored.split(key).join(url);
    });
    return restored;
}
