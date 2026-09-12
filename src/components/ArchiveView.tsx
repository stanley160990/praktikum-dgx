import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  Search, 
  Download, 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  GraduationCap, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Layers
} from 'lucide-react';
import { JadwalKursusArchive, ArchiveSemesterSummary } from '../types';
import { exportArchiveToExcel } from '../utils/excelHelper';

interface ArchiveViewProps {
  onNavigateToJadwal?: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onNavigateToJadwal }) => {
  const [archiveList, setArchiveList] = useState<JadwalKursusArchive[]>([]);
  const [semesterSummary, setSemesterSummary] = useState<ArchiveSemesterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deletingItem, setDeletingItem] = useState<JadwalKursusArchive | null>(null);
  const [deletingSemester, setDeletingSemester] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchArchiveData = async () => {
    setLoading(true);
    try {
      const [resData, resSemesters] = await Promise.all([
        fetch('/api/archive'),
        fetch('/api/archive/semesters'),
      ]);

      const [dataRes, semestersRes] = await Promise.all([
        resData.json(),
        resSemesters.json(),
      ]);

      if (dataRes.success) {
        setArchiveList(dataRes.data);
      }
      if (semestersRes.success) {
        setSemesterSummary(semestersRes.data);
      }
    } catch (err: any) {
      console.error('Error fetching archive:', err);
      showNotification('Gagal memuat data archive: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchiveData();
  }, []);

  const handleDeleteItem = async (id: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/archive/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus data archive.');
      }
      showNotification('Data archive mahasiswa berhasil dihapus.');
      setDeletingItem(null);
      await fetchArchiveData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSemester = async (semesterName: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/archive/semester/${encodeURIComponent(semesterName)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus data semester archive.');
      }
      showNotification(`Seluruh data archive semester "${semesterName}" berhasil dihapus.`);
      setDeletingSemester(null);
      if (selectedSemester === semesterName) {
        setSelectedSemester('');
      }
      await fetchArchiveData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered rows
  const filteredData = archiveList.filter((item) => {
    const matchSemester = selectedSemester === '' || item.nama_semester === selectedSemester;
    const matchSearch =
      searchTerm === '' ||
      item.npm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama_mahasiswa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama_semester.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSemester && matchSearch;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExport = () => {
    const filename = selectedSemester 
      ? `Archive_Mahasiswa_${selectedSemester.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
      : 'Semua_Archive_Mahasiswa.xlsx';
    exportArchiveToExcel(filteredData, filename);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 shadow-md border ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-indigo-50 text-[#525FE1] rounded-xl border border-indigo-100">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Data Archive Mahasiswa</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-[#525FE1] border border-indigo-200">
                PostgreSQL
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Data arsip riwayat mahasiswa kursus per semester (NPM, Kelas, Nama Mahasiswa, Sesi, dan Nama Semester).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
          <button
            id="btn-refresh-archive"
            onClick={fetchArchiveData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="btn-export-archive-excel"
            onClick={handleExport}
            disabled={filteredData.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold rounded-lg shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel Archive</span>
          </button>
        </div>
      </div>

      {/* Summary Cards per Semester */}
      {semesterSummary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Mahasiswa Terarsip</p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {archiveList.length.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Periode Semester</p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {semesterSummary.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Quick chips for latest 2 semesters */}
          {semesterSummary.slice(0, 2).map((s) => (
            <div 
              key={s.nama_semester}
              onClick={() => {
                setSelectedSemester(selectedSemester === s.nama_semester ? '' : s.nama_semester);
                setCurrentPage(1);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition shadow-xs flex flex-col justify-between ${
                selectedSemester === s.nama_semester
                  ? 'bg-indigo-50/70 border-[#525FE1] ring-2 ring-indigo-200'
                  : 'bg-white border-gray-200 hover:border-indigo-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 truncate" title={s.nama_semester}>
                  {s.nama_semester}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-black bg-indigo-100 text-[#525FE1]">
                  {s.total_mahasiswa} Mhs
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Diarsip: {s.last_archived ? new Date(s.last_archived).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden flex flex-col">
        {/* Filters Toolbar */}
        <div className="p-4 bg-gray-50/60 border-b border-gray-200 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Semester Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 shadow-xs">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                id="select-filter-semester"
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-gray-700 bg-transparent outline-none cursor-pointer pr-2"
              >
                <option value="">Semua Semester ({archiveList.length})</option>
                {semesterSummary.map((s) => (
                  <option key={s.nama_semester} value={s.nama_semester}>
                    {s.nama_semester} ({s.total_mahasiswa} mhs)
                  </option>
                ))}
              </select>
            </div>

            {selectedSemester && (
              <button
                id="btn-delete-entire-semester"
                onClick={() => setDeletingSemester(selectedSemester)}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-bold px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition"
                title={`Hapus seluruh arsip ${selectedSemester}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semester Ini</span>
              </button>
            )}

            {(selectedSemester || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedSemester('');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="text-xs text-gray-500 hover:text-gray-800 underline px-1"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              id="input-search-archive"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari NPM, Nama, Kelas, Semester..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs w-full sm:w-72 outline-none focus:border-[#525FE1] focus:ring-1 focus:ring-[#525FE1] bg-white transition"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/80 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                <th className="px-5 py-3 border-b border-gray-200 w-12 text-center">No</th>
                <th className="px-5 py-3 border-b border-gray-200">NPM</th>
                <th className="px-5 py-3 border-b border-gray-200">Kelas</th>
                <th className="px-5 py-3 border-b border-gray-200">Nama Mahasiswa</th>
                <th className="px-5 py-3 border-b border-gray-200 text-center">Sesi</th>
                <th className="px-5 py-3 border-b border-gray-200">Nama Semester</th>
                <th className="px-5 py-3 border-b border-gray-200">Tanggal Diarsip</th>
                <th className="px-5 py-3 border-b border-gray-200 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#525FE1]" />
                      <span>Memuat data arsip mahasiswa...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-14 text-center text-gray-400">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#525FE1] flex items-center justify-center mb-3">
                        <Archive className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-gray-800 text-sm">Belum Ada Data Mahasiswa yang Di-archive</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Data archive dihasilkan saat Anda menekan tombol <b>Archive Semester</b> di menu <b>Data Jadwal Mahasiswa</b>.
                      </p>
                      {onNavigateToJadwal && (
                        <button
                          onClick={onNavigateToJadwal}
                          className="mt-4 px-4 py-2 bg-[#525FE1] text-white text-xs font-bold rounded-lg shadow-xs hover:bg-[#434ebc] transition"
                        >
                          Buka Data Jadwal Mahasiswa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-3.5 text-center text-gray-400 font-mono">
                      {(currentPage - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                      {item.npm}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-gray-700">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[11px] font-semibold">
                        {item.kelas}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {item.nama_mahasiswa}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        Sesi {item.sesi}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-purple-500" />
                        {item.nama_semester}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-[11px] whitespace-nowrap">
                      {item.archived_at 
                        ? new Date(item.archived_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                        : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => setDeletingItem(item)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                        title="Hapus baris archive ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500">
            Menampilkan {paginatedData.length} dari {filteredData.length.toLocaleString('id-ID')} mahasiswa terarsip
            {selectedSemester && <span> (Semester: <b>{selectedSemester}</b>)</span>}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-700 px-3 py-1">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Single Record */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-black text-gray-900 text-lg">Hapus Arsip Mahasiswa?</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus data arsip mahasiswa <b>{deletingItem.nama_mahasiswa}</b> (NPM: {deletingItem.npm}) pada semester <b>{deletingItem.nama_semester}</b>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDeleteItem(deletingItem.id)}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {actionLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Seluruh Semester */}
      {deletingSemester && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2.5 bg-red-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-black text-gray-900 text-lg">Hapus Seluruh Arsip Semester?</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Peringatan: Seluruh data arsip mahasiswa untuk semester <b>"{deletingSemester}"</b> akan dihapus secara permanen dari database PostgreSQL.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingSemester(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDeleteSemester(deletingSemester)}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {actionLoading ? 'Menghapus...' : 'Hapus Seluruh Semester'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
