import React from 'react';
import { 
  Users, 
  Layers, 
  Cpu, 
  Calendar, 
  Upload, 
  Table, 
  Clock, 
  FileSpreadsheet, 
  ArrowRight,
  Sparkles,
  Plus,
  UserCheck
} from 'lucide-react';
import { JadwalKursus, RefSesi } from '../types';

interface DashboardViewProps {
  jadwalList: JadwalKursus[];
  sesiList: RefSesi[];
  onNavigate: (tab: string) => void;
  onOpenUploadJadwal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  jadwalList,
  sesiList,
  onNavigate,
  onOpenUploadJadwal,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const total = jadwalList.length;
  const totalSoshum = jadwalList.filter((j) => j.bidang === 'SOSHUM').length;
  const totalTekrek = jadwalList.filter((j) => j.bidang === 'TEKREK').length;
  const totalToday = jadwalList.filter((j) => j.tanggal === todayStr).length;

  const todayList = jadwalList.filter((j) => j.tanggal === todayStr);

  return (
    <div className="space-y-6">
      {/* 4 Metrics Grid from Professional Polish Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Total Mahasiswa</p>
          <p className="text-2xl font-bold text-[#525FE1] mt-1">{total.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">SOSHUM</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalSoshum.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">TEKREK</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalTekrek.toLocaleString('id-ID')}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Data Hari Ini</p>
          <p className="text-2xl font-bold text-green-500 mt-1">+{totalToday}</p>
        </div>
      </div>

      {/* Hero Welcome / Actions Card */}
      <div 
        className="rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
        style={{ backgroundColor: '#525FE1' }}
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Sistem Informasi Jadwal Kursus Mahasiswa
          </h1>
          <p className="text-indigo-100 text-sm max-w-2xl leading-relaxed">
            Kelola jadwal kursus mahasiswa per hari dan sesi berdasarkan file Excel yang diunggah. Terintegrasi penuh dengan database PostgreSQL, mendukung penambahan riwayat NPM duplikat tanpa menimpa data lama.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => {
              if (onOpenUploadJadwal) onOpenUploadJadwal();
              else onNavigate('jadwal');
            }}
            className="px-4 py-2 bg-white text-[#525FE1] text-sm font-medium rounded shadow-sm hover:bg-gray-50 flex items-center gap-2 transition"
          >
            <Upload className="w-4 h-4" />
            Upload Jadwal (Popup)
          </button>
          <button
            onClick={() => onNavigate('status-login')}
            className="px-4 py-2 bg-white/20 text-white border border-white/30 text-sm font-semibold rounded shadow-sm hover:bg-white/30 flex items-center gap-2 transition"
          >
            <UserCheck className="w-4 h-4" />
            Status Login Mahasiswa
          </button>
          <button
            onClick={() => onNavigate('materi')}
            className="px-4 py-2 bg-white/15 text-white border border-white/20 text-sm font-medium rounded shadow-sm hover:bg-white/25 flex items-center gap-2 transition"
          >
            <Layers className="w-4 h-4" />
            Data Materi (M1-M10)
          </button>
          <button
            onClick={() => onNavigate('jadwal')}
            className="px-4 py-2 bg-white/15 text-white border border-white/20 text-sm font-medium rounded shadow-sm hover:bg-white/25 flex items-center gap-2 transition"
          >
            <Table className="w-4 h-4" />
            Data Jadwal
          </button>
        </div>
      </div>

      {/* Today's Schedule Table & Quick Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Schedule for Today */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#525FE1]" />
              <h3 className="font-semibold text-gray-800 text-sm">
                Jadwal Mahasiswa Hari Ini ({todayStr})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('jadwal')}
              className="text-xs font-bold text-[#525FE1] hover:underline flex items-center gap-1"
            >
              Lihat Semua ({totalToday}) &rarr;
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {todayList.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">
                Tidak ada mahasiswa yang terjadwal untuk hari ini ({todayStr}).
                <div className="mt-3">
                  <button
                    onClick={() => onNavigate('upload')}
                    className="px-4 py-2 bg-[#525FE1] text-white text-xs font-medium rounded shadow-sm hover:brightness-110"
                  >
                    + Import Jadwal Baru
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3 border-b border-gray-200">Bidang</th>
                    <th className="px-6 py-3 border-b border-gray-200">NPM</th>
                    <th className="px-6 py-3 border-b border-gray-200">Nama Mahasiswa</th>
                    <th className="px-6 py-3 border-b border-gray-200">Sesi</th>
                    <th className="px-6 py-3 border-b border-gray-200">Kelas</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-700">
                  {todayList.slice(0, 6).map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                          item.bidang === 'SOSHUM'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {item.bidang}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs">{item.npm}</td>
                      <td className="px-6 py-3.5 font-medium">{item.nama}</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="font-semibold text-gray-900">{item.sesi}</span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 text-xs font-mono">{item.kelas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Reference Cards */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#525FE1]" />
              Referensi Jam Sesi Aktif
            </h4>
            <div className="space-y-2 text-xs">
              {sesiList.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="font-medium text-gray-700">Sesi {s.nomor_sesi}</span>
                  <span className="font-mono text-[#525FE1] font-semibold">
                    {s.waktu_mulai} &mdash; {s.waktu_selesai} WIB
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate('referensi')}
              className="mt-3 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition"
            >
              Atur Sesi & Kelas &rarr;
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Aturan Duplikasi NPM (#5)
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Jika mengupload NPM yang sama, data statusnya <strong>menambahkan</strong> (bukan menimpa jadwal sebelumnya), dan merekam tanggal update terkini pada database PostgreSQL.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-4 bg-gradient-to-br from-indigo-50/50 to-white">
            <h4 className="font-bold text-[#525FE1] text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
              <UserCheck className="w-4 h-4 text-[#525FE1]" />
              Status Login Mahasiswa
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Pantau riwayat presensi login mahasiswa secara langsung (live hari ini) atau telaah seluruh riwayat login yang tersimpan.
            </p>
            <div className="flex gap-2">
              <button
                id="btn-dash-live-login"
                onClick={() => onNavigate('status-login-live')}
                className="flex-1 py-2 bg-[#525FE1] hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Hari Ini</span>
              </button>
              <button
                id="btn-dash-history-login"
                onClick={() => onNavigate('status-login')}
                className="flex-1 py-2 bg-white hover:bg-gray-50 text-[#525FE1] border border-indigo-200 text-xs font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Riwayat</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
