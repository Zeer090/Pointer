import React, { useState } from "react";
import { User, Division } from "../types";
import { 
  BarChart2, CheckSquare, Calendar, Users, 
  MessageSquare, Trophy, ShoppingBag, ShieldAlert,
  GraduationCap, Monitor, Heart, Sparkles, DollarSign, FileText,
  LogOut, ChevronLeft, ChevronRight, Menu 
} from "lucide-react";
import pointerLogo from "../assets/images/pointer_logo_clean_1780038118432.png";

interface SidebarProps {
  currentUser: User | null;
  divisions: Division[];
  currentPage: string;
  onNavigate: (pageId: string) => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentUser,
  divisions,
  currentPage,
  onNavigate,
  onLogout
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!currentUser) return null;

  // Render navigation lists depending on current user privileges
  const getNavItems = () => {
    if (currentUser.role === "admin") {
      return [
        { section: "Core Control", items: [
          { id: "dashboard", label: "Dashboard", icon: <BarChart2 size={16} /> },
          { id: "approval", label: "Approval Proker", icon: <CheckSquare size={16} />, badge: "Pending" },
          { id: "programs", label: "Program Kerja", icon: <Calendar size={16} /> },
          { id: "users", label: "Kelola User", icon: <Users size={16} /> }
        ]},
        { section: "Divisi Himpunan", items: [
          { id: "psdam", label: "PSDAM (Kader)", icon: <GraduationCap size={16} /> },
          { id: "medinfo", label: "MEDINFO (Media)", icon: <Monitor size={16} /> },
          { id: "minbat", label: "Minat Bakat", icon: <Trophy size={16} /> },
          { id: "sosma", label: "SOSMA (Sosial)", icon: <Heart size={16} /> },
          { id: "kimas", label: "KIMAS (Bisnis)", icon: <ShoppingBag size={16} /> },
          { id: "keuangan", label: "Keuangan", icon: <DollarSign size={16} /> },
          { id: "administrasi", label: "Administrasi", icon: <FileText size={16} /> }
        ]}
      ];
    } else if (currentUser.role === "divisi") {
      const activeDivObj = divisions.find(d => d.id === currentUser.division_id);
      const divLabel = activeDivObj ? activeDivObj.name : "Divisi Saya";
      const divSlug = activeDivObj ? activeDivObj.id.replace("div-", "") : "psdam";

      const divisionIcons: Record<string, React.ReactNode> = {
        psdam: <GraduationCap size={16} />,
        medinfo: <Monitor size={16} />,
        minbat: <Trophy size={16} />,
        sosma: <Heart size={16} />,
        kimas: <ShoppingBag size={16} />,
        keuangan: <DollarSign size={16} />,
        administrasi: <FileText size={16} />
      };

      return [
        { section: "Umum", items: [
          { id: "dashboard", label: "Dashboard", icon: <BarChart2 size={16} /> },
          { id: "programs", label: "Program Kerja", icon: <Calendar size={16} /> }
        ]},
        { section: "Fokus Kerja", items: [
          { id: divSlug, label: divLabel, icon: divisionIcons[divSlug] || <Sparkles size={16} /> }
        ]}
      ];
    } else {
      // Mahasiswa Umum
      return [
        { section: "Akses Mahasiswa", items: [
          { id: "dashboard", label: "Beranda", icon: <BarChart2 size={16} /> },
          { id: "programs", label: "Program Kerja", icon: <Calendar size={16} /> },
          { id: "aspirasi", label: "Aspirasi Saya", icon: <MessageSquare size={16} /> },
          { id: "lomba", label: "Daftar Perlombaan", icon: <Trophy size={16} /> },
          { id: "shop", label: "Toko KIMAS Store", icon: <ShoppingBag size={16} /> }
        ]}
      ];
    }
  };

  const navGroups = getNavItems();

  return (
    <aside 
      className={`bg-dark-surface border-r border-dark-border flex flex-col h-screen text-gray-300 transition-all duration-300 relative z-30 select-none ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* BRAND HEADER */}
      <div className="h-16 border-b border-dark-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 select-none ease-out duration-300 transform hover:scale-110">
            <img
              id="sidebar-pointer-logo"
              src={pointerLogo}
              alt="POINTER Logo"
              className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(249,115,22,0.3)]"
              referrerPolicy="no-referrer"
            />
          </div>
          {!isCollapsed && (
            <span className="font-display font-bold text-sm text-white tracking-widest whitespace-nowrap">
              POINTER <span className="text-brand-orange text-[10px]">SYSTEM</span>
            </span>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-500 hover:text-white p-1 rounded-lg transition"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* RENDER LINKS */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="text-[9px] font-mono uppercase text-gray-600 tracking-wider px-3 mb-1.5">
                {group.section}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive 
                      ? "bg-brand-orange/10 text-brand-orange border-l-2 border-brand-orange" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <span className={`${isActive ? "text-brand-orange" : "text-zinc-500"}`}>{item.icon}</span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span className="ml-auto text-[9px] bg-brand-orange/20 text-brand-orange border border-brand-orange/30 px-1.5 py-0.5 rounded font-mono font-bold animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* USER ACCOUNT BAR */}
      <div className="p-3 border-t border-dark-border bg-dark-bg/20">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-2 bg-zinc-950 border border-zinc-800 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-orange to-red-600 flex items-center justify-center font-display font-black text-xs text-white">
              {currentUser.name[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate leading-tight">{currentUser.name}</div>
              <div className="text-[10px] text-zinc-500 truncate mt-0.5 capitalize">{currentUser.role}</div>
            </div>
            <button 
              onClick={onLogout}
              className="p-1 hover:text-red-500 text-zinc-500 hover:text-red-500 rounded transition"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center p-2 hover:bg-zinc-900 hover:text-red-500 text-zinc-500 rounded-xl transition"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
