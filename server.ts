import express from "express";
import path from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Automatic retry helper for transient Prisma database errors (e.g. Neon cold start / P1001)
async function withDbRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0 && (err?.code === "P1001" || err?.message?.includes("Can't reach database server"))) {
      console.warn(`[DB Warning] Database unreachable or cold-starting. Retrying in ${delayMs}ms... (${retries} attempts left)`);
      await new Promise((r) => setTimeout(r, delayMs));
      return withDbRetry(fn, retries - 1, delayMs);
    }
    throw err;
  }
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || "pointer-local-development-secret";
const AUTH_COOKIE = "pointer_auth";

type AuthUser = {
  id: string;
  role: string;
  division_id: string | null;
};

type AuthenticatedRequest = express.Request & { user: AuthUser };

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  division_id: string | null;
  npm: string | null;
  jabatan: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    division_id: user.division_id,
    npm: user.npm || "",
    jabatan: user.jabatan,
  };
}

function readCookie(req: express.Request, name: string) {
  const cookies = req.headers.cookie?.split(";") || [];
  const entry = cookies.find((cookie) => cookie.trim().startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.trim().slice(name.length + 1)) : null;
}

function setAuthCookie(
  res: express.Response,
  token: string,
  req: express.Request,
) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const isHttps = req.protocol === "https" || forwardedProto === "https";
  const secure = isHttps ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${AUTH_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${secure}`,
  );
}

function clearAuthCookie(res: express.Response) {
  res.setHeader(
    "Set-Cookie",
    `${AUTH_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
  );
}

function authenticate(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const token = readCookie(req, AUTH_COOKIE);
  if (!token) return res.status(401).json({ error: "Authentication required" });

  try {
    (req as AuthenticatedRequest).user = jwt.verify(
      token,
      JWT_SECRET,
    ) as AuthUser;
    next();
  } catch {
    clearAuthCookie(res);
    return res.status(401).json({ error: "Session expired or invalid" });
  }
}

function authorize(...roles: string[]) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// Add logs helper
async function logActivity(detail: string, color: string = "orange") {
  try {
    await prisma.activityLog.create({
      data: {
        detail,
        time: "Baru saja",
        color,
      },
    });

    // Keep last 30 logs (optional logic, could just delete oldest if count > 30)
    // For simplicity, we just keep all logs or we could implement a cleanup here
    const count = await prisma.activityLog.count();
    if (count > 30) {
      const oldest = await prisma.activityLog.findMany({
        orderBy: { id: "asc" },
        take: count - 30,
      });
      if (oldest.length > 0) {
        await prisma.activityLog.deleteMany({
          where: { id: { in: oldest.map((l) => l.id) } },
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

// Public data needed by the landing page. Internal records are intentionally excluded.
app.get("/api/public/db", async (req, res) => {
  try {
    const [
      divisions,
      programs,
      announcements,
      content_calendar,
      gallery_albums,
    ] = await withDbRetry(() =>
      Promise.all([
        prisma.division.findMany(),
        prisma.program.findMany({ orderBy: { id: "desc" } }),
        prisma.announcement.findMany({ orderBy: { id: "desc" } }),
        prisma.contentCalendar.findMany({ orderBy: { id: "desc" } }),
        prisma.galleryAlbum.findMany({ orderBy: { id: "desc" } }),
      ])
    );

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
      gallery_albums,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch public database" });
  }
});

// Get full database for authenticated users only
app.get("/api/db", authenticate, async (req, res) => {
  try {
    const [
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
      gallery_albums,
    ] = await withDbRetry(() =>
      Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            division_id: true,
            npm: true,
            jabatan: true,
          },
        }),
        prisma.division.findMany(),
        prisma.program.findMany({ orderBy: { id: "desc" } }),
        prisma.aspiration.findMany({ orderBy: { id: "desc" } }),
        prisma.talent.findMany({ orderBy: { id: "desc" } }),
        prisma.product.findMany({ orderBy: { id: "desc" } }),
        prisma.transaction.findMany({ orderBy: { id: "desc" } }),
        prisma.financialReport.findMany({ orderBy: { id: "desc" } }),
        prisma.attendance.findMany({ orderBy: { id: "desc" } }),
        prisma.notulensi.findMany({ orderBy: { id: "desc" } }),
        prisma.announcement.findMany({ orderBy: { id: "desc" } }),
        prisma.contentCalendar.findMany({ orderBy: { id: "desc" } }),
        prisma.activityLog.findMany({ orderBy: { id: "desc" }, take: 30 }),
        prisma.letter.findMany({ orderBy: { id: "desc" } }),
        prisma.galleryAlbum.findMany({ orderBy: { id: "desc" } }),
      ])
    );

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
      gallery_albums,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch database" });
  }
});

// Login route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Email dan password wajib diisi." });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        success: false,
        error: "Email atau password tidak valid.",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, division_id: user.division_id },
      JWT_SECRET,
      { expiresIn: "8h" },
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
  const authUser = (req as AuthenticatedRequest).user;
  const user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ error: "User not found" });
  }
  res.json({ success: true, user: publicUser(user) });
});

