import React, { useState } from 'react';
import { Menu, LogOut, Clock, KeyRound, X, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  const handleOpenPasswordModal = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setModalError(null);
    setModalSuccess(null);
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setModalError(null);
    setModalSuccess(null);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    if (newPassword !== confirmPassword) {
      setModalError('Konfirmasi password baru tidak cocok!');
      return;
    }

    if (newPassword.length < 5) {
      setModalError('Password baru minimal 5 karakter!');
      return;
    }

    if (!admin?.username) {
      setModalError('Sesi login tidak valid.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: admin.username,
          oldPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengubah password');
      }

      setModalSuccess('Password berhasil diperbarui dan dienkripsi dengan SHA1!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        handleClosePasswordModal();
      }, 2000);
    } catch (err: any) {
      setModalError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Kelola Akun Kursus Mahasiswa';
      case 'jadwal':
        return 'Jadwal Mahasiswa';
      case 'archive':
      case 'archive-jadwal':
        return 'Data Archive Jadwal Mahasiswa';
      case 'archive-login':
        return 'Data Archive Riwayat Login';
      case 'materi':
        return 'Materi Mahasiswa';
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
          <span 
            className="text-[11px] text-gray-400 border-l border-gray-200 pl-2 hidden xl:inline cursor-help"
            title="Keamanan: Sesi akan otomatis logout jika tidak ada interaksi di website selama 15 menit"
          >
            Auto-Logout: <span className="font-mono font-medium text-gray-600">15m idle</span>
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
              id="btn-open-change-password"
              onClick={handleOpenPasswordModal}
              title="Ubah Password Admin (SHA1)"
              className="p-1.5 text-gray-400 hover:text-[#525FE1] rounded-md hover:bg-indigo-50 transition cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            <button
              id="btn-logout"
              onClick={onLogout}
              title="Keluar"
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition cursor-pointer"
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

      {/* Modal Ubah Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#525FE1] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Ubah Password Admin</h3>
                  <p className="text-xs text-gray-400">Password akan dienkripsi dengan SHA1 di database</p>
                </div>
              </div>
              <button
                onClick={handleClosePasswordModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password Lama
                </label>
                <input
                  id="input-change-old-password"
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#525FE1] focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Password Baru
                </label>
                <input
                  id="input-change-new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 5 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#525FE1] focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  id="input-change-confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#525FE1] focus:ring-2 focus:ring-indigo-100 outline-none transition"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  disabled={loading}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl text-xs hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 text-white font-semibold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
                  style={{ backgroundColor: '#525FE1' }}
                >
                  {loading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Simpan Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
