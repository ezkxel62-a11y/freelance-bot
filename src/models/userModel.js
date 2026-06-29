import { supabase } from '../db/supabaseClient.js';

export async function getOrCreateUser(telegram_id, nama=null, rekening=null) {
  let { data } = await supabase.from('users').select('*').eq('telegram_id', telegram_id);
  if (data && data.length>0) return data[0];
  const { data: newUser } = await supabase.from('users').insert({ telegram_id, nama, nomor_rekening: rekening }).select();
  return newUser[0];
}

export async function updateSaldo(telegram_id, tambahan) {
  const user = await getOrCreateUser(telegram_id);
  const baru = user.saldo + tambahan;
  await supabase.from('users').update({ saldo: baru }).eq('telegram_id', telegram_id);
  return baru;
}
export async function getSaldo(telegram_id) {
  const { data } = await supabase.from('users').select('saldo').eq('telegram_id', telegram_id);
  return data?.[0]?.saldo || 0;
}
