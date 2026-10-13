const text = `✅ Aspirasi Sudah Dicatat!
Terima kasih, Raffi. Aspirasimu telah berhasil kami terima dan akan diteruskan kepada Divisi PSDAM untuk ditindaklanjuti.

Rincian Aspirasi:
● Kategori: Beasiswa
● Isi: "Tolong permudah mahasiswa untuk mendapatkan beasiswa"`;

const lines = text.split("\n");
for (const line of lines) {
  const m = line.match(/(?:^|\b)(?:Isi(?:\s+Aspirasi)?|Pesan)[:\s*]+["*]?([^\n\r*"]+)["*]?/i);
  if (m) {
    console.log("Matched line:", line);
    console.log("Captured:", m[1].trim());
  }
}