// Profile modifications
app.put("/api/auth/profile", authenticate, async (req, res) => {
  try {
    const { id, name, email, npm } = req.body;
    const authUser = (req as AuthenticatedRequest).user;
    if (id !== authUser.id)
      return res.status(403).json({ error: "Cannot edit another user" });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name, email, npm },
    });

    await logActivity(`Profil ${name} diperbarui`, "blue");
    res.json({ success: true, user: publicUser(updatedUser) });
  } catch (err) {
    res.status(404).json({ error: "User not found or update failed" });
  }
});

// Manage Program Kerja
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
        status,
      } = req.body;

      const newProgram = await prisma.program.create({
        data: {
          title,
          description,
          event_date: event_date || new Date().toISOString().split("T")[0],
          status: status || "planning",
          approval_status: "pending",
          division_id,
          created_by: created_by || "Anggota",
        },
      });

      let divName = division_id;
      const division = await prisma.division.findUnique({
        where: { id: division_id },
      });
      if (division) divName = division.name;

      await logActivity(
        `Pengajuan program '${title}' oleh divisi ${divName}`,
        "orange",
      );

      res.json({ success: true, program: newProgram });
    } catch (err) {
      res.status(500).json({ error: "Failed to create program" });
    }
  },
);

// Edit Program Kerja
app.put(
  "/api/programs/:id",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, event_date, status, approval_status } =
        req.body;

      const p = await prisma.program.update({
        where: { id },
        data: { title, description, event_date, status, approval_status },
      });

      await logActivity(`Program '${p.title}' dimodifikasi`, "blue");
      res.json({ success: true, program: p });
    } catch (err) {
      res.status(404).json({ error: "Program not found" });
    }
  },
);

// Approve Program Kerja
app.post(
  "/api/programs/:id/approve",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const p = await prisma.program.update({
        where: { id },
        data: { approval_status: "approved" },
      });

      await logActivity(`Pengajuan '${p.title}' disetujui (Approved)`, "green");
      res.json({ success: true, program: p });
    } catch (err) {
      res.status(404).json({ error: "Program not found" });
    }
  },
);

// Reject Program Kerja
app.post(
  "/api/programs/:id/reject",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const p = await prisma.program.update({
        where: { id },
        data: { approval_status: "rejected" },
      });

      await logActivity(`Pengajuan '${p.title}' ditolak (Rejected)`, "red");
      res.json({ success: true, program: p });
    } catch (err) {
      res.status(404).json({ error: "Program not found" });
    }
  },
);

// Delete Program Kerja
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
  },
);

