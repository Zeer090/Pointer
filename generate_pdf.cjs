const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default || require("jspdf-autotable");
const fs = require("fs");
const path = require("path");

function createLaporanPraktikumPDF() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const primaryColor = [249, 115, 22]; // Brand Orange #f97316
  const darkNavy = [24, 24, 27]; // Dark Zinc #18181b
  const accentBlue = [37, 99, 235]; // Royal Blue #2563eb
  const textDark = [30, 41, 59];
  const textGray = [71, 85, 105];

  let currentPageNum = 1;

  function addHeaderFooter(docPage) {
    const pageCount = docPage.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      docPage.setPage(i);

      // Top bar line
      docPage.setFillColor(...primaryColor);
      docPage.rect(0, 0, 210, 3, "F");

      if (i > 1) {
        // Page Running Header
        docPage.setFont("helvetica", "italic");
        docPage.setFontSize(8);
        docPage.setTextColor(120, 120, 120);
        docPage.text("LAPORAN PRAKTIKUM & BUKTI KOMPETENSI SERTIKOM - POINTER SYSTEM", 14, 10);
        docPage.setDrawColor(220, 220, 220);
        docPage.line(14, 12, 196, 12);

        // Page Running Footer
        docPage.setDrawColor(220, 220, 220);
        docPage.line(14, 282, 196, 282);
        docPage.setFont("helvetica", "normal");
        docPage.setFontSize(8);
        docPage.setTextColor(140, 140, 140);
        docPage.text("Halaman " + i + " dari " + pageCount, 196, 287, { align: "right" });
        docPage.text("Dokumen Resmi Laporan Sertifikasi Kompetensi (SKKNI Web Development)", 14, 287);
      }
    }
  }

  function drawScreenshotBox(docInst, startY, height, boxTitle, instructions, ssTarget) {
    const margin = 14;
    const width = 182;

    // Draw box outline with dashed line or neat border
    docInst.setDrawColor(249, 115, 22);
    docInst.setLineWidth(0.4);
    docInst.setFillColor(250, 250, 250);
    docInst.roundedRect(margin, startY, width, height, 3, 3, "FD");

    // Header strip for screenshot box
    docInst.setFillColor(249, 115, 22);
    docInst.roundedRect(margin, startY, width, 7, 2, 2, "F");

    docInst.setFont("helvetica", "bold");
    docInst.setFontSize(8.5);
    docInst.setTextColor(255, 255, 255);
    docInst.text("📷 " + boxTitle, margin + 4, startY + 5);

    // Inner instructions text
    docInst.setFont("helvetica", "bold");
    docInst.setFontSize(8);
    docInst.setTextColor(239, 68, 68); // Red indicator
    docInst.text("[ TEMPAT SCREENSHOT DITEMPEL DI SINI ]", margin + width / 2, startY + 16, { align: "center" });

    docInst.setFont("helvetica", "italic");
    docInst.setFontSize(7.5);
    docInst.setTextColor(71, 85, 105);
    docInst.text("Target SS: " + ssTarget, margin + width / 2, startY + 21, { align: "center" });

    docInst.setFont("helvetica", "normal");
    docInst.setFontSize(7.5);
    docInst.setTextColor(100, 116, 139);
    const instLines = docInst.splitTextToSize("Instruksi: " + instructions, width - 12);
    docInst.text(instLines, margin + 6, startY + 27);

    return startY + height + 5;
  }

  // ==========================================
  // PAGE 1: COVER / HALAMAN JUDUL LAPORAN
  // ==========================================
  doc.setFillColor(...darkNavy);
  doc.rect(0, 0, 210, 65, "F");

  doc.setFillColor(...primaryColor);
  doc.rect(0, 65, 210, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("LAPORAN PRAKTIKUM &", 14, 25);
  doc.text("BUKTI KOMPETENSI SERTIKOM", 14, 34);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(249, 115, 22);
  doc.text("Standar SKKNI Bidang Software Development & Web Programming", 14, 45);

  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text("Projek Referensi: POINTER SYSTEM (Platform Manajemen Web Terintegrasi)", 14, 53);

  // Box Informasi Peserta Laporan
  let y = 80;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 55, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...textDark);
  doc.text("LEMBAR IDENTITAS PESERTA & PRAKTIKUM", 20, y + 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const studentInfo = [
    ["Judul Laporan", ": Laporan Bukti Pelaksanaan 5 Unit Kompetensi Sertikom"],
    ["Nama Peserta", ": [ Silakan Tulis Nama Anda ]"],
    ["NPM / NIM / NIS", ": [ Silakan Tulis Nomor Induk Anda ]"],
    ["Program Studi / Kelas", ": Rekayasa Perangkat Lunak / Web Development"],
    ["Nama Projek Web", ": POINTER SYSTEM (Web HIMA & Portal Terintegrasi)"],
    ["Tanggal Penyusunan", ": September 2026"]
  ];

  let infoY = y + 17;
  studentInfo.forEach(row => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text(row[0], 20, infoY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(row[1], 65, infoY);
    infoY += 6;
  });

  // DAFTAR UNIT KOMPETENSI
  y = 145;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...textDark);
  doc.text("DAFTAR UNIT KOMPETENSI SKKNI YANG DIUJI", 14, y);

  y += 4;
  const unitsSummary = [
    ["1", "J.620100.010.01", "Menerapkan perintah eksekusi bahasa pemrograman berbasis teks, grafik, dan multimedia"],
    ["2", "J.620100.015.01", "Menyusun fungsi, file atau sumber daya pemrograman yang lain dalam organisasi yang rapi"],
    ["3", "J.620100.016.01", "Menulis kode dengan prinsip sesuai guidelines dan best practices"],
    ["4", "J.620100.017.02", "Mengimplementasikan pemrograman terstruktur"],
    ["5", "J.620100.019.02", "Menggunakan library atau komponen pre-existing"]
  ];

  autoTable(doc, {
    startY: y,
    head: [["No", "Kode Unit", "Judul Unit Kompetensi SKKNI"]],
    body: unitsSummary,
    theme: "grid",
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 35, fontStyle: "bold" },
      2: { cellWidth: 137 }
    },
    margin: { left: 14, right: 14 }
  });

  // ==========================================
  // PAGE 2: BAB I PENDAHULUAN & BAB II PROFIL
  // ==========================================
  doc.addPage();
  y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text("BAB I: PENDAHULUAN", 14, y);

  y += 6;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("1.1 Latar Belakang", 14, y);

  y += 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  const latarBelakang = "Perkembangan industri teknologi informasi menuntut tenaga ahli perangkat lunak untuk menguasai kompetensi pembuatan web berbasis standar industri. Laporan praktikum dan sertifikasi kompetensi (Sertikom) ini disusun untuk membuktikan penguasaan terhadap 5 Unit Kompetensi Standar Kompetensi Kerja Nasional Indonesia (SKKNI) dalam bidang Software Development. Projek 'POINTER SYSTEM' dipilih sebagai studi kasus praktikum karena mengimplementasikan teknologi modern berbasis React 19, TypeScript, Vite, Tailwind CSS, serta Express Server dan Prisma ORM.";
  const lbLines = doc.splitTextToSize(latarBelakang, 182);
  doc.text(lbLines, 14, y);

  y += lbLines.length * 4 + 4;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("1.2 Tujuan Praktikum & Sertifikasi", 14, y);

  y += 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  const tujuan = [
    "1. Membuktikan kemampuan mengeksekusi kode berbasis teks, grafik, dan multimedia (J.620100.010.01).",
    "2. Menunjukkan kemampuan mengorganisasikan berkas dan struktur direktori projek secara modular dan rapi (J.620100.015.01).",
    "3. Menerapkan aturan penulisan kode bersih (clean code) sesuai guidelines TypeScript dan best practices (J.620100.016.01).",
    "4. Mengimplementasikan algoritma dan kontrol alur pemrograman terstruktur serta penanganan exception (J.620100.017.02).",
    "5. Mengintegrasikan berbagai pustaka (pre-existing libraries) profesional untuk mempercepat pembangunan aplikasi (J.620100.019.02)."
  ];
  tujuan.forEach(tuj => {
    doc.text(tuj, 14, y);
    y += 4.5;
  });

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text("BAB II: GAMBARAN UMUM PROJEK POINTER SYSTEM", 14, y);

  y += 6;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  const profilApp = "POINTER SYSTEM adalah platform tata kelola organisasi digital dan portal web terpadu. Aplikasi ini memfasilitasi manajemen divisi, pengusulan dan evaluasi program kerja, pencatatan keuangan transparan, sirkulasi kearsipan, serta galeri dokumentasi kegiatan.";
  const paLines = doc.splitTextToSize(profilApp, 182);
  doc.text(paLines, 14, y);

  y += paLines.length * 4 + 4;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Tabel Informasi Identitas Projek (Memenuhi Syarat Sertikom #5)", 14, y);

  y += 4;
  const projectTable = [
    ["Nama Platform / Projek", "POINTER SYSTEM (HIMA & Web Portal)"],
    ["Arsitektur Technology Stack", "Frontend: React 19, TypeScript, Vite, Tailwind CSS\nBackend: Express.js (Node.js), Prisma ORM"],
    ["Nomor SK / Legalitas", "SK/048/HIMA-POINTER/2026"],
    ["Fungsi Utama Aplikasi", "Sistem Informasi Manajemen Terintegrasi, Portal Berita, Galeri, & Dashboard Divisi"],
    ["Cakupan Pengujian", "5 Unit Kompetensi SKKNI Bidang Pemrograman Web"]
  ];

  autoTable(doc, {
    startY: y,
    head: [["Parameter Projek", "Spesifikasi Teknis & Keterangan"]],
    body: projectTable,
    theme: "grid",
    headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    columnStyles: { 0: { cellWidth: 50, fontStyle: "bold" }, 1: { cellWidth: 132 } },
    margin: { left: 14, right: 14 }
  });

  // ==========================================
  // PAGE 3: BAB III - UNIT 1 & UNIT 2
  // ==========================================
  doc.addPage();
  y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text("BAB III: PEMBAHASAN BUKTI 5 UNIT KOMPETENSI", 14, y);

  y += 7;
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("3.1 Unit J.620100.010.01: Perintah Eksekusi Teks, Grafik, & Multimedia", 14, y);

  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  doc.text("Landasan Teori: Unit ini menilai kemampuan mengeksekusi bahasa berbasis teks, antarmuka visual grafik, serta elemen multimedia.", 14, y);

  y += 5;
  // BOX SS 1A
  y = drawScreenshotBox(
    doc,
    y,
    35,
    "SCREENSHOT 1A: Tampilan Antarmuka Grafis UI & Aset Multimedia",
    "Buka browser (http://localhost:5173). Capture seluruh area Halaman Utama (Navbar, Logo POINTER, Hero Title, dan Stats Grid).",
    "Browser -> Landing Page (Navbar & Hero Section)"
  );

  // BOX SS 1B
  y = drawScreenshotBox(
    doc,
    y,
    35,
    "SCREENSHOT 1B: Perintah Import Multimedia & Script Eksekusi package.json",
    "Buka VS Code file package.json (baris 6-15) dan file src/components/LandingPage.tsx (baris 1-20 yang mengimpor logo png).",
    "VS Code -> d:/pointer-system/package.json & LandingPage.tsx"
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Analisis & Penjelasan Kode Unit 1:", 14, y);

  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  const u1Analisis = "Pada unit ini, aplikasi mengeksekusi kode berbasis teks yaitu TypeScript dan JSX. Komponen grafik dibangun menggunakan kombinasi Tailwind CSS utility classes dan sistem ikon Lucide React. Elemen multimedia diimplementasikan melalui import berkas gambar logo organisasi ('pointer_logo_clean.png') dan gambar banner divisi. Script eksekusi utama didefinisikan pada 'package.json' dengan perintah 'npm run dev' yang menjalankan bundler Vite dan Express server secara terintegrasi.";
  const u1Lines = doc.splitTextToSize(u1Analisis, 182);
  doc.text(u1Lines, 14, y);

  // ==========================================
  // PAGE 4: BAB III - UNIT 2 & UNIT 3
  // ==========================================
  doc.addPage();
  y = 20;

  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("3.2 Unit J.620100.015.01: Menyusun Fungsi, File, & Sumber Daya secara Rapi", 14, y);

  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  doc.text("Landasan Teori: Unit ini menilai keteraturan organisasi struktur berkas dan pengelompokan fungsi sesuai tanggung jawabnya.", 14, y);

  y += 5;
  // BOX SS 2
  y = drawScreenshotBox(
    doc,
    y,
    38,
    "SCREENSHOT 2: Struktur Direktori Projek & Pemisahan Interface Data",
    "Expand folder 'src/' di Explorer VS Code sebelah kiri. Pastikan folder components, divisions, assets, types.ts, dan server.ts terlihat jelas.",
    "VS Code Explorer -> Pohon Direktori d:/pointer-system/src/"
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Analisis & Penjelasan Kode Unit 2:", 14, y);

  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  const u2Analisis = "Arsitektur projek disusun secara modular berbasis prinsip Separation of Concerns. Komponen tampilan UI ditempatkan pada direktori 'src/components/', modul fungsional per divisi diisolasi dalam 'src/components/divisions/', definisi tipe data terpusat pada 'src/types.ts', aset multimedia disimpan dalam 'src/assets/', dan backend API berada di 'server.ts'. Struktur berkas yang rapi ini memudahkan pemeliharaan kode (maintainability) dan skalabilitas aplikasi.";
  const u2Lines = doc.splitTextToSize(u2Analisis, 182);
  doc.text(u2Lines, 14, y);

  y += u2Lines.length * 4 + 6;

  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("3.3 Unit J.620100.016.01: Menulis Kode Sesuai Guidelines & Best Practices", 14, y);

  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  doc.text("Landasan Teori: Unit ini menilai kepatuhan terhadap konvensi penamaan, strict typing, dan verifikasi bebas error kompilasi.", 14, y);

  y += 5;
  // BOX SS 3
  y = drawScreenshotBox(
    doc,
    y,
    38,
    "SCREENSHOT 3: Definisi Interface Strict Type & Terminal Compile Zero Error",
    "Buka file src/types.ts (interface User, Program) dan Terminal VS Code setelah menjalankan perintah 'npx tsc --noEmit' (bebas error).",
    "VS Code -> src/types.ts & Terminal (npx tsc --noEmit)"
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Analisis & Penjelasan Kode Unit 3:", 14, y);

  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  const u3Analisis = "Penulisan kode mengikuti aturan Clean Code dan standar TypeScript strict mode. Variabel dan komponen menggunakan konvensi baku: PascalCase untuk nama komponen React dan interface (contoh: `FullDatabase`, `LandingPage`), serta camelCase untuk variabel dan handler (contoh: `currentUser`, `onOpenLogin`). Kualitas kode dibuktikan dengan hasil eksekusi kompilator TypeScript (`npx tsc --noEmit`) yang menghasilkan zero type mismatch maupun syntax error.";
  const u3Lines = doc.splitTextToSize(u3Analisis, 182);
  doc.text(u3Lines, 14, y);

  // ==========================================
  // PAGE 5: BAB III - UNIT 4 & UNIT 5
  // ==========================================
  doc.addPage();
  y = 20;

  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("3.4 Unit J.620100.017.02: Mengimplementasikan Pemrograman Terstruktur", 14, y);

  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  doc.text("Landasan Teori: Unit ini menilai penggunaan struktur kontrol perulangan, percabangan, dan exception handling terisolasi.", 14, y);

  y += 5;
  // BOX SS 4
  y = drawScreenshotBox(
    doc,
    y,
    38,
    "SCREENSHOT 4: Algoritma Perulangan .map() & REST API Try-Catch Handler",
    "Buka src/components/LandingPage.tsx (perulangan map proker/divisi) atau server.ts (fungsi API Express dengan try-catch block).",
    "VS Code -> d:/pointer-system/src/components/LandingPage.tsx & server.ts"
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Analisis & Penjelasan Kode Unit 4:", 14, y);

  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  const u4Analisis = "Pemrograman terstruktur diimplementasikan secara terisolasi baik pada layer antarmuka maupun server. Di bagian frontend, pengolahan koleksi data menggunakan fungsi fungsional terstruktur seperti `.map()` untuk merender daftar program kerja dan `.filter()` untuk menyaring divisi. Pada layer backend (`server.ts`), penanganan REST API dibungkus dalam blok `try ... catch ... finally` untuk menjamin bahwa exception terisolasi dan sistem memberikan respon HTTP error code yang terprediksi.";
  const u4Lines = doc.splitTextToSize(u4Analisis, 182);
  doc.text(u4Lines, 14, y);

  y += u4Lines.length * 4 + 6;

  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("3.5 Unit J.620100.019.02: Menggunakan Library atau Komponen Pre-existing", 14, y);

  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  doc.text("Landasan Teori: Unit ini menilai kemampuan mengidentifikasi dan mengintegrasikan pustaka perangkat lunak pihak ketiga.", 14, y);

  y += 5;
  // BOX SS 5
  y = drawScreenshotBox(
    doc,
    y,
    38,
    "SCREENSHOT 5: Daftar Dependensi package.json & Penggunaan Import Library",
    "Buka file package.json (baris 19-34 bagian dependencies) dan baris import di bagian atas file src/App.tsx.",
    "VS Code -> package.json (dependencies) & src/App.tsx (imports)"
  );

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Analisis & Penjelasan Kode Unit 5:", 14, y);

  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  const u5Analisis = "Aplikasi memanfaatkan pustaka pre-existing yang terverifikasi untuk mempercepat siklus pengembangan dan meningkatkan keandalan sistem. Library yang diintegrasikan mencakup React 19 (UI Library), Lucide React (Sistem Ikon Grafis), Tailwind CSS (Design System), Express.js (Web Framework), Prisma ORM (Object-Relational Mapping), jsPDF & ExcelJS (Generator Dokumen/Laporan), serta Motion (Modul Animasi). Seluruh dependensi terdaftar resmi pada 'package.json'.";
  const u5Lines = doc.splitTextToSize(u5Analisis, 182);
  doc.text(u5Lines, 14, y);

  // ==========================================
  // PAGE 6: BAB IV PENUTUP & LEMBAR PENGESAHAN
  // ==========================================
  doc.addPage();
  y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...primaryColor);
  doc.text("BAB IV: PENUTUP", 14, y);

  y += 6;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("4.1 Kesimpulan", 14, y);

  y += 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  const kesimpulan = "Berdasarkan hasil pengujian dan pembahasan yang dilakukan pada projek 'POINTER SYSTEM', dapat disimpulkan bahwa aplikasi ini telah memenuhi seluruh kriteria dari 5 Unit Kompetensi SKKNI Pemrograman Web. Kode aplikasi terorganisir rapi, mematuhi prinsip clean code, diuji bebas error kompilasi, serta berhasil mengintegrasikan teknologi modern dan library profesional secara efektif.";
  const kLines = doc.splitTextToSize(kesimpulan, 182);
  doc.text(kLines, 14, y);

  y += kLines.length * 4 + 4;

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("4.2 Saran", 14, y);

  y += 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textGray);
  const saran = "Untuk pengembangan berkelanjutan, disarankan untuk menambahkan unit testing otomatis (seperti Jest atau Vitest) dan mengimplementasikan CI/CD pipeline guna memperkuat jaminan kualitas perangkat lunak.";
  const sLines = doc.splitTextToSize(saran, 182);
  doc.text(sLines, 14, y);

  y += sLines.length * 4 + 12;

  // LEMBAR PENGESAHAN LAPORAN PRAKTIKUM & SERTIKOM
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 182, 65, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...textDark);
  doc.text("LEMBAR PENGESAHAN LAPORAN PRAKTIKUM & SERTIKOM", 20, y + 9);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Laporan Praktikum dan Bukti Kompetensi ini telah diperiksa dan disetujui untuk Sertifikasi Kompetensi.", 20, y + 15);

  let sigY = y + 25;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textDark);
  doc.text("Peserta Praktikum / Sertikom,", 25, sigY);
  doc.text("Asesor / Penguji Kompetensi,", 125, sigY);

  sigY += 22;
  doc.text("( ___________________________ )", 25, sigY);
  doc.text("( ___________________________ )", 125, sigY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("NPM / NIS: ____________________", 25, sigY + 5);
  doc.text("NIP / No. Reg: _________________", 125, sigY + 5);

  // Add header & footer to all pages
  addHeaderFooter(doc);

  // Output PDF
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  const targetPath1 = path.join("d:", "pointer-system", "Laporan_Praktikum_Sertikom_Pointer.pdf");
  const targetPath2 = path.join("C:", "Users", "Asus", ".gemini", "antigravity-ide", "brain", "6a625fec-192d-4ec6-b6bd-cc6ea43574c0", "Laporan_Praktikum_Sertikom_Pointer.pdf");

  fs.writeFileSync(targetPath1, pdfBuffer);
  fs.writeFileSync(targetPath2, pdfBuffer);

  console.log("SUCCESS: Formal Laporan Praktikum PDF created at " + targetPath1);
}

createLaporanPraktikumPDF();
