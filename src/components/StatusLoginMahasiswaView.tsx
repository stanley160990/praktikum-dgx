import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Download, 
  RefreshCw, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  Clock, 
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  Radio,
  Archive,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { StatusLoginMahasiswa, RefSesi } from '../types';

interface StatusLoginMahasiswaViewProps {
  sesiList: RefSesi[];
  onNavigateToLive?: () => void;
  onNavigateToArchiveLogin?: () => void;
}

export const StatusLoginMahasiswaView: React.FC<StatusLoginMahasiswaViewProps> = ({ 
  sesiList,
  onNavigateToLive,
  onNavigateToArchiveLogin,
}) => {
  const [data, setData] = useState<StatusLoginMahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSesi, setFilterSesi] = useState<string>('all');
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [filterFakultas, setFilterFakultas] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Archive Modal states
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [namaSemesterInput, setNamaSemesterInput] = useState('');
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [archiveSuccessMsg, setArchiveSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterSesi !== 'all') params.append('sesi', filterSesi);

      const res = await fetch(`/api/status-login?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error fetching status login mahasiswa:', err);
    } finally {
      setLoading(false);
      setLastRefreshed(new Date().toLocaleTimeString('id-ID'));
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterSesi]);

  // Unique lists for filtering
  const uniqueKelas = Array.from(new Set(data.map((d) => d.kelas).filter(Boolean))).sort();
  const uniqueFakultas = Array.from(new Set(data.map((d) => d.fakultas).filter(Boolean))) as string[];

  // Filtered dataset
  const filteredData = data.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      item.npm.toLowerCase().includes(term) || 
      item.kelas.toLowerCase().includes(term) ||
      (item.fakultas && item.fakultas.toLowerCase().includes(term)) ||
      `sesi ${item.sesi}`.toLowerCase().includes(term);

    const matchKelas = filterKelas === 'all' || item.kelas === filterKelas;
    const matchFakultas = filterFakultas === 'all' || item.fakultas === filterFakultas;

    return matchSearch && matchKelas && matchFakultas;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  // Archive action handler
  const handleTriggerArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    setArchiveError(null);
    if (!namaSemesterInput.trim()) {
      setArchiveError('Nama semester wajib diisi untuk menandai data archive riwayat login!');
      return;
    }

    if (data.length === 0) {
      setArchiveError('Tabel riwayat login saat ini masih kosong, tidak ada data untuk di-archive.');
      return;
    }

    setArchiveLoading(true);
    try {
      const res = await fetch('/api/archive/status-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_semester: namaSemesterInput.trim() }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || 'Gagal melakukan proses archive riwayat login.');
      }
      setArchiveSuccessMsg(resData.message);
      fetchData();
      setTimeout(() => {
        setIsArchiveModalOpen(false);
        setNamaSemesterInput('');
        setArchiveSuccessMsg(null);
        if (onNavigateToArchiveLogin) {
          onNavigateToArchiveLogin();
        }
      }, 1500);
    } catch (err: any) {
      setArchiveError(err.message || 'Terjadi kesalahan sistem saat melakukan archive riwayat login.');
    } finally {
      setArchiveLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data yang dapat diekspor.');
      return;
    }

    const headers = ['No', 'NPM', 'Kelas', 'Fakultas', 'Sesi', 'Tanggal & Waktu Login'];
    const rows = filteredData.map((item, idx) => [
      idx + 1,
      `"${item.npm}"`,
      `"${item.kelas}"`,
      `"${item.fakultas || '-'}"`,
      `"Sesi ${item.sesi}"`,
      `"${formatDateTime(item.tgl_login)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Status_Login_Mahasiswa_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export to Tab-delimited (Excel compatible)
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data yang dapat diekspor.');
      return;
    }

    const headers = ['No', 'NPM', 'Kelas', 'Fakultas', 'Sesi', 'Tanggal Login'];
    const rows = filteredData.map((item, idx) => [
      idx + 1,
      item.npm,
      item.kelas,
      item.fakultas || '-',
      `Sesi ${item.sesi}`,
      formatDateTime(item.tgl_login),
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\r\n');
    const blob = new Blob(['\uFEFF' + tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Status_Login_Mahasiswa_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div 
        className="rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{ backgroundColor: '#525FE1' }}
      >
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Riwayat Login Mahasiswa</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat Login Mahasiswa</h1>
          <p className="text-indigo-100 text-xs sm:text-sm max-w-2xl">
            Tabel rekaman seluruh riwayat login mahasiswa terintegrasi langsung dengan database PostgreSQL.
          </p>
        </div>

        {/* Export & Archive Actions in Banner */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigateToLive && (
            <button
              id="btn-switch-to-live-from-history"
              onClick={onNavigateToLive}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Buka Live Status Login khusus hari ini"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Live Status Hari Ini</span>
            </button>
          )}

          {/* Archive Button */}
          <button
            id="btn-open-archive-login-modal"
            onClick={() => {
              setIsArchiveModalOpen(true);
              setArchiveError(null);
              setArchiveSuccessMsg(null);
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition cursor-pointer"
            title="Pindahkan seluruh data riwayat login saat ini ke Data Archive Riwayat Login"
          >
            <Archive className="w-4 h-4 text-amber-100" />
            <span>Archive Riwayat Login</span>
          </button>

          <button
            id="btn-export-excel-status-login"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-white text-[#525FE1] hover:bg-indigo-50 font-bold text-xs shadow-xs flex items-center gap-2 transition cursor-pointer"
            title="Ekspor data tabel ke format Excel (.xls)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            id="btn-export-csv-status-login"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs border border-white/30 shadow-xs flex items-center gap-2 transition cursor-pointer"
            title="Ekspor data tabel ke format CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-refresh-status-login"
            onClick={fetchData}
            title="Muat ulang data terbaru"
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/30 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* System Integration Note */}
      <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-950 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#525FE1] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[#525FE1]">
            Informasi Integrasi Sistem:
          </p>
          <p className="text-gray-600 leading-relaxed">
            Data pada tabel ini dicatat oleh sistem eksternal melalui endpoint API <code>POST /api/status-login</code> dengan field: <code>npm</code>, <code>kelas</code>, <code>fakultas</code>, <code>sesi</code>, dan <code>tgl_login</code>. Untuk pergantian periode/semester, Anda dapat menggunakan tombol <strong>Archive Riwayat Login</strong> di atas untuk memindahkan data aktif ke <strong>Data Archive &gt; Riwayat Login</strong>.
          </p>
        </div>
      </div>

      {/* Filters & Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="input-search-status-login"
            type="text"
            placeholder="Cari NPM, Kelas, atau Fakultas mahasiswa..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#525FE1] focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sesi Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              id="select-filter-sesi"
              value={filterSesi}
              onChange={(e) => {
                setFilterSesi(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white outline-none focus:border-[#525FE1]"
            >
              <option value="all">Semua Sesi</option>
              {sesiList && sesiList.length > 0 ? (
                [...sesiList]
                  .sort((a, b) => a.nomor_sesi - b.nomor_sesi)
                  .map((s) => (
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
          </div>

          {/* Fakultas Filter */}
          {uniqueFakultas.length > 0 && (
            <select
              id="select-filter-fakultas"
              value={filterFakultas}
              onChange={(e) => {
                setFilterFakultas(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white outline-none focus:border-[#525FE1]"
            >
              <option value="all">Semua Fakultas</option>
              {uniqueFakultas.map((fak) => (
                <option key={fak} value={fak}>
                  {fak}
                </option>
              ))}
            </select>
          )}

          {/* Kelas Filter */}
          {uniqueKelas.length > 0 && (
            <select
              id="select-filter-kelas"
              value={filterKelas}
              onChange={(e) => {
                setFilterKelas(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white outline-none focus:border-[#525FE1]"
            >
              <option value="all">Semua Kelas</option>
              {uniqueKelas.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          )}

          {/* Page Size */}
          <select
            id="select-page-size"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white outline-none focus:border-[#525FE1]"
          >
            <option value="10">10 / hal</option>
            <option value="15">15 / hal</option>
            <option value="25">25 / hal</option>
            <option value="50">50 / hal</option>
          </select>
        </div>
      </div>

      {/* Main Single Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-gray-800 text-sm">
              Daftar Riwayat Login Mahasiswa
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[#525FE1] text-xs font-semibold">
              {filteredData.length} Baris Data
            </span>
          </div>

          {lastRefreshed && (
            <span className="text-[11px] text-gray-400">
              Pembaruan terakhir: {lastRefreshed}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-[11px] border-b border-gray-200 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-14">No</th>
                <th className="py-3.5 px-4">NPM</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Fakultas</th>
                <th className="py-3.5 px-4">Sesi</th>
                <th className="py-3.5 px-4">Tanggal & Waktu Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#525FE1] border-t-transparent rounded-full animate-spin" />
                      <span>Memuat data status login dari PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <UserCheck className="w-8 h-8 text-gray-300 mb-1" />
                      <p className="font-semibold text-gray-600">Tidak ada data status login mahasiswa</p>
                      <p className="text-xs text-gray-400">
                        {searchTerm || filterSesi !== 'all' || filterKelas !== 'all' || filterFakultas !== 'all'
                          ? 'Tidak ada hasil yang sesuai dengan kriteria filter.'
                          : 'Belum ada data login yang dicatat dalam tabel aktif.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                  const matchingSesi = sesiList.find((s) => s.nomor_sesi === item.sesi);

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-indigo-50/30 transition duration-75"
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-mono text-gray-400 font-medium">
                        {globalIndex}
                      </td>

                      {/* NPM */}
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 border border-gray-200 inline-block">
                          {item.npm}
                        </span>
                      </td>

                      {/* Kelas */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-gray-800">
                          {item.kelas}
                        </span>
                      </td>

                      {/* Fakultas */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {item.fakultas || '-'}
                        </span>
                      </td>

                      {/* Sesi */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-[#525FE1] border border-indigo-100">
                          <Clock className="w-3 h-3" />
                          <span>Sesi {item.sesi}</span>
                          {matchingSesi && (
                            <span className="text-[10px] text-gray-500 font-normal">
                              ({matchingSesi.waktu_mulai} - {matchingSesi.waktu_selesai})
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Tanggal & Waktu Login */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-medium">
                            {formatDateTime(item.tgl_login)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        {filteredData.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <div>
              Menampilkan{' '}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              sampai{' '}
              <span className="font-semibold text-gray-900">
                {Math.min(currentPage * pageSize, filteredData.length)}
              </span>{' '}
              dari{' '}
              <span className="font-semibold text-gray-900">
                {filteredData.length}
              </span>{' '}
              rekaman
            </div>

            {totalPages > 1 && (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 py-1 bg-white border border-gray-300 rounded-lg font-medium text-gray-800">
                  {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Archive Riwayat Login */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-amber-600">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Archive className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Archive Riwayat Login</h3>
              </div>
              <button
                onClick={() => setIsArchiveModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Peringatan Proses Archive</span>
              </div>
              <p className="leading-relaxed">
                Seluruh {data.length} rekaman riwayat login saat ini akan dipindahkan ke tabel arsip per semester (<strong>Data Archive &gt; Riwayat Login</strong>), dan tabel aktif akan dikosongkan untuk persiapan semester baru.
              </p>
            </div>

            {archiveError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{archiveError}</span>
              </div>
            )}

            {archiveSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{archiveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleTriggerArchive} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Label / Nama Semester Archive <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: PTA 2024/2025 atau Semester Ganjil 2024"
                  value={namaSemesterInput}
                  onChange={(e) => setNamaSemesterInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition"
                  disabled={archiveLoading || !!archiveSuccessMsg}
                  autoFocus
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Nama ini akan digunakan untuk mengelompokkan data riwayat login saat dilihat di menu Data Archive.
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-gray-500 font-medium">Contoh Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['PTA 2024/2025', 'ATA 2024/2025', 'Semester Ganjil 2024/2025', 'Semester Genap 2024/2025'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNamaSemesterInput(s)}
                      className="px-2 py-1 bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-800 rounded-md text-[11px] font-medium transition cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(false)}
                  disabled={archiveLoading}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={archiveLoading || !!archiveSuccessMsg || !namaSemesterInput.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  {archiveLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Mengarsipkan...</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5" />
                      <span>Konfirmasi Archive</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
