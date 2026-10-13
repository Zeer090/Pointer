const text1 = `✅ Aspirasi Sudah Dicatat!
Rincian Aspirasi:
● Kategori: Beasiswa
● Isi: "Tolong permudah mahasiswa untuk mendapatkan beasiswa"`;

const text2 = `✅ Aspirasi Diperbarui
Baik, Raffi. Aspirasimu telah diperjelas dan kami catat dengan detail berikut:

● Kategori: Beasiswa
● Isi Aspirasi: "Meminta kampus untuk mengumumkan informasi beasiswa (internal & eksternal) lebih awal agar mahasiswa memiliki waktu yang cukup untuk mempersiapkan berkas dan administrasi."`;

for (const [idx, t] of [text1, text2].entries()) {
  console.log(`\n--- TEST ${idx + 1} ---`);
  const catM = t.match(/(?:^|\b|\*|●|•)(?:Kategori|Bidang)\s*:\s*(?:🏷️\s*)?([A-Za-z\s]+?)(?:\n|\r|\*|●|<|$)/i);
  const msgM = t.match(/(?:^|\b|\*|●|•)(?:Isi(?:\s+Aspirasi)?|Pesan)\s*:\s*["*]?([^\n\r*"]+)["*]?/i);
  console.log("Cat:", catM ? catM[1].trim() : null);
  console.log("Msg:", msgM ? msgM[1].trim() : null);
}