// Submit/process Aspirations
app.post("/api/aspirations", authenticate, async (req, res) => {
  try {
    const { student_name, category, message } = req.body;
    const newAsp = await prisma.aspiration.create({
      data: {
        student_name: student_name || "Mahasiswa Umum",
        category: category || "Umum",
        message,
        status: "pending",
        created_at: "Baru saja",
      },
    });

    await logActivity(
      `Aspirasi baru masuk dari ${newAsp.student_name} kategori ${newAsp.category}`,
      "orange",
    );
    res.json({ success: true, aspiration: newAsp });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit aspiration" });
  }
});

// Update Aspiration status
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
        data: { status },
      });

      await logActivity(
        `Aspirasi dari ${asp.student_name} diperbarui ke ${status}`,
        "blue",
      );
      res.json({ success: true, aspiration: asp });
    } catch (err) {
      res.status(404).json({ error: "Aspiration not found" });
    }
  },
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
  },
);

// Submit / register Student Talent
app.post(
  "/api/talents",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { student_name, talent, achievement, certificate } = req.body;
      const newTalent = await prisma.talent.create({
        data: {
          student_name,
          talent,
          achievement: achievement || "Peserta Perlombaan",
          certificate: certificate || "Sertifikat_Internal.pdf",
        },
      });

      await logActivity(
        `Prestasi ${student_name} teridentifikasi di bidang ${talent}`,
        "green",
      );
      res.json({ success: true, talent: newTalent });
    } catch (err) {
      res.status(500).json({ error: "Failed to register talent" });
    }
  },
);

// Manage Products (KIMAS Catalog)
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
          sold: 0,
        },
      });

      await logActivity(
        `Produk baru resmi terdaftar: '${product_name}'`,
        "green",
      );
      res.json({ success: true, product: newProd });
    } catch (err) {
      res.status(500).json({ error: "Failed to create product" });
    }
  },
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
  },
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
          stock: Number(stock),
        },
      });

      await logActivity(
        `Produk '${updated.product_name}' diperbarui (Stok: ${updated.stock}, Harga: Rp ${updated.price.toLocaleString("id")})`,
        "blue",
      );
      res.json({ success: true, product: updated });
    } catch (err) {
      res.status(404).json({ error: "Product not found or update failed" });
    }
  },
);

// Store checkout / order system (KIMAS)
app.post("/api/checkout", authenticate, async (req, res) => {
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
        return res.status(400).json({
          error: `Stok produk mumpuni tidak memadai untuk ${prod.product_name}`,
        });
      }

      await prisma.product.update({
        where: { id: item.id },
        data: {
          stock: prod.stock - item.quantity,
          sold: prod.sold + item.quantity,
        },
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
        date: new Date().toISOString().split("T")[0],
      },
    });

    // Also register cash flow income under KEUANGAN
    await prisma.financialReport.create({
      data: {
        title: `Unit Bisnis KIMAS - Penjualan: ${itemsText.substring(0, 45)}...`,
        income: total,
        expense: 0,
        file: "Rekap_Penjualan_KIMAS.xlsx",
        type: "income",
        date: new Date().toISOString().split("T")[0],
      },
    });

    await logActivity(
      `Pemesanan merchandise oleh ${student_name} total Rp ${total.toLocaleString("id")}`,
      "green",
    );

    res.json({ success: true, transaction: newTrx });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

// Finance records (income/expense)
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
          date: new Date().toISOString().split("T")[0],
        },
      });

      const typeText = newFin.type === "income" ? "Pemasukan" : "Pengeluaran";
      const numText = (
        newFin.type === "income" ? newFin.income : newFin.expense
      ).toLocaleString("id");
      await logActivity(
        `${typeText} baru: '${title}' sebesar Rp ${numText}`,
        newFin.type === "income" ? "green" : "red",
      );

      res.json({ success: true, report: newFin });
    } catch (err) {
      res.status(500).json({ error: "Failed to add financial record" });
    }
  },
);

