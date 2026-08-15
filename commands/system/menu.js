const config = require('../../config');

const CATEGORY_META = {
  system: { icon: '⚙️', title: 'SYSTEM & INFO' },
  daily: { icon: '📝', title: 'PERSONAL & DAILY' },
  reminder: { icon: '⏰', title: 'REMINDERS' },
  group: { icon: '👥', title: 'GROUP MANAGEMENT' },
  media: { icon: '🎨', title: 'MEDIA & TOOLS' },
  owner: { icon: '👑', title: 'OWNER CONTROLS' },
  general: { icon: '🧰', title: 'UTILITIES' }
};

function clean(value, fallback = '') {
  const text = String(value ?? '').trim();
  return text || fallback;
}

function nowInTimezone(timezone) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: timezone,
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date());
  } catch (_) {
    return new Date().toISOString().replace('T', ' ').slice(0, 16);
  }
}

function commandGroups(registry = []) {
  const groups = new Map();
  for (const item of registry) {
    const name = clean(item.name || item.command).toLowerCase();
    if (!name || item.hidden || item.dontAdd) continue;
    const category = clean(item.category, 'general').toLowerCase();
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push({
      name,
      description: clean(item.description, 'No description available.'),
      aliases: Array.isArray(item.aliases) ? item.aliases.filter(Boolean).slice(0, 3) : []
    });
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, commands]) => ({
      category,
      meta: CATEGORY_META[category] || { icon: '📦', title: category.toUpperCase() },
      commands: commands.sort((a, b) => a.name.localeCompare(b.name))
    }));
}

function headerText(groups) {
  const count = groups.reduce((total, group) => total + group.commands.length, 0);
  return [
    `╭━━━〔 ${clean(config.BOT_NAME, 'AS-BOT')} 〕━━━╮`,
    `┃ 👤 Owner   : ${clean(config.OWNER_NAME, 'Shyam Chaudhari')}`,
    `┃ 🧩 Commands: ${count}`,
    `┃ 🌐 Mode    : ${clean(config.MODE, 'private')}`,
    `┃ 🕒 Time    : ${nowInTimezone(config.TIMEZONE)}`,
    `┃ 🔖 Version : ${clean(config.VERSION, '1.0.0')}`,
    '╰━━━━━━━━━━━━━━━━━━━━╯',
    '',
    'Select a category below to open its commands.',
    'All commands work without a dot prefix.'
  ].join('\n');
}

function textMenu(groups) {
  const categoryLines = groups.length
    ? groups.map((group, index) => `│ ${String(index + 1).padStart(2, '0')}  ${group.meta.icon} ${group.meta.title}  (${group.commands.length})`)
    : ['│ --  No active commands found'];
  return [
    headerText(groups),
    '',
    '╭━━━〔 📚 COMMAND CATEGORIES 〕━━━╮',
    ...categoryLines,
    '╰━━━━━━━━━━━━━━━━━━━━╯',
    '',
    'Reply `menu 1`, `menu 2`, etc. to open a category.',
    `📢 ${clean(config.CHANNEL_NAME, 'DEX SHYAM TECH')}`,
    `🔗 ${clean(config.CHANNEL_LINK)}`,
    '',
    clean(config.DESCRIPTION, 'AS-BOT personal daily-use assistant')
  ].join('\n');
}

function textCategory(group, index, total) {
  const lines = [
    `╭━━━〔 ${group.meta.icon} ${group.meta.title} 〕━━━╮`,
    `┃ Category ${index + 1}/${total}`,
    '╰━━━━━━━━━━━━━━━━━━━━╯',
    ''
  ];
  for (const command of group.commands) {
    const aliasText = command.aliases.length ? ` [${command.aliases.join(', ')}]` : '';
    lines.push(`• \`${command.name}\`${aliasText} — ${command.description}`);
  }
  lines.push('', 'Send `menu` for categories. Commands are prefixless.');
  return lines.join('\n');
}

function quotedOptions(context) {
  return context.message ? { quoted: context.message } : undefined;
}

async function sendInteractive(context, payload) {
  return context.sendMessage(payload, quotedOptions(context));
}

function categoryListPayload(groups) {
  return {
    title: `${clean(config.BOT_NAME, 'AS-BOT')} MENU`,
    text: headerText(groups),
    footer: `${clean(config.CHANNEL_NAME, 'DEX SHYAM TECH')} • Select a category`,
    footerText: `${clean(config.CHANNEL_NAME, 'DEX SHYAM TECH')} • Select a category`,
    buttonText: '📚 OPEN CATEGORIES',
    sections: [{
      title: 'ACTIVE COMMAND CATEGORIES',
      rows: groups.slice(0, 10).map((group, index) => ({
        title: `${group.meta.icon} ${group.meta.title}`.slice(0, 24),
        description: `${group.commands.length} active commands`,
        rowId: `menu ${index + 1}`
      }))
    }]
  };
}

function quickButtons(registry) {
  const names = new Set(registry.map((item) => String(item.name || '').toLowerCase()));
  return {
    text: '⚡ Quick actions',
    footer: 'AS-BOT • DEX SHYAM TECH',
    buttons: [
      { buttonId: 'owner', buttonText: { displayText: '💖 OWNER' }, type: 1 },
      { buttonId: names.has('ping') ? 'ping' : 'alive', buttonText: { displayText: '⏱️ PING' }, type: 1 }
    ],
    headerType: 1
  };
}

function commandListPayload(group, index, total) {
  return {
    title: `${group.meta.icon} ${group.meta.title}`,
    text: `Category ${index + 1}/${total}\nSelect a command to run it directly.`,
    footer: 'Use the back option to return to categories.',
    footerText: 'Use the back option to return to categories.',
    buttonText: '⚡ SELECT COMMAND',
    sections: [{
      title: `${group.commands.length} ACTIVE COMMANDS`,
      rows: group.commands.slice(0, 90).map((command) => ({
        title: command.name.slice(0, 24),
        description: `${command.description}`.slice(0, 72),
        rowId: command.name
      }))
    }, {
      title: 'NAVIGATION',
      rows: [{ title: '↩️ Back to categories', description: 'Return to the main menu', rowId: 'menu' }]
    }]
  };
}

async function sendMainMenu(context, groups) {
  const imageUrl = process.env.MENU_IMAGE_URL || '';
  if (imageUrl) {
    try {
      await sendInteractive(context, { image: { url: imageUrl }, caption: headerText(groups) });
    } catch (_) {
      // Interactive list below remains the primary menu.
    }
  }
  try {
    await sendInteractive(context, categoryListPayload(groups));
    await sendInteractive(context, quickButtons(context.registry || []));
  } catch (_) {
    await context.reply(textMenu(groups));
  }
}

async function sendCategoryMenu(context, groups, index) {
  const group = groups[index];
  if (!group) return context.reply(`❌ Category not found. Use \`menu\` to view categories 1-${groups.length || 1}.`);
  try {
    await sendInteractive(context, commandListPayload(group, index, groups.length));
  } catch (_) {
    await context.reply(textCategory(group, index, groups.length));
  }
}

module.exports = {
  command: 'menu',
  aliases: ['m', 'allmenu'],
  category: 'system',
  description: 'Show a professional clickable live command menu.',
  commandGroups,
  async handler(sock, message, args, context) {
    const groups = commandGroups(context.registry);
    const requested = String(args[0] || '').trim();
    if (!requested || requested === '0') return sendMainMenu(context, groups);
    const index = Number(requested) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= groups.length) return context.reply(`❌ Category not found. Use \`menu\` to view categories 1-${groups.length || 1}.`);
    return sendCategoryMenu(context, groups, index);
  }
};
