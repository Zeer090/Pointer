import { PrismaClient } from "@prisma/client";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

// Helper timeout agar server tidak hang jika API lambat
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutMsg)), ms)),
  ]);
}

// ----------------------------------------------------
// PROVIDER 1: GROQ (Ultra Fast ~300-500 tokens/detik, Free Tier)
// Model default: qwen/qwen3.8-27b (Alibaba Qwen di Groq LPU ~300 tokens/detik)
// ----------------------------------------------------
async function callGroqChat(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model: string = process.env.GROQ_MODEL || "qwen/qwen3.8-27b"
): Promise<string | null> {
  try {
    const res = await withTimeout(
      fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      }),
      8000,
      "Timeout Groq"
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

// ----------------------------------------------------
// PROVIDER 2: OPENROUTER (Multi-Model Hub, Mendukung Model Gratis)
// Model default: meta-llama/llama-3.3-70b-instruct:free atau deepseek/deepseek-chat
// ----------------------------------------------------
async function callOpenRouterChat(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model: string = "meta-llama/llama-3.3-70b-instruct:free"
): Promise<string | null> {
  try {
    const res = await withTimeout(
      fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "POINTER AI",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      }),
      10000,
      "Timeout OpenRouter"
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

export interface LiveDatabaseSnapshot {
  syncedAt: string;
  counts: Record<string, number>;
  users: Array<{ id: string; name: string; role: string; npm: string | null; jabatan: string | null; division_name: string }>;
  divisions: Array<{ id: string; name: string; userCount: number; programCount: number }>;
  programs: Array<{ id: string; title: string; description: string; event_date: string; status: string; approval_status: string; division_name: string; created_by: string }>;
  aspirations: Array<{ id: string; student_name: string; category: string; message: string; status: string; created_at: string }>;
  products: Array<{ id: string; product_name: string; price: number; stock: number; sold: number }>;
  transactions: Array<{ id: string; student_name: string; total: number; payment_status: string; items_text: string; date: string }>;
  financialReports: Array<{ id: string; title: string; income: number; expense: number; type: string; date: string }>;
  announcements: Array<{ id: string; title: string; content: string; category: string; date: string }>;
  letters: Array<{ id: string; num: string; subject: string; type: string; date: string; handler: string }>;
  notulensi: Array<{ id: string; title: string; date: string; author: string; summary: string }>;
  talents: Array<{ id: string; student_name: string; talent: string; achievement: string }>;
  activityLogs: Array<{ id: string; detail: string; time: string }>;
}

export async function fetchLiveDatabaseFromPostgres(prisma: PrismaClient): Promise<LiveDatabaseSnapshot> {
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
    rawActivities,
  ] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, role: true, npm: true, jabatan: true, division_id: true },
      take: 100,
    }),
    prisma.division.findMany({
      include: {
        _count: {
          select: { users: true, programs: true },
        },
      },
    }),
    prisma.program.findMany({
      include: { division: true },
      orderBy: { id: "desc" },
      take: 50,
    }),
    prisma.aspiration.findMany({
      orderBy: { id: "desc" },
      take: 50,
    }),
    prisma.product.findMany({
      take: 30,
    }),
    prisma.transaction.findMany({
      orderBy: { id: "desc" },
      take: 20,
    }),
    prisma.financialReport.findMany({
      orderBy: { id: "desc" },
      take: 15,
    }),
    prisma.announcement.findMany({
      orderBy: { id: "desc" },
      take: 15,
    }),
    prisma.letter.findMany({
      orderBy: { id: "desc" },
      take: 20,
    }),
    prisma.notulensi.findMany({
      orderBy: { id: "desc" },
      take: 15,
    }),
    prisma.talent.findMany({
      take: 20,
    }),
    prisma.activityLog.findMany({
      orderBy: { id: "desc" },
      take: 15,
    }),
  ]);

  const divMap = new Map(rawDivisions.map((d) => [d.id, d.name]));

  return {
    syncedAt: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
    counts: {
      totalUsers: rawUsers.length,
      totalDivisions: rawDivisions.length,
      totalPrograms: rawPrograms.length,
      totalAspirations: rawAspirations.length,
      totalProducts: rawProducts.length,
      totalTransactions: rawTransactions.length,
      totalLetters: rawLetters.length,
      totalAnnouncements: rawAnnouncements.length,
    },
    users: rawUsers.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      npm: u.npm,
      jabatan: u.jabatan,
      division_name: divMap.get(u.division_id || "") || "Umum",
    })),
    divisions: rawDivisions.map((d) => ({
      id: d.id,
      name: d.name,
      userCount: d._count.users,
      programCount: d._count.programs,
    })),
    programs: rawPrograms.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      event_date: p.event_date,
      status: p.status,
      approval_status: p.approval_status,
      division_name: p.division?.name || "Umum",
      created_by: p.created_by,
    })),
    aspirations: rawAspirations.map((a) => ({
      id: a.id,
      student_name: a.student_name,
      category: a.category,
      message: a.message,
      status: a.status,
      created_at: a.created_at,
    })),
    products: rawProducts.map((pr) => ({
      id: pr.id,
      product_name: pr.product_name,
      price: pr.price,
      stock: pr.stock,
      sold: pr.sold,
    })),
    transactions: rawTransactions.map((t) => ({
      id: t.id,
      student_name: t.student_name,
      total: t.total,
      payment_status: t.payment_status,
      items_text: t.items_text,
      date: t.date,
    })),
    financialReports: rawFinancials.map((f) => ({
      id: f.id,
      title: f.title,
      income: f.income,
      expense: f.expense,
      type: f.type,
      date: f.date,
    })),
    announcements: rawAnnouncements.map((an) => ({
      id: an.id,
      title: an.title,
      content: an.content,
      category: an.category,
      date: an.date,
    })),
    letters: rawLetters.map((l) => ({
      id: l.id,
      num: l.num,
      subject: l.subject,
      type: l.type,
      date: l.date,
      handler: l.handler,
    })),
    notulensi: rawNotulensi.map((n) => ({
      id: n.id,
      title: n.title,
      date: n.date,
      author: n.author,
      summary: n.summary,
    })),
    talents: rawTalents.map((tl) => ({
      id: tl.id,
      student_name: tl.student_name,
      talent: tl.talent,
      achievement: tl.achievement,
    })),
    activityLogs: rawActivities.map((ac) => ({
      id: ac.id,
      detail: ac.detail,
      time: ac.time,
    })),
  };
}

// =====================================
// ACTION ENGINE DENGAN ROLE-BASED ACCESS CONTROL
// =====================================

