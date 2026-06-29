import { getSaldo } from '../models/userModel.js';

export async function tarikHandler(ctx) {
  try {
    await ctx.answerCbQuery();
    
    const id = ctx.from.id.toString();
    const saldo = await getSaldo(id);
    if (saldo < 100000) {
      await ctx.replyWithMarkdown('❌ *Minimal tarik tunai Rp 100.000*\nSilakan isi soal lebih banyak.');
      return;
    }
    await ctx.replyWithMarkdown(`📤 *Permintaan tarik tunai Rp ${saldo.toLocaleString()} dikirim ke admin.*`);
    
    try {
      await ctx.telegram.sendMessage(
        process.env.ADMIN_ID,
        `💰 *TARIK TUNAI*\nDari: ${ctx.from.id}\nJumlah: Rp ${saldo.toLocaleString()}`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Gagal kirim notifikasi admin:', error.message);
    }
  } catch (error) {
    console.error('❌ Error tarikHandler:', error.message);
    await ctx.reply('⚠️ Terjadi kesalahan. Coba lagi.');
  }
}