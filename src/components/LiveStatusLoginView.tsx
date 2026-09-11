import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  RefreshCw, 
  Download, 
  FileSpreadsheet, 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  Pause, 
  Play, 
  History,
  Activity,
  Users
} from 'lucide-react';
import { StatusLoginMahasiswa, RefSesi } from '../types';

interface LiveStatusLoginViewProps {
  sesiList: RefSesi[];
  onNavigateToHistory: () => void;
}

export const LiveStatusLoginView: React.FC<LiveStatusLoginViewProps> = ({
  sesiList,
  onNavigateToHistory,
}) => {
  const [data, setData] = useState<StatusLoginMahasiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSesi, setFilterSesi] = useState<string>('all');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Tanggal hari ini dalam format YYYY-MM-DD
  const todayDateStr = new Date().toISOString().split('T')[0];

  const fetchTodayData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      // Query specifically for today's logins
      const res = await fetch(`/api/status-login?date=${todayDateStr}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Error fetching live status login:', err);
    } finally {
      if (showLoading) setLoading(false);
      setLastUpdated(new Date().toLocaleTimeString('id-ID'));
      setCountdown(5);
    }
  };

  useEffect(() => {
    fetchTodayData(true);
  }, []);

  // Auto-refresh timer logic (5-second countdown)
  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchTodayData(false);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh]);

  // Format date header
  const formattedToday = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Format relative time (e.g. "2 menit yang lalu")
  const getRelativeTime = (dateStr: string) => {
    try {
      const loginTime = new Date(dateStr).getTime();
      const diffSec = Math.floor((Date.now() - loginTime) / 1000);
      if (diffSec < 60) return 'Baru saja';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} mnt yang lalu`;
      const diffHour = Math.floor(diffMin / 60);
      return `${diffHour} jam yang lalu`;
    } catch {
      return '-';
    }
  };

  const formatClockTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(d) + ' WIB';
    } catch {
      return dateStr;
    }
  };

  // Filtered dataset
  const filteredData = data.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      item.npm.toLowerCase().includes(term) ||
      item.kelas.toLowerCase().includes(term);

    const matchSesi = filterSesi === 'all' || String(item.sesi) === filterSesi;

    return matchSearch && matchSesi;
  });

  // Breakdown statistics per session today
  const countSesi1 = data.filter((d) => d.sesi === 1).length;
  const countSesi2 = data.filter((d) => d.sesi === 2).length;
  const countSesi3 = data.filter((d) => d.sesi === 3).length;
  const countSesi4 = data.filter((d) => d.sesi === 4).length;

  // Export today's CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data login hari ini untuk diekspor.');
      return;
    }

    const headers = ['No', 'NPM', 'Kelas', 'Sesi', 'Waktu Login Hari Ini'];
    const rows = filteredData.map((item, idx) => [
      idx + 1,
      `"${item.npm}"`,
      `"${item.kelas}"`,
      `"Sesi ${item.sesi}"`,
      `"${formatClockTime(item.tgl_login)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Live_Status_Login_${todayDateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export today's Excel
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data login hari ini untuk diekspor.');
      return;
    }

    const headers = ['No', 'NPM', 'Kelas', 'Sesi', 'Tanggal & Waktu Login'];
    const rows = filteredData.map((item, idx) => [
      idx + 1,
      item.npm,
      item.kelas,
      `Sesi ${item.sesi}`,
      formatClockTime(item.tgl_login),
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\r\n');
    const blob = new Blob(['\uFEFF' + tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Live_Status_Login_${todayDateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Card with Live Indicator */}
      <div 
        className="rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{ backgroundColor: '#525FE1' }}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Live Indicator Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>LIVE MONITORING</span>
            </span>

            <span className="text-indigo-100 text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/10">
              <Calendar className="w-3 h-3 inline mr-1" />
              {formattedToday}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Live Status Login Mahasiswa (Hari Ini)
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Menampilkan catatan presensi login mahasiswa khusus untuk hari ini secara real-time. Data diperbarui otomatis secara live dari sistem eksternal.
          </p>
        </div>

        {/* Live Controls and Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Auto Refresh Toggle */}
          <button
            id="btn-toggle-auto-refresh"
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition border ${
              autoRefresh 
                ? 'bg-white/20 border-white/40 text-white hover:bg-white/30' 
                : 'bg-amber-500/20 border-amber-400/40 text-amber-200 hover:bg-amber-500/30'
            }`}
            title={autoRefresh ? 'Klik untuk menjeda pembaruan otomatis' : 'Klik untuk melanjutkan pembaruan otomatis'}
          >
            {autoRefresh ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Live Sync ({countdown}s)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Sync Dijeda</span>
              </>
            )}
          </button>

          {/* Manual Refresh */}
          <button
            id="btn-manual-refresh-live"
            onClick={() => fetchTodayData(true)}
            title="Muat ulang data sekarang"
            className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/30 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export Excel */}
          <button
            id="btn-export-excel-live"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-white text-[#525FE1] hover:bg-indigo-50 font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Ekspor data hari ini ke Excel (.xls)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          {/* Export CSV */}
          <button
            id="btn-export-csv-live"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs border border-white/30 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Ekspor data hari ini ke CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {/* Switch to History Submenu */}
          <button
            id="btn-switch-to-history"
            onClick={onNavigateToHistory}
            className="px-3.5 py-2 rounded-xl bg-black/20 hover:bg-black/30 text-white font-semibold text-xs border border-white/20 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Buka seluruh rekaman riwayat login"
          >
            <History className="w-4 h-4" />
            <span>Semua Riwayat</span>
          </button>
        </div>
      </div>

      {/* 5 Fast Metrics Cards for Today */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Today */}
        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Total Hari Ini</span>
            <Users className="w-4 h-4 text-[#525FE1]" />
          </div>
          <p className="text-2xl font-bold text-[#525FE1] mt-1">{data.length}</p>
          <span className="text-[11px] text-gray-400">Mahasiswa login</span>
        </div>

        {/* Sesi 1 */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Sesi 1</span>
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{countSesi1}</p>
          <span className="text-[11px] text-gray-400">07:30 - 09:30</span>
        </div>

        {/* Sesi 2 */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Sesi 2</span>
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{countSesi2}</p>
          <span className="text-[11px] text-gray-400">09:30 - 11:30</span>
        </div>

        {/* Sesi 3 */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Sesi 3</span>
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{countSesi3}</p>
          <span className="text-[11px] text-gray-400">13:30 - 15:30</span>
        </div>

        {/* Sesi 4 */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Sesi 4</span>
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{countSesi4}</p>
          <span className="text-[11px] text-gray-400">15:30 - 17:30</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="input-search-live-login"
            type="text"
            placeholder="Cari NPM atau Kelas login hari ini..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-[#525FE1] focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Filter Sesi */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              id="select-live-filter-sesi"
              value={filterSesi}
              onChange={(e) => setFilterSesi(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 bg-white outline-none focus:border-[#525FE1]"
            >
              <option value="all">Semua Sesi Hari Ini</option>
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
                  <option value="1">Sesi 1 (08:00 - 10:00)</option>
                  <option value="2">Sesi 2 (10:15 - 12:15)</option>
                  <option value="3">Sesi 3 (13:00 - 15:00)</option>
                  <option value="4">Sesi 4 (15:15 - 17:15)</option>
                </>
              )}
            </select>
          </div>

          <span className="text-xs text-gray-400 hidden sm:inline">
            Pembaruan terakhir: <strong>{lastUpdated || '-'}</strong>
          </span>
        </div>
      </div>

      {/* Main Live Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-gray-800 text-sm">
              Tabel Live Presensi Mahasiswa Hari Ini
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">
              {filteredData.length} Mahasiswa Terdata
            </span>
          </div>

          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Status: Sinkronisasi Aktif</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-[11px] border-b border-gray-200 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-14">No</th>
                <th className="py-3.5 px-4">NPM Mahasiswa</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Sesi Kursus</th>
                <th className="py-3.5 px-4">Jam Login</th>
                <th className="py-3.5 px-4">Keterangan Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#525FE1] border-t-transparent rounded-full animate-spin" />
                      <span>Memuat data live status login hari ini...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-[#525FE1] mb-1">
                        <Radio className="w-5 h-5 animate-pulse" />
                      </div>
                      <p className="font-semibold text-gray-700">Belum ada aktivitas login mahasiswa hari ini</p>
                      <p className="text-xs text-gray-400 max-w-md">
                        {searchTerm || filterSesi !== 'all'
                          ? 'Tidak ada mahasiswa yang cocok dengan filter pencarian.'
                          : 'Sistem sedang memonitor endpoint POST /api/status-login. Mahasiswa yang login pada hari ini akan otomatis muncul di tabel ini.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, idx) => {
                  const matchingSesi = sesiList.find((s) => s.nomor_sesi === item.sesi);
                  const relTime = getRelativeTime(item.tgl_login);

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-indigo-50/30 transition duration-75"
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-mono text-gray-400 font-medium">
                        {idx + 1}
                      </td>

                      {/* NPM */}
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-800 border border-gray-200 inline-block">
                          {item.npm}
                        </span>
                      </td>

                      {/* Kelas */}
                      <td className="py-3.5 px-4 font-semibold text-gray-800">
                        {item.kelas}
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

                      {/* Jam Login */}
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {formatClockTime(item.tgl_login)}
                      </td>

                      {/* Relative Time Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          relTime === 'Baru saja'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {relTime === 'Baru saja' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          )}
                          <span>{relTime}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
