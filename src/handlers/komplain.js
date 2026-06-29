import { supabase } from '../db/supabaseClient.js';

export async function komplainHandler(ctx) {
  try {
    await ctx.answerCbQuery();
    
    await ctx.reply('📝 Silakan ketik pesan komplain Anda:');
    ctx.session = ctx.session || {};
    ctx.session.komplain = true;
  } catch (error) {
    console.error('❌ Error komplainHandler:', error.message);
    await ctx.reply('⚠️ Terjadi kesalahan. Coba lagi.');
  }
}

export async function simpanKomplain(ctx) {
  try {
    const id = ctx.from.id.toString();
    const pesan = ctx.message.text;
    
    if (!pesan || pesan.length < 3) {
      await ctx.reply('❌ Pesan komplain terlalu pendek. Minimal 3 karakter.');
      return;
    }
    
    await supabase.from('komplain').insert({ telegram_id: id, pesan });
    await ctx.reply('✅ Komplain terkirim ke admin.');
    
    try {
      await ctx.telegram.sendMessage(
        process.env.ADMIN_ID,
        `⚠️ *KOMPLAIN BARU*\nDari: ${ctx.from.id}\nUsername: @${ctx.from?.username || '-'}\nPesan: ${pesan}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Gagal kirim notifikasi:', error.message);
    }
    
    ctx.session.komplain = false;
  } catch (error) {
    console.error('❌ Error simpanKomplain:', error.message);
    await ctx.reply('⚠️ Terjadi kesalahan. Coba lagi.');
  }
}