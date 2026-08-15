const axios = require('axios');
const { amon } = require('../amon');
const { fakevCard } = require('../lib/fakevCard');
// EPL Standings Command
amon({
    pattern: 'eplstandings',
    alias: ['epltable', 'standings'],
    react: '🏆',
    desc: 'fetch epl standings 📊',
    category: 'sports',
    use: '.eplstandings',
    filename: __filename
}, async (malvin, mek, m, { from, reply }) => {
    try {
        await malvin.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const apiUrl = 'https://apiskeith.top/epl/standings';
        const { data } = await axios.get(apiUrl, { timeout: 15000 });

        if (!data?.status || !data?.result?.standings) {
            await reply('❌ failed to fetch epl standings 😔');
            await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
            return;
        }

        const { competition, standings } = data.result;
        const standingsList = standings
            .map(team => `
├ *${team.position}.* ${team.team} 📊
├ *ᴘʟᴀʏᴇᴅ*: ${team.played} | *ᴡᴏɴ*: ${team.won} | *ᴅʀᴀᴡ*: ${team.draw} | *ʟᴏsᴛ*: ${team.lost}
├ *ɢᴏᴀʟs*: ${team.goalsFor}/${team.goalsAgainst} (ᴅɪғғ: ${team.goalDifference})
├ *ᴘᴏɪɴᴛs*: ${team.points}`)
            .join('\n\n');

        const caption = `
╭───[ *ᴇᴘʟ sᴛᴀɴᴅɪɴɢs* ]───
│
├ *ᴄᴏᴍᴘᴇᴛɪᴛɪᴏɴ*: ${competition} 🏆
│
${standingsList}
│
╰───[ *BENZO-MD* ]───
> *powered by ꜱᴀɴɢ ʟᴇᴇ* ♡`;

        await malvin.sendMessage(from, {
            text: caption,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: fakevCard });

        await malvin.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('❌ eplstandings error:', error);
        const errorMsg = error.message.includes('timeout')
            ? '❌ request timed out ⏰'
            : '❌ failed to fetch standings 😞';
        await reply(errorMsg);
        await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});

// Finished EPL Matches Command
amon({
    pattern: 'finishedeplmatches',
    alias: ['eplfinished', 'eplresults'],
    react: '⚽',
    desc: 'fetch finished epl matches 📅',
    category: 'sports',
    use: '.finishedeplmatches',
    filename: __filename
}, async (malvin, mek, m, { from, reply }) => {
    try {
        await malvin.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const apiUrl = 'https://apiskeith.top/epl/matches';
        const { data } = await axios.get(apiUrl, { timeout: 15000 });

        if (!data?.status || !data?.result?.matches) {
            await reply('❌ failed to fetch finished matches 😔');
            await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
            return;
        }

        const { competition, matches } = data.result;
        const finishedMatches = matches.filter(match => match.status === 'FINISHED');

        if (!finishedMatches.length) {
            await reply('✅ no finished matches found 😊');
            await malvin.sendMessage(from, { react: { text: '✅', key: m.key } });
            return;
        }

        const matchList = finishedMatches
            .map((match, index) => `
├ *ᴍᴀᴛᴄʜ ${index + 1}:*
├ *ʜᴏᴍᴇ*: ${match.homeTeam} 🏠
├ *ᴀᴡᴀʏ*: ${match.awayTeam} 🛫
├ *sᴄᴏʀᴇ*: ${match.score} ⚽
├ *ᴡɪɴɴᴇʀ*: ${match.winner || 'Draw'} 🏆
├ *ᴍᴀᴛᴄʜᴅᴀʏ*: ${match.matchday}`)
            .join('\n\n');

        const caption = `
╭───[ *ғɪɴɪsʜᴇᴅ ᴇᴘʟ ᴍᴀᴛᴄʜᴇs* ]───
│
├ *ᴄᴏᴍᴘᴇᴛɪᴛɪᴏɴ*: ${competition} ⚽
├ *ᴛᴏᴛᴀʟ*: ${finishedMatches.length} matches
│
${matchList}
│
╰───[ *BENZO-MD* ]───
> *powered by ꜱᴀɴɢ ʟᴇᴇ* ♡`;

        await malvin.sendMessage(from, {
            text: caption,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: fakevCard });

        await malvin.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('❌ finishedeplmatches error:', error);
        const errorMsg = error.message.includes('timeout')
            ? '❌ request timed out ⏰'
            : '❌ failed to fetch matches 😞';
        await reply(errorMsg);
        await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});

// Upcoming EPL Matches Command
amon({
    pattern: 'upcomingeplmatches',
    alias: ['eplmatches', 'epl'],
    react: '⚽',
    desc: 'fetch upcoming epl matches 📅',
    category: 'sports',
    use: '.upcomingeplmatches',
    filename: __filename
}, async (malvin, mek, m, { from, reply }) => {
    try {
        await malvin.sendMessage(from, { react: { text: '⏳', key: m.key } });

        const apiUrl = 'https://apiskeith.top/epl/upcomingmatches';
        const { data } = await axios.get(apiUrl, { timeout: 15000 });

        if (!data?.status || !data?.result?.upcomingMatches) {
            await reply('❌ failed to fetch upcoming matches 😔');
            await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
            return;
        }

        const { competition, upcomingMatches } = data.result;

        if (!upcomingMatches.length) {
            await reply('✅ no upcoming matches found 😊');
            await malvin.sendMessage(from, { react: { text: '✅', key: m.key } });
            return;
        }

        const matchList = upcomingMatches
            .map((match, index) => `
├ *ᴍᴀᴛᴄʜ ${index + 1}:*
├ *ʜᴏᴍᴇ*: ${match.homeTeam} 🏠
├ *ᴀᴡᴀʏ*: ${match.awayTeam} 🛫
├ *ᴅᴀᴛᴇ*: ${match.date} 📅
├ *ᴍᴀᴛᴄʜᴅᴀʏ*: ${match.matchday}`)
            .join('\n\n');

        const caption = `
╭───[ *ᴜᴘᴄᴏᴍɪɴɢ ᴇᴘʟ ᴍᴀᴛᴄʜᴇs* ]───
│
├ *ᴄᴏᴍᴘᴇᴛɪᴛɪᴏɴ*: ${competition} ⚽
├ *ᴛᴏᴛᴀʟ*: ${upcomingMatches.length} matches
│
${matchList}
│
╰───[ *BENZO-MD* ]───
> *powered by ꜱᴀɴɢ ʟᴇᴇ* ♡`;

        await malvin.sendMessage(from, {
            text: caption,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: fakevCard });

        await malvin.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (error) {
        console.error('❌ upcomingeplmatches error:', error);
        const errorMsg = error.message.includes('timeout')
            ? '❌ request timed out ⏰'
            : '❌ failed to fetch matches 😞';
        await reply(errorMsg);
        await malvin.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});