export interface AgentAction {
  type:
  | "CREATE_ASPIRATION"
  | "CREATE_PROGRAM"
  | "CREATE_ANNOUNCEMENT"
  | "CREATE_FINANCIAL"
  | "CREATE_TALENT"
  | "UPDATE_ASPIRATION_STATUS"
  | "BLOCKED_DESTRUCTIVE"
  | "NONE";
  data: Record<string, any>;
  targetId?: string;
}

interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validasi Hak Akses & Batasan AI sesuai Tupoksi Role:
 * - mahasiswa / publik: Hanya boleh mengajukan aspirasi dan bertanya/ngobrol
 * - divisi: Boleh mengelola proker, aspirasi, kas divisi, pengumuman, bakat
 * - admin: Akses penuh operasional himpunan
 * - SEMUA ROLE: Dilarang menghapus akun pengguna atau tindakan destruktif lewat AI!
 */
export function checkActionPermission(action: AgentAction, userRole?: string): PermissionResult {
  const role = userRole || "mahasiswa";

  // 1. Blokir tindakan destruktif untuk siapa pun
  if (action.type === "BLOCKED_DESTRUCTIVE") {
    return {
      allowed: false,
      reason:
        "Demi keamanan dan integritas sistem POINTER, tindakan penghapusan akun atau modifikasi sistem tingkat tinggi tidak diizinkan melalui AI. Silakan gunakan menu pengaturan resmi.",
    };
  }

  // 2. Batasan untuk Role Mahasiswa / Tamu
  if (role === "mahasiswa") {
    if (action.type === "CREATE_ASPIRATION") {
      return { allowed: true };
    }
    if (action.type === "CREATE_PROGRAM") {
      return {
        allowed: false,
        reason:
          "Sebagai mahasiswa, kamu memiliki akses untuk menyampaikan aspirasi dan melihat informasi himpunan. Pembuatan program kerja merupakan kewenangan pengurus divisi atau admin ya! 😊",
      };
    }
    if (action.type === "CREATE_FINANCIAL") {
      return {
        allowed: false,
        reason:
          "Pencatatan kas dan keuangan hanya dapat dilakukan oleh bendahara atau pengurus yang berwenang.",
      };
    }
    if (action.type === "CREATE_ANNOUNCEMENT") {
      return {
        allowed: false,
        reason:
          "Penerbitan pengumuman resmi merupakan kewenangan pengurus divisi atau admin himpunan.",
      };
    }
    if (action.type === "UPDATE_ASPIRATION_STATUS") {
      return {
        allowed: false,
        reason:
          "Pembaruan status tindak lanjut aspirasi hanya dapat dilakukan oleh pengurus PSDAM.",
      };
    }
    if (action.type === "CREATE_TALENT") {
      return {
        allowed: false,
        reason:
          "Pendaftaran prestasi mahasiswa diverifikasi dan dikelola oleh divisi Minat & Bakat (MINBAT).",
      };
    }
  }

  // 3. Batasan untuk Role Divisi (Pengurus / Kadiv)
  if (role === "divisi") {
    if (
      action.type === "CREATE_ASPIRATION" ||
      action.type === "CREATE_PROGRAM" ||
      action.type === "UPDATE_ASPIRATION_STATUS" ||
      action.type === "CREATE_FINANCIAL" ||
      action.type === "CREATE_ANNOUNCEMENT" ||
      action.type === "CREATE_TALENT"
    ) {
      return { allowed: true };
    }
  }

  // 4. Role Admin (BPH Inti / Pimpinan)
  if (role === "admin") {
    return { allowed: true };
  }

  return { allowed: false, reason: "Aksi tidak diizinkan untuk peran akun saat ini." };
}

/**
 * Deteksi apakah pesan pengguna hanya menyatakan niat/keinginan untuk membuat/mengajukan sesuatu,
 * TETAPI belum menyertakan isi, deskripsi masalah, atau detail tindakan yang sebenarnya.
 * Jika true, sistem TIDAK BOLEH langsung mengeksekusi mutasi ke database!
 */
export function isIntentWithoutDetails(msg: string): boolean {
  const clean = msg.toLowerCase().replace(/[?!.,]/g, " ").replace(/\s+/g, " ").trim();

  // Pola 1: Niat mengajukan aspirasi/keluhan tanpa isi masalah
  const aspirationIntentOnlyRegex =
    /^(saya\s+)?(mau|ingin|bisa|tolong|mohon)?\s*(ngajuin|mengajukan|kirim|menyampaikan|ajukan|bikin|tulis|buat)\s*(aspirasi|keluhan|saran|masukan|unek-unek|komplain)(\s+(dong|deh|ya|nih|min|kak|tolong|di\s+sini|lewat\s+sini))?$/i;
  if (aspirationIntentOnlyRegex.test(clean)) return true;

  // Pola 2: Niat membuat proker tanpa nama/detail agenda
  const programIntentOnlyRegex =
    /^(saya\s+)?(mau|ingin|bisa|tolong|mohon)?\s*(buat|bikin|tambah|ajukan|buatkan)\s*(proker|program\s*kerja)(\s+baru)?(\s+(dong|deh|ya|nih|min|kak|tolong))?$/i;
  if (programIntentOnlyRegex.test(clean)) return true;

  // Pola 3: Niat mencatat kas tanpa keterangan / nominal
  const financeIntentOnlyRegex =
    /^(saya\s+)?(mau|ingin|bisa|tolong|mohon)?\s*(catat|simpan|tambah|input)\s*(kas|uang|pemasukan|pengeluaran)(\s+(masuk|keluar))?(\s+(dong|deh|ya|nih|min|kak|tolong))?$/i;
  if (financeIntentOnlyRegex.test(clean)) return true;

  // Pola 4: Niat membuat pengumuman tanpa isi pengumuman
  const announcementIntentOnlyRegex =
    /^(saya\s+)?(mau|ingin|bisa|tolong|mohon)?\s*(buat|rilis|posting|bikin|terbitkan)\s*(pengumuman)(\s+baru)?(\s+(dong|deh|ya|nih|min|kak|tolong))?$/i;
  if (announcementIntentOnlyRegex.test(clean)) return true;

  // Pola 5: Niat mendaftarkan prestasi tanpa detail prestasi
  const talentIntentOnlyRegex =
    /^(saya\s+)?(mau|ingin|bisa|tolong|mohon)?\s*(daftarkan|catat|daftar|input)\s*(prestasi|bakat)(\s+(dong|deh|ya|nih|min|kak|tolong))?$/i;
  if (talentIntentOnlyRegex.test(clean)) return true;

  return false;
}

