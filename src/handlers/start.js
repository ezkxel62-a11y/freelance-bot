import { getOrCreateUser } from '../models/userModel.js';

export async function startHandler(ctx) {
  try {
    const id = ctx.from.id.toString();
    const user = await getOrCreateUser(id);
    
    if (!user || !user.nama) {
      await ctx.replyWithMarkdown(
        '*Selamat datang di FREELANCE JAWAB SOAL!*\n\n' +
        'Kami adalah platform freelance pengisi soal.\n\n' +
        'Silakan isi data diri:\n' +
        '1. Nama lengkap\n' +
        '2. Nomor rekening (Bank/E-Wallet)\n\n' +
        'Ketik: *nama|nomor_rekening*'
      );
      return;
    }
    
    await ctx.replyWithMarkdown(
      `Halo *${user.nama}*, selamat kembali! \nSaldo: Rp ${user.saldo.toLocaleString()}`
    );
    await showMenu(ctx);
  } catch (error) {
    console.error('❌ Error startHandler:', error.message);
    await ctx.reply('⚠️ Terjadi kesalahan. Coba lagi.');
  }
}

export async function inputDataHandler(ctx) {
  try {
    const id = ctx.from.id.toString();
    const text = ctx.message.text;
    
    if (!text || !text.includes('|')) {
      await ctx.reply('❌ Format salah. Gunakan: Nama|Nomor Rekening');
      return;
    }
    
    const [nama, rekening] = text.split('|');
    if (!nama.trim() || !rekening.trim()) {
      await ctx.reply('❌ Nama dan rekening tidak boleh kosong.');
      return;
    }
    
    const user = await getOrCreateUser(id, nama.trim(), rekening.trim());
    
    if (!user) {
      await ctx.reply('❌ Gagal menyimpan data. Coba lagi.');
      return;
    }
    
    await ctx.replyWithMarkdown('✅ *Data tersimpan!*');
    
    await ctx.replyWithMarkdown(
      `Halo *${user.nama}*, selamat bergabung di FRELANCE JAWAB SOAL!\nSaldo: Rp ${user.saldo.toLocaleString()}`
    );
    await showMenu(ctx);
  } catch (error) {
    console.error('❌ Error inputDataHandler:', error.message);
    await ctx.reply('⚠️ Terjadi kesalahan. Coba lagi.');
  }
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