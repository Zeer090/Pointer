import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  X,
  Copy,
  Check,
  Download,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Attendance, User } from "../types";

interface AttendanceQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  programsList: Array<{ id: string; title: string }>;
  recentAttendances: Attendance[];
  onAttendanceSuccess: (attendance: Attendance) => void;
  initialEventName?: string;
}

export default function AttendanceQrModal({
  isOpen,
  onClose,
  currentUser,
  programsList,
  recentAttendances,
  onAttendanceSuccess,
  initialEventName = "",
}: AttendanceQrModalProps) {
  // Mode: "display" (Layar Proyektor QR Code untuk Admin) atau "checkin" (Formulir Presensi Mahasiswa)
  const isPrivileged = currentUser?.role === "admin" || currentUser?.role === "divisi";
  const [activeTab, setActiveTab] = useState<"display" | "checkin">(
    isPrivileged ? "display" : "checkin"
  );

  // States untuk Display QR Code
  const defaultEvent =
    initialEventName ||
    programsList[0]?.title ||
    "Rapat Pleno Koordinasi HIMA POINTER 2026";
  const [selectedEvent, setSelectedEvent] = useState(defaultEvent);
  const [customEvent, setCustomEvent] = useState("");
  const activeEventTitle = customEvent.trim() || selectedEvent;
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // States untuk Checkin Mandiri
  const [checkinEvent, setCheckinEvent] = useState(defaultEvent);
  const [studentName, setStudentName] = useState(currentUser?.name || "");
  const [studentNpm, setStudentNpm] = useState(currentUser?.npm || "");
  const [status, setStatus] = useState<"Hadir" | "Izin" | "Sakit">("Hadir");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [verifiedTicket, setVerifiedTicket] = useState<Attendance | null>(null);

  // Generate Session Code unik berdasarkan judul event
  const sessionCode = `PTR-${Math.abs(
    activeEventTitle.split("").reduce((acc, c) => (acc << 5) - acc + c.charCodeAt(0), 0)
  )
    .toString(36)
    .toUpperCase()
    .slice(0, 5)}`;

  // Update jam realtime WIB
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jakarta",
        }) + " WIB"
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update checkinEvent jika initialEventName berubah
  useEffect(() => {
    if (initialEventName) {
      setSelectedEvent(initialEventName);
      setCheckinEvent(initialEventName);
    }
  }, [initialEventName]);

  // Generate QR Code saat activeEventTitle berubah
  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const checkinUrl = `${origin}/#presensi?event=${encodeURIComponent(
      activeEventTitle
    )}&code=${encodeURIComponent(sessionCode)}`;

    QRCode.toDataURL(checkinUrl, {
      width: 380,
      margin: 2,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Gagal generate QR Code:", err));
  }, [activeEventTitle, sessionCode]);

  // Filter peserta yang sudah hadir di event ini hari ini
  const today = new Date().toISOString().split("T")[0];
  const attendeesThisEvent = recentAttendances.filter(
    (a) =>
      a.event_name.toLowerCase() === activeEventTitle.toLowerCase() &&
      (a.date === today || a.date?.startsWith(today))
  );

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const checkinUrl = `${origin}/#presensi?event=${encodeURIComponent(
      activeEventTitle
    )}&code=${encodeURIComponent(sessionCode)}`;
    navigator.clipboard.writeText(checkinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `QR_Presensi_${activeEventTitle.replace(/\s+/g, "_")}.png`;
    a.click();
  };

  const handleSubmitCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setSubmitError("Nama lengkap wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/attendances/self-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: checkinEvent || activeEventTitle,
          participant_name: studentName.trim(),
          npm: studentNpm.trim() || `2201${Math.floor(Math.random() * 900 + 100)}`,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.alreadyCheckedIn && data.attendance) {
          setVerifiedTicket(data.attendance);
          setSubmitError(data.message || "Anda sudah mengisi presensi hari ini.");
        } else {
          setSubmitError(data.error || "Gagal mencatat presensi.");
        }
        return;
      }

      setVerifiedTicket(data.attendance);
      onAttendanceSuccess(data.attendance);
    } catch {
      setSubmitError("Terjadi gangguan koneksi. Pastikan server aktif.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`bg-[#0d1117] border border-orange-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? "w-full h-full max-w-none rounded-none"
            : "w-full max-w-4xl max-h-[92vh]"
        }`}
      >
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border bg-dark-bg/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-orange/15 border border-brand-orange/30 text-brand-orange">
              <QrCode size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-display font-bold text-white">
                  Sistem Presensi Digital POINTER
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-green-500/20 text-green-400 border border-green-500/30 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  LIVE {currentTime}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Verifikasi kehadiran otomatis & terhubung langsung ke PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPrivileged && (
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-surface transition"
                title={isFullscreen ? "Kecilkan Layar" : "Tampilan Penuh Proyektor"}
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-surface transition"
              title="Tutup Modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex border-b border-dark-border bg-dark-bg/30 px-6 gap-2 pt-2">
          {isPrivileged && (
            <button
              onClick={() => setActiveTab("display")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 ${
                activeTab === "display"
                  ? "border-brand-orange text-brand-orange bg-brand-orange/10 font-bold"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <QrCode size={15} /> Layar Proyektor QR Code
            </button>
          )}
          <button
            onClick={() => setActiveTab("checkin")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 ${
              activeTab === "checkin"
                ? "border-brand-orange text-brand-orange bg-brand-orange/10 font-bold"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={15} /> Formulir Presensi Mandiri
          </button>
        </div>

        {/* BODY MODAL */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: LAYAR PROYEKTOR QR CODE */}
          {activeTab === "display" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* KOLOM KIRI: QR CODE & DISPLAY */}
              <div className="lg:col-span-7 flex flex-col items-center bg-gradient-to-b from-dark-surface/90 to-dark-bg border border-orange-500/20 rounded-2xl p-6 text-center shadow-inner">
                {/* PILIH AGENDA */}
                <div className="w-full mb-4 text-left">
                  <label className="text-[11px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">
                    Pilih Agenda / Kegiatan:
                  </label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => {
                      setSelectedEvent(e.target.value);
                      setCustomEvent("");
                    }}
                    className="w-full bg-[#151921] border border-dark-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                  >
                    {programsList.map((p) => (
                      <option key={p.id} value={p.title}>
                        {p.title}
                      </option>
                    ))}
                    <option value="__custom__">+ Ketik Nama Agenda Lain...</option>
                  </select>

                  {selectedEvent === "__custom__" && (
                    <input
                      type="text"
                      placeholder="Masukkan nama rapat/agenda..."
                      value={customEvent}
                      onChange={(e) => setCustomEvent(e.target.value)}
                      className="w-full mt-2 bg-[#151921] border border-brand-orange rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* KOTAK QR CODE DENGAN GLOWING NEON */}
                <div className="relative group p-4 rounded-2xl bg-white shadow-2xl border-4 border-orange-500/40 my-2">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code Presensi POINTER"
                      className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center text-gray-600">
                      Membuat QR Code...
                    </div>
                  )}

                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-orange text-white text-[11px] font-mono font-bold rounded-full shadow-lg border border-white/20 whitespace-nowrap">
                    KODE SESI: {sessionCode}
                  </div>
                </div>

                {/* PETUNJUK SCAN */}
                <p className="text-xs text-gray-300 mt-5 font-medium max-w-sm">
                  Arahkan kamera smartphone ke QR Code di atas atau buka tautan presensi di bawah.
                </p>

                {/* TOMBOL AKSI */}
                <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-dark-surface border border-dark-border hover:border-brand-orange text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    {copiedLink ? (
                      <>
                        <Check size={14} className="text-green-400" /> Disalin!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Salin Link Presensi
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadQr}
                    className="px-3.5 py-2 rounded-xl bg-dark-surface border border-dark-border hover:border-brand-orange text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Download size={14} /> Simpan Gambar QR
                  </button>

                  <button
                    onClick={() => {
                      setCheckinEvent(activeEventTitle);
                      setActiveTab("checkin");
                    }}
                    className="px-3.5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-orange-500/20"
                  >
                    <ExternalLink size={14} /> Buka Form Mandiri
                  </button>
                </div>
              </div>

              {/* KOLOM KANAN: STATISTIK & PESERTA HADIR LIVE */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-dark-surface border border-dark-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users size={14} className="text-brand-orange" /> Kehadiran Terverifikasi
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                      {attendeesThisEvent.length} Hadir
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {attendeesThisEvent.map((att, idx) => (
                      <div
                        key={att.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-dark-bg/60 border border-dark-border hover:border-orange-500/30 transition text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-brand-orange/20 text-brand-orange text-[10px] font-mono flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-white">{att.participant_name}</div>
                            <div className="text-[10px] font-mono text-gray-400">NPM: {att.npm}</div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-green-500/15 text-green-400 border border-green-500/25">
                          {att.status}
                        </span>
                      </div>
                    ))}

                    {attendeesThisEvent.length === 0 && (
                      <div className="py-8 text-center text-gray-500 text-xs">
                        <Clock size={24} className="mx-auto mb-2 text-gray-600" />
                        Belum ada peserta yang memindai QR Code untuk agenda ini hari ini.
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-orange-400">
                    <Sparkles size={14} /> Tip untuk Pengurus:
                  </div>
                  Tampilkan layar ini di proyektor rapat. Setiap mahasiswa yang memindai QR Code akan langsung terverifikasi secara instan di tabel sebelah kanan tanpa reload halaman!
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FORMULIR PRESENSI MANDIRI / HASIL TIKET */}
          {activeTab === "checkin" && (
            <div className="max-w-xl mx-auto">
              {verifiedTicket ? (
                /* E-TIKET BUKTI PRESENSI DIGITAL */
                <div className="bg-gradient-to-b from-[#16202c] to-[#0f1722] border-2 border-green-500/40 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden animate-fadeIn">
                  <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-green-500/10 rounded-full blur-2xl"></div>

                  <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-400 text-green-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
                    <CheckCircle2 size={36} />
                  </div>

                  <span className="px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/30 rounded-full">
                    Kehadiran Terverifikasi Resmi
                  </span>

                  <h3 className="text-xl font-display font-bold text-white mt-3 mb-1">
                    {verifiedTicket.participant_name}
                  </h3>
                  <p className="text-xs font-mono text-gray-400">
                    NPM: {verifiedTicket.npm} • Status: <strong className="text-green-400">{verifiedTicket.status}</strong>
                  </p>

                  <div className="my-6 p-4 rounded-xl bg-dark-bg/80 border border-dark-border text-left space-y-2 text-xs">
                    <div className="flex justify-between border-b border-dark-border pb-1.5">
                      <span className="text-gray-400">Agenda / Kegiatan:</span>
                      <span className="font-bold text-white text-right">{verifiedTicket.event_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-dark-border pb-1.5">
                      <span className="text-gray-400">Tanggal Presensi:</span>
                      <span className="font-mono text-white">{verifiedTicket.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Verifikator Sistem:</span>
                      <span className="font-mono text-brand-orange">POINTER Cloud Engine</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 mb-6">
                    Presensi Anda telah tersimpan secara permanen di basis data himpunan Politeknik Negeri Lampung.
                  </p>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setVerifiedTicket(null)}
                      className="px-4 py-2 rounded-xl bg-dark-surface border border-dark-border hover:border-gray-500 text-white text-xs font-semibold transition"
                    >
                      Presensi Orang Lain
                    </button>
                    <button
                      onClick={onClose}
                      className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition shadow-lg shadow-green-600/20"
                    >
                      Selesai & Tutup
                    </button>
                  </div>
                </div>
              ) : (
                /* FORMULIR INPUT PRESENSI */
                <form
                  onSubmit={handleSubmitCheckin}
                  className="bg-dark-surface border border-dark-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl"
                >
                  <div className="text-center mb-5">
                    <h3 className="text-lg font-display font-bold text-white">
                      Formulir Presensi Mandiri
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Silakan konfirmasi kehadiran Anda untuk kegiatan yang sedang berlangsung
                    </p>
                  </div>

                  {submitError && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0 text-red-400" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* AGENDA KEGIATAN */}
                  <div>
                    <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block mb-1.5">
                      Agenda Kegiatan <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={checkinEvent}
                      onChange={(e) => setCheckinEvent(e.target.value)}
                      className="w-full bg-[#151921] border border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                    >
                      {programsList.map((p) => (
                        <option key={p.id} value={p.title}>
                          {p.title}
                        </option>
                      ))}
                      <option value="Rapat Koordinasi Mingguan HIMA">Rapat Koordinasi Mingguan HIMA</option>
                      <option value="Rapat Evaluasi Kinerja Divisi">Rapat Evaluasi Kinerja Divisi</option>
                      <option value="Workshop & Pelatihan Internal">Workshop & Pelatihan Internal</option>
                    </select>
                  </div>

                  {/* NAMA MAHASISWA */}
                  <div>
                    <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block mb-1.5">
                      Nama Lengkap <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Muhammad Budi Pratama"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full bg-[#151921] border border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange"
                      required
                    />
                  </div>

                  {/* NPM */}
                  <div>
                    <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block mb-1.5">
                      NPM (Nomor Pokok Mahasiswa)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 22753045"
                      value={studentNpm}
                      onChange={(e) => setStudentNpm(e.target.value)}
                      className="w-full bg-[#151921] border border-dark-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange font-mono"
                    />
                  </div>

                  {/* PILIHAN STATUS */}
                  <div>
                    <label className="text-xs font-mono text-gray-400 uppercase tracking-wider block mb-1.5">
                      Status Kehadiran <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {(["Hadir", "Izin", "Sakit"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setStatus(opt)}
                          className={`py-2 rounded-xl text-xs font-bold transition border ${
                            status === opt
                              ? opt === "Hadir"
                                ? "bg-green-600 text-white border-green-500 shadow-md shadow-green-600/20"
                                : opt === "Izin"
                                ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20"
                                : "bg-yellow-600 text-white border-yellow-500 shadow-md shadow-yellow-600/20"
                              : "bg-dark-bg border-dark-border text-gray-400 hover:text-white"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 py-3 rounded-xl bg-brand-orange hover:bg-brand-orange-hover disabled:bg-gray-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Memverifikasi...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} /> Kirim Presensi Sekarang
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
