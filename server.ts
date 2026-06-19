import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// Add logs helper
async function logActivity(detail: string, color: string = "orange") {
  try {
    await prisma.activityLog.create({
      data: {
        detail,
        time: "Baru saja",
        color
      }
    });

    // Keep last 30 logs (optional logic, could just delete oldest if count > 30)
    // For simplicity, we just keep all logs or we could implement a cleanup here
    const count = await prisma.activityLog.count();
    if (count > 30) {
      const oldest = await prisma.activityLog.findMany({
        orderBy: { id: 'asc' },
        take: count - 30
      });
      if (oldest.length > 0) {
        await prisma.activityLog.deleteMany({
          where: { id: { in: oldest.map(l => l.id) } }
        });
      }
    }
  } catch (err) {
    console.error("Error logging activity:", err);
  }
}

// =====================================
// API ROUTES
// =====================================

// Get full database
app.get("/api/db", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    const divisions = await prisma.division.findMany();
    const programs = await prisma.program.findMany({ orderBy: { id: 'desc' } });
    const aspirations = await prisma.aspiration.findMany({ orderBy: { id: 'desc' } });
    const talents = await prisma.talent.findMany({ orderBy: { id: 'desc' } });
    const products = await prisma.product.findMany({ orderBy: { id: 'desc' } });
    const transactions = await prisma.transaction.findMany({ orderBy: { id: 'desc' } });
    const financial_reports = await prisma.financialReport.findMany({ orderBy: { id: 'desc' } });
    const attendances = await prisma.attendance.findMany({ orderBy: { id: 'desc' } });
    const notulensi = await prisma.notulensi.findMany({ orderBy: { id: 'desc' } });
    const announcements = await prisma.announcement.findMany({ orderBy: { id: 'desc' } });
    const content_calendar = await prisma.contentCalendar.findMany({ orderBy: { id: 'desc' } });
    const activity_logs = await prisma.activityLog.findMany({ orderBy: { id: 'desc' }, take: 30 });
    const letters = await prisma.letter.findMany({ orderBy: { id: 'desc' } });

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
      letters
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch database" });
  }
});

// Login route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Akun tidak terdaftar dalam sistem. Silakan hubungi Administrator untuk mendaftarkan akun Anda."
      });
    }

    await logActivity(`${user.name} berhasil masuk ke sistem`, "green");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Profile modifications
app.put("/api/auth/profile", async (req, res) => {
  try {
    const { id, name, email, npm } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email, npm }
    });
    
    await logActivity(`Profil ${name} diperbarui`, "blue");
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(404).json({ error: "User not found or update failed" });
  }
});

// Manage Program Kerja
app.post("/api/programs", async (req, res) => {
  try {
    const { title, description, event_date, division_id, created_by, status } = req.body;
    
    const newProgram = await prisma.program.create({
      data: {
        title,
        description,
        event_date: event_date || new Date().toISOString().split("T")[0],
        status: status || "planning",
        approval_status: "pending",
        division_id,
        created_by: created_by || "Anggota"
      }
    });

    let divName = division_id;
    const division = await prisma.division.findUnique({ where: { id: division_id } });
    if (division) divName = division.name;

    await logActivity(`Pengajuan program '${title}' oleh divisi ${divName}`, "orange");
    
    res.json({ success: true, program: newProgram });
  } catch (err) {
    res.status(500).json({ error: "Failed to create program" });
  }
});

// Edit Program Kerja
app.put("/api/programs/:id", async (req, res) => {
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
});

// Approve Program Kerja
app.post("/api/programs/:id/approve", async (req, res) => {
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
});

// Reject Program Kerja
app.post("/api/programs/:id/reject", async (req, res) => {
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
});

// Delete Program Kerja
app.delete("/api/programs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.program.delete({ where: { id } });
    await logActivity(`Program dihapus`, "red");
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: "Program not found" });
  }
});

