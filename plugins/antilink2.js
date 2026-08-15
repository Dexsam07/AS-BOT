const { amon } = require('../amon');
const config = require("../settings");
const { fakevCard } = require('../lib/fakevCard');
const fs = require('fs').promises;
const path = require('path');

// Initialize globals
if (!global.warnings) {
  global.warnings = {};
}

if (!global.messageTimestamps) {
  global.messageTimestamps = {};
}

if (!global.groupSettings) {
  global.groupSettings = {};
}

console.log('🛡️ Anti-Link & Anti-Bad Word Handler Loaded');

// Configurable bad words list
const badWords = [
  "wtf", "mia", "xxx", "fuck", "sex", "huththa", "pakaya", "ponnaya", "hutto", 
  "bitch", "asshole", "dick", "pussy", "bastard", "shit", "damn", "cunt",
  "motherfucker", "ass", "porn", "nude", "dick", "cock", "vagina", "boobs"
];

// Link patterns to detect
const linkPatterns = [
  /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
  /https?:\/\/(?:api\.whatsapp\.com|wa\.me)\/\S+/gi,
  /wa\.me\/\S+/gi,
  /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,
  /https?:\/\/(?:www\.)?\w+\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,
  /https?:\/\/(?:whatsapp\.com|channel\.me)\/\S+/gi,
  /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?discord\.(?:com|gg)\/\S+/gi,
  /https?:\/\/(?:www\.)?twitch\.tv\/\S+/gi,
  /https?:\/\/(?:www\.)?vimeo\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?dailymotion\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?medium\.com\/\S+/gi,
  /https?:\/\/fb\.me\/\S+/gi,
  /https?:\/\/youtu\.be\/\S+/gi,
  /https?:\/\/ngl\.link\/\S+/gi,
  /https?:\/\/bit\.ly\/\S+/gi,
  /https?:\/\/tinyurl\.com\/\S+/gi
];

// Whitelist patterns (allowed links)
const whitelistPatterns = [
  /https?:\/\/(?:www\.)?github\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?youtube\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?google\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?stackoverflow\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?wikipedia\.org\/\S+/gi
];

// Group-specific customizations
const groupCustomBadWords = {
  // 'group-id@g.us': ['custom', 'bad', 'words']
};

// Get bad words for specific group
const getBadWordsForGroup = (groupId) => {
  return [...badWords, ...(groupCustomBadWords[groupId] || [])];
};

// Anti-spam protection
const checkSpam = (sender) => {
  const now = Date.now();
  if (!global.messageTimestamps[sender]) {
    global.messageTimestamps[sender] = [];
  }
  
  // Keep only messages from last 10 seconds
  global.messageTimestamps[sender] = global.messageTimestamps[sender].filter(
    timestamp => now - timestamp < 10000
  );
  
  // Add current message
  global.messageTimestamps[sender].push(now);
  
  // If more than 5 messages in 10 seconds, consider it spam
  return global.messageTimestamps[sender].length > 5;
};

// Log violations to file
const logViolation = async (type, user, group, message, warningCount = 0) => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      user: user.split('@')[0],
      group: group.split('@')[0],
      message: message.substring(0, 200),
      warningCount
    };
    
    const logDir = path.join(__dirname, '../logs');
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'violations.log');
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('Failed to log violation:', error);
  }
};

// Get group settings with defaults
const getGroupSettings = (groupId) => {
  if (!global.groupSettings[groupId]) {
    global.groupSettings[groupId] = {
      antiLink: config.ANTI_LINK === "true",
      antiBadWord: config.ANTI_BAD_WORD === "true",
      antiSpam: config.ANTI_SPAM === "true",
      maxWarnings: 3
    };
  }
  return global.groupSettings[groupId];
};

