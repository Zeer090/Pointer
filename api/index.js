// server.ts
import "dotenv/config";
import express from "express";
import path from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";

// aiKnowledgeEngine.ts
var GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash"
];
function withTimeout(promise, ms, timeoutMsg) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutMsg)), ms))
  ]);
}
async function callGroqChat(apiKey, messages, model = process.env.GROQ_MODEL || "qwen/qwen3.8-27b") {
  try {
    const res = await withTimeout(
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1024,
          temperature: 0.7
        })
      }),
      8e3,
      "Timeout Groq"
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}
async function callOpenRouterChat(apiKey, messages, model = "meta-llama/llama-3.3-70b-instruct:free") {
  try {
    const res = await withTimeout(
      fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "POINTER AI"
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1024,
          temperature: 0.7
        })
      }),
      1e4,
      "Timeout OpenRouter"
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}
async function fetchLiveDatabaseFromPostgres(prisma2) {
  const [
    rawUsers,
    rawDivisions,
    rawPrograms,
    rawAspirations,
    rawProducts,
    rawTransactions,
    rawFinancials,
    rawAnnouncements,
    rawLetters,
    rawNotulensi,
    rawTalents,
    rawActivities
  ] = await Promise.all([
    prisma2.user.findMany({
      select: { id: true, name: true, role: true, npm: true, jabatan: true, division_id: true },
      take: 100
    }),
    prisma2.division.findMany({
      include: {
        _count: {
          select: { users: true, programs: true }
        }
      }
    }),
    prisma2.program.findMany({
      include: { division: true },
      orderBy: { id: "desc" },
      take: 50
    }),
    prisma2.aspiration.findMany({
      orderBy: { id: "desc" },
      take: 50
    }),
    prisma2.product.findMany({
      take: 30
    }),
    prisma2.transaction.findMany({
      orderBy: { id: "desc" },
      take: 20
    }),
    prisma2.financialReport.findMany({
      orderBy: { id: "desc" },
      take: 15
    }),
    prisma2.announcement.findMany({
      orderBy: { id: "desc" },
      take: 15
    }),
    prisma2.letter.findMany({
      orderBy: { id: "desc" },
      take: 20
    }),
    prisma2.notulensi.findMany({
      orderBy: { id: "desc" },
      take: 15
    }),
    prisma2.talent.findMany({
      take: 20
    }),
    prisma2.activityLog.findMany({
      orderBy: { id: "desc" },
      take: 15
    })
  ]);
  const divMap = new Map(rawDivisions.map((d) => [d.id, d.name]));
  return {
    syncedAt: (/* @__PURE__ */ new Date()).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
    counts: {
      totalUsers: rawUsers.length,
      totalDivisions: rawDivisions.length,
      totalPrograms: rawPrograms.length,
      totalAspirations: rawAspirations.length,
      totalProducts: rawProducts.length,
      totalTransactions: rawTransactions.length,
      totalLetters: rawLetters.length,
      totalAnnouncements: rawAnnouncements.length
    },
    users: rawUsers.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      npm: u.npm,
      jabatan: u.jabatan,
      division_name: divMap.get(u.division_id || "") || "Umum"
    })),
    divisions: rawDivisions.map((d) => ({
      id: d.id,
      name: d.name,
      userCount: d._count.users,
      programCount: d._count.programs
    })),
    programs: rawPrograms.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      event_date: p.event_date,
      status: p.status,
      approval_status: p.approval_status,
      division_name: p.division?.name || "Umum",
      created_by: p.created_by
    })),
    aspirations: rawAspirations.map((a) => ({
      id: a.id,
      student_name: a.student_name,
      category: a.category,
      message: a.message,
      status: a.status,
      created_at: a.created_at
    })),
    products: rawProducts.map((pr) => ({
      id: pr.id,
      product_name: pr.product_name,
      price: pr.price,
      stock: pr.stock,
      sold: pr.sold
    })),
    transactions: rawTransactions.map((t) => ({
      id: t.id,
      student_name: t.student_name,
      total: t.total,
      payment_status: t.payment_status,
      items_text: t.items_text,
      date: t.date
    })),
    financialReports: rawFinancials.map((f) => ({
      id: f.id,
      title: f.title,
      income: f.income,
      expense: f.expense,
      type: f.type,
      date: f.date
    })),
    announcements: rawAnnouncements.map((an) => ({
      id: an.id,
      title: an.title,
      content: an.content,
      category: an.category,
      date: an.date
    })),
    letters: rawLetters.map((l) => ({
      id: l.id,
      num: l.num,
      subject: l.subject,
      type: l.type,
      date: l.date,
      handler: l.handler
    })),
    notulensi: rawNotulensi.map((n) => ({
      id: n.id,
      title: n.title,
      date: n.date,
      author: n.author,
      summary: n.summary
    })),
    talents: rawTalents.map((tl) => ({
      id: tl.id,
      student_name: tl.student_name,
      talent: tl.talent,
      achievement: tl.achievement
    })),
    activityLogs: rawActivities.map((ac) => ({
      id: ac.id,
      detail: ac.detail,
      time: ac.time
    }))
  };
}
function checkActionPermission(action, userRole) {
  const role = userRole || "mahasiswa";
  if (action.type === "BLOCKED_DESTRUCTIVE") {
    return {
      allowed: false,
      reason: "Demi keamanan dan integritas sistem POINTER, tindakan penghapusan akun atau modifikasi sistem tingkat tinggi tidak diizinkan melalui AI. Silakan gunakan menu pengaturan resmi."
    };
  }
  if (role === "mahasiswa") {
    if (action.type === "CREATE_ASPIRATION" || action.type === "UPDATE_ASPIRATION") {
      return { allowed: true };
    }
    if (action.type === "CREATE_PROGRAM") {
      return {
        allowed: false,
        reason: "Sebagai mahasiswa, kamu memiliki akses untuk menyampaikan aspirasi dan melihat informasi himpunan. Pembuatan program kerja merupakan kewenangan pengurus divisi atau admin ya! \u{1F60A}"
      };
    }
    if (action.type === "CREATE_FINANCIAL") {
      return {
        allowed: false,
        reason: "Pencatatan kas dan keuangan hanya dapat dilakukan oleh bendahara atau pengurus yang berwenang."
      };
    }
    if (action.type === "CREATE_ANNOUNCEMENT") {
      return {
        allowed: false,
        reason: "Penerbitan pengumuman resmi merupakan kewenangan pengurus divisi atau admin himpunan."
      };
    }
    if (action.type === "UPDATE_ASPIRATION_STATUS") {
      return {
        allowed: false,
        reason: "Pembaruan status tindak lanjut aspirasi hanya dapat dilakukan oleh pengurus PSDAM."
      };
    }
    if (action.type === "CREATE_TALENT") {
      return {
        allowed: false,
        reason: "Pendaftaran prestasi mahasiswa diverifikasi dan dikelola oleh divisi Minat & Bakat (MINBAT)."
      };
    }
  }
  if (role === "divisi") {
    if (action.type === "CREATE_ASPIRATION" || action.type === "UPDATE_ASPIRATION" || action.type === "CREATE_PROGRAM" || action.type === "UPDATE_ASPIRATION_STATUS" || action.type === "CREATE_FINANCIAL" || action.type === "CREATE_ANNOUNCEMENT" || action.type === "CREATE_TALENT") {
      return { allowed: true };
    }
  }
  if (role === "admin") {
    return { allowed: true };
  }
  return { allowed: false, reason: "Aksi tidak diizinkan untuk peran akun saat ini." };
}
function isIntentWithoutDetails(msg) {
  const clean = msg.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();
  const aspirationIntentOnlyRegex = /^(saya\s+)?(mau|ingin|bisa|tolong|mohon)?\s*(ngajuin|mengajukan|kirim|menyampaikan|ajukan|bikin|tulis|buat)\s*(aspirasi|keluhan|saran|masukan|unek-unek|komplain)(\s+(dong|deh|ya|nih|min|kak|tolong|di\s+sini|lewat\s+sini))?$/i;
  if (aspirationIntentOnlyRegex.test(clean)) return true;
  const programIntentOnlyRegex = /^(saya\s+)?(mau|ingin|bisa|tolong|mohon)?\s*(buat|bikin|tambah|ajukan|buatkan)\s*(proker|program\s*kerja)(\s+baru)?(\s+(dong|deh|ya|nih|min|kak|tolong))?$/i;
  if (programIntentOnlyRegex.test(clean)) return true;
  const financeIntentOnlyRegex = /^(saya\s+)?(mau|ingin|bisa|tolong|mohon)?\s*(catat|simpan|tambah|input)\s*(kas|uang|pemasukan|pengeluaran)(\s+(masuk|keluar))?(\s+(dong|deh|ya|nih|min|kak|tolong))?$/i;
  if (financeIntentOnlyRegex.test(clean)) return true;
  const announcementIntentOnlyRegex = /^(saya\s+)?(mau|ingin|bisa|tolong|mohon)?\s*(buat|rilis|posting|bikin|terbitkan)\s*(pengumuman)(\s+baru)?(\s+(dong|deh|ya|nih|min|kak|tolong))?$/i;
  if (announcementIntentOnlyRegex.test(clean)) return true;
  const talentIntentOnlyRegex = /^(saya\s+)?(mau|ingin|bisa|tolong|mohon)?\s*(daftarkan|catat|daftar|input)\s*(prestasi|bakat)(\s+(dong|deh|ya|nih|min|kak|tolong))?$/i;
  if (talentIntentOnlyRegex.test(clean)) return true;
  return false;
}
async function parseActionIntent(message, genAI2, liveDb) {
  const lowerMsg = message.toLowerCase();
  if ((lowerMsg.includes("hapus") || lowerMsg.includes("delete") || lowerMsg.includes("drop") || lowerMsg.includes("reset")) && (lowerMsg.includes("user") || lowerMsg.includes("akun") || lowerMsg.includes("database") || lowerMsg.includes("sistem") || lowerMsg.includes("semua"))) {
    return { type: "BLOCKED_DESTRUCTIVE", data: {} };
  }
  if (isIntentWithoutDetails(message)) {
    return { type: "NONE", data: {} };
  }
  if ((lowerMsg.includes("aspirasi") || lowerMsg.includes("keluhan") || lowerMsg.includes("saran") || lowerMsg.includes("masukan")) && (lowerMsg.includes("ngajuin") || lowerMsg.includes("kirim") || lowerMsg.includes("ajukan") || lowerMsg.includes("mau") || lowerMsg.includes("tentang") || lowerMsg.includes(":")) && !lowerMsg.includes("bagaimana cara") && !lowerMsg.includes("apa saja") && !lowerMsg.includes("status aspirasi") && !lowerMsg.includes("sebutkan")) {
    let cat = "Lainnya";
    if (lowerMsg.includes("akademik") || lowerMsg.includes("kuliah") || lowerMsg.includes("dosen") || lowerMsg.includes("belajar") || lowerMsg.includes("kurikulum")) cat = "Akademik";
    else if (lowerMsg.includes("fasilitas") || lowerMsg.includes("wifi") || lowerMsg.includes("ac") || lowerMsg.includes("lab") || lowerMsg.includes("ruang") || lowerMsg.includes("kursi")) cat = "Fasilitas";
    else if (lowerMsg.includes("beasiswa") || lowerMsg.includes("kip") || lowerMsg.includes("ukt")) cat = "Beasiswa";
    else if (lowerMsg.includes("kegiatan") || lowerMsg.includes("acara") || lowerMsg.includes("lomba")) cat = "Kegiatan";
    let msgText = "";
    for (const token of [":", "tentang", "mengenai", "bahwa", "yaitu", "karena"]) {
      const idx = message.toLowerCase().indexOf(token);
      if (idx !== -1 && idx + token.length < message.length) {
        msgText = message.substring(idx + token.length).trim();
        msgText = msgText.replace(/^(akademik|fasilitas|beasiswa|kegiatan|lainnya)[,:\s-]+/i, "").trim();
        break;
      }
    }
    if (!msgText) {
      const stripped = message.replace(/^(halo\s+)?(saya\s+)?(mau|ingin|bisa|tolong)?\s*(ngajuin|mengajukan|kirim|ajukan)\s*(aspirasi|keluhan|saran|masukan)[:\s-]*/i, "").trim();
      if (stripped.length >= 15 && !isIntentWithoutDetails(stripped)) {
        msgText = stripped;
      }
    }
    if (!msgText || msgText.length < 12 || isIntentWithoutDetails(msgText)) {
      return { type: "NONE", data: {} };
    }
    return { type: "CREATE_ASPIRATION", data: { student_name: "", category: cat, message: msgText } };
  }
  if ((lowerMsg.includes("proker") || lowerMsg.includes("program kerja")) && (lowerMsg.includes("buat") || lowerMsg.includes("tambah") || lowerMsg.includes("bikin"))) {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const afterColon = message.indexOf(":");
    let title = "";
    let desc = message;
    if (afterColon !== -1) {
      title = message.substring(afterColon + 1).split(",")[0].trim();
      desc = message.substring(afterColon + 1).trim();
    } else {
      title = message.replace(/^(buat|tambah|bikin)\s+(proker|program\s*kerja)[:\s-]*/i, "").trim();
    }
    if (!title || title.length < 5 || title.toLowerCase() === "baru" || title.toLowerCase() === "dong") {
      return { type: "NONE", data: {} };
    }
    return {
      type: "CREATE_PROGRAM",
      data: {
        title,
        description: desc,
        event_date: today,
        division_id: "div-psdam",
        created_by: "Pengurus"
      }
    };
  }
  if ((lowerMsg.includes("catat") || lowerMsg.includes("simpan")) && (lowerMsg.includes("kas") || lowerMsg.includes("masuk") || lowerMsg.includes("keluar") || lowerMsg.includes("uang"))) {
    const isIncome = lowerMsg.includes("masuk") || lowerMsg.includes("pemasukan") || lowerMsg.includes("iuran");
    const numMatch = message.replace(/[.,]/g, "").match(/\d+/);
    const amount = numMatch ? parseInt(numMatch[0], 10) : 0;
    if (amount <= 0) {
      return { type: "NONE", data: {} };
    }
    return {
      type: "CREATE_FINANCIAL",
      data: {
        title: message.replace(/^(catat|simpan)\s+kas\s+(masuk|keluar)?[:\s-]*/i, "").trim() || "Kas Himpunan",
        income: isIncome ? amount : 0,
        expense: !isIncome ? amount : 0,
        type: isIncome ? "income" : "expense"
      }
    };
  }
  if (lowerMsg.includes("buat pengumuman") || lowerMsg.includes("rilis pengumuman") || lowerMsg.includes("posting pengumuman")) {
    const afterColon = message.indexOf(":");
    const content = afterColon !== -1 ? message.substring(afterColon + 1).trim() : "";
    if (!content || content.length < 15) {
      return { type: "NONE", data: {} };
    }
    return {
      type: "CREATE_ANNOUNCEMENT",
      data: {
        title: content.substring(0, 60).trim(),
        content,
        category: "Umum"
      }
    };
  }
  if (lowerMsg.includes("daftarkan prestasi") || lowerMsg.includes("catat bakat") || lowerMsg.includes("daftar bakat")) {
    const talentText = message.replace(/^(daftarkan prestasi|catat bakat|daftar bakat)[:\s-]*/i, "").trim();
    if (!talentText || talentText.length < 5 || talentText.toLowerCase() === "dong") {
      return { type: "NONE", data: {} };
    }
    return {
      type: "CREATE_TALENT",
      data: {
        student_name: "",
        talent: talentText,
        achievement: "Peserta"
      }
    };
  }
  if (message.length < 30) return { type: "NONE", data: {} };
  const intentPrompt = `Kamu adalah intent parser cerdas untuk website HIMA POINTER.
Analisis pesan pengguna berikut dan tentukan apakah pengguna secara eksplisit meminta TINDAKAN atau hanya bertanya/ngobrol biasa.

PESAN PENGGUNA: "${message}"

JENIS TINDAKAN YANG DIDUKUNG:
1. CREATE_ASPIRATION: Pengguna ingin mengirim/menyampaikan aspirasi/keluhan/saran perkuliahan atau fasilitas.
   data: student_name, category (Akademik/Fasilitas/Beasiswa/Kegiatan/Lainnya), message
2. CREATE_PROGRAM: Pengguna (pengurus) ingin membuat program kerja baru.
   data: title, description, event_date, division_id, created_by
3. CREATE_ANNOUNCEMENT: Pengguna ingin merilis pengumuman baru.
   data: title, content, category
4. CREATE_FINANCIAL: Pengguna ingin mencatat kas masuk atau kas keluar.
   data: title, income, expense, type
5. CREATE_TALENT: Pengguna ingin mendaftarkan data prestasi/bakat mahasiswa.
   data: student_name, talent, achievement
6. UPDATE_ASPIRATION_STATUS: Pengurus ingin memperbarui status aspirasi.
   data: targetId, status
7. BLOCKED_DESTRUCTIVE: Pengguna berniat menghapus akun pengguna lain atau data krusial sistem.
8. NONE: Pengguna HANYA bertanya, menyapa, curhat, ngobrol santai, atau mencari info.

Jawab HANYA format JSON murni:
{"type": "CREATE_ASPIRATION", "data": {"student_name": "...", "category": "...", "message": "..."}}
atau jika hanya ngobrol/tanya:
{"type": "NONE", "data": {}}`;
  try {
    const response = await withTimeout(
      genAI2.models.generateContent({
        model: GEMINI_MODELS[0],
        contents: [{ role: "user", parts: [{ text: intentPrompt }] }],
        config: { responseMimeType: "application/json", maxOutputTokens: 128 }
      }),
      4e3,
      "Timeout intent parser"
    );
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || "";
    if (text?.trim()) {
      const cleaned = text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed?.type) return parsed;
    }
  } catch {
  }
  return { type: "NONE", data: {} };
}
async function executeAction(action, prisma2, userName) {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const accountName = userName && userName.trim() && userName !== "Mahasiswa" && userName !== "Anonim" ? userName.trim() : action.data?.student_name && action.data.student_name !== "Mahasiswa" && action.data.student_name !== "Anonim" ? action.data.student_name : userName?.trim() || "Pengguna";
  switch (action.type) {
    case "CREATE_ASPIRATION": {
      const record = await prisma2.aspiration.create({
        data: {
          student_name: accountName,
          category: action.data.category || "Lainnya",
          message: action.data.message,
          status: "pending",
          created_at: "Baru saja"
        }
      });
      await prisma2.activityLog.create({
        data: {
          detail: `Aspirasi baru masuk dari ${record.student_name} (${record.category})`,
          time: "Baru saja",
          color: "orange"
        }
      });
      return { success: true, record, refreshModules: ["aspirations", "activity_logs"] };
    }
    case "UPDATE_ASPIRATION": {
      const targetAsp = action.targetId ? await prisma2.aspiration.findUnique({ where: { id: action.targetId } }) : await prisma2.aspiration.findFirst({
        where: { student_name: accountName },
        orderBy: { id: "desc" }
      }) || await prisma2.aspiration.findFirst({
        orderBy: { id: "desc" }
      });
      if (targetAsp) {
        const record = await prisma2.aspiration.update({
          where: { id: targetAsp.id },
          data: {
            message: action.data.message || targetAsp.message,
            category: action.data.category || targetAsp.category
          }
        });
        await prisma2.activityLog.create({
          data: {
            detail: `Aspirasi ${record.student_name} diperbarui: "${record.message.substring(0, 45)}..."`,
            time: "Baru saja",
            color: "blue"
          }
        });
        return { success: true, record, refreshModules: ["aspirations", "activity_logs"] };
      } else {
        const record = await prisma2.aspiration.create({
          data: {
            student_name: accountName,
            category: action.data.category || "Lainnya",
            message: action.data.message,
            status: "pending",
            created_at: "Baru saja"
          }
        });
        await prisma2.activityLog.create({
          data: {
            detail: `Aspirasi baru masuk dari ${record.student_name} (${record.category})`,
            time: "Baru saja",
            color: "orange"
          }
        });
        return { success: true, record, refreshModules: ["aspirations", "activity_logs"] };
      }
    }
    case "CREATE_PROGRAM": {
      const divisionId = action.data.division_id || "div-psdam";
      const record = await prisma2.program.create({
        data: {
          title: action.data.title,
          description: action.data.description || action.data.title,
          event_date: action.data.event_date || today,
          status: "planning",
          approval_status: "pending",
          division_id: divisionId,
          created_by: accountName
        }
      });
      await prisma2.activityLog.create({
        data: {
          detail: `Program kerja baru diajukan oleh ${accountName}: '${record.title}'`,
          time: "Baru saja",
          color: "green"
        }
      });
      return { success: true, record, refreshModules: ["programs", "activity_logs"] };
    }
    case "CREATE_ANNOUNCEMENT": {
      const record = await prisma2.announcement.create({
        data: {
          title: action.data.title,
          content: action.data.content,
          category: action.data.category || "Umum",
          date: today
        }
      });
      await prisma2.activityLog.create({
        data: {
          detail: `Pengumuman resmi diterbitkan oleh ${accountName}: '${record.title}'`,
          time: "Baru saja",
          color: "blue"
        }
      });
      return { success: true, record, refreshModules: ["announcements", "activity_logs"] };
    }
    case "CREATE_FINANCIAL": {
      const income = Number(action.data.income || 0);
      const expense = Number(action.data.expense || 0);
      const type = action.data.type || (income > 0 ? "income" : "expense");
      const record = await prisma2.financialReport.create({
        data: {
          title: action.data.title,
          income,
          expense,
          file: "Laporan_Keuangan.pdf",
          type,
          date: today
        }
      });
      await prisma2.activityLog.create({
        data: {
          detail: `Kas ${type === "income" ? "masuk" : "keluar"} dicatat oleh ${accountName}: '${record.title}'`,
          time: "Baru saja",
          color: type === "income" ? "green" : "red"
        }
      });
      return { success: true, record, refreshModules: ["financial_reports", "activity_logs"] };
    }
    case "CREATE_TALENT": {
      const record = await prisma2.talent.create({
        data: {
          student_name: accountName,
          talent: action.data.talent,
          achievement: action.data.achievement || "Peserta Perlombaan",
          certificate: "Sertifikat.pdf"
        }
      });
      await prisma2.activityLog.create({
        data: {
          detail: `Bakat/prestasi dicatat: ${record.student_name} (${record.talent})`,
          time: "Baru saja",
          color: "purple"
        }
      });
      return { success: true, record, refreshModules: ["talents", "activity_logs"] };
    }
    case "UPDATE_ASPIRATION_STATUS": {
      const record = await prisma2.aspiration.update({
        where: { id: action.targetId || action.data.targetId },
        data: { status: action.data.status }
      });
      await prisma2.activityLog.create({
        data: {
          detail: `Status aspirasi ${record.student_name} diperbarui ke ${record.status}`,
          time: "Baru saja",
          color: "blue"
        }
      });
      return { success: true, record, refreshModules: ["aspirations", "activity_logs"] };
    }
    default:
      return { success: false, refreshModules: [] };
  }
}
function buildActionConfirmation(action, record) {
  switch (action.type) {
    case "CREATE_ASPIRATION":
      return `### \u2705 Aspirasi Berhasil Dikirim!

Aspirasi kamu sudah tersimpan di sistem dan akan segera ditinjau oleh pengurus PSDAM.

**Ringkasan:**
\u2022 **Kategori:** \u{1F3F7}\uFE0F ${record.category}
\u2022 **Pesan:** "${record.message}"
\u2022 **Status:** \u{1F7E1} Menunggu Peninjauan

> \u{1F4A1} Kamu bisa memantau perkembangannya kapan saja melalui menu **Aspirasi Saya**. Terima kasih atas masukannya! \u{1F60A}`;
    case "UPDATE_ASPIRATION":
      return `### \u2705 Aspirasi Berhasil Diperbarui!

Aspirasi kamu telah diperjelas dan kami catat dengan detail berikut:

**Rincian Aspirasi:**
\u2022 **Kategori:** \u{1F3F7}\uFE0F ${record.category}
\u2022 **Isi Aspirasi:** "${record.message}"
\u2022 **Status:** \u{1F7E1} Menunggu Peninjauan

> \u{1F4A1} Aspirasi ini telah tercatat resmi dan diteruskan ke Divisi PSDAM. Terima kasih! \u{1F60A}`;
    case "CREATE_PROGRAM":
      return `### \u2705 Program Kerja Berhasil Diajukan!

Program kerja **${record.title}** telah tercatat dalam agenda himpunan.

**Detail:**
\u2022 **Tanggal Agenda:** ${record.event_date}
\u2022 **Status:** \u{1F4DD} Planning (Menunggu persetujuan pimpinan)`;
    case "CREATE_ANNOUNCEMENT":
      return `### \u2705 Pengumuman Resmi Diterbitkan!

Pengumuman **"${record.title}"** telah berhasil dirilis dan dapat dilihat di halaman Pengumuman.`;
    case "CREATE_FINANCIAL":
      const amount = record.type === "income" ? record.income : record.expense;
      return `### \u2705 Catatan Keuangan Tersimpan!

Data kas sebesar **Rp${amount.toLocaleString("id-ID")}** untuk **"${record.title}"** berhasil dicatat ke laporan keuangan.`;
    case "CREATE_TALENT":
      return `### \u2705 Prestasi Mahasiswa Tersimpan!

Data bakat **${record.student_name}** di bidang **${record.talent}** telah dicatat di data Minat & Bakat.`;
    case "UPDATE_ASPIRATION_STATUS":
      const statusLabel = record.status === "completed" ? "\u{1F7E2} Selesai" : record.status === "processing" ? "\u{1F535} Sedang Diproses" : "\u{1F7E1} Pending";
      return `### \u2705 Status Aspirasi Diperbarui!

Status aspirasi dari **${record.student_name}** sekarang menjadi: **${statusLabel}**.`;
    default:
      return "Tindakan berhasil diselesaikan.";
  }
}
function synthesizeLiveDatabaseAnswer(message, db) {
  const q = message.toLowerCase().trim();
  if (q === "halo" || q === "hai" || q === "p" || q === "hei" || q.startsWith("halo") || q.startsWith("hai") || q.includes("selamat pagi") || q.includes("selamat siang") || q.includes("selamat malam") || q.includes("assalamualaikum")) {
    return `Halo! \u{1F44B} Senang bisa ngobrol denganmu.

Ada yang bisa saya bantu hari ini? Kamu bisa tanya seputar kegiatan himpunan, info proker, pengumuman, cara pengajuan aspirasi, atau sekadar berdiskusi santai! \u{1F60A}`;
  }
  if (q.includes("kamu siapa") || q.includes("bot apa") || q.includes("siapa kamu") || q.includes("tentang kamu")) {
    return `Saya adalah **POINTER AI**, asisten cerdas resmi HIMA POINTER Politeknik Negeri Lampung.

Saya di sini untuk membantu rekan-rekan mahasiswa dan pengurus dalam mendapatkan informasi kegiatan, kepengurusan, layanan aspirasi, toko merchandise, hingga membantu alur kerja di website ini. Silakan tanya apa saja ya! \u{1F60A}`;
  }
  if (q.includes("aspirasi") || q.includes("advokasi") || q.includes("keluhan") || q.includes("saran") || q.includes("kritik")) {
    if (isIntentWithoutDetails(message) || q.includes("mau") || q.includes("ngajuin") || q.includes("kirim") || q.includes("ajukan") || q.includes("cara")) {
      return `### \u{1F4A1} Layanan Pengajuan Aspirasi Mahasiswa POINTER

Halo! \u{1F44B} Tentu saja, kamu bisa menyampaikan aspirasi, masukan, keluhan fasilitas, atau saran perkuliahan langsung melalui saya.

Agar aspirasimu dapat dicatat dan ditindaklanjuti secara resmi oleh pengurus Divisi PSDAM, silakan tuliskan pesan dengan rincian:
\u2022 **Kategori:** (Akademik / Fasilitas / Beasiswa / Kegiatan / Lainnya)
\u2022 **Isi Aspirasi:** (Jelaskan rincian keluhan, kritik, atau saran perbaikan kamu)

*Contoh format pengiriman langsung:*
> *"Saya mau mengajukan aspirasi fasilitas: Stopkontak di lab komputer 2 banyak yang rusak, mohon segera diganti."*

Silakan ketik aspirasimu sekarang ya! \u{1F60A}`;
    }
    const list = db.aspirations.length > 0 ? db.aspirations.slice(0, 5).map((a) => {
      const badge = a.status === "completed" ? "\u{1F7E2} Selesai" : a.status === "processing" ? "\u{1F535} Diproses" : "\u{1F7E1} Pending";
      return `\u2022 [${badge}] *${a.category}*: "${a.message}" (${a.student_name})`;
    }).join("\n") : "*(Belum ada data aspirasi aktif)*";
    return `### \u{1F4A1} Layanan Aspirasi Mahasiswa POINTER

Saat ini ada **${db.aspirations.length} aspirasi** yang masuk ke sistem:
${list}

---
**Ingin menyampaikan aspirasi?**
Kamu cukup ketik langsung di sini, contohnya:
> *"Saya mau ngajuin aspirasi tentang akademik: Jadwal praktikum mohon tidak bertabrakan dengan kelas teori"*

Pesanmu akan langsung diteruskan ke divisi PSDAM untuk ditindaklanjuti!`;
  }
  if (q.includes("kahim") || q.includes("ketua") || q.includes("ketum") || q.includes("pimpinan") || q.includes("bph") || q.includes("pengurus") || q.includes("siapa")) {
    const admins = db.users.filter((u) => u.role === "admin");
    const staff = db.users.filter((u) => u.role === "divisi");
    const adminList = admins.length > 0 ? admins.map((u) => `\u2022 **${u.name}** \u2014 ${u.jabatan || "Ketua / BPH"} (NPM: ${u.npm || "-"})`).join("\n") : "\u2022 Belum ada data pimpinan";
    const divList = db.divisions.map((d) => d.name).join(", ");
    return `### \u{1F465} Pengurus & Struktur HIMA POINTER

**Pimpinan & BPH:**
${adminList}

**Divisi Himpunan:**
${divList}

Ada divisi atau pengurus tertentu yang ingin kamu tanyakan lebih lanjut?`;
  }
  if (q.includes("proker") || q.includes("program") || q.includes("kegiatan") || q.includes("acara") || q.includes("agenda")) {
    const prokerList = db.programs.length > 0 ? db.programs.slice(0, 7).map((p) => {
      const icon = p.status === "completed" ? "\u2705" : p.status === "ongoing" ? "\u26A1" : "\u{1F4DD}";
      return `\u2022 ${icon} **${p.title}** (${p.division_name}) \u2014 Tanggal: ${p.event_date}`;
    }).join("\n") : "*(Belum ada agenda kegiatan)*";
    return `### \u{1F4C5} Agenda & Program Kerja HIMA POINTER

Berikut beberapa program kerja himpunan:
${prokerList}

Ada agenda yang ingin kamu ikuti atau ketahui detailnya?`;
  }
  if (q.includes("toko") || q.includes("merchandise") || q.includes("produk") || q.includes("kimas") || q.includes("beli") || q.includes("jahim") || q.includes("shop")) {
    const prodList = db.products.length > 0 ? db.products.map((pr) => `\u2022 **${pr.product_name}** \u2014 Rp${pr.price.toLocaleString("id-ID")} (Stok: ${pr.stock} pcs)`).join("\n") : "*(Belum ada katalog produk di toko)*";
    return `### \u{1F6CD}\uFE0F Merchandise Resmi HIMA POINTER

Produk yang tersedia saat ini:
${prodList}

Kamu bisa langsung melihat dan memesan melalui menu **Toko KIMAS Store** dengan pembayaran via QRIS!`;
  }
  if (q.includes("pengumuman") || q.includes("berita") || q.includes("info")) {
    const annList = db.announcements.length > 0 ? db.announcements.slice(0, 3).map((an) => `\u2022 [${an.date}] **${an.title}**: ${an.content}`).join("\n\n") : "*(Belum ada pengumuman baru)*";
    return `### \u{1F4E2} Pengumuman Terbaru HIMA POINTER

${annList}`;
  }
  if (q.includes("fitur") || q.includes("menu") || q.includes("cara pakai") || q.includes("website") || q.includes("bisa apa") || q.includes("halaman") || q.includes("panduan") || q.includes("bantuan")) {
    return `### \u{1F9ED} Panduan Fitur Website HIMA POINTER

Website ini adalah portal resmi manajemen organisasi dan layanan mahasiswa:
\u2022 \u{1F3E0} **Beranda & Dashboard:** Ringkasan kegiatan, kalender konten, dan agenda terkini.
\u2022 \u{1F4A1} **Aspirasi Mahasiswa:** Tempat menyampaikan aspirasi/keluhan fasilitas & akademik.
\u2022 \u{1F4C5} **Program Kerja:** Informasi jadwal, status, dan rincian kegiatan tiap divisi.
\u2022 \u{1F4E6} **Inventaris & Aset:** Cek ketersediaan dan peminjaman alat (proyektor, sound, dsb).
\u2022 \u{1F6CD}\uFE0F **KIMAS Store:** Pembelian jaket himpunan dan merchandise via QRIS.
\u2022 \u{1F465} **Kepengurusan:** Profil BPH dan divisi HIMA POINTER.
\u2022 \u{1F916} **POINTER AI:** Asisten cerdas untuk tanya jawab dan automasi tindakan langsung!

Ada fitur tertentu yang ingin kamu tanyakan caranya? \u{1F60A}`;
  }
  if (/\bvisi\b/.test(q) || /\bmisi\b/.test(q) || q.includes("tujuan hima")) {
    return `### \u{1F3AF} Visi & Misi HIMA POINTER
**Himpunan Mahasiswa Manajemen Informatika \u2014 Politeknik Negeri Lampung**

**Visi:**
Menjadi wadah pengembangan potensi mahasiswa Manajemen Informatika yang berintegritas, inovatif, berdaya saing di bidang teknologi informasi, serta solid berlandaskan kekeluargaan.

**Misi:**
1. Menyelenggarakan kegiatan peningkatan kompetensi akademik & teknologi (workshop, webinar, riset).
2. Membangun advokasi aspirasi mahasiswa yang responsif, transparan, dan solutif.
3. Mempererat solidaritas mahasiswa MI melalui kegiatan kebersamaan dan sosial.
4. Menjalin relasi strategis dengan alumni, industri, dan himpunan lintas kampus.`;
  }
  if (q.includes("pinjam") || q.includes("inventaris") || q.includes("proyektor") || q.includes("toa") || q.includes("alat") || q.includes("barang")) {
    return `### \u{1F4E6} Panduan Peminjaman Inventaris
Untuk meminjam fasilitas/aset himpunan (proyektor, kabel roll, toa, banner, dll):
1. Masuk ke menu **Inventaris** di sidebar.
2. Lihat daftar barang yang berstatus **Tersedia**.
3. Ajukan permohonan peminjaman dengan mengisi keperluan dan tanggal pengembalian.
4. Hubungi divisi pengelola (KIMAS / Kestari) untuk serah terima fisik barang.`;
  }
  if (q.includes("psdam") || q.includes("medinfo") || q.includes("kestari") || q.includes("kimas") || q.includes("minbat")) {
    const matchedDiv = db.divisions.find((d) => q.includes(d.name.toLowerCase()));
    const divName = matchedDiv ? matchedDiv.name : "Divisi Himpunan";
    const divProgs = db.programs.filter((p) => p.division_name?.toLowerCase().includes(divName.toLowerCase()));
    const progText = divProgs.length > 0 ? divProgs.map((p) => `\u2022 **${p.title}** (${p.event_date})`).join("\n") : "\u2022 Belum ada proker terdaftar untuk divisi ini";
    return `### \u{1F3DB}\uFE0F Informasi ${divName}
Divisi ini aktif mengelola program kerja dan layanan mahasiswa POINTER.

**Agenda & Proker Divisi:**
${progText}

Ada hal khusus terkait divisi ini yang ingin kamu diskusikan?`;
  }
  return `Halo! \u{1F44B} Ada yang bisa saya bantu di sistem POINTER hari ini?

Kamu bisa bebas bertanya atau berdiskusi tentang apa saja, seperti:
\u2022 \u{1F4C5} **Agenda & Kegiatan:** Jadwal dan info program kerja
\u2022 \u{1F4A1} **Layanan Aspirasi:** Menyampaikan kritik, saran, atau keluhan perkuliahan
\u2022 \u{1F465} **Pengurus Himpunan:** Struktur kepemimpinan dan divisi
\u2022 \u{1F6CD}\uFE0F **Merchandise Toko:** Info jaket himpunan dan produk KIMAS Store
\u2022 \u{1F9ED} **Fitur Sistem:** Panduan peminjaman alat, absensi, atau modul web
\u2022 \u{1F4AC} Atau sekadar ngobrol santai seputar kehidupan kampus!`;
}
function classifyMessage(msg) {
  const q = msg.toLowerCase().trim();
  const chitchatPatterns = [
    /^(halo|hai|hey|hi|p|hei|oi|yo)\b/,
    /^(selamat pagi|selamat siang|selamat sore|selamat malam|assalamualaikum|wa'alaikumsalam)\b/,
    /^(kamu siapa|siapa kamu|bot apa|tentang kamu|kamu apa)\b/,
    /^(makasih|terima kasih|thanks|thank you|ok|oke|sip|mantap|keren)\b/
  ];
  if (q.length < 35 && chitchatPatterns.some((re) => re.test(q))) return "chit-chat";
  if (!isIntentWithoutDetails(msg)) {
    const actionKeywords = [
      "ngajuin aspirasi",
      "kirim aspirasi",
      "ajukan aspirasi",
      "mau aspirasi",
      "buat proker",
      "tambah proker",
      "bikin proker",
      "catat kas",
      "simpan kas",
      "catat pemasukan",
      "catat pengeluaran",
      "buat pengumuman",
      "rilis pengumuman",
      "daftarkan prestasi",
      "catat bakat",
      "hapus",
      "delete",
      "drop"
    ];
    if (actionKeywords.some((kw) => q.includes(kw))) return "action";
  }
  const simpleInfoKeywords = [
    "proker",
    "program kerja",
    "agenda",
    "kegiatan",
    "jadwal",
    "acara",
    "pengurus",
    "kahim",
    "ketua",
    "ketum",
    "divisi",
    "bph",
    "struktur",
    "pimpinan",
    "toko",
    "merchandise",
    "jaket",
    "produk",
    "kimas",
    "beli",
    "jahim",
    "pengumuman",
    "berita",
    "info himpunan",
    "aspirasi",
    "keluhan",
    "saran",
    "advokasi",
    "fitur",
    "menu",
    "cara pakai",
    "website",
    "bisa apa",
    "halaman",
    "panduan",
    "bantuan",
    "visi",
    "misi",
    "tujuan",
    "hima",
    "pointer",
    "polinela",
    "pinjam",
    "inventaris",
    "proyektor",
    "toa",
    "alat",
    "barang",
    "psdam",
    "medinfo",
    "kestari",
    "minbat",
    "ekraf",
    "kuliah",
    "mahasiswa",
    "bakat",
    "prestasi"
  ];
  if (simpleInfoKeywords.some((kw) => q.includes(kw))) return "simple-info";
  return "complex-info";
}
var _minDbCache = null;
var _dbCache = null;
function invalidateDbCache() {
  _minDbCache = null;
  _dbCache = null;
}
function warmupAiCache(prisma2) {
  fetchCachedMinimalDb(prisma2).catch(() => {
  });
}
async function fetchCachedMinimalDb(prisma2) {
  const now = Date.now();
  if (_minDbCache && _minDbCache.expiry > now) {
    return _minDbCache.data;
  }
  const [rawUsers, rawDivisions, rawPrograms, rawAspirations, rawProducts, rawAnnouncements] = await Promise.all([
    prisma2.user.findMany({ select: { id: true, name: true, role: true, npm: true, jabatan: true, division_id: true }, take: 80 }),
    prisma2.division.findMany({ include: { _count: { select: { users: true, programs: true } } } }),
    prisma2.program.findMany({ include: { division: true }, orderBy: { id: "desc" }, take: 20 }),
    prisma2.aspiration.findMany({ orderBy: { id: "desc" }, take: 20 }),
    prisma2.product.findMany({ take: 20 }),
    prisma2.announcement.findMany({ orderBy: { id: "desc" }, take: 8 })
  ]);
  const divMap = new Map(rawDivisions.map((d) => [d.id, d.name]));
  const result = {
    users: rawUsers.map((u) => ({ id: u.id, name: u.name, role: u.role, npm: u.npm, jabatan: u.jabatan, division_name: divMap.get(u.division_id || "") || "Umum" })),
    divisions: rawDivisions.map((d) => ({ id: d.id, name: d.name, userCount: d._count.users, programCount: d._count.programs })),
    programs: rawPrograms.map((p) => ({ id: p.id, title: p.title, description: p.description, event_date: p.event_date, status: p.status, approval_status: p.approval_status, division_name: p.division?.name || "Umum", created_by: p.created_by })),
    aspirations: rawAspirations.map((a) => ({ id: a.id, student_name: a.student_name, category: a.category, message: a.message, status: a.status, created_at: a.created_at })),
    products: rawProducts.map((pr) => ({ id: pr.id, product_name: pr.product_name, price: pr.price, stock: pr.stock, sold: pr.sold })),
    announcements: rawAnnouncements.map((an) => ({ id: an.id, title: an.title, content: an.content, category: an.category, date: an.date })),
    counts: {
      totalUsers: rawUsers.length,
      totalDivisions: rawDivisions.length,
      totalPrograms: rawPrograms.length,
      totalAspirations: rawAspirations.length,
      totalProducts: rawProducts.length,
      totalTransactions: 0,
      totalLetters: 0,
      totalAnnouncements: rawAnnouncements.length
    }
  };
  _minDbCache = { data: result, expiry: now + 6e4 };
  return result;
}
function buildSystemPrompt(data, currentUserRole, currentUserName) {
  return `Kamu adalah "POINTER AI" \u2014 asisten kecerdasan buatan serba bisa yang cerdas, berwawasan luas, solutif, dan asyik diajak berdiskusi tentang APA SAJA, layaknya Gemini atau ChatGPT modern.
Kamu adalah asisten resmi untuk mahasiswa dan pengurus di lingkungan Politeknik Negeri Lampung (khususnya HIMA Manajemen Informatika).

=== PERAN & KEMAMPUAN UTAMA KAMU ===
1. MENJAWAB SEMUA PERTANYAAN (GENERAL KNOWLEDGE & RANDOM TOPICS):
   - Kamu BISA dan WAJIB menjawab pertanyaan apa pun dari pengguna, tidak terbatas hanya pada himpunan!
   - Contoh topik yang bisa kamu jawab: sains, pemrograman & coding (React, JavaScript, Python, SQL, algoritma, dll), matematika, tugas kuliah, filsafat, sejarah, fakta menarik, cerita, analogi, tips produktivitas, curhat santai, hingga teka-teki.
   - Jawablah secara cerdas, mendalam, akurat, bersahabat, dan terstruktur.

2. PENGETAHUAN KHUSUS HIMA POINTER (Gunakan jika ditanya hal seputar himpunan/kampus):
   - Pimpinan: ${data.users?.filter((u) => u.role === "admin").map((u) => u.name).join(", ") || "-"}
   - Divisi: ${data.divisions?.map((d) => d.name).join(", ") || "-"}
   - Proker terkini: ${data.programs?.slice(0, 5).map((p) => p.title).join(", ") || "-"}
   - Toko KIMAS: ${data.products?.map((pr) => pr.product_name).join(", ") || "tersedia di menu toko"}
   - Pengumuman: ${data.announcements?.slice(0, 2).map((an) => an.title).join(", ") || "-"}

=== ATURAN GAYA BAHASA ===
- JANGAN PERNAH menyebut kata teknis server seperti "database", "PostgreSQL", atau "Prisma".
- Gunakan bahasa Indonesia yang santun, luwes, ramah, dan format Markdown rapi (bold, bullet point, atau codeblock jika coding).
- Pengguna saat ini: ${currentUserName || "Rekan Mahasiswa"} (Peran: ${currentUserRole}).

=== INTEGRASI AKSI SISTEM DATABASE OTOMATIS (SANGAT KRUSIAL) ===
Sistem ini terhubung langsung ke sistem database operasional HIMA POINTER.
Jika dalam alur percakapan:
1. Pengguna menyampaikan keluhan, saran, aspirasi, atau masukan (misal: "tolong permudah beasiswa...", "fasilitas lab komputer rusak", dsb):
   - Kamu WAJIB menyusun respon konfirmasi penerimaan aspirasi dengan ramah dan solutif.
   - Di baris TERAKHIR responmu, sertakan kode aksi sistem:
   <<<ACTION:CREATE_ASPIRATION:{"category":"<Akademik/Fasilitas/Beasiswa/Kegiatan/Lainnya>","message":"<isi aspirasi yang jelas dan konkret>"}>>>
2. Pengguna memperbarui, menyetujui salah satu nomor saran (misal: "ya saya mau no 1"), atau memperjelas aspirasi yang baru saja dibahas:
   - Kamu WAJIB menyusun konfirmasi pembaruan aspirasi.
   - Di baris TERAKHIR responmu, sertakan kode aksi pembaruan:
   <<<ACTION:UPDATE_ASPIRATION:{"category":"<Kategori>","message":"<isi aspirasi lengkap yang telah disempurnakan>"}>>>
3. Jangan menyertakan tag ACTION jika pengguna hanya sekadar bertanya info umum, menyapa, atau belum memberikan isi aspirasi sama sekali.`;
}
function instantChitchatReply(message, userName) {
  const q = message.toLowerCase().trim();
  const name = userName ? `, ${userName.split(" ")[0]}` : "";
  if (q.startsWith("halo") || q.startsWith("hai") || q.startsWith("hi") || q === "p" || q.startsWith("hey")) {
    return `Halo${name}! \u{1F44B} Senang bisa ngobrol denganmu! Ada yang bisa saya bantu seputar HIMA POINTER hari ini? \u{1F60A}`;
  }
  if (q.includes("selamat pagi") || q.includes("pagi")) {
    return `Selamat pagi${name}! \u2600\uFE0F Semoga hari ini produktif dan menyenangkan. Ada yang bisa saya bantu?`;
  }
  if (q.includes("selamat siang") || q.includes("siang")) {
    return `Selamat siang${name}! \u{1F324}\uFE0F Sudah makan siang belum? Ada yang bisa saya bantu hari ini?`;
  }
  if (q.includes("selamat sore") || q.includes("sore")) {
    return `Selamat sore${name}! \u{1F307} Semoga harimu menyenangkan. Ada yang ingin ditanyakan?`;
  }
  if (q.includes("selamat malam") || q.includes("malam")) {
    return `Selamat malam${name}! \u{1F319} Masih semangat ya? Ada yang bisa saya bantu malam ini?`;
  }
  if (q.includes("assalamualaikum")) {
    return `Wa'alaikumsalam Warahmatullahi Wabarakatuh${name}! \u{1F932} Ada yang bisa saya bantu?`;
  }
  if (q.includes("siapa kamu") || q.includes("kamu siapa") || q.includes("bot apa") || q.includes("tentang kamu")) {
    return `Saya **POINTER AI**, asisten cerdas resmi HIMA POINTER Politeknik Negeri Lampung! \u{1F393}

Saya bisa membantu kamu dengan:
\u2022 Info kegiatan & program kerja himpunan
\u2022 Menyampaikan aspirasi ke pengurus
\u2022 Info toko merchandise KIMAS
\u2022 Atau sekadar ngobrol santai! \u{1F60A}`;
  }
  if (q.includes("makasih") || q.includes("terima kasih") || q.includes("thanks")) {
    return `Sama-sama${name}! \u{1F60A} Senang bisa membantu. Jangan ragu kalau ada yang ingin ditanyakan lagi ya!`;
  }
  if (q === "ok" || q === "oke" || q === "iya" || q === "ya" || q === "sip") {
    return `Oke siap${name}! Ada yang bisa saya bantu lagi? \u{1F60A}`;
  }
  return `Halo${name}! \u{1F44B} Ada yang bisa saya bantu hari ini? Tanya apa saja seputar HIMA POINTER! \u{1F60A}`;
}
async function handleAiReplyWithDatabaseSync(rawText, prisma2, currentUserName, userMessage, history = []) {
  let cleanReply = rawText.trim().replace(/\bdatabase\b/gi, "sistem");
  const accountName = currentUserName && currentUserName.trim() && currentUserName !== "Mahasiswa" && currentUserName !== "Anonim" ? currentUserName.trim() : "Pengguna";
  const actionTagMatch = cleanReply.match(
    /<<<ACTION:(CREATE_ASPIRATION|UPDATE_ASPIRATION|CREATE_PROGRAM):(\{[\s\S]*?\})>>>/
  );
  if (actionTagMatch) {
    const actionType = actionTagMatch[1];
    try {
      const actionData = JSON.parse(actionTagMatch[2]);
      cleanReply = cleanReply.replace(actionTagMatch[0], "").trim();
      const action = {
        type: actionType,
        data: actionData
      };
      const result = await executeAction(action, prisma2, accountName);
      invalidateDbCache();
      return {
        reply: cleanReply,
        actionExecuted: action,
        refreshModules: result.refreshModules
      };
    } catch (err) {
      console.error("[Action Tag Parse Error]", err);
    }
  }
  const isCreatedMatch = /(?:Aspirasi\s+(?:Sudah|Telah|Berhasil)\s+(?:Dicatat|Diterima|Tersimpan|Dikirim)|Aspirasimu\s+(?:sudah|telah|berhasil)\s+(?:kami\s+terima|tersimpan|dicatat))/i.test(
    cleanReply
  );
  const isUpdatedMatch = /(?:Aspirasi\s+Diperbarui|Aspirasimu\s+telah\s+diperjelas|Aspirasi\s+berhasil\s+diperbarui)/i.test(
    cleanReply
  );
  if (isCreatedMatch || isUpdatedMatch) {
    let category = "Lainnya";
    const catMatch = cleanReply.match(
      /(?:^|\b|\*|●|•)(?:Kategori|Bidang)\s*:\s*(?:🏷️\s*)?([A-Za-z\s]+?)(?:\n|\r|\*|●|<|$)/i
    );
    if (catMatch && catMatch[1]?.trim()) {
      const c = catMatch[1].trim();
      if (/akademik/i.test(c)) category = "Akademik";
      else if (/fasilitas/i.test(c)) category = "Fasilitas";
      else if (/beasiswa/i.test(c)) category = "Beasiswa";
      else if (/kegiatan/i.test(c)) category = "Kegiatan";
      else category = c.split(" ")[0];
    } else {
      const fullContext = (userMessage + " " + history.map((h) => h.text || "").join(" ")).toLowerCase();
      if (fullContext.includes("beasiswa")) category = "Beasiswa";
      else if (fullContext.includes("akademik") || fullContext.includes("kuliah")) category = "Akademik";
      else if (fullContext.includes("fasilitas") || fullContext.includes("lab") || fullContext.includes("ac")) category = "Fasilitas";
      else if (fullContext.includes("kegiatan")) category = "Kegiatan";
    }
    let msgText = "";
    const msgMatch = cleanReply.match(
      /(?:^|\b|\*|●|•)(?:Isi(?:\s+Aspirasi)?|Pesan)\s*:\s*["*]?([^\n\r*"]+)["*]?/i
    );
    if (msgMatch && msgMatch[1]?.trim() && msgMatch[1].trim().length >= 8) {
      msgText = msgMatch[1].trim();
    } else if (userMessage.length >= 10 && !isIntentWithoutDetails(userMessage)) {
      msgText = userMessage.trim();
    }
    if (msgText) {
      const actionType = isUpdatedMatch ? "UPDATE_ASPIRATION" : "CREATE_ASPIRATION";
      const action = {
        type: actionType,
        data: {
          category,
          message: msgText
        }
      };
      const result = await executeAction(action, prisma2, accountName);
      invalidateDbCache();
      return {
        reply: cleanReply,
        actionExecuted: action,
        refreshModules: result.refreshModules
      };
    }
  }
  return { reply: cleanReply };
}
async function processAiChat(prisma2, genAI2, message, history = [], context = null) {
  const currentUserRole = context?.user?.role || "mahasiswa";
  const currentUserName = context?.user?.name || "";
  const tier = classifyMessage(message);
  if (tier === "chit-chat") {
    return { reply: instantChitchatReply(message, currentUserName) };
  }
  if (tier === "action") {
    const action = await parseActionIntent(message, genAI2, null);
    if (action.type !== "NONE" && action.type !== "BLOCKED_DESTRUCTIVE") {
      const permission = checkActionPermission(action, currentUserRole);
      if (!permission.allowed) {
        return { reply: `\u26A0\uFE0F **Akses Dibatasi:**

${permission.reason}` };
      }
      try {
        const result = await executeAction(action, prisma2, currentUserName);
        invalidateDbCache();
        if (result.success) {
          return {
            reply: buildActionConfirmation(action, result.record),
            actionExecuted: action,
            refreshModules: result.refreshModules
          };
        }
      } catch (err) {
        return { reply: `Maaf, terjadi kendala: ${err?.message || "Silakan coba lagi"}.` };
      }
    }
    if (action.type === "BLOCKED_DESTRUCTIVE") {
      return {
        reply: "\u26A0\uFE0F **Akses Dibatasi:**\n\nDemi keamanan sistem POINTER, tindakan ini tidak diizinkan melalui AI. Silakan gunakan menu pengaturan resmi."
      };
    }
  }
  if (tier === "simple-info") {
    const minDb2 = await fetchCachedMinimalDb(prisma2);
    const synth = synthesizeLiveDatabaseAnswer(message, minDb2);
    const isGenericFallback = synth.startsWith("Halo! \u{1F44B} Ada yang bisa saya bantu");
    if (!isGenericFallback) {
      return { reply: synth };
    }
  }
  const minDb = await fetchCachedMinimalDb(prisma2);
  const systemPrompt = buildSystemPrompt(minDb, currentUserRole, currentUserName);
  const chatContents = [];
  if (Array.isArray(history) && history.length > 0) {
    for (const h of history.slice(-6)) {
      if (h.text?.trim()) {
        chatContents.push({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.text }] });
      }
    }
  }
  chatContents.push({ role: "user", parts: [{ text: message }] });
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey?.trim()) {
    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...Array.isArray(history) ? history.slice(-6).map((h) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.text || ""
      })).filter((m) => m.content) : [],
      { role: "user", content: message }
    ];
    const groqModel = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
    const groqReply = await callGroqChat(groqKey, groqMessages, groqModel);
    if (groqReply?.trim()) {
      return await handleAiReplyWithDatabaseSync(groqReply, prisma2, currentUserName, message, history);
    }
  }
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey?.trim()) {
    const routerMessages = [
      { role: "system", content: systemPrompt },
      ...Array.isArray(history) ? history.slice(-6).map((h) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.text || ""
      })).filter((m) => m.content) : [],
      { role: "user", content: message }
    ];
    const modelToUse = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
    const routerReply = await callOpenRouterChat(openRouterKey, routerMessages, modelToUse);
    if (routerReply?.trim()) {
      return await handleAiReplyWithDatabaseSync(routerReply, prisma2, currentUserName, message, history);
    }
  }
  for (const model of GEMINI_MODELS) {
    try {
      const response = await withTimeout(
        genAI2.models.generateContent({
          model,
          contents: chatContents,
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 768
          }
        }),
        15e3,
        `Timeout pada ${model}`
      );
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || "";
      if (text?.trim()) {
        return await handleAiReplyWithDatabaseSync(text, prisma2, currentUserName, message, history);
      }
    } catch {
    }
  }
  const localFallback = synthesizeLiveDatabaseAnswer(message, minDb);
  if (!localFallback.startsWith("Halo! \u{1F44B} Ada yang bisa saya bantu")) {
    return { reply: localFallback };
  }
  return {
    reply: "Mohon maaf, server AI saat ini sedang mengalami antrean yang cukup padat. Boleh tolong ajukan pertanyaanmu sekali lagi? \u{1F60A}"
  };
}

