const { cmd } = require("../command.js");

// __filename and __dirname are already available in CJS
// No need for fileURLToPath or path

// helper
const getNums = (args) =>
  args.map(n => Number(n)).filter(n => !isNaN(n));


/* ================= SQRT ================= */

cmd({
  pattern: "sqrt",
  desc: "Square root",
  category: "math",
  react: "📐",
  filename: __filename
},
async (conn, mek, m, { args, reply }) => {

  if (!args[0]) return reply("Example:\n.sqrt 144");

  const num = Number(args[0]);

  reply(`📐 √${num} = ${Math.sqrt(num)}`);
});


/* ================= POWER ================= */

cmd({
  pattern: "power",
  desc: "Power calculation",
  category: "math",
  react: "⚡",
  filename: __filename
},
async (conn, mek, m, { args, reply }) => {

  if (args.length < 2)
    return reply("Example:\n.power 2 5");

  const base = Number(args[0]);
  const exp = Number(args[1]);

  reply(`⚡ ${base}^${exp} = ${Math.pow(base, exp)}`);
});


/* ================= PERCENT ================= */

cmd({
  pattern: "percent",
  desc: "Percentage calculator",
  category: "math",
  react: "📊",
  filename: __filename
},
async (conn, mek, m, { args, reply }) => {

  if (args.length < 2)
    return reply("Example:\n.percent 50 200");

  const result = (Number(args[0]) / Number(args[1])) * 100;

  reply(`📊 ${args[0]} is ${result}% of ${args[1]}`);
});


/* ================= TABLE ================= */

cmd({
  pattern: "table",
  desc: "Multiplication table",
  category: "math",
  react: "📋",
  filename: __filename
},
async (conn, mek, m, { args, reply }) => {

  if (!args[0])
    return reply("Example:\n.table 7");

  const num = Number(args[0]);

  let text = `📋 Table of ${num}\n\n`;

  for (let i = 1; i <= 10; i++)
    text += `${num} × ${i} = ${num * i}\n`;

  reply(text);
});


/* ================= FACTORIAL ================= */

cmd({
  pattern: "factorial",
  desc: "Factorial",
  category: "math",
  react: "❗",
  filename: __filename
},
async (conn, mek, m, { args, reply }) => {

  if (!args[0])
    return reply("Example:\n.factorial 5");

  let n = Number(args[0]);
  let result = 1;

  for (let i = 2; i <= n; i++)
    result *= i;

  reply(`❗ ${n}! = ${result}`);
});


/* ================= RANDOM ================= */

cmd({
  pattern: "random",
  desc: "Random number",
  category: "math",
  react: "🎲",
  filename: __filename
},
async (conn, mek, m, { args, reply }) => {

  if (args.length < 2)
    return reply("Example:\n.random 1 100");

  const min = Number(args[0]);
  const max = Number(args[1]);

  const rand =
    Math.floor(Math.random() * (max - min + 1)) + min;

  reply(`🎲 Random number: ${rand}`);
});


/* ================= AVERAGE ================= */

cmd({
  pattern: "average",
  desc: "Average",
  category: "math",
  react: "📉",
  filename: __filename
},
async (conn, mek, m, { args, reply }) => {

  if (!args.length)
    return reply("Example:\n.average 10 20 30");

  const nums = getNums(args);

  const avg =
    nums.reduce((a, b) => a + b, 0) / nums.length;

  reply(`📉 Average = ${avg}`);
});


/* ================= MAX ================= */

cmd({
  pattern: "max",
  desc: "Maximum number",
  category: "math",
  react: "🔼",
  filename: __filename
},
async (conn, mek, m, { args, reply }) => {

  if (!args.length)
    return reply("Example:\n.max 5 9 2");

  const nums = getNums(args);

  reply(`🔼 Max = ${Math.max(...nums)}`);
});


/* ================= MIN ================= */

cmd({
  pattern: "min",
  desc: "Minimum number",
  category: "math",
  react: "🔽",
  filename: __filename
},
async (conn, mek, m, { args, reply }) => {

  if (!args.length)
    return reply("Example:\n.min 5 9 2");

  const nums = getNums(args);

  reply(`🔽 Min = ${Math.min(...nums)}`);
});