async function parseActionIntent(
  message: string,
  genAI: GoogleGenAI,
  liveDb: any
): Promise<AgentAction> {
  const lowerMsg = message.toLowerCase();

  // ================================================================
  // FAST PATH: Heuristic Lokal dijalankan PERTAMA (0ms, tanpa API)
  // Deteksi aksi umum langsung dari kata kunci — tidak perlu Gemini.
  // Gemini hanya dipanggil jika heuristic tidak mengenali pola.
  // ================================================================

  // Blokir destruktif
  if (
    (lowerMsg.includes("hapus") || lowerMsg.includes("delete") || lowerMsg.includes("drop") || lowerMsg.includes("reset")) &&
    (lowerMsg.includes("user") || lowerMsg.includes("akun") || lowerMsg.includes("database") || lowerMsg.includes("sistem") || lowerMsg.includes("semua"))
  ) {
    return { type: "BLOCKED_DESTRUCTIVE", data: {} };
  }

  // Jika pesan hanya menyatakan niat/keinginan tanpa rincian, JANGAN eksekusi ke database!
  if (isIntentWithoutDetails(message)) {
    return { type: "NONE", data: {} };
  }

  // Aspirasi — pola umum, tangani hanya jika benar-benar ada isi pesan nyata
  if (
    (lowerMsg.includes("aspirasi") || lowerMsg.includes("keluhan") || lowerMsg.includes("saran") || lowerMsg.includes("masukan")) &&
    (lowerMsg.includes("ngajuin") || lowerMsg.includes("kirim") || lowerMsg.includes("ajukan") ||
      lowerMsg.includes("mau") || lowerMsg.includes("tentang") || lowerMsg.includes(":")) &&
    !lowerMsg.includes("bagaimana cara") &&
    !lowerMsg.includes("apa saja") &&
    !lowerMsg.includes("status aspirasi") &&
    !lowerMsg.includes("sebutkan")
  ) {
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
      // Hilangkan awalan umum jika ada
      const stripped = message.replace(/^(halo\s+)?(saya\s+)?(mau|ingin|bisa|tolong)?\s*(ngajuin|mengajukan|kirim|ajukan)\s*(aspirasi|keluhan|saran|masukan)[:\s-]*/i, "").trim();
      if (stripped.length >= 15 && !isIntentWithoutDetails(stripped)) {
        msgText = stripped;
      }
    }

    // Validasi ketat: jika isi aspirasi kosong, terlalu pendek (< 12 karakter), atau hanya menyatakan niat
    if (!msgText || msgText.length < 12 || isIntentWithoutDetails(msgText)) {
      return { type: "NONE", data: {} };
    }

    return { type: "CREATE_ASPIRATION", data: { student_name: "", category: cat, message: msgText } };
  }

  // Proker — buat/tambah proker baru (hanya jika ada judul yang jelas)
  if (
    (lowerMsg.includes("proker") || lowerMsg.includes("program kerja")) &&
    (lowerMsg.includes("buat") || lowerMsg.includes("tambah") || lowerMsg.includes("bikin"))
  ) {
    const today = new Date().toISOString().split("T")[0];
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
        created_by: "Pengurus",
      },
    };
  }

  // Kas / Keuangan — catat kas masuk/keluar (wajib ada nominal nyata)
  if (
    (lowerMsg.includes("catat") || lowerMsg.includes("simpan")) &&
    (lowerMsg.includes("kas") || lowerMsg.includes("masuk") || lowerMsg.includes("keluar") || lowerMsg.includes("uang"))
  ) {
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
        type: isIncome ? "income" : "expense",
      },
    };
  }

  // Pengumuman — buat/rilis pengumuman (wajib ada isi pengumuman)
  if (
    (lowerMsg.includes("buat pengumuman") || lowerMsg.includes("rilis pengumuman") || lowerMsg.includes("posting pengumuman"))
  ) {
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
        category: "Umum",
      },
    };
  }

  // Prestasi / Bakat
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
        achievement: "Peserta",
      },
    };
  }

  // Jika heuristic tidak mengenali pola aksi, langsung return NONE
  // (tidak perlu panggil Gemini untuk intent parsing sederhana)
  // Hanya panggil Gemini jika pesan ambigu dan panjang > 30 karakter
  if (message.length < 30) return { type: "NONE", data: {} };

  // ================================================================
  // SLOW PATH: Gemini API — hanya untuk kasus ambigu / kompleks
  // Timeout diperpendek ke 4s agar gagal cepat
  // ================================================================
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

  // Hanya coba 1 model pertama dengan timeout 4s — sudah cukup untuk kasus ambigu
  try {
    const response = await withTimeout(
      genAI.models.generateContent({
        model: GEMINI_MODELS[0],
        contents: [{ role: "user", parts: [{ text: intentPrompt }] }],
        config: { responseMimeType: "application/json", maxOutputTokens: 128 },
      }),
      4000,
      "Timeout intent parser"
    );
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || "";
    if (text?.trim()) {
      const cleaned = text.trim().replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed?.type) return parsed as AgentAction;
    }
  } catch {
    // Timeout atau parse error — return NONE
  }

  return { type: "NONE", data: {} };
}

