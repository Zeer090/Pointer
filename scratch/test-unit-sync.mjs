import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ekstrak logika handleAiReplyWithDatabaseSync untuk unit test akurasi
async function testSyncLogic() {
  console.log("=== UNIT TEST handleAiReplyWithDatabaseSync ===");
  const currentUserName = "Raffi Ramadhan Oktaviansyah";

  // Skenario 1: Respon persis dari Screenshot User Tahap 2
  const replyTahap2 = `✅ Aspirasi Sudah Dicatat!
Terima kasih, Raffi. Aspirasimu telah berhasil kami terima dan akan diteruskan kepada Divisi PSDAM untuk ditindaklanjuti.

Rincian Aspirasi:
● Kategori: Beasiswa
● Isi: "Tolong permudah mahasiswa untuk mendapatkan beasiswa"

Saran Tindak Lanjut dari POINTER AI:
1. Sosialisasi Dini
2. Pembekalan Dokumen
3. Mentoring`;

  console.log("\n[Test 1: Respon Tahap 2]");
  const isCreatedMatch = /(?:Aspirasi\s+(?:Sudah|Telah|Berhasil)\s+(?:Dicatat|Diterima|Tersimpan|Dikirim)|Aspirasimu\s+(?:sudah|telah|berhasil)\s+(?:kami\s+terima|tersimpan|dicatat))/i.test(replyTahap2);
  const catMatch = replyTahap2.match(/(?:^|\b|\*|●|•)(?:Kategori|Bidang)\s*:\s*(?:🏷️\s*)?([A-Za-z\s]+?)(?:\n|\r|\*|●|<|$)/i);
  const msgMatch = replyTahap2.match(/(?:^|\b|\*|●|•)(?:Isi(?:\s+Aspirasi)?|Pesan)\s*:\s*["*]?([^\n\r*"]+)["*]?/i);

  console.log("isCreatedMatch:", isCreatedMatch);
  console.log("Extracted Category:", catMatch?.[1]?.trim());
  console.log("Extracted Message:", msgMatch?.[1]?.trim());

  if (!isCreatedMatch || catMatch?.[1]?.trim() !== "Beasiswa" || msgMatch?.[1]?.trim() !== "Tolong permudah mahasiswa untuk mendapatkan beasiswa") {
    console.error("❌ Gagal ekstraksi tahap 2!");
    process.exit(1);
  }
  console.log("✅ Ekstraksi Tahap 2 Sempurna!");

  // Skenario 2: Respon persis dari Screenshot User Tahap 3
  const replyTahap3 = `✅ Aspirasi Diperbarui
Baik, Raffi. Aspirasimu telah diperjelas dan kami catat dengan detail berikut:

● Kategori: Beasiswa
● Isi Aspirasi: "Meminta kampus untuk mengumumkan informasi beasiswa (internal & eksternal) lebih awal agar mahasiswa memiliki waktu yang cukup untuk mempersiapkan berkas dan administrasi."

Aspirasi ini akan diteruskan ke Divisi PSDAM untuk dikoordinasikan.`;

  console.log("\n[Test 2: Respon Tahap 3 (Update)]");
  const isUpdatedMatch = /(?:Aspirasi\s+Diperbarui|Aspirasimu\s+telah\s+diperjelas|Aspirasi\s+berhasil\s+diperbarui)/i.test(replyTahap3);
  const catMatch3 = replyTahap3.match(/(?:^|\b|\*|●|•)(?:Kategori|Bidang)\s*:\s*(?:🏷️\s*)?([A-Za-z\s]+?)(?:\n|\r|\*|●|<|$)/i);
  const msgMatch3 = replyTahap3.match(/(?:^|\b|\*|●|•)(?:Isi(?:\s+Aspirasi)?|Pesan)\s*:\s*["*]?([^\n\r*"]+)["*]?/i);

  console.log("isUpdatedMatch:", isUpdatedMatch);
  console.log("Extracted Category 3:", catMatch3?.[1]?.trim());
  console.log("Extracted Message 3:", msgMatch3?.[1]?.trim());

  if (!isUpdatedMatch || catMatch3?.[1]?.trim() !== "Beasiswa" || !msgMatch3?.[1]?.trim().includes("Meminta kampus untuk mengumumkan")) {
    console.error("❌ Gagal ekstraksi tahap 3!");
    process.exit(1);
  }
  console.log("✅ Ekstraksi Tahap 3 Sempurna!");

  await prisma.$disconnect();
}

testSyncLogic().catch(console.error);
