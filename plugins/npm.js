import axios from 'axios';

export default {
    command: 'npm',
    aliases: ['npmpkg', 'package'],
    category: 'download',
    description: 'Search for a package on npm',
    usage: '.npm <package-name>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid || context.sender;
        const q = args.join(' ');

        if (!q) {
            return await sock.sendMessage(chatId, {
                text: '📦 *NPM SEARCH*\n\nPlease provide the name of the npm package you want to search for.\n\n📌 *Example:* .npm express',
                contextInfo: {}
            });
        }

        try {
            await sock.sendMessage(chatId, {
                text: '_📦 Searching npm registry..._',
                contextInfo: {}
            });

            const packageName = q.trim();
            const apiUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

            const response = await axios.get(apiUrl);
            
            if (response.status !== 200) {
                throw new Error("Package not found or an error occurred.");
            }

            const packageData = response.data;
            const latestVersion = packageData["dist-tags"]?.latest || "Unknown";
            const description = packageData.description || "No description available.";
            const npmUrl = `https://www.npmjs.com/package/${packageName}`;
            const license = packageData.license || "Unknown";
            const repository = packageData.repository ? 
                (packageData.repository.url || "Not available") : "Not available";
            const author = packageData.author ? 
                (packageData.author.name || JSON.stringify(packageData.author)) : "Unknown";

            const message = `
*📦 NPM PACKAGE SEARCH*

*🔰 Package:* ${packageName}
*📄 Description:* ${description}
*⏸️ Latest Version:* ${latestVersion}
*👨‍💻 Author:* ${author}
*🪪 License:* ${license}
*🪩 Repository:* ${repository}
*🔗 NPM URL:* ${npmUrl}

*👤 Requested by:* @${sender.split('@')[0]}
`;

            await sock.sendMessage(chatId, {
                text: message,
                mentions: [sender],
                contextInfo: {
                    mentionedJid: [sender]
                }
            });

        } catch (error) {
            console.error('Error in npm command:', error);
            
            if (error.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: '❌ Package not found. Please check the package name and try again.',
                    contextInfo: {}
                });
            } else if (error.code === 'ECONNABORTED') {
                await sock.sendMessage(chatId, {
                    text: '❌ Request timeout. NPM registry is taking too long to respond. Please try again.',
                    contextInfo: {}
                });
            } else if (error.response?.status >= 500) {
                await sock.sendMessage(chatId, {
                    text: '❌ NPM registry is currently unavailable. Please try again later.',
                    contextInfo: {}
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ Error: ${error.message}\n\nPlease try again with a valid package name.`,
                    contextInfo: {}
                });
            }
        }
    }
};