import React, { useState } from "react";
import { Announcement, ContentCalendar, GalleryAlbum } from "../../types";
import { Film, Calendar, Megaphone, Image as ImageIcon, Send, Volume2, Plus, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

interface MedinfoModuleProps {
  announcements: Announcement[];
  calendar: ContentCalendar[];
  gallery: GalleryAlbum[];
  onSubmitAnnouncement: (title: string, content: string, category: string) => void;
  onSubmitContentCalendar: (title: string, platform: string, scheduleDate: string, status: "draft" | "scheduled") => void;
  onSubmitGalleryAlbum: (title: string, emoji: string, link: string) => void;
}

// Database Hari Libur Nasional Indonesia (2025-2027)
const HOLIDAYS: Record<string, string> = {
  // 2025
  "2025-01-01": "Tahun Baru Masehi",
  "2025-01-27": "Isra Mi'raj Nabi Muhammad SAW",
  "2025-01-29": "Tahun Baru Imlek 2576 Kongzili",
  "2025-03-29": "Hari Suci Nyepi (Tahun Baru Saka 1947)",
  "2025-03-31": "Hari Raya Idul Fitri 1446 H",
  "2025-04-01": "Hari Raya Idul Fitri 1446 H",
  "2025-04-18": "Wafat Yesus Kristus",
  "2025-04-20": "Hari Raya Paskah",
  "2025-05-01": "Hari Buruh Internasional",
  "2025-05-12": "Hari Raya Waisak 2569 BE",
  "2025-05-29": "Kenaikan Yesus Kristus",
  "2025-06-01": "Hari Lahir Pancasila",
  "2025-06-06": "Hari Raya Idul Adha 1446 H",
  "2025-06-27": "Tahun Baru Islam 1447 H",
  "2025-08-17": "Hari Kemerdekaan Republik Indonesia",
  "2025-09-05": "Maulid Nabi Muhammad SAW",
  "2025-12-25": "Hari Raya Natal",

  // 2026
  "2026-01-01": "Tahun Baru Masehi",
  "2026-01-15": "Isra Mi'raj Nabi Muhammad SAW",
  "2026-02-17": "Tahun Baru Imlek 2577 Kongzili",
  "2026-03-19": "Hari Suci Nyepi (Tahun Baru Saka 1948)",
  "2026-03-20": "Wafat Yesus Kristus / Hari Raya Idul Fitri 1447 H",
  "2026-03-21": "Hari Raya Idul Fitri 1447 H",
  "2026-03-22": "Hari Raya Paskah",
  "2026-05-01": "Hari Buruh Internasional",
  "2026-05-14": "Hari Raya Waisak 2570 BE",
  "2026-05-24": "Kenaikan Yesus Kristus",
  "2026-06-01": "Hari Lahir Pancasila",
  "2026-06-16": "Hari Raya Idul Adha 1447 H",
  "2026-07-07": "Tahun Baru Islam 1448 H",
  "2026-08-17": "Hari Kemerdekaan Republik Indonesia",
  "2026-09-15": "Maulid Nabi Muhammad SAW",
  "2026-12-25": "Hari Raya Natal",

  // 2027
  "2027-01-01": "Tahun Baru Masehi",
  "2027-01-05": "Isra Mi'raj Nabi Muhammad SAW",
  "2027-02-06": "Tahun Baru Imlek 2578 Kongzili",
  "2027-03-09": "Hari Suci Nyepi (Tahun Baru Saka 1949) / Hari Raya Idul Fitri 1448 H",
  "2027-03-10": "Hari Raya Idul Fitri 1448 H",
  "2027-03-26": "Wafat Yesus Kristus",
  "2027-03-28": "Hari Raya Paskah",
  "2027-05-01": "Hari Buruh Internasional",
  "2027-05-06": "Kenaikan Yesus Kristus",
  "2027-05-16": "Hari Raya Idul Adha 1448 H",
  "2027-05-20": "Hari Raya Waisak 2571 BE",
  "2027-06-01": "Hari Lahir Pancasila",
  "2027-06-26": "Tahun Baru Islam 1449 H",
  "2027-08-17": "Hari Kemerdekaan Republik Indonesia",
  "2027-09-04": "Maulid Nabi Muhammad SAW",
  "2027-12-25": "Hari Raya Natal"
};

// Peringatan / Hari Besar Non-libur nasional
const NATIONAL_DAYS: Record<string, string> = {
  "05-02": "Hari Pendidikan Nasional",
  "05-20": "Hari Kebangkitan Nasional",
  "10-02": "Hari Batik Nasional",
  "10-28": "Hari Sumpah Pemuda",
  "11-10": "Hari Pahlawan",
  "12-22": "Hari Ibu"
};

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function MedinfoModule({
  announcements,
  calendar,
  gallery,
  onSubmitAnnouncement,
  onSubmitContentCalendar,
  onSubmitGalleryAlbum
}: MedinfoModuleProps) {
  const [annTitle, setAnnTitle] = useState("");
  const [annCategory, setAnnCategory] = useState("Kompetisi");
  const [annContent, setAnnContent] = useState("");

  const [postTitle, setPostTitle] = useState("");
  const [postPlatform, setPostPlatform] = useState("Instagram Feed");
  const [postDate, setPostDate] = useState("2026-06-22");

  const [isAddAlbumOpen, setIsAddAlbumOpen] = useState(false);
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumEmoji, setAlbumEmoji] = useState("📁");
  const [albumLink, setAlbumLink] = useState("");

  // Default to June 2026 (matching system context)
  const [currentMonth, setCurrentMonth] = useState(5); // 0-indexed (June = 5)
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState<number | null>(22);

  // Helper formatting YYYY-MM-DD
  const getFormattedDateString = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday, 1 = Monday, ...
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const emptyCells = Array.from({ length: firstDayOfWeek }, (_, i) => null);
  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  const calendarCells = [...emptyCells, ...daysArray];

  // Helper check holiday info
  const getHolidayInfo = (day: number) => {
    const fullDate = getFormattedDateString(currentYear, currentMonth, day);
    const mmdd = `${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const publicHoliday = HOLIDAYS[fullDate];
    const nationalDay = NATIONAL_DAYS[mmdd];
    return {
      publicHoliday: publicHoliday || null,
      nationalDay: nationalDay || null,
      isHoliday: !!publicHoliday,
      isCommemoration: !!nationalDay,
      label: publicHoliday || nationalDay || ""
    };
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(null);
  };

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    setPostDate(getFormattedDateString(currentYear, currentMonth, day));
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateVal = e.target.value;
    setPostDate(newDateVal);
    if (newDateVal) {
      const [y, m, d] = newDateVal.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        setCurrentYear(y);
        setCurrentMonth(m - 1);
        setSelectedDay(d);
      }
    }
  };

  const mockCampaigns = [
    { title: "OpRec Anggota Muda 2026", reach: 2420, engagement: "24%", source: "Instagram" },
    { title: "Workshop Web Dev HIMA", reach: 1890, engagement: "18%", source: "WhatsApp Blast" },
    { title: "Lomba Desain Nasional (LDKN)", reach: 3820, engagement: "31%", source: "LinkedIn Ads" }
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
    const formattedDate = postDate || getFormattedDateString(currentYear, currentMonth, selectedDay || 22);
    onSubmitContentCalendar(postTitle, postPlatform, formattedDate, "scheduled");
    setPostTitle("");
  };

  const handleAlbumSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumTitle || !albumLink) return;
    onSubmitGalleryAlbum(
      albumTitle,
      albumEmoji,
      albumLink
    );
    setAlbumTitle("");
    setAlbumEmoji("📁");
    setAlbumLink("");
    setIsAddAlbumOpen(false);
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
            <div className="flex items-center gap-2">
              <Calendar className="text-brand-orange" size={20} />
              <h3 className="font-display font-bold text-lg text-white">
                Kalender Posting Media
              </h3>
            </div>

            {/* MONTH-YEAR NAVIGATION */}
            <div className="flex items-center gap-2 bg-[#121215] border border-dark-border rounded-lg px-2 py-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:text-brand-orange text-gray-400 transition"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-mono font-bold text-white min-w-[100px] text-center select-none">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:text-brand-orange text-gray-400 transition"
                title="Bulan Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* WEEKDAYS HEADER (Sunday-first for standard Indonesian physical calendar) */}
          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d, i) => (
              <span
                key={i}
                className={`text-[10px] font-mono font-bold uppercase ${i === 0 ? "text-red-500" : "text-gray-500"}`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* DAYS GRID */}
          <div className="grid grid-cols-7 gap-2 text-center mb-6">
            {calendarCells.map((day, cellIndex) => {
              if (day === null) {
                return <div key={`empty-${cellIndex}`} className="aspect-square"></div>;
              }

              const formattedDate = getFormattedDateString(currentYear, currentMonth, day);
              const isSelected = selectedDay === day;
              const hasEvents = calendar.some(c => c.schedule_date === formattedDate);
              const holidayInfo = getHolidayInfo(day);

              // Sunday check
              const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
              const isSunday = dayOfWeek === 0;

              let cellStyle = "bg-[#131317] border border-dark-border text-gray-400 hover:border-gray-500";
              if (isSelected) {
                cellStyle = "bg-brand-orange text-white font-bold border-brand-orange shadow-lg shadow-brand-orange/20";
              } else if (holidayInfo.isHoliday) {
                cellStyle = "bg-red-500/10 border border-red-500/40 text-red-400 font-medium hover:border-red-400";
              } else if (holidayInfo.isCommemoration) {
                cellStyle = "bg-amber-500/10 border border-amber-500/40 text-amber-400 font-medium hover:border-amber-400";
              } else if (hasEvents) {
                cellStyle = "bg-brand-orange/10 border border-brand-orange/30 text-brand-orange hover:border-brand-orange";
              } else if (isSunday) {
                cellStyle = "bg-[#131317] border border-dark-border text-red-500/70 hover:border-red-500";
              }

              return (
                <button
                  type="button"
                  key={`day-${day}`}
                  onClick={() => handleDaySelect(day)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative transition ${cellStyle}`}
                >
                  <span className="z-10">{day}</span>

                  {/* Status Indicators */}
                  <div className="absolute bottom-1 flex gap-1 justify-center w-full">
                    {hasEvents && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                    )}
                    {holidayInfo.isHoliday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    )}
                    {holidayInfo.isCommemoration && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* AGENDA DETAILS PANEL */}
          <div className="bg-[#141418] border border-dark-border p-4 rounded-lg mb-4">
            <h4 className="text-xs font-mono text-gray-400 uppercase mb-3">
              Detail Agenda: {selectedDay ? `${selectedDay} ${MONTH_NAMES[currentMonth]} ${currentYear}` : "Pilih Tanggal"}
            </h4>

            {/* HOLIDAY REMINDER IN AGENDA */}
            {selectedDay && (() => {
              const info = getHolidayInfo(selectedDay);
              if (info.isHoliday) {
                return (
                  <div className="mb-3 flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block text-[10px] text-red-500">Hari Libur Nasional:</span>
                      {info.publicHoliday}
                    </div>
                  </div>
                );
              }
              if (info.isCommemoration) {
                return (
                  <div className="mb-3 flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs">
                    <Calendar size={14} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold uppercase tracking-wider block text-[10px] text-amber-500">Hari Penting / Peringatan:</span>
                      {info.nationalDay}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="space-y-2">
              {selectedDay ? (() => {
                const dateStr = getFormattedDateString(currentYear, currentMonth, selectedDay);
                const dayEvents = calendar.filter(c => c.schedule_date === dateStr);

                if (dayEvents.length > 0) {
                  return dayEvents.map((c) => (
                    <div key={c.id} className="flex items-center justify-between bg-dark-bg p-2.5 rounded border border-dark-border hover:border-gray-700 transition">
                      <div>
                        <h5 className="text-xs font-semibold text-white">{c.post_title}</h5>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">{c.platform}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${c.status === "published" ? "bg-green-500/10 text-green-400" : "bg-brand-orange/10 text-brand-orange"
                        }`}>
                        {c.status}
                      </span>
                    </div>
                  ));
                } else {
                  return (
                    <div className="text-center py-4 text-xs text-gray-500">
                      Tidak ada agenda posting terjadwal pada hari ini.
                    </div>
                  );
                }
              })() : (
                <div className="text-center py-4 text-xs text-gray-500">
                  Silakan pilih tanggal pada kalender untuk melihat atau menjadwalkan agenda.
                </div>
              )}
            </div>
          </div>

          {/* ADD TO SCHEDULE FORM */}
          {selectedDay && (
            <form onSubmit={handleCCSubmit} className="space-y-3 border-t border-dark-border pt-4">
              <div className="text-xs text-gray-400 font-mono">TENTUKAN DIAGRAM PUBLIKASI BARU:</div>

              {/* HOLIDAY CONTENT SUGGESTION TIP */}
              {(() => {
                const info = getHolidayInfo(selectedDay);
                if (info.isHoliday || info.isCommemoration) {
                  const holidayName = info.publicHoliday || info.nationalDay;
                  return (
                    <div className="p-2.5 bg-brand-orange/5 border border-brand-orange/20 rounded-lg text-xs text-gray-300">
                      <span className="font-bold text-brand-orange flex items-center gap-1 mb-1">
                        💡 Tips Konten Hari Besar
                      </span>
                      Hari ini memperingati <strong className="text-white">{holidayName}</strong>. Medinfo disarankan membuat konten ucapan selamat, infografis sejarah, atau postingan interaktif bertema khusus.
                    </div>
                  );
                }
                return null;
              })()}

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
                  onChange={handleDateInputChange}
                />
                <button
                  type="submit"
                  className="bg-brand-orange hover:bg-brand-orange-hover text-white text-xs px-4 py-1.5 rounded font-semibold transition flex items-center gap-1 active:scale-95"
                >
                  <Send size={12} /> Jadwalkan
                </button>
              </div>
            </form>
          )}
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
          {gallery.map((g) => (
            <div key={g.id} className="bg-[#121215] border border-dark-border rounded-lg p-4 flex items-center gap-3 hover:border-brand-orange transition cursor-pointer" onClick={() => window.open(g.link, "_blank", "noopener,noreferrer")}>
              <div className="text-3xl">{g.emoji}</div>
              <div className="min-w-0">
                <h4 className="font-semibold text-xs text-white truncate">{g.title}</h4>
                <div className="text-[10px] text-brand-orange mt-0.5 hover:underline">Buka Link Drive</div>
              </div>
            </div>
          ))}
          <button
            onClick={() => setIsAddAlbumOpen(true)}
            className="bg-dark-bg border border-dashed border-dark-border hover:border-brand-orange/40 rounded-lg p-4 flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-brand-orange transition"
          >
            <Plus size={16} /> Tambah Album Doker
          </button>
        </div>
      </div>

      {/* MODAL: ADD ALBUM */}
      {isAddAlbumOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-surface border border-[#222226] max-w-sm w-full rounded-2xl p-6 relative space-y-4">
            <button
              onClick={() => setIsAddAlbumOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition text-xs font-mono"
            >
              ✕ TUTUP
            </button>
            <h3 className="font-display font-bold text-base text-white">
              Tambah Album Dokumentasi Baru
            </h3>
            
            <form onSubmit={handleAlbumSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-gray-500">Nama Acara / Album</label>
                  <input
                    type="text"
                    className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none focus:border-brand-orange"
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                    placeholder="cth. Informatics Gathering 2026"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-3 space-y-1">
                    <label className="text-[10px] uppercase font-mono text-gray-500">Emoji</label>
                    <input
                      type="text"
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none text-center"
                      value={albumEmoji}
                      onChange={(e) => setAlbumEmoji(e.target.value)}
                      placeholder="📁"
                      required
                    />
                  </div>
                  <div className="col-span-9 space-y-1">
                    <label className="text-[10px] uppercase font-mono text-gray-500">Link Drive / Folder</label>
                    <input
                      type="url"
                      className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-white text-xs focus:outline-none"
                      value={albumLink}
                      onChange={(e) => setAlbumLink(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold py-2.5 rounded transition flex items-center justify-center gap-1"
              >
                <Plus size={14} /> Simpan Album
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
