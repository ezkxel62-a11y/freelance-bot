import { getRandomSoal } from '../utils/randomSoal.js';
import { saldoBenar, saldoSalah } from '../utils/saldoAcak.js';
import { updateSaldo, getSaldo } from '../models/userModel.js';
import { supabase } from '../db/supabaseClient.js';

const sesiSoal = new Map();

export async function mulaiSoal(ctx) {
  await ctx.answerCbQuery(); // ← TAMBAHKAN INI
  
  const id = ctx.from.id.toString();
  const saldo = await getSaldo(id);
  if (saldo >= 50000) {
    await ctx.replyWithMarkdown('⏳ *Sedang update soal baru*... Harap top up 50rb untuk melanjutkan.');
    return;
  }
  const soalList = getRandomSoal();
  sesiSoal.set(id, { index: 0, soalList });
  await kirimSoal(ctx, id);
}

async function kirimSoal(ctx, id) {
  const sesi = sesiSoal.get(id);
  if (!sesi || sesi.index >= sesi.soalList.length) {
    await ctx.reply('🎉 Selesai! Saldo bertambah.');
    return;
  }
  const soal = sesi.soalList[sesi.index];
  const pilihan = soal.pilihan.map((p, i) => ([{ text: p, callback_data: `jawab_${soal.id}_${i}` }]));
  await ctx.replyWithMarkdown(`*${sesi.index+1}. ${soal.soal}*`, {
    reply_markup: { inline_keyboard: pilihan }
  });
}

export async function jawabHandler(ctx) {
  await ctx.answerCbQuery(); // ← TAMBAHKAN INI
  
  const id = ctx.from.id.toString();
  const data = ctx.callbackQuery.data;
  const [, soalId, jawabanIdx] = data.split('_').map(Number);
  const sesi = sesiSoal.get(id);
  if (!sesi) {
    await ctx.reply('Sesi habis, mulai ulang.');
    return;
  }
  const soal = sesi.soalList.find(s => s.id === soalId);
  if (!soal) {
    await ctx.reply('Soal tidak ditemukan.');
    return;
  }
  const benar = (soal.jawaban === jawabanIdx);
  const poin = benar ? saldoBenar() : 1000;
  await updateSaldo(id, poin);
  await supabase.from('jawaban_user').insert({
    telegram_id: id,
    soal_id: soalId,
    jawaban_user: soal.pilihan[jawabanIdx],
    benar,
    poin_dapat: poin
  });
  
  // Kirim notifikasi jawaban
  await ctx.replyWithMarkdown(
    benar ? `✅ Benar! +Rp ${poin.toLocaleString()}` : `❌ Salah +Rp 1.000`
  );
  
  sesi.index++;
  await kirimSoal(ctx, id);
}