// Main handler
amon({
  'on': "body"
}, async (malvin, m, store, {
  from,
  body,
  sender,
  isGroup,
  isAdmins,
  isBotAdmins,
  reply
}) => {
  try {
    // Debug logging
    console.log('🔍 Checking message:', {
      from: from.substring(0, 10) + '...',
      sender: sender.split('@')[0],
      body: body?.substring(0, 30) + '...',
      isGroup,
      isAdmins,
      isBotAdmins
    });

    // Only act in groups where bot is admin and sender isn't admin
    if (!isGroup) {
      return;
    }
    
    if (isAdmins) {
      return;
    }
    
    if (!isBotAdmins) {
      return;
    }
    
    if (sender === malvin.user?.id) {
      return;
    }

    if (!body || typeof body !== 'string') {
      return;
    }

    const text = body.toLowerCase().trim();
    const groupSettings = getGroupSettings(from);
    
    // Anti-spam check
    if (groupSettings.antiSpam && checkSpam(sender)) {
      console.log(`🚫 Spam detected from ${sender}`);
      
      try {
        await malvin.sendMessage(from, { delete: m.key });
        console.log(`✅ Spam message deleted: ${m.key.id}`);
      } catch (deleteError) {
        console.error("❌ Failed to delete spam message:", deleteError);
      }

      await malvin.sendMessage(from, {
        text: `🚫 *SPAM DETECTED!*\n` +
              `*╭────⬡ WARNING ⬡────*\n` +
              `*├▢ USER :* @${sender.split('@')[0]}\n` +
              `*├▢ REASON :* Sending too many messages\n` +
              `*├▢ ACTION :* Message deleted\n` +
              `*╰────────────────*`,
        mentions: [sender]
      }, { quoted: fakevCard });
      
      await logViolation('SPAM', sender, from, body);
      return;
    }

    // Check for bad words
    const groupBadWords = getBadWordsForGroup(from);
    const hasBadWord = groupSettings.antiBadWord && 
                      groupBadWords.some(word => {
                        const found = text.includes(word.toLowerCase());
                        if (found) console.log(`🚫 Bad word detected: ${word}`);
                        return found;
                      });

    // Check for links (excluding whitelisted)
    const hasForbiddenLink = groupSettings.antiLink && 
      linkPatterns.some(pattern => pattern.test(body)) &&
      !whitelistPatterns.some(pattern => pattern.test(body));

    console.log(`📊 Check results: BadWord: ${hasBadWord}, Link: ${hasForbiddenLink}`);

    // Handle bad words
    if (hasBadWord) {
      console.log(`🚫 Bad word detected from ${sender}: ${body}`);
      
      // Try to delete the message
      try {
        await malvin.sendMessage(from, { delete: m.key });
        console.log(`✅ Message with bad word deleted: ${m.key.id}`);
      } catch (deleteError) {
        console.error("❌ Failed to delete message:", deleteError);
      }

      // Send warning for bad word
      await malvin.sendMessage(from, {
        text: `🚫 *BAD LANGUAGE DETECTED!*\n` +
              `*╭────⬡ WARNING ⬡────*\n` +
              `*├▢ USER :* @${sender.split('@')[0]}\n` +
              `*├▢ REASON :* Using inappropriate language\n` +
              `*├▢ ACTION :* Message deleted\n` +
              `*╰────────────────*`,
        mentions: [sender]
      }, { quoted: fakevCard });
      
      await logViolation('BAD_WORD', sender, from, body);
      return;
    }

    // Handle links
    if (hasForbiddenLink) {
      console.log(`🔗 Link detected from ${sender}: ${body}`);

      // Try to delete the message
      try {
        await malvin.sendMessage(from, { delete: m.key });
        console.log(`✅ Message with link deleted: ${m.key.id}`);
      } catch (deleteError) {
        console.error("❌ Failed to delete message:", deleteError);
      }

      // Initialize warnings for this user if not exists
      if (!global.warnings[sender]) {
        global.warnings[sender] = {
          count: 0,
          lastWarning: Date.now(),
          group: from
        };
      }

      // Update warning count
      global.warnings[sender].count++;
      global.warnings[sender].lastWarning = Date.now();
      
      const warningCount = global.warnings[sender].count;
      const maxWarnings = groupSettings.maxWarnings;

      await logViolation('LINK', sender, from, body, warningCount);

      // Handle warnings based on count
      if (warningCount <= maxWarnings) {
        // Send warning message
        await malvin.sendMessage(from, {
          text: `⚠️ *LINKS ARE NOT ALLOWED!*\n` +
                `*╭────⬡ WARNING ${warningCount}/${maxWarnings} ⬡────*\n` +
                `*├▢ USER :* @${sender.split('@')[0]}\n` +
                `*├▢ REASON :* Sending links\n` +
                `*├▢ ACTION :* Message deleted + Warning\n` +
                `*╰────────────────*`,
          mentions: [sender]
        }, { quoted: fakevCard });
      } else {
        // Remove user after max warnings
        try {
          await malvin.groupParticipantsUpdate(from, [sender], "remove");
          
          await malvin.sendMessage(from, {
            text: `❌ *USER REMOVED!*\n` +
                  `*╭────⬡ ACTION TAKEN ⬡────*\n` +
                  `*├▢ USER :* @${sender.split('@')[0]}\n` +
                  `*├▢ REASON :* Exceeded link warning limit (${maxWarnings}/${maxWarnings})\n` +
                  `*├▢ ACTION :* Removed from group\n` +
                  `*╰────────────────*`,
            mentions: [sender]
          }, { quoted: fakevCard });
          
          // Clean up warnings for removed user
          delete global.warnings[sender];
          
        } catch (removeError) {
          console.error("Failed to remove user:", removeError);
          await malvin.sendMessage(from, {
            text: `❌ Failed to remove @${sender.split('@')[0]}. Bot may need higher permissions.`,
            mentions: [sender]
          }, { quoted: fakevCard });
        }
      }
    }

    // Clean up old warnings (older than 24 hours)
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    for (const [user, data] of Object.entries(global.warnings)) {
      if (now - data.lastWarning > twentyFourHours) {
        console.log(`🧹 Cleaning old warnings for user: ${user.split('@')[0]}`);
        delete global.warnings[user];
      }
    }

    // Clean up old message timestamps (older than 1 minute)
    for (const [user, timestamps] of Object.entries(global.messageTimestamps)) {
      global.messageTimestamps[user] = timestamps.filter(
        timestamp => now - timestamp < 60000
      );
      if (global.messageTimestamps[user].length === 0) {
        delete global.messageTimestamps[user];
      }
    }

  } catch (error) {
    console.error("Anti-link/badword error:", error);
  }
});