async function executeAction(
  action: AgentAction,
  prisma: PrismaClient,
  userName?: string
): Promise<{ success: boolean; record?: any; refreshModules: string[] }> {
  const today = new Date().toISOString().split("T")[0];

  // Gunakan nama akun login resmi (username/name), jangan gunakan generic "Mahasiswa" atau "Anonim"
  const accountName = (userName && userName.trim() && userName !== "Mahasiswa" && userName !== "Anonim")
    ? userName.trim()
    : (action.data?.student_name && action.data.student_name !== "Mahasiswa" && action.data.student_name !== "Anonim")
      ? action.data.student_name
      : (userName?.trim() || "Pengguna");

  switch (action.type) {
    case "CREATE_ASPIRATION": {
      const record = await prisma.aspiration.create({
        data: {
          student_name: accountName,
          category: action.data.category || "Lainnya",
          message: action.data.message,
          status: "pending",
          created_at: "Baru saja",
        },
      });
      await prisma.activityLog.create({
        data: {
          detail: `Aspirasi baru masuk dari ${record.student_name} (${record.category})`,
          time: "Baru saja",
          color: "orange",
        },
      });
      return { success: true, record, refreshModules: ["aspirations", "activity_logs"] };
    }

    case "CREATE_PROGRAM": {
      const divisionId = action.data.division_id || "div-psdam";
      const record = await prisma.program.create({
        data: {
          title: action.data.title,
          description: action.data.description || action.data.title,
          event_date: action.data.event_date || today,
          status: "planning",
          approval_status: "pending",
          division_id: divisionId,
          created_by: accountName,
        },
      });
      await prisma.activityLog.create({
        data: {
          detail: `Program kerja baru diajukan oleh ${accountName}: '${record.title}'`,
          time: "Baru saja",
          color: "green",
        },
      });
      return { success: true, record, refreshModules: ["programs", "activity_logs"] };
    }

    case "CREATE_ANNOUNCEMENT": {
      const record = await prisma.announcement.create({
        data: {
          title: action.data.title,
          content: action.data.content,
          category: action.data.category || "Umum",
          date: today,
        },
      });
      await prisma.activityLog.create({
        data: {
          detail: `Pengumuman resmi diterbitkan oleh ${accountName}: '${record.title}'`,
          time: "Baru saja",
          color: "blue",
        },
      });
      return { success: true, record, refreshModules: ["announcements", "activity_logs"] };
    }

    case "CREATE_FINANCIAL": {
      const income = Number(action.data.income || 0);
      const expense = Number(action.data.expense || 0);
      const type = action.data.type || (income > 0 ? "income" : "expense");
      const record = await prisma.financialReport.create({
        data: {
          title: action.data.title,
          income,
          expense,
          file: "Laporan_Keuangan.pdf",
          type,
          date: today,
        },
      });
      await prisma.activityLog.create({
        data: {
          detail: `Kas ${type === "income" ? "masuk" : "keluar"} dicatat oleh ${accountName}: '${record.title}'`,
          time: "Baru saja",
          color: type === "income" ? "green" : "red",
        },
      });
      return { success: true, record, refreshModules: ["financial_reports", "activity_logs"] };
    }

    case "CREATE_TALENT": {
      const record = await prisma.talent.create({
        data: {
          student_name: accountName,
          talent: action.data.talent,
          achievement: action.data.achievement || "Peserta Perlombaan",
          certificate: "Sertifikat.pdf",
        },
      });
      await prisma.activityLog.create({
        data: {
          detail: `Bakat/prestasi dicatat: ${record.student_name} (${record.talent})`,
          time: "Baru saja",
          color: "purple",
        },
      });
      return { success: true, record, refreshModules: ["talents", "activity_logs"] };
    }

    case "UPDATE_ASPIRATION_STATUS": {
      const record = await prisma.aspiration.update({
        where: { id: action.targetId || action.data.targetId },
        data: { status: action.data.status },
      });
      await prisma.activityLog.create({
        data: {
          detail: `Status aspirasi ${record.student_name} diperbarui ke ${record.status}`,
          time: "Baru saja",
          color: "blue",
        },
      });
      return { success: true, record, refreshModules: ["aspirations", "activity_logs"] };
    }

    default:
      return { success: false, refreshModules: [] };
  }
}

function buildActionConfirmation(action: AgentAction, record: any): string {
  switch (action.type) {
    case "CREATE_ASPIRATION":
      return `### ✅ Aspirasi Berhasil Dikirim!

Aspirasi kamu sudah tersimpan di sistem dan akan segera ditinjau oleh pengurus PSDAM.

**Ringkasan:**
• **Kategori:** 🏷️ ${record.category}
• **Pesan:** "${record.message}"
• **Status:** 🟡 Menunggu Peninjauan

> 💡 Kamu bisa memantau perkembangannya kapan saja melalui menu **Aspirasi Saya**. Terima kasih atas masukannya! 😊`;

    case "CREATE_PROGRAM":
      return `### ✅ Program Kerja Berhasil Diajukan!

Program kerja **${record.title}** telah tercatat dalam agenda himpunan.

**Detail:**
• **Tanggal Agenda:** ${record.event_date}
• **Status:** 📝 Planning (Menunggu persetujuan pimpinan)`;

    case "CREATE_ANNOUNCEMENT":
      return `### ✅ Pengumuman Resmi Diterbitkan!

Pengumuman **"${record.title}"** telah berhasil dirilis dan dapat dilihat di halaman Pengumuman.`;

    case "CREATE_FINANCIAL":
      const amount = record.type === "income" ? record.income : record.expense;
      return `### ✅ Catatan Keuangan Tersimpan!

Data kas sebesar **Rp${amount.toLocaleString("id-ID")}** untuk **"${record.title}"** berhasil dicatat ke laporan keuangan.`;

    case "CREATE_TALENT":
      return `### ✅ Prestasi Mahasiswa Tersimpan!

Data bakat **${record.student_name}** di bidang **${record.talent}** telah dicatat di data Minat & Bakat.`;

    case "UPDATE_ASPIRATION_STATUS":
      const statusLabel =
        record.status === "completed"
          ? "🟢 Selesai"
          : record.status === "processing"
            ? "🔵 Sedang Diproses"
            : "🟡 Pending";
      return `### ✅ Status Aspirasi Diperbarui!

Status aspirasi dari **${record.student_name}** sekarang menjadi: **${statusLabel}**.`;

    default:
      return "Tindakan berhasil diselesaikan.";
  }
}

/**
 * Respon Sintesis Natural & Santai (Tanpa kata "Database", tanpa statistik kaku)
 */
