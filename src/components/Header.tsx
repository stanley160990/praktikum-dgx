import React from 'react';
import { Menu, LogOut, Clock } from 'lucide-react';
import { AdminUser, RefSesi } from '../types';

interface HeaderProps {
  activeTab: string;
  admin: AdminUser | null;
  sesiList: RefSesi[];
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  admin,
  sesiList,
  onOpenMobileMenu,
  onLogout,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Kelola Akun Kursus Mahasiswa';
      case 'jadwal':
        return 'Data Tabel Jadwal Mahasiswa';
      case 'materi':
        return 'Data Tabel Materi Mahasiswa (M1 s/d M10)';
      case 'status-login-live':
        return 'Live Status Login Mahasiswa (Hari Ini)';
      case 'status-login':
        return 'Riwayat Login Mahasiswa';
      case 'upload':
        return 'Upload Jadwal Excel';
      case 'referensi':
        return 'Referensi Sesi & Kelas';
      case 'login':
        return 'Login Administrator';
      default:
        return 'Kelola Akun Kursus Mahasiswa';
    }
  };

  // Tentukan waktu login user untuk penentuan sesi aktif
  const now = new Date();
  const currentFallbackTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const userLoginTime = admin?.loginTime || sessionStorage.getItem('sim_admin_login_time') || currentFallbackTime;

  // Evaluasi apakah waktu login berada dalam rentang sesi yang terdaftar
  const activeSesiObj = sesiList.find((s) => userLoginTime >= s.waktu_mulai && userLoginTime <= s.waktu_selesai);

  // Jika melebihi seluruh sesi atau di luar jadwal sesi maka ditulis "Tidak ada sesi"
  const activeSesiText = activeSesiObj 
    ? `Sesi Aktif: Sesi ${activeSesiObj.nomor_sesi} (${activeSesiObj.waktu_mulai} - ${activeSesiObj.waktu_selesai})`
    : 'Sesi Aktif: Tidak ada sesi';

  const initials = admin?.nama_lengkap 
    ? admin.nama_lengkap.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between shrink-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          aria-label="Buka Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 tracking-tight">
          {getTabTitle()}
        </h2>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Keterangan Sesi Aktif Disesuaikan dengan Waktu User Login */}
        <div 
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200/80 text-xs"
          title={`Sesi aktif dihitung berdasarkan waktu login: ${userLoginTime} WIB`}
        >
          <Clock className={`w-3.5 h-3.5 ${activeSesiObj ? 'text-[#525FE1]' : 'text-amber-500'}`} />
          <span className={activeSesiObj ? 'font-semibold text-gray-800' : 'font-semibold text-amber-700'}>
            {activeSesiText}
          </span>
          <span className="text-[11px] text-gray-400 border-l border-gray-200 pl-2">
            Login: <span className="font-mono font-medium text-gray-600">{userLoginTime}</span>
          </span>
        </div>

        {/* User Profile Avatar */}
        {admin ? (
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-full bg-[#525FE1] flex items-center justify-center text-white text-xs font-bold shadow-xs cursor-default"
              title={`${admin.nama_lengkap} (${admin.username}) - Login: ${userLoginTime}`}
            >
              {initials}
            </div>
            <button
              onClick={onLogout}
              title="Keluar"
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
            --
          </div>
        )}
      </div>
    </header>
  );
};
