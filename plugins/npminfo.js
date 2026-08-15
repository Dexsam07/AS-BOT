import axios from 'axios';

export default {
    command: 'npminfo',
    aliases: ['pkginfo', 'packageinfo'],
    category: 'download',
    description: 'Get detailed information about an npm package',
    usage: '.npminfo <package-name>',
    async handler(sock, message, args, context) {
        const chatId = context.chatId || message.key.remoteJid;
        const sender = message.key.participant || message.key.remoteJid || context.sender;
        const q = args.join(' ');

        if (!q) {
            return await sock.sendMessage(chatId, {
                text: '📋 *NPM PACKAGE INFO*\n\nPlease provide the name of the npm package.\n\n📌 *Example:* .npminfo express',
                contextInfo: {}
            });
        }

        try {
            await sock.sendMessage(chatId, {
                text: '_📋 Fetching detailed package information..._',
                contextInfo: {}
            });

            const packageName = q.trim();
            const apiUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

            const response = await axios.get(apiUrl);
            
            if (response.status !== 200) {
                throw new Error("Package not found.");
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
            const homepage = packageData.homepage || "Not available";
            const keywords = packageData.keywords ? packageData.keywords.join(', ') : "None";
            const versions = Object.keys(packageData.versions || {}).length;
            const maintainers = packageData.maintainers?.length || 0;

            const message = `
*📋 NPM PACKAGE DETAILS*

*🔰 Package:* ${packageName}
*📄 Description:* ${description}
*⏸️ Latest Version:* ${latestVersion}
*📊 Total Versions:* ${versions}
*👨‍💻 Author:* ${author}
*👥 Maintainers:* ${maintainers}
*🪪 License:* ${license}
*🏠 Homepage:* ${homepage}
*🪩 Repository:* ${repository}
*🏷️ Keywords:* ${keywords}
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
            console.error('Error in npminfo command:', error);
            
            if (error.response?.status === 404) {
                await sock.sendMessage(chatId, {
                    text: '❌ Package not found. Please check the package name.',
                    contextInfo: {}
                });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Failed to fetch package details. Please try again later.',
                    contextInfo: {}
                });
            }
        }
    }
};