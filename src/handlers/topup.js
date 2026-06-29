import { supabase } from '../db/supabaseClient.js';
export async function topupHandler(ctx) {
  const id = ctx.from.id.toString();
  // Kirim gambar QRIS (pakai URL publik)
  await ctx.replyWithPhoto('https://your-domain.com/qris-aurora.png', {
    caption: '💰 *TOP UP SALDO*\nBayar ke AURORA GROWT DIGITAL\nKirim bukti transfer dengan caption: *topup|jumlah*',
    parse_mode: 'Markdown'
  });
}
export async function kirimBuktiHandler(ctx) {
  const id = ctx.from.id.toString();
  const text = ctx.message.text;
  if (!text.startsWith('topup|')) return;
  const [, jumlah] = text.split('|');
  const foto = ctx.message.photo?.[0]?.file_id;
  if (!foto) return ctx.reply('Kirim foto bukti.');
  await supabase.from('topup').insert({
    telegram_id: id,
    jumlah: parseInt(jumlah),
    bukti_url: foto
  });
  await ctx.reply('✅ Bukti terkirim, menunggu verifikasi.');
  // Kirim ke admin via index
}
