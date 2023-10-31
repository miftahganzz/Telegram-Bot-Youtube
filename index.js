/*
Thanks To 
My God
My Parent
Miftah GanzZ (ME)
Module Provider
All User Use This Source

Note: This Source Free For ALL. And Open Source So You Can Edit Or Add Other Feature.
I'm update just i want :v
*/

const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');
const cron = require('node-cron');

const setting = require('./setting.js');

const bot = new Telegraf(setting.tokenBot);

const trackedCommands = ['play', 'playvideo', 'playaudio', 'ytmp3', 'ytmp4', 'yts', 'ytl'];

const totalHit = {};
const hitToday = {};

const dataPath = './db/hit.json';

// Function nya
function extractVideoId(url) {
  const regex = /[?&]v=([^&]+)/;
  const match = url.match(regex);
  if (match) {
    return match[1];
  }
  return null;
}

function addHit(userId, command) {
  if (!totalHit[userId]) {
    totalHit[userId] = 0;
  }
  if (!hitToday[userId]) {
    hitToday[userId] = { hits: 0, date: new Date().getDate() };
  } else {
    const today = new Date().getDate();
    if (today !== hitToday[userId].date) {
      hitToday[userId].hits = 0;
      hitToday[userId].date = today;
    }
  }
  totalHit[userId]++;
  hitToday[userId].hits++;
}

function saveHitData() {
  const dataToSave = { totalHit, hitToday };
  fs.writeFileSync(dataPath, JSON.stringify(dataToSave, null, 2));
}

if (fs.existsSync(dataPath)) {
  const savedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  if (savedData.totalHit) totalHit = savedData.totalHit;
  if (savedData.hitToday) hitToday = savedData.hitToday;
  console.log('Data Hit Loaded');
}

// YTTA
bot.use((ctx, next) => {
  if (ctx.update.message) {
    const userId = ctx.update.message.from.id;
    const command = ctx.update.message.text.split(' ')[0].substring(1);
    if (trackedCommands.includes(command)) {
      addHit(userId, command);
    }
  }
  next();
});

bot.command('totalhit', (ctx) => {
  const userId = ctx.from.id;
  const total = totalHit[userId] || 0;
  const today = hitToday[userId] ? hitToday[userId].hits : 0;
  ctx.reply(`Total Hit: ${total}\nHit Today: ${today}`);
});

cron.schedule('0 0 * * *', () => {
  for (const userId in hitToday) {
    hitToday[userId].hits = 0;
  }
  console.log('Reset Hit Today');
});

// command bot
bot.start((ctx) => {
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;
  const total = totalHit[userId] || 0;
  const today = hitToday[userId] ? hitToday[userId].hits : 0;
  
  const welcomeMessage = `Halo Kak ${ctx.from.first_name} ${ctx.from.last_name}, Selamat datang di Bot Youtube'in.\n\nTotal Hit: ${total}\nToday Hit: ${today}`;
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Play Audio', callback_data: 'playaudio' },
          { text: 'Play', callback_data: 'play' },
          { text: 'Play Video', callback_data: 'playvideo' }
        ],
        [
         { text: 'Ytmp3', callback_data: 'ytmp3' }, 
         { text: 'Ytmp4', callback_data: 'ytmp4' }
        ],
        [
          { text: 'YT Lyric', callback_data: 'ytl' },
          { text: 'YT Search', callback_data: 'yts' }
        ],
      ]
    },
  };
  bot.telegram.sendChatAction(chatId, 'typing');
  ctx.reply(welcomeMessage, keyboard);
});

bot.action('play', async (ctx) => {
  await ctx.editMessageText('Gunakan Perintah /play judul');
});

bot.action('playvideo', async (ctx) => {
  await ctx.editMessageText('Gunakan Perintah /playvideo judul_video');
});

bot.action('playaudio', async (ctx) => {
  await ctx.editMessageText('Gunakan Perintah /playaudio judul_music');
});

bot.action('ytmp3', async (ctx) => {
  await ctx.editMessageText('Gunakan Perintah /ytmp3 url_video');
});