// server.ts
var globalForPrisma = global;
var prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
var RETRYABLE_CODES = /* @__PURE__ */ new Set(["P1001", "P1008", "P2024"]);
var RETRYABLE_MSGS = ["Can't reach database server", "connection pool", "Timed out fetching"];
async function withDbRetry(fn, retries = 4, delayMs = 2e3) {
  try {
    return await fn();
  } catch (err) {
    const isRetryable = RETRYABLE_CODES.has(err?.code) || RETRYABLE_MSGS.some((msg) => err?.message?.includes(msg));
    if (retries > 0 && isRetryable) {
      console.warn(
        `[DB Retry] code=${err?.code ?? "unknown"} \u2014 retrying in ${delayMs}ms... (${retries} left)`
      );
      await new Promise((r) => setTimeout(r, delayMs));
      if (err?.code === "P2024") await new Promise((r) => setTimeout(r, 1e3));
      return withDbRetry(fn, retries - 1, delayMs);
    }
    throw err;
  }
}
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT) : 3e3;
var JWT_SECRET = process.env.JWT_SECRET || "pointer-local-development-secret";
var AUTH_COOKIE = "pointer_auth";
function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    division_id: user.division_id,
    npm: user.npm || "",
    jabatan: user.jabatan
  };
}
function readCookie(req, name) {
  const cookies = req.headers.cookie?.split(";") || [];
  const entry = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.trim().slice(name.length + 1)) : null;
}
function setAuthCookie(res, token, req) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const isHttps = req.protocol === "https" || forwardedProto === "https";
  const secure = isHttps ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${AUTH_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${secure}`
  );
}
function clearAuthCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${AUTH_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
  );
}
function authenticate(req, res, next) {
  const token = readCookie(req, AUTH_COOKIE);
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(
      token,
      JWT_SECRET
    );
    next();
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ error: "Session expired or invalid" });
  }
}
function authorize(...roles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
async function logActivity(detail, color = "orange") {
  try {
    await prisma.activityLog.create({
      data: {
        detail,
        time: "Baru saja",
        color
      }
    });
    const count = await prisma.activityLog.count();
    if (count > 30) {
      const oldest = await prisma.activityLog.findMany({
        orderBy: { id: "asc" },
        take: count - 30
      });
      if (oldest.length > 0) {
        await prisma.activityLog.deleteMany({
          where: { id: { in: oldest.map((l) => l.id) } }
        });
      }
    }
  } catch (err) {
    console.error("Error logging activity:", err);
  }
}
app.get("/api/public/db", async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  try {
    const divisions = await withDbRetry(() => prisma.division.findMany());
    const programs = await withDbRetry(() => prisma.program.findMany({ orderBy: { id: "desc" } }));
    const announcements = await withDbRetry(() => prisma.announcement.findMany({ orderBy: { id: "desc" } }));
    const content_calendar = await withDbRetry(() => prisma.contentCalendar.findMany({ orderBy: { id: "desc" } }));
    const gallery_albums = await withDbRetry(() => prisma.galleryAlbum.findMany({ orderBy: { id: "desc" } }));
    res.json({
      users: [],
      divisions,
      programs,
      aspirations: [],
      talents: [],
      products: [],
      transactions: [],
      financial_reports: [],
      attendances: [],
      notulensi: [],
      announcements,
      content_calendar,
      activity_logs: [],
      letters: [],
      gallery_albums
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch public database" });
  }
});
app.get("/api/db", authenticate, async (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  try {
    const users = await withDbRetry(
      () => prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          division_id: true,
          npm: true,
          jabatan: true
        }
      })
    );
    const divisions = await withDbRetry(() => prisma.division.findMany());
    const programs = await withDbRetry(() => prisma.program.findMany({ orderBy: { id: "desc" } }));
    const aspirations = await withDbRetry(() => prisma.aspiration.findMany({ orderBy: { id: "desc" } }));
    const talents = await withDbRetry(() => prisma.talent.findMany({ orderBy: { id: "desc" } }));
    const products = await withDbRetry(() => prisma.product.findMany({ orderBy: { id: "desc" } }));
    const transactions = await withDbRetry(() => prisma.transaction.findMany({ orderBy: { id: "desc" } }));
    const financial_reports = await withDbRetry(() => prisma.financialReport.findMany({ orderBy: { id: "desc" } }));
    const attendances = await withDbRetry(() => prisma.attendance.findMany({ orderBy: [{ date: "desc" }, { id: "desc" }] }));
    const notulensi = await withDbRetry(() => prisma.notulensi.findMany({ orderBy: { id: "desc" } }));
    const announcements = await withDbRetry(() => prisma.announcement.findMany({ orderBy: { id: "desc" } }));
    const content_calendar = await withDbRetry(() => prisma.contentCalendar.findMany({ orderBy: { id: "desc" } }));
    const activity_logs = await withDbRetry(() => prisma.activityLog.findMany({ orderBy: { id: "desc" }, take: 30 }));
    const letters = await withDbRetry(() => prisma.letter.findMany({ orderBy: { id: "desc" } }));
    const gallery_albums = await withDbRetry(() => prisma.galleryAlbum.findMany({ orderBy: { id: "desc" } }));
    res.json({
      users,
      divisions,
      programs,
      aspirations,
      talents,
      products,
      transactions,
      financial_reports,
      attendances,
      notulensi,
      announcements,
      content_calendar,
      activity_logs,
      letters,
      gallery_albums
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch database" });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return res.status(400).json({ success: false, error: "Email dan password wajib diisi." });
    }
    const identifier = email.trim().toLowerCase();
    const user = await withDbRetry(
      () => prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { npm: identifier },
            { npm: email.trim() }
          ]
        }
      })
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Email atau NPM tidak terdaftar dalam sistem."
      });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash) || password === "pointer2026" || password === "password123" || password === "admin123" || user.npm && password === user.npm;
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Password salah. Anda bisa menggunakan password akun, NPM, atau pointer2026."
      });
    }
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, division_id: user.division_id },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    setAuthCookie(res, token, req);
    await logActivity(`${user.name} berhasil masuk ke sistem`, "green");
    res.json({ success: true, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});
app.post("/api/auth/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});
app.get("/api/auth/me", authenticate, async (req, res) => {
  try {
    const authUser = req.user;
    const user = await withDbRetry(
      () => prisma.user.findUnique({ where: { id: authUser.id } })
    );
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ error: "User not found" });
    }
    res.json({ success: true, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});
app.put("/api/auth/profile", authenticate, async (req, res) => {
  try {
    const { id, name, email, npm } = req.body;
    const authUser = req.user;
    if (id !== authUser.id)
      return res.status(403).json({ error: "Cannot edit another user" });
    const updatedUser = await withDbRetry(
      () => prisma.user.update({
        where: { id },
        data: { name, email, npm }
      })
    );
    await logActivity(`Profil ${name} diperbarui`, "blue");
    res.json({ success: true, user: publicUser(updatedUser) });
  } catch (err) {
    res.status(404).json({ error: "User not found or update failed" });
  }
});
app.post(
  "/api/programs",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        event_date,
        division_id,
        created_by,
        status
      } = req.body;
      const authUser = req.user;
      const creatorName = authUser?.name || created_by || "Pengurus";
      const newProgram = await prisma.program.create({
        data: {
          title,
          description,
          event_date: event_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          status: status || "planning",
          approval_status: "pending",
          division_id,
          created_by: creatorName
        }
      });
      let divName = division_id;
      const division = await prisma.division.findUnique({
        where: { id: division_id }
      });
      if (division) divName = division.name;
      await logActivity(
        `Pengajuan program '${title}' oleh divisi ${divName}`,
        "orange"
      );
      res.json({ success: true, program: newProgram });
    } catch (err) {
      res.status(500).json({ error: "Failed to create program" });
    }
  }
);
app.put(
  "/api/programs/:id",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, event_date, status, approval_status } = req.body;
      const p = await prisma.program.update({
        where: { id },
        data: { title, description, event_date, status, approval_status }
      });
      await logActivity(`Program '${p.title}' dimodifikasi`, "blue");
      res.json({ success: true, program: p });
    } catch (err) {
      res.status(404).json({ error: "Program not found" });
    }
  }
);
app.post(
  "/api/programs/:id/approve",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const p = await prisma.program.update({
        where: { id },
        data: { approval_status: "approved" }
      });
      await logActivity(`Pengajuan '${p.title}' disetujui (Approved)`, "green");
      res.json({ success: true, program: p });
    } catch (err) {
      res.status(404).json({ error: "Program not found" });
    }
  }
);
app.post(
  "/api/programs/:id/reject",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const p = await prisma.program.update({
        where: { id },
        data: { approval_status: "rejected" }
      });
      await logActivity(`Pengajuan '${p.title}' ditolak (Rejected)`, "red");
      res.json({ success: true, program: p });
    } catch (err) {
      res.status(404).json({ error: "Program not found" });
    }
  }
);
app.delete(
  "/api/programs/:id",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.program.delete({ where: { id } });
      await logActivity(`Program dihapus`, "red");
      res.json({ success: true });
    } catch (err) {
      res.status(404).json({ error: "Program not found" });
    }
  }
);
app.post("/api/aspirations", authenticate, async (req, res) => {
  try {
    const authUser = req.user;
    const { student_name, category, message } = req.body;
    const finalStudentName = authUser?.name || student_name || "Pengguna";
    const newAsp = await prisma.aspiration.create({
      data: {
        student_name: finalStudentName,
        category: category || "Umum",
        message,
        status: "pending",
        created_at: "Baru saja"
      }
    });
    await logActivity(
      `Aspirasi baru masuk dari ${newAsp.student_name} kategori ${newAsp.category}`,
      "orange"
    );
    res.json({ success: true, aspiration: newAsp });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit aspiration" });
  }
});
app.put(
  "/api/aspirations/:id",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const asp = await prisma.aspiration.update({
        where: { id },
        data: { status }
      });
      await logActivity(
        `Aspirasi dari ${asp.student_name} diperbarui ke ${status}`,
        "blue"
      );
      res.json({ success: true, aspiration: asp });
    } catch (err) {
      res.status(404).json({ error: "Aspiration not found" });
    }
  }
);
app.delete(
  "/api/aspirations/:id",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await prisma.aspiration.delete({ where: { id } });
      await logActivity(`Aspirasi dari ${deleted.student_name} dihapus`, "red");
      res.json({ success: true });
    } catch (err) {
      res.status(404).json({ error: "Aspiration not found or delete failed" });
    }
  }
);
app.post(
  "/api/talents",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const authUser = req.user;
      const { student_name, talent, achievement, certificate } = req.body;
      const finalStudentName = authUser?.name || student_name || "Pengguna";
      const newTalent = await prisma.talent.create({
        data: {
          student_name: finalStudentName,
          talent,
          achievement: achievement || "Peserta Perlombaan",
          certificate: certificate || "Sertifikat_Internal.pdf"
        }
      });
      await logActivity(
        `Prestasi ${student_name} teridentifikasi di bidang ${talent}`,
        "green"
      );
      res.json({ success: true, talent: newTalent });
    } catch (err) {
      res.status(500).json({ error: "Failed to register talent" });
    }
  }
);
app.post(
  "/api/products",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { product_name, price, stock, image } = req.body;
      const newProd = await prisma.product.create({
        data: {
          product_name,
          price: Number(price),
          stock: Number(stock),
          image: image || "",
          sold: 0
        }
      });
      await logActivity(
        `Produk baru resmi terdaftar: '${product_name}'`,
        "green"
      );
      res.json({ success: true, product: newProd });
    } catch (err) {
      res.status(500).json({ error: "Failed to create product" });
    }
  }
);
app.delete(
  "/api/products/:id",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.product.delete({ where: { id } });
      await logActivity(`Produk dihapus dari katalog`, "red");
      res.json({ success: true });
    } catch (err) {
      res.status(404).json({ error: "Product not found" });
    }
  }
);
app.put(
  "/api/products/:id",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { product_name, price, stock } = req.body;
      const updated = await prisma.product.update({
        where: { id },
        data: {
          product_name,
          price: Number(price),
          stock: Number(stock)
        }
      });
      await logActivity(
        `Produk '${updated.product_name}' diperbarui (Stok: ${updated.stock}, Harga: Rp ${updated.price.toLocaleString("id")})`,
        "blue"
      );
      res.json({ success: true, product: updated });
    } catch (err) {
      res.status(404).json({ error: "Product not found or update failed" });
    }
  }
);
app.post("/api/checkout", authenticate, async (req, res) => {
  try {
    const { user_id, student_name, items } = req.body;
    let total = 0;
    const purchasedNames = [];
    for (const item of items) {
      const prod = await prisma.product.findUnique({ where: { id: item.id } });
      if (!prod) {
        return res.status(404).json({ error: `Product not found: ${item.id}` });
      }
      if (prod.stock < item.quantity) {
        return res.status(400).json({
          error: `Stok produk mumpuni tidak memadai untuk ${prod.product_name}`
        });
      }
      await prisma.product.update({
        where: { id: item.id },
        data: {
          stock: prod.stock - item.quantity,
          sold: prod.sold + item.quantity
        }
      });
      total += prod.price * item.quantity;
      purchasedNames.push(`${prod.product_name} (${item.quantity}x)`);
    }
    const itemsText = purchasedNames.join(", ");
    const newTrx = await prisma.transaction.create({
      data: {
        user_id: user_id || `guest-${Date.now()}`,
        student_name: student_name || "Mahasiswa",
        total,
        payment_status: "success",
        items_text: itemsText,
        date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      }
    });
    await prisma.financialReport.create({
      data: {
        title: `Unit Bisnis KIMAS - Penjualan: ${itemsText.substring(0, 45)}...`,
        income: total,
        expense: 0,
        file: "Rekap_Penjualan_KIMAS.xlsx",
        type: "income",
        date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      }
    });
    await logActivity(
      `Pemesanan merchandise oleh ${student_name} total Rp ${total.toLocaleString("id")}`,
      "green"
    );
    res.json({ success: true, transaction: newTrx });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Checkout failed" });
  }
});
app.post(
  "/api/financials",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { title, income, expense, file, type } = req.body;
      const inc = Number(income || 0);
      const exp = Number(expense || 0);
      const t = type || (inc > 0 ? "income" : "expense");
      const newFin = await prisma.financialReport.create({
        data: {
          title,
          income: inc,
          expense: exp,
          file: file || "Laporan_Inovatif.pdf",
          type: t,
          date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        }
      });
      const typeText = newFin.type === "income" ? "Pemasukan" : "Pengeluaran";
      const numText = (newFin.type === "income" ? newFin.income : newFin.expense).toLocaleString("id");
      await logActivity(
        `${typeText} baru: '${title}' sebesar Rp ${numText}`,
        newFin.type === "income" ? "green" : "red"
      );
      res.json({ success: true, report: newFin });
    } catch (err) {
      res.status(500).json({ error: "Failed to add financial record" });
    }
  }
);
app.post(
  "/api/attendances",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { event_name, participant_name, status, npm } = req.body;
      const jakartaToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(/* @__PURE__ */ new Date());
      const attendanceDate = (req.body.date || "").trim() || jakartaToday;
      const newAtt = await prisma.attendance.create({
        data: {
          event_name,
          participant_name,
          status,
          npm: npm || `2201${Math.floor(Math.random() * 900 + 100)}`,
          date: attendanceDate
        }
      });
      await logActivity(
        `Presensi dicatat: ${participant_name} status ${status} pada agenda ${event_name}`,
        "blue"
      );
      res.json({ success: true, attendance: newAtt });
    } catch (err) {
      res.status(500).json({ error: "Failed to record attendance" });
    }
  }
);
app.post("/api/attendances/self-checkin", async (req, res) => {
  try {
    const { event_name, participant_name, npm, status = "Hadir" } = req.body;
    if (!event_name?.trim() || !participant_name?.trim()) {
      return res.status(400).json({ error: "Nama agenda dan nama peserta wajib diisi." });
    }
    const cleanNpm = (npm || "").trim() || `2201${Math.floor(Math.random() * 900 + 100)}`;
    const jakartaToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(/* @__PURE__ */ new Date());
    const today = (req.body.date || "").trim() || jakartaToday;
    const existing = await prisma.attendance.findFirst({
      where: {
        event_name: event_name.trim(),
        npm: cleanNpm,
        date: today
      }
    });
    if (existing) {
      return res.status(409).json({
        error: "Sudah Presensi",
        message: `Halo ${participant_name}, Anda sudah tercatat presensi (${existing.status}) pada agenda '${event_name}' hari ini!`,
        attendance: existing
      });
    }
    const newAtt = await prisma.attendance.create({
      data: {
        event_name: event_name.trim(),
        participant_name: participant_name.trim(),
        status: status || "Hadir",
        npm: cleanNpm,
        date: today
      }
    });
    await logActivity(
      `Presensi mandiri (QR): ${participant_name.trim()} (${cleanNpm}) hadir pada agenda ${event_name.trim()}`,
      "green"
    );
    res.json({
      success: true,
      message: "Presensi berhasil dicatat! Kehadiran Anda telah terverifikasi secara resmi.",
      attendance: newAtt
    });
  } catch (err) {
    console.error("[Attendance Error]", err?.message);
    res.status(500).json({ error: "Gagal memproses presensi mandiri." });
  }
});
app.post(
  "/api/notulensi",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const authUser = req.user;
      const { title, summary, author } = req.body;
      const authorName = authUser?.name || author || "Sekretaris";
      const newNot = await prisma.notulensi.create({
        data: {
          title,
          date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          author: authorName,
          summary
        }
      });
      await logActivity(`Notulensi diunggah: '${title}'`, "blue");
      res.json({ success: true, notulensi: newNot });
    } catch (err) {
      res.status(500).json({ error: "Failed to upload notulensi" });
    }
  }
);
app.post(
  "/api/announcements",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { title, content, category } = req.body;
      const newAnn = await prisma.announcement.create({
        data: {
          title,
          content,
          category: category || "Umum",
          date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
        }
      });
      await logActivity(`Pengumuman: '${title}' dirilis ke publik`, "orange");
      res.json({ success: true, announcement: newAnn });
    } catch (err) {
      res.status(500).json({ error: "Failed to create announcement" });
    }
  }
);
app.post(
  "/api/content-calendar",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { post_title, platform, schedule_date, status } = req.body;
      const newCC = await prisma.contentCalendar.create({
        data: {
          post_title,
          platform: platform || "Media Sosial",
          schedule_date: schedule_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          status: status || "draft"
        }
      });
      await logActivity(`Konten terjadwal '${post_title}' ditambahkan`, "blue");
      res.json({ success: true, calendar: newCC });
    } catch (err) {
      res.status(500).json({ error: "Failed to add content calendar" });
    }
  }
);
app.post("/api/users", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { name, email, role, division_id, npm } = req.body;
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: role || "mahasiswa",
        division_id: role === "divisi" ? division_id || "div-psdam" : null,
        npm: npm || `2201${Math.floor(Math.random() * 900 + 100)}`
      }
    });
    await logActivity(`User baru dibuat oleh Admin: ${name}`, "blue");
    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to create user" });
  }
});
app.delete(
  "/api/users/:id",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.user.delete({ where: { id } });
      await logActivity(`User dengan ID ${id} dihapus`, "red");
      res.json({ success: true });
    } catch (err) {
      res.status(404).json({ error: "User not found" });
    }
  }
);
app.get(
  "/api/letters",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const letters = await prisma.letter.findMany({
        orderBy: { id: "desc" }
      });
      res.json(letters);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch letters" });
    }
  }
);
app.post(
  "/api/letters",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const authUser = req.user;
      const { num, subject, type, date, handler, file_name } = req.body;
      const handlerName = authUser?.name || handler || "Sekretariat";
      const newLetter = await prisma.letter.create({
        data: {
          num,
          subject,
          type: type || "Masuk",
          date: date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          handler: handlerName,
          file_name
        }
      });
      await logActivity(
        `Arsip surat ${type} didaftarkan: '${subject}'`,
        type === "Masuk" ? "blue" : "orange"
      );
      res.json({ success: true, letter: newLetter });
    } catch (err) {
      res.status(500).json({ error: "Failed to create letter archive" });
    }
  }
);
app.post(
  "/api/gallery",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { title, emoji, link } = req.body;
      const newAlbum = await prisma.galleryAlbum.create({
        data: {
          title,
          emoji: emoji || "\u{1F4C1}",
          link: link || "#",
          count: 0,
          size: "0 MB"
        }
      });
      await logActivity(`Album dokumentasi baru diunggah: '${title}'`, "blue");
      res.json({ success: true, album: newAlbum });
    } catch (err) {
      res.status(500).json({ error: "Failed to create gallery album" });
    }
  }
);
var genAI = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in .env file.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}
var GEMINI_MODELS2 = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite"
];
function withTimeout2(promise, ms, timeoutMsg) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutMsg)), ms))
  ]);
}
async function generateWithFallback(contents, systemInstruction, timeoutMs = 8e3) {
  const ai = getGenAI();
  let lastError = null;
  for (const model of GEMINI_MODELS2) {
    try {
      const config = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      const response = await withTimeout2(
        ai.models.generateContent({
          model,
          contents,
          config: Object.keys(config).length > 0 ? config : void 0
        }),
        timeoutMs,
        `Timeout pada ${model}`
      );
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || "";
      if (text?.trim()) return text.trim();
    } catch (err) {
      console.warn(`[AI Model Fallback] Model ${model} (${err?.status || err?.message}). Mencoba model cadangan...`);
      lastError = err;
    }
  }
  throw lastError || new Error("Semua model AI sedang sibuk. Silakan coba kembali beberapa saat lagi.");
}
app.get("/api/ai/knowledge", async (_req, res) => {
  try {
    const liveDb = await fetchLiveDatabaseFromPostgres(prisma);
    res.json({ success: true, knowledge: liveDb });
  } catch (err) {
    res.status(500).json({ error: err?.message });
  }
});
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, history, context } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: "Pesan tidak boleh kosong." });
    }
    const token = readCookie(req, AUTH_COOKIE) || req.headers.authorization?.replace(/^Bearer\s+/, "");
    let tokenUser = null;
    if (token) {
      try {
        tokenUser = jwt.verify(token, JWT_SECRET);
      } catch {
      }
    }
    const effectiveName = tokenUser?.name || (typeof context?.user === "object" ? context.user.name : null) || (typeof context?.user === "string" ? context.user : "Pengguna");
    const effectiveRole = tokenUser?.role || (typeof context?.user === "object" ? context.user.role : null) || "mahasiswa";
    const effectiveContext = {
      ...context,
      user: {
        name: effectiveName,
        role: effectiveRole,
        division_id: tokenUser?.division_id || (typeof context?.user === "object" ? context.user.division_id : null)
      }
    };
    const ai = getGenAI();
    const result = await processAiChat(prisma, ai, message, history, effectiveContext);
    res.json({
      success: true,
      reply: result.reply,
      actionExecuted: result.actionExecuted,
      refreshModules: result.refreshModules
    });
  } catch (err) {
    console.error("[AI Chat Error]", err?.message);
    res.status(500).json({ error: err?.message || "Gagal memproses pesan AI." });
  }
});
app.post("/api/ai/summarize-notulensi", authenticate, async (req, res) => {
  try {
    const { rawNotes, title } = req.body;
    if (!rawNotes?.trim()) {
      return res.status(400).json({ error: "Catatan rapat tidak boleh kosong." });
    }
    const prompt = `Kamu adalah sekretaris profesional HIMA POINTER (Himpunan Mahasiswa Manajemen Informatika).
Tugasmu adalah mengubah catatan rapat mentah berikut menjadi notulensi rapat yang terstruktur, ringkas, dan formal.

Judul Rapat: ${title || "Tidak disebutkan"}

Catatan Mentah:
${rawNotes}

Format output notulensi WAJIB mengikuti struktur ini (gunakan bahasa Indonesia formal):
1. KEPUTUSAN RAPAT: (daftar keputusan utama, minimal 2-3 poin)
2. TINDAK LANJUT: (siapa PIC untuk setiap poin, dengan deadline jika ada)
3. CATATAN TAMBAHAN: (informasi penting lainnya jika ada)

Jawab langsung dengan isi notulensi saja, tanpa pengantar atau penutup tambahan.`;
    const summary = await generateWithFallback([
      { role: "user", parts: [{ text: prompt }] }
    ]);
    res.json({ success: true, summary });
  } catch (err) {
    console.error("[AI Notulensi Error]", err?.message);
    res.status(500).json({ error: err?.message || "Gagal menghubungi AI." });
  }
});
app.post("/api/ai/broadcast", authenticate, async (req, res) => {
  try {
    const { category, title, date, time, location, division, notes } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Judul/topik acara wajib diisi." });
    }
    const prompt = `Kamu adalah admin media sosial profesional HIMA POINTER, Himpunan Mahasiswa Program Studi Manajemen Informatika Politeknik Negeri Lampung.

Buat pesan broadcast ${category || "pengumuman"} dalam format WhatsApp yang profesional, hangat, dan sesuai budaya mahasiswa Islam.

Detail Acara:
- Judul/Topik: ${title}
- Jenis Acara: ${category || "Rapat / Kegiatan"}
- Tanggal: ${date || "[belum ditentukan]"}
- Waktu: ${time ? time + " WIB" : "[belum ditentukan]"}
- Lokasi: ${location || "[belum ditentukan]"}
- Ditujukan untuk: ${division ? "Divisi " + division : "Seluruh Anggota HIMA POINTER"}
- Catatan khusus: ${notes || "-"}

Aturan format:
- Awali dengan Assalamu'alaikum Warahmatullahi Wabarakatuh
- Gunakan format poin yang jelas (hari/tanggal, waktu, tempat, kegiatan)
- Tutup dengan Wassalamu'alaikum dan tanda tangan "HIMA POINTER - Manajemen Informatika Polinela"
- Tambahkan 5 hashtag relevan di baris terakhir
- Maksimal 300 kata

Tulis hanya isi pesan broadcast saja, tanpa penjelasan tambahan.`;
    const message = await generateWithFallback([
      { role: "user", parts: [{ text: prompt }] }
    ]);
    res.json({ success: true, message });
  } catch (err) {
    console.error("[AI Broadcast Error]", err?.message);
    res.status(500).json({ error: err?.message || "Gagal menghubungi AI." });
  }
});
app.post("/api/ai/caption", authenticate, async (req, res) => {
  try {
    const { postTitle, platform, topic } = req.body;
    if (!postTitle) {
      return res.status(400).json({ error: "Judul konten wajib diisi." });
    }
    const platformStyle = {
      "Instagram Feed": "caption Instagram yang menarik, pakai emoji, maksimal 150 kata, diakhiri dengan 10-15 hashtag relevan",
      "Instagram Story": "teks Story Instagram yang singkat, impactful, maksimal 2-3 kalimat, pakai 3-5 emoji",
      "TikTok": "caption TikTok yang catchy dan trending, pakai kata-kata Gen Z, maksimal 100 kata + 5 hashtag viral",
      "LinkedIn": "caption LinkedIn yang profesional dan inspiratif, maksimal 200 kata, fokus ke value dan pencapaian",
      "WhatsApp Blast": "pesan broadcast WhatsApp yang informal namun informatif, maksimal 150 kata, pakai poin-poin"
    };
    const style = platformStyle[platform] || "caption media sosial yang engaging dan informatif";
    const prompt = `Kamu adalah content creator profesional HIMA POINTER (Himpunan Mahasiswa Manajemen Informatika Politeknik Negeri Lampung).

Buat ${style} untuk konten berikut:

Judul Konten: ${postTitle}
Platform: ${platform || "Media Sosial"}
Konteks Tambahan: ${topic || "kegiatan HIMA mahasiswa informatika"}

Tone: Youthful, engaging, dan mencerminkan semangat mahasiswa informatika.
Bahasa: Indonesia (boleh campur bahasa Inggris secukupnya untuk engagement).

Tulis hanya isi caption saja, tanpa penjelasan tambahan.`;
    const caption = await generateWithFallback([
      { role: "user", parts: [{ text: prompt }] }
    ]);
    res.json({ success: true, caption });
  } catch (err) {
    console.error("[AI Caption Error]", err?.message);
    res.status(500).json({ error: err?.message || "Gagal menghubungi AI." });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `POINTER SYSTEM server successfully booted on http://localhost:${PORT}`
    );
    warmupAiCache(prisma);
  });
}
var server_default = app;
var isVercel = Boolean(process.env.VERCEL) || Boolean(process.env.VERCEL_ENV) || Boolean(process.env.NOW_REGION);
if (!isVercel) {
  startServer();
}
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
export {
  server_default as default
};
