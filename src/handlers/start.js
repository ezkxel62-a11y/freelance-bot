import { getOrCreateUser } from '../models/userModel.js';

export async function startHandler(ctx) {
  const id = ctx.from.id.toString();
  const user = await getOrCreateUser(id);
  
  // Jika user NULL → minta data diri
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
  
  // User sudah ada → tampilkan menu
  await ctx.replyWithMarkdown(
    `Halo *${user.nama}*, selamat kembali! \nSaldo: Rp ${user.saldo.toLocaleString()}`
  );
  await showMenu(ctx);
}

export async function inputDataHandler(ctx) {
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
  
  // Simpan ke database dan ambil data user yang sudah tersimpan
  const user = await getOrCreateUser(id, nama.trim(), rekening.trim());
  
  if (!user) {
    await ctx.reply('❌ Gagal menyimpan data. Coba lagi.');
    return;
  }
  
  await ctx.replyWithMarkdown('✅ *Data tersimpan!*');
  
  // Tampilkan menu utama LANGSUNG
  await ctx.replyWithMarkdown(
    `Halo *${user.nama}*, selamat bergabung di FRELANCE JAWAB SOAL!\nSaldo: Rp ${user.saldo.toLocaleString()}`
  );
  await showMenu(ctx);
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