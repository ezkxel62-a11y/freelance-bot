import { supabase } from '../db/supabaseClient.js';

export async function topupHandler(ctx) {
  try {
    await ctx.answerCbQuery();
    
    // Gunakan URL raw GitHub atau URL Vercel
    const qrisUrl = 'https://raw.githubusercontent.com/ezkxel62-a11y/freelance-bot/main/public/qris-aurora.png';
    
    await ctx.replyWithPhoto(qrisUrl, {
      caption: '💰 *TOP UP SALDO*\nBayar ke AURORA GROWT DIGITAL\n\nKirim bukti transfer dengan caption:\n`topup|jumlah`\n\nContoh: `topup|50000`',
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('❌ Error topupHandler:', error.message);
    await ctx.reply('⚠️ Terjadi kesalahan. Coba lagi.');
  }
}

export async function kirimBuktiHandler(ctx) {
  try {
    const text = ctx.message.text;
    if (!text || !text.startsWith('topup|')) return;
    
    const [, jumlah] = text.split('|');
    const jumlahAngka = parseInt(jumlah);
    if (isNaN(jumlahAngka) || jumlahAngka <= 0) {
      await ctx.reply('❌ Jumlah tidak valid. Gunakan: topup|50000');
      return;
    }
    
    const foto = ctx.message.photo?.[0]?.file_id;
    if (!foto) {
      await ctx.reply('❌ Kirim foto bukti transfer.');
      return;
    }
    
    // Simpan ke database
    const { data, error } = await supabase.from('topup').insert({
      telegram_id: ctx.from.id.toString(),
      jumlah: jumlahAngka,
      bukti_url: foto,
      status: 'pending'
    }).select();
    
    if (error) {
      console.error('❌ Error insert topup:', error.message);
      await ctx.reply('❌ Gagal menyimpan bukti. Coba lagi.');
      return;
    }
    
    await ctx.reply('✅ Bukti terkirim, menunggu verifikasi admin.');
    
    // Kirim ke admin dengan tombol Approve/Tolak
    const approveBtn = {
      text: '✅ Approve',
      callback_data: `approve_topup_${data[0].id}`
    };
    const rejectBtn = {
      text: '❌ Tolak',
      callback_data: `reject_topup_${data[0].id}`
    };
    
    await ctx.telegram.sendMessage(
      process.env.ADMIN_ID,
      `💰 *TOP UP REQUEST*\n` +
      `ID: ${data[0].id}\n` +
      `Dari: ${ctx.from.id}\n` +
      `Username: @${ctx.from?.username || '-'}\n` +
      `Jumlah: Rp ${jumlahAngka.toLocaleString()}\n` +
      `Bukti: (cek database)\n\n` +
      `Klik tombol di bawah untuk approve atau tolak.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Approve', callback_data: `approve_topup_${data[0].id}` }],
            [{ text: '❌ Tolak', callback_data: `reject_topup_${data[0].id}` }]
          ]
        }
      }
    );
  } catch (error) {
    console.error('❌ Error kirimBuktiHandler:', error.message);
    await ctx.reply('⚠️ Terjadi kesalahan. Coba lagi.');
  }
}

// Handler untuk approve/tolak dari admin
export async function approveTopupHandler(ctx) {
  try {
    await ctx.answerCbQuery();
    
    const data = ctx.callbackQuery.data;
    const [, action, id] = data.split('_');
    const topupId = parseInt(id);
    
    if (ctx.from.id.toString() !== process.env.ADMIN_ID) {
      await ctx.reply('❌ Anda bukan admin.');
      return;
    }
    
    if (action === 'approve') {
      // Update status topup
      const { data: topupData, error } = await supabase
        .from('topup')
        .update({ status: 'approved' })
        .eq('id', topupId)
        .select();
      
      if (error) {
        await ctx.reply('❌ Gagal approve.');
        return;
      }
      
      // Tambahkan saldo ke user
      const user = topupData[0];
      await supabase.rpc('add_saldo', {
        user_id: user.telegram_id,
        amount: user.jumlah
      });
      
      await ctx.replyWithMarkdown(`✅ *Top up approved!*\nID: ${topupId}\nSaldo user bertambah Rp ${user.jumlah.toLocaleString()}`);
      
      // Notifikasi ke user
      await ctx.telegram.sendMessage(
        user.telegram_id,
        `✅ *Top up approved!*\nSaldo Anda bertambah Rp ${user.jumlah.toLocaleString()}`,
        { parse_mode: 'Markdown' }
      );
    } else if (action === 'reject') {
      await supabase
        .from('topup')
        .update({ status: 'rejected' })
        .eq('id', topupId);
      
      await ctx.replyWithMarkdown(`❌ *Top up ditolak.*\nID: ${topupId}`);
    }
  } catch (error) {
    console.error('❌ Error approveTopupHandler:', error.message);
    await ctx.reply('⚠️ Terjadi kesalahan.');
  }
}