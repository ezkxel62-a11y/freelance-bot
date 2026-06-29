import { supabase } from '../db/supabaseClient.js';

export async function komplainHandler(ctx) {
  await ctx.answerCbQuery(); // ← TAMBAHKAN INI
  
  await ctx.reply('Silakan ketik pesan komplain Anda:');
  // Set session agar text berikutnya dianggap komplain
  ctx.session = ctx.session || {};
  ctx.session.komplain = true;
}

export async function simpanKomplain(ctx) {
  const id = ctx.from.id.toString();
  const pesan = ctx.message.text;
  
  if (!pesan || pesan.length < 3) {
    await ctx.reply('❌ Pesan komplain terlalu pendek. Minimal 3 karakter.');
    return;
  }
  
  await supabase.from('komplain').insert({ telegram_id: id, pesan });
  await ctx.reply('✅ Komplain terkirim ke admin.');
  
  // Kirim ke admin
  try {
    await ctx.telegram.sendMessage(
      process.env.ADMIN_ID,
      `⚠️ *KOMPLAIN BARU*\nDari: ${ctx.from.id}\nUsername: @${ctx.from?.username || '-'}\nPesan: ${pesan}`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Gagal kirim notifikasi:', error.message);
  }
  
  // Reset session
  ctx.session.komplain = false;
}