// Admin commands to manage the system
amon({
  pattern: "warnings",
  desc: "View warning counts for users",
  category: "moderation",
  fromMe: true
}, async (malvin, mek, m, { from, isGroup, reply }) => {
  if (!isGroup) {
    return reply("This command only works in groups.");
  }

  const groupWarnings = Object.entries(global.warnings)
    .filter(([user, data]) => data.group === from)
    .map(([user, data]) => `@${user.split('@')[0]} - ${data.count} warnings`)
    .join('\n');

  await malvin.sendMessage(from, {
    text: `⚠️ *WARNING STATUS*\n\n${groupWarnings || 'No warnings in this group'}`,
    mentions: Object.keys(global.warnings).filter(user => global.warnings[user].group === from)
  }, { quoted: fakevCard });
});

amon({
  pattern: "resetwarns",
  desc: "Reset warnings for a user",
  category: "moderation", 
  fromMe: true
}, async (malvin, mek, m, { from, reply, mentioned }) => {
  if (!mentioned || mentioned.length === 0) {
    return reply("Please mention a user to reset warnings. Example: .resetwarns @user");
  }

  const user = mentioned[0];
  if (global.warnings[user]) {
    delete global.warnings[user];
    reply(`✅ Warnings reset for @${user.split('@')[0]}`, { mentions: [user] });
  } else {
    reply(`❌ No warnings found for @${user.split('@')[0]}`, { mentions: [user] });
  }
});
/*
malvin({
  pattern: "antilink",
  desc: "Toggle anti-link protection",
  category: "moderation",
  fromMe: true
}, async (malvin, mek, m, { from, reply, args }) => {
  if (!global.groupSettings[from]) {
    global.groupSettings[from] = getGroupSettings(from);
  }

  const action = args[0]?.toLowerCase();
  if (action === 'on') {
    global.groupSettings[from].antiLink = true;
    reply("✅ Anti-link protection enabled");
  } else if (action === 'off') {
    global.groupSettings[from].antiLink = false;
    reply("❌ Anti-link protection disabled");
  } else {
    reply(`🔧 Anti-link is currently: ${global.groupSettings[from].antiLink ? 'ON' : 'OFF'}`);
  }
});
*/


// Auto-cleanup every hour
setInterval(() => {
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  for (const [user, data] of Object.entries(global.warnings)) {
    if (now - data.lastWarning > twentyFourHours) {
      delete global.warnings[user];
    }
  }
  
  for (const [user, timestamps] of Object.entries(global.messageTimestamps)) {
    global.messageTimestamps[user] = timestamps.filter(
      timestamp => now - timestamp < 60000
    );
    if (global.messageTimestamps[user].length === 0) {
      delete global.messageTimestamps[user];
    }
  }
}, 60 * 60 * 1000); // 1 hour