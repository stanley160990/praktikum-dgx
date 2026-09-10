import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { JadwalTableView } from './components/JadwalTableView';
import { UploadExcelView } from './components/UploadExcelView';
import { UploadJadwalModal } from './components/UploadJadwalModal';
import { MateriTableView } from './components/MateriTableView';
import { ReferensiView } from './components/ReferensiView';
import { StatusLoginMahasiswaView } from './components/StatusLoginMahasiswaView';
import { LiveStatusLoginView } from './components/LiveStatusLoginView';
import { AdminLogin } from './components/AdminLogin';
import { AdminUser, JadwalKursus, MateriKursus, RefSesi, RefKelas } from './types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Admin auth state (default null so the landing page is Login, not logged in by default)
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const saved = sessionStorage.getItem('sim_admin_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = sessionStorage.getItem('sim_admin_user');
    return saved ? 'dashboard' : 'login';
  });

  // Hapus sisa sesi login lama di localStorage agar default selalu halaman login
  useEffect(() => {
    localStorage.removeItem('sim_admin_user');
  }, []);
  const [jadwalList, setJadwalList] = useState<JadwalKursus[]>([]);
  const [materiList, setMateriList] = useState<MateriKursus[]>([]);
  const [sesiList, setSesiList] = useState<RefSesi[]>([]);
  const [kelasList, setKelasList] = useState<RefKelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadJadwalModalOpen, setUploadJadwalModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch all Jadwal from PostgreSQL
  const fetchJadwal = async () => {
    try {
      const res = await fetch('/api/jadwal');
      const data = await res.json();
      if (data.success) {
        setJadwalList(data.data);
      }
    } catch (err) {
      console.error('Error fetching jadwal:', err);
    }
  };

  // Fetch all Materi from PostgreSQL
  const fetchMateri = async () => {
    try {
      const res = await fetch('/api/materi');
      const data = await res.json();
      if (data.success) {
        setMateriList(data.data);
      }
    } catch (err) {
      console.error('Error fetching materi:', err);
    }
  };

  // Fetch Referensi Sesi & Kelas
  const fetchReferensi = async () => {
    try {
      const [resSesi, resKelas] = await Promise.all([
        fetch('/api/referensi/sesi'),
        fetch('/api/referensi/kelas'),
      ]);
      const [dataSesi, dataKelas] = await Promise.all([resSesi.json(), resKelas.json()]);

      if (dataSesi.success) setSesiList(dataSesi.data);
      if (dataKelas.success) setKelasList(dataKelas.data);
    } catch (err) {
      console.error('Error fetching referensi:', err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchJadwal(), fetchReferensi(), fetchMateri()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  const handleLoginSuccess = (user: AdminUser) => {
    setAdmin(user);
    sessionStorage.setItem('sim_admin_user', JSON.stringify(user));
    setActiveTab('dashboard');
    showToast(`Selamat datang kembali, ${user.nama_lengkap}!`);
  };

  const handleLogout = () => {
    setAdmin(null);
    sessionStorage.removeItem('sim_admin_user');
    localStorage.removeItem('sim_admin_user');
    setActiveTab('login');
    showToast('Anda telah keluar dari akun admin.');
  };

  // CRUD Operations for Jadwal
  const handleAddManual = async (item: Partial<JadwalKursus>): Promise<boolean> => {
    try {
      const res = await fetch('/api/jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menambahkan jadwal');
      }
      showToast(data.message || 'Jadwal berhasil ditambahkan ke database PostgreSQL!');
      await Promise.all([fetchJadwal(), fetchMateri()]);
      return true;
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan', 'error');
      return false;
    }
  };

  const handleEdit = async (id: number, item: Partial<JadwalKursus>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/jadwal/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengupdate jadwal');
      }
      showToast('Data jadwal berhasil diperbarui!');
      await Promise.all([fetchJadwal(), fetchMateri()]);
      return true;
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui', 'error');
      return false;
    }
  };

  const handleDelete = async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/jadwal/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus');
      }
      showToast('Jadwal mahasiswa berhasil dihapus dari database.');
      await fetchJadwal();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus', 'error');
      return false;
    }
  };

  // CRUD Operations for Materi
  const handleAddMateri = async (item: Partial<MateriKursus>): Promise<boolean> => {
    try {
      const res = await fetch('/api/materi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menyimpan data materi');
      }
      showToast('Data materi mahasiswa berhasil disimpan ke PostgreSQL!');
      await fetchMateri();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan materi', 'error');
      return false;
    }
  };

  const handleEditMateri = async (id: number, item: Partial<MateriKursus>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/materi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memperbarui materi');
      }
      showToast('Data materi berhasil diperbarui!');
      await fetchMateri();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui materi', 'error');
      return false;
    }
  };

  const handleDeleteMateri = async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(`/api/materi/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus materi');
      }
      showToast('Data materi mahasiswa berhasil dihapus.');
      await fetchMateri();
      return true;
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus materi', 'error');
      return false;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] font-sans overflow-hidden">
      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-red-900 text-white border-red-700'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Left Sidebar - Hanya terlihat jika sistem sudah login */}
      {admin && (
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          admin={admin}
          onLogout={handleLogout}
          isOpenMobile={mobileMenuOpen}
          setIsOpenMobile={setMobileMenuOpen}
          onOpenUploadJadwalModal={() => setUploadJadwalModalOpen(true)}
        />
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header Bar - Hanya terlihat jika sistem sudah login */}
        {admin && (
          <Header
            activeTab={activeTab}
            admin={admin}
            sesiList={sesiList}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onLogout={handleLogout}
          />
        )}

        {/* Scrollable Page Body */}
        <section className={`flex-1 overflow-y-auto ${admin ? 'p-4 sm:p-6 lg:p-8 space-y-6' : 'p-4 sm:p-6 flex items-center justify-center min-h-screen bg-slate-50/70'}`}>
          {/* View Router */}
          {!admin ? (
            <AdminLogin
              onLoginSuccess={handleLoginSuccess}
            />
          ) : activeTab === 'dashboard' ? (
            <DashboardView
              jadwalList={jadwalList}
              sesiList={sesiList}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenUploadJadwal={() => setUploadJadwalModalOpen(true)}
            />
          ) : activeTab === 'status-login-live' ? (
            <LiveStatusLoginView
              sesiList={sesiList}
              onNavigateToHistory={() => setActiveTab('status-login')}
            />
          ) : activeTab === 'status-login' ? (
            <StatusLoginMahasiswaView
              sesiList={sesiList}
              onNavigateToLive={() => setActiveTab('status-login-live')}
            />
          ) : activeTab === 'jadwal' ? (
            <JadwalTableView
              jadwalList={jadwalList}
              sesiList={sesiList}
              kelasList={kelasList}
              onRefresh={fetchJadwal}
              onAddManual={handleAddManual}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onOpenUploadModal={() => setUploadJadwalModalOpen(true)}
              onNavigateToUpload={() => setUploadJadwalModalOpen(true)}
            />
          ) : activeTab === 'materi' ? (
            <MateriTableView
              materiList={materiList}
              jadwalList={jadwalList}
              onRefresh={fetchMateri}
              onAddMateri={handleAddMateri}
              onEditMateri={handleEditMateri}
              onDeleteMateri={handleDeleteMateri}
            />
          ) : activeTab === 'upload' ? (
            <UploadExcelView
              existingJadwal={jadwalList}
              onUploadSuccess={async () => {
                await Promise.all([fetchJadwal(), fetchMateri()]);
                showToast('Upload Excel berhasil dan data tersimpan ke PostgreSQL!');
              }}
              onNavigateToTable={() => setActiveTab('jadwal')}
            />
          ) : activeTab === 'referensi' ? (
            <ReferensiView
              sesiList={sesiList}
              kelasList={kelasList}
              onRefresh={fetchReferensi}
            />
          ) : null}
        </section>
      </main>

      {/* Upload Jadwal Modal Popup (No separate page needed!) */}
      <UploadJadwalModal
        isOpen={uploadJadwalModalOpen}
        onClose={() => setUploadJadwalModalOpen(false)}
        existingJadwal={jadwalList}
        onUploadSuccess={async () => {
          await Promise.all([fetchJadwal(), fetchMateri()]);
          showToast('Upload Excel Jadwal berhasil dan tersimpan ke PostgreSQL!');
        }}
      />
    </div>
  );
}

