import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seed database...");

  // ── Divisions ──────────────────────────────────────────────
  await prisma.division.createMany({
    data: [
      { id: "div-psdam",        name: "PSDAM" },
      { id: "div-medinfo",      name: "MEDINFO" },
      { id: "div-minbat",       name: "MINAT & BAKAT" },
      { id: "div-sosma",        name: "SOSMA" },
      { id: "div-kimas",        name: "KIMAS" },
      { id: "div-keuangan",     name: "KEUANGAN" },
      { id: "div-administrasi", name: "ADMINISTRASI" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Divisions selesai");

  // ── Users ──────────────────────────────────────────────────
  await prisma.user.createMany({
    data: [
      { id: "u-1",  name: "Raffi Ramadhan Oktaviansyah", email: "raffiramadhan1510@gmail.com",     role: "admin",     division_id: null,               npm: "24781112" },
      { id: "u-2",  name: "Rifky Rangga Saputra",        email: "rifky.rangga@pointer.ac.id",      role: "admin",     division_id: null,               npm: "24781113" },
      { id: "u-3",  name: "Budi Santoso",                email: "budi.santoso@pointer.ac.id",      role: "divisi",    division_id: "div-psdam",        npm: "24781114" },
      { id: "u-4",  name: "Sari Dewi",                   email: "sari.dewi@pointer.ac.id",         role: "divisi",    division_id: "div-medinfo",      npm: "24781115" },
      { id: "u-5",  name: "Rizky Pratama",               email: "rizky.pratama@pointer.ac.id",     role: "divisi",    division_id: "div-minbat",       npm: "24781116" },
      { id: "u-6",  name: "Citra Lestari",               email: "citra.lestari@pointer.ac.id",     role: "divisi",    division_id: "div-sosma",        npm: "24781117" },
      { id: "u-7",  name: "Adi Kurniawan",               email: "adi.kurniawan@pointer.ac.id",     role: "divisi",    division_id: "div-kimas",        npm: "24781118" },
      { id: "u-8",  name: "Farhan Ali",                  email: "farhan.ali@pointer.ac.id",        role: "divisi",    division_id: "div-keuangan",     npm: "24781119" },
      { id: "u-9",  name: "Dewi Anggraeni",              email: "dewi.anggraeni@pointer.ac.id",    role: "divisi",    division_id: "div-administrasi", npm: "24781120" },
      { id: "u-10", name: "Mahendra Sulistyo",           email: "mahendra.sulistyo@pointer.ac.id", role: "mahasiswa", division_id: null,               npm: "24781121" },
      { id: "u-11", name: "Rina Wulandari",              email: "rina.wulandari@pointer.ac.id",    role: "mahasiswa", division_id: null,               npm: "24781122" },
      { id: "u-12", name: "Zaky Iskandar",               email: "zaky.iskandar@pointer.ac.id",     role: "mahasiswa", division_id: null,               npm: "24781123" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Users selesai");

  // ── Programs ───────────────────────────────────────────────
  await prisma.program.createMany({
    data: [
      { id: "p-1", title: "Workshop Web Development 2026",        description: "Pelatihan intensif MERN Stack untuk mempersiapkan mahasiswa menghadapi dunia industri.",             event_date: "2026-06-15", status: "ongoing",   approval_status: "approved", division_id: "div-psdam",  created_by: "Budi Santoso"  },
      { id: "p-2", title: "Lomba Desain Grafis Nasional POINTER", description: "Kompetisi desain poster kreatif tingkat nasional bertema 'Green Tech Initiative'.",                  event_date: "2026-06-25", status: "planning",  approval_status: "rejected", division_id: "div-minbat", created_by: "Rizky Pratama" },
      { id: "p-3", title: "Aksi Sosial Desa Binaan HIMA",         description: "Pengabdian masyarakat berupa penataan lab komputer mini dan pembagian buku pelajaran.",              event_date: "2026-07-10", status: "planning",  approval_status: "approved", division_id: "div-sosma",  created_by: "Citra Lestari" },
      { id: "p-4", title: "Informatics Flash Sale",               description: "Penjualan merchandise eksklusif POINTER secara daring dan luring.",                                  event_date: "2026-06-05", status: "completed", approval_status: "approved", division_id: "div-kimas",  created_by: "Adi Kurniawan" },
      { id: "p-5", title: "Pelatihan Public Speaking & Debat",    description: "Membekali mahasiswa dengan kemampuan komunikasi publik terarah melalui simulasi debat.",             event_date: "2026-07-20", status: "planning",  approval_status: "rejected", division_id: "div-psdam",  created_by: "Budi Santoso"  },
      { id: "p-6", title: "Informatics Art Concert",              description: "Panggung pertunjukan bakat seni dan pameran teknologi di akhir kepengurusan.",                       event_date: "2026-08-30", status: "planning",  approval_status: "rejected", division_id: "div-minbat", created_by: "Rizky Pratama" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Programs selesai");

  // ── Products ───────────────────────────────────────────────
  await prisma.product.createMany({
    data: [
      { id: "prod-1", product_name: "Kaos Eksklusif HIMA POINTER 2026",  price: 85000,  stock: 42,  sold: 23 },
      { id: "prod-2", product_name: "Tote Bag Premium Canvas",            price: 55000,  stock: 29,  sold: 13 },
      { id: "prod-3", product_name: "Sticker Pack Waterproof (10 pcs)",   price: 12000,  stock: 150, sold: 88 },
      { id: "prod-4", product_name: "Embossed Tumblr Organisasi 600ml",   price: 120000, stock: 15,  sold: 10 },
      { id: "prod-5", product_name: "Elegance Lanyard & Card Case",       price: 35000,  stock: 60,  sold: 34 },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Products selesai");

  // ── Financial Reports ──────────────────────────────────────
  await prisma.financialReport.createMany({
    data: [
      { id: "fin-1", title: "Iuran Pokok Anggota Semester Genap 2026",    income: 12400000, expense: 0,       file: "Laporan_Iuran_Mei.xlsx",     type: "income",  date: "2026-05-20" },
      { id: "fin-2", title: "Pemasukan Unit Usaha KIMAS (Merchandise)",    income: 2680000,  expense: 0,       file: "Rekap_Penjualan_KIMAS.xlsx",  type: "income",  date: "2026-05-25" },
      { id: "fin-3", title: "Pengeluaran Konsumsi Workshop Web Dev",        income: 0,        expense: 1800000, file: "RAB_Workshop_WebDev.pdf",     type: "expense", date: "2026-05-26" },
      { id: "fin-4", title: "Biaya Domain & VPS Server POINTER SYSTEM",    income: 0,        expense: 750000,  file: "VPS_Invoice_Pointer.pdf",     type: "expense", date: "2026-05-28" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Financial Reports selesai");

  // ── Notulensi ──────────────────────────────────────────────
  await prisma.notulensi.createMany({
    data: [
      { id: "not-1", title: "Rapat Evaluasi Program Kerja Q1", date: "2026-05-15", author: "Farhan Ali", summary: "1. Pembahasan kesiapan PSDAM dalam workshop MERN. 2. Realisasi unit profit KIMAS melalui tumbler eksklusif sudah 60% stock terjual. 3. Medinfo diminta mempercepat penyusunan kalender posting bulanan." },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Notulensi selesai");

  // ── Announcements ──────────────────────────────────────────
  await prisma.announcement.createMany({
    data: [
      { id: "ann-1", title: "Pendaftaran Lomba Desain Grafis Nasional Dibuka!", content: "Ayo daftarkan dirimu dan wakili departemenmu dalam kompetisi Green Tech Initiative.", category: "Kompetisi", date: "2026-05-28" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Announcements selesai");

  // ── Content Calendar ───────────────────────────────────────
  await prisma.contentCalendar.createMany({
    data: [
      { id: "cc-1", post_title: "Video Reels Profil HIMA POINTER 2026", platform: "Instagram Reels",        schedule_date: "2026-06-01", status: "scheduled" },
      { id: "cc-2", post_title: "Infografis Visi Misi KAHIM POINTER",   platform: "Instagram Story & Feed", schedule_date: "2026-06-03", status: "draft"      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Content Calendar selesai");

  // ── Talents ────────────────────────────────────────────────
  await prisma.talent.createMany({
    data: [
      { id: "tal-1", student_name: "Mahendra Sulistyo", talent: "Mobile Application Development", achievement: "Juara 2 Hackathon Nasional",        certificate: "cert-hackathon-2026.pdf" },
      { id: "tal-2", student_name: "Yulia Safitri",     talent: "Desain UI/UX & Figma Art",       achievement: "Finalis Gemastik Divisi Desain UX", certificate: "cert-gemastik.pdf"       },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Talents selesai");

  // ── Aspirations ────────────────────────────────────────────
  await prisma.aspiration.createMany({
    data: [
      { id: "asp-1", student_name: "Rina Wulandari", category: "Akademik",  message: "Mohon perbanyak porsi praktikum mandiri dan bimbingan karir pasca-kampus.",                           status: "completed", created_at: "22 jam yang lalu" },
      { id: "asp-2", student_name: "Mahendra S.",    category: "Fasilitas", message: "Wifi di koridor ruang sekretariat sering disconnect, mohon diajukan perluasan bandwidth.",            status: "completed", created_at: "1 hari yang lalu" },
      { id: "asp-3", student_name: "Zaky Iskandar",  category: "Lainnya",   message: "Adakah kolaborasi rutin dengan himpunan kampus lain untuk sharing session kurikulum?",                status: "completed", created_at: "3 hari yang lalu" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Aspirations selesai");

  console.log("\n🎉 Seed selesai! Semua data berhasil dimasukkan ke PostgreSQL.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
