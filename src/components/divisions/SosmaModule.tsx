import React, { useState } from "react";
import { Heart, Users, MapPin, HandMetal, Plus, Check } from "lucide-react";

interface Volunteer {
  name: string;
  npm: string;
  phone: string;
  activityName: string;
}

export default function SosmaModule() {
  const [vols, setVols] = useState<Volunteer[]>([
    { name: "Mahendra Sulistyo", npm: "2201104", phone: "0812993188", activityName: "Bakti Sosial Desa Karang Taruna" },
    { name: "Rina Wulandari", npm: "2201115", phone: "0852119932", activityName: "Bakti Sosial Desa Karang Taruna" },
    { name: "Zaky Iskandar", npm: "2201211", phone: "0877221199", activityName: "Donor Darah Universitas" }
  ]);

  const [volName, setVolName] = useState("");
  const [volNpm, setVolNpm] = useState("");
  const [volPhone, setVolPhone] = useState("");
  const [volAct, setVolAct] = useState("Bakti Sosial Desa Karang Taruna");
  
  const [showRegSuccess, setShowRegSuccess] = useState(false);

  const mockDonations = [
    { title: "Donasi Musibah Banjir Wilayah Utara", raised: 3450000, target: 5000000, percentage: 69 },
    { title: "Renovasi Pojok Baca Dusun Harapan", raised: 1850000, target: 2000000, percentage: 92 },
    { title: "Beasiswa Sembako Anak Yatim", raised: 750000, target: 3000000, percentage: 25 }
  ];

  const mockActivities = [
    { name: "Bakti Sosial Desa Karang Taruna", date: "10 Juni 2026", location: "Dusun Kidul RT.04/05", status: "Ongoing" },
    { name: "Donor Darah Universitas", date: "18 Juni 2026", location: "Selasar Auditorium Lantai 1", status: "Planning" },
    { name: "Sosialisasikan Internet Pintar Anak", date: "02 Juli 2026", location: "SDN 1 Pasir Putih", status: "Planning" }
  ];

  const handleVolRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volName || !volNpm) return;

    const newVol: Volunteer = {
      name: volName,
      npm: volNpm,
      phone: volPhone || "08xxxxxxxxx",
      activityName: volAct
    };

    setVols([newVol, ...vols]);
    setVolName("");
    setVolNpm("");
    setVolPhone("");
    
    setShowRegSuccess(true);
    setTimeout(() => setShowRegSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase font-mono mb-2">Kegiatan Aktif</div>
          <div className="text-3xl font-display font-bold text-white">5</div>
          <div className="text-xs text-brand-orange mt-2">
            3 Sedang Tahap Survey
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase font-mono mb-2">Total Donasi Terkumpul</div>
          <div className="text-3xl font-display font-bold text-white">Rp 6.050.000</div>
          <div className="text-xs text-green-500 mt-2">
            Tersalurkan Transparan
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase font-mono mb-2">Relawan Terdaftar</div>
          <div className="text-3xl font-display font-bold text-white">{vols.length + 80}</div>
          <div className="text-xs text-blue-400 mt-2">
            Anggota & Mahasiswa Umum
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase font-mono mb-2">Desa Binaan HIMA</div>
          <div className="text-3xl font-display font-bold text-white">1</div>
          <div className="text-xs text-purple-400 mt-2">
            Kerja sama berkelanjutan
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PENGGALANGAN DANA SOSIAL */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-dark-border pb-3">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Heart className="text-brand-orange" size={20} />
              Kampanye Donasi Sosial SOSMA
            </h3>
            <span className="text-xs text-gray-400 font-mono">Buku Kas Sosial</span>
          </div>

          <div className="space-y-4">
            {mockDonations.map((d, index) => (
              <div key={index} className="bg-dark-bg border border-dark-border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-xs text-white max-w-[280px]">{d.title}</h4>
                  <span className="text-xs text-brand-orange font-bold">{d.percentage}%</span>
                </div>
                {/* ProgressBar */}
                <div className="relative w-full h-2 bg-dark-surface rounded-full overflow-hidden border border-dark-border/40">
                  <div 
                    className="h-full bg-brand-orange rounded-full transition-all duration-300"
                    style={{ width: `${d.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Terkumpul: Rp {d.raised.toLocaleString("id")}</span>
                  <span>Target: Rp {d.target.toLocaleString("id")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* REGISTER VOLUNTEER BARU */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 border-b border-dark-border pb-3">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Users className="text-brand-orange" size={20} />
              Open Recruitment Volunteer (Simulasi)
            </h3>
            <span className="text-xs text-gray-400 font-mono">Form Pendaftaran</span>
          </div>

          {showRegSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs p-3 rounded-lg flex items-center gap-2 mb-4 animate-none">
              <Check size={16} /> Anda berhasil mendaftar sebagai relawan bantuan sosial!
            </div>
          )}

          <form onSubmit={handleVolRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-gray-500">Nama Relawan</label>
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                  value={volName}
                  onChange={(e) => setVolName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-gray-500">NPM Mahasiswa</label>
                <input
                  type="text"
                  placeholder="cth. 2201104"
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                  value={volNpm}
                  onChange={(e) => setVolNpm(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-gray-500">Pilih Aksi Bakti Sosial</label>
              <select
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                value={volAct}
                onChange={(e) => setVolAct(e.target.value)}
              >
                {mockActivities.map((act, i) => (
                  <option key={i} value={act.name}>{act.name} ({act.date})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-gray-500">Nomor WhatsApp</label>
              <input
                type="text"
                placeholder="cth. 0812999xxx"
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                value={volPhone}
                onChange={(e) => setVolPhone(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold py-2 rounded transition flex items-center justify-center gap-1.5"
            >
              <HandMetal size={14} /> Daftar Sebagai Relawan Pendamping
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KEGIATAN BAKTI SOSIAL TIMELINE */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
            <MapPin className="text-brand-orange" size={20} />
            Jadwal Bakti Sosial & Lokasi Pengabdian
          </h3>
          <div className="space-y-3">
            {mockActivities.map((act, index) => (
              <div key={index} className="bg-dark-bg p-3 border border-dark-border rounded-lg flex items-start justify-between">
                <div>
                  <div className="font-semibold text-xs text-white">{act.name}</div>
                  <div className="text-[10px] text-gray-400 mt-1">📍 {act.location}</div>
                  <div className="text-[9px] text-gray-500 mt-2 font-mono">📅 {act.date}</div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                  act.status === "Ongoing" ? "bg-brand-orange/15 text-brand-orange" : "bg-blue-500/15 text-blue-400"
                }`}>
                  {act.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* LIST RELAWAN YANG BERDAFTAR */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <h3 className="font-display font-semibold text-lg text-white mb-4 flex items-center gap-2">
            <Users className="text-brand-orange" size={20} />
            Buku Register Relawan Terdaftar
          </h3>

          <div className="max-h-[160px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121215] text-gray-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-2">Nama</th>
                  <th className="p-2">NPM</th>
                  <th className="p-2">Aksi Sosial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {vols.map((v, i) => (
                  <tr key={i}>
                    <td className="p-2 text-white font-medium">{v.name}</td>
                    <td className="p-2 text-gray-400 font-mono">{v.npm}</td>
                    <td className="p-2 text-brand-orange max-w-[160px] truncate">{v.activityName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
