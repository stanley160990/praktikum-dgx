import React, { useState } from 'react';
import { Clock, Layers, Plus, Edit2, Trash2, CheckCircle2, X, GraduationCap, RotateCcw, Calendar } from 'lucide-react';
import { RefSesi, RefKelas, RefFakultas, RefMinggu } from '../types';

interface ReferensiViewProps {
  sesiList: RefSesi[];
  kelasList: RefKelas[];
  fakultasList: RefFakultas[];
  mingguList?: RefMinggu[];
  onRefresh: () => void;
}

export const ReferensiView: React.FC<ReferensiViewProps> = ({
  sesiList,
  kelasList,
  fakultasList,
  mingguList = [],
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sesi' | 'kelas' | 'fakultas' | 'minggu'>('fakultas');

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

  // Fakultas form modal
  const [editingFakultas, setEditingFakultas] = useState<RefFakultas | null>(null);
  const [isAddFakultasOpen, setIsAddFakultasOpen] = useState(false);
  const [fakultasForm, setFakultasForm] = useState({
    kode_fakultas: '',
    nama_fakultas: '',
    keterangan: '',
  });

  // Minggu form modal
  const [editingMinggu, setEditingMinggu] = useState<RefMinggu | null>(null);
  const [isAddMingguOpen, setIsAddMingguOpen] = useState(false);
  const [mingguForm, setMingguForm] = useState({
    kode_minggu: '',
    nama_minggu: '',
    urutan: 1,
    keterangan: '',
  });

  const [loading, setLoading] = useState(false);
  const [resettingDefault, setResettingDefault] = useState(false);
  const [resettingMingguDefault, setResettingMingguDefault] = useState(false);

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

  // Fakultas handlers
  const handleSaveFakultas = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/referensi/fakultas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fakultasForm),
      });
      if (res.ok) {
        setIsAddFakultasOpen(false);
        setEditingFakultas(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFakultas = async (id: number) => {
    if (!confirm('Hapus referensi fakultas ini?')) return;
    try {
      await fetch(`/api/referensi/fakultas/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDefaultFakultas = async () => {
    if (!confirm('Muat ulang 8 referensi fakultas default (FTI, FIKTI, FTSP, FIKES, FE, FSB, FPSI, FIKOM)?')) return;
    setResettingDefault(true);
    try {
      const res = await fetch('/api/referensi/fakultas/reset-default', { method: 'POST' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResettingDefault(false);
    }
  };

  // Minggu handlers
  const handleSaveMinggu = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/referensi/minggu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mingguForm),
      });
      if (res.ok) {
        setIsAddMingguOpen(false);
        setEditingMinggu(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMinggu = async (id: number) => {
    if (!confirm('Hapus referensi minggu ini?')) return;
    try {
      await fetch(`/api/referensi/minggu/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetDefaultMinggu = async () => {
    if (!confirm('Muat ulang 10 referensi minggu default (M1 sampai dengan M10)?')) return;
    setResettingMingguDefault(true);
    try {
      const res = await fetch('/api/referensi/minggu/reset-default', { method: 'POST' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResettingMingguDefault(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Referensi Master Data Sesi, Kelas, Fakultas & Minggu
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Kelola data acuan sesi perkuliahan, kelas, fakultas, dan minggu pembelajaran yang digunakan untuk validasi serta dropdown jadwal mahasiswa.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('fakultas')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition ${
            activeSubTab === 'fakultas'
              ? 'border-[#525FE1] text-[#525FE1]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Referensi Fakultas
          <span className="ml-1 text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-[#525FE1] font-bold">
            {fakultasList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('minggu')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition ${
            activeSubTab === 'minggu'
              ? 'border-[#525FE1] text-[#525FE1]'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Referensi Minggu (M1 - M10)
          <span className="ml-1 text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-[#525FE1] font-bold">
            {mingguList.length}
          </span>
        </button>

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

      {/* SubTab 0: Referensi Fakultas */}
      {activeSubTab === 'fakultas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="text-xs text-gray-500">
                Daftar fakultas universitas untuk pilihan dropdown pada form jadwal mahasiswa dan kolom upload file Excel.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaultFakultas}
                disabled={resettingDefault}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                title="Muat ulang 8 referensi fakultas default"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resettingDefault ? 'animate-spin' : ''}`} />
                Muat 8 Default
              </button>
              <button
                id="btn-tambah-fakultas"
                onClick={() => {
                  setFakultasForm({
                    kode_fakultas: '',
                    nama_fakultas: '',
                    keterangan: '',
                  });
                  setEditingFakultas(null);
                  setIsAddFakultasOpen(true);
                }}
                className="px-4 py-2 bg-[#525FE1] text-white text-sm font-medium rounded shadow-sm hover:brightness-110 flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + Tambah Fakultas
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3 border-b border-gray-200 w-36">Kode Fakultas</th>
                  <th className="px-6 py-3 border-b border-gray-200">Nama Fakultas</th>
                  <th className="px-6 py-3 border-b border-gray-200">Keterangan</th>
                  <th className="px-6 py-3 border-b border-gray-200 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {fakultasList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-xs">
                      Belum ada data referensi fakultas. Klik tombol <strong>Muat 8 Default</strong> di atas untuk mengaktifkan data fakultas standar (FTI, FIKTI, FTSP, dll).
                    </td>
                  </tr>
                ) : (
                  fakultasList.map((f) => (
                    <tr key={f.id || f.kode_fakultas} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-indigo-100 text-[#525FE1] border border-indigo-200">
                          {f.kode_fakultas}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-medium text-gray-800">
                        {f.nama_fakultas}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 text-xs">
                        {f.keterangan || '-'}
                      </td>
                      <td className="px-6 py-3.5 text-center space-x-3 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingFakultas(f);
                            setFakultasForm({
                              kode_fakultas: f.kode_fakultas,
                              nama_fakultas: f.nama_fakultas,
                              keterangan: f.keterangan || '',
                            });
                            setIsAddFakultasOpen(true);
                          }}
                          className="text-[#525FE1] font-bold hover:underline text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteFakultas(f.id)}
                          className="text-red-500 font-bold hover:underline text-xs"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab: Referensi Minggu */}
      {activeSubTab === 'minggu' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <p className="text-xs text-gray-500">
                Daftar referensi minggu perkuliahan (M1 s/d M10) untuk pilihan dropdown jadwal mahasiswa dan kolom file Excel.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaultMinggu}
                disabled={resettingMingguDefault}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                title="Muat ulang 10 referensi minggu default (M1 - M10)"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resettingMingguDefault ? 'animate-spin' : ''}`} />
                Muat 10 Default (M1 - M10)
              </button>
              <button
                id="btn-tambah-minggu"
                onClick={() => {
                  setMingguForm({
                    kode_minggu: `M${mingguList.length + 1}`,
                    nama_minggu: `Minggu ke-${mingguList.length + 1}`,
                    urutan: mingguList.length + 1,
                    keterangan: '',
                  });
                  setEditingMinggu(null);
                  setIsAddMingguOpen(true);
                }}
                className="px-4 py-2 bg-[#525FE1] text-white text-sm font-medium rounded shadow-sm hover:brightness-110 flex items-center gap-2 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + Tambah Minggu
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 w-16 text-center">Urutan</th>
                  <th className="px-6 py-3">Kode Minggu</th>
                  <th className="px-6 py-3">Nama Minggu</th>
                  <th className="px-6 py-3">Keterangan</th>
                  <th className="px-6 py-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {mingguList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-xs">
                      Belum ada data referensi minggu. Klik tombol "Muat 10 Default (M1 - M10)" di atas untuk memuat data acuan default.
                    </td>
                  </tr>
                ) : (
                  [...mingguList]
                    .sort((a, b) => a.urutan - b.urutan)
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3.5 text-center font-mono text-gray-500 font-bold">
                          {m.urutan}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="px-2.5 py-1 rounded font-mono font-bold text-xs bg-purple-50 text-purple-700 border border-purple-200">
                            {m.kode_minggu}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-medium text-gray-800">
                          {m.nama_minggu}
                        </td>
                        <td className="px-6 py-3.5 text-gray-500 text-xs">
                          {m.keterangan || '-'}
                        </td>
                        <td className="px-6 py-3.5 text-center space-x-3 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setEditingMinggu(m);
                              setMingguForm({
                                kode_minggu: m.kode_minggu,
                                nama_minggu: m.nama_minggu,
                                urutan: m.urutan,
                                keterangan: m.keterangan || '',
                              });
                              setIsAddMingguOpen(true);
                            }}
                            className="text-[#525FE1] font-bold hover:underline text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMinggu(m.id)}
                            className="text-red-500 font-bold hover:underline text-xs"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {/* Modal Fakultas */}
      {isAddFakultasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div 
              className="p-6 text-white flex justify-between items-center"
              style={{ backgroundColor: '#525FE1' }}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-white/90" />
                <h3 className="font-bold text-base">
                  {editingFakultas ? 'Edit Referensi Fakultas' : 'Tambah Referensi Fakultas'}
                </h3>
              </div>
              <button 
                onClick={() => setIsAddFakultasOpen(false)}
                className="text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFakultas} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Kode Fakultas (Singkatan) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fakultasForm.kode_fakultas}
                  onChange={(e) => setFakultasForm({ ...fakultasForm, kode_fakultas: e.target.value.toUpperCase() })}
                  placeholder="Contoh: FIKTI, FTI, FE, FPSI"
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1] font-mono font-bold uppercase"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Singkatan unik fakultas yang akan dicocokkan pada file Excel atau dropdown.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Nama Lengkap Fakultas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fakultasForm.nama_fakultas}
                  onChange={(e) => setFakultasForm({ ...fakultasForm, nama_fakultas: e.target.value })}
                  placeholder="Contoh: Fakultas Ilmu Komputer dan Teknologi Informasi"
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Keterangan (Opsional)</label>
                <textarea
                  value={fakultasForm.keterangan}
                  onChange={(e) => setFakultasForm({ ...fakultasForm, keterangan: e.target.value })}
                  rows={2}
                  placeholder="Catatan jurusan atau prodi..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddFakultasOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-white font-bold transition shadow-sm hover:brightness-110"
                  style={{ backgroundColor: '#525FE1' }}
                >
                  {loading ? 'Menyimpan...' : 'Simpan Fakultas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Minggu */}
      {isAddMingguOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div 
              className="p-6 text-white flex justify-between items-center"
              style={{ backgroundColor: '#525FE1' }}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-white/90" />
                <h3 className="font-bold text-base">
                  {editingMinggu ? 'Edit Referensi Minggu' : 'Tambah Referensi Minggu'}
                </h3>
              </div>
              <button 
                onClick={() => setIsAddMingguOpen(false)}
                className="text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMinggu} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Kode Minggu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={mingguForm.kode_minggu}
                    onChange={(e) => setMingguForm({ ...mingguForm, kode_minggu: e.target.value.toUpperCase() })}
                    placeholder="M1, M2, dll"
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1] font-mono font-bold uppercase"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Format: M1 sampai M10.
                  </p>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Nomor Urutan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={mingguForm.urutan}
                    onChange={(e) => setMingguForm({ ...mingguForm, urutan: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Nama Label Minggu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={mingguForm.nama_minggu}
                  onChange={(e) => setMingguForm({ ...mingguForm, nama_minggu: e.target.value })}
                  placeholder="Contoh: Minggu ke-1"
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Keterangan (Opsional)</label>
                <textarea
                  value={mingguForm.keterangan}
                  onChange={(e) => setMingguForm({ ...mingguForm, keterangan: e.target.value })}
                  rows={2}
                  placeholder="Catatan topik atau agenda minggu ini..."
                  className="w-full p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#525FE1]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddMingguOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-white font-bold transition shadow-sm hover:brightness-110"
                  style={{ backgroundColor: '#525FE1' }}
                >
                  {loading ? 'Menyimpan...' : 'Simpan Minggu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
