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
  Upload
} from 'lucide-react';
import { JadwalKursus, RefSesi, RefKelas } from '../types';
import { exportJadwalToExcel } from '../utils/excelHelper';

interface JadwalTableViewProps {
  jadwalList: JadwalKursus[];
  sesiList: RefSesi[];
  kelasList: RefKelas[];
  onRefresh: () => void;
  onAddManual: (item: Partial<JadwalKursus>) => Promise<boolean>;
  onEdit: (id: number, item: Partial<JadwalKursus>) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onOpenUploadModal?: () => void;
  onNavigateToUpload?: () => void;
}

export const JadwalTableView: React.FC<JadwalTableViewProps> = ({
  jadwalList,
  sesiList,
  kelasList,
  onRefresh,
  onAddManual,
  onEdit,
  onDelete,
  onOpenUploadModal,
  onNavigateToUpload,
}) => {
  // Sort sesiList by nomor_sesi ascending
  const sortedSesiList = [...sesiList].sort((a, b) => a.nomor_sesi - b.nomor_sesi);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBidang, setFilterBidang] = useState('');
  const [filterSesi, setFilterSesi] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');

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
    npm: '',
    kelas: 'TEK-01',
    nama: '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter logic
  const filteredData = jadwalList.filter((item) => {
    const matchSearch =
      searchTerm === '' ||
      item.npm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kelas.toLowerCase().includes(searchTerm.toLowerCase());

    const matchBidang = filterBidang === '' || item.bidang === filterBidang;
    const matchSesi = filterSesi === '' || String(item.sesi) === filterSesi;
    const matchTanggal = filterTanggal === '' || item.tanggal === filterTanggal;

    return matchSearch && matchBidang && matchSesi && matchTanggal;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterBidang('');
    setFilterSesi('');
    setFilterTanggal('');
    setCurrentPage(1);
  };

  const handleOpenAddModal = () => {
    const defaultSesi = sortedSesiList.length > 0 ? sortedSesiList[0].nomor_sesi : 1;
    setFormData({
      bidang: 'TEKREK',
      tanggal: new Date().toISOString().split('T')[0],
      sesi: defaultSesi,
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
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
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
    </div>
  );
};
