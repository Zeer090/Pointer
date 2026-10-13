import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User as UserIcon,
  RotateCcw,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  Code2,
} from "lucide-react";
import { FullDatabase, User } from "../types";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

interface AiChatbotProps {
  db: FullDatabase | null;
  currentUser: User | null;
  onRefreshDb?: () => void;
  onToast?: (msg: string) => void;
}

const STORAGE_KEY = "pointer_ai_chat_history_v2";

const STUDENT_PROMPTS = [
  { label: "💡 Sampaikan Aspirasi", prompt: "Saya mau ngajuin aspirasi tentang akademik: Jadwal praktikum mohon tidak bentrok dengan kelas teori." },
  { label: "📅 Info Agenda & Proker", prompt: "Apa saja agenda dan program kerja HIMA POINTER yang akan datang?" },
  { label: "👥 Pengurus Himpunan", prompt: "Siapa saja ketua umum dan pengurus HIMA POINTER saat ini?" },
  { label: "🛍️ Merchandise Toko", prompt: "Apa saja merchandise yang tersedia di toko KIMAS Store?" },
  { label: "📦 Pinjam Inventaris", prompt: "Bagaimana cara meminjam proyektor dan inventaris di web ini?" },
  { label: "💻 Belajar Coding", prompt: "Jelaskan cara kerja async/await di JavaScript dengan contoh sederhana." },
];

const STAFF_PROMPTS = [
  { label: "📝 Ajukan Proker Baru", prompt: "Buat proker baru: Workshop Web Development Modern, divisi PSDAM, tanggal 2026-11-20" },
  { label: "💰 Catat Kas Keuangan", prompt: "Catat kas masuk Rp500.000 untuk Iuran kas rutin pengurus himpunan" },
  { label: "💡 Cek Status Aspirasi", prompt: "Apa saja aspirasi mahasiswa yang saat ini perlu ditinjau?" },
  { label: "📢 Rilis Pengumuman", prompt: "Buat pengumuman: Rapat Pleno Pengurus akan diadakan hari Jumat jam 16.00 WIB di Sekretariat" },
  { label: "👥 Info Pengurus", prompt: "Siapa saja ketua umum dan pengurus HIMA POINTER saat ini?" },
];

/**
 * Komponen Renderer Markdown & Blok Kode Ringan
 */
