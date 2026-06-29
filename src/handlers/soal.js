import { getRandomSoal } from '../utils/randomSoal.js';
import { saldoBenar, saldoSalah } from '../utils/saldoAcak.js';
import { updateSaldo, getSaldo } from '../models/userModel.js';
import { supabase } from '../db/supabaseClient.js';

const sesiSoal = new Map(); // telegram_id -> { index, soalList }

export async function mulaiSoal(ctx) {
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
    await ctx.answerCbQuery();
    return;
  }
  const soal = sesi.soalList[sesi.index];
  const pilihan = soal.pilihan.map((p, i) => ([{ text: p, callback_data: `jawab_${soal.id}_${i}` }]));
  await ctx.replyWithMarkdown(`*${sesi.index+1}. ${soal.soal}*`, {
    reply_markup: { inline_keyboard: pilihan }
  });
}

export async function jawabHandler(ctx) {
  const id = ctx.from.id.toString();
  const data = ctx.callbackQuery.data; // jawab_2_1
  const [, soalId, jawabanIdx] = data.split('_').map(Number);
  const sesi = sesiSoal.get(id);
  if (!sesi) return ctx.answerCbQuery('Sesi habis, mulai ulang.');
  const soal = sesi.soalList.find(s => s.id === soalId);
  const benar = (soal.jawaban === jawabanIdx);
  const poin = benar ? saldoBenar() : 1000;
  await updateSaldo(id, poin);
  // Simpan riwayat
  await supabase.from('jawaban_user').insert({
    telegram_id: id,
    soal_id: soalId,
    jawaban_user: soal.pilihan[jawabanIdx],
    benar,
    poin_dapat: poin
  });
  await ctx.answerCbQuery(benar ? '✅ Benar! +Rp '+poin : '❌ Salah +Rp 1.000');
  sesi.index++;
  await kirimSoal(ctx, id);
}