// Submit/process Aspirations
app.post("/api/aspirations", async (req, res) => {
  try {
    const { student_name, category, message } = req.body;
    const newAsp = await prisma.aspiration.create({
      data: {
        student_name: student_name || "Mahasiswa Umum",
        category: category || "Umum",
        message,
        status: "pending",
        created_at: "Baru saja"
      }
    });
    
    await logActivity(`Aspirasi baru masuk dari ${newAsp.student_name} kategori ${newAsp.category}`, "orange");
    res.json({ success: true, aspiration: newAsp });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit aspiration" });
  }
});

// Update Aspiration status
app.put("/api/aspirations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const asp = await prisma.aspiration.update({
      where: { id },
      data: { status }
    });
    
    await logActivity(`Aspirasi dari ${asp.student_name} diperbarui ke ${status}`, "blue");
    res.json({ success: true, aspiration: asp });
  } catch (err) {
    res.status(404).json({ error: "Aspiration not found" });
  }
});

// Submit / register Student Talent
app.post("/api/talents", async (req, res) => {
  try {
    const { student_name, talent, achievement, certificate } = req.body;
    const newTalent = await prisma.talent.create({
      data: {
        student_name,
        talent,
        achievement: achievement || "Peserta Perlombaan",
        certificate: certificate || "Sertifikat_Internal.pdf"
      }
    });
    
    await logActivity(`Prestasi ${student_name} teridentifikasi di bidang ${talent}`, "green");
    res.json({ success: true, talent: newTalent });
  } catch (err) {
    res.status(500).json({ error: "Failed to register talent" });
  }
});

// Manage Products (KIMAS Catalog)
app.post("/api/products", async (req, res) => {
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
    
    await logActivity(`Produk baru resmi terdaftar: '${product_name}'`, "green");
    res.json({ success: true, product: newProd });
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    await logActivity(`Produk dihapus dari katalog`, "red");
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: "Product not found" });
  }
});

// Store checkout / order system (KIMAS)
app.post("/api/checkout", async (req, res) => {
  try {
    const { user_id, student_name, items } = req.body; // items = [{ id, quantity }]
    
    let total = 0;
    const purchasedNames: string[] = [];
    
    // Process items sequentially to handle stock
    for (const item of items) {
      const prod = await prisma.product.findUnique({ where: { id: item.id } });
      if (!prod) {
        return res.status(404).json({ error: `Product not found: ${item.id}` });
      }
      if (prod.stock < item.quantity) {
        return res.status(400).json({ error: `Stok produk mumpuni tidak memadai untuk ${prod.product_name}` });
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
        date: new Date().toISOString().split("T")[0]
      }
    });
    
    // Also register cash flow income under KEUANGAN
    await prisma.financialReport.create({
      data: {
        title: `Unit Bisnis KIMAS - Penjualan: ${itemsText.substring(0, 45)}...`,
        income: total,
        expense: 0,
        file: "Rekap_Penjualan_KIMAS.xlsx",
        type: "income",
        date: new Date().toISOString().split("T")[0]
      }
    });
    
    await logActivity(`Pemesanan merchandise oleh ${student_name} total Rp ${total.toLocaleString("id")}`, "green");
    
    res.json({ success: true, transaction: newTrx });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// Finance records (income/expense)
app.post("/api/financials", async (req, res) => {
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
        date: new Date().toISOString().split("T")[0]
      }
    });
    
    const typeText = newFin.type === "income" ? "Pemasukan" : "Pengeluaran";
    const numText = (newFin.type === "income" ? newFin.income : newFin.expense).toLocaleString("id");
    await logActivity(`${typeText} baru: '${title}' sebesar Rp ${numText}`, newFin.type === "income" ? "green" : "red");
    
    res.json({ success: true, report: newFin });
  } catch (err) {
    res.status(500).json({ error: "Failed to add financial record" });
  }
});

