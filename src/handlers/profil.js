import { getOrCreateUser } from '../models/userModel.js';

export async function profilHandler(ctx) {
  await ctx.answerCbQuery(); // ← TAMBAHKAN INI
  
  const id = ctx.from.id.toString();
  const user = await getOrCreateUser(id);
  if (!user) {
    await ctx.reply('❌ Data tidak ditemukan. Silakan daftar ulang dengan /start');
    return;
  }
  await ctx.replyWithMarkdown(
    `👤 *Profil*\nNama: ${user.nama || '-'}\nRekening: ${user.nomor_rekening || '-'}\nSaldo: Rp ${user.saldo.toLocaleString()}`
  );
}