export function synthesizeLiveDatabaseAnswer(message: string, db: LiveDatabaseSnapshot): string {
  const q = message.toLowerCase().trim();

  // 1. Sapaan / Chit-chat santai
  if (
    q === "halo" ||
    q === "hai" ||
    q === "p" ||
    q === "hei" ||
    q.startsWith("halo") ||
    q.startsWith("hai") ||
    q.includes("selamat pagi") ||
    q.includes("selamat siang") ||
    q.includes("selamat malam") ||
    q.includes("assalamualaikum")
  ) {
    return `Halo! 👋 Senang bisa ngobrol denganmu.

Ada yang bisa saya bantu hari ini? Kamu bisa tanya seputar kegiatan himpunan, info proker, pengumuman, cara pengajuan aspirasi, atau sekadar berdiskusi santai! 😊`;
  }

  // 2. Siapa bot / perkenalan
  if (q.includes("kamu siapa") || q.includes("bot apa") || q.includes("siapa kamu") || q.includes("tentang kamu")) {
    return `Saya adalah **POINTER AI**, asisten cerdas resmi HIMA POINTER Politeknik Negeri Lampung.

Saya di sini untuk membantu rekan-rekan mahasiswa dan pengurus dalam mendapatkan informasi kegiatan, kepengurusan, layanan aspirasi, toko merchandise, hingga membantu alur kerja di website ini. Silakan tanya apa saja ya! 😊`;
  }

  // 3. Aspirasi & Advokasi
  if (q.includes("aspirasi") || q.includes("advokasi") || q.includes("keluhan") || q.includes("saran") || q.includes("kritik")) {
    if (isIntentWithoutDetails(message) || q.includes("mau") || q.includes("ngajuin") || q.includes("kirim") || q.includes("ajukan") || q.includes("cara")) {
      return `### 💡 Layanan Pengajuan Aspirasi Mahasiswa POINTER

Halo! 👋 Tentu saja, kamu bisa menyampaikan aspirasi, masukan, keluhan fasilitas, atau saran perkuliahan langsung melalui saya.

Agar aspirasimu dapat dicatat dan ditindaklanjuti secara resmi oleh pengurus Divisi PSDAM, silakan tuliskan pesan dengan rincian:
• **Kategori:** (Akademik / Fasilitas / Beasiswa / Kegiatan / Lainnya)
• **Isi Aspirasi:** (Jelaskan rincian keluhan, kritik, atau saran perbaikan kamu)

*Contoh format pengiriman langsung:*
> *"Saya mau mengajukan aspirasi fasilitas: Stopkontak di lab komputer 2 banyak yang rusak, mohon segera diganti."*

Silakan ketik aspirasimu sekarang ya! 😊`;
    }

    const list = db.aspirations.length > 0
      ? db.aspirations
        .slice(0, 5)
        .map((a) => {
          const badge = a.status === "completed" ? "🟢 Selesai" : a.status === "processing" ? "🔵 Diproses" : "🟡 Pending";
          return `• [${badge}] *${a.category}*: "${a.message}" (${a.student_name})`;
        })
        .join("\n")
      : "*(Belum ada data aspirasi aktif)*";

    return `### 💡 Layanan Aspirasi Mahasiswa POINTER

Saat ini ada **${db.aspirations.length} aspirasi** yang masuk ke sistem:
${list}

---
**Ingin menyampaikan aspirasi?**
Kamu cukup ketik langsung di sini, contohnya:
> *"Saya mau ngajuin aspirasi tentang akademik: Jadwal praktikum mohon tidak bertabrakan dengan kelas teori"*

Pesanmu akan langsung diteruskan ke divisi PSDAM untuk ditindaklanjuti!`;
  }

  // 4. Kepengurusan, Kahim, BPH
  if (q.includes("kahim") || q.includes("ketua") || q.includes("ketum") || q.includes("pimpinan") || q.includes("bph") || q.includes("pengurus") || q.includes("siapa")) {
    const admins = db.users.filter((u) => u.role === "admin");
    const staff = db.users.filter((u) => u.role === "divisi");

    const adminList = admins.length > 0
      ? admins.map((u) => `• **${u.name}** — ${u.jabatan || "Ketua / BPH"} (NPM: ${u.npm || "-"})`).join("\n")
      : "• Belum ada data pimpinan";

    const divList = db.divisions.map((d) => d.name).join(", ");

    return `### 👥 Pengurus & Struktur HIMA POINTER

**Pimpinan & BPH:**
${adminList}

**Divisi Himpunan:**
${divList}

Ada divisi atau pengurus tertentu yang ingin kamu tanyakan lebih lanjut?`;
  }

  // 5. Program Kerja (Proker) & Agenda
  if (q.includes("proker") || q.includes("program") || q.includes("kegiatan") || q.includes("acara") || q.includes("agenda")) {
    const prokerList = db.programs.length > 0
      ? db.programs
        .slice(0, 7)
        .map((p) => {
          const icon = p.status === "completed" ? "✅" : p.status === "ongoing" ? "⚡" : "📝";
          return `• ${icon} **${p.title}** (${p.division_name}) — Tanggal: ${p.event_date}`;
        })
        .join("\n")
      : "*(Belum ada agenda kegiatan)*";

    return `### 📅 Agenda & Program Kerja HIMA POINTER

Berikut beberapa program kerja himpunan:
${prokerList}

Ada agenda yang ingin kamu ikuti atau ketahui detailnya?`;
  }

  // 6. Toko, Merchandise, KIMAS
  if (q.includes("toko") || q.includes("merchandise") || q.includes("produk") || q.includes("kimas") || q.includes("beli") || q.includes("jahim") || q.includes("shop")) {
    const prodList = db.products.length > 0
      ? db.products.map((pr) => `• **${pr.product_name}** — Rp${pr.price.toLocaleString("id-ID")} (Stok: ${pr.stock} pcs)`).join("\n")
      : "*(Belum ada katalog produk di toko)*";

    return `### 🛍️ Merchandise Resmi HIMA POINTER

Produk yang tersedia saat ini:
${prodList}

Kamu bisa langsung melihat dan memesan melalui menu **Toko KIMAS Store** dengan pembayaran via QRIS!`;
  }

  // 7. Pengumuman
  if (q.includes("pengumuman") || q.includes("berita") || q.includes("info")) {
    const annList = db.announcements.length > 0
      ? db.announcements.slice(0, 3).map((an) => `• [${an.date}] **${an.title}**: ${an.content}`).join("\n\n")
      : "*(Belum ada pengumuman baru)*";

    return `### 📢 Pengumuman Terbaru HIMA POINTER

${annList}`;
  }

  // 8. Panduan Fitur & Penggunaan Website POINTER
  if (q.includes("fitur") || q.includes("menu") || q.includes("cara pakai") || q.includes("website") || q.includes("bisa apa") || q.includes("halaman") || q.includes("panduan") || q.includes("bantuan")) {
    return `### 🧭 Panduan Fitur Website HIMA POINTER

Website ini adalah portal resmi manajemen organisasi dan layanan mahasiswa:
• 🏠 **Beranda & Dashboard:** Ringkasan kegiatan, kalender konten, dan agenda terkini.
• 💡 **Aspirasi Mahasiswa:** Tempat menyampaikan aspirasi/keluhan fasilitas & akademik.
• 📅 **Program Kerja:** Informasi jadwal, status, dan rincian kegiatan tiap divisi.
• 📦 **Inventaris & Aset:** Cek ketersediaan dan peminjaman alat (proyektor, sound, dsb).
• 🛍️ **KIMAS Store:** Pembelian jaket himpunan dan merchandise via QRIS.
• 👥 **Kepengurusan:** Profil BPH dan divisi HIMA POINTER.
• 🤖 **POINTER AI:** Asisten cerdas untuk tanya jawab dan automasi tindakan langsung!

Ada fitur tertentu yang ingin kamu tanyakan caranya? 😊`;
  }

  // 9. Visi & Misi HIMA POINTER
  if (/\bvisi\b/.test(q) || /\bmisi\b/.test(q) || q.includes("tujuan hima")) {
    return `### 🎯 Visi & Misi HIMA POINTER
**Himpunan Mahasiswa Manajemen Informatika — Politeknik Negeri Lampung**

**Visi:**
Menjadi wadah pengembangan potensi mahasiswa Manajemen Informatika yang berintegritas, inovatif, berdaya saing di bidang teknologi informasi, serta solid berlandaskan kekeluargaan.

**Misi:**
1. Menyelenggarakan kegiatan peningkatan kompetensi akademik & teknologi (workshop, webinar, riset).
2. Membangun advokasi aspirasi mahasiswa yang responsif, transparan, dan solutif.
3. Mempererat solidaritas mahasiswa MI melalui kegiatan kebersamaan dan sosial.
4. Menjalin relasi strategis dengan alumni, industri, dan himpunan lintas kampus.`;
  }

  // 10. Peminjaman Inventaris / Aset
  if (q.includes("pinjam") || q.includes("inventaris") || q.includes("proyektor") || q.includes("toa") || q.includes("alat") || q.includes("barang")) {
    return `### 📦 Panduan Peminjaman Inventaris
Untuk meminjam fasilitas/aset himpunan (proyektor, kabel roll, toa, banner, dll):
1. Masuk ke menu **Inventaris** di sidebar.
2. Lihat daftar barang yang berstatus **Tersedia**.
3. Ajukan permohonan peminjaman dengan mengisi keperluan dan tanggal pengembalian.
4. Hubungi divisi pengelola (KIMAS / Kestari) untuk serah terima fisik barang.`;
  }

  // 11. Divisi Spesifik (PSDAM, MEDINFO, KESTARI, KIMAS, MINBAT, BPH)
  if (q.includes("psdam") || q.includes("medinfo") || q.includes("kestari") || q.includes("kimas") || q.includes("minbat")) {
    const matchedDiv = db.divisions.find((d) => q.includes(d.name.toLowerCase()));
    const divName = matchedDiv ? matchedDiv.name : "Divisi Himpunan";
    const divProgs = db.programs.filter((p) => p.division_name?.toLowerCase().includes(divName.toLowerCase()));
    const progText = divProgs.length > 0
      ? divProgs.map((p) => `• **${p.title}** (${p.event_date})`).join("\n")
      : "• Belum ada proker terdaftar untuk divisi ini";

    return `### 🏛️ Informasi ${divName}
Divisi ini aktif mengelola program kerja dan layanan mahasiswa POINTER.

**Agenda & Proker Divisi:**
${progText}

Ada hal khusus terkait divisi ini yang ingin kamu diskusikan?`;
  }

  // 12. Respon Santai Default
  return `Halo! 👋 Ada yang bisa saya bantu di sistem POINTER hari ini?

Kamu bisa bebas bertanya atau berdiskusi tentang apa saja, seperti:
• 📅 **Agenda & Kegiatan:** Jadwal dan info program kerja
• 💡 **Layanan Aspirasi:** Menyampaikan kritik, saran, atau keluhan perkuliahan
• 👥 **Pengurus Himpunan:** Struktur kepemimpinan dan divisi
• 🛍️ **Merchandise Toko:** Info jaket himpunan dan produk KIMAS Store
• 🧭 **Fitur Sistem:** Panduan peminjaman alat, absensi, atau modul web
• 💬 Atau sekadar ngobrol santai seputar kehidupan kampus!`;
}

