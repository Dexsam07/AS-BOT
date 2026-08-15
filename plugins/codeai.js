const { amon } = require('../amon');
const axios = require('axios');
const { fakevCard } = require('../lib/fakevCard');
const { getPrefix } = require('../lib/prefix');
const prefix = getPrefix();


const supportedLanguages = ['JavaScript', 'C#', 'C++', 'Java', 'Ruby', 'Go', 'Python', 'Custom'];
const supportedModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-5-sonnet'];

async function generateCode(prompt, language = 'JavaScript', model = 'gpt-4o-mini') {
    if (!supportedLanguages.includes(language)) {
        return { status: false, error: `Language not supported. Use one of: ${supportedLanguages.join(', ')}` };
    }
    if (!supportedModels.includes(model)) {
        return { status: false, error: `Model not supported. Use one of: ${supportedModels.join(', ')}` };
    }

    const finalPrompt = language === 'Custom' ? prompt : `Write code in ${language} for: ${prompt}`;

    try {
        const response = await axios.post('https://best-ai-code-generator.toolzflow.app/api/chat/public', {
            chatSettings: {
                model: model,
                temperature: 0.3,
                contextLength: 16385,
                includeProfileContext: false,
                includeWorkspaceInstructions: false,
                includeExampleMessages: false
            },
            messages: [
                { role: 'system', content: 'You are a helpful assistant that writes code in requested language.' },
                { role: 'user', content: finalPrompt }
            ],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: 'code_response',
                    strict: true,
                    schema: {
                        type: 'object',
                        properties: { code: { type: 'string', description: 'Generated code' } },
                        required: ['code']
                    }
                }
            }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://best-ai-code-generator.toolzflow.app',
                'Referer': 'https://best-ai-code-generator.toolzflow.app/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept': '*/*'
            }
        });

        const rawCode = response.data?.code || '';
        const formattedCode = rawCode.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');

        return { status: true, code: formattedCode.trim() || 'No code generated.' };
    } catch (e) {
        return { status: false, error: `Request failed: ${e.message}` };
    }
}

amon({
    pattern: "codeai",
    alias: ['generatecode', 'codegen', 'aicode'],
    react: '💻',
    desc: "AI Code Generator",
    category: "ai",
    filename: __filename
}, async (malvin, mek, m, { from, args, }) => {
    const text = args.join(' ').trim();
    
    if (!text) {
        return malvin.sendMessage(from, {
            text: `Example: *${prefix}codeai* create factorial function|Python|gpt-4o`
        }, { quoted: fakevCard });
    }

    const argsArray = text.split('|').map(arg => arg.trim());
    const prompt = argsArray[0];
    const language = argsArray[1] || 'JavaScript';
    const model = argsArray[2] || 'gpt-4o-mini';

    if (!prompt) {
        return malvin.sendMessage(from, { text: "Prompt cannot be empty." }, { quoted: fakevCard });
    }

    if (!supportedLanguages.includes(language)) {
        return malvin.sendMessage(from, { text: `Language not supported. Use: ${supportedLanguages.join(', ')}` }, { quoted: fakevCard });
    }
    if (!supportedModels.includes(model)) {
        return malvin.sendMessage(from, { text: `Model not supported. Use: ${supportedModels.join(', ')}` }, { quoted: fakevCard });
    }

    try {
        malvin.sendMessage(from, { text: 'Generating code...' }, { quoted: fakevCard });

        const result = await generateCode(prompt, language, model);

        if (result.status) {
            malvin.sendMessage(from, { text: `Generated code:\n\`\`\`${result.code}\`\`\`` }, { quoted: fakevCard });
        } else {
            malvin.sendMessage(from, { text: `Failed: ${result.error}` }, { quoted: fakevCard });
        }
    } catch (e) {
        console.error('Code AI error:', e);
        malvin.sendMessage(from, { text: 'Error processing request.' }, { quoted: fakevCard });
    }
});