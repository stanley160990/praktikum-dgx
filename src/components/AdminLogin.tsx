import React, { useState } from 'react';
import { Lock, User, ShieldAlert, CheckCircle2, KeyRound } from 'lucide-react';
import { AdminUser } from '../types';

interface AdminLoginProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login gagal. Periksa username dan password.');
      }

      // Record login time string (HH:MM)
      const now = new Date();
      const loginTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      sessionStorage.setItem('sim_admin_login_time', loginTime);

      onLoginSuccess({
        ...data.user,
        loginTime,
      });
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan atau database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-auto py-6">
      <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden">
        {/* Header with #525FE1 */}
        <div 
          className="p-8 text-white text-center relative overflow-hidden"
          style={{ backgroundColor: '#525FE1' }}
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 flex items-center justify-center mb-3 shadow-inner backdrop-blur-xs">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Portal Admin Kursus</h2>
          <p className="text-indigo-100 text-sm mt-1">
            Sistem Manajemen Jadwal & Akun Mahasiswa
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Login Gagal:</span> {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Username Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input-admin-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#525FE1] focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition"
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="input-admin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#525FE1] focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition"
                  placeholder="Masukkan password"
                />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white font-bold rounded-xl shadow-md transition duration-150 flex items-center justify-center gap-2 text-sm disabled:opacity-70 cursor-pointer"
              style={{ backgroundColor: '#525FE1' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memverifikasi Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