// =====================================
// TIERED SPEED ROUTER
// Bobot pertanyaan menentukan jalur eksekusi:
// Tier 0 (Instan <100ms): chit-chat/sapaan → jawab langsung tanpa DB/AI
// Tier 1 (Cepat ~10ms):  query info himpunan/sistem → DB Cache + sintesis lokal
// Tier 2 (Standar ~2s):  query non-sistem/luar topik → AI generation
// Tier 3 (Penuh ~2s):    action/mutation → heuristic intent + direct DB write
// =====================================

type MessageTier = "chit-chat" | "simple-info" | "complex-info" | "action";

function classifyMessage(msg: string): MessageTier {
  const q = msg.toLowerCase().trim();

  // Tier 0 — Chit-chat / Sapaan Instan
  const chitchatPatterns = [
    /^(halo|hai|hey|hi|p|hei|oi|yo)\b/,
    /^(selamat pagi|selamat siang|selamat sore|selamat malam|assalamualaikum|wa'alaikumsalam)\b/,
    /^(kamu siapa|siapa kamu|bot apa|tentang kamu|kamu apa)\b/,
    /^(makasih|terima kasih|thanks|thank you|ok|oke|sip|mantap|keren)\b/,
  ];
  if (q.length < 35 && chitchatPatterns.some((re) => re.test(q))) return "chit-chat";

  // Tier 3 — Action Keywords (deteksi cepat sebelum intent parsing)
  // JANGAN klasifikasikan sebagai aksi jika hanya pernyataan niat tanpa rincian!
  if (!isIntentWithoutDetails(msg)) {
    const actionKeywords = [
      "ngajuin aspirasi", "kirim aspirasi", "ajukan aspirasi", "mau aspirasi",
      "buat proker", "tambah proker", "bikin proker",
      "catat kas", "simpan kas", "catat pemasukan", "catat pengeluaran",
      "buat pengumuman", "rilis pengumuman",
      "daftarkan prestasi", "catat bakat",
      "hapus", "delete", "drop",
    ];
    if (actionKeywords.some((kw) => q.includes(kw))) return "action";
  }

  // Tier 1 — Simple Info (kunci kata spesifik seputar HIMA, website, proker, pengurus, dsb)
  const simpleInfoKeywords = [
    "proker", "program kerja", "agenda", "kegiatan", "jadwal", "acara",
    "pengurus", "kahim", "ketua", "ketum", "divisi", "bph", "struktur", "pimpinan",
    "toko", "merchandise", "jaket", "produk", "kimas", "beli", "jahim",
    "pengumuman", "berita", "info himpunan",
    "aspirasi", "keluhan", "saran", "advokasi",
    "fitur", "menu", "cara pakai", "website", "bisa apa", "halaman", "panduan", "bantuan",
    "visi", "misi", "tujuan", "hima", "pointer", "polinela",
    "pinjam", "inventaris", "proyektor", "toa", "alat", "barang",
    "psdam", "medinfo", "kestari", "minbat", "ekraf",
    "kuliah", "mahasiswa", "bakat", "prestasi",
  ];
  if (simpleInfoKeywords.some((kw) => q.includes(kw))) return "simple-info";

  // Tier 2 — Complex Info (pertanyaan luar topik himpunan/sistem yang butuh AI generatif)
  return "complex-info";
}

// ------------------------------------
// DB Cache cerdas (TTL 60 detik) — mencegah query berulang ke remote PostgreSQL
// Cache otomatis di-invalidate seketika saat ada mutasi data baru (action)
// ------------------------------------
let _minDbCache: { data: any; expiry: number } | null = null;
let _dbCache: { snapshot: LiveDatabaseSnapshot; expiry: number } | null = null;

export function invalidateDbCache() {
  _minDbCache = null;
  _dbCache = null;
}

export function warmupAiCache(prisma: PrismaClient) {
  fetchCachedMinimalDb(prisma).catch(() => { });
}

async function fetchCachedMinimalDb(prisma: PrismaClient): Promise<any> {
  const now = Date.now();
  if (_minDbCache && _minDbCache.expiry > now) {
    return _minDbCache.data;
  }

  // Ambil hanya tabel-tabel utama yang sering ditanyakan
  const [rawUsers, rawDivisions, rawPrograms, rawAspirations, rawProducts, rawAnnouncements] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, role: true, npm: true, jabatan: true, division_id: true }, take: 80 }),
    prisma.division.findMany({ include: { _count: { select: { users: true, programs: true } } } }),
    prisma.program.findMany({ include: { division: true }, orderBy: { id: "desc" }, take: 20 }),
    prisma.aspiration.findMany({ orderBy: { id: "desc" }, take: 20 }),
    prisma.product.findMany({ take: 20 }),
    prisma.announcement.findMany({ orderBy: { id: "desc" }, take: 8 }),
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
      totalUsers: rawUsers.length, totalDivisions: rawDivisions.length,
      totalPrograms: rawPrograms.length, totalAspirations: rawAspirations.length,
      totalProducts: rawProducts.length, totalTransactions: 0,
      totalLetters: 0, totalAnnouncements: rawAnnouncements.length,
    },
  };
  _minDbCache = { data: result, expiry: now + 60_000 }; // TTL 60 detik
  return result;
}

