import React, { useState } from 'react';
import { Clock, Layers, Plus, Edit2, Trash2, CheckCircle2, X } from 'lucide-react';
import { RefSesi, RefKelas } from '../types';

interface ReferensiViewProps {
  sesiList: RefSesi[];
  kelasList: RefKelas[];
  onRefresh: () => void;
}

export const ReferensiView: React.FC<ReferensiViewProps> = ({
  sesiList,
  kelasList,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sesi' | 'kelas'>('sesi');

  // Sesi form modal
  const [editingSesi, setEditingSesi] = useState<RefSesi | null>(null);
  const [isAddSesiOpen, setIsAddSesiOpen] = useState(false);
  const [sesiForm, setSesiForm] = useState({
    nomor_sesi: 1,
    nama_sesi: '',
    waktu_mulai: '08:00',
    waktu_selesai: '10:00',
    keterangan: '',
  });

  // Kelas form modal
  const [editingKelas, setEditingKelas] = useState<RefKelas | null>(null);
  const [isAddKelasOpen, setIsAddKelasOpen] = useState(false);
  const [kelasForm, setKelasForm] = useState({
    kode_kelas: '',
    nama_kelas: '',
    bidang: 'TEKREK' as 'TEKREK' | 'SOSHUM',
    kapasitas: 40,
  });

  const [loading, setLoading] = useState(false);

  // Sesi handlers
  const handleSaveSesi = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/referensi/sesi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sesiForm),
      });
      if (res.ok) {
        setIsAddSesiOpen(false);
        setEditingSesi(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSesi = async (id: number) => {
    if (!confirm('Hapus referensi sesi ini?')) return;
    try {
      await fetch(`/api/referensi/sesi/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Kelas handlers
  const handleSaveKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/referensi/kelas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kelasForm),
      });
      if (res.ok) {
        setIsAddKelasOpen(false);
        setEditingKelas(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKelas = async (id: number) => {
    if (!confirm('Hapus referensi kelas ini?')) return;
    try {
      await fetch(`/api/referensi/kelas/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Referensi Master Data Sesi & Kelas
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Kelola data acuan sesi perkuliahan dan kelas yang digunakan untuk validasi jadwal mahasiswa.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('sesi')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition ${
            activeSubTab === 'sesi'
              ? 'border-[#525FE1] text-[#525FE1]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          Referensi Sesi (1, 2, 3, 4)
          <span className="ml-1 text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-[#525FE1] font-bold">
            {sesiList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('kelas')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition ${
            activeSubTab === 'kelas'
              ? 'border-[#525FE1] text-[#525FE1]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Referensi Kelas (SOSHUM & TEKREK)
          <span className="ml-1 text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-[#525FE1] font-bold">
            {kelasList.length}
          </span>
        </button>
      </div>

      {/* SubTab 1: Referensi Sesi */}
      {activeSubTab === 'sesi' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Konfigurasi jam mulai dan selesai untuk 4 sesi perkuliahan harian.
            </p>
            <button
              onClick={() => {
                setSesiForm({
                  nomor_sesi: sesiList.length + 1,
                  nama_sesi: `Sesi ${sesiList.length + 1}`,
                  waktu_mulai: '08:00',
                  waktu_selesai: '10:00',
                  keterangan: '',
                });
                setEditingSesi(null);
                setIsAddSesiOpen(true);
              }}
              className="px-4 py-2 bg-[#525FE1] text-white text-sm font-medium rounded shadow-sm hover:brightness-110 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              + Tambah Sesi
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sesiList.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-md bg-[#525FE1] text-white text-[10px] font-bold">
                        Sesi {s.nomor_sesi}
                      </span>
                      <h3 className="font-semibold text-gray-800 text-sm">{s.nama_sesi}</h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-100 text-green-700 font-bold">
                      Aktif
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 my-3 flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Rentang Waktu:</span>
                    <span className="font-mono font-bold text-[#525FE1]">
                      {s.waktu_mulai} &mdash; {s.waktu_selesai} WIB
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">
                    {s.keterangan || 'Tidak ada catatan tambahan untuk sesi ini.'}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-gray-100 text-xs">
                  <button
                    onClick={() => {
                      setEditingSesi(s);
                      setSesiForm({
                        nomor_sesi: s.nomor_sesi,
                        nama_sesi: s.nama_sesi,
                        waktu_mulai: s.waktu_mulai,
                        waktu_selesai: s.waktu_selesai,
                        keterangan: s.keterangan || '',
                      });
                      setIsAddSesiOpen(true);
                    }}
                    className="text-[#525FE1] font-bold hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSesi(s.id)}
                    className="text-red-500 font-bold hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: Referensi Kelas */}
      {activeSubTab === 'kelas' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Daftar kode kelas berdasarkan bidang keilmuan TEKREK dan SOSHUM.
            </p>
            <button
              onClick={() => {
                setKelasForm({
                  kode_kelas: '',
                  nama_kelas: '',
                  bidang: 'TEKREK',
                  kapasitas: 40,
                });
                setEditingKelas(null);
                setIsAddKelasOpen(true);
              }}
              className="px-4 py-2 bg-[#525FE1] text-white text-sm font-medium rounded shadow-sm hover:brightness-110 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              + Tambah Kelas
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3 border-b border-gray-200">Kode Kelas</th>
                  <th className="px-6 py-3 border-b border-gray-200">Nama Kelas</th>
                  <th className="px-6 py-3 border-b border-gray-200">Bidang</th>
                  <th className="px-6 py-3 border-b border-gray-200">Kapasitas</th>
                  <th className="px-6 py-3 border-b border-gray-200 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {kelasList.map((k) => (
                  <tr key={k.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-6 py-3.5 font-mono font-medium text-gray-900">
                      {k.kode_kelas}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-gray-800">
                      {k.nama_kelas}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        k.bidang === 'SOSHUM'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {k.bidang}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600 text-xs">
                      {k.kapasitas} Kursi / Mahasiswa
                    </td>
                    <td className="px-6 py-3.5 text-center space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingKelas(k);
                          setKelasForm({
                            kode_kelas: k.kode_kelas,
                            nama_kelas: k.nama_kelas,
                            bidang: k.bidang,
                            kapasitas: k.kapasitas,
                          });
                          setIsAddKelasOpen(true);
                        }}
                        className="text-[#525FE1] font-bold hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteKelas(k.id)}
                        className="text-red-500 font-bold hover:underline"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Sesi */}
      {isAddSesiOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100">
            <div 
              className="p-6 text-white flex justify-between items-center"
              style={{ backgroundColor: '#525FE1' }}
            >
              <h3 className="font-bold text-base">
                {editingSesi ? 'Edit Referensi Sesi' : 'Tambah Referensi Sesi'}
              </h3>
              <button onClick={() => setIsAddSesiOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSesi} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nomor Sesi (1 - 4)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={sesiForm.nomor_sesi}
                  onChange={(e) => setSesiForm({ ...sesiForm, nomor_sesi: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nama / Label Sesi</label>
                <input
                  type="text"
                  required
                  value={sesiForm.nama_sesi}
                  onChange={(e) => setSesiForm({ ...sesiForm, nama_sesi: e.target.value })}
                  placeholder="Contoh: Sesi 1 (Pagi)"
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={sesiForm.waktu_mulai}
                    onChange={(e) => setSesiForm({ ...sesiForm, waktu_mulai: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={sesiForm.waktu_selesai}
                    onChange={(e) => setSesiForm({ ...sesiForm, waktu_selesai: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Keterangan (Opsional)</label>
                <textarea
                  value={sesiForm.keterangan}
                  onChange={(e) => setSesiForm({ ...sesiForm, keterangan: e.target.value })}
                  rows={2}
                  placeholder="Catatan sesi..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddSesiOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-white font-bold"
                  style={{ backgroundColor: '#525FE1' }}
                >
                  Simpan Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelas */}
      {isAddKelasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100">
            <div 
              className="p-6 text-white flex justify-between items-center"
              style={{ backgroundColor: '#525FE1' }}
            >
              <h3 className="font-bold text-base">
                {editingKelas ? 'Edit Referensi Kelas' : 'Tambah Referensi Kelas'}
              </h3>
              <button onClick={() => setIsAddKelasOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKelas} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Kode Kelas</label>
                <input
                  type="text"
                  required
                  value={kelasForm.kode_kelas}
                  onChange={(e) => setKelasForm({ ...kelasForm, kode_kelas: e.target.value.toUpperCase() })}
                  placeholder="Contoh: TEK-01"
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  required
                  value={kelasForm.nama_kelas}
                  onChange={(e) => setKelasForm({ ...kelasForm, nama_kelas: e.target.value })}
                  placeholder="Contoh: Teknik Rekayasa A"
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Bidang Keilmuan</label>
                <select
                  value={kelasForm.bidang}
                  onChange={(e) => setKelasForm({ ...kelasForm, bidang: e.target.value as 'TEKREK' | 'SOSHUM' })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1]"
                >
                  <option value="TEKREK">TEKREK (Teknik Rekayasa)</option>
                  <option value="SOSHUM">SOSHUM (Sosial Humaniora)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Kapasitas Mahasiswa</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  required
                  value={kelasForm.kapasitas}
                  onChange={(e) => setKelasForm({ ...kelasForm, kapasitas: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddKelasOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-white font-bold"
                  style={{ backgroundColor: '#525FE1' }}
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
