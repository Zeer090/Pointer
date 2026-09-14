const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default || require("jspdf-autotable");
const fs = require("fs");
const path = require("path");

function createPenjelasanPDF() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const primaryColor = [249, 115, 22]; // Brand Orange #f97316
  const darkNavy = [24, 24, 27]; // Dark Zinc #18181b
  const textDark = [30, 41, 59];
  const textGray = [71, 85, 105];
  const bgLight = [248, 250, 252];

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
        docPage.text("DOKUMEN PENJELASAN SISTEM & FITUR - POINTER SYSTEM", 14, 10);
        docPage.setDrawColor(220, 220, 220);
        docPage.line(14, 12, 196, 12);

        // Page Running Footer
        docPage.setDrawColor(220, 220, 220);
        docPage.line(14, 282, 196, 282);
        docPage.setFont("helvetica", "normal");
        docPage.setFontSize(8);
        docPage.setTextColor(140, 140, 140);
        docPage.text("Halaman " + i + " dari " + pageCount, 196, 287, { align: "right" });
        docPage.text("Dokumen Resmi Penjelasan POINTER SYSTEM - HIMA Manajemen Informatika", 14, 287);
      }
    }
  }

  // ==========================================
  // PAGE 1: COVER & PENDAHULUAN
  // ==========================================
  
  // Header Banner
  doc.setFillColor(...darkNavy);
  doc.rect(0, 0, 210, 55, "F");

  doc.setFillColor(...primaryColor);
  doc.rect(0, 55, 210, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("POINTER SYSTEM 2026", 14, 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.text("PLATFORM MANAJEMEN DIGITAL TERINTEGRASI HIMA POINTER", 14, 30);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text("Buku Panduan Penjelasan Sistem, Fitur Unggulan, Arsitektur Teknologi, dan Latar Belakang", 14, 37);
  doc.text("Tanggal Dokumen: September 2026 | Versi Sistem: v2.4.0 (Production)", 14, 44);

  let y = 68;

  // RINGKASAN EKSEKUTIF
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(251, 146, 60);
  doc.roundedRect(14, y, 182, 28, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text("📌 Ringkasan Eksekutif", 18, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...textDark);
  const ringkasanText = "POINTER SYSTEM adalah platform web manajemen organisasi terintegrasi yang dirancang khusus untuk Himpunan Mahasiswa Manajemen Informatika (HIMA POINTER). Aplikasi ini mengotomatisasi seluruh alur kerja 7 divisi organisasi, tata kelola keuangan, persuratan, notulensi rapat, program kerja, toko unit usaha, serta sistem advokasi aspirasi mahasiswa.";
  const splitRingkasan = doc.splitTextToSize(ringkasanText, 174);
  doc.text(splitRingkasan, 18, y + 13);

  y += 35;

  // SECTION 1: KENAPA MEMBANGUN POINTER SYSTEM (LATAR BELAKANG)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...darkNavy);
  doc.text("1. Latar Belakang & Alasan Pengembangan Sistem", 14, y);
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.6);
  doc.line(14, y + 2, 196, y + 2);

  y += 8;

  const alasanList = [
    {
      title: "Digitalisasi & Sentralisasi Organisasi",
      desc: "Sebelumnya, pendataan program kerja, surat-menyurat, dan buku kas dilakukan secara terpisah di file spreadsheet atau dokumen lokal yang rentan hilang. POINTER SYSTEM menyatukan seluruh alur data ke satu sistem terpusat."
    },
    {
      title: "Transparansi & Akuntabilitas Tata Kelola",
      desc: "Setiap laporan kas keuangan, arsip notulen rapat, serta persetujuan proposal program kerja dapat dipantau secara transparan oleh pengurus dan pengawas organisasi."
    },
    {
      title: "Efisiensi Kerja 7 Divisi Himpunan",
      desc: "Memfasilitasi modul fungsional khusus untuk 7 Divisi (PSDAM, MEDINFO, Minat Bakat, SOSMA, KIMAS, Keuangan, dan Administrasi) sehingga setiap divisi memiliki dashboard kerja yang terarah."
    },
    {
      title: "Respon Cepat Terhadap Aspirasi Mahasiswa",
      desc: "Menyediakan wadah penyampaian aspirasi dan keluhan fasilitas secara digital yang aman dan dapat dilacak status penanganannya secara real-time."
    }
  ];

  alasanList.forEach((item, index) => {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, y, 182, 16, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.text(`1.${index + 1} ${item.title}`, 18, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...textGray);
    const splitDesc = doc.splitTextToSize(item.desc, 174);
    doc.text(splitDesc, 18, y + 10);

    y += 19;
  });

  y += 4;

  // SECTION 2: ARSITEKTUR TEKNOLOGI & DATABASE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...darkNavy);
  doc.text("2. Arsitektur Teknologi & Database", 14, y);
  doc.setDrawColor(...primaryColor);
  doc.line(14, y + 2, 196, y + 2);

  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Komponen", "Teknologi", "Peran & Keunggulan Utama"]],
    body: [
      ["Frontend UI", "React 19, TypeScript, Tailwind CSS, Lucide Icons", "Antarmuka responsif, modern, glassmorphism, dan sangat interaktif dengan tipe data aman."],
      ["Backend Server", "Node.js, Express.js, TypeScript (tsx)", "Menyediakan RESTful API, penanganan transaksi, seeding data, dan logging otomatis."],
      ["Database Cloud", "PostgreSQL (Neon Cloud DB)", "Database relasional performa tinggi dengan SSL encryption, connection pooling, dan FK constraints."],
      ["Database ORM", "Prisma ORM (v5.22)", "Query builder type-safe yang mempermudah migrasi schema, seeding, dan integrasi PostgreSQL."],
      ["State Persistence", "localStorage & URL Hash (#page)", "Menjamin user tidak kembali ke beranda saat F5/refresh, serta menjaga sesi login user secara aman."]
    ],
    headStyles: { fillColor: [24, 24, 27], textColor: [249, 115, 22], fontSize: 8.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  // PAGE 2: DETAIL FITUR-FITUR UTAMA
  doc.addPage();
  y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...darkNavy);
  doc.text("3. Rincian Fitur-Fitur Utama POINTER SYSTEM", 14, y);
  doc.setDrawColor(...primaryColor);
  doc.line(14, y + 2, 196, y + 2);

  y += 8;

  const fiturList = [
    {
      nama: "🔒 Autentikasi & Multi-Role Access",
      detail: "Mendukung 3 hak akses pengguna: Admin (akses penuh & approval), Pengurus Divisi (modul divisi spesifik), dan Mahasiswa Umum (aspirasi, perlombaan, & toko)."
    },
    {
      nama: "📊 Dashboard Analitis & Live Activity Logs",
      detail: "Menampilkan statistik telemetri organisasi secara visual, grafik distribusi proker, serta catat rekaman aktivitas (*audit log*) secara otomatis."
    },
    {
      nama: "📅 Modul Persetujuan & Program Kerja",
      detail: "Manajemen siklus hidup proker dari status *planning*, *ongoing*, hingga *completed*. Admin memiliki wewenang menyetujui (*approve*) atau menolak (*reject*) proposal."
    },
    {
      nama: "🎓 Modul PSDAM (Kaderisasi)",
      detail: "Pengelolaan pelatihan web development, pembinaan kader, pelacakan kompetensi anggota, serta peningkatan keahlian teknis mahasiswa."
    },
    {
      nama: "📢 Modul MEDINFO (Media & Informasi)",
      detail: "Kalender posting konten media sosial (Instagram/YouTube), publikasi pengumuman internal, dan arsip karya desain grafis organisasi."
    },
    {
      nama: "⚙️ Modul MINAT & BAKAT (Prestasi & Lomba)",
      detail: "Pendataan bakat mahasiswa, pengunggahan sertifikat keahlian, dan informasi kompetensi tingkat nasional (Gemastik, Hackathon, dll)."
    },
    {
      nama: "🤝 Modul SOSMA (Sosial Masyarakat)",
      detail: "Pengelolaan aksi pengabdian masyarakat, donasi buku, bersih desa binaan, dan kegiatan tanggap sosial mahasiswa."
    },
    {
      nama: "🛍️ Modul KIMAS (KIMAS Store Marketplace)",
      detail: "Platform toko merchandise organisasi (kaos, totebag, tumbler, lanyard), manajemen stok produk, dan fitur checkout pesanan."
    },
    {
      nama: "💰 Modul KEUANGAN (Manajemen Kas & RAB)",
      detail: "Pencatatan kas pemasukan dan pengeluaran, pengunggahan bukti transfer/RAB (PDF/Excel), serta transparansi neraca saldo organisasi."
    },
    {
      nama: "📋 Modul ADMINISTRASI & NOTULENSI",
      detail: "Arsip surat masuk dan keluar, pembuatan catatan notulen rapat keputusan organisasi, serta pelacakan rekapitulasi presensi/absensi."
    },
    {
      nama: "💬 Advokasi Aspirasi Mahasiswa",
      detail: "Layanan pengaduan keluhan fasilitas/akademik bagi mahasiswa secara rahasia dengan status penanganan *pending*, *processing*, hingga *completed*."
    }
  ];

  autoTable(doc, {
    startY: y,
    head: [["Nama Modul / Fitur", "Deskripsi & Fungsionalitas Utama"]],
    body: fiturList.map(f => [f.nama, f.detail]),
    headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontSize: 8.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 10;

  // SECTION 4: MENGAPA DOKUMEN DIBUAT DALAM BENTUK PDF
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...darkNavy);
  doc.text("4. Alasan Dokumen Ini Diterbitkan Dalam Format PDF", 14, y);
  doc.setDrawColor(...primaryColor);
  doc.line(14, y + 2, 196, y + 2);

  y += 8;

  const alasanPdf = [
    "✅ Standar Portofolio & Dokumen Resmi: Format PDF memastikan seluruh tata letak, warna, tabel, dan tipografi tetap konsisten (*layout invariant*) di semua perangkat (PC, HP, Tablet, Printer).",
    "✅ Lampiran Evaluasi Sertifikasi Kompetensi (Sertikom): Dokumen PDF ini disiapkan sebagai bukti dokumentasi teknis dalam skema Sertifikasi Kompetensi SKKNI Web Development.",
    "✅ Berkas Arsip Laporan Pertanggungjawaban (LPJ): PDF mudah diarsipkan, dicetak, dan dilampirkan dalam berkas pertanggungjawaban organisasi kepada pihak Pengawas & Jurusan.",
    "✅ Aksesibilitas Tanpa Ketergantungan Server: Penguji dan pemangku kepentingan dapat membaca seluruh struktur sistem dan fitur secara komprehensif secara offline tanpa harus membuka source code."
  ];

  alasanPdf.forEach(point => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...textDark);
    const splitPoint = doc.splitTextToSize(point, 178);
    doc.text(splitPoint, 16, y);
    y += doc.getTextDimensions(splitPoint).h + 3;
  });

  // Tanda Tangan & Pengesahan
  y += 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 32, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkNavy);
  doc.text("Pengesahan Dokumen Laporan Sistem", 18, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...textGray);
  doc.text("Dikembangkan oleh: Tim Pengembang HIMA POINTER", 18, y + 13);
  doc.text("Ketua HIMA POINTER: Raffi Ramadhan O.", 18, y + 19);
  doc.text("Administrator Sistem: Rifky Rangga Saputra", 18, y + 25);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text("POINTER SYSTEM 2026 - Official Documentation", 190, y + 25, { align: "right" });

  // Apply running header/footer
  addHeaderFooter(doc);

  const outputPath = path.join(process.cwd(), "Penjelasan_Sistem_dan_Fitur_POINTER_SYSTEM.pdf");
  const pdfBytes = doc.output("arraybuffer");
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes));

  console.log("✅ PDF berhasil dibuat di: " + outputPath);
}

createPenjelasanPDF();
