import React, { useState } from "react";
import { Talent } from "../../types";
import { Award, Search, Trophy, Compass, Plus, FileText, Check } from "lucide-react";

interface MinbatModuleProps {
  talents: Talent[];
  onSubmitTalent: (studentName: string, talent: string, achievement: string, certificate: string) => void;
}

export default function MinbatModule({ talents, onSubmitTalent }: MinbatModuleProps) {
  const [searchVal, setSearchVal] = useState("");
  const [formName, setFormName] = useState("");
  const [formTalent, setFormTalent] = useState("Software Engineering");
  const [formAchievement, setFormAchievement] = useState("");
  const [formCertFile, setFormCertFile] = useState("");
  
  const [successMsg, setSuccessMsg] = useState(false);

  const mockCompetitions = [
    { title: "Gemastik XIX 2026", scope: "Nasional", deadline: "20 Juni 2026", category: "Inovasi TIK", link: "https://gemastik.kemdikbud.go.id" },
    { title: "Hackathon Indonesia Satu", scope: "Nasional", deadline: "12 Juli 2026", category: "Software Development", link: "#" },
    { title: "Informatics Programming Contest", scope: "Internal Kampus", deadline: "18 Juni 2026", category: "Competitive Programming", link: "#" },
    { title: "National UI/UX Design Summit", scope: "Nasional", deadline: "05 Agustus 2026", category: "Design", link: "#" }
  ];

  const mockCommunities = [
    { name: "Pointer Dev Circle (PDC)", lead: "Yulia Safitri", members: 48, focus: "Programming & Project development" },
    { name: "E-Sport Squad HIMA", lead: "Mahendra S.", members: 26, focus: "Mobile Legends & Valorant Training" },
    { name: "Public Speaker Alliance", lead: "Nanda T.", members: 19, focus: "Debating, Presentation & Pitching" },
    { name: "Design & VFX Lab", lead: "Bella R.", members: 35, focus: "Graphic design, Figma & Video animation" }
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formAchievement) return;
    
    const certFilename = formCertFile ? formCertFile.split("\\").pop() || "sertifikat.pdf" : "Bukti_Prestasi.pdf";
    onSubmitTalent(formName, formTalent, formAchievement, certFilename);
    
    setFormName("");
    setFormAchievement("");
    setFormCertFile("");
    
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const filteredTalents = talents.filter(t => 
    t.student_name.toLowerCase().includes(searchVal.toLowerCase()) ||
    t.talent.toLowerCase().includes(searchVal.toLowerCase()) ||
    t.achievement.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* MINBAT STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase font-mono mb-2">Mahasiswa Terdata</div>
          <div className="text-3xl font-display font-bold text-white">186</div>
          <div className="text-xs text-brand-orange mt-2">
            75% Total Anggota Terdata
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase font-mono mb-2">Total Rekor Prestasi</div>
          <div className="text-3xl font-display font-bold text-white">{talents.length + 15}</div>
          <div className="text-xs text-green-500 mt-2 flex items-center gap-1">
            <span>⚽ +4 Medali Emas tahun ini</span>
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase font-mono mb-2 font-bold text-white">Lomba Berjalan</div>
          <div className="text-3xl font-display font-bold text-white">12</div>
          <div className="text-xs text-blue-400 mt-2">
            Diikuti delegasi HIMA
          </div>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase font-mono mb-2">Komunitas Minat</div>
          <div className="text-3xl font-display font-bold text-white">4</div>
          <div className="text-xs text-purple-400 mt-2">
            Interaksi mingguan reguler
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DIRECTORY TALENTA */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4 border-b border-dark-border pb-3">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Award className="text-brand-orange" size={20} />
              Database Bakat & Prestasi Mahasiswa
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari talenta/nama..."
                className="bg-dark-bg border border-dark-border rounded-full pl-8 pr-4 py-1 text-xs text-white focus:outline-none focus:border-brand-orange"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
              <Search className="absolute left-2.5 top-2 text-gray-500" size={12} />
            </div>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
            {filteredTalents.map((t) => (
              <div key={t.id} className="bg-dark-bg border border-dark-border p-4 rounded-lg flex items-start justify-between hover:border-brand-orange/40 transition">
                <div>
                  <h4 className="font-semibold text-white text-sm">{t.student_name}</h4>
                  <div className="text-xs text-orange-400 font-medium mt-1">Skill: {t.talent}</div>
                  <div className="text-xs text-gray-400 mt-2 flex items-center gap-1.5 bg-[#121215] p-2 rounded border border-dark-border">
                    <Trophy size={11} className="text-yellow-500" />
                    <span>{t.achievement}</span>
                  </div>
                </div>
                {t.certificate && (
                  <span className="flex items-center gap-1 font-mono text-[9px] bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20">
                    <FileText size={10} /> Certified
                  </span>
                )}
              </div>
            ))}
            {filteredTalents.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-xs">Tidak ada data talenta yang cocok untuk "{searchVal}".</div>
            )}
          </div>
        </div>

        {/* GOOGLE FORM INTEGRATION - SUBMIT TALENT & REGISTER PRESTASI */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 border-b border-dark-border pb-3">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Compass className="text-brand-orange" size={20} />
              Pendataan Minat Bakat (Form Digital)
            </h3>
            <span className="text-xs text-gray-400 font-mono">Simulasi Google Form</span>
          </div>

          {successMsg && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs p-3 rounded-lg flex items-center gap-2 mb-4">
              <Check size={16} /> Data bakat dan sertifikat prestasi berhasil terekam ke database!
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-mono text-gray-400">Nama Lengkap Mahasiswa</label>
              <input
                type="text"
                placeholder="cth. Mahendra Sulistyo"
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] uppercase font-mono text-gray-400">Minat / Bidang Bakat</label>
                <select
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange animate-none"
                  value={formTalent}
                  onChange={(e) => setFormTalent(e.target.value)}
                >
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Desain UI/UX & Figma">Desain UI/UX & Figma</option>
                  <option value="Competitive Programming">Competitive Programming</option>
                  <option value="Public Speaking & Debat">Public Speaking & Debat</option>
                  <option value="E-Sports Gaming">E-Sports Gaming</option>
                  <option value="Fotografi & Videografi">Fotografi & Videografi</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase font-mono text-gray-400">Nomor Telpon / WA</label>
                <input
                  type="text"
                  placeholder="0812xxxxxx"
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-mono text-gray-400">Riwayat Prestasi Terbesar (Sertifikasi Lomba)</label>
              <input
                type="text"
                placeholder="cth. Juara 2 Hackathon Inovasi Digital Nasional"
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                value={formAchievement}
                onChange={(e) => setFormAchievement(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] uppercase font-mono text-gray-400">Unggah Bukti Sertifikat / PDF Piagam</label>
              <input
                type="file"
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-gray-400 focus:outline-none cursor-pointer"
                value={formCertFile}
                onChange={(e) => setFormCertFile(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold py-2.5 rounded transition flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> Kirim Form Bakat & Sertifikat
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INFO LOMBA TERUPDATE */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Trophy className="text-brand-orange" size={20} />
            Info Perlombaan Eksternal Terkini (Delegasi)
          </h3>
          <div className="space-y-3">
            {mockCompetitions.map((mc, idx) => (
              <div key={idx} className="bg-dark-bg p-3 border border-dark-border rounded-lg flex items-center justify-between hover:border-brand-orange/20 transition">
                <div>
                  <h4 className="font-semibold text-xs text-white">{mc.title}</h4>
                  <div className="text-[10px] text-gray-400 mt-0.5">{mc.scope} · {mc.category}</div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-brand-orange/10 text-brand-orange font-mono px-2 py-0.5 rounded border border-brand-orange/20">
                    dl: {mc.deadline}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KOMUNITAS INTERN MAHASISWA */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <h3 className="font-display font-semibold text-lg text-white mb-4 flex items-center gap-2">
            <Compass className="text-brand-orange" size={20} />
            Komunitas Minat Pengurus HIMA POINTER
          </h3>
          <div className="space-y-3">
            {mockCommunities.map((c, idx) => (
              <div key={idx} className="bg-dark-bg p-3 border border-dark-border rounded-lg flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-xs text-white">{c.name}</h4>
                  <div className="text-[10px] text-gray-400 mt-1">Lead: {c.lead} · Focus: {c.focus}</div>
                </div>
                <span className="text-xs text-brand-orange font-mono bg-brand-orange/10 border border-brand-orange/20 px-2.5 py-0.5 rounded-full font-bold">
                  {c.members} Mbrs
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