bot.action('ytmp4', async (ctx) => {
  await ctx.editMessageText('Gunakan Perintah /ytmp4 url_video');
});

bot.action('yts', async (ctx) => {
  await ctx.editMessageText('Gunakan Perintah /yts judul');
});

bot.action('ytl', async (ctx) => {
  await ctx.editMessageText('Gunakan Perintah /ytl judul_lagu');
});

// Fitur nya
bot.command('play', async (ctx) => {
  const chatId = ctx.chat.id;
  const Title = ctx.message.text.split(' ').slice(1).join(' ');
  const apiUrl = `${setting.miftahapi}download/play-youtube-video2?title=${encodeURIComponent(Title)}&apikey=${setting.apikey}`;
  const apiUrl2 = `${setting.miftahapi}download/play-youtube-audio2?title=${encodeURIComponent(Title)}&apikey=${setting.apikey}`;

  if (!Title) {
    ctx.reply('Gunakan Perintah: /play judul.');
    return;
  }

  bot.telegram.sendChatAction(chatId, 'typing');
  const loadingMessage = await ctx.reply('Sedang mengunduh video & audio...');

  try {
    bot.telegram.sendChatAction(chatId, 'upload_document');
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(response.data, 'base64');
    const videoCaption = `Title: ${Title}`;

    const response2 = await axios.get(apiUrl2, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(response2.data, 'base64');

    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id);

    bot.telegram.sendChatAction(chatId, 'upload_document');
    ctx.replyWithVideo({ source: videoBuffer, caption: videoCaption });
    ctx.replyWithAudio({ source: audioBuffer });

  } catch (error) {
    console.error(error);
    bot.telegram.sendChatAction(chatId, 'typing');
    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id);
    ctx.reply('Maaf, terjadi kesalahan saat mengunduh video atau audio.');
  }
});

bot.command('playaudio', async (ctx) => {
  const chatId = ctx.chat.id;
  const audioTitle = ctx.message.text.split(' ').slice(1).join(' ');
  const apiUrl = `${setting.miftahapi}download/play-youtube-audio2?title=${encodeURIComponent(audioTitle)}&apikey=${setting.apikey}`;

  if (!audioTitle) {
    ctx.reply('Gunakan Perintah: /playaudio judul_audio.');
    return;
  }

  bot.telegram.sendChatAction(chatId, 'typing');
  const loadingMessage = await ctx.reply('🎶 Sedang mengunduh audio...');

  try {
    bot.telegram.sendChatAction(chatId, 'record_audio');
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(response.data, 'base64');

    bot.telegram.sendChatAction(chatId, 'upload_audio');
    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id);
    bot.telegram.sendChatAction(chatId, 'upload_audio');
    ctx.replyWithAudio({ source: audioBuffer});

  } catch (error) {
    console.error(error);
    bot.telegram.sendChatAction(chatId, 'typing');
    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id);
    ctx.reply('Maaf, terjadi kesalahan saat mengunduh audio.');
  }
});

bot.command('playvideo', async (ctx) => {
  const chatId = ctx.chat.id;
  const videoTitle = ctx.message.text.split(' ').slice(1).join(' ');
  const apiUrl = `${setting.miftahapi}download/play-youtube-video2?title=${encodeURIComponent(videoTitle)}&apikey=${setting.apikey}`;

  if (!videoTitle) {
    ctx.reply('Gunakan Perintah: /playvideo judul_video.');
    return;
  }

  bot.telegram.sendChatAction(chatId, 'typing');
  const loadingMessage = await ctx.reply('🎞 Sedang mengunduh video...');

  try {
    bot.telegram.sendChatAction(chatId, 'record_video');
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(response.data, 'base64');

    const videoCaption = `Title: ${videoTitle}`;

    bot.telegram.sendChatAction(chatId, 'upload_video');
    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id);
    bot.telegram.sendChatAction(chatId, 'upload_video');
    ctx.replyWithVideo({ source: videoBuffer, caption: videoCaption });

  } catch (error) {
    console.error(error);
    bot.telegram.sendChatAction(chatId, 'typing');
    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id);
    ctx.reply('Maaf, terjadi kesalahan saat mengunduh video.');
  }
});

