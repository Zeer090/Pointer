/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  FullDatabase,
  User,
  Program,
  Aspiration,
  Talent,
  Product,
  Transaction,
  FinancialReport,
  Attendance,
  Notulensi,
  Announcement,
  ContentCalendar,
} from "./types";

// Extracted Sub-Components
import LandingPage from "./components/LandingPage";
import Sidebar from "./components/Sidebar";
import pointerLogo from "./assets/images/pointer_logo_clean_1780038118432.png";

// Divisional Module Panels
import PsdamModule from "./components/divisions/PsdamModule";
import MedinfoModule from "./components/divisions/MedinfoModule";
import MinbatModule from "./components/divisions/MinbatModule";
import SosmaModule from "./components/divisions/SosmaModule";
import KimasModule from "./components/divisions/KimasModule";
import KeuanganModule from "./components/divisions/KeuanganModule";
import AdministrasiModule from "./components/divisions/AdministrasiModule";

import {
  LogOut,
  Plus,
  ShieldCheck,
  Mail,
  Calendar,
  UserCheck,
  Clock,
  PlusCircle,
  CheckCircle,
  XCircle,
  FileText,
  BellRing,
  UserPlus,
  Trash2,
} from "lucide-react";

export default function App() {
  const [db, setDb] = useState<FullDatabase | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>("home");

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Form input states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [newUName, setNewUName] = useState("");
  const [profEmail, setProfEmail] = useState("");
  const [profNpm, setProfNpm] = useState("");
  const [profName, setProfName] = useState("");

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New program creation states
  const [newProgTitle, setNewProgTitle] = useState("");
  const [newProgDesc, setNewProgDesc] = useState("");
  const [newProgDate, setNewProgDate] = useState("");
  const [newProgDiv, setNewProgDiv] = useState("div-psdam");
  const [newProgStatus, setNewProgStatus] = useState<any>("planning");

  // Admin user creation state
  const [newUEmail, setNewUEmail] = useState("");
  const [newURole, setNewURole] = useState<"admin" | "divisi" | "mahasiswa">(
    "mahasiswa",
  );
  const [newUDiv, setNewUDiv] = useState("div-psdam");
  const [newUNpm, setNewUNpm] = useState("");

  const [activeDLogFilter, setActiveDLogFilter] = useState("semua"); // Filter for proker lists

  // Toast notifier
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 1. Initial full sync with the file database
  const refreshDatabase = async () => {
    try {
      const response = await fetch("/api/db");
      if (response.ok) {
        const data = await response.json();
        setDb(data);
      }
    } catch (err) {
      console.error("Failed to fetch node db:", err);
    }
  };

  useEffect(() => {
    refreshDatabase();
  }, []);

  // Update profile fields when modal opens
  const openProfileModal = () => {
    if (currentUser) {
      setProfName(currentUser.name);
      setProfEmail(currentUser.email);
      setProfNpm(currentUser.npm);
      setIsProfileModalOpen(true);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentUser.id,
          name: profName,
          email: profEmail,
          npm: profNpm,
        }),
      });
      if (res.ok) {
        const retData = await res.json();
        if (retData.success) {
          setCurrentUser(retData.user);
          triggerToast("Profil Anda berhasil diperbarui!");
          setIsProfileModalOpen(false);
          refreshDatabase();
        }
      }
    } catch (err) {
      triggerToast("Gagal memperbarui profil.");
    }
  };

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    setLoginError("");
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim() }),
      });
      const retData = await res.json();
      if (res.ok && retData.success) {
        const user = retData.user;
        setCurrentUser(user);
        setIsLoginModalOpen(false);
        setLoginEmail("");
        triggerToast(`Selamat datang, ${user.name}!`);
        refreshDatabase();

        // Routing berdasarkan role dari database
        if (user.role === "admin") {
          setCurrentPage("dashboard");
        } else if (user.role === "divisi" && user.division_id) {
          // Cari slug divisi berdasarkan division_id
          const res2 = await fetch("/api/db");
          const freshDb = await res2.json();
          const div = freshDb.divisions.find((d: any) => d.id === user.division_id);
          const slug = div ? div.id.replace("div-", "") : "dashboard";
          setCurrentPage(slug);
        } else {
          setCurrentPage("mahasiswa");
        }
      } else {
        setLoginError(retData.error || "Login gagal. Akun tidak ditemukan.");
      }
    } catch (err) {
      setLoginError("Koneksi bermasalah. Periksa server Anda.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage("home");
    triggerToast("Berhasil keluar sistem.");
  };


  // Propose Program Kerja
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgTitle || !newProgDesc) return;

    const chosenDiv =
      currentUser?.role === "admin"
        ? newProgDiv
        : currentUser?.division_id || "div-psdam";

    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newProgTitle,
          description: newProgDesc,
          event_date: newProgDate,
          division_id: chosenDiv,
          created_by: currentUser?.name || "Kader",
          status: newProgStatus,
        }),
      });

      if (res.ok) {
        const ret = await res.json();
        if (ret.success) {
          triggerToast("Proposal program kerja berhasil bersirkulasi!");
          setIsAddProgramOpen(false);
          setNewProgTitle("");
          setNewProgDesc("");
          setNewProgDate("");
          refreshDatabase();
        }
      }
    } catch (err) {
      triggerToast("Gagal membuat program.");
    }
  };

  // Modify/Approve/Reject actions
  const handleApproveProgram = async (id: string) => {
    try {
      const res = await fetch(`/api/programs/${id}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        triggerToast("Proposal program berhasil DISUMBA sumpah disetujui!");
        refreshDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectProgram = async (id: string) => {
    try {
      const res = await fetch(`/api/programs/${id}/reject`, { method: "POST" });
      if (res.ok) {
        triggerToast("Proposal program resmi ditolak (Rejected).");
        refreshDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    try {
      const res = await fetch(`/api/programs/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerToast("Program berhasil dieliminasi dari daftar.");
        refreshDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Suggest Aspiration
  const handleAddAspiration = async (
    name: string,
    category: string,
    message: string,
  ) => {
    try {
      const res = await fetch("/api/aspirations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_name: name, category, message }),
      });
      if (res.ok) {
        triggerToast("Aspirasi tersimpan dan bersirkulasi!");
        refreshDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAspirationStatus = async (
    id: string,
    nextStatus: "pending" | "processing" | "completed",
  ) => {
    try {
      const res = await fetch(`/api/aspirations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        triggerToast(`Aspirasi diperbarui ke status: ${nextStatus}`);
        refreshDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAspiration = async (id: string) => {
    try {
      const res = await fetch(`/api/aspirations/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        triggerToast("Aspirasi berhasil dihapus!");
        refreshDatabase();
      } else {
        triggerToast("Gagal menghapus aspirasi.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Koneksi gagal.");
    }
  };


  // Add Talenta profiles
  const handleAddTalent = async (
    studentName: string,
    talent: string,
    achievement: string,
    certificate: string,
  ) => {
    try {
      const res = await fetch("/api/talents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: studentName,
          talent,
          achievement,
          certificate,
        }),
      });
      if (res.ok) {
        triggerToast("Profil minat bakat Anda sukses terunggah!");
        refreshDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // KIMAS Checkout
  const handleMarketCheckout = async (
    items: { id: string; quantity: number }[],
    identity?: { nama: string; kelas: string; noHp: string; tempatTinggal: string },
  ) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser?.id,
          student_name: identity?.nama || currentUser?.name || "Mahasiswa",
          kelas: identity?.kelas,
          no_hp: identity?.noHp,
          tempat_tinggal: identity?.tempatTinggal,
          items,
        }),
      });
      if (res.ok) {
        triggerToast("✅ Transaksi checkout berhasil dicatat!");
        refreshDatabase();
      } else {
        const errObj = await res.json();
        triggerToast(errObj.error || "Gagal melakukan transaksi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add KIMAS catalog products
  const handleAddProduct = async (
    product_name: string,
    price: number,
    stock: number,
    image: string,
  ) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_name, price, stock, image }),
      });
      if (res.ok) {
        triggerToast(`Produk '${product_name}' diunggah sukses!`);
        refreshDatabase();
      } else {
        triggerToast("Gagal mengunggah produk.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Koneksi gagal.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerToast("Produk berhasil dihapus!");
        refreshDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProduct = async (
    id: string,
    product_name: string,
    price: number,
    stock: number,
  ) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_name, price, stock }),
      });
      if (res.ok) {
        triggerToast("Produk berhasil diperbarui!");
        refreshDatabase();
      } else {
        triggerToast("Gagal memperbarui produk.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Koneksi gagal.");
    }
  };


  // Submit Financial accounting records
  const handleAddFinancial = async (
    title: string,
    income: number,
    expense: number,
    file: string,
    type: "income" | "expense",
  ) => {
    try {
      const res = await fetch("/api/financials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, income, expense, file, type }),
      });
      if (res.ok) {
        triggerToast("Laporan kas keuangan berhasil ditambahkan.");
        refreshDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Notulensi Rapat
  const handleAddNotulensi = async (
    title: string,
    summary: string,
    author: string,
  ) => {
    try {
      const res = await fetch("/api/notulensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary, author }),
      });
      if (res.ok) {
        triggerToast("Keputusan notulen berhasil disimpan ke arsip.");
        refreshDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Arsip Surat (Administrasi)
  const handleAddLetter = async (
    num: string,
    subject: string,
    type: string,
    date: string,
    handler: string,
    file_name: string | null
  ) => {
    try {
      const res = await fetch("/api/letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num, subject, type, date, handler, file_name }),
      });
      if (res.ok) {
        triggerToast(`Surat ${type} berhasil diarsipkan.`);
        refreshDatabase();
      } else {
        triggerToast("Gagal menyimpan surat.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Koneksi gagal.");
    }
  };


  // Record manual Attendance lists
  const handleAddAttendance = async (
    event_name: string,
    participant_name: string,
    status: "Hadir" | "Izin" | "Sakit" | "Alpa",
    npm: string,
  ) => {
    try {
      const res = await fetch("/api/attendances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_name, participant_name, status, npm }),
      });
      if (res.ok) {
        triggerToast(`Absen ${status} tercantum untuk ${participant_name}!`);
        refreshDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Record Medinfo Content Calendar posting
  const handleAddContentCalendar = async (
    post_title: string,
    platform: string,
    schedule_date: string,
    status: "draft" | "scheduled",
  ) => {
    try {
      const res = await fetch("/api/content-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_title, platform, schedule_date, status }),
      });
      if (res.ok) {
        triggerToast(`Jadwal publikasi '${post_title}' berhasil dirangkum.`);
        refreshDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Record Medinfo Announcements
  const handleAddAnnouncement = async (
    title: string,
    content: string,
    category: string,
  ) => {
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });
      if (res.ok) {
        triggerToast(`Pengumuman '${title}' sukses dipublikasikan!`);
        refreshDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Medinfo Gallery Album
  const handleAddGalleryAlbum = async (
    title: string,
    emoji: string,
    link: string
  ) => {
    try {
      const res = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, emoji, link }),
      });
      if (res.ok) {
        triggerToast(`Album dokumentasi '${title}' berhasil dibuat!`);
        refreshDatabase();
      } else {
        triggerToast("Gagal membuat album dokumentasi.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Koneksi gagal.");
    }
  };

  // Admin create users
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUName || !newUEmail) return;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUName,
          email: newUEmail,
          role: newURole,
          division_id: newURole === "divisi" ? newUDiv : null,
          npm: newUNpm,
        }),
      });
      if (res.ok) {
        triggerToast(`User '${newUName}' berhasil didaftarkan!`);
        setNewUName("");
        setNewUEmail("");
        setNewUNpm("");
        setIsAddUserOpen(false);
        refreshDatabase();
      } else {
        triggerToast("Gagal menyambung ke server.");
      }
    } catch (err) {
      triggerToast("Koneksi gagal.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        triggerToast("Informasi user berhasil dihapus dari himpunan.");
        refreshDatabase();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Division Card shortcut explorer on landing page
  const handleExploreDivision = (slug: string) => {
    setIsLoginModalOpen(true);
  };


  // Loading page fallback
  if (!db) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center font-sans">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-sm font-mono text-gray-500 uppercase tracking-widest uppercase">
            Memuat POINTER SYSTEM...
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // OUTER BOUNDARY - IF NO USER: SHOW THE LANDING SITE
  // ----------------------------------------------------
  if (currentPage === "home" || !currentUser) {
    return (
      <>
        <LandingPage
          onOpenLogin={() => setIsLoginModalOpen(true)}
          programs={db.programs}
          divisions={db.divisions}
          onExploreDivision={handleExploreDivision}
        />

        {/* LOGIN MODAL */}
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-dark-surface border border-[#222226] max-w-sm w-full rounded-2xl p-7 relative overflow-hidden">
              <button
                onClick={() => { setIsLoginModalOpen(false); setLoginError(""); }}
                className="absolute top-4 right-4 text-gray-500 hover:text-white transition text-xs font-mono"
              >
                ✕ TUTUP
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-7">
                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-1.5 shadow-inner select-none transition-transform hover:scale-105 duration-300">
                  <img
                    src={pointerLogo}
                    alt="POINTER Logo"
                    className="w-full h-full object-contain drop-shadow-[0_2px_10px_rgba(249,115,22,0.3)]"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-display font-extrabold text-xl text-white">
                    Masuk POINTER SYSTEM
                  </h3>
                  <p className="text-gray-500 text-xs">
                    Masukkan email akun Anda untuk melanjutkan
                  </p>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    id="login-email"
                    placeholder="cth. nama@pointer.ac.id"
                    autoFocus
                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-orange transition"
                    value={loginEmail}
                    onChange={(e) => { setLoginEmail(e.target.value); setLoginError(""); }}
                    required
                  />
                </div>

                {/* Inline error message */}
                {loginError && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <span className="text-red-400 text-xs mt-0.5">⚠</span>
                    <p className="text-red-400 text-xs leading-relaxed">{loginError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  id="login-submit"
                  disabled={isLoggingIn}
                  className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-semibold py-2.5 rounded-lg transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoggingIn ? "Memproses..." : "Masuk ke Dashboard"}
                </button>
              </form>

              <p className="mt-5 text-center text-[10px] text-gray-600">
                Akun dikelola oleh Administrator sistem.<br/>Hubungi Admin jika belum terdaftar.
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // ----------------------------------------------------
  // INNER BOUNDARY - FULLY LOGGED ACCOUNT DASHBOARD FRAME
  // ----------------------------------------------------
  return (
    <div className="flex h-screen overflow-hidden bg-dark-bg font-sans text-gray-100">
      {/* SIDEBAR NAVIGATION PANEL */}
      <Sidebar
        currentUser={currentUser}
        divisions={db.divisions}
        currentPage={currentPage}
        onNavigate={(pageId) => setCurrentPage(pageId)}
        onLogout={handleLogout}
      />

      {/* CORE PORT CONTENT PANEL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* HEADER TOP STRIP */}
        <header className="h-16 border-b border-dark-border flex items-center justify-between px-6 md:px-8 bg-dark-surface sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-black text-white text-sm md:text-lg uppercase tracking-tight">
              {currentPage === "dashboard"
                ? "Dashboard Analitis"
                : currentPage === "approval"
                  ? "Persetujuan Proposal Proker"
                  : currentPage === "programs"
                    ? "Program Kerja Terjadwal"
                    : currentPage === "users"
                      ? "Database User Himpunan"
                      : `Divisi ${currentPage.toUpperCase()}`}
            </h2>
            <span className="px-2 py-0.5 rounded text-[9px] bg-brand-orange/10 text-brand-orange border border-brand-orange/20 font-semibold uppercase">
              Role: {currentUser.role}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                triggerToast(
                  "🔔 3 Pemberitahuan: Rapat koordinasi dimulai jam 18:30 WIB.",
                )
              }
              className="relative p-1.5 hover:bg-[#1a1a1f] rounded-lg text-gray-400 hover:text-white transition"
            >
              <BellRing size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-orange animate-ping"></span>
            </button>

            {/* Profile Avatar Trigger button */}
            <button
              onClick={openProfileModal}
              className="flex items-center gap-2 hover:bg-[#1a1a1f] p-1 rounded-lg transition text-left"
            >
              <div className="w-8 h-8 rounded-full bg-brand-orange text-white font-display font-black text-xs flex items-center justify-center">
                {currentUser.name[0]?.toUpperCase() || "U"}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-white leading-none">
                  {currentUser.name.split(" ")[0]}
                </div>
                <span className="text-[9px] text-gray-500 font-mono">
                  NPM: {currentUser.npm}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* INNER SCROLL BODY OF DASHBOARDS */}
        <main className="p-6 md:p-8 flex-1">
          {/* GENERAL ANALYTICS DASHBOARD */}
          {currentPage === "dashboard" && (
            <div className="space-y-6">
              {/* ADMIN VIEW */}
              {currentUser.role === "admin" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
                      <div className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-1">
                        Rencana Kerja (Proker)
                      </div>
                      <div className="text-3xl font-display font-bold text-white">
                        {db.programs.length}
                      </div>
                      <div className="text-xs text-brand-orange mt-2">
                        Seluruh kepengurusan
                      </div>
                    </div>
                    <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
                      <div className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-1">
                        Pending Approval
                      </div>
                      <div className="text-3xl font-display font-bold text-brand-orange">
                        {
                          db.programs.filter(
                            (p) => p.approval_status === "pending",
                          ).length
                        }
                      </div>
                      <div className="text-xs text-brand-orange mt-2 flex items-center gap-1">
                        <span>⏳ Butuh tanda tangan KAHIM</span>
                      </div>
                    </div>
                    <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
                      <div className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-1 font-bold text-white">
                        Kas Himpunan (SALDO)
                      </div>
                      <div className="text-2xl font-display font-bold text-green-400">
                        Rp{" "}
                        {(
                          db.financial_reports.reduce(
                            (acc, f) => acc + f.income,
                            0,
                          ) -
                          db.financial_reports.reduce(
                            (acc, f) => acc + f.expense,
                            0,
                          )
                        ).toLocaleString("id")}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Transparan digital ledger
                      </div>
                    </div>
                    <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
                      <div className="text-gray-400 text-xs font-mono uppercase tracking-wider mb-1">
                        Anggota Resmi
                      </div>
                      <div className="text-3xl font-display font-bold text-white">
                        {db.users.length}
                      </div>
                      <div className="text-xs text-blue-400 mt-2">
                        Termasuk pengurus & umum
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* DIVISI LISTS WITH PROGRESS GAUGES */}
                    <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl space-y-4">
                      <h3 className="font-display font-bold text-base text-white">
                        Kinerja & Keaktifan 7 Divisi
                      </h3>
                      <div className="space-y-4">
                        {[
                          { name: "PSDAM (Kaderisasi)", val: 92 },
                          { name: "MEDINFO (Komunikasi)", val: 88 },
                          { name: "MINAT BAKAT (Prestasi)", val: 95 },
                          { name: "SOSMA (Sosial Masyarakat)", val: 84 },
                          { name: "KIMAS (Kewirausahaan)", val: 90 },
                          { name: "KEUANGAN (Anggaran)", val: 80 },
                          { name: "ADMINISTRASI (Sekretariat)", val: 85 },
                        ].map((divStat, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-white font-medium">
                                {divStat.name}
                              </span>
                              <span className="text-brand-orange font-bold font-mono">
                                {divStat.val}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-dark-bg border border-dark-border rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-orange rounded-full"
                                style={{ width: `${divStat.val}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ACTIVITY LOGS (Persisted server events) */}
                    <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl flex flex-col justify-between">
                      <div>
                        <h3 className="font-display font-bold text-base text-white mb-4">
                          Aktivitas & Log Sistem Himpunan
                        </h3>
                        <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-2">
                          {db.activity_logs?.map((log) => {
                            const colors: Record<string, string> = {
                              green: "bg-green-500",
                              orange: "bg-brand-orange",
                              blue: "bg-blue-400",
                              red: "bg-red-500",
                              purple: "bg-purple-500",
                              yellow: "bg-yellow-500",
                            };

                            return (
                              <div key={log.id} className="flex gap-3 text-xs">
                                <div
                                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${colors[log.color] || "bg-gray-400"}`}
                                ></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-300 leading-normal">
                                    {log.detail}
                                  </p>
                                  <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">
                                    {log.time}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* DIVISION CHIEF VIEW */}
              {currentUser.role === "divisi" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-brand-orange/5 to-red-600/5 border border-dark-border rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute right-4 top-4 text-6xl text-brand-orange/5">
                      🏢
                    </div>
                    <div className="max-w-xl space-y-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-brand-orange">
                        Pengurus Divisi Aktif
                      </span>
                      <h3 className="font-display font-bold text-2xl text-white">
                        Halo, {currentUser.name}!
                      </h3>
                      <p className="text-gray-400 text-xs md:text-sm">
                        Anda memegang penugasan resmi atas divisi{" "}
                        <b>
                          {db.divisions.find(
                            (d) => d.id === currentUser.division_id,
                          )?.name || "HIMA"}
                        </b>
                        . Kelola program kerja divisi Anda dan manfaatkan modul
                        fungsional di menu navigasi samping.
                      </p>
                    </div>
                  </div>

                  <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4 border-b border-dark-border pb-3">
                      <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                        Status Proposal Proker Divisi Anda
                      </h4>
                      <button
                        onClick={() => setIsAddProgramOpen(true)}
                        className="bg-brand-orange hover:bg-brand-orange-hover text-white text-xs px-3 py-1.5 rounded transition font-semibold"
                      >
                        + Ajukan Proker Baru
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#121215] text-gray-400 font-mono text-[10px] uppercase">
                          <tr>
                            <th className="p-3">Nama Program Kerja</th>
                            <th className="p-3">Rencana Pelaksanaan</th>
                            <th className="p-3">Progress</th>
                            <th className="p-3 text-right">Approval Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                          {db.programs
                            .filter(
                              (p) => p.division_id === currentUser.division_id,
                            )
                            .map((p) => (
                              <tr key={p.id}>
                                <td className="p-3 text-white font-semibold">
                                  {p.title}
                                </td>
                                <td className="p-3 text-gray-400 font-mono">
                                  {p.event_date}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#141419] text-gray-400 border border-dark-border">
                                    {p.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <span
                                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${p.approval_status === "approved"
                                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                        : p.approval_status === "rejected"
                                          ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                          : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                      }`}
                                  >
                                    {p.approval_status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          {db.programs.filter(
                            (p) => p.division_id === currentUser.division_id,
                          ).length === 0 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="p-6 text-center text-gray-500"
                                >
                                  Anda belum mengajukan program kerja apa pun.
                                </td>
                              </tr>
                            )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* MAHASISWA GENERAL BERANDA */}
              {currentUser.role === "mahasiswa" && (
                <div className="space-y-6 animate-none">
                  <div className="p-8 bg-[#15151a] border border-dark-border rounded-3xl relative overflow-hidden space-y-4">
                    <div className="absolute right-4 top-4 text-7xl text-white/5 font-display font-extrabold select-none">
                      HIMA
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-brand-orange">
                        Sertifikasi & Kebutuhan Akademik
                      </span>
                      <h3 className="font-display font-extrabold text-2xl md:text-3xl text-white leading-none">
                        Mahasiswa Umum HIMA POINTER
                      </h3>
                      <p className="max-w-xl text-gray-400 text-xs md:text-sm">
                        Selamat datang di sistem manajemen kepengurusan. Kami
                        membuka pintu selebar-lebarnya untuk usulan, keaktifan,
                        dan belanja merchandise.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* FEED PENGUMUMAN RECENT (Medinfo broadcast) */}
                    <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl space-y-4">
                      <h4 className="font-display font-bold text-sm text-white flex items-center gap-2">
                        <BellRing size={16} className="text-brand-orange" />{" "}
                        Papan Pengumuman Resmi HIMA
                      </h4>
                      <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
                        {db.announcements.map((ann) => (
                          <div
                            key={ann.id}
                            className="bg-dark-bg p-3.5 border border-dark-border rounded-xl space-y-2"
                          >
                            <div className="flex justify-between">
                              <span className="text-[10px] font-mono text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded border border-brand-orange/20">
                                {ann.category}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {ann.date}
                              </span>
                            </div>
                            <h5 className="font-bold text-white text-xs leading-normal">
                              {ann.title}
                            </h5>
                            <p className="text-gray-400 text-[11px] leading-relaxed">
                              {ann.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SHORTCUT CARD FOR QUICK ACTIONS */}
                    <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl space-y-4">
                      <h4 className="font-display font-medium text-white">
                        Tindakan Cepat Anggota
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5">
                        <button
                          onClick={() => setCurrentPage("aspirasi")}
                          className="w-full text-left bg-dark-bg border border-dark-border hover:border-brand-orange/40 rounded-xl p-3.5 flex justify-between items-center transition cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">
                              💬 Advokasi & Aspirasi
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">
                              Kirim keluhan fasilitas/kelas secara rahasia
                            </div>
                          </div>
                          <span className="text-xs text-brand-orange">
                            Mulai &rarr;
                          </span>
                        </button>

                        <button
                          onClick={() => setCurrentPage("lomba")}
                          className="w-full text-left bg-dark-bg border border-dark-border hover:border-brand-orange/40 rounded-xl p-3.5 flex justify-between items-center transition cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">
                              🏆 Delegasi Lomba & Prestasi
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">
                              Daftar lomba eksternal / unggah sertifikat
                            </div>
                          </div>
                          <span className="text-xs text-brand-orange">
                            Mulai &rarr;
                          </span>
                        </button>

                        <button
                          onClick={() => setCurrentPage("shop")}
                          className="w-full text-left bg-dark-bg border border-dark-border hover:border-brand-orange/40 rounded-xl p-3.5 flex justify-between items-center transition cursor-pointer"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">
                              🛍️ Toko Merchandise KIMAS
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">
                              Belanja kaos, bag, tumblr organisasi
                            </div>
                          </div>
                          <span className="text-xs text-brand-orange">
                            Mulai &rarr;
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* APPROVAL PROKER FLOW (Admin only) */}
          {currentPage === "approval" && (
            <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl space-y-6">
              <div className="border-b border-dark-border pb-4">
                <h3 className="font-display font-bold text-lg text-white">
                  Proposal Menunggu Tanda Tangan Persetujuan
                </h3>
                <p className="text-gray-400 text-xs">
                  Sejarah evaluasi proker dan rincian alokasi anggaran.
                </p>
              </div>

              <div className="space-y-4">
                {db.programs
                  .filter((p) => p.approval_status === "pending")
                  .map((p) => {
                    const divName =
                      db.divisions.find((d) => d.id === p.division_id)?.name ||
                      p.division_id;
                    return (
                      <div
                        key={p.id}
                        className="bg-dark-bg border border-[#222226] p-5 rounded-2xl space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="font-bold text-white text-base leading-normal">
                              {p.title}
                            </h4>
                            <div className="text-xs font-mono text-gray-500">
                              Diusulkan oleh divisi:{" "}
                              <span className="text-brand-orange uppercase">
                                {divName}
                              </span>{" "}
                              · Tanggal: {p.event_date}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1 rounded font-bold uppercase animate-pulse">
                            {p.approval_status}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
                          {p.description}
                        </p>

                        <div className="pt-4 border-t border-dark-border/40 flex flex-wrap gap-2.5">
                          <button
                            onClick={() => handleApproveProgram(p.id)}
                            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition flex items-center gap-1"
                          >
                            <CheckCircle size={12} /> Setujui Proposal
                          </button>
                          <button
                            onClick={() => handleRejectProgram(p.id)}
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition flex items-center gap-1"
                          >
                            <XCircle size={12} /> Tolak Proposal
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {db.programs.filter((p) => p.approval_status === "pending")
                  .length === 0 && (
                    <div className="text-center py-16 text-gray-500 text-xs">
                      🎉 Bersih! Semua proposal program kerja sudah tuntas
                      ditinjau.
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* SHARED PROGRAMS REGISTER */}
          {currentPage === "programs" && (
            <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-4">
                <div>
                  <h3 className="font-display font-medium text-white">
                    Arsip Program Kerja Himpunan
                  </h3>
                  <p className="text-xs text-gray-400">
                    Total proker terekam sirkulasi.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddProgramOpen(true)}
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  + Ajukan Program Kerja baru
                </button>
              </div>

              {/* FILTERS ROSTER */}
              <div className="flex gap-2 pb-2 overflow-x-auto">
                {["semua", "planning", "ongoing", "completed"].map((stat) => (
                  <button
                    key={stat}
                    onClick={() => setActiveDLogFilter(stat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition ${activeDLogFilter === stat
                        ? "bg-brand-orange text-white"
                        : "bg-dark-bg border border-dark-border text-gray-400 hover:text-white"
                      }`}
                  >
                    {stat}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121215] text-gray-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="p-3">Nama Program Kerja</th>
                      <th className="p-3">Divisi Pelaksana</th>
                      <th className="p-3">Pelaksanaan</th>
                      <th className="p-3">Pengusul</th>
                      <th className="p-3">Anggaran (RAB)</th>
                      <th className="p-3">Progress</th>
                      <th className="p-3 text-center">Tinjauan Keuangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {db.programs
                      .filter(
                        (p) =>
                          activeDLogFilter === "semua" ||
                          p.status === activeDLogFilter,
                      )
                      .map((p) => {
                        const divName =
                          db.divisions.find((d) => d.id === p.division_id)
                            ?.name || p.division_id;
                        return (
                          <tr key={p.id}>
                            <td className="p-3 text-white font-semibold">
                              {p.title}
                            </td>
                            <td className="p-3 uppercase text-brand-orange font-mono font-medium">
                              {divName}
                            </td>
                            <td className="p-3 text-gray-400 font-mono">
                              {p.event_date}
                            </td>
                            <td className="p-3 text-gray-400">
                              {p.created_by}
                            </td>
                            <td className="p-3 font-mono font-bold text-gray-300">
                              Rp{" "}
                              {p.title.includes("Web")
                                ? "4.500.000"
                                : p.title.includes("Sosial")
                                  ? "2.800.000"
                                  : "1.200.000"}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.status === "completed"
                                    ? "bg-green-500/10 text-green-400"
                                    : p.status === "ongoing"
                                      ? "bg-blue-400/10 text-blue-400"
                                      : "bg-gray-500/10 text-gray-400"
                                  }`}
                              >
                                {p.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 text-[9px] uppercase font-bold rounded-full ${p.approval_status === "approved"
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : p.approval_status === "rejected"
                                      ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                      : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                                  }`}
                              >
                                {p.approval_status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MANAGE USERS PANEL (Admin only) */}
          {currentPage === "users" && (
            <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center border-b border-dark-border pb-4">
                <div>
                  <h3 className="font-display font-medium text-white">
                    Database Pengurus & Kader Himpunan
                  </h3>
                  <p className="text-xs text-gray-400">
                    Atur hak akses divisi dan kearsipan NPM.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                >
                  👑 Tambah Anggota / Pengurus
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121215] text-gray-400 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="p-3">NPM</th>
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3">Email Alamat</th>
                      <th className="p-3">Akses Role</th>
                      <th className="p-3">Divisi Kerja</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {db.users.map((u) => {
                      const dObj = db.divisions.find(
                        (d) => d.id === u.division_id,
                      );
                      return (
                        <tr key={u.id}>
                          <td className="p-3 font-mono text-gray-400">
                            {u.npm}
                          </td>
                          <td className="p-3 text-white font-semibold">
                            {u.name}
                          </td>
                          <td className="p-3 text-gray-400 font-mono">
                            {u.email}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-0.5 text-[10px] uppercase font-bold rounded-full ${u.role === "admin"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/10"
                                  : u.role === "divisi"
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                                    : "bg-gray-500/10 text-gray-400"
                                }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 text-brand-orange uppercase font-mono font-semibold">
                            {dObj ? dObj.name : "– (MAHASISWA UMUM)"}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.id === currentUser.id}
                              className="text-gray-500 hover:text-red-500 transition disabled:opacity-30"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DYNAMIC SUBSECTION PANEL RENDERS (DIVISION MODULE DIAGRAMS) */}
          {currentPage === "psdam" && (
            <PsdamModule
              aspirations={db.aspirations}
              users={db.users}
              onUpdateAspiration={handleUpdateAspirationStatus}
              onSubmitAspiration={handleAddAspiration}
              onDeleteAspiration={handleDeleteAspiration}
            />
          )}

          {currentPage === "medinfo" && (
            <MedinfoModule
              announcements={db.announcements}
              calendar={db.content_calendar}
              gallery={db.gallery_albums || []}
              onSubmitAnnouncement={handleAddAnnouncement}
              onSubmitContentCalendar={handleAddContentCalendar}
              onSubmitGalleryAlbum={handleAddGalleryAlbum}
            />
          )}

          {currentPage === "minbat" && (
            <MinbatModule
              talents={db.talents}
              onSubmitTalent={handleAddTalent}
            />
          )}

          {currentPage === "sosma" && <SosmaModule />}

          {currentPage === "kimas" && (
            <KimasModule
              products={db.products}
              transactions={db.transactions}
              currentUser={currentUser}
              onCheckout={handleMarketCheckout}
              onAddProduct={handleAddProduct}
              onDeleteProduct={handleDeleteProduct}
              onUpdateProduct={handleUpdateProduct}
            />
          )}

          {currentPage === "keuangan" && (
            <KeuanganModule
              financials={db.financial_reports}
              onSubmitFinancial={handleAddFinancial}
            />
          )}

          {currentPage === "administrasi" && (
            <AdministrasiModule
              notulensi={db.notulensi}
              attendances={db.attendances}
              users={db.users}
              letters={db.letters || []}
              onSubmitNotulensi={handleAddNotulensi}
              onSubmitAttendance={handleAddAttendance}
              onSubmitLetter={handleAddLetter}
            />
          )}

          {/* MAHASISWA ONLY DIRECT PAGES */}
          {currentPage === "aspirasi" && (
            <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl space-y-6">
              <h3 className="font-display font-black text-white text-lg border-b border-dark-border pb-3 flex items-center gap-2">
                Advokasi & Pos Aspirasi Saya
              </h3>
              <PsdamModule
                aspirations={db.aspirations}
                users={db.users}
                onUpdateAspiration={handleUpdateAspirationStatus}
                onSubmitAspiration={handleAddAspiration}
                onDeleteAspiration={handleDeleteAspiration}
              />
            </div>
          )}

          {currentPage === "lomba" && (
            <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl space-y-6">
              <h3 className="font-display font-black text-white text-lg border-b border-dark-border pb-3 flex items-center gap-2">
                Pusat Pengembangan Prestasi & Sertifikat
              </h3>
              <MinbatModule
                talents={db.talents}
                onSubmitTalent={handleAddTalent}
              />
            </div>
          )}

          {currentPage === "shop" && (
            <div className="bg-dark-surface border border-dark-border p-6 rounded-2xl space-y-6">
              <h3 className="font-display font-black text-white text-lg border-b border-dark-border pb-3 flex items-center gap-2">
                KIMAS Marketplace Storefront
              </h3>
              <KimasModule
                products={db.products}
                transactions={db.transactions}
                currentUser={currentUser}
                onCheckout={handleMarketCheckout}
                onAddProduct={handleAddProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateProduct={handleUpdateProduct}
              />
            </div>
          )}
        </main>
      </div>

      {/* MODAL: PROFILE UPDATE */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-surface border border-[#222226] max-w-sm w-full rounded-2xl p-6 relative space-y-5">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition text-xs font-mono"
            >
              ✕ CLOSE
            </button>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-base text-white">
                Profil Sandbox Saya
              </h3>
              <p className="text-[11px] text-gray-400">
                Sesuaikan data identitas sandbox Anda
              </p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-3 font-sans text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-500 uppercase">
                    Nama Pengurus
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#131316] border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-brand-orange"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-500 uppercase">
                    Email Terdaftar
                  </label>
                  <input
                    type="email"
                    className="w-full bg-[#131316] border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none"
                    value={profEmail}
                    onChange={(e) => setProfEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-500 uppercase">
                    NPM Mahasiswa
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#131316] border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none"
                    value={profNpm}
                    onChange={(e) => setProfNpm(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold py-2 rounded transition"
              >
                Simpan Perubahan Profil
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD USERS (Admin only) */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-surface border border-[#222226] max-w-sm w-full rounded-2xl p-6 relative space-y-4">
            <button
              onClick={() => setIsAddUserOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition text-xs"
            >
              ✕
            </button>
            <h3 className="font-display font-bold text-base text-white">
              Daftarkan Anggota Baru
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-gray-500">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    placeholder="cth. Mahendra Sulistyo"
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none"
                    value={newUName}
                    onChange={(e) => setNewUName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-gray-500">
                    Email Alamat
                  </label>
                  <input
                    type="email"
                    placeholder="cth. email@pointer.ac.id"
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none"
                    value={newUEmail}
                    onChange={(e) => setNewUEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-gray-500">
                      NPM
                    </label>
                    <input
                      type="text"
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none"
                      value={newUNpm}
                      onChange={(e) => setNewUNpm(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-gray-500">
                      Akses Role
                    </label>
                    <select
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none"
                      value={newURole}
                      onChange={(e: any) => setNewURole(e.target.value)}
                    >
                      <option value="mahasiswa">Mahasiswa</option>
                      <option value="divisi">Divisi (Pengurus)</option>
                      <option value="admin">Admin (Kahim)</option>
                    </select>
                  </div>
                </div>

                {newURole === "divisi" && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-gray-500">
                      Pilih Divisi Penempatan
                    </label>
                    <select
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none"
                      value={newUDiv}
                      onChange={(e) => setNewUDiv(e.target.value)}
                    >
                      {db.divisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold py-2 rounded transition"
              >
                ✓ Daftarkan Anggota
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PROKER (All Divisions + Admin) */}
      {isAddProgramOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-surface border border-[#222226] max-w-sm w-full rounded-2xl p-6 relative space-y-4">
            <button
              onClick={() => setIsAddProgramOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition text-xs font-mono"
            >
              ✕ CANCEL
            </button>
            <h3 className="font-display font-bold text-base text-white">
              Ajukan Proposal Proker Baru
            </h3>
            <p className="text-[10px] text-gray-400 font-sans">
              Semua pengajuan baru akan masuk sirkulasi dengan status:{" "}
              <b>Pending Tanda Tangan</b>.
            </p>

            <form
              onSubmit={handleCreateProgram}
              className="space-y-4 text-xs font-sans"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-gray-500">
                    Nama Kegiatan
                  </label>
                  <input
                    type="text"
                    placeholder="cth. Workshop IoT Industri 2026"
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-brand-orange"
                    value={newProgTitle}
                    onChange={(e) => setNewProgTitle(e.target.value)}
                    required
                  />
                </div>

                {currentUser.role === "admin" && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-gray-500">
                      Pilih Divisi Pelaksana
                    </label>
                    <select
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none"
                      value={newProgDiv}
                      onChange={(e) => setNewProgDiv(e.target.value)}
                    >
                      {db.divisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-gray-500">
                      Rencana Tanggal
                    </label>
                    <input
                      type="date"
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none"
                      value={newProgDate}
                      onChange={(e) => setNewProgDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono text-gray-500">
                      Status Progress
                    </label>
                    <select
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none"
                      value={newProgStatus}
                      onChange={(e: any) => setNewProgStatus(e.target.value)}
                    >
                      <option value="planning">Planning</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-gray-500">
                    Rincian Deskripsi & Tujuan Proker
                  </label>
                  <textarea
                    placeholder="Jelaskan secara ringkas maksud kegiatan, target sasaran peserta, serta output yang diharapkan..."
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-xs h-24 focus:outline-none resize-none focus:border-brand-orange"
                    value={newProgDesc}
                    onChange={(e) => setNewProgDesc(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold py-2.5 rounded transition"
              >
                Ajukan Proposal Kegiatan Resmi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INTERACTIVE TOAST FEEDBACK NOTIFICATION */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-dark-surface border border-brand-orange/40 text-brand-orange text-xs px-5 py-3 rounded-xl shadow-2xl shadow-black/80 animate-bounce">
          <ShieldCheck size={16} /> <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