// Record Attendance (Administrasi/PSDAM)
app.post(
  "/api/attendances",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { event_name, participant_name, status, npm } = req.body;

      const newAtt = await prisma.attendance.create({
        data: {
          event_name,
          participant_name,
          status,
          npm: npm || `2201${Math.floor(Math.random() * 900 + 100)}`,
          date: new Date().toISOString().split("T")[0],
        },
      });

      await logActivity(
        `Presensi dicatat: ${participant_name} status ${status} pada agenda ${event_name}`,
        "blue",
      );
      res.json({ success: true, attendance: newAtt });
    } catch (err) {
      res.status(500).json({ error: "Failed to record attendance" });
    }
  },
);

// Record Notulensi (Administrasi)
app.post(
  "/api/notulensi",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { title, summary, author } = req.body;

      const newNot = await prisma.notulensi.create({
        data: {
          title,
          date: new Date().toISOString().split("T")[0],
          author: author || "Sekretaris",
          summary,
        },
      });

      await logActivity(`Notulensi diunggah: '${title}'`, "blue");
      res.json({ success: true, notulensi: newNot });
    } catch (err) {
      res.status(500).json({ error: "Failed to upload notulensi" });
    }
  },
);

// Post Announcement (Medinfo)
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
          date: new Date().toISOString().split("T")[0],
        },
      });

      await logActivity(`Pengumuman: '${title}' dirilis ke publik`, "orange");
      res.json({ success: true, announcement: newAnn });
    } catch (err) {
      res.status(500).json({ error: "Failed to create announcement" });
    }
  },
);

// Update Poster/Content Calendar
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
          schedule_date:
            schedule_date || new Date().toISOString().split("T")[0],
          status: status || "draft",
        },
      });

      await logActivity(`Konten terjadwal '${post_title}' ditambahkan`, "blue");
      res.json({ success: true, calendar: newCC });
    } catch (err) {
      res.status(500).json({ error: "Failed to add content calendar" });
    }
  },
);

// Admin add/update/delete Users
app.post("/api/users", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { name, email, role, division_id, npm } = req.body;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        role: role || "mahasiswa",
        division_id: role === "divisi" ? division_id || "div-psdam" : null,
        npm: npm || `2201${Math.floor(Math.random() * 900 + 100)}`,
      },
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
  },
);

// Letters Archiving (Administrasi)
app.get(
  "/api/letters",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const letters = await prisma.letter.findMany({
        orderBy: { id: "desc" },
      });
      res.json(letters);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch letters" });
    }
  },
);

app.post(
  "/api/letters",
  authenticate,
  authorize("admin", "divisi"),
  async (req, res) => {
    try {
      const { num, subject, type, date, handler, file_name } = req.body;

      const newLetter = await prisma.letter.create({
        data: {
          num,
          subject,
          type: type || "Masuk",
          date: date || new Date().toISOString().split("T")[0],
          handler,
          file_name,
        },
      });

      await logActivity(
        `Arsip surat ${type} didaftarkan: '${subject}'`,
        type === "Masuk" ? "blue" : "orange",
      );
      res.json({ success: true, letter: newLetter });
    } catch (err) {
      res.status(500).json({ error: "Failed to create letter archive" });
    }
  },
);

// Gallery / Doker Albums (Medinfo)
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
          emoji: emoji || "📁",
          link: link || "#",
          count: 0,
          size: "0 MB",
        },
      });

      await logActivity(`Album dokumentasi baru diunggah: '${title}'`, "blue");
      res.json({ success: true, album: newAlbum });
    } catch (err) {
      res.status(500).json({ error: "Failed to create gallery album" });
    }
  },
);

// =====================================
// VITE OR STATIC MIDDLEWARE SETUP
// =====================================

async function startServer() {
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
    const { createServer: createViteServer } = await import("vite");
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
    console.log(
      `POINTER SYSTEM server successfully booted on http://localhost:${PORT}`,
    );
  });
}

// Export app for Vercel serverless
export default app;

// Only start the server when running directly (not on Vercel)
if (process.env.VERCEL !== "1") {
  startServer();
}

// Graceful shutdown for Prisma to prevent connection limit exhaustion during hot-reloads
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
