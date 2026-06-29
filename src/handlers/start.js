import { getOrCreateUser } from '../models/userModel.js';
export async function startHandler(ctx) {
  const id = ctx.from.id.toString();
  let user = await getOrCreateUser(id);
  if (!user.nama) {
    await ctx.replyWithMarkdown('*Selamat datang di FRELANCE JAWAB SOAL!* \n\nKami adalah platform freelance pengisi soal. \n\nSilakan isi data diri: \n1. Nama lengkap \n2. Nomor rekening (Bank/E-Wallet) \n\nKetik: *nama|nomor_rekening*');
    return;
  }
  await ctx.replyWithMarkdown();
  showMenu(ctx);
}
async function showMenu(ctx) {
  await ctx.replyWithMarkdown('📋 *Menu Utama*', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📝 Mulai Freelance (Soal)', callback_data: 'mulai_soal' }],
        [{ text: '👤 Profil', callback_data: 'profil' }, { text: '💰 Top Up', callback_data: 'topup' }],
        [{ text: '💸 Tarik Tunai', callback_data: 'tarik' }, { text: '⚠️ Komplain', callback_data: 'komplain' }],
        [{ text: '📜 Syarat & Ketentuan', callback_data: 'syarat' }]
      ]
    }
  });
}
export async function inputDataHandler(ctx) {
  const id = ctx.from.id.toString();
  const [nama, rekening] = ctx.message.text.split('|');
  if (!nama || !rekening) {
    await ctx.reply('Format salah. Gunakan: Nama|Nomor Rekening');
    return;
  }
  await getOrCreateUser(id, nama.trim(), rekening.trim());
  await ctx.reply('✅ Data tersimpan!');
  await startHandler(ctx);
}
