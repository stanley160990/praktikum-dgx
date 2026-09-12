import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  RefreshCw, 
  FileSpreadsheet,
  X,
  AlertTriangle,
  Upload,
  Archive,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { JadwalKursus, RefSesi, RefKelas, RefFakultas, RefMinggu } from '../types';
import { exportJadwalToExcel } from '../utils/excelHelper';

interface JadwalTableViewProps {
  jadwalList: JadwalKursus[];
  sesiList: RefSesi[];
  kelasList: RefKelas[];
  fakultasList?: RefFakultas[];
  mingguList?: RefMinggu[];
  onRefresh: () => void;
  onAddManual: (item: Partial<JadwalKursus>) => Promise<boolean>;
  onEdit: (id: number, item: Partial<JadwalKursus>) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onOpenUploadModal?: () => void;
  onNavigateToUpload?: () => void;
  onNavigateToArchive?: () => void;
}

export const JadwalTableView: React.FC<JadwalTableViewProps> = ({
  jadwalList,
  sesiList,
  kelasList,
  fakultasList = [],
  mingguList = [],
  onRefresh,
  onAddManual,
  onEdit,
  onDelete,
  onOpenUploadModal,
  onNavigateToUpload,
  onNavigateToArchive,
}) => {
  // Sort sesiList by nomor_sesi ascending
  const sortedSesiList = [...sesiList].sort((a, b) => a.nomor_sesi - b.nomor_sesi);
  const sortedMingguList = [...mingguList].sort((a, b) => a.urutan - b.urutan);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBidang, setFilterBidang] = useState('');
  const [filterSesi, setFilterSesi] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterFakultas, setFilterFakultas] = useState('');
  const [filterMinggu, setFilterMinggu] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JadwalKursus | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    bidang: 'TEKREK' as 'TEKREK' | 'SOSHUM',
    tanggal: new Date().toISOString().split('T')[0],
    sesi: 1,
    fakultas: '',
    minggu: 'M1',
    npm: '',
    kelas: 'TEK-01',
    nama: '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Archive Modal states
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [namaSemesterInput, setNamaSemesterInput] = useState('');
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveSuccessMsg, setArchiveSuccessMsg] = useState<string | null>(null);

  const handleTriggerArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    setArchiveError(null);
    if (!namaSemesterInput.trim()) {
      setArchiveError('Nama semester wajib diisi untuk menandai data archive!');
      return;
    }

    if (jadwalList.length === 0) {
      setArchiveError('Tabel data jadwal saat ini masih kosong, tidak ada data untuk di-archive.');
      return;
    }

    setArchiveLoading(true);
    try {
      const res = await fetch('/api/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_semester: namaSemesterInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal melakukan proses archive.');
      }
      setArchiveSuccessMsg(data.message);
      onRefresh();
      setTimeout(() => {
        setIsArchiveModalOpen(false);
        setNamaSemesterInput('');
        setArchiveSuccessMsg(null);
        if (onNavigateToArchive) {
          onNavigateToArchive();
        }
      }, 1500);
    } catch (err: any) {
      setArchiveError(err.message || 'Terjadi kesalahan sistem saat melakukan archive.');
    } finally {
      setArchiveLoading(false);
    }
  };

  // Filter logic
  const filteredData = jadwalList.filter((item) => {
    const matchSearch =
      searchTerm === '' ||
      item.npm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.fakultas || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.minggu || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchBidang = filterBidang === '' || item.bidang === filterBidang;
    const matchSesi = filterSesi === '' || String(item.sesi) === filterSesi;
    const matchTanggal = filterTanggal === '' || item.tanggal === filterTanggal;
    const matchFakultas = filterFakultas === '' || (item.fakultas || '') === filterFakultas;
    const matchMinggu = filterMinggu === '' || (item.minggu || '') === filterMinggu;

    return matchSearch && matchBidang && matchSesi && matchTanggal && matchFakultas && matchMinggu;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterBidang('');
    setFilterSesi('');
    setFilterTanggal('');
    setFilterFakultas('');
    setFilterMinggu('');
    setCurrentPage(1);
  };

  const handleOpenAddModal = () => {
    const defaultSesi = sortedSesiList.length > 0 ? sortedSesiList[0].nomor_sesi : 1;
    const defaultFakultas = fakultasList.length > 0 ? fakultasList[0].kode_fakultas : 'FIKTI';
    const defaultMinggu = sortedMingguList.length > 0 ? sortedMingguList[0].kode_minggu : 'M1';
    setFormData({
      bidang: 'TEKREK',
      tanggal: new Date().toISOString().split('T')[0],
      sesi: defaultSesi,
      fakultas: defaultFakultas,
      minggu: defaultMinggu,
      npm: '',
      kelas: kelasList.find((k) => k.bidang === 'TEKREK')?.kode_kelas || '3IA01',
      nama: '',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: JadwalKursus) => {
    setEditingItem(item);
    setFormData({
      bidang: item.bidang,
      tanggal: item.tanggal,
      sesi: item.sesi,
      fakultas: item.fakultas || '',
      minggu: item.minggu || 'M1',
      npm: item.npm,
      kelas: item.kelas,
      nama: item.nama,
    });
    setFormError(null);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.npm.trim() || !formData.nama.trim()) {
      setFormError('NPM dan Nama mahasiswa wajib diisi!');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingItem) {
        const success = await onEdit(editingItem.id, formData);
        if (success) {
          setEditingItem(null);
        }
      } else {
        const success = await onAddManual(formData);
        if (success) {
          setIsAddModalOpen(false);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingId !== null) {
      await onDelete(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Table Container from Professional Polish Design */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar Header */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-gray-50">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-tambah-data"
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#525FE1] text-white text-sm font-medium rounded shadow-sm hover:brightness-110 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Tambah Data
            </button>

            {(onOpenUploadModal || onNavigateToUpload) && (
              <button
                id="btn-import-excel-nav"
                onClick={() => {
                  if (onOpenUploadModal) onOpenUploadModal();
                  else if (onNavigateToUpload) onNavigateToUpload();
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded shadow-sm hover:bg-gray-50 transition flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                Upload Jadwal
              </button>
            )}

            <button
              id="btn-export-excel"
              onClick={() => exportJadwalToExcel(filteredData)}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded shadow-sm hover:bg-gray-50 transition flex items-center gap-1.5"
              title="Ekspor ke Excel"
            >
              <Download className="w-4 h-4" />
              Export ({filteredData.length})
            </button>

            <button
              id="btn-trigger-archive-jadwal"
              onClick={() => {
                setIsArchiveModalOpen(true);
                setArchiveError(null);
                setArchiveSuccessMsg(null);
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded shadow-sm transition flex items-center gap-1.5"
              title="Pindahkan seluruh data pada tabel jadwal kursus ke archive semester"
            >
              <Archive className="w-4 h-4" />
              Archive
            </button>

            <button
              onClick={onRefresh}
              className="p-2 bg-white border border-gray-300 text-gray-700 rounded shadow-sm hover:bg-gray-50 transition"
              title="Muat Ulang"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Bidang dropdown */}
            <select
              value={filterBidang}
              onChange={(e) => {
                setFilterBidang(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2 px-3 border border-gray-300 rounded text-sm bg-white text-gray-700 outline-none"
            >
              <option value="">Semua Bidang</option>
              <option value="SOSHUM">SOSHUM</option>
              <option value="TEKREK">TEKREK</option>
            </select>

            {/* Filter Fakultas dropdown */}
            <select
              id="filter-fakultas-jadwal"
              value={filterFakultas}
              onChange={(e) => {
                setFilterFakultas(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2 px-3 border border-gray-300 rounded text-sm bg-white text-gray-700 outline-none"
            >
              <option value="">Semua Fakultas</option>
              {fakultasList.map((f) => (
                <option key={f.id || f.kode_fakultas} value={f.kode_fakultas}>
                  {f.kode_fakultas} - {f.nama_fakultas}
                </option>
              ))}
            </select>

            {/* Filter Minggu dropdown */}
            <select
              id="filter-minggu-jadwal"
              value={filterMinggu}
              onChange={(e) => {
                setFilterMinggu(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2 px-3 border border-gray-300 rounded text-sm bg-white text-gray-700 outline-none"
            >
              <option value="">Semua Minggu</option>
              {sortedMingguList.length > 0 ? (
                sortedMingguList.map((m) => (
                  <option key={m.id || m.kode_minggu} value={m.kode_minggu}>
                    {m.kode_minggu} ({m.nama_minggu})
                  </option>
                ))
              ) : (
                Array.from({ length: 10 }, (_, i) => `M${i + 1}`).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))
              )}
            </select>

            {/* Filter Sesi dropdown */}
            <select
              id="filter-sesi-jadwal"
              value={filterSesi}
              onChange={(e) => {
                setFilterSesi(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2 px-3 border border-gray-300 rounded text-sm bg-white text-gray-700 outline-none"
            >
              <option value="">Semua Sesi</option>
              {sortedSesiList.length > 0 ? (
                sortedSesiList.map((s) => (
                  <option key={s.id || s.nomor_sesi} value={String(s.nomor_sesi)}>
                    {s.nama_sesi || `Sesi ${s.nomor_sesi}`} ({s.waktu_mulai} - {s.waktu_selesai})
                  </option>
                ))
              ) : (
                <>
                  <option value="1">Sesi 1</option>
                  <option value="2">Sesi 2</option>
                  <option value="3">Sesi 3</option>
                  <option value="4">Sesi 4</option>
                </>
              )}
            </select>

            {/* Search input with rounded-full icon matching design */}
            <div className="relative">
              <input
                id="input-search-jadwal"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari NPM atau Nama..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded text-sm w-64 outline-none focus:border-[#525FE1]"
              />
              <div className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 border-2 border-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-x-auto min-h-[380px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3 border-b border-gray-200">Bidang</th>
                <th className="px-6 py-3 border-b border-gray-200">Fakultas</th>
                <th className="px-6 py-3 border-b border-gray-200 text-center">Minggu</th>
                <th className="px-6 py-3 border-b border-gray-200">NPM</th>
                <th className="px-6 py-3 border-b border-gray-200">Nama Mahasiswa</th>
                <th className="px-6 py-3 border-b border-gray-200">Tanggal</th>
                <th className="px-6 py-3 border-b border-gray-200 text-center">Sesi</th>
                <th className="px-6 py-3 border-b border-gray-200">Kelas</th>
                <th className="px-6 py-3 border-b border-gray-200">Updated At</th>
                <th className="px-6 py-3 border-b border-gray-200">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400 text-sm">
                    Tidak ada data jadwal ditemukan. Silakan tambahkan data atau import file Excel.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        item.bidang === 'SOSHUM'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {item.bidang}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.fakultas ? (
                        <span className="px-2 py-1 rounded-md text-[11px] font-bold font-mono bg-indigo-50 text-[#525FE1] border border-indigo-100">
                          {item.fakultas}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-md text-[11px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
                        {item.minggu || 'M1'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium">{item.npm}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.nama}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.tanggal}</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-800">{item.sesi}</td>
                    <td className="px-6 py-4 font-mono text-gray-600">{item.kelas}</td>
                    <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
                      {item.updated_at ? new Date(item.updated_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      {item.status_entry === 'DUPLIKAT_DITAMBAHKAN' && (
                        <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-medium">
                          Riwayat
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="text-[#525FE1] font-bold hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingId(item.id)}
                        className="text-red-500 font-bold hover:underline"
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

        {/* Footer Pagination from Professional Polish Design */}
        <div className="p-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-sm text-gray-500">
            Menampilkan {paginatedData.length} dari {filteredData.length.toLocaleString('id-ID')} entri
          </p>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 border rounded text-sm font-medium transition ${
                    isActive
                      ? 'border-[#525FE1] bg-[#525FE1] text-white'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Tambah / Edit Data */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div 
              className="p-5 text-white flex items-center justify-between"
              style={{ backgroundColor: '#525FE1' }}
            >
              <div>
                <h3 className="font-bold text-base">
                  {editingItem ? 'Edit Data Jadwal Mahasiswa' : 'Tambah Data Mahasiswa'}
                </h3>
                <p className="text-xs text-indigo-100 mt-0.5">
                  Tersimpan langsung ke database PostgreSQL
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-1 rounded-md hover:bg-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Bidang Kursus</label>
                  <select
                    value={formData.bidang}
                    onChange={(e) => {
                      const newBidang = e.target.value as 'TEKREK' | 'SOSHUM';
                      setFormData({
                        ...formData,
                        bidang: newBidang,
                        kelas: kelasList.find((k) => k.bidang === newBidang)?.kode_kelas || (newBidang === 'TEKREK' ? '3IA01' : '2KA04'),
                      });
                    }}
                    className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#525FE1]"
                  >
                    <option value="TEKREK">TEKREK</option>
                    <option value="SOSHUM">SOSHUM</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Tanggal Jadwal</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#525FE1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Sesi Perkuliahan <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="select-modal-sesi"
                    value={formData.sesi}
                    onChange={(e) => setFormData({ ...formData, sesi: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#525FE1] text-gray-800"
                  >
                    {sortedSesiList.length > 0 ? (
                      sortedSesiList.map((s) => (
                        <option key={s.id || s.nomor_sesi} value={s.nomor_sesi}>
                          {s.nama_sesi || `Sesi ${s.nomor_sesi}`} ({s.waktu_mulai} - {s.waktu_selesai})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value={1}>Sesi 1 (08:00 - 10:00)</option>
                        <option value={2}>Sesi 2 (10:15 - 12:15)</option>
                        <option value={3}>Sesi 3 (13:00 - 15:00)</option>
                        <option value={4}>Sesi 4 (15:15 - 17:15)</option>
                      </>
                    )}
                    {/* Jika sedang edit data lama yang nomor sesinya tidak ada di referensi saat ini */}
                    {formData.sesi && !sortedSesiList.some((s) => s.nomor_sesi === formData.sesi) && (
                      <option value={formData.sesi}>
                        Sesi {formData.sesi} (Sesi Tersimpan)
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Minggu Pertemuan <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="select-modal-minggu"
                    required
                    value={formData.minggu}
                    onChange={(e) => setFormData({ ...formData, minggu: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#525FE1] text-gray-800 font-mono font-bold"
                  >
                    {sortedMingguList.length > 0 ? (
                      sortedMingguList.map((m) => (
                        <option key={m.id || m.kode_minggu} value={m.kode_minggu}>
                          {m.kode_minggu} - {m.nama_minggu}
                        </option>
                      ))
                    ) : (
                      Array.from({ length: 10 }, (_, i) => `M${i + 1}`).map((m) => (
                        <option key={m} value={m}>
                          {m} - Minggu ke-{m.replace('M', '')}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Fakultas <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="select-modal-fakultas"
                    required
                    value={formData.fakultas}
                    onChange={(e) => setFormData({ ...formData, fakultas: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#525FE1] text-gray-800"
                  >
                    <option value="">-- Pilih Fakultas --</option>
                    {fakultasList.map((f) => (
                      <option key={f.id || f.kode_fakultas} value={f.kode_fakultas}>
                        {f.kode_fakultas} - {f.nama_fakultas}
                      </option>
                    ))}
                    {/* Fallback jika ada data yang fakultasnya tidak terdaftar di master */}
                    {formData.fakultas && !fakultasList.some((f) => f.kode_fakultas === formData.fakultas) && (
                      <option value={formData.fakultas}>{formData.fakultas}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="list-kelas-options"
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    placeholder="Contoh: 3IA01"
                    className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#525FE1] font-mono"
                  />
                  <datalist id="list-kelas-options">
                    {kelasList
                      .filter((k) => !formData.bidang || k.bidang === formData.bidang)
                      .map((k) => (
                        <option key={k.id || k.kode_kelas} value={k.kode_kelas}>
                          {k.kode_kelas} - {k.nama_kelas}
                        </option>
                      ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">NPM Mahasiswa</label>
                <input
                  type="text"
                  required
                  value={formData.npm}
                  onChange={(e) => setFormData({ ...formData, npm: e.target.value })}
                  placeholder="Contoh: 50421890"
                  className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#525FE1] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nama Lengkap Mahasiswa</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Budi Cahyadi"
                  className="w-full p-2.5 rounded-lg border border-gray-300 outline-none focus:border-[#525FE1]"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-lg text-white font-medium shadow-sm transition disabled:opacity-70"
                  style={{ backgroundColor: '#525FE1' }}
                >
                  {formSubmitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center">Hapus Jadwal Mahasiswa?</h3>
            <p className="text-xs text-gray-500 text-center mt-1">
              Data ini akan dihapus dari tabel database PostgreSQL. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium text-xs hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-bold text-xs hover:bg-red-700"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Archive Data Jadwal ke jadwal_kursus_archive */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Archive Data Mahasiswa</h3>
                  <p className="text-xs text-gray-500">Pindahkan data jadwal ke arsip semester</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!archiveLoading) {
                    setIsArchiveModalOpen(false);
                    setArchiveError(null);
                    setArchiveSuccessMsg(null);
                  }
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {archiveSuccessMsg ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-emerald-800">{archiveSuccessMsg}</p>
                <p className="text-xs text-gray-500">Mengarahkan ke menu Data Archive...</p>
              </div>
            ) : (
              <form onSubmit={handleTriggerArchive} className="space-y-4">
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Pemberitahuan Proses Archive:
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    Seluruh <b>{jadwalList.length} data mahasiswa</b> pada tabel <code>jadwal_kursus</code> akan dipindahkan ke <code>jadwal_kursus_archive</code> dan ditandai dengan <b>Nama Semester</b> yang Anda tentukan di bawah.
                  </p>
                  <p className="text-amber-700 text-[11px]">
                    Tabel data jadwal mahasiswa aktif akan dikosongkan agar siap untuk perkuliahan semester baru.
                  </p>
                </div>

                {archiveError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{archiveError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Nama Semester <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-nama-semester-archive"
                    type="text"
                    required
                    value={namaSemesterInput}
                    onChange={(e) => setNamaSemesterInput(e.target.value)}
                    placeholder="Contoh: Semester Ganjil 2024/2025"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-900 outline-none focus:border-[#525FE1] focus:ring-1 focus:ring-[#525FE1]"
                    autoFocus
                  />
                  
                  {/* Quick Preset Semester Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-gray-400 self-center">Pilihan Cepat:</span>
                    {[
                      'Semester Ganjil 2024/2025',
                      'Semester Genap 2024/2025',
                      'PTA 2024/2025',
                      'ATA 2024/2025',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setNamaSemesterInput(preset)}
                        className="text-[10px] px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={archiveLoading}
                    onClick={() => setIsArchiveModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    id="btn-confirm-archive"
                    disabled={archiveLoading || jadwalList.length === 0}
                    className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                  >
                    {archiveLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Memindahkan Data...</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-3.5 h-3.5" />
                        <span>Proses & Archive Data</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
