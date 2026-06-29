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

// ===== HANYA SET WEBHOOK 1 KALI =====
// JANGAN panggil di dalam handler request!
const WEBHOOK_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/webhook`
  : null;

if (WEBHOOK_URL) {
  // Set webhook sekali saat startup (bukan per request)
  try {
    await bot.telegram.setWebhook(WEBHOOK_URL);
    console.log(`✅ Webhook set ke: ${WEBHOOK_URL}`);
  } catch (err) {
    console.error('❌ Gagal set webhook:', err.message);
  }
} else {
  // Mode polling untuk lokal
  await bot.launch();
  console.log('🚀 Bot running with polling');
}

// Middleware logging
bot.use(async (ctx, next) => {
  console.log(`📩 [${new Date().toISOString()}] ${ctx.from?.id}`);
  await next();
});

bot.start(startHandler);

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  if (!text) return;
  if (text.includes('|') && !text.startsWith('topup|')) {
    return inputDataHandler(ctx);
  }
  if (text.startsWith('topup|')) {
    return kirimBuktiHandler(ctx);
  }
  if (ctx.session?.komplain) {
    return simpanKomplain(ctx);
  }
});

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
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

app.get('/', (req, res) => {
  res.status(200).send('Bot is running!');
});

export default app;

// Jalankan lokal
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL_URL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Bot running on http://localhost:${PORT}`);
  });
}