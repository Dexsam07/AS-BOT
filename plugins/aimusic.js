const { amon } = require('../amon');
const axios = require('axios');
const { fakevCard } = require('../lib/fakevCard');

const delay = (ms) => new Promise(res => setTimeout(res, ms));
const { getPrefix } = require('../lib/prefix');
const prefix = getPrefix();


async function aimusic(prompt, { tags = 'pop, romantic' } = {}) {
    try {
        if (!prompt) throw new Error('Prompt is required');
        const { data: lyricApiRes } = await axios.get('https://8pe3nv3qha.execute-api.us-east-1.amazonaws.com/default/llm_chat', {
            params: {
                query: JSON.stringify([
                    {
                        role: 'system',
                        content: 'You are a professional lyricist AI trained to write poetic and rhythmic song lyrics. Respond with lyrics only, using [verse], [chorus], [bridge], and [instrumental] or [inst] tags to structure the song. Use only the tag (e.g., [verse]) without any numbering or extra text (e.g., do not write [verse 1], [chorus x2], etc). Do not add explanations, titles, or any other text outside of the lyrics. Focus on vivid imagery, emotional flow, and strong lyrical rhythm. Refrain from labeling genre or giving commentary. Respond in clean plain text, exactly as if it were a song lyric sheet.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]),
                link: 'writecream.com'
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://writecream.com/'
            }
        });
        const generatedLyrics = lyricApiRes.response_content;
        if (!generatedLyrics) throw new Error('Failed to get lyrics from AI.');
        const session_hash = Math.random().toString(36).substring(2);
        await axios.post(`https://ace-step-ace-step.hf.space/gradio_api/queue/join?`, {
            data: [
                240,
                tags,
                generatedLyrics,
                60,
                15,
                'euler',
                'apg',
                10,
                '',
                0.5,
                0,
                3,
                true,
                false,
                true,
                '',
                0,
                0,
                false,
                0.5,
                null,
                'none'
            ],
            event_data: null,
            fn_index: 11,
            trigger_id: 45,
            session_hash: session_hash
        });
        let resultMusicUrl;
        let pollingAttempts = 0;
        const maxPollingAttempts = 120;
        const pollingInterval = 1000;
        while (!resultMusicUrl && pollingAttempts < maxPollingAttempts) {
            const { data } = await axios.get(`https://ace-step-ace-step.hf.space/gradio_api/queue/data?session_hash=${session_hash}`);
            const lines = data.split('\n\n');
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const d = JSON.parse(line.substring(6));
                    if (d.msg === 'process_completed' && d.output?.data?.[0]?.url) {
                        resultMusicUrl = d.output.data[0].url;
                        break;
                    } else if (d.msg === 'queue_full' || d.msg === 'process_failed') {
                        throw new Error(`HF Space condition: ${d.msg}. Failed to process AI music.`);
                    }
                }
            }
            if (!resultMusicUrl) {
                pollingAttempts++;
                await delay(pollingInterval);
            }
        }
        if (!resultMusicUrl) throw new Error('Timeout: Failed to get AI music URL.');
        return resultMusicUrl;
    } catch (error) {
        console.error('Error in aimusic generator:', error.message);
        if (error.response && error.response.data) {
            console.error('API Response Error:', error.response.data.toString());
        }
        throw new Error(`Failed to create AI music: ${error.message}`);
    }
}

amon({
    pattern: "aimusic",
    alias: ['generatemusic', 'tomusic'],
    react: '🎵',
    desc: "Generate AI music from text prompt",
    category: "ai",
    filename: __filename,
    premium: true
}, async (malvin, mek, m, { from, args }) => {
    const text = args.join(' ').trim();
    
    if (!text) {
        return malvin.sendMessage(from, {
            text: `*AI Music Generator*\n\nUsage: *${prefix}aimusic* <prompt> | <tags>\n\n*Example:* ${prefix}aimusic love song about summer | pop, happy\n*Tags (optional):* Pop, Romantic, Rock (default: pop, romantic)`
        }, { quoted: fakevCard });
    }

    const argParts = text.split('|').map(s => s.trim());
    const prompt = argParts[0];
    const tags = argParts[1] || 'pop, romantic';
    
    if (!prompt) {
        return malvin.sendMessage(from, {
            text: 'Prompt cannot be empty!'
        }, { quoted: fakevCard });
    }

    try {
        malvin.sendMessage(from, {
            text: '⏳ Creating AI music...'
        }, { quoted: fakevCard });

        const musicUrl = await aimusic(prompt, { tags });
        
        if (!musicUrl) {
            throw new Error('No AI music URL generated.');
        }

        await malvin.sendMessage(from, {
            audio: { url: musicUrl },
            mimetype: 'audio/mpeg',
            fileName: `aimusic_${Date.now()}.mp3`,
            caption: `🎶 *AI Music Created!* 🎶\n\n*Prompt:* ${prompt}\n*Tags:* ${tags}\n\n_Source: ace-step-ace-step.hf.space_`,
        }, { quoted: fakevCard });

    } catch (e) {
        console.error('Error in AI Music plugin:', e);
        malvin.sendMessage(from, {
            text: `❌ Error creating AI music: ${e.message}. Please try again later.`
        }, { quoted: fakevCard });
    }
});