bot.command('yts', async (ctx) => {
  const chatId = ctx.chat.id;
  const searchQuery = ctx.message.text.split(' ').slice(1).join(' ');
  if (!searchQuery) {
    ctx.reply('Gunakan Perintah: /yts judul_lagu');
    return;
  }

  try {
    const apiUrl = `${setting.miftahapi}search/youtube?title=${encodeURIComponent(searchQuery)}&apikey=${setting.apikey}`;
    const response = await axios.get(apiUrl);
    const results = response.data.data;

    if (results.length === 0) {
      ctx.reply('Maaf, tidak ada hasil yang ditemukan untuk pencarian ini.');
    } else {
      let message = 'Hasil Pencarian YouTube:\n\n';
      const limit = 10; // Jumlah hasil yang ingin diambil
      for (let i = 0; i < Math.min(limit, results.length); i++) {
        const result = results[i];
        message += `
Title: ${result.title}
Description: ${result.description}
URL: ${result.url}
Views: ${result.views}
Author: ${result.author.name}
Duration: ${result.timestamp}
Upload: ${result.ago}
`;
      }
      ctx.reply(message);
    }
  } catch (error) {
    bot.telegram.sendChatAction(chatId, 'typing');
    console.error(error);
    ctx.reply('Maaf, terjadi kesalahan dalam menjalankan pencarian.');
  }
});

bot.command('ytmp3', async (ctx) => {
  const text = ctx.message.text.split(' ');
  if (text.length < 2) {
    ctx.reply('Gunakan perintah /ytmp3 URL_YOUTUBE.');
    return;
  }

  const loadingMessage = await ctx.reply('Sedang mengunduh audio...');

  const youtubeUrl = text[1];
  const videoId = extractVideoId(youtubeUrl);

  if (!videoId) {
    await ctx.telegram.editMessageText(loadingMessage.chat.id, loadingMessage.message_id, null, 'URL YouTube tidak valid. Pastikan URL memiliki format yang benar.');
    return;
  }

  const apiUrl = `https://yt.downloader.miftahganzz.my.id/${videoId}.mp3?filter=audioonly&quality=highestaudio&contenttype=audio/mp3`;

  try {
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    const audioBuffer = Buffer.from(response.data, 'base64');

    await ctx.telegram.editMessageText(loadingMessage.chat.id, loadingMessage.message_id, null, 'Unduhan selesai. Mengirim audio...');

    ctx.replyWithAudio({ source: audioBuffer });

  } catch (error) {
    console.error(error);
    await ctx.telegram.editMessageText(loadingMessage.chat.id, loadingMessage.message_id, null, 'Maaf, terjadi kesalahan saat mengunduh audio.');
  }
});

bot.command('ytmp4', async (ctx) => {
  const text = ctx.message.text.split(' ');
  if (text.length < 2) {
    ctx.reply('Gunakan perintah /ytmp4 URL_YOUTUBE.');
    return;
  }

  const loadingMessage = await ctx.reply('Sedang mengunduh video...');

  const youtubeUrl = text[1];
  const videoId = extractVideoId(youtubeUrl);

  if (!videoId) {
    await ctx.telegram.editMessageText(loadingMessage.chat.id, loadingMessage.message_id, null, 'URL YouTube tidak valid. Pastikan URL memiliki format yang benar.');
    return;
  }

  const apiUrl = `https://yt.downloader.miftahganzz.my.id/${videoId}.mp4?filter=audioandvideo&quality=highestvideo&contenttype=video/mp4`;

  try {
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(response.data, 'base64');

    await ctx.telegram.editMessageText(loadingMessage.chat.id, loadingMessage.message_id, null, 'Unduhan selesai. Mengirim video...');

    ctx.replyWithVideo({ source: videoBuffer });

  } catch (error) {
    console.error(error);
    await ctx.telegram.editMessageText(loadingMessage.chat.id, loadingMessage.message_id, null, 'Maaf, terjadi kesalahan saat mengunduh video.');
  }
});

bot.launch(
  console.log('</> Bot Sudah On')
);

setInterval(() => {
  saveHitData();
}, 1000);
