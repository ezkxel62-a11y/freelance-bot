const bankSoal = [
  { id:1, soal:'Apa ibu kota Indonesia?', pilihan:['Jakarta','Bandung','Surabaya'], jawaban:0 },
  { id:2, soal:'2+2=?', pilihan:['3','4','5'], jawaban:1 },
  // ... sampai 50 soal (saya singkat, kamu tambah sendiri atau minta tambahan)
];
export function getRandomSoal() {
  return bankSoal.sort(() => Math.random() - 0.5).slice(0,50);
}