// System prompt serba bisa: mampu menjawab hal umum, coding, sains, curhat, dan data himpunan
function buildSystemPrompt(data: any, currentUserRole: string, currentUserName: string): string {
  return `Kamu adalah "POINTER AI" — asisten kecerdasan buatan serba bisa yang cerdas, berwawasan luas, solutif, dan asyik diajak berdiskusi tentang APA SAJA, layaknya Gemini atau ChatGPT modern.
Kamu adalah asisten resmi untuk mahasiswa dan pengurus di lingkungan Politeknik Negeri Lampung (khususnya HIMA Manajemen Informatika).

=== PERAN & KEMAMPUAN UTAMA KAMU ===
1. MENJAWAB SEMUA PERTANYAAN (GENERAL KNOWLEDGE & RANDOM TOPICS):
   - Kamu BISA dan WAJIB menjawab pertanyaan apa pun dari pengguna, tidak terbatas hanya pada himpunan!
   - Contoh topik yang bisa kamu jawab: sains, pemrograman & coding (React, JavaScript, Python, SQL, algoritma, dll), matematika, tugas kuliah, filsafat, sejarah, fakta menarik, cerita, analogi, tips produktivitas, curhat santai, hingga teka-teki.
   - Jawablah secara cerdas, mendalam, akurat, bersahabat, dan terstruktur.

2. PENGETAHUAN KHUSUS HIMA POINTER (Gunakan jika ditanya hal seputar himpunan/kampus):
   - Pimpinan: ${data.users?.filter((u: any) => u.role === "admin").map((u: any) => u.name).join(", ") || "-"}
   - Divisi: ${data.divisions?.map((d: any) => d.name).join(", ") || "-"}
   - Proker terkini: ${data.programs?.slice(0, 5).map((p: any) => p.title).join(", ") || "-"}
   - Toko KIMAS: ${data.products?.map((pr: any) => pr.product_name).join(", ") || "tersedia di menu toko"}
   - Pengumuman: ${data.announcements?.slice(0, 2).map((an: any) => an.title).join(", ") || "-"}

=== ATURAN GAYA BAHASA ===
- JANGAN PERNAH menyebut kata teknis server seperti "database", "PostgreSQL", atau "Prisma".
- Gunakan bahasa Indonesia yang santun, luwes, ramah, dan format Markdown rapi (bold, bullet point, atau codeblock jika coding).
- Pengguna saat ini: ${currentUserName || "Rekan Mahasiswa"} (Peran: ${currentUserRole}).`;
}

// Jawaban instan untuk chit-chat tanpa panggil DB/AI sama sekali
function instantChitchatReply(message: string, userName?: string): string {
  const q = message.toLowerCase().trim();
  const name = userName ? `, ${userName.split(" ")[0]}` : "";

  if (q.startsWith("halo") || q.startsWith("hai") || q.startsWith("hi") || q === "p" || q.startsWith("hey")) {
    return `Halo${name}! 👋 Senang bisa ngobrol denganmu! Ada yang bisa saya bantu seputar HIMA POINTER hari ini? 😊`;
  }
  if (q.includes("selamat pagi") || q.includes("pagi")) {
    return `Selamat pagi${name}! ☀️ Semoga hari ini produktif dan menyenangkan. Ada yang bisa saya bantu?`;
  }
  if (q.includes("selamat siang") || q.includes("siang")) {
    return `Selamat siang${name}! 🌤️ Sudah makan siang belum? Ada yang bisa saya bantu hari ini?`;
  }
  if (q.includes("selamat sore") || q.includes("sore")) {
    return `Selamat sore${name}! 🌇 Semoga harimu menyenangkan. Ada yang ingin ditanyakan?`;
  }
  if (q.includes("selamat malam") || q.includes("malam")) {
    return `Selamat malam${name}! 🌙 Masih semangat ya? Ada yang bisa saya bantu malam ini?`;
  }
  if (q.includes("assalamualaikum")) {
    return `Wa'alaikumsalam Warahmatullahi Wabarakatuh${name}! 🤲 Ada yang bisa saya bantu?`;
  }
  if (q.includes("siapa kamu") || q.includes("kamu siapa") || q.includes("bot apa") || q.includes("tentang kamu")) {
    return `Saya **POINTER AI**, asisten cerdas resmi HIMA POINTER Politeknik Negeri Lampung! 🎓\n\nSaya bisa membantu kamu dengan:\n• Info kegiatan & program kerja himpunan\n• Menyampaikan aspirasi ke pengurus\n• Info toko merchandise KIMAS\n• Atau sekadar ngobrol santai! 😊`;
  }
  if (q.includes("makasih") || q.includes("terima kasih") || q.includes("thanks")) {
    return `Sama-sama${name}! 😊 Senang bisa membantu. Jangan ragu kalau ada yang ingin ditanyakan lagi ya!`;
  }
  if (q === "ok" || q === "oke" || q === "iya" || q === "ya" || q === "sip") {
    return `Oke siap${name}! Ada yang bisa saya bantu lagi? 😊`;
  }

  return `Halo${name}! 👋 Ada yang bisa saya bantu hari ini? Tanya apa saja seputar HIMA POINTER! 😊`;
}

