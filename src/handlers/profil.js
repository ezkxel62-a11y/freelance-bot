import { getOrCreateUser } from '../models/userModel.js';
export async function profilHandler(ctx) {
  const id = ctx.from.id.toString();
  const user = await getOrCreateUser(id);
  await ctx.replyWithMarkdown(`👤 *Profil*\nNama: ${user.nama||'-'}\nRekening: ${user.nomor_rekening||'-'}\nSaldo: Rp ${user.saldo.toLocaleString()}`);
}
