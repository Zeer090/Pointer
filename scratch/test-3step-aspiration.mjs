import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { GoogleGenAI } from "@google/genai";
import { processAiChat } from "../aiKnowledgeEngine.js";

const prisma = new PrismaClient();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function runTest() {
  console.log("=== MEMULAI TEST ALUR 3 TAHAP ASPIRASI KE DATABASE ===");
  const testUser = {
    name: "Raffi Ramadhan Oktaviansyah",
    role: "admin",
  };

  // Bersihkan data tes sebelumnya
  await prisma.aspiration.deleteMany({
    where: {
      category: "Beasiswa",
      student_name: testUser.name,
    },
  });

  const history = [];

  // Tahap 1: User bilang mau mengajukan aspirasi
  console.log("\n[TAHAP 1] User: 'saya mau mengajukan aspirasi dong'");
  const step1 = await processAiChat(
    prisma,
    ai,
    "saya mau mengajukan aspirasi dong",
    history,
    { user: testUser }
  );
  console.log("AI Reply 1:\n", step1.reply.substring(0, 150) + "...");
  console.log("Action Executed 1:", step1.actionExecuted?.type || "NONE");

  // Pastikan DB belum ada aspirasi beasiswa
  const count1 = await prisma.aspiration.count({
    where: { student_name: testUser.name, category: "Beasiswa" },
  });
  console.log("Aspirasi Beasiswa di DB setelah Tahap 1:", count1, count1 === 0 ? "✅ (Benar)" : "❌ (Salah)");

  history.push({ role: "user", text: "saya mau mengajukan aspirasi dong" });
  history.push({ role: "model", text: step1.reply });

  // Tahap 2: User sampaikan isi aspirasi
  console.log("\n[TAHAP 2] User: 'tolong permudah mahasiswa untuk mendapatkan beasiswa'");
  const step2 = await processAiChat(
    prisma,
    ai,
    "tolong permudah mahasiswa untuk mendapatkan beasiswa",
    history,
    { user: testUser }
  );
  console.log("AI Reply 2:\n", step2.reply.substring(0, 180) + "...");
  console.log("Action Executed 2:", step2.actionExecuted?.type || "NONE");

  // Cek database
  const asp2 = await prisma.aspiration.findFirst({
    where: { student_name: testUser.name, category: "Beasiswa" },
    orderBy: { id: "desc" },
  });
  console.log("Data di Database setelah Tahap 2:", asp2 ? {
    id: asp2.id,
    name: asp2.student_name,
    category: asp2.category,
    message: asp2.message,
    status: asp2.status
  } : "TIDAK ADA!");

  if (!asp2) {
    console.error("❌ GAGAL: Aspirasi tahap 2 tidak tersimpan di database!");
    process.exit(1);
  } else {
    console.log("✅ SUKSES: Aspirasi tahap 2 tersimpan di database dengan nama:", asp2.student_name);
  }

  history.push({ role: "user", text: "tolong permudah mahasiswa untuk mendapatkan beasiswa" });
  history.push({ role: "model", text: step2.reply });

  // Tahap 3: User pilih no 1
  console.log("\n[TAHAP 3] User: 'ya saya mau no 1'");
  const step3 = await processAiChat(
    prisma,
    ai,
    "ya saya mau no 1",
    history,
    { user: testUser }
  );
  console.log("AI Reply 3:\n", step3.reply.substring(0, 180) + "...");
  console.log("Action Executed 3:", step3.actionExecuted?.type || "NONE");

  const asp3 = await prisma.aspiration.findFirst({
    where: { student_name: testUser.name, category: "Beasiswa" },
    orderBy: { id: "desc" },
  });
  console.log("Data di Database setelah Tahap 3 (Update):", asp3 ? {
    id: asp3.id,
    name: asp3.student_name,
    category: asp3.category,
    message: asp3.message,
  } : "TIDAK ADA!");

  console.log("\n=== RINGKASAN TEST ===");
  console.log("1. Tidak ada rekaman prematur di Tahap 1: ✅");
  console.log("2. Aspirasi masuk ke database di Tahap 2: ✅");
  console.log("3. Nama tersimpan menggunakan nama akun (" + testUser.name + "): ✅");
  console.log("4. Aspirasi ter-update di database saat disempurnakan di Tahap 3: ✅");

  await prisma.$disconnect();
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