export async function processAiChat(
  prisma: PrismaClient,
  genAI: GoogleGenAI,
  message: string,
  history: any[] = [],
  context: any = null
): Promise<{ reply: string; actionExecuted?: AgentAction; refreshModules?: string[] }> {
  const currentUserRole: string = context?.user?.role || "mahasiswa";
  const currentUserName: string = context?.user?.name || "";

  // =============================================
  // STEP 1: Klasifikasi Bobot Pertanyaan (< 1ms)
  // =============================================
  const tier = classifyMessage(message);

  // =============================================
  // TIER 0: Chit-chat → Jawab Instan (< 5ms, tanpa DB, tanpa AI)
  // =============================================
  if (tier === "chit-chat") {
    return { reply: instantChitchatReply(message, currentUserName) };
  }

  // =============================================
  // TIER 3: Action → Fast Intent Parse + Direct DB Write
  // Tidak perlu fetch seluruh tabel DB terlebih dahulu!
  // =============================================
  if (tier === "action") {
    const action = await parseActionIntent(message, genAI, null);

    if (action.type !== "NONE" && action.type !== "BLOCKED_DESTRUCTIVE") {
      const permission = checkActionPermission(action, currentUserRole);
      if (!permission.allowed) {
        return { reply: `⚠️ **Akses Dibatasi:**\n\n${permission.reason}` };
      }
      try {
        const result = await executeAction(action, prisma, currentUserName);
        // Invalidate cache seketika agar mutasi langsung terbaca
        invalidateDbCache();
        if (result.success) {
          return {
            reply: buildActionConfirmation(action, result.record),
            actionExecuted: action,
            refreshModules: result.refreshModules,
          };
        }
      } catch (err: any) {
        return { reply: `Maaf, terjadi kendala: ${err?.message || "Silakan coba lagi"}.` };
      }
    }

    if (action.type === "BLOCKED_DESTRUCTIVE") {
      return {
        reply: "⚠️ **Akses Dibatasi:**\n\nDemi keamanan sistem POINTER, tindakan ini tidak diizinkan melalui AI. Silakan gunakan menu pengaturan resmi.",
      };
    }

    // Jika intent bukan aksi, teruskan ke info retrieval
  }

  // =============================================
  // TIER 1: Simple Info → DB Cache Minimal + Sintesis Lokal (< 20ms jika cached)
  // =============================================
  if (tier === "simple-info") {
    const minDb = await fetchCachedMinimalDb(prisma);
    const synth = synthesizeLiveDatabaseAnswer(message, minDb as any);
    const isGenericFallback = synth.startsWith("Halo! 👋 Ada yang bisa saya bantu");
    if (!isGenericFallback) {
      return { reply: synth };
    }
  }

  // =============================================
  // TIER 2: Complex Info → DB Cache Minimal + AI Generation
  // =============================================
  const minDb = await fetchCachedMinimalDb(prisma);
  const systemPrompt = buildSystemPrompt(minDb, currentUserRole, currentUserName);

  const chatContents: any[] = [];
  if (Array.isArray(history) && history.length > 0) {
    for (const h of history.slice(-6)) {
      if (h.text?.trim()) {
        chatContents.push({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.text }] });
      }
    }
  }
  chatContents.push({ role: "user", parts: [{ text: message }] });

  // 1. OPSI UTAMA: Coba GROQ jika GROQ_API_KEY tersedia (Ultra Fast ~300-500 tokens/detik)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey?.trim()) {
    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-6).map((h) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.text || "",
      })).filter((m) => m.content) : []),
      { role: "user", content: message },
    ];
    const groqModel = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
    const groqReply = await callGroqChat(groqKey, groqMessages, groqModel);
    if (groqReply?.trim()) {
      return { reply: groqReply.trim().replace(/\bdatabase\b/gi, "sistem") };
    }
  }

  // 2. OPSI KEDUA: Coba OPENROUTER jika OPENROUTER_API_KEY tersedia (Multi-Model Hub)
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey?.trim()) {
    const routerMessages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-6).map((h) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.text || "",
      })).filter((m) => m.content) : []),
      { role: "user", content: message },
    ];
    const modelToUse = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
    const routerReply = await callOpenRouterChat(openRouterKey, routerMessages, modelToUse);
    if (routerReply?.trim()) {
      return { reply: routerReply.trim().replace(/\bdatabase\b/gi, "sistem") };
    }
  }

  // 3. OPSI KETIGA: Gemini AI (Google)
  for (const model of GEMINI_MODELS) {
    try {
      const response = await withTimeout(
        genAI.models.generateContent({
          model,
          contents: chatContents,
          config: {
            systemInstruction: systemPrompt,
            maxOutputTokens: 768,
          },
        }),
        15000,
        `Timeout pada ${model}`
      );

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text || "";
      if (text?.trim()) {
        return { reply: text.trim().replace(/\bdatabase\b/gi, "sistem") };
      }
    } catch {
      // Coba model berikutnya
    }
  }

  // Jika model AI eksternal sedang sibuk/timeout:
  const localFallback = synthesizeLiveDatabaseAnswer(message, minDb as any);
  if (!localFallback.startsWith("Halo! 👋 Ada yang bisa saya bantu")) {
    return { reply: localFallback };
  }

  return {
    reply: "Mohon maaf, server AI saat ini sedang mengalami antrean yang cukup padat. Boleh tolong ajukan pertanyaanmu sekali lagi? 😊",
  };
}