// Record Attendance (Administrasi/PSDAM)
app.post("/api/attendances", async (req, res) => {
  try {
    const { event_name, participant_name, status, npm } = req.body;
    
    const newAtt = await prisma.attendance.create({
      data: {
        event_name,
        participant_name,
        status,
        npm: npm || `2201${Math.floor(Math.random() * 900 + 100)}`,
        date: new Date().toISOString().split("T")[0]
      }
    });
    
    await logActivity(`Presensi dicatat: ${participant_name} status ${status} pada agenda ${event_name}`, "blue");
    res.json({ success: true, attendance: newAtt });
  } catch (err) {
    res.status(500).json({ error: "Failed to record attendance" });
  }
});

// Record Notulensi (Administrasi)
app.post("/api/notulensi", async (req, res) => {
  try {
    const { title, summary, author } = req.body;
    
    const newNot = await prisma.notulensi.create({
      data: {
        title,
        date: new Date().toISOString().split("T")[0],
        author: author || "Sekretaris",
        summary
      }
    });
    
    await logActivity(`Notulensi diunggah: '${title}'`, "blue");
    res.json({ success: true, notulensi: newNot });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload notulensi" });
  }
});

// Post Announcement (Medinfo)
app.post("/api/announcements", async (req, res) => {
  try {
    const { title, content, category } = req.body;
    
    const newAnn = await prisma.announcement.create({
      data: {
        title,
        content,
        category: category || "Umum",
        date: new Date().toISOString().split("T")[0]
      }
    });
    
    await logActivity(`Pengumuman: '${title}' dirilis ke publik`, "orange");
    res.json({ success: true, announcement: newAnn });
  } catch (err) {
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

// Update Poster/Content Calendar
app.post("/api/content-calendar", async (req, res) => {
  try {
    const { post_title, platform, schedule_date, status } = req.body;
    
    const newCC = await prisma.contentCalendar.create({
      data: {
        post_title,
        platform: platform || "Media Sosial",
        schedule_date: schedule_date || new Date().toISOString().split("T")[0],
        status: status || "draft"
      }
    });
    
    await logActivity(`Konten terjadwal '${post_title}' ditambahkan`, "blue");
    res.json({ success: true, calendar: newCC });
  } catch (err) {
    res.status(500).json({ error: "Failed to add content calendar" });
  }
});

// Admin add/update/delete Users
app.post("/api/users", async (req, res) => {
  try {
    const { name, email, role, division_id, npm } = req.body;
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: role || "mahasiswa",
        division_id: role === "divisi" ? (division_id || "div-psdam") : null,
        npm: npm || `2201${Math.floor(Math.random() * 900 + 100)}`
      }
    });
    
    await logActivity(`User baru dibuat oleh Admin: ${name}`, "blue");
    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    await logActivity(`User dengan ID ${id} dihapus`, "red");
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: "User not found" });
  }
});


// Letters Archiving (Administrasi)
app.get("/api/letters", async (req, res) => {
  try {
    const letters = await prisma.letter.findMany({
      orderBy: { id: "desc" }
    });
    res.json(letters);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch letters" });
  }
});

app.post("/api/letters", async (req, res) => {
  try {
    const { num, subject, type, date, handler, file_name } = req.body;
    
    const newLetter = await prisma.letter.create({
      data: {
        num,
        subject,
        type: type || "Masuk",
        date: date || new Date().toISOString().split("T")[0],
        handler,
        file_name
      }
    });
    
    await logActivity(`Arsip surat ${type} didaftarkan: '${subject}'`, type === "Masuk" ? "blue" : "orange");
    res.json({ success: true, letter: newLetter });
  } catch (err) {
    res.status(500).json({ error: "Failed to create letter archive" });
  }
});


// =====================================
// VITE OR STATIC MIDDLEWARE SETUP
// =====================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
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
    console.log(`POINTER SYSTEM server successfully booted on http://localhost:${PORT}`);
  });
}

startServer();
