import { supabase } from '../db/supabaseClient.js';

export async function getOrCreateUser(telegram_id, nama = null, rekening = null) {
  // Cari user existing
  let { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegram_id);
  
  if (error) {
    console.error('❌ Error get user:', error.message);
    return null;
  }
  
  // Jika user sudah ada, return langsung
  if (data && data.length > 0) {
    return data[0];
  }
  
  // Jika user belum ada dan ada data nama/rekening → insert
  if (nama && rekening) {
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ 
        telegram_id, 
        nama, 
        nomor_rekening: rekening,
        saldo: 0 
      })
      .select();
    
    if (insertError) {
      console.error('❌ Error insert user:', insertError.message);
      return null;
    }
    
    return newUser[0];
  }
  
  // Jika user belum ada tapi tidak ada data → return null (biar handler minta data)
  return null;
}

export async function updateSaldo(telegram_id, tambahan) {
  // Ambil user dulu
  const user = await getOrCreateUser(telegram_id);
  if (!user) return null;
  
  const baru = user.saldo + tambahan;
  const { data, error } = await supabase
    .from('users')
    .update({ saldo: baru })
    .eq('telegram_id', telegram_id)
    .select();
  
  if (error) {
    console.error('❌ Error update saldo:', error.message);
    return null;
  }
  
  return data[0]?.saldo || 0;
}

export async function getSaldo(telegram_id) {
  const { data, error } = await supabase
    .from('users')
    .select('saldo')
    .eq('telegram_id', telegram_id);
  
  if (error) {
    console.error('❌ Error get saldo:', error.message);
    return 0;
  }
  
  return data?.[0]?.saldo || 0;
}