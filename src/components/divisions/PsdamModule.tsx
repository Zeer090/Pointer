import React, { useState } from "react";
import { Aspiration, User } from "../../types";
import { MessageSquare, Users, CheckCircle2, ArrowRight, ShieldCheck, HeartPulse, Send } from "lucide-react";

interface PsdamModuleProps {
  aspirations: Aspiration[];
  users: User[];
  onUpdateAspiration: (id: string, newStatus: "pending" | "processing" | "completed") => void;
  onSubmitAspiration: (name: string, category: string, message: string) => void;
  onDeleteAspiration?: (id: string) => void;
}

export default function PsdamModule({
  aspirations,
  users,
  onUpdateAspiration,
  onSubmitAspiration,
  onDeleteAspiration
}: PsdamModuleProps) {
  const [aspName, setAspName] = useState("");
  const [aspCategory, setAspCategory] = useState<any>("Akademik");
  const [aspMessage, setAspMessage] = useState("");

  const [activeKaderisasiStep, setActiveKaderisasiStep] = useState(2); // Mock step: Mentoring
  
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingType, setMeetingType] = useState("");
  const [meetingCategory, setMeetingCategory] = useState("Rapat Kerja");
  const [meetingDivision, setMeetingDivision] = useState("");
  const handleWABroadcast = () => {
    if (!broadcastMessage) return;
    const text = encodeURIComponent(broadcastMessage);
    const url = `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const formatIndonesianDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${days[dateObj.getDay()]}, ${parseInt(d)} ${months[dateObj.getMonth()]} ${y}`;
  };

  const generateMeetingCaption = () => {
    let targetAudience = "Presidium Tinggi";
    let kegiatan = meetingType || meetingCategory;
    let formattedDate = formatIndonesianDate(meetingDate) || "[Hari, Tanggal]";

    if (meetingCategory === "Rapat Kerja") {
      targetAudience = "Presidium Inti, Staff Ahli & Staff Muda";
    } else if (meetingCategory === "Rabuan") {
      targetAudience = "seluruh Mahasiswa MI";
    } else if (meetingCategory === "Rapat Presidium Inti") {
      targetAudience = "seluruh Presidium Inti";
    } else if (meetingCategory === "Rapat Divisi") {
      targetAudience = `seluruh Anggota Divisi ${meetingDivision || "..."}`;
    }

    const template = `📢 ✨ Assalamu’alaikum Warahmatullahi Wabarakatuh ✨

Diberitahukan kepada ${targetAudience}, bahwa akan dilaksanakan Rapat, yang akan diselenggarakan pada:

🗓️ Hari & Tanggal : ${formattedDate}
⏰ Waktu : ${meetingTime || "[Waktu]"} WIB – selesai
*📍Tempat : ${meetingLocation || "[Tempat]"}
📝 Kegiatan : ${kegiatan}

📌 Catatan : Peserta datang 5 menit lebih awal dari waktu yang di tentukan dan menggunakan pakaian bebas dan sopan

Sehubungan dengan hal tersebut, ${targetAudience} wajib hadir tepat waktu.

Demikian pemberitahuan ini disampaikan, atas perhatian dan kehadirannya diucapkan terima kasih.

✨ Wassalamu’alaikum Warahmatullahi Wabarakatuh ✨ 🙏

Portal Media MI Polinela
Instagram : @mi_polinela
Tiktok : @polinela_it_center
Email : mi@polinela.ac.id

#politekniknegerilampung
#teknologiinformasi
#d3manajemeninformatika
#darimiuntuksemua
#polinelajayamikucinta
#polinelaitcenter`;

    setBroadcastMessage(template);
  };
  
  const cadresSteps = [
    { name: "Screener Red", desc: "Seleksi admin & kecocokan" },
    { name: "Orientasi Dasar", desc: "Pengenalan AD/ART & Anggaran" },
    { name: "Mentoring POINTER", desc: "Asosiasi skill & hard training" },
    { name: "Evaluasi Komunal", desc: "Simulasi pengerjaan proker" },
    { name: "Inagurasi", desc: "Pelantikan & sumpah pengurus" }
  ];

  const handleAspSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aspMessage) return;
    onSubmitAspiration(aspName || "Anonim", aspCategory, aspMessage);
    setAspName("");
    setAspMessage("");
  };

  return (
    <div className="space-y-6">
      {/* PSDAM STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 relative overflow-hidden">
          <div className="text-gray-400 text-xs uppercase font-mono tracking-wider mb-2">Aspirasi Masuk</div>
          <div className="text-3xl font-display font-bold text-white">{aspirations.length}</div>
          <div className="text-xs text-brand-orange mt-2 flex items-center gap-1">
            <MessageSquare size={12} /> Menunggu penanganan
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 relative overflow-hidden">
          <div className="text-gray-400 text-xs uppercase font-mono tracking-wider mb-2">Aspirasi Diproses</div>
          <div className="text-3xl font-display font-bold text-white">
            {aspirations.filter(a => a.status === "processing").length}
          </div>
          <div className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
            <span>⚡ Selang penyelesaian</span>
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 relative overflow-hidden">
          <div className="text-gray-400 text-xs uppercase font-mono tracking-wider mb-2">Aspirasi Selesai</div>
          <div className="text-3xl font-display font-bold text-white">
            {aspirations.filter(a => a.status === "completed").length}
          </div>
          <div className="text-xs text-green-500 mt-2 flex items-center gap-1">
            <CheckCircle2 size={12} /> Selesai ditindaklanjuti
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 relative overflow-hidden">
          <div className="text-gray-400 text-xs uppercase font-mono tracking-wider mb-2">Tingkat Pengembangan</div>
          <div className="text-3xl font-display font-bold text-white">94%</div>
          <div className="text-xs text-blue-400 mt-2">
            28 Anggota baru teruji
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* ASPIRASI INTAKE & MANAGEMENT */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6 border-b border-dark-border pb-4">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <MessageSquare className="text-brand-orange" size={20} />
              Aspirasi & Advokasi Mahasiswa
            </h3>
            <span className="text-xs text-gray-400 font-mono">Daftar Aspirasi Nasional</span>
          </div>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 mb-6">
            {aspirations.map((a) => (
              <div key={a.id} className="bg-dark-bg border border-dark-border p-4 rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-sm">{a.student_name}</h4>
                    <span className="inline-block mt-1 font-mono text-[10px] uppercase bg-brand-orange/10 text-brand-orange border border-brand-orange/20 px-2 py-0.5 rounded-full">
                      {a.category}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      a.status === "completed" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                      a.status === "processing" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                      "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                    }`}>
                      {a.status.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-500">{a.created_at}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{a.message}</p>
                <div className="flex gap-2 pt-2 border-t border-dark-border">
                  <button 
                    onClick={() => onUpdateAspiration(a.id, "processing")}
                    className="text-[10px] text-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10 border border-yellow-500/10 px-3 py-1 rounded transition"
                  >
                    Proses
                  </button>
                  <button 
                    onClick={() => onUpdateAspiration(a.id, "completed")}
                    className="text-[10px] text-green-500 bg-green-500/5 hover:bg-green-500/10 border border-green-500/10 px-3 py-1 rounded transition"
                  >
                    Selesaikan ✓
                  </button>
                  {onDeleteAspiration && (
                    <button 
                      onClick={() => onDeleteAspiration(a.id)}
                      className="text-[10px] text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 px-3 py-1 rounded transition ml-auto"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* FORM SUBMISSION */}
          <form onSubmit={handleAspSubmit} className="border-t border-dark-border pt-4 space-y-3">
            <h4 className="text-xs uppercase font-mono text-gray-400 tracking-wider">Kirim Aspirasi Baru</h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama (Bisa kosong)"
                className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                value={aspName}
                onChange={(e) => setAspName(e.target.value)}
              />
              <select
                className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                value={aspCategory}
                onChange={(e: any) => setAspCategory(e.target.value)}
              >
                <option value="Akademik">Akademik</option>
                <option value="Fasilitas">Fasilitas</option>
                <option value="Beasiswa">Beasiswa</option>
                <option value="Kegiatan">Kegiatan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <textarea
              placeholder="Tulis saran, keluhan, atau aspirasi advokasi..."
              className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white h-20 focus:outline-none focus:border-brand-orange resize-none"
              value={aspMessage}
              onChange={(e) => setAspMessage(e.target.value)}
              required
            ></textarea>
            <button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white rounded text-xs py-2 font-semibold transition"
            >
              Kirim Aspirasi Mahasiswa
            </button>
          </form>
        </div>

        {/* (BAGIAN PRESENSI SUDAH DIPINDAHKAN KE ADMINISTRASI) */}
      </div>

      {/* PENGEMBANGAN & MONITORING TIMELINE */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
        <h3 className="font-display font-bold text-lg text-white mb-6 flex items-center gap-2">
          <ShieldCheck className="text-brand-orange" size={20} />
          Alur Pengembangan Organisasi (Sistem Masuk POINTER)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {cadresSteps.map((step, idx) => {
            const isCompleted = idx < activeKaderisasiStep;
            const isCurrent = idx === activeKaderisasiStep;

            return (
              <div 
                key={idx} 
                onClick={() => setActiveKaderisasiStep(idx)}
                className={`p-4 rounded-xl border transition cursor-pointer relative ${
                  isCurrent ? "bg-brand-orange/5 border-brand-orange" : 
                  isCompleted ? "bg-green-500/5 border-green-500/30" : 
                  "bg-dark-bg/60 border-dark-border"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-mono uppercase font-bold ${
                    isCurrent ? "text-brand-orange" : 
                    isCompleted ? "text-green-500" : 
                    "text-gray-500"
                  }`}>
                    Tahap 0{idx + 1}
                  </span>
                  {isCompleted && <span className="text-green-500 text-xs">✓ Selesai</span>}
                  {isCurrent && <span className="text-brand-orange text-xs flex items-center gap-1"><HeartPulse size={10} className="animate-pulse" /> Aktif</span>}
                </div>
                <div className="text-sm font-semibold text-white mb-1 font-display">{step.name}</div>
                <div className="text-gray-400 text-xs leading-normal">{step.desc}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 bg-dark-bg/50 border border-dark-border rounded-lg p-3 text-xs text-gray-400 flex items-center gap-2">
          <span className="font-bold text-brand-orange">Informasi PSDAM:</span> 
          <span>Klik tahapan di atas untuk mengubah fokus monitoring anggotanya. Anggota aktif saat ini sedang difokuskan pada pengayaan <b>Mentoring POINTER</b>.</span>
        </div>
      </div>

      {/* WHATSAPP BROADCAST */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
        <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
          <Send className="text-brand-orange" size={20} />
          Broadcast WhatsApp Otomatis
        </h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col space-y-4">
            <p className="text-sm text-gray-400">
              Buat pesan broadcast yang akan diexport langsung ke aplikasi WhatsApp Anda. Anda dapat memilih kontak atau grup tujuan setelah aplikasi WhatsApp terbuka.
            </p>
            <textarea
              placeholder="Tulis pesan broadcast di sini..."
              className="flex-1 w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-sm text-white min-h-[120px] focus:outline-none focus:border-brand-orange resize-none"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
            ></textarea>
            <button
              onClick={handleWABroadcast}
              className="flex items-center justify-center gap-2 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold transition"
            >
              <Send size={18} />
              Buka WhatsApp & Kirim Broadcast
            </button>
          </div>
          <div className="w-full md:w-1/3 space-y-4">
            <div className="bg-dark-bg/60 border border-dark-border rounded-lg p-4">
              <h4 className="text-xs uppercase font-mono text-gray-400 tracking-wider mb-3">Auto Caption Rapat</h4>
              <div className="space-y-3">
                <select
                  className="w-full bg-dark-surface border border-dark-border rounded p-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                  value={meetingCategory}
                  onChange={(e) => setMeetingCategory(e.target.value)}
                >
                  <option value="Rapat Kerja">Rapat Kerja</option>
                  <option value="Rabuan">Rabuan</option>
                  <option value="Rapat Presidium Inti">Rapat Presidium Inti</option>
                  <option value="Rapat Divisi">Rapat Divisi</option>
                </select>
                {meetingCategory === "Rapat Divisi" && (
                  <input
                    type="text"
                    placeholder="Nama Divisi (Cth: PSDAM)"
                    className="w-full bg-dark-surface border border-dark-border rounded p-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                    value={meetingDivision}
                    onChange={(e) => setMeetingDivision(e.target.value)}
                  />
                )}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-mono">Hari & Tanggal</label>
                  <input
                    type="date"
                    className="w-full bg-dark-surface border border-dark-border rounded p-2 text-xs text-white focus:outline-none focus:border-brand-orange [color-scheme:dark]"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-mono">Waktu</label>
                  <input
                    type="time"
                    className="w-full bg-dark-surface border border-dark-border rounded p-2 text-xs text-white focus:outline-none focus:border-brand-orange [color-scheme:dark]"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                  />
                </div>
                <input
                  type="text"
                  placeholder="Tempat (Cth: Pojok Coffe)"
                  className="w-full bg-dark-surface border border-dark-border rounded p-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                  value={meetingLocation}
                  onChange={(e) => setMeetingLocation(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Topik Kegiatan (Opsional)"
                  className="w-full bg-dark-surface border border-dark-border rounded p-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                />
                <button
                  onClick={generateMeetingCaption}
                  className="w-full bg-brand-orange/20 hover:bg-brand-orange/30 text-brand-orange border border-brand-orange/50 py-2 rounded text-xs font-semibold transition"
                >
                  Generate Caption
                </button>
              </div>
            </div>
            
            <div className="bg-dark-bg/60 border border-dark-border rounded-lg p-4">
              <h4 className="text-xs uppercase font-mono text-gray-400 tracking-wider mb-3">Template Lain</h4>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setBroadcastMessage("Halo semuanya, ada pengumuman penting terkait program kerja kita...")}
                  className="text-center bg-dark-surface hover:bg-brand-orange/10 border border-dark-border hover:border-brand-orange/50 p-2 rounded text-[10px] text-gray-300 transition"
                >
                  Proker
                </button>
                <button 
                  onClick={() => setBroadcastMessage("Terima kasih atas partisipasi teman-teman dalam kegiatan hari ini. Evaluasi akan...")}
                  className="text-center bg-dark-surface hover:bg-brand-orange/10 border border-dark-border hover:border-brand-orange/50 p-2 rounded text-[10px] text-gray-300 transition"
                >
                  Terima Kasih
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
