import React from "react";
import { ArrowRight, Trophy, BookOpen, Layers, CheckCircle, Flame, Target, Compass, Sparkles } from "lucide-react";
import { Program, Division } from "../types";
import pointerLogo from "../assets/images/pointer_logo_clean_1780038118432.png";
import divPsdam from "../assets/images/div_psdam_1780038947605.png";
import divMedinfo from "../assets/images/div_medinfo_1780038966710.png";
import divMinbat from "../assets/images/div_minbat_1780038989558.png";
import divSosma from "../assets/images/div_sosma_1780039006949.png";
import divKimas from "../assets/images/div_kimas_1780039027490.png";
import divKeuangan from "../assets/images/div_keuangan_1780039047279.png";
import divAdministrasi from "../assets/images/div_administrasi_1780039069742.png";

interface LandingPageProps {
  onOpenLogin: () => void;
  programs: Program[];
  divisions: Division[];
  onExploreDivision: (slug: string) => void;
}

export default function LandingPage({
  onOpenLogin,
  programs,
  divisions,
  onExploreDivision
}: LandingPageProps) {

  // Custom mock documentations
  const documentaryPhotos = [
    { label: "Malam Keakraban Anggota 2026", emoji: "🎪", desc: "Membangun rasa solidaritas dan persaudaraan tanpa batas." },
    { label: "Workshop Laravel & React Suite", emoji: "💻", desc: "Pengenalan dasar full-stack MERN kepada kader himpunan." },
    { label: "Pengabdian Sosial Wilayah Pesisir", emoji: "🌱", desc: "Aksi bersih desa, donasi buku pelajaran, dan instalasi lab komputer mini." },
    { label: "Delegasi Lomba Gemastik XIX", emoji: "🏆", desc: "Mempersiapkan tim terbaik di kancah nasional bergengsi." }
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col font-sans selection:bg-brand-orange selection:text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 glass-effect border-b border-dark-border px-6 md:px-16 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center select-none duration-500 ease-out transition-transform hover:scale-105">
            <img
              id="header-pointer-logo"
              src={pointerLogo}
              alt="POINTER Logo"
              className="w-full h-full object-contain drop-shadow-[0_2px_10px_rgba(249,115,22,0.35)]"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-display font-extrabold text-xs md:text-base tracking-tight text-white uppercase">
            POINTER <span className="text-brand-orange">SYSTEM</span>
          </span>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#about" className="text-xs font-mono uppercase tracking-wider text-gray-400 hover:text-white transition">Tentang</a>
          <a href="#divisions" className="text-xs font-mono uppercase tracking-wider text-gray-400 hover:text-white transition">Struktur Divisi</a>
          <a href="#programs" className="text-xs font-mono uppercase tracking-wider text-gray-400 hover:text-white transition">Program Kerja</a>
          <a href="#docu" className="text-xs font-mono uppercase tracking-wider text-gray-400 hover:text-white transition">Dokumentasi</a>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={onOpenLogin}
            className="px-5 py-2 rounded-lg bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-mono uppercase tracking-wider font-bold transition shadow-lg shadow-brand-orange/15"
          >
            Masuk Sekarang
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 md:px-12 py-16 overflow-hidden">
        {/* Neon style ambient glow */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[800px] h-[500px] bg-brand-orange/5 rounded-full blur-[160px]"></div>
        </div>

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/10 border border-brand-orange/20 rounded-full text-brand-orange text-[10px] font-mono uppercase tracking-widest leading-none">
            <Sparkles size={11} className="animate-spin" style={{ animationDuration: "3s" }} /> Platform Digital Terintegrasi HIMA
          </div>

          <h1 className="font-display font-extrabold text-4xl md:text-7xl leading-tight text-white tracking-tight">
            Sistem Manajemen HIMA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-orange-400 to-white">
              POINTER
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-400 text-sm md:text-base leading-relaxed md:leading-normal font-sans">
            Satu pintu kepengurusan digital terpusat untuk Himpunan Mahasiswa Departemen Ilmu Komputer. Mengontrol pengajuan proposal program kerja, laporan keuangan transparan, sirkulasi kearsipan, hingga portal donasi dan marketplace internal organisasi.
          </p>

          <div className="pt-6 flex flex-wrap gap-4 justify-center">
            <button
              onClick={onOpenLogin}
              className="px-8 py-3.5 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg text-xs font-mono uppercase tracking-widest font-bold transition flex items-center gap-2 shadow-lg shadow-brand-orange/20"
            >
              Masuk Sekarang <ArrowRight size={14} />
            </button>
            <a
              href="#divisions"
              className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-dark-border text-white text-xs font-mono uppercase tracking-widest font-semibold rounded-lg transition"
            >
              Jelajahi Divisi
            </a>
          </div>

          {/* TELEMETRY STATS GRID */}
          <div className="pt-16 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-dark-border/60">
            <div className="space-y-1">
              <div className="font-display font-extrabold text-3xl md:text-5xl text-brand-orange">247</div>
              <div className="font-mono text-[10px] uppercase text-gray-500 tracking-widest">Kombatan Aktif</div>
            </div>
            <div className="space-y-1">
              <div className="font-display font-extrabold text-3xl md:text-5xl text-white">7</div>
              <div className="font-mono text-[10px] uppercase text-gray-500 tracking-widest">Divisi Utama</div>
            </div>
            <div className="space-y-1">
              <div className="font-display font-extrabold text-3xl md:text-5xl text-brand-orange">38</div>
              <div className="font-mono text-[10px] uppercase text-gray-500 tracking-widest">Program Kerja</div>
            </div>
            <div className="space-y-1">
              <div className="font-display font-extrabold text-3xl md:text-5xl text-white">92%</div>
              <div className="font-mono text-[10px] uppercase text-gray-500 tracking-widest">Lolos Evaluasi</div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE VISION MISSION SECTION */}
      <section id="about" className="py-24 px-6 md:px-16 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="text-brand-orange font-mono text-[11px] uppercase tracking-widest font-bold">Tentang Kami</div>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white">Visi & Misi HIMA POINTER</h2>
          <p className="max-w-xl mx-auto text-gray-400 text-xs md:text-sm">Landasan mutlak dalam mengembangkan program kerja integratif di era digital.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          <div className="bg-dark-surface border border-dark-border p-8 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-2 right-2 text-7xl text-white/5 font-display font-black">VISI</div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-orange to-red-600 rounded-xl flex items-center justify-center text-white text-xl">
                <Target size={22} />
              </div>
              <h3 className="font-display font-bold text-xl text-white">Visi Utama Organisasi</h3>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
                Membangun departemen/himpunan yang adaptif, futuristik, dan terdepan dalam mewadahi inovasi sains teknologi informasi mahasiswa, menghasilkan kader berintegritas tinggi dengan orientasi pengabdian masyarakat nyata.
              </p>
            </div>
          </div>

          <div className="bg-dark-surface border border-dark-border p-8 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-2 right-2 text-7xl text-white/5 font-display font-black">MISI</div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-orange to-red-600 rounded-xl flex items-center justify-center text-white text-xl">
                <Compass size={22} />
              </div>
              <h3 className="font-display font-bold text-xl text-white">Langkah Strategis (Misi)</h3>
              <ul className="text-gray-400 text-xs md:text-sm space-y-3 font-sans">
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange font-bold text-xs mt-0.5">01.</span>
                  <span>Menyelenggarakan program pelatihan pemrograman industri modern guna pematangan aspek teknis (hard skills) seluruh mahasiswa.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange font-bold text-xs mt-0.5">02.</span>
                  <span>Membentuk koridor advokasi responsif yang menjamin sirkulasi aspirasi mahasiswa terjalin solutif dengan birokrat kampus.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-orange font-bold text-xs mt-0.5">03.</span>
                  <span>Menginisiasi unit profit mandiri berbasis kewirausahaan teknologi guna ketahanan dana kegiatan internal organisasi.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* STRUKTUR DIVISI SECTION */}
      <section id="divisions" className="py-24 bg-dark-surface/50 border-y border-dark-border px-6 md:px-16">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <div className="text-brand-orange font-mono text-[11px] uppercase tracking-widest font-bold">Struktur Organisasi</div>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white">7 Divisi Kerja Unggulan</h2>
            <p className="max-w-xl mx-auto text-gray-400 text-xs md:text-sm">
              Masing-masing divisi memegang kendali atas modul fungsional di platform POINTER SYSTEM.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            {divisions.map((div) => {
              const divisionLogos: Record<string, string> = {
                "div-psdam": divPsdam,
                "div-medinfo": divMedinfo,
                "div-minbat": divMinbat,
                "div-sosma": divSosma,
                "div-kimas": divKimas,
                "div-keuangan": divKeuangan,
                "div-administrasi": divAdministrasi
              };

              return (
                <div
                  key={div.id}
                  onClick={() => onExploreDivision(div.slug)}
                  className="bg-dark-surface border border-zinc-800/80 rounded-2xl p-6 space-y-4 hover:border-brand-orange/40 hover:bg-zinc-800/40 cursor-pointer transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center p-1.5 shadow-inner select-none transition-transform hover:scale-105 duration-300">
                      {divisionLogos[div.id] ? (
                        <img
                          src={divisionLogos[div.id]}
                          alt={`${div.name} Logo`}
                          className="w-full h-full object-contain filter drop-shadow-[0_1px_4px_rgba(249,115,22,0.25)]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xl">⚙️</span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-sm text-white tracking-tight uppercase">
                      {div.name}
                    </h3>
                    <p className="text-gray-400 text-xs leading-normal">
                      {div.description}
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-brand-orange flex items-center gap-1 mt-2">
                    Masuk modul <ArrowRight size={10} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROGRAM KERJA SECTIONS */}
      <section id="programs" className="py-24 px-6 md:px-16 max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="text-brand-orange font-mono text-[11px] uppercase tracking-widest font-bold">Rencana Kerja</div>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white">Program Kerja Terbaru</h2>
          </div>
          <button
            onClick={onOpenLogin}
            className="w-fit text-xs font-mono uppercase tracking-wider text-brand-orange hover:text-white transition flex items-center gap-1.5"
          >
            Lihat Semua Program <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {programs.slice(0, 3).map((p) => {
            const icons: Record<string, string> = {
              "div-psdam": "📚",
              "div-medinfo": "🎨",
              "div-minbat": "🏅",
              "div-sosma": "🌱",
              "div-kimas": "🛍️",
              "div-keuangan": "💰",
              "div-administrasi": "📋"
            };

            return (
              <div key={p.id} className="bg-dark-surface border border-dark-border p-6 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-gray-500">Tanggal: {p.event_date}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${p.status === "ongoing" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                        p.status === "completed" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                      }`}>
                      {p.status}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base text-white leading-normal flex items-start gap-2">
                    <span className="text-xl leading-none mt-0.5">{icons[p.division_id] || "📚"}</span>
                    <span>{p.title}</span>
                  </h3>

                  <p className="text-gray-400 text-xs leading-relaxed max-h-[72px] overflow-hidden">
                    {p.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-dark-border/60 flex items-center justify-between">
                  <div className="text-[10px] text-gray-500 font-mono">Diusulkan oleh: <span className="text-white font-semibold">{p.created_by}</span></div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${p.approval_status === "approved" ? "bg-green-500/10 text-green-400" :
                      p.approval_status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-500"
                    }`}>
                    {p.approval_status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DOKUMENTASI KEGIATAN */}
      <section id="docu" className="py-24 bg-dark-surface/50 border-t border-dark-border px-6 md:px-16 text-center space-y-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-3">
            <div className="text-brand-orange font-mono text-[11px] uppercase tracking-widest font-bold">Galeri Dokumentasi</div>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white">Catatan Kegiatan HIMA POINTER</h2>
            <p className="max-w-xl mx-auto text-gray-400 text-xs md:text-sm">Sirkulasi momen gotong royong dan kompetisi yang terekam visual.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 text-left">
            {documentaryPhotos.map((photo, idx) => (
              <div key={idx} className="bg-dark-surface border border-dark-border rounded-2xl overflow-hidden hover:border-brand-orange/40 transition">
                <div className="h-32 bg-dark-bg flex items-center justify-center text-5xl">
                  {photo.emoji}
                </div>
                <div className="p-5 space-y-2">
                  <h4 className="font-display font-bold text-sm text-white">{photo.label}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed">{photo.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-dark-surface border-t border-dark-border px-6 md:px-16 py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center text-gray-500 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center select-none duration-500 hover:scale-105">
            <img
              id="footer-pointer-logo"
              src={pointerLogo}
              alt="POINTER Logo"
              className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(249,115,22,0.25)]"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-display font-extrabold text-white text-sm tracking-widest uppercase">POINTER <span className="text-brand-orange">SYSTEM</span></span>
        </div>
        <div>
          &copy; 2026 HIMA POINTER. Platform Manajemen Digital Terintegrasi. All Rights Reserved.
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white transition">AD/ART</a>
          <a href="#" className="hover:text-white transition">Dokumen LPJ</a>
          <a href="#" className="hover:text-white transition">SOP Himpunan</a>
        </div>
      </footer>
    </div>
  );
}
