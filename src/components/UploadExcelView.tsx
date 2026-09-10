import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Layers, 
  Info,
  FileCheck,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { ExcelRow, parseExcelFile, downloadSampleExcel } from '../utils/excelHelper';
import { JadwalKursus } from '../types';

interface UploadExcelViewProps {
  existingJadwal: JadwalKursus[];
  onUploadSuccess: () => void;
  onNavigateToTable: () => void;
}

export const UploadExcelView: React.FC<UploadExcelViewProps> = ({
  existingJadwal,
  onUploadSuccess,
  onNavigateToTable,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ExcelRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    total: number;
    baru: number;
    duplikat_ditambahkan: number;
  } | null>(null);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);

  const existingNpms = new Set(existingJadwal.map((j) => j.npm.trim()));

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setParseError(null);
    setUploadResult(null);
    setIsParsing(true);

    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        throw new Error('Tidak ada baris data yang valid ditemukan dalam file Excel.');
      }
      setParsedRows(rows);
    } catch (err: any) {
      setParseError(err.message || 'Gagal membaca file Excel. Pastikan format kolom sesuai.');
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleProcessUpload = async () => {
    if (parsedRows.length === 0) return;
    setIsUploading(true);
    setParseError(null);

    try {
      const res = await fetch('/api/jadwal/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengupload ke database PostgreSQL.');
      }

      setUploadResult(data.summary);
      onUploadSuccess();
    } catch (err: any) {
      setParseError(err.message || 'Gagal memproses upload ke database.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setUploadResult(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Upload Jadwal Mahasiswa (Excel)</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Unggah file spreadsheet <code>.xlsx</code> / <code>.xls</code> / <code>.csv</code> untuk menyimpan jadwal ke database PostgreSQL secara otomatis.
        </p>
      </div>

      {/* Specifications & Rule Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
            style={{ backgroundColor: '#525FE1' }}
          >
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-2 flex-1">
            <h3 className="font-semibold text-gray-800 text-sm">Spesifikasi Kolom Excel & Aturan Sistem:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-700 block">Kolom 1: Bidang</span>
                <span className="text-gray-500 text-[11px]">SOSHUM / TEKREK</span>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-700 block">Kolom 2: Tanggal</span>
                <span className="text-gray-500 text-[11px]">YYYY-MM-DD</span>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-700 block">Kolom 3: Sesi</span>
                <span className="text-gray-500 text-[11px]">1, 2, 3, atau 4</span>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-700 block">Kolom 4: NPM</span>
                <span className="text-gray-500 text-[11px]">Varchar (NIM)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-700 block">Kolom 5: Kelas</span>
                <span className="text-gray-500 text-[11px]">Varchar (3IA01)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-gray-700 block">Kolom 6: Nama</span>
                <span className="text-gray-500 text-[11px]">Varchar (Nama)</span>
              </div>
            </div>

            {/* Rule 5 Highlight */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2 mt-2">
              <span className="font-bold text-amber-800 shrink-0">Aturan Khusus #5:</span>
              <span>
                Jika mengupload <strong>NPM yang sama</strong>, sistem tidak akan menimpa data sebelumnya, melainkan <strong>statusnya MENAMBAHKAN</strong> ke database PostgreSQL dan merekam tanggal update/created terkini.
              </span>
            </div>
          </div>
        </div>

        {/* Template Download Button */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-gray-500">
            Butuh file contoh untuk pengujian langsung?
          </span>
          <button
            id="btn-download-sample-excel"
            onClick={downloadSampleExcel}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-xs flex items-center gap-2 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-[#525FE1]" />
            Download Template Excel (.xlsx) Lengkap
          </button>
        </div>
      </div>

      {/* Success Notification if Upload Complete */}
      {uploadResult && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-emerald-900">
                Berhasil Menyimpan {uploadResult.total} Data ke PostgreSQL!
              </h3>
              <p className="text-xs text-emerald-700 mt-1">
                Semua baris dari file Excel telah tersimpan di tabel <code>jadwal_kursus</code>.
              </p>

              <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                <div className="bg-white p-3 rounded-lg border border-emerald-200">
                  <span className="text-gray-500 block">Total Data Masuk</span>
                  <span className="text-xl font-bold text-gray-900">{uploadResult.total}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-200">
                  <span className="text-gray-500 block">Status: Baru</span>
                  <span className="text-xl font-bold text-emerald-600">{uploadResult.baru}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-emerald-200">
                  <span className="text-gray-500 block">Status: Riwayat Ditambahkan</span>
                  <span className="text-xl font-bold text-amber-600">{uploadResult.duplikat_ditambahkan}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-5">
                <button
                  onClick={onNavigateToTable}
                  className="px-4 py-2 bg-[#525FE1] hover:brightness-110 text-white font-medium text-xs rounded shadow-sm flex items-center gap-2 transition"
                >
                  Lihat di Data Tabel
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium text-xs rounded shadow-sm hover:bg-gray-50 transition"
                >
                  Upload File Lain
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Drag-and-Drop Area */}
      {!uploadResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition cursor-pointer ${
              isDragging
                ? 'border-[#525FE1] bg-indigo-50/40'
                : 'border-gray-300 hover:border-[#525FE1] hover:bg-gray-50/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            <div 
              className="w-14 h-14 rounded-xl mx-auto flex items-center justify-center text-white mb-3 shadow-xs"
              style={{ backgroundColor: '#525FE1' }}
            >
              <FileSpreadsheet className="w-7 h-7" />
            </div>

            <h3 className="text-base font-semibold text-gray-800">
              {selectedFile ? selectedFile.name : 'Pilih atau Tarik File Excel ke Sini'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Mendukung format file <code>.xlsx</code>, <code>.xls</code>, dan <code>.csv</code>
            </p>

            <button
              type="button"
              className="mt-4 px-4 py-2 bg-[#525FE1] text-white text-sm font-medium rounded shadow-sm hover:brightness-110 transition"
            >
              Cari Berkas di Komputer
            </button>
          </div>

          {parseError && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {isParsing && (
            <div className="mt-4 p-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#525FE1]" />
              <span>Membaca dan memvalidasi lembar Excel...</span>
            </div>
          )}
        </div>
      )}

      {/* Preview Table Before Commit */}
      {parsedRows.length > 0 && !uploadResult && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-base">
                  Pratinjau Data Excel ({parsedRows.length} Baris Terdeteksi)
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Periksa data di bawah sebelum disimpan secara permanen ke database PostgreSQL.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-xs"
              >
                Batal
              </button>
              <button
                id="btn-commit-upload"
                onClick={handleProcessUpload}
                disabled={isUploading}
                className="px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-70"
                style={{ backgroundColor: '#525FE1' }}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke PostgreSQL...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan {parsedRows.length} Data ke Database</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-bold uppercase tracking-wider sticky top-0 border-b border-gray-200">
                <tr>
                  <th className="p-3.5 w-12 text-center">No</th>
                  <th className="p-3.5">Bidang</th>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Sesi</th>
                  <th className="p-3.5">NPM</th>
                  <th className="p-3.5">Kelas</th>
                  <th className="p-3.5">Nama Mahasiswa</th>
                  <th className="p-3.5">Status Entry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsedRows.map((row, idx) => {
                  const isPriorNPM = existingNpms.has(row.NPM.trim());

                  return (
                    <tr key={idx} className="hover:bg-indigo-50/20 transition">
                      <td className="p-3.5 text-center font-mono text-gray-400">{idx + 1}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          row.Bidang === 'SOSHUM' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {row.Bidang}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-gray-900 font-mono">{row.Tanggal}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          Sesi {row.Sesi}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-gray-900">{row.NPM}</td>
                      <td className="p-3.5 font-mono text-gray-700">{row.Kelas}</td>
                      <td className="p-3.5 font-semibold text-gray-800">{row.Nama}</td>
                      <td className="p-3.5">
                        {isPriorNPM ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold text-[10px]">
                            <Clock className="w-3 h-3" />
                            NPM Ada (Status: Menambahkan)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Baru
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
