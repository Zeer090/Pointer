import React, { useState } from "react";
import { FinancialReport } from "../../types";
import { DollarSign, ArrowUpRight, ArrowDownRight, Printer, AlertTriangle, CheckSquare, Plus } from "lucide-react";

interface KeuanganModuleProps {
  financials: FinancialReport[];
  onSubmitFinancial: (title: string, income: number, expense: number, file: string, type: "income" | "expense") => void;
}

export default function KeuanganModule({ financials, onSubmitFinancial }: KeuanganModuleProps) {
  const [finTitle, setFinTitle] = useState("");
  const [finAmount, setFinAmount] = useState("");
  const [finType, setFinType] = useState<"income" | "expense">("income");
  const [finFile, setFinFile] = useState("");

  const [activeRABView, setActiveRABView] = useState<number | null>(null);

  const mockRABProposals = [
    { id: "rab-1", div: "div-psdam", event: "Workshop Web Dev 2026", total: 4500000, desc: "Catering 50 Box, Sewa Ruangan, Sertifikat Cetak, Pemateri Industri.", status: "approved" },
    { id: "rab-2", div: "div-sosma", event: "Aksi Sosial Desa Binaan", total: 2800000, desc: "Sewa mobil angkut logistic, pengadaan buku pojok baca, konsumsi relawan.", status: "approved" },
    { id: "rab-3", div: "div-minbat", event: "Lomba Desain Grafis Nasional", total: 1200000, desc: "Sertifikat ber-QR Code, hadiah uang pembinaan juara 1-3, sewa link panit.", status: "pending" },
    { id: "rab-4", div: "div-psdam", event: "Pelatihan Public Speaking & Debat", total: 800000, desc: "Sewa mic wireless eksternal, snack box, honor pemateri internal.", status: "pending" }
  ];

  const handleFinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!finTitle || !finAmount) return;

    const amountNum = Number(finAmount);
    const inc = finType === "income" ? amountNum : 0;
    const exp = finType === "expense" ? amountNum : 0;
    
    onSubmitFinancial(finTitle, inc, exp, finFile || "Bukti_Transaksi.pdf", finType);
    
    setFinTitle("");
    setFinAmount("");
    setFinFile("");
  };

  // Aggregators
  const totalIncome = financials.reduce((acc, f) => acc + f.income, 0);
  const totalExpense = financials.reduce((acc, f) => acc + f.expense, 0);
  const balance = totalIncome - totalExpense;

  const handleSimulatePDF = () => {
    // Generate structured print view
    const printContent = `
      ====================================================
               HIMA POINTER - KAS KEUANGAN RESMI
      ====================================================
      Total Pemasukan   : Rp ${totalIncome.toLocaleString("id")}
      Total Pengeluaran : Rp ${totalExpense.toLocaleString("id")}
      SALDO BERJALAN    : Rp ${balance.toLocaleString("id")}
      
      Daftar Ledger Transaksi Terakhir:
      ${financials.map(f => `- [${f.date}] ${f.title} | ${f.income > 0 ? "Masuk: Rp " + f.income.toLocaleString("id") : "Keluar: Rp " + f.expense.toLocaleString("id")}`).join("\n")}
      ====================================================
      Dokumen ini sah dirilis secara digital oleh Sistem Keuangan POINTER.
    `;
    alert(`📄 [SIMULASI DOWNLOAD PDF]\n\nMelakukan export laporan arus kas ke berkas 'POINTER_Financial_Report.pdf':\n\n${printContent}`);
  };

  return (
    <div className="space-y-6">
      {/* LEDGER STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-xs font-mono uppercase">Total Kas Masuk</div>
            <div className="text-2xl font-display font-bold text-green-400 mt-1">
              Rp {totalIncome.toLocaleString("id")}
            </div>
            <div className="text-[10px] text-gray-500 mt-2 font-mono">Arus masukan anggota + KIMAS</div>
          </div>
          <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-400">
            <ArrowUpRight size={20} />
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-xs font-mono uppercase">Total Kas Belanja</div>
            <div className="text-2xl font-display font-bold text-red-400 mt-1">
              Rp {totalExpense.toLocaleString("id")}
            </div>
            <div className="text-[10px] text-gray-500 mt-2 font-mono">Belanja Proker & Operasional</div>
          </div>
          <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
            <ArrowDownRight size={20} />
          </div>
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-xs font-mono uppercase">Saldo Organisasi</div>
            <div className="text-2xl font-display font-bold text-white mt-1">
              Rp {balance.toLocaleString("id")}
            </div>
            <div className="text-[10px] text-brand-orange mt-2 font-mono">Dana yang dapat digunakan</div>
          </div>
          <div className="w-10 h-10 bg-brand-orange/10 rounded-full flex items-center justify-center text-brand-orange">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEDGER ARUS KAS */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 border-b border-dark-border pb-3">
            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <DollarSign className="text-brand-orange" size={20} />
              Buku Besar Ledger Arus Kas
            </h3>
            <button 
              onClick={handleSimulatePDF}
              className="bg-[#19191d] hover:bg-brand-orange hover:text-white border border-dark-border text-gray-400 font-mono text-[10px] uppercase px-3 py-1.5 rounded transition flex items-center gap-1"
            >
              <Printer size={12} /> Export PDF
            </button>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
            {financials.map((f) => (
              <div key={f.id} className="bg-dark-bg p-3 border border-dark-border rounded-lg flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-semibold text-xs text-white leading-normal">{f.title}</h4>
                  <div className="text-[10px] text-gray-500 font-mono">
                    Tanggal: {f.date} · File: <span className="text-brand-orange underline cursor-pointer">{f.file}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-mono font-bold ${f.income > 0 ? "text-green-400" : "text-red-400"}`}>
                    {f.income > 0 ? `+ Rp ${f.income.toLocaleString("id")}` : `- Rp ${f.expense.toLocaleString("id")}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FINANCIAL RECORD ENTRY FORM */}
        <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
          <h3 className="font-display font-bold text-lg text-white mb-4 border-b border-dark-border pb-3 flex items-center gap-2">
            <Plus className="text-brand-orange" size={20} />
            Catat Transaksi Manual (Kas Himpunan)
          </h3>

          <form onSubmit={handleFinSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-gray-400">Deskripsi Transaksi</label>
              <input
                type="text"
                placeholder="cth. Kontribusi Anggota untuk Musyawarah"
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-orange"
                value={finTitle}
                onChange={(e) => setFinTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-gray-400">Pilih Jenis Arus</label>
                <select
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none"
                  value={finType}
                  onChange={(e: any) => setFinType(e.target.value)}
                >
                  <option value="income">Kas Masuk (Inflow)</option>
                  <option value="expense">Belanja / Kas Keluar (Outflow)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-gray-400">Volume Dana (Rupiah)</label>
                <input
                  type="number"
                  placeholder="Rp"
                  className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none"
                  value={finAmount}
                  onChange={(e) => setFinAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase text-gray-400">Upload Nota Bukti / Proposal Sponsor (Lampiran)</label>
              <input
                type="text"
                placeholder="cth. Invoice_Sewa_Aula.pdf"
                className="w-full bg-dark-bg border border-dark-border rounded px-3 py-2 text-xs text-white focus:outline-none"
                value={finFile}
                onChange={(e) => setFinFile(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white text-xs font-semibold py-2.5 rounded transition"
            >
              Catat Arus Kas Masuk/Keluar
            </button>
          </form>
        </div>
      </div>

      {/* ANGGARAN BELANJA (RAB) SUBMISSIONS */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6">
        <h3 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="text-yellow-500" size={20} />
          Rencana Anggaran Belanja (RAB) Proposal Terlampir
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockRABProposals.map((rab) => (
            <div 
              key={rab.id} 
              onClick={() => setActiveRABView(activeRABView === rab.id ? null : rab.id)}
              className="bg-dark-bg border border-dark-border hover:border-brand-orange/40 rounded-lg p-4 cursor-pointer transition space-y-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-xs text-white">{rab.event}</h4>
                  <span className="text-[10px] text-gray-500 font-mono">{rab.div.replace("div-", "").toUpperCase()} · {rab.id}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-brand-orange font-mono">Rp {rab.total.toLocaleString("id")}</div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    rab.status === "approved" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {rab.status}
                  </span>
                </div>
              </div>

              {activeRABView === rab.id && (
                <div className="pt-2 border-t border-dark-border text-[11px] text-gray-400 leading-relaxed font-mono">
                  <div className="text-white font-bold mb-1">Rincian Anggaran:</div>
                  {rab.desc}
                  {rab.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <button className="bg-brand-orange text-white text-[9px] px-2 py-1 rounded">Setujui Pencairan Dana</button>
                      <button className="bg-dark-surface border border-dark-border text-gray-400 text-[9px] px-2 py-1 rounded">Bahas Kembali</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
