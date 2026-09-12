import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  Search, 
  Download, 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  Calendar, 
  UserCheck, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Layers,
  Clock,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { StatusLoginArchive, ArchiveLoginSemesterSummary } from '../types';
import { exportStatusLoginArchiveToExcel } from '../utils/excelHelper';

interface ArchiveLoginViewProps {
  onNavigateToStatusLogin?: () => void;
  onSubTabChange?: (tab: 'jadwal' | 'login') => void;
}

export const ArchiveLoginView: React.FC<ArchiveLoginViewProps> = ({ 
  onNavigateToStatusLogin,
  onSubTabChange,
}) => {
  const [archiveList, setArchiveList] = useState<StatusLoginArchive[]>([]);
  const [semesterSummary, setSemesterSummary] = useState<ArchiveLoginSemesterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedFakultas, setSelectedFakultas] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deletingItem, setDeletingItem] = useState<StatusLoginArchive | null>(null);
  const [deletingSemester, setDeletingSemester] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchArchiveData = async () => {
    setLoading(true);
    try {
      const [resData, resSemesters] = await Promise.all([
        fetch('/api/archive/status-login'),
        fetch('/api/archive/status-login/semesters'),
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
      console.error('Error fetching archive status login:', err);
      showNotification('Gagal memuat data archive riwayat login: ' + err.message, 'error');
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
      const res = await fetch(`/api/archive/status-login/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus data archive riwayat login.');
      }
      showNotification('Data archive riwayat login berhasil dihapus.');
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
      const res = await fetch(`/api/archive/status-login/semester/${encodeURIComponent(semesterName)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus data semester archive riwayat login.');
      }
      showNotification(`Seluruh data archive riwayat login semester "${semesterName}" berhasil dihapus.`);
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

  // Format date nicely
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(d) + ' WIB';
    } catch {
      return dateStr;
    }
  };

  // Unique list of fakultas for filtering
  const uniqueFakultas = Array.from(new Set(archiveList.map((d) => d.fakultas).filter(Boolean))) as string[];

  // Filtered rows
  const filteredData = archiveList.filter((item) => {
    const matchSemester = selectedSemester === '' || item.nama_semester === selectedSemester;
    const matchFakultas = selectedFakultas === 'all' || item.fakultas === selectedFakultas;
    const matchSearch =
      searchTerm === '' ||
      item.npm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.fakultas && item.fakultas.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.nama_semester.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSemester && matchFakultas && matchSearch;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      showNotification('Tidak ada data yang dapat diekspor.', 'error');
      return;
    }
    const filename = selectedSemester 
      ? `Archive_Riwayat_Login_${selectedSemester.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`
      : 'Semua_Archive_Riwayat_Login.xlsx';
    exportStatusLoginArchiveToExcel(filteredData, filename);
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      showNotification('Tidak ada data yang dapat diekspor.', 'error');
      return;
    }
    const headers = ['No', 'NPM', 'Kelas', 'Fakultas', 'Sesi', 'Tanggal Login', 'Nama Semester', 'Tanggal Diarsip'];
    const rows = filteredData.map((item, idx) => [
      idx + 1,
      `"${item.npm}"`,
      `"${item.kelas}"`,
      `"${item.fakultas || '-'}"`,
      `"Sesi ${item.sesi}"`,
      `"${formatDateTime(item.tgl_login)}"`,
      `"${item.nama_semester}"`,
      `"${formatDateTime(item.archived_at)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedSemester 
      ? `Archive_Riwayat_Login_${selectedSemester.replace(/[^a-zA-Z0-9]/g, '_')}.csv`
      : 'Semua_Archive_Riwayat_Login.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

      {/* Sub-menu Navigation Tabs between Archive Jadwal and Riwayat Login */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => onSubTabChange?.('jadwal')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer flex items-center gap-2"
        >
          <Archive className="w-4 h-4 text-gray-400" />
          <span>Archive Jadwal Mahasiswa</span>
        </button>
        <button
          onClick={() => onSubTabChange?.('login')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#525FE1] text-white shadow-xs transition cursor-pointer flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4 text-white" />
          <span>Archive Riwayat Login</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">Data Archive Riwayat Login</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                PostgreSQL
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Rekaman riwayat login mahasiswa yang telah diarsipkan per semester (NPM, Kelas, Fakultas, Sesi, dan Waktu Login).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
          {onNavigateToStatusLogin && (
            <button
              onClick={onNavigateToStatusLogin}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-[#525FE1] text-xs font-bold rounded-lg transition"
              title="Kembali ke Riwayat Login Aktif"
            >
              <span>Riwayat Login Aktif</span>
            </button>
          )}

          <button
            id="btn-refresh-archive-login"
            onClick={fetchArchiveData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="btn-export-archive-login-excel"
            onClick={handleExportExcel}
            disabled={filteredData.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            id="btn-export-archive-login-csv"
            onClick={handleExportCSV}
            disabled={filteredData.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-40 text-gray-700 text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards per Semester */}
      {semesterSummary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Rekaman Diarsipkan</p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {archiveList.length.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
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
                  ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-200'
                  : 'bg-white border-gray-200 hover:border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 truncate" title={s.nama_semester}>
                  {s.nama_semester}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-black bg-amber-100 text-amber-800">
                  {s.total_login} Login
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
                id="select-filter-semester-login"
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
                    {s.nama_semester} ({s.total_login} login)
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Fakultas Dropdown */}
            {uniqueFakultas.length > 0 && (
              <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 shadow-xs">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                <select
                  id="select-filter-fakultas-archive-login"
                  value={selectedFakultas}
                  onChange={(e) => {
                    setSelectedFakultas(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs font-semibold text-gray-700 bg-transparent outline-none cursor-pointer pr-2"
                >
                  <option value="all">Semua Fakultas</option>
                  {uniqueFakultas.map((fak) => (
                    <option key={fak} value={fak}>
                      {fak}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedSemester && (
              <button
                id="btn-delete-entire-semester-login"
                onClick={() => setDeletingSemester(selectedSemester)}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-bold px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition cursor-pointer"
                title={`Hapus seluruh arsip login ${selectedSemester}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semester Ini</span>
              </button>
            )}

            {(selectedSemester || selectedFakultas !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedSemester('');
                  setSelectedFakultas('all');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="text-xs text-gray-500 hover:text-gray-800 underline px-1 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              id="input-search-archive-login"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari NPM, Kelas, Fakultas, Semester..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs w-full sm:w-72 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white transition"
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
                <th className="px-5 py-3 border-b border-gray-200">Fakultas</th>
                <th className="px-5 py-3 border-b border-gray-200 text-center">Sesi</th>
                <th className="px-5 py-3 border-b border-gray-200">Tanggal & Waktu Login</th>
                <th className="px-5 py-3 border-b border-gray-200">Semester</th>
                <th className="px-5 py-3 border-b border-gray-200">Waktu Diarsip</th>
                <th className="px-5 py-3 border-b border-gray-200 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
                      <span>Memuat data arsip riwayat login...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Archive className="w-8 h-8 text-gray-300" />
                      <p className="font-semibold text-gray-600">Tidak ada data arsip riwayat login ditemukan</p>
                      <p className="text-xs text-gray-400 max-w-sm">
                        {searchTerm || selectedSemester || selectedFakultas !== 'all'
                          ? 'Tidak ada rekaman arsip riwayat login yang cocok dengan kriteria filter.'
                          : 'Belum ada data riwayat login yang diarsipkan ke database.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-amber-50/20 transition">
                      <td className="px-5 py-3.5 border-b border-gray-100 text-center font-mono text-gray-400 font-medium">
                        {globalIdx}
                      </td>
                      <td className="px-5 py-3.5 border-b border-gray-100 font-mono font-bold text-gray-900">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
                          {item.npm}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 border-b border-gray-100 font-semibold text-gray-800">
                        {item.kelas}
                      </td>
                      <td className="px-5 py-3.5 border-b border-gray-100">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {item.fakultas || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 border-b border-gray-100 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>Sesi {item.sesi}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 border-b border-gray-100 text-gray-700">
                        {formatDateTime(item.tgl_login)}
                      </td>
                      <td className="px-5 py-3.5 border-b border-gray-100">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900">
                          {item.nama_semester}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 border-b border-gray-100 text-gray-500 text-[11px]">
                        {formatDateTime(item.archived_at)}
                      </td>
                      <td className="px-5 py-3.5 border-b border-gray-100 text-center">
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Hapus rekaman ini dari arsip"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary Footer */}
        <div className="p-4 bg-gray-50/60 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-gray-500">
            Menampilkan{' '}
            <span className="font-bold text-gray-800">
              {filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{' '}
            hingga{' '}
            <span className="font-bold text-gray-800">
              {Math.min(currentPage * pageSize, filteredData.length)}
            </span>{' '}
            dari{' '}
            <span className="font-bold text-gray-800">
              {filteredData.length}
            </span>{' '}
            rekaman arsip riwayat login
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-700">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Single Item Modal */}
      {deletingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Hapus Arsip Riwayat Login?</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Anda akan menghapus riwayat login mahasiswa NPM <strong className="text-gray-800">{deletingItem.npm}</strong> (Kelas {deletingItem.kelas}, Semester {deletingItem.nama_semester}) dari arsip. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={actionLoading}
                className="px-3 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteItem(deletingItem.id)}
                disabled={actionLoading}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                {actionLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Entire Semester Modal */}
      {deletingSemester && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Hapus Seluruh Arsip Semester Ini?</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Anda akan menghapus seluruh rekaman arsip riwayat login untuk semester <strong className="text-red-600">"{deletingSemester}"</strong>. Data tidak dapat dipulihkan kembali setelah dihapus.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSemester(null)}
                disabled={actionLoading}
                className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSemester(deletingSemester)}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                {actionLoading ? 'Menghapus...' : 'Ya, Hapus Semua'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
