import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Eye, 
  X, 
  AlertCircle,
  BookOpen,
  FileSpreadsheet,
  GraduationCap
} from 'lucide-react';
import { MateriKursus, RefFakultas } from '../types';
import { exportMateriToExcel } from '../utils/excelHelper';

interface MateriTableViewProps {
  materiList: MateriKursus[];
  fakultasList: RefFakultas[];
  onRefresh: () => void;
  onAddMateri: (item: Partial<MateriKursus>) => Promise<boolean>;
  onEditMateri: (id: number, item: Partial<MateriKursus>) => Promise<boolean>;
  onDeleteMateri: (id: number) => Promise<boolean>;
}

export const MateriTableView: React.FC<MateriTableViewProps> = ({
  materiList,
  fakultasList,
  onRefresh,
  onAddMateri,
  onEditMateri,
  onDeleteMateri,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFakultas, setFilterFakultas] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MateriKursus | null>(null);
  const [detailItem, setDetailItem] = useState<MateriKursus | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form state
  const defaultFakultas = fakultasList.length > 0 ? fakultasList[0].kode_fakultas : 'FTI';
  const [formData, setFormData] = useState({
    fakultas: defaultFakultas,
    keterangan: '',
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

  // Filter logic: matches Fakultas, Nama Fakultas, Keterangan, or any of the 10 materials
  const filteredData = materiList.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      (item.fakultas || '').toLowerCase().includes(term) ||
      (item.nama_fakultas || '').toLowerCase().includes(term) ||
      (item.keterangan || '').toLowerCase().includes(term) ||
      [
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

    const matchFakultas = !filterFakultas || item.fakultas === filterFakultas;

    return matchSearch && matchFakultas;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenAddModal = () => {
    setFormData({
      fakultas: fakultasList.length > 0 ? fakultasList[0].kode_fakultas : 'FTI',
      keterangan: '',
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
      fakultas: item.fakultas || (fakultasList.length > 0 ? fakultasList[0].kode_fakultas : 'FTI'),
      keterangan: item.keterangan || '',
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
    if (!formData.fakultas) {
      setFormError('Fakultas wajib dipilih.');
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
      {/* Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar Header */}
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-gray-50">
          <div className="flex flex-wrap items-center gap-2">
            {/* Button Tambah as requested: 'cukup Tambah manual, - - tambah manual diganti menjadi tambah saja' */}
            <button
              id="btn-tambah-materi"
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-[#525FE1] text-white text-sm font-semibold rounded shadow-sm hover:brightness-110 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Tambah
            </button>

            <button
              id="btn-export-materi-excel"
              onClick={() => exportMateriToExcel(filteredData)}
              className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded shadow-sm hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer"
              title="Ekspor Data Materi ke Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export Excel ({filteredData.length})
            </button>

            <button
              onClick={onRefresh}
              className="p-2 bg-white border border-gray-300 text-gray-700 rounded shadow-sm hover:bg-gray-50 transition cursor-pointer"
              title="Muat Ulang Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Fakultas Dropdown */}
            <select
              value={filterFakultas}
              onChange={(e) => {
                setFilterFakultas(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded text-sm bg-white outline-none focus:border-[#525FE1]"
            >
              <option value="">Semua Fakultas</option>
              {fakultasList.map((f) => (
                <option key={f.id} value={f.kode_fakultas}>
                  {f.kode_fakultas} - {f.nama_fakultas}
                </option>
              ))}
            </select>

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
                placeholder="Cari materi atau fakultas..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded text-sm w-56 md:w-64 outline-none focus:border-[#525FE1]"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        {/* Informative Sub-header */}
        <div className="px-6 py-2.5 bg-indigo-50/40 border-b border-gray-100 flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Silabus Materi Pembelajaran Berdasarkan Fakultas (M1 s/d M10)</span>
            <span className="text-gray-400">&bull;</span>
            <span>Total: <strong className="text-gray-900">{filteredData.length}</strong> Fakultas Terdaftar</span>
          </div>
          <span className="text-gray-400 italic hidden sm:inline">
            Klik ikon mata untuk melihat silabus lengkap M1 s/d M10 per fakultas
          </span>
        </div>

        {/* Data Table View */}
        <div className="flex-1 overflow-x-auto min-h-[380px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 border-b border-gray-200 w-12 text-center">No</th>
                <th className="px-4 py-3 border-b border-gray-200 min-w-[170px]">Fakultas</th>
                <th className="px-4 py-3 border-b border-gray-200 min-w-[160px]">Keterangan</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[110px]">M1</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[110px]">M2</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[110px]">M3</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[110px]">M4</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[110px]">M5</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[110px]">M6</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[110px]">M7</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[110px]">M8</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[110px]">M9</th>
                <th className="px-3 py-3 border-b border-gray-200 min-w-[110px]">M10</th>
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
                        Silakan klik tombol "+ Tambah" di atas untuk menambahkan silabus materi baru berdasarkan fakultas.
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-indigo-50 text-[#525FE1] border border-indigo-100">
                            {item.fakultas}
                          </span>
                          <span className="font-semibold text-gray-900 text-xs truncate max-w-[160px]" title={item.nama_fakultas || item.fakultas}>
                            {item.nama_fakultas || item.fakultas}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 truncate max-w-[160px]" title={item.keterangan || '-'}>
                        {item.keterangan || '-'}
                      </td>
                      <td className="px-3 py-3 max-w-[120px] truncate text-gray-600" title={item.materi_m1}>
                        <span className="block truncate">{item.materi_m1 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[120px] truncate text-gray-600" title={item.materi_m2}>
                        <span className="block truncate">{item.materi_m2 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[120px] truncate text-gray-600" title={item.materi_m3}>
                        <span className="block truncate">{item.materi_m3 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[120px] truncate text-gray-600" title={item.materi_m4}>
                        <span className="block truncate">{item.materi_m4 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[120px] truncate text-gray-600" title={item.materi_m5}>
                        <span className="block truncate">{item.materi_m5 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[120px] truncate text-gray-600" title={item.materi_m6}>
                        <span className="block truncate">{item.materi_m6 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[120px] truncate text-gray-600" title={item.materi_m7}>
                        <span className="block truncate">{item.materi_m7 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[120px] truncate text-gray-600" title={item.materi_m8}>
                        <span className="block truncate">{item.materi_m8 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[120px] truncate text-gray-600" title={item.materi_m9}>
                        <span className="block truncate">{item.materi_m9 || '-'}</span>
                      </td>
                      <td className="px-3 py-3 max-w-[120px] truncate text-gray-600" title={item.materi_m10}>
                        <span className="block truncate">{item.materi_m10 || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setDetailItem(item)}
                            title="Lihat Detail Silabus M1-M10"
                            className="p-1.5 text-gray-500 hover:text-[#525FE1] hover:bg-indigo-50 rounded transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            title="Edit Silabus Materi"
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            title="Hapus Materi Fakultas"
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
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
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-white text-xs">
            <span className="text-gray-500">
              Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredData.length)} dari {filteredData.length} data
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1.5 rounded font-medium ${
                    currentPage === i + 1
                      ? 'bg-[#525FE1] text-white'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Detail Silabus Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#525FE1]/10 flex items-center justify-center text-[#525FE1]">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Silabus Materi Berdasarkan Fakultas</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span className="font-mono font-bold text-[#525FE1] bg-indigo-50 px-1.5 py-0.5 rounded">
                      {detailItem.fakultas}
                    </span>
                    <span>{detailItem.nama_fakultas || detailItem.fakultas}</span>
                    {detailItem.keterangan && (
                      <>
                        <span>&bull;</span>
                        <span className="italic">{detailItem.keterangan}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition cursor-pointer"
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
                className="px-4 py-2 bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg hover:bg-gray-300 transition cursor-pointer"
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
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#525FE1]" />
                <h3 className="font-bold text-gray-900 text-base">
                  {editingItem ? 'Edit Silabus Materi Fakultas' : 'Tambah Silabus Materi Fakultas'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingItem(null);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition cursor-pointer"
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
                    Pilih Fakultas <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.fakultas}
                    onChange={(e) => setFormData({ ...formData, fakultas: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#525FE1] bg-white font-medium"
                  >
                    {fakultasList.map((f) => (
                      <option key={f.id} value={f.kode_fakultas}>
                        {f.kode_fakultas} - {f.nama_fakultas}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Menggunakan data referensi fakultas yang tersedia di sistem.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Keterangan / Kurikulum (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    placeholder="Contoh: Kurikulum 2024 / Standar Fakultas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#525FE1]"
                  />
                </div>
              </div>

              {/* M1 to M10 Inputs */}
              <div className="pt-2 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Silabus Materi Pembelajaran (Materi M1 s/d M10)</span>
                  <span className="text-[10px] font-normal text-gray-400">Disesuaikan untuk kurikulum fakultas</span>
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
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#525FE1] hover:brightness-110 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
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
              <h4 className="font-bold text-gray-900 text-base">Hapus Silabus Materi Fakultas?</h4>
              <p className="text-xs text-gray-500 mt-1">
                Data silabus materi fakultas ini akan dihapus secara permanen dari database PostgreSQL.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition cursor-pointer"
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
