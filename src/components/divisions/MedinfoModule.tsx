import React, { useState } from "react";
import { Announcement, ContentCalendar } from "../../types";
import { Film, Calendar, Megaphone, Image as ImageIcon, Send, Volume2, Plus } from "lucide-react";

interface MedinfoModuleProps {
  announcements: Announcement[];
  calendar: ContentCalendar[];
  onSubmitAnnouncement: (title: string, content: string, category: string) => void;
  onSubmitContentCalendar: (title: string, platform: string, scheduleDate: string, status: "draft" | "scheduled") => void;
}

export default function MedinfoModule({
  announcements,
  calendar,
  onSubmitAnnouncement,
  onSubmitContentCalendar
}: MedinfoModuleProps) {
  const [annTitle, setAnnTitle] = useState("");
  const [annCategory, setAnnCategory] = useState("Kompetisi");
  const [annContent, setAnnContent] = useState("");

  const [postTitle, setPostTitle] = useState("");
  const [postPlatform, setPostPlatform] = useState("Instagram Feed");
  const [postDate, setPostDate] = useState("");
  
  const [selectedDay, setSelectedDay] = useState<number | null>(27);

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const scheduledDays = calendar.map(c => {
    const day = Number(c.schedule_date.split("-")[2]);
    return isNaN(day) ? null : day;
  }).filter(Boolean);

  const mockCampaigns = [
    { title: "OpRec Anggota Muda 2026", reach: 2420, engagement: "24%", source: "Instagram" },
    { title: "Workshop Web Dev HIMA", reach: 1890, engagement: "18%", source: "WhatsApp Blast" },
    { title: "Lomba Desain Nasional (LDKN)", reach: 3820, engagement: "31%", source: "LinkedIn Ads" }
  ];

  const mockGallery = [
    { emoji: "📷", title: "Informatics Gathering 2026", count: 42, size: "145 MB" },
    { emoji: "🎤", title: "Webinar Career Path UI/UX", count: 18, size: "54 MB" },
    { emoji: "🌱", title: "Pelepasan Volunteer SOSMA", count: 29, size: "89 MB" },
    { emoji: "🏆", title: "Malam Penganugerahan Juara", count: 35, size: "112 MB" }
  ];

  const handleAnnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) return;
    onSubmitAnnouncement(annTitle, annContent, annCategory);
    setAnnTitle("");
    setAnnContent("");
  };

  const handleCCSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle) return;
    const formattedDate = postDate || "2026-06-" + String(selectedDay || 15).padStart(2, "0");
    onSubmitContentCalendar(postTitle, postPlatform, formattedDate, "scheduled");
    setPostTitle("");
  };

  return (
    <div className="space-y-6">
      {/* STATS COUNTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase font-mono mb-2">Total Publikasi Sosial</div>
          <div className="text-3xl font-display font-bold text-white">142</div>
          <div className="text-xs text-brand-orange mt-2 flex items-center gap-1">
            <span>🔥 +12 Video minggu ini</span>
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase font-mono mb-2">Terposting Calendar</div>
          <div className="text-3xl font-display font-bold text-white">{calendar.length}</div>
          <div className="text-xs text-green-500 mt-2">
            Roster publikasi terjadwal
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase font-mono mb-2">Campaign Aktif</div>
          <div className="text-3xl font-display font-bold text-white">3</div>
          <div className="text-xs text-blue-400 mt-2">
            Meningkatkan jangkauan HIMA
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase font-mono mb-2">Total Media Dokumentasi</div>
          <div className="text-3xl font-display font-bold text-white">124 GB</div>
          <div className="text-xs text-purple-400 mt-2">
            Tersimpan aman di Google Drive
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* POSTING CALENDAR INTERACTIVE */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 border-b border-dark-border pb-3">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Calendar className="text-brand-orange" size={20} />
              Kalender Posting Media (Juni 2026)
            </h3>
            <span className="text-xs text-brand-orange font-mono">Pilih Tanggal</span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-6">
            {["Se", "Se", "Ra", "Ka", "Ju", "Sa", "Mi"].map((d, i) => (
              <span key={i} className="text-xs font-mono text-gray-500 uppercase">{d}</span>
            ))}
            {daysInMonth.map((day) => {
              const isScheduled = scheduledDays.includes(day);
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative transition ${
                    isSelected ? "bg-brand-orange text-white font-bold" :
                    isScheduled ? "bg-brand-orange/10 border border-brand-orange/30 text-brand-orange" :
                    "bg-[#131317] border border-dark-border hover:border-gray-500 text-gray-400"
                  }`}
                >
                  <span>{day}</span>
                  {isScheduled && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange absolute bottom-1.5"></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="bg-[#141418] border border-dark-border p-4 rounded-lg mb-4">
            <h4 className="text-xs font-mono text-gray-400 uppercase mb-3">Agenda & Status Konten: Tanggal {selectedDay} Juni</h4>
            <div className="space-y-2">
              {calendar.filter(c => Number(c.schedule_date.split("-")[2]) === selectedDay).map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-dark-bg p-2 rounded border border-dark-border">
                  <div>
                    <h5 className="text-xs font-semibold text-white">{c.post_title}</h5>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">{c.platform}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-brand-orange/10 text-brand-orange uppercase font-bold">
                    {c.status}
                  </span>
                </div>
              ))}
              {calendar.filter(c => Number(c.schedule_date.split("-")[2]) === selectedDay).length === 0 && (
                <div className="text-center py-2 text-xs text-gray-500">Tidak ada agenda posting terjadwal pada hari ini.</div>
              )}
            </div>
          </div>

          {/* ADD TO SCHEDULE FORM */}
          <form onSubmit={handleCCSubmit} className="space-y-2 border-t border-dark-border pt-4">
            <div className="text-xs text-gray-400 font-mono">TENTUKAN DIAGRAM PUBLIKASI BARU:</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Topik postingan..."
                className="bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                required
              />
              <select
                className="bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                value={postPlatform}
                onChange={(e) => setPostPlatform(e.target.value)}
              >
                <option value="Instagram Reels">Instagram Reels</option>
                <option value="Instagram Feed">Instagram Feed</option>
                <option value="TikTok Video">TikTok Video</option>
                <option value="LinkedIn Post">LinkedIn Post</option>
                <option value="WhatsApp Blast">WhatsApp Blast</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                className="bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white focus:outline-none flex-1"
                value={postDate}
                onChange={(e) => setPostDate(e.target.value)}
              />
              <button
                type="submit"
                className="bg-brand-orange hover:bg-brand-orange-hover text-white text-xs px-4 py-1.5 rounded font-semibold transition"
              >
                Jadwalkan
              </button>
            </div>
          </form>
        </div>

        {/* CAMPAIGN MONITORING & GAMP DESIGN REQUEST PANEL */}
        <div className="space-y-6">
          {/* ANNOUNCEMENT BOARD UPDATER */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
              <Volume2 className="text-brand-orange" size={20} />
              Rilis Pengumuman Baru (HIMA Board)
            </h3>
            <form onSubmit={handleAnnSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Judul Pengumuman"
                  className="bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  required
                />
                <select
                  className="bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value)}
                >
                  <option value="Kompetisi">Kompetisi</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Akademik">Akademik</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>
              <textarea
                placeholder="Tulis ringkasan pengumuman resmi yang akan tersebar ke dashboard semua mahasiswa..."
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white h-20 focus:outline-none focus:border-brand-orange resize-none"
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                required
              ></textarea>
              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white rounded text-xs py-2 font-semibold transition flex items-center justify-center gap-1"
              >
                <Megaphone size={14} /> Publis Pengumuman Resmi
              </button>
            </form>
          </div>

          {/* CAMPAIGNS & TRACKING */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
            <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
              <Film className="text-brand-orange" size={20} />
              Sosmed Campaign Tracking
            </h3>
            <div className="space-y-3">
              {mockCampaigns.map((c, idx) => (
                <div key={idx} className="bg-dark-bg p-3 border border-dark-border rounded-lg flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-xs text-white">{c.title}</h5>
                    <span className="text-[10px] text-gray-400">{c.source}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-brand-orange font-mono">{c.reach} Reach</div>
                    <span className="text-[10px] text-green-400 font-bold">{c.engagement} Engagement</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GALLERY DOKUMENTASI SECTIONS */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
        <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
          <ImageIcon className="text-brand-orange" size={20} />
          Arsip Gallery & Dokumentasi Kegiatan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {mockGallery.map((g, idx) => (
            <div key={idx} className="bg-[#121215] border border-dark-border rounded-lg p-4 flex items-center gap-3 hover:border-brand-orange transition cursor-pointer">
              <div className="text-3xl">{g.emoji}</div>
              <div>
                <h4 className="font-semibold text-xs text-white">{g.title}</h4>
                <div className="text-[10px] text-gray-500 mt-0.5">{g.count} Foto · {g.size}</div>
              </div>
            </div>
          ))}
          <div className="bg-dark-bg border border-dashed border-dark-border hover:border-brand-orange/40 rounded-lg p-4 flex items-center justify-center gap-2 text-xs text-gray-500 cursor-pointer transition">
            <Plus size={16} /> Tambah Album Doker
          </div>
        </div>
      </div>
    </div>
  );
}
