import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Table, 
  Upload, 
  BookOpen, 
  UserCheck, 
  LogOut,
  Menu,
  X,
  Layers,
  Radio,
  History,
  ChevronDown,
  ChevronRight,
  Archive
} from 'lucide-react';
import { AdminUser, RefSesi } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  admin: AdminUser | null;
  onLogout: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
  onOpenUploadJadwalModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  admin,
  onLogout,
  isOpenMobile,
  setIsOpenMobile,
  onOpenUploadJadwalModal,
}) => {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const isStatusLoginActive = activeTab === 'status-login' || activeTab === 'status-login-live';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Aside */}
      <aside 
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#525FE1] text-white flex flex-col shrink-0 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 text-xl font-bold border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center text-white font-black text-xs border border-white/30">
              H
            </div>
            <span className="tracking-tight">HPC-UG</span>
          </div>

          <button 
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden p-1 text-white/80 hover:text-white rounded-md hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: Upload Jadwal */}
        <div className="px-4 pt-4 pb-2">
          <button
            id="btn-sidebar-upload-jadwal-popup"
            onClick={() => {
              onOpenUploadJadwalModal();
              setIsOpenMobile(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-white text-[#525FE1] hover:bg-indigo-50 rounded-lg text-xs font-bold shadow-xs transition active:scale-98"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Jadwal</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {/* Dashboard */}
          <button
            id="nav-item-dashboard"
            onClick={() => {
              setActiveTab('dashboard');
              setIsOpenMobile(false);
            }}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition text-left ${
              activeTab === 'dashboard'
                ? 'bg-white/15 text-white shadow-xs font-semibold' 
                : 'text-white/70 hover:text-white hover:bg-white/5 opacity-85 hover:opacity-100'
            }`}
          >
            <div className={`w-5 h-5 flex items-center justify-center rounded-sm ${activeTab === 'dashboard' ? 'text-white' : 'text-white/80'}`}>
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span>Dashboard</span>
          </button>

          {/* Status Login Mahasiswa with Submenus */}
          <div className="space-y-1">
            <button
              id="nav-item-status-login-parent"
              onClick={() => {
                setStatusMenuOpen((prev) => !prev);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition text-left ${
                isStatusLoginActive
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-white/70 hover:text-white hover:bg-white/5 opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 flex items-center justify-center rounded-sm ${isStatusLoginActive ? 'text-white' : 'text-white/80'}`}>
                  <UserCheck className="w-4 h-4" />
                </div>
                <span>Status Login Mahasiswa</span>
              </div>
              <div>
                {statusMenuOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-white/70" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-white/70" />
                )}
              </div>
            </button>

            {/* Submenu container */}
            {statusMenuOpen && (
              <div className="pl-6 pr-1 py-1 space-y-1 border-l-2 border-white/20 ml-5">
                {/* Submenu 1: Live Status Login (Hari Ini) */}
                <button
                  id="nav-item-status-login-live"
                  onClick={() => {
                    setActiveTab('status-login-live');
                    setIsOpenMobile(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition text-left ${
                    activeTab === 'status-login-live'
                      ? 'bg-white/20 text-white font-bold shadow-xs'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Radio className={`w-3.5 h-3.5 ${activeTab === 'status-login-live' ? 'text-emerald-300 animate-pulse' : 'text-white/70'}`} />
                    <span>Live Status (Hari Ini)</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </button>

                {/* Submenu 2: Riwayat Login */}
                <button
                  id="nav-item-status-login-history"
                  onClick={() => {
                    setActiveTab('status-login');
                    setIsOpenMobile(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition text-left ${
                    activeTab === 'status-login'
                      ? 'bg-white/20 text-white font-bold shadow-xs'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Riwayat Login</span>
                </button>
              </div>
            )}
          </div>

          {/* Jadwal Mahasiswa */}
          <button
            id="nav-item-jadwal"
            onClick={() => {
              setActiveTab('jadwal');
              setIsOpenMobile(false);
            }}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition text-left ${
              activeTab === 'jadwal'
                ? 'bg-white/15 text-white shadow-xs font-semibold' 
                : 'text-white/70 hover:text-white hover:bg-white/5 opacity-85 hover:opacity-100'
            }`}
          >
            <div className={`w-5 h-5 flex items-center justify-center rounded-sm ${activeTab === 'jadwal' ? 'text-white' : 'text-white/80'}`}>
              <Table className="w-4 h-4" />
            </div>
            <span>Jadwal Mahasiswa</span>
          </button>

          {/* Materi Mahasiswa */}
          <button
            id="nav-item-materi"
            onClick={() => {
              setActiveTab('materi');
              setIsOpenMobile(false);
            }}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition text-left ${
              activeTab === 'materi'
                ? 'bg-white/15 text-white shadow-xs font-semibold' 
                : 'text-white/70 hover:text-white hover:bg-white/5 opacity-85 hover:opacity-100'
            }`}
          >
            <div className={`w-5 h-5 flex items-center justify-center rounded-sm ${activeTab === 'materi' ? 'text-white' : 'text-white/80'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <span>Materi Mahasiswa</span>
          </button>

          {/* Referensi */}
          <button
            id="nav-item-referensi"
            onClick={() => {
              setActiveTab('referensi');
              setIsOpenMobile(false);
            }}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition text-left ${
              activeTab === 'referensi'
                ? 'bg-white/15 text-white shadow-xs font-semibold' 
                : 'text-white/70 hover:text-white hover:bg-white/5 opacity-85 hover:opacity-100'
            }`}
          >
            <div className={`w-5 h-5 flex items-center justify-center rounded-sm ${activeTab === 'referensi' ? 'text-white' : 'text-white/80'}`}>
              <Layers className="w-4 h-4" />
            </div>
            <span>Referensi Sesi & Kelas</span>
          </button>

          {/* Data Archive - Urutan paling bawah */}
          <button
            id="nav-item-archive"
            onClick={() => {
              setActiveTab('archive');
              setIsOpenMobile(false);
            }}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition text-left ${
              activeTab === 'archive'
                ? 'bg-white/15 text-white shadow-xs font-semibold' 
                : 'text-white/70 hover:text-white hover:bg-white/5 opacity-85 hover:opacity-100'
            }`}
          >
            <div className={`w-5 h-5 flex items-center justify-center rounded-sm ${activeTab === 'archive' ? 'text-white' : 'text-white/80'}`}>
              <Archive className="w-4 h-4" />
            </div>
            <span>Data Archive</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-white/10 text-xs text-white/60 space-y-2">
          <div className="flex items-center justify-between">
            <span>v1.0.4 &bull; PostgreSQL Ready</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          </div>

          {admin && (
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-white/80">
              <div className="truncate">
                <p className="font-semibold truncate text-white text-[11px]">{admin.nama_lengkap}</p>
                <p className="text-[10px] text-white/60">Admin Sistem</p>
              </div>
              <button
                onClick={onLogout}
                title="Keluar"
                className="p-1.5 hover:bg-white/10 rounded-md text-white/80 hover:text-red-200 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
