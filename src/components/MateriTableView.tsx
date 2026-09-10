import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  RefreshCw, 
  Upload, 
  Eye, 
  X, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  FileSpreadsheet,
  Layers,
  GraduationCap
} from 'lucide-react';
import { MateriKursus, JadwalKursus } from '../types';
import { exportMateriToExcel, downloadSampleMateriExcel } from '../utils/excelHelper';
import { UploadMateriModal } from './UploadMateriModal';

interface MateriTableViewProps {
  materiList: MateriKursus[];
  jadwalList: JadwalKursus[];
  onRefresh: () => void;
  onAddMateri: (item: Partial<MateriKursus>) => Promise<boolean>;
  onEditMateri: (id: number, item: Partial<MateriKursus>) => Promise<boolean>;
  onDeleteMateri: (id: number) => Promise<boolean>;
}

export const MateriTableView: React.FC<MateriTableViewProps> = ({
  materiList,
  jadwalList,
  onRefresh,
  onAddMateri,
  onEditMateri,
  onDeleteMateri,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MateriKursus | null>(null);
  const [detailItem, setDetailItem] = useState<MateriKursus | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    npm: '',
    nama: '',
    materi_m1: '',
    materi_m2: '',
    materi_m3: '',
    materi_m4: '',
    materi_m5: '',
    materi_m6: '',
    materi_m7: '',
    materi_m8: '',
    materi_m9: '',
    materi_m10: '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter logic: matches NPM, Nama, or any of the 10 materials!
  const filteredData = materiList.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchNpm = item.npm.toLowerCase().includes(term);
    const matchNama = (item.nama || '').toLowerCase().includes(term);
    const matchMateri = [
      item.materi_m1,
      item.materi_m2,
      item.materi_m3,
      item.materi_m4,
      item.materi_m5,
      item.materi_m6,
      item.materi_m7,
      item.materi_m8,
      item.materi_m9,
      item.materi_m10,
    ].some((m) => (m || '').toLowerCase().includes(term));

    return matchNpm || matchNama || matchMateri;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAddModal = () => {
    setFormData({
      npm: '',
      nama: '',
      materi_m1: '',
      materi_m2: '',
      materi_m3: '',
      materi_m4: '',
      materi_m5: '',
      materi_m6: '',
      materi_m7: '',
      materi_m8: '',
      materi_m9: '',
      materi_m10: '',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: MateriKursus) => {
    setEditingItem(item);
    setFormData({
      npm: item.npm,
      nama: item.nama || '',
      materi_m1: item.materi_m1 || '',
      materi_m2: item.materi_m2 || '',
      materi_m3: item.materi_m3 || '',
      materi_m4: item.materi_m4 || '',
      materi_m5: item.materi_m5 || '',
      materi_m6: item.materi_m6 || '',
      materi_m7: item.materi_m7 || '',
      materi_m8: item.materi_m8 || '',
      materi_m9: item.materi_m9 || '',
      materi_m10: item.materi_m10 || '',
    });
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.npm.trim()) {
      setFormError('NPM wajib diisi.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    let success = false;
    if (editingItem) {
      success = await onEditMateri(editingItem.id, formData);
      if (success) setEditingItem(null);
    } else {
      success = await onAddMateri(formData);
      if (success) setIsAddModalOpen(false);
    }

    setFormSubmitting(false);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    await onDeleteMateri(deletingId);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Table Container in Professional Polish Theme */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar Header */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-gray-50">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-upload-materi-popup"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-[#525FE1] text-white text-sm font-medium rounded shadow-sm hover:brightness-110 transition flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              Upload Excel Materi
            </button>

            <button
              id="btn-tambah-materi-manual"
              onClick={handleOpenAddModal}
              className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded shadow-sm hover:bg-gray-50 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Tambah Manual
            </button>

            <button
              onClick={downloadSampleMateriExcel}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded shadow-sm hover:bg-gray-50 transition flex items-center gap-1.5"
              title="Download format Excel Materi (M1 - M10)"
            >
              <Download className="w-4 h-4" />
              Template Excel
            </button>

            <button
              id="btn-export-materi-excel"
              onClick={() => exportMateriToExcel(filteredData)}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded shadow-sm hover:bg-gray-50 transition flex items-center gap-1.5"
              title="Ekspor Data Materi ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export ({filteredData.length})
            </button>

            <button
              onClick={onRefresh}
              className="p-2 bg-white border border-gray-300 text-gray-700 rounded shadow-sm hover:bg-gray-50 transition"
              title="Muat Ulang Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <input
                id="input-search-materi"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari NPM, Nama, atau Materi..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded text-sm w-64 md:w-72 outline-none focus:border-[#525FE1]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* Informative Sub-header */}
        <div className="px-6 py-2.5 bg-indigo-50/40 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Data Table Materi Pembelajaran (M1 s/d M10)</span>
            <span className="text-gray-400">&bull;</span>
            <span>Total: <strong className="text-gray-900">{filteredData.length}</strong> Mahasiswa</span>
          </div>
          <span className="text-gray-400 italic hidden sm:inline">
            Klik tombol "Lihat Silabus" untuk melihat materi lengkap per mahasiswa
          </span>
        </div>

        {/* Data Table View */}
        <div className="flex-1 overflow-x-auto min-h-[380px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 border-b border-gray-200 w-12 text-center">No</th>
                <th className="px-4 py-3 border-b border-gray-200">NPM</th>
                <th className="px-4 py-3 border-b border-gray-200 min-w-[150px]">Nama Mahasiswa</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[120px]">Materi M1</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[120px]">Materi M2</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[120px]">Materi M3</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[120px]">Materi M4</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[120px]">Materi M5</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[120px]">Materi M6</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[120px]">Materi M7</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[120px]">Materi M8</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[120px]">Materi M9</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[120px]">Materi M10</th>
                <th className="px-4 py-3 border-b border-gray-200 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs text-gray-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <BookOpen className="w-8 h-8 text-gray-300" />
                      <p className="font-semibold text-gray-700">Tidak ada data materi ditemukan</p>
                      <p className="text-gray-400 text-xs">
                        Silakan klik "Upload Excel Materi" untuk mengunggah file Excel berisi kolom npm dan Materi M1 s/d M10.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const itemIndex = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3 text-center text-gray-400 font-mono">{itemIndex}</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#525FE1] whitespace-nowrap">
                        {item.npm}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                        {item.nama || '-'}
                      </td>
                      <td className="px-3 py-3 max-w-[140px] truncate text-gray-600" title={item.materi_m1}>
                        <span className="block truncate">{item.materi_m1 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[140px] truncate text-gray-600" title={item.materi_m2}>
                        <span className="block truncate">{item.materi_m2 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[140px] truncate text-gray-600" title={item.materi_m3}>
                        <span className="block truncate">{item.materi_m3 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[140px] truncate text-gray-600" title={item.materi_m4}>
                        <span className="block truncate">{item.materi_m4 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[140px] truncate text-gray-600" title={item.materi_m5}>
                        <span className="block truncate">{item.materi_m5 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[140px] truncate text-gray-600" title={item.materi_m6}>
                        <span className="block truncate">{item.materi_m6 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[140px] truncate text-gray-600" title={item.materi_m7}>
                        <span className="block truncate">{item.materi_m7 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[140px] truncate text-gray-600" title={item.materi_m8}>
                        <span className="block truncate">{item.materi_m8 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[140px] truncate text-gray-600" title={item.materi_m9}>
                        <span className="block truncate">{item.materi_m9 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[140px] truncate text-gray-600" title={item.materi_m10}>
                        <span className="block truncate">{item.materi_m10 || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setDetailItem(item)}
                            title="Lihat Detail Silabus M1-M10"
                            className="p-1.5 text-gray-500 hover:text-[#525FE1] hover:bg-indigo-50 rounded transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Materi"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            title="Hapus Materi"
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 bg-white">
          <div>
            Menampilkan <span className="font-semibold text-gray-800">{filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> sampai{' '}
            <span className="font-semibold text-gray-800">{Math.min(currentPage * pageSize, filteredData.length)}</span> dari{' '}
            <span className="font-semibold text-gray-800">{filteredData.length}</span> entri materi
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Sebelumnya
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 border rounded transition ${
                  currentPage === page
                    ? 'bg-[#525FE1] text-white border-[#525FE1] font-semibold'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Upload Materi Popup Modal */}
      <UploadMateriModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        existingJadwal={jadwalList}
        onUploadSuccess={() => {
          onRefresh();
          setIsUploadModalOpen(false);
        }}
      />

      {/* View Detail Silabus Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#525FE1]/10 flex items-center justify-center text-[#525FE1]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Silabus Materi Mahasiswa</h3>
                  <p className="text-xs text-gray-500 font-mono">{detailItem.npm} &bull; {detailItem.nama || 'Mahasiswa'}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Materi M1', val: detailItem.materi_m1 },
                  { label: 'Materi M2', val: detailItem.materi_m2 },
                  { label: 'Materi M3', val: detailItem.materi_m3 },
                  { label: 'Materi M4', val: detailItem.materi_m4 },
                  { label: 'Materi M5', val: detailItem.materi_m5 },
                  { label: 'Materi M6', val: detailItem.materi_m6 },
                  { label: 'Materi M7', val: detailItem.materi_m7 },
                  { label: 'Materi M8', val: detailItem.materi_m8 },
                  { label: 'Materi M9', val: detailItem.materi_m9 },
                  { label: 'Materi M10', val: detailItem.materi_m10 },
                ].map((m, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-[#525FE1] uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block">
                      {m.label}
                    </span>
                    <p className="text-xs font-semibold text-gray-800 leading-relaxed mt-1">
                      {m.val || <span className="text-gray-400 italic">Belum ditentukan</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Materi Modal */}
      {(isAddModalOpen || editingItem) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
              <h3 className="font-bold text-gray-900 text-base">
                {editingItem ? 'Edit Data Materi Mahasiswa' : 'Tambah Materi Mahasiswa Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    NPM Mahasiswa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.npm}
                    onChange={(e) => setFormData({ ...formData, npm: e.target.value })}
                    placeholder="Contoh: 2023101001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#525FE1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Mahasiswa</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Nama Lengkap Mahasiswa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#525FE1]"
                  />
                </div>
              </div>

              {/* M1 to M10 Inputs */}
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                  Silabus Materi (M1 s/d M10)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                    const key = `materi_m${num}` as keyof typeof formData;
                    return (
                      <div key={num}>
                        <label className="block text-[11px] font-medium text-gray-600 mb-1">
                          Materi M{num}
                        </label>
                        <input
                          type="text"
                          value={formData[key]}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                          placeholder={`Topik Materi M${num}...`}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#525FE1]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#525FE1] hover:brightness-110 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : 'Simpan Materi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">Hapus Materi Mahasiswa?</h4>
              <p className="text-xs text-gray-500 mt-1">
                Data silabus materi mahasiswa ini akan dihapus secara permanen dari database PostgreSQL.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
