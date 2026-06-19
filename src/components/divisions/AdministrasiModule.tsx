import React, { useState } from "react";
import { Notulensi, Attendance, User, Letter } from "../../types";
import { FileText, Mail, Calendar, Archive, BellRing, Plus, Sparkles, FolderOpen, Search, Clipboard, Download, FileSpreadsheet } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import logoPolinela from "../../assets/images/Logo Polinela BARU (1).png";
import logoMI from "../../assets/images/pointer_logo_clean_1780038118432.png";

interface AdministrasiModuleProps {
  notulensi: Notulensi[];
  attendances: Attendance[];
  users: User[];
  letters: Letter[];
  onSubmitNotulensi: (title: string, summary: string, author: string) => void;
  onSubmitAttendance: (event: string, name: string, status: "Hadir" | "Izin" | "Sakit" | "Alpa", npm: string) => void;
  onSubmitLetter: (num: string, subject: string, type: string, date: string, handler: string, file_name: string | null) => void;
}

export default function AdministrasiModule({ notulensi, attendances, users, letters, onSubmitNotulensi, onSubmitAttendance, onSubmitLetter }: AdministrasiModuleProps) {
  const [notTitle, setNotTitle] = useState("");
  const [notAuthor, setNotAuthor] = useState("Ririn Agustina");
  const [notSummary, setNotSummary] = useState("");
  const [notSearch, setNotSearch] = useState("");

  const [attEvent, setAttEvent] = useState("Rapat Koordinasi Mingguan");
  const [attUser, setAttUser] = useState("");
  const [attStatus, setAttStatus] = useState<any>("Hadir");

  const [isAddLetterOpen, setIsAddLetterOpen] = useState(false);
  const [letNum, setLetNum] = useState("");
  const [letSubject, setLetSubject] = useState("");
  const [letType, setLetType] = useState("Masuk");
  const [letDate, setLetDate] = useState("");
  const [letHandler, setLetHandler] = useState("");
  const [letFile, setLetFile] = useState<File | null>(null);

  const handleLetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!letNum || !letSubject) return;
    onSubmitLetter(letNum, letSubject, letType, letDate, letHandler, letFile ? letFile.name : null);
    setIsAddLetterOpen(false);
    setLetNum("");
    setLetSubject("");
    setLetFile(null);
  };

  const [activeSubTab, setActiveSubTab] = useState<"notulen" | "surat" | "timeline" | "presensi">("notulen");

  const getLocalDateString = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getAttendanceDate = (at: Attendance) => {
    if (at.date) return at.date;
    if (at.id && at.id.startsWith("att-")) {
      const ts = parseInt(at.id.replace("att-", ""), 10);
      if (!isNaN(ts)) {
        const d = new Date(ts);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }
    return "";
  };

  const [pdfDate, setPdfDate] = useState(getLocalDateString());
  const [exportMode, setExportMode] = useState<"today" | "single" | "range" | "all">("single");
  const [startDate, setStartDate] = useState(getLocalDateString());
  const [endDate, setEndDate] = useState(getLocalDateString());

  const getFilteredAttendances = () => {
    return attendances.filter(at => {
      const atDate = getAttendanceDate(at);
      if (!atDate) return false;
      if (exportMode === "today") {
        return atDate === getLocalDateString();
      } else if (exportMode === "single") {
        return atDate === pdfDate;
      } else if (exportMode === "range") {
        return atDate >= startDate && atDate <= endDate;
      } else if (exportMode === "all") {
        return true;
      }
      return false;
    });
  };

  const filteredAtts = getFilteredAttendances();
  const isSingleDay = exportMode === "today" || exportMode === "single";

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  };

  const exportPDF = async () => {
    try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const todayData = filteredAtts;

    const formatIndonesianDate = (dateStr: string) => {
      if (!dateStr) return "-";
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const parts = dateStr.split("-");
      if (parts.length !== 3) return dateStr;
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const dayName = days[d.getDay()];
      const day = d.getDate();
      const monthName = months[d.getMonth()];
      const year = d.getFullYear();
      return `${dayName}, ${day} ${monthName} ${year}`;
    };

    // Header (kop surat)
    doc.setTextColor(0, 0, 0);
    
    const centerText = (text: string, y: number, size = 11, style = "bold") => {
      doc.setFont("Times", style);
      doc.setFontSize(size);
      const textWidth = doc.getTextWidth(text);
      doc.text(text, (210 - textWidth) / 2, y);
    };

    try {
      const imgLeft = await loadImage(logoPolinela);
      const imgRight = await loadImage(logoMI);
      doc.addImage(imgLeft, "PNG", 15, 10, 24, 24);
      doc.addImage(imgRight, "PNG", 171, 10, 24, 24);
    } catch (e) {
      console.warn("Failed to load PDF logos", e);
    }

    centerText("KEMENTERIAN PENDIDIKAN TINGGI, SAINS,", 15, 11, "bold");
    centerText("DAN TEKNOLOGI", 20, 11, "bold");
    centerText("POLITEKNIK NEGERI LAMPUNG", 25, 12, "bold");
    centerText("POLINELA IT CENTER", 30, 11, "bold");
    centerText("Jalan Soekarno-Hatta Nomor 10 Rajabasa Bandar Lampung. Kode Pos 35144", 34, 8, "normal");
    centerText("Email: pointer@polinela.ac.id", 38, 8, "normal");

    // Double lines
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(15, 41, 195, 41);
    doc.setLineWidth(0.2);
    doc.line(15, 42.2, 195, 42.2);

    // Find location helper
    const knownLocations: Record<string, string> = {
      "rapat koordinasi mingguan": "Sekretariat HIMA POINTER",
      "rapat pleno koordinasi mid-term pointer": "Sekretariat HIMA",
      "evaluasi kinerja bulanan semua divisi": "Platform Zoom Online",
      "penyusunan lpj setengah kepengurusan": "Sekretariat HIMA",
    };
    let tempat = "Sekretariat HIMA POINTER";
    if (todayData.length > 0) {
      const eventKey = todayData[0].event_name.toLowerCase();
      if (knownLocations[eventKey]) {
        tempat = knownLocations[eventKey];
      } else if (eventKey.includes("zoom") || eventKey.includes("online")) {
        tempat = "Platform Zoom Meeting Online";
      }
    }

    if (isSingleDay) {
      // Title
      const targetDate = exportMode === "today" ? getLocalDateString() : pdfDate;
      const firstEventName = todayData.length > 0 ? todayData[0].event_name.toUpperCase() : "RABUAN";
      centerText(`DAFTAR HADIR KEGIATAN ${firstEventName}`, 50, 11, "bold");
      centerText("MANAJEMEN INFORMATIKA", 55, 11, "bold");
      centerText("POLITEKNIK NEGERI LAMPUNG", 60, 11, "bold");

      // Metadata with aligned columns
      const labelX = 15;
      const colonX = 45;
      const valueX = 48;
      const metaFontSize = 10;

      doc.setFont("Times", "normal");
      doc.setFontSize(metaFontSize);

      // Row 1: Hari, tanggal
      doc.text("Hari, tanggal", labelX, 70);
      doc.text(":", colonX, 70);
      doc.text(formatIndonesianDate(targetDate), valueX, 70);

      // Row 2: Tempat
      doc.text("Tempat", labelX, 76);
      doc.text(":", colonX, 76);
      doc.text(tempat, valueX, 76);

      // Row 3: Jenis Rapat
      doc.text("Jenis Rapat", labelX, 82);
      doc.text(":", colonX, 82);
      doc.text(todayData[0]?.event_name || "Rapat", valueX, 82);

      const tableHeaders = [["No", "Nama", "NPM", "Status Kehadiran"]];
      const tableBody = todayData.map((at, index) => [
        index + 1,
        at.participant_name,
        at.npm,
        at.status,
      ]);

      autoTable(doc, {
        startY: 88,
        head: tableHeaders,
        body: tableBody,
        theme: "grid",
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          fontStyle: "bold",
          fontSize: 10,
          halign: "center",
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 15, halign: "center" },
          1: { halign: "left" },
          2: { cellWidth: 38, halign: "center" },
          3: { cellWidth: 45, halign: "center" },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didParseCell: function (data: any) {
          if (data.section === "body" && data.column.index === 3) {
            const status = data.cell.raw;
            if (status === "Hadir") {
              data.cell.styles.textColor = [21, 128, 61];
              data.cell.styles.fontStyle = "bold";
            } else if (status === "Izin") {
              data.cell.styles.textColor = [29, 78, 216];
              data.cell.styles.fontStyle = "bold";
            } else if (status === "Sakit") {
              data.cell.styles.textColor = [161, 98, 7];
              data.cell.styles.fontStyle = "bold";
            } else if (status === "Alpa") {
              data.cell.styles.textColor = [185, 28, 28];
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
        margin: { left: 15, right: 15 },
        styles: {
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          fontSize: 9.5,
          font: "times",
          cellPadding: 3,
        },
      });

      // Summary stats below table
      const finalY = (doc as any).lastAutoTable.finalY + 6;
      doc.setFont("Times", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);

      const hadirC = todayData.filter(a => a.status === "Hadir").length;
      const izinC = todayData.filter(a => a.status === "Izin").length;
      const sakitC = todayData.filter(a => a.status === "Sakit").length;
      const alpaC = todayData.filter(a => a.status === "Alpa").length;
      doc.text(`Keterangan: Hadir: ${hadirC}  |  Izin: ${izinC}  |  Sakit: ${sakitC}  |  Alpa: ${alpaC}  |  Total: ${todayData.length} orang`, 15, finalY);

      // Signature section
      const sigY = Math.min(finalY + 16, 250);
      doc.setTextColor(0, 0, 0);
      doc.setFont("Times", "normal");
      doc.setFontSize(10);

      // Single Signature (Kahim)
      doc.setFontSize(10);
      doc.text("Bandar Lampung, " + formatIndonesianDate(exportMode === "today" ? getLocalDateString() : pdfDate), 125, sigY);
      doc.text("Mengetahui,", 125, sigY + 5);
      doc.text("Ketua HIMA POINTER", 125, sigY + 10);
      
      doc.line(125, sigY + 30, 195, sigY + 30);
      doc.setFont("Times", "bold");
      doc.text("Raffi Ramadhan Oktaviansyah", 125, sigY + 35);
      doc.setFont("Times", "normal");
      doc.setFontSize(8.5);
      doc.text("NIM. 24781112", 125, sigY + 40);

    } else {
      // Consolidated report
      centerText("LAPORAN REKAPITULASI PRESENSI KEGIATAN", 50, 11, "bold");
      centerText("HIMA POINTER - MANAJEMEN INFORMATIKA", 55, 11, "bold");
      centerText("POLITEKNIK NEGERI LAMPUNG", 60, 11, "bold");

      // Metadata (Periode & Keterangan)
      doc.setFont("Times", "normal");
      doc.setFontSize(10);

      const labelX = 15;
      const colonX = 32;
      const valueX = 35;

      doc.text("Periode", labelX, 72);
      doc.text(":", colonX, 72);
      if (exportMode === "range") {
        doc.text(`${formatIndonesianDate(startDate)} s.d ${formatIndonesianDate(endDate)}`, valueX, 72);
      } else {
        doc.text("Semua Riwayat Presensi", valueX, 72);
      }

      doc.text("Total Data", labelX, 78);
      doc.text(":", colonX, 78);
      doc.text(`${todayData.length} baris pencatatan`, valueX, 78);

      const tableHeaders = [["No", "Tanggal", "Nama Kegiatan / Agenda", "Nama Pengurus", "NPM", "Status"]];
      const tableBody = todayData.map((at, index) => [
        index + 1,
        getAttendanceDate(at),
        at.event_name,
        at.participant_name,
        at.npm,
        at.status,
      ]);

      autoTable(doc, {
        startY: 84,
        head: tableHeaders,
        body: tableBody,
        theme: "grid",
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          fontStyle: "bold",
          fontSize: 9,
          halign: "center",
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 22, halign: "center" },
          2: { halign: "left" },
          3: { cellWidth: 40, halign: "left" },
          4: { cellWidth: 25, halign: "center" },
          5: { cellWidth: 20, halign: "center" },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didParseCell: function (data: any) {
          if (data.section === "body" && data.column.index === 5) {
            const status = data.cell.raw;
            if (status === "Hadir") {
              data.cell.styles.textColor = [21, 128, 61];
              data.cell.styles.fontStyle = "bold";
            } else if (status === "Izin") {
              data.cell.styles.textColor = [29, 78, 216];
              data.cell.styles.fontStyle = "bold";
            } else if (status === "Sakit") {
              data.cell.styles.textColor = [161, 98, 7];
              data.cell.styles.fontStyle = "bold";
            } else if (status === "Alpa") {
              data.cell.styles.textColor = [185, 28, 28];
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
        margin: { left: 15, right: 15 },
        styles: {
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          fontSize: 8.5,
          font: "times",
          cellPadding: 2.5,
        },
      });

      // Summary stats
      const finalY = (doc as any).lastAutoTable.finalY + 6;
      doc.setFont("Times", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 80, 80);

      const hadirC = todayData.filter(a => a.status === "Hadir").length;
      const izinC = todayData.filter(a => a.status === "Izin").length;
      const sakitC = todayData.filter(a => a.status === "Sakit").length;
      const alpaC = todayData.filter(a => a.status === "Alpa").length;
      doc.text(`Keterangan: Hadir: ${hadirC}  |  Izin: ${izinC}  |  Sakit: ${sakitC}  |  Alpa: ${alpaC}  |  Total: ${todayData.length} orang`, 15, finalY);
    }

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("Times", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const pageText = `Halaman ${i} dari ${pageCount}`;
      const pageTextWidth = doc.getTextWidth(pageText);
      doc.text(pageText, (210 - pageTextWidth) / 2, 285);
      doc.text("POINTER SYSTEM - 2026 | Laporan ini sah dihasilkan secara elektronik.", 15, 289);
    }

    const fileSuffix = exportMode === "range" ? `${startDate}_sd_${endDate}` : exportMode === "all" ? "Semua" : (exportMode === "today" ? getLocalDateString() : pdfDate);
    doc.save(`Presensi_Rekap_${fileSuffix}.pdf`);
    } catch (err: any) {
      console.error("Export PDF Error:", err);
      alert("Gagal mengekspor PDF:\n\n" + (err?.message || err?.toString() || "Unknown error") + "\n\nStack: " + (err?.stack || "N/A"));
    }
  };

  const exportExcel = async () => {
    const dataToExport = filteredAtts;
    if (dataToExport.length === 0) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Presensi");

      const todayData = filteredAtts;
      const targetDate = exportMode === "today" ? getLocalDateString() : pdfDate;
      const firstEventName = todayData.length > 0 ? todayData[0].event_name.toUpperCase() : "RABUAN";

      const formatIndonesianDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const months = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
          "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        const parts = dateStr.split("-");
        if (parts.length !== 3) return dateStr;
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayName = days[d.getDay()];
        const day = d.getDate();
        const monthName = months[d.getMonth()];
        const year = d.getFullYear();
        return `${dayName}, ${day} ${monthName} ${year}`;
      };

      // Find location
      let tempat = "Sekretariat HIMA POINTER";
      if (todayData.length > 0) {
        const matchingAgenda = mockAgendas.find(
          ag => ag.title.toLowerCase() === todayData[0].event_name.toLowerCase()
        );
        if (matchingAgenda) {
          tempat = matchingAgenda.loc;
        } else if (todayData[0].event_name.toLowerCase().includes("zoom") || todayData[0].event_name.toLowerCase().includes("online")) {
          tempat = "Platform Zoom Meeting Online";
        }
      }

      const lastCol = isSingleDay ? "D" : "F";

      // Helper to add Kop row
      const addKopRow = (rowNum: number, text: string, fontSize: number, isBold: boolean) => {
        worksheet.mergeCells(`A${rowNum}:${lastCol}${rowNum}`);
        const cell = worksheet.getCell(`A${rowNum}`);
        cell.value = text;
        cell.font = { name: "Arial", size: fontSize, bold: isBold };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      };

      addKopRow(1, "KEMENTERIAN PENDIDIKAN TINGGI, SAINS,", 11, true);
      addKopRow(2, "DAN TEKNOLOGI", 11, true);
      addKopRow(3, "POLITEKNIK NEGERI LAMPUNG", 12, true);
      addKopRow(4, "POLINELA IT CENTER", 11, true);
      addKopRow(5, "Jalan Soekarno-Hatta Nomor 10 Rajabasa Bandar Lampung. Kode Pos 35144", 8.5, false);
      addKopRow(6, "Email: pointer@polinela.ac.id", 8.5, false);

      // Add double border in ExcelJS on row 6 bottom
      for (let col = 1; col <= (isSingleDay ? 4 : 6); col++) {
        const cell = worksheet.getCell(6, col);
        cell.border = {
          bottom: { style: "double", color: { argb: "000000" } }
        };
      }

      // Title
      const addTitleRow = (rowNum: number, text: string) => {
        worksheet.mergeCells(`A${rowNum}:${lastCol}${rowNum}`);
        const cell = worksheet.getCell(`A${rowNum}`);
        cell.value = text;
        cell.font = { name: "Arial", size: 11, bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      };

      addTitleRow(8, isSingleDay ? `DAFTAR HADIR KEGIATAN ${firstEventName}` : "LAPORAN REKAPITULASI PRESENSI KEGIATAN");
      addTitleRow(9, isSingleDay ? "MANAJEMEN INFORMATIKA" : "HIMA POINTER - MANAJEMEN INFORMATIKA");
      addTitleRow(10, "POLITEKNIK NEGERI LAMPUNG");

      // Metadata
      if (isSingleDay) {
        worksheet.getCell("A12").value = "Hari, tanggal";
        worksheet.getCell("B12").value = `: ${formatIndonesianDate(targetDate)}`;
        worksheet.getCell("A13").value = "Tempat";
        worksheet.getCell("B13").value = `: ${tempat}`;
        worksheet.getCell("A14").value = "Jenis Rapat";
        worksheet.getCell("B14").value = `: ${todayData[0]?.event_name || "Rapat"}`;

        ["A12", "B12", "A13", "B13", "A14", "B14"].forEach(cellId => {
          const cell = worksheet.getCell(cellId);
          cell.font = { name: "Arial", size: 10, bold: cellId.startsWith("A") };
          cell.alignment = { horizontal: "left", vertical: "middle" };
        });
      } else {
        worksheet.getCell("A12").value = "Periode";
        worksheet.getCell("B12").value = `: ${exportMode === "range" ? `${formatIndonesianDate(startDate)} s.d ${formatIndonesianDate(endDate)}` : "Semua Riwayat Presensi"}`;
        worksheet.getCell("A13").value = "Total Data";
        worksheet.getCell("B13").value = `: ${todayData.length} baris pencatatan`;

        ["A12", "B12", "A13", "B13"].forEach(cellId => {
          const cell = worksheet.getCell(cellId);
          cell.font = { name: "Arial", size: 10, bold: cellId.startsWith("A") };
          cell.alignment = { horizontal: "left", vertical: "middle" };
        });
      }

      // Headers Row
      const startRow = 16;
      const headers = isSingleDay 
        ? ["No", "Nama", "NPM", "Status Kehadiran"]
        : ["No", "Tanggal", "Nama Kegiatan / Agenda", "Nama Pengurus", "NPM", "Status"];

      headers.forEach((header, colIndex) => {
        const cell = worksheet.getCell(startRow, colIndex + 1);
        cell.value = header;
        cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "1E293B" }
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "000000" } },
          left: { style: "thin", color: { argb: "000000" } },
          bottom: { style: "thin", color: { argb: "000000" } },
          right: { style: "thin", color: { argb: "000000" } }
        };
      });

      // Data Rows
      let currentRow = startRow + 1;
      todayData.forEach((at, index) => {
        const rowData = isSingleDay
          ? [index + 1, at.participant_name, at.npm, at.status]
          : [index + 1, getAttendanceDate(at), at.event_name, at.participant_name, at.npm, at.status];

        rowData.forEach((val, colIndex) => {
          const cell = worksheet.getCell(currentRow, colIndex + 1);
          cell.value = val;
          
          cell.font = { name: "Arial", size: 9.5 };
          cell.alignment = { 
            vertical: "middle", 
            horizontal: (colIndex === 0 || (isSingleDay ? (colIndex === 2 || colIndex === 3) : (colIndex === 1 || colIndex === 4 || colIndex === 5))) ? "center" : "left"
          };
          cell.border = {
            top: { style: "thin", color: { argb: "D1D5DB" } },
            left: { style: "thin", color: { argb: "D1D5DB" } },
            bottom: { style: "thin", color: { argb: "D1D5DB" } },
            right: { style: "thin", color: { argb: "D1D5DB" } }
          };

          const statusColIndex = isSingleDay ? 3 : 5;
          if (colIndex === statusColIndex) {
            cell.font = { name: "Arial", size: 9.5, bold: true };
            if (val === "Hadir") {
              cell.font.color = { argb: "15803D" };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DCFCE7" } };
            } else if (val === "Izin") {
              cell.font.color = { argb: "1D4ED8" };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "DBEAFE" } };
            } else if (val === "Sakit") {
              cell.font.color = { argb: "A16207" };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEF9C3" } };
            } else if (val === "Alpa") {
              cell.font.color = { argb: "B91C1C" };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FEE2E2" } };
            }
          }
        });

        currentRow++;
      });

      // Column Widths
      if (isSingleDay) {
        worksheet.getColumn(1).width = 8;
        worksheet.getColumn(2).width = 35;
        worksheet.getColumn(3).width = 18;
        worksheet.getColumn(4).width = 20;
      } else {
        worksheet.getColumn(1).width = 8;
        worksheet.getColumn(2).width = 15;
        worksheet.getColumn(3).width = 35;
        worksheet.getColumn(4).width = 25;
        worksheet.getColumn(5).width = 18;
        worksheet.getColumn(6).width = 15;
      }

      // Generate & Trigger Download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileSuffix = exportMode === "range" ? `${startDate}_sd_${endDate}` : exportMode === "all" ? "Semua" : (exportMode === "today" ? getLocalDateString() : pdfDate);
      const filename = `Presensi_Rekap_${fileSuffix}.xlsx`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Gagal melakukan export Excel: ", error);
      alert("Terjadi kesalahan saat mengekspor data ke Excel.");
    }
  };

  // mockLetters removed in favor of `letters` props

  const mockAgendas = [
    { title: "Rapat Pleno Koordinasi Mid-Term POINTER", date: "29 Mei 2026 (Hari ini)", time: "18:30 WIB", loc: "Sekretariat HIMA", status: "Sudah Dekat" },
    { title: "Evaluasi Kinerja Bulanan Semua Divisi", date: "31 Mei 2026", time: "10:00 WIB", loc: "Platform Zoom Online", status: "Selesai" },
    { title: "Penyusunan LPJ Setengah Kepengurusan", date: "15 Juni 2026", time: "09:00 WIB", loc: "Sekretariat HIMA", status: "Persiapan" }
  ];

  const handleNotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notTitle || !notSummary) return;
    onSubmitNotulensi(notTitle, notSummary, notAuthor);
    setNotTitle("");
    setNotSummary("");
  };

  const handleAttSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attUser) return;
    const selectedObj = users.find(u => u.name === attUser);
    onSubmitAttendance(attEvent, attUser, attStatus, selectedObj?.npm || "2201" + Math.floor(100 + Math.random() * 900));
    setAttUser("");
  };

  const filteredNotulensi = notulensi.filter(n =>
    n.title.toLowerCase().includes(notSearch.toLowerCase()) ||
    n.summary.toLowerCase().includes(notSearch.toLowerCase())
  );

  const hadirCount = attendances.filter(a => a.status === "Hadir").length;
  const alphaCount = attendances.filter(a => a.status === "Alpa").length;

  return (
    <div className="space-y-6">
      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs font-mono uppercase mb-2">Total Agenda Rapat</div>
          <div className="text-3xl font-display font-bold text-white">18</div>
          <div className="text-xs text-brand-orange mt-2 flex items-center gap-1">
            <Calendar size={12} /> Konsistensi terjadwal
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs font-mono uppercase mb-2">Persuratan Arsip</div>
          <div className="text-3xl font-display font-bold text-white">{letters.length} Berkas</div>
          <div className="text-xs text-green-500 mt-2 flex items-center gap-1">
            <Archive size={12} /> Surat Masuk & Keluar
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs font-mono uppercase mb-2">Notulen Diunggah</div>
          <div className="text-3xl font-display font-bold text-white">{notulensi.length}</div>
          <div className="text-xs text-blue-400 mt-2">
            Transparansi hasil rapat
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs font-mono uppercase mb-2">Total Presensi</div>
          <div className="text-3xl font-display font-bold text-white">{attendances.length}</div>
          <div className="text-xs text-purple-400 mt-2 font-mono">
            {hadirCount} Hadir · {alphaCount} Alpa
          </div>
        </div>
      </div>

      {/* COMPONENT SUBTABS */}
      <div className="flex gap-2 border-b border-dark-border pb-3 bg-dark-bg/25 p-1 rounded-lg flex-wrap">
        <button
          onClick={() => setActiveSubTab("notulen")}
          className={`px-4 py-2 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
            activeSubTab === "notulen" ? "bg-brand-orange text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <FileText size={14} /> Notulensi Rapat
        </button>
        <button
          onClick={() => setActiveSubTab("presensi")}
          className={`px-4 py-2 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
            activeSubTab === "presensi" ? "bg-brand-orange text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Clipboard size={14} /> Presensi Kehadiran
        </button>
        <button
          onClick={() => setActiveSubTab("surat")}
          className={`px-4 py-2 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
            activeSubTab === "surat" ? "bg-brand-orange text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Mail size={14} /> Kearsipan Surat Masuk/Keluar
        </button>
        <button
          onClick={() => setActiveSubTab("timeline")}
          className={`px-4 py-2 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
            activeSubTab === "timeline" ? "bg-brand-orange text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <Calendar size={14} /> Timeline Agenda & Pengingat
        </button>
      </div>

      {/* SUBTAB: NOTULEN */}
      {activeSubTab === "notulen" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NOTULEN LIST */}
          <div className="lg:col-span-2 bg-dark-surface border border-dark-border rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <h3 className="font-display font-bold text-lg text-white">Arsip Notulen Rapat HIMA</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari notulensi..."
                  className="bg-dark-bg border border-dark-border rounded-full pl-8 pr-4 py-1 text-xs text-white focus:outline-none focus:border-brand-orange"
                  value={notSearch}
                  onChange={(e) => setNotSearch(e.target.value)}
                />
                <Search className="absolute left-2.5 top-2 text-gray-500" size={12} />
              </div>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
              {filteredNotulensi.map((n) => (
                <div key={n.id} className="bg-dark-bg border border-dark-border p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-white text-sm">{n.title}</h4>
                      <div className="text-[10px] text-gray-500 font-mono mt-1">Oleh: {n.author} · Tanggal: {n.date}</div>
                    </div>
                    <span className="text-[10px] bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded border border-brand-orange/20 font-mono">
                      {n.id}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-line bg-[#131317] p-3 rounded border border-dark-border">
                    {n.summary}
                  </p>
                </div>
              ))}
              {filteredNotulensi.length === 0 && (
                <div className="text-center py-10 text-gray-500 text-xs">Belum ada dokumen hasil rapat terekam.</div>
              )}
            </div>
          </div>

          {/* ADD NOTULEN FORM */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-5 h-fit">
            <h3 className="font-display font-bold text-base text-white mb-4 flex items-center gap-1.5 border-b border-dark-border pb-3">
              <Sparkles className="text-brand-orange" size={18} />
              Tulis Notulensi Rapat Baru
            </h3>
            <form onSubmit={handleNotSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-gray-500">Agenda / Topik Rapat</label>
                <input
                  type="text"
                  placeholder="cth. Evaluasi Kesiapan Open House"
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none"
                  value={notTitle}
                  onChange={(e) => setNotTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-gray-500">Penulis Notulen</label>
                <input
                  type="text"
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none"
                  value={notAuthor}
                  onChange={(e) => setNotAuthor(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-gray-500">Rangkuman Hasil Putusan (Point per Point)</label>
                <textarea
                  placeholder="1. Pembagian PIC konsumsi dialihkan ke Medinfo&#10;2. Batas akhir pendaftaran lomba diperpanjang sampai 12 Juni&#10;3. Rapat berikutnya diadakan offline hari Selasa."
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white h-36 focus:outline-none focus:border-brand-orange resize-none"
                  value={notSummary}
                  onChange={(e) => setNotSummary(e.target.value)}
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold py-2.5 rounded transition flex items-center justify-center gap-1"
              >
                <Plus size={14} /> Simpan Hasil Notulen
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUBTAB: PRESENSI */}
      {activeSubTab === "presensi" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* INPUT PRESENSI */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5 border-b border-dark-border pb-4">
              <Clipboard className="text-brand-orange" size={20} />
              <h3 className="font-display font-bold text-lg text-white">Input Presensi Kehadiran</h3>
            </div>

            <form onSubmit={handleAttSubmit} className="space-y-3 bg-dark-bg/40 p-4 border border-dark-border rounded-lg mb-5">
              <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">Catat Kehadiran Manual</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <input
                    type="text"
                    placeholder="Nama Pengurus/Anggota"
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                    value={attUser}
                    onChange={(e) => setAttUser(e.target.value)}
                    list="membersList-adm"
                    required
                  />
                  <datalist id="membersList-adm">
                    {users.map(u => <option key={u.id} value={u.name} />)}
                  </datalist>
                </div>
                <select
                  className="bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                  value={attStatus}
                  onChange={(e: any) => setAttStatus(e.target.value)}
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Alpa">Alpa</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Nama Rapat / Agenda"
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                value={attEvent}
                onChange={(e) => setAttEvent(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-brand-orange/10 hover:bg-brand-orange/20 border border-brand-orange/20 text-brand-orange rounded text-xs py-1.5 font-semibold transition"
              >
                Catat Kehadiran
              </button>
            </form>

            {/* Ringkasan statistik (Data Terfilter) */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Hadir", color: "green", count: filteredAtts.filter(a => a.status === "Hadir").length },
                { label: "Izin", color: "blue", count: filteredAtts.filter(a => a.status === "Izin").length },
                { label: "Sakit", color: "yellow", count: filteredAtts.filter(a => a.status === "Sakit").length },
                { label: "Alpa", color: "red", count: filteredAtts.filter(a => a.status === "Alpa").length },
              ].map(s => (
                <div key={s.label} className={`bg-${s.color}-500/5 border border-${s.color}-500/20 rounded-lg p-3 text-center`}>
                  <div className={`text-xl font-display font-bold text-${s.color}-400`}>{s.count}</div>
                  <div className={`text-[10px] font-mono text-${s.color}-500 mt-1`}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TABEL PRESENSI */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <div className="border-b border-dark-border pb-4 mb-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    {exportMode === "today" ? "Rekap Presensi Hari Ini" :
                     exportMode === "single" ? "Rekap Presensi Tanggal" :
                     exportMode === "range" ? "Rekap Presensi Periode" :
                     "Rekap Seluruh Presensi"}
                  </h3>
                  <span className="text-[10px] font-mono text-brand-orange">
                    {exportMode === "today" ? getLocalDateString() :
                     exportMode === "single" ? pdfDate :
                     exportMode === "range" ? `${startDate} s.d ${endDate}` :
                     "Semua Riwayat Data"}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={exportPDF}
                    disabled={filteredAtts.length === 0}
                    className="bg-brand-orange hover:bg-brand-orange-hover disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={14} /> Unduh PDF
                  </button>
                  <button
                    onClick={exportExcel}
                    disabled={filteredAtts.length === 0}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet size={14} /> Unduh Excel (XLSX)
                  </button>
                </div>
              </div>

              {/* CONTROL FILTERS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-dark-bg/40 p-3 rounded-lg border border-dark-border">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono uppercase text-gray-500">Mode Filter Hari</label>
                  <select
                    className="w-full bg-dark-bg border border-dark-border rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-orange text-left"
                    style={{ colorScheme: "dark" }}
                    value={exportMode}
                    onChange={(e: any) => setExportMode(e.target.value)}
                  >
                    <option value="today">Hari Ini</option>
                    <option value="single">Pilih Tanggal</option>
                    <option value="range">Rentang Tanggal</option>
                    <option value="all">Semua Hari</option>
                  </select>
                </div>

                {exportMode === "single" && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] font-mono uppercase text-gray-500">Pilih Tanggal</label>
                    <input
                      type="date"
                      className="w-full bg-dark-bg border border-dark-border rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-orange"
                      value={pdfDate}
                      onChange={(e) => setPdfDate(e.target.value)}
                    />
                  </div>
                )}

                {exportMode === "range" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase text-gray-500">Tanggal Mulai</label>
                      <input
                        type="date"
                        className="w-full bg-dark-bg border border-dark-border rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-orange"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase text-gray-500">Tanggal Selesai</label>
                      <input
                        type="date"
                        className="w-full bg-dark-bg border border-dark-border rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-orange"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {(exportMode === "today" || exportMode === "all") && (
                  <div className="sm:col-span-2 flex items-center text-[10px] text-gray-400 font-mono italic pl-2 pt-4">
                    {exportMode === "today" ? "* Menampilkan semua presensi kegiatan yang dicatat pada hari ini saja." : "* Menampilkan seluruh riwayat presensi yang tersimpan di basis data."}
                  </div>
                )}
              </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto pr-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#151519] text-gray-400 uppercase font-mono text-[10px]">
                  <tr>
                    {(!isSingleDay) && <th className="p-2">Tanggal</th>}
                    <th className="p-2">Nama</th>
                    <th className="p-2">NPM</th>
                    <th className="p-2">Agenda</th>
                    <th className="p-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border">
                  {filteredAtts.map((at) => (
                    <tr key={at.id}>
                      {(!isSingleDay) && <td className="p-2 text-gray-400 font-mono">{getAttendanceDate(at)}</td>}
                      <td className="p-2 text-white font-medium">{at.participant_name}</td>
                      <td className="p-2 text-gray-400 font-mono">{at.npm}</td>
                      <td className="p-2 text-gray-400 max-w-[120px] truncate">{at.event_name}</td>
                      <td className="p-2 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          at.status === "Hadir" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          at.status === "Izin" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          at.status === "Sakit" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                          "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {at.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredAtts.length === 0 && (
                    <tr>
                      <td colSpan={isSingleDay ? 4 : 5} className="p-6 text-center text-gray-500">Belum ada presensi tercatat pada rentang filter ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: KEARSIPAN SURAT */}
      {activeSubTab === "surat" && (
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 relative">
          <div className="flex items-center justify-between mb-4 border-b border-dark-border pb-3">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <FolderOpen className="text-brand-orange" size={20} />
              Arsip Dokumen & Persuratan Himpunan
            </h3>
            <button
              onClick={() => setIsAddLetterOpen(true)}
              className="bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold px-4 py-1.5 rounded transition"
            >
              + Daftarkan Berkas Keluar/Masuk
            </button>
          </div>

          {isAddLetterOpen && (
            <div className="mb-6 p-4 border border-dark-border bg-dark-bg/50 rounded-xl space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-white text-sm">Form Pendaftaran Surat Baru</h4>
                <button onClick={() => setIsAddLetterOpen(false)} className="text-gray-500 hover:text-white text-xs">Batal</button>
              </div>
              <form onSubmit={handleLetSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400">Nomor Surat</label>
                    <input type="text" required value={letNum} onChange={e => setLetNum(e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400">Perihal</label>
                    <input type="text" required value={letSubject} onChange={e => setLetSubject(e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400">Jenis Surat</label>
                    <select value={letType} onChange={e => setLetType(e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white">
                      <option value="Masuk">Masuk</option>
                      <option value="Keluar">Keluar</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400">Tanggal Terbit</label>
                    <input type="date" required value={letDate} onChange={e => setLetDate(e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400">Penanggung Jawab</label>
                    <input type="text" required value={letHandler} onChange={e => setLetHandler(e.target.value)} className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400">Pilih Berkas (.pdf, .doc, .jpg, dll)</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={e => {
                        if (e.target.files && e.target.files.length > 0) {
                          setLetFile(e.target.files[0]);
                        }
                      }}
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-gray-300 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:bg-dark-surface file:text-white hover:file:bg-brand-orange"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold py-2 rounded transition">Simpan & Unggah Arsip</button>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141418] text-gray-400 font-mono text-[10px] uppercase">
                <tr>
                  <th className="p-3">Nomor Surat Resmi</th>
                  <th className="p-3">Perihal / Hal</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Tanggal Terbit</th>
                  <th className="p-3">Berkas</th>
                  <th className="p-3 text-right">Penanggung Jawab</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {letters.map((letObj, i) => (
                  <tr key={i}>
                    <td className="p-3 font-mono text-gray-300">{letObj.num}</td>
                    <td className="p-3 text-white font-medium">{letObj.subject}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${letObj.type === "Keluar" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
                        {letObj.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400 font-mono">{letObj.date}</td>
                    <td className="p-3 text-brand-orange text-[10px] truncate max-w-[100px]">{letObj.file_name || "-"}</td>
                    <td className="p-3 text-right text-gray-400">{letObj.handler}</td>
                  </tr>
                ))}
                {letters.length === 0 && (
                  <tr><td colSpan={6} className="p-5 text-center text-gray-500">Belum ada arsip persuratan tercatat.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: TIMELINE AGENDA */}
      {activeSubTab === "timeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAIN AGENDA ROW */}
          <div className="lg:col-span-2 bg-dark-surface border border-dark-border rounded-xl p-6">
            <h3 className="font-display font-bold text-lg text-white mb-4 border-b border-dark-border pb-3">
              Timeline Agenda Terjadwal
            </h3>

            <div className="space-y-4">
              {mockAgendas.map((ag, i) => (
                <div key={i} className="bg-dark-bg p-4 border border-dark-border rounded-lg flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-white text-sm">{ag.title}</h4>
                    <div className="text-xs text-gray-400">Tempat: {ag.loc}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-1">📅 {ag.date} · {ag.time}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ag.status === "Sudah Dekat" ? "bg-red-500/10 text-red-400 border border-red-500/10" :
                      ag.status === "Persiapan" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/10" :
                        "bg-gray-500/10 text-gray-400 border border-gray-500/10"
                    }`}>
                    {ag.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* BELL REMINDERS */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-5 h-fit space-y-4">
            <h3 className="font-display font-semibold text-base text-white flex items-center gap-1 border-b border-dark-border pb-3">
              <BellRing className="text-brand-orange" size={18} />
              Reminder & Sirene Log Sekretariat
            </h3>
            <div className="space-y-3 font-mono text-[11px] text-gray-400 leading-relaxed">
              <div className="bg-dark-bg p-3 border border-dark-border rounded-lg">
                <span className="text-red-400 font-bold">⚠️ SEGERA GABUNG:</span>
                <p className="mt-1">Rapat pleno pertengahan kepengurusan akan dimulai dalam <b>30 menit</b> lagi. Harap segenap ketua divisi hadir.</p>
              </div>
              <div className="bg-dark-bg p-3 border border-dark-border rounded-lg">
                <span className="text-blue-400 font-bold">📅 SEGERA SELESAIKAN:</span>
                <p className="mt-1">Penyusunan laporan pertanggungjawaban (LPJ) keuangan proker 'Workshop Web Dev' harus diupload akhir pekan ini.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