function FormattedMessage({ text }: { text: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split teks berdasarkan code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockCount = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Teks sebelum codeblock
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {renderInlineMarkdown(text.slice(lastIndex, match.index))}
        </span>
      );
    }

    const lang = match[1] || "code";
    const codeContent = match[2].trimEnd();
    const currentBlockIdx = blockCount++;

    parts.push(
      <div
        key={`code-${match.index}`}
        className="my-2.5 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/90 shadow-md font-mono text-[10px]"
      >
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800/80 text-zinc-400">
          <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
            <Code2 size={12} />
            <span>{lang}</span>
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyCode(codeContent, currentBlockIdx);
            }}
            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition px-2 py-0.5 rounded hover:bg-zinc-800"
          >
            {copiedIndex === currentBlockIdx ? (
              <>
                <Check size={11} className="text-emerald-400" />
                <span className="text-emerald-400">Tersalin</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-3 overflow-x-auto text-zinc-200 leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800">
          <code>{codeContent}</code>
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // Teks sisa setelah codeblock terakhir
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-tail`}>
        {renderInlineMarkdown(text.slice(lastIndex))}
      </span>
    );
  }

  return <div className="space-y-1">{parts}</div>;
}

/**
 * Format teks inline (heading, bold, quote, bullet, inline code)
 */
function renderInlineMarkdown(raw: string): React.ReactNode {
  const lines = raw.split("\n");

  return lines.map((line, lineIdx) => {
    // Heading 3
    if (line.startsWith("### ")) {
      return (
        <h4
          key={lineIdx}
          className="font-bold text-cyan-300 text-xs mt-2.5 mb-1 flex items-center gap-1.5 border-b border-cyan-900/40 pb-0.5"
        >
          {formatSpans(line.slice(4))}
        </h4>
      );
    }
    // Heading 2 / 1
    if (line.startsWith("## ") || line.startsWith("# ")) {
      return (
        <h3
          key={lineIdx}
          className="font-bold text-white text-xs mt-3 mb-1.5 text-cyan-200"
        >
          {formatSpans(line.replace(/^#+\s*/, ""))}
        </h3>
      );
    }
    // Blockquote
    if (line.startsWith("> ")) {
      return (
        <blockquote
          key={lineIdx}
          className="border-l-2 border-cyan-500/60 pl-2.5 my-1.5 text-zinc-300 italic bg-cyan-950/20 py-1 rounded-r"
        >
          {formatSpans(line.slice(2))}
        </blockquote>
      );
    }
    // Bullet item
    if (line.match(/^[\*\-•]\s+/)) {
      return (
        <div key={lineIdx} className="flex items-start gap-1.5 my-0.5 pl-1 text-zinc-200">
          <span className="text-cyan-400 mt-1 flex-shrink-0 text-[8px]">●</span>
          <span>{formatSpans(line.replace(/^[\*\-•]\s+/, ""))}</span>
        </div>
      );
    }
    // Baris kosong
    if (!line.trim()) {
      return <div key={lineIdx} className="h-1.5" />;
    }

    return (
      <p key={lineIdx} className="leading-relaxed">
        {formatSpans(line)}
      </p>
    );
  });
}

/**
 * Format bold (**text**), italic (*text*), dan inline code (`code`)
 */
function formatSpans(text: string): React.ReactNode {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, i) => {
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-300 font-mono text-[10px] border border-zinc-700/60"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return (
        <em key={i} className="italic text-zinc-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}

export default function AiChatbot({ db, currentUser, onRefreshDb, onToast }: AiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Streaming Typewriter State
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [displayedChars, setDisplayedChars] = useState<number>(0);

  // Text to Speech State
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const isStaff = currentUser?.role === "admin" || currentUser?.role === "divisi";
  const activePrompts = isStaff ? STAFF_PROMPTS : STUDENT_PROMPTS;

  const getInitialGreeting = useCallback((): Message => {
    return {
      id: "welcome-init",
      role: "model",
      text: `Halo ${currentUser ? currentUser.name : "Rekan Mahasiswa"}! 👋\n\nSaya **POINTER AI**, asisten cerdas serba bisa HIMA POINTER Politeknik Negeri Lampung.\n\nSaya siap membantu:\n• 📅 **Info & Agenda:** Program kerja, struktur himpunan, toko KIMAS, & inventaris\n• 💡 **Layanan Mahasiswa:** Menyampaikan aspirasi & keluhan perkuliahan\n• 🧠 **Tanya Apa Saja:** Sains, coding/pemrograman, materi kuliah, atau ngobrol santai!\n\nAda yang bisa saya bantu hari ini?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }, [currentUser]);

  // Load chat history from localStorage on initial mount
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [getInitialGreeting()];
  });

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading, displayedChars]);

  // Typewriter Streaming Timer
  useEffect(() => {
    if (!streamingMessageId) return;

    const targetMsg = messages.find((m) => m.id === streamingMessageId);
    if (!targetMsg) {
      setStreamingMessageId(null);
      return;
    }

    if (displayedChars >= targetMsg.text.length) {
      setStreamingMessageId(null);
      return;
    }

    // Kecepatan adaptif: 12-25 karakter per tick agar responsif dan tidak lama
    const step = targetMsg.text.length > 300 ? 16 : 8;
    const timer = setTimeout(() => {
      setDisplayedChars((prev) => Math.min(prev + step, targetMsg.text.length));
    }, 20);

    return () => clearTimeout(timer);
  }, [streamingMessageId, displayedChars, messages]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Text-To-Speech (Suara AI)
  const handleToggleSpeech = (id: string, text: string) => {
    if (speakingMessageId === id) {
      window.speechSynthesis?.cancel();
      setSpeakingMessageId(null);
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      // Bersihkan karakter markdown agar suaranya natural
      const cleanText = text
        .replace(/[*#`_>]/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/\n+/g, ". ");

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "id-ID";
      utterance.rate = 1.05;

      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);

      window.speechSynthesis.speak(utterance);
      setSpeakingMessageId(id);
    } else {
      onToast?.("Browser kamu belum mendukung audio suara.");
    }
  };

  const handleReset = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    setStreamingMessageId(null);
    localStorage.removeItem(STORAGE_KEY);
    const freshGreeting: Message = {
      id: "welcome-" + Date.now(),
      role: "model",
      text: `Percakapan telah direset. Silakan tanyakan hal apa saja seputar sistem HIMA POINTER, coding, atau topik lainnya! 😊`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([freshGreeting]);
    onToast?.("Riwayat obrolan berhasil direset.");
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    // Hentikan suara jika sedang bicara
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);

    // Selesaikan streaming pesan sebelumnya jika ada
    setStreamingMessageId(null);

    const userMsg: Message = {
      id: "usr-" + Date.now(),
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const contextData = {
      user: currentUser
        ? { name: currentUser.name, role: currentUser.role, jabatan: currentUser.jabatan, division_id: currentUser.division_id, email: currentUser.email }
        : "Tamu/Pengunjung Publik",
      stats: {
        totalPrograms: db?.programs?.length || 0,
        activePrograms: db?.programs?.filter((p) => p.status === "ongoing" || p.status === "planning")?.length || 0,
        totalAspirations: db?.aspirations?.length || 0,
        pendingAspirations: db?.aspirations?.filter((a) => a.status === "pending")?.length || 0,
        totalTransactions: db?.transactions?.length || 0,
        totalAnnouncements: db?.announcements?.length || 0,
      },
    };

    const historyPayload = messages.map((m) => ({
      role: m.role,
      text: m.text,
    }));

    try {
      const token = localStorage.getItem("pointer_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          context: contextData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghubungi AI");
      }

      const botMsgId = "bot-" + Date.now();
      const botMsg: Message = {
        id: botMsgId,
        role: "model",
        text: data.reply || "Maaf, tidak ada respon dari AI.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);

      // Aktifkan efek typewriter untuk pesan baru
      setStreamingMessageId(botMsgId);
      setDisplayedChars(0);

      // Jika ada aksi database yang dieksekusi secara otomatis oleh AI
      if (data.actionExecuted && data.actionExecuted.type !== "NONE") {
        onRefreshDb?.();
        window.dispatchEvent(new CustomEvent("pointer:db-refresh", { detail: data }));
        onToast?.("⚡ Aksi database berhasil dieksekusi otomatis oleh AI Agent!");
      }
    } catch (err: any) {
      let friendlyError = err?.message || "Koneksi terputus.";
      if (friendlyError.includes("503") || friendlyError.includes("high demand") || friendlyError.includes("UNAVAILABLE")) {
        friendlyError = "Layanan AI sedang sibuk sementara. Silakan coba tanyakan kembali.";
      }
      const errorMsg: Message = {
        id: "err-" + Date.now(),
        role: "model",
        text: `⚠️ **Info Sistem:**\n\n${friendlyError}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white shadow-xl shadow-cyan-950/60 hover:shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all text-xs border border-cyan-400/30 group"
          aria-label="Buka Chatbot AI"
        >
          <div className="relative">
            <Sparkles size={16} className="text-cyan-200 animate-pulse group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
          </div>
          <span className="font-display font-bold">Tanya POINTER AI</span>
        </button>
      )}

      {/* CHATBOT DRAWER / MODAL */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[460px] h-[640px] max-h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-zinc-950/95 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl shadow-black/90 animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-cyan-950/50 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center p-0.5 shadow-md shadow-cyan-950">
                <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                  <Bot size={18} className="text-cyan-400" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-bold text-white text-xs tracking-wide">
                    POINTER AI Assistant
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-400 font-mono border border-cyan-800/40">
                    Smart Agent
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Terhubung ke Database & Asisten Cerdas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Reset percakapan & hapus riwayat"
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => {
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setSpeakingMessageId(null);
                  setIsOpen(false);
                }}
                title="Tutup chat"
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* SYSTEM STATUS BADGE */}
          <div className="px-3.5 py-1.5 bg-cyan-950/30 border-b border-cyan-900/30 flex items-center justify-between text-[10px] text-cyan-300">
            <span className="flex items-center gap-1.5 truncate">
              <ShieldCheck size={12} className="text-cyan-400 flex-shrink-0" />
              <span>
                Pengguna: <strong className="text-white">{currentUser ? currentUser.name : "Pengunjung"}</strong>
                {currentUser && ` (${currentUser.jabatan || currentUser.role})`}
              </span>
            </span>
            <span className="text-zinc-400 text-[9px] font-mono flex items-center gap-1 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Aktif
            </span>
          </div>

          {/* MESSAGES SCROLL CONTAINER */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
            {messages.map((m) => {
              const isUser = m.role === "user";
              const isStreamingThis = m.id === streamingMessageId;
              const textToRender = isStreamingThis ? m.text.slice(0, displayedChars) : m.text;

              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={13} className="text-cyan-400" />
                    </div>
                  )}

                  <div
                    onClick={() => {
                      // Klik bubble untuk langsung menyelesaikan efek ketik jika sedang streaming
                      if (isStreamingThis) {
                        setDisplayedChars(m.text.length);
                        setStreamingMessageId(null);
                      }
                    }}
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed transition-all cursor-default ${
                      isUser
                        ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-tr-xs shadow-md shadow-cyan-950/40"
                        : "bg-zinc-900/90 text-zinc-200 border border-zinc-800/80 rounded-tl-xs shadow-md shadow-black/40 hover:border-zinc-700/60"
                    }`}
                  >
                    <div className="break-words text-[11px] font-sans">
                      {isUser ? (
                        <div className="whitespace-pre-wrap">{m.text}</div>
                      ) : (
                        <div>
                          <FormattedMessage text={textToRender} />
                          {isStreamingThis && (
                            <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-cyan-400 animate-pulse align-middle" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-white/10 text-[9px] opacity-70">
                      <span>{m.timestamp}</span>

                      {!isUser && (
                        <div className="flex items-center gap-2">
                          {/* Tombol Suara (TTS) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSpeech(m.id, m.text);
                            }}
                            className="hover:opacity-100 flex items-center gap-1 transition text-zinc-400 hover:text-cyan-300"
                            title={speakingMessageId === m.id ? "Hentikan Suara" : "Dengarkan Suara"}
                          >
                            {speakingMessageId === m.id ? (
                              <>
                                <VolumeX size={11} className="text-rose-400 animate-pulse" />
                                <span className="text-rose-400">Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 size={11} />
                                <span>Suara</span>
                              </>
                            )}
                          </button>

                          {/* Tombol Salin */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(m.id, m.text);
                            }}
                            className="hover:opacity-100 flex items-center gap-1 transition text-zinc-400 hover:text-white"
                            title="Salin jawaban"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check size={11} className="text-emerald-400" />
                                <span className="text-emerald-400">Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Salin</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-lg bg-teal-950 border border-teal-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <UserIcon size={12} className="text-teal-300" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800/50 flex items-center justify-center flex-shrink-0">
                  <Bot size={13} className="text-cyan-400 animate-spin" />
                </div>
                <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-2xl rounded-tl-xs px-3.5 py-2.5 flex items-center gap-2 text-zinc-400 text-[11px]">
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                  <span>POINTER AI sedang merumuskan jawaban...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPTS CHIPS */}
          <div className="px-3 py-2 bg-zinc-900/60 border-t border-zinc-800/80 overflow-x-auto scrollbar-none flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 pl-1 flex-shrink-0">
              <Zap size={11} className="text-amber-400" /> Cepat:
            </span>
            {activePrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(qp.prompt)}
                disabled={loading}
                className="flex-shrink-0 px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 border border-zinc-700/60 text-[10px] text-zinc-300 hover:text-white transition whitespace-nowrap"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* INPUT FORM */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya info himpunan, coding, sains, atau curhat..."
              disabled={loading}
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-950 flex items-center justify-center flex-shrink-0"
              aria-label="Kirim Pesan"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
