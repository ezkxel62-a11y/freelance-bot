import { supabase } from '../db/supabaseClient.js';

export async function topupHandler(ctx) {
  const id = ctx.from.id.toString();
  
  // Gunakan URL dinamis dari Vercel
  const qrisUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/qris-aurora.png`
    : 'https://your-domain.com/qris-aurora.png';
  
  await ctx.replyWithPhoto(qrisUrl, {
    caption: '💰 *TOP UP SALDO*\nBayar ke AURORA GROWT DIGITAL\nKirim bukti transfer dengan caption: *topup|jumlah*',
    parse_mode: 'Markdown'
  });
}

export async function kirimBuktiHandler(ctx) {
  const id = ctx.from.id.toString();
  const text = ctx.message.text;
  
  if (!text || !text.startsWith('topup|')) return;
  
  const [, jumlah] = text.split('|');
  const foto = ctx.message.photo?.[0]?.file_id;
  
  if (!foto) {
    await ctx.reply('❌ Kirim foto bukti transfer.');
    return;
  }
  
  // Simpan ke database
  await supabase.from('topup').insert({
    telegram_id: id,
    jumlah: parseInt(jumlah),
    bukti_url: foto
  });
  
  await ctx.reply('✅ Bukti terkirim, menunggu verifikasi.');
  
  // Kirim notifikasi ke admin langsung dari sini
  try {
    await ctx.telegram.sendMessage(
      process.env.ADMIN_ID,
      `💰 *TOP UP REQUEST*\nDari: ${ctx.from.id}\nUsername: @${ctx.from.username || '-'}\nJumlah: Rp ${parseInt(jumlah).toLocaleString()}\nBukti: (cek database)`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Gagal kirim notifikasi admin:', error.message);
  }
}