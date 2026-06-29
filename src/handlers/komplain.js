import { supabase } from '../db/supabaseClient.js';
export async function komplainHandler(ctx) {
  await ctx.reply('Silakan ketik pesan komplain Anda:');
  // tangkap di index via text
}
export async function simpanKomplain(ctx) {
  const id = ctx.from.id.toString();
  const pesan = ctx.message.text;
  await supabase.from('komplain').insert({ telegram_id: id, pesan });
  await ctx.reply('✅ Komplain terkirim ke admin.');
  // forward ke admin
}
