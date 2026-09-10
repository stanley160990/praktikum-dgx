import React from 'react';
import { 
  LayoutDashboard, 
  Table, 
  Upload, 
  BookOpen, 
  GraduationCap, 
  Code, 
  Terminal, 
  LogOut,
  Database
} from 'lucide-react';
import { AdminUser } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  admin: AdminUser | null;
  onLogout: () => void;
  openSqlConsole: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  admin,
  onLogout,
  openSqlConsole,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm"
              style={{ backgroundColor: '#525FE1' }}
            >
              KM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-base tracking-tight">SIM Kursus Mahasiswa</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#525FE1] border border-indigo-100">
                  <Database className="w-3 h-3" />
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-gray-500">Kelola Akun, Jadwal & Sesi Perkuliahan</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="nav-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-[#525FE1] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            <button
              id="nav-jadwal"
              onClick={() => setActiveTab('jadwal')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === 'jadwal'
                  ? 'bg-[#525FE1] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Table className="w-4 h-4" />
              Data Tabel
            </button>

            <button
              id="nav-upload"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === 'upload'
                  ? 'bg-[#525FE1] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Excel
            </button>

            <button
              id="nav-referensi"
              onClick={() => setActiveTab('referensi')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === 'referensi'
                  ? 'bg-[#525FE1] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Referensi (Sesi & Kelas)
            </button>

            <button
              id="nav-mahasiswa"
              onClick={() => setActiveTab('mahasiswa')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === 'mahasiswa'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Cek Login Mahasiswa
            </button>

            <button
              id="nav-php"
              onClick={() => setActiveTab('php-source')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === 'php-source'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Code className="w-4 h-4" />
              Source Code PHP
            </button>
          </nav>

          {/* Right Action / Admin Profile */}
          <div className="flex items-center gap-2">
            <button
              id="btn-sql-console"
              onClick={openSqlConsole}
              title="Buka Konsol PostgreSQL"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition flex items-center gap-1 text-xs border border-gray-200"
            >
              <Terminal className="w-4 h-4 text-[#525FE1]" />
              <span className="hidden lg:inline font-mono">SQL Console</span>
            </button>

            {admin ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-gray-800">{admin.nama_lengkap}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Admin Sistem</div>
                </div>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Keluar"
                  className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-login-prompt"
                onClick={() => setActiveTab('login')}
                className="px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-xs transition"
                style={{ backgroundColor: '#525FE1' }}
              >
                Login Admin
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile nav bar */}
      <div className="md:hidden flex overflow-x-auto border-t border-gray-100 px-4 py-2 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-[#525FE1] text-white' : 'text-gray-600'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'jadwal' ? 'bg-[#525FE1] text-white' : 'text-gray-600'}`}
        >
          Data Tabel
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'upload' ? 'bg-[#525FE1] text-white' : 'text-gray-600'}`}
        >
          Upload Excel
        </button>
        <button
          onClick={() => setActiveTab('referensi')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'referensi' ? 'bg-[#525FE1] text-white' : 'text-gray-600'}`}
        >
          Referensi
        </button>
        <button
          onClick={() => setActiveTab('mahasiswa')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'mahasiswa' ? 'bg-amber-600 text-white' : 'text-amber-700'}`}
        >
          Cek Mahasiswa
        </button>
        <button
          onClick={() => setActiveTab('php-source')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${activeTab === 'php-source' ? 'bg-slate-800 text-white' : 'text-slate-600'}`}
        >
          Source PHP
        </button>
      </div>
    </header>
  );
};
