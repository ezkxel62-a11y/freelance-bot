import { getSaldo } from '../models/userModel.js';
export async function tarikHandler(ctx) {
  const id = ctx.from.id.toString();
  const saldo = await getSaldo(id);
  if (saldo < 100000) {
    await ctx.replyWithMarkdown('❌ *Minimal tarik tunai Rp 100.000* \nSilakan isi soal lebih banyak.');
    return;
  }
  await ctx.replyWithMarkdown('📤 *Permintaan tarik tunai Rp '+saldo+' dikirim ke admin.*');
  // kirim notif ke admin (nanti di index)
}
