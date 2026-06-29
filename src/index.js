import { Telegraf } from 'telegraf';
import express from 'express';
import dotenv from 'dotenv';
import { startHandler, inputDataHandler } from './handlers/start.js';
import { mulaiSoal, jawabHandler } from './handlers/soal.js';
import { profilHandler } from './handlers/profil.js';
import { tarikHandler } from './handlers/tarik.js';
import { topupHandler, kirimBuktiHandler } from './handlers/topup.js';
import { komplainHandler, simpanKomplain } from './handlers/komplain.js';

dotenv.config();

if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN tidak ditemukan');
  process.exit(1);
}
if (!process.env.ADMIN_ID) {
  console.error('❌ ADMIN_ID tidak ditemukan');
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
app.use(express.json());

// ===== SET WEBHOOK (HANYA 1 KALI SAAT STARTUP) =====
const WEBHOOK_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/webhook`
  : null;

if (WEBHOOK_URL) {
  try {
    await bot.telegram.setWebhook(WEBHOOK_URL);
    console.log(`✅ Webhook set ke: ${WEBHOOK_URL}`);
  } catch (err) {
    console.error('❌ Gagal set webhook:', err.message);
  }
} else {
  // Mode polling untuk lokal
  await bot.launch();
  console.log('🚀 Bot running with polling mode');
}

// ===== LOGGING SEMUA REQUEST =====
app.use((req, res, next) => {
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Middleware logging bot
bot.use(async (ctx, next) => {
  console.log(`📩 [${new Date().toISOString()}] From: ${ctx.from?.id} | Update: ${ctx.updateType}`);
  await next();
});

// Handler start
bot.start(startHandler);

// Handler text
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  if (!text) return;
  console.log(`💬 Text: ${text}`);
  
  if (text.includes('|') && !text.startsWith('topup|')) {
    return inputDataHandler(ctx); // ← ini akan langsung tampilkan menu
  }
  if (text.startsWith('topup|')) {
    return kirimBuktiHandler(ctx);
  }
});

// Action handlers
bot.action('mulai_soal', mulaiSoal);
bot.action(/jawab_\d+_\d+/, jawabHandler);
bot.action('profil', profilHandler);
bot.action('tarik', tarikHandler);
bot.action('topup', topupHandler);
bot.action('komplain', komplainHandler);

bot.action('syarat', async (ctx) => {
  await ctx.replyWithMarkdown(
    '📜 *Syarat & Ketentuan FRELANCE JAWAB SOAL*\n\n' +
    '1. Profesional dan jujur dalam menjawab soal\n' +
    '2. Dilarang melakukan kecurangan dalam bentuk apapun\n' +
    '3. Saldo baru dapat ditarik setelah mencapai minimal Rp 100.000\n' +
    '4. Admin berhak menolak top up tanpa pemberitahuan terlebih dahulu\n' +
    '5. Keputusan admin adalah mutlak\n\n' +
    'Terima kasih telah menggunakan layanan kami 🙏'
  );
});

// Forward komplain ke admin
bot.use(async (ctx, next) => {
  await next();
  if (ctx.message?.text?.toLowerCase().includes('komplain')) {
    try {
      await bot.telegram.sendMessage(
        process.env.ADMIN_ID,
        `⚠️ *KOMPLAIN BARU*\nDari: ${ctx.from?.id}\nUsername: @${ctx.from?.username || '-'}\nPesan: ${ctx.message.text}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Gagal kirim notifikasi:', error.message);
    }
  }
});

// ===== ENDPOINT WEBHOOK =====
app.post('/webhook', async (req, res) => {
  console.log('📨 Webhook received');
  try {
    await bot.handleUpdate(req.body);
    console.log('✅ Update handled');
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(500).send('Error');
  }
});

// ===== HEALTH CHECK =====
app.get('/', (req, res) => {
  res.status(200).send('Bot is running!');
});

// ===== QRIS ROUTE =====
app.get('/qris-aurora.png', (req, res) => {
  res.sendFile('qris-aurora.png', { root: './public' }, (err) => {
    if (err) {
      console.error('❌ QRIS not found:', err.message);
      res.status(404).send('QRIS not found');
    }
  });
});

export default app;

// Jalankan lokal
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL_URL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Bot running on http://localhost:${PORT}`);
  });
}