import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Info,
  FileCheck,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { ExcelMateriRow, parseExcelMateriFile, downloadSampleMateriExcel } from '../utils/excelHelper';
import { JadwalKursus } from '../types';

interface UploadMateriModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingJadwal?: JadwalKursus[];
  onUploadSuccess: () => void;
}

export const UploadMateriModal: React.FC<UploadMateriModalProps> = ({
  isOpen,
  onClose,
  existingJadwal = [],
  onUploadSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ExcelMateriRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  // Build a quick lookup map for student names
  const studentNameMap = new Map<string, string>();
  existingJadwal.forEach((j) => {
    if (!studentNameMap.has(j.npm)) {
      studentNameMap.set(j.npm, j.nama);
    }
  });

  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setParseError(null);
    setIsParsing(true);

    try {
      const rows = await parseExcelMateriFile(file);
      if (rows.length === 0) {
        throw new Error('Tidak ada baris data materi yang valid ditemukan dalam file Excel. Pastikan ada kolom "npm" dan materi.');
      }
      setParsedRows(rows);
    } catch (err: any) {
      setParseError(err.message || 'Gagal membaca file Excel materi. Pastikan format kolom sesuai.');
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
      const res = await fetch('/api/materi/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengupload materi ke database PostgreSQL.');
      }

      onUploadSuccess();
      handleClose();
    } catch (err: any) {
      setParseError(err.message || 'Terjadi kesalahan saat mengunggah materi.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#525FE1]/10 flex items-center justify-center text-[#525FE1]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Popup Upload Excel Materi (M1 s/d M10)</h3>
              <p className="text-xs text-gray-500">Unggah silabus materi pembelajaran untuk setiap NPM mahasiswa</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Format Specification Banner */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-900">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#525FE1] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Format Kolom Excel Materi:</span>
                <p className="text-indigo-800/90 mt-0.5 font-mono text-[11px] leading-relaxed">
                  "npm", "Materi M1", "Materi M2", "Materi M3", "Materi M4", "Materi M5", "Materi M6", "Materi M7", "Materi M8", "Materi M9", "Materi M10"
                </p>
              </div>
            </div>

            <button
              onClick={downloadSampleMateriExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-[#525FE1] rounded-lg font-medium hover:bg-indigo-50 transition shadow-2xs whitespace-nowrap shrink-0 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template Materi
            </button>
          </div>

          {/* Upload Drop Zone */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-[#525FE1] bg-indigo-50/50 scale-[0.99]'
                  : 'border-gray-300 hover:border-[#525FE1] bg-gray-50/50 hover:bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-[#525FE1] mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="font-semibold text-gray-800 text-sm">
                Pilih atau seret file Excel Materi (.xlsx, .xls) ke sini
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Maksimal 10MB. Nama mahasiswa akan otomatis dihubungkan berdasarkan NPM jika ada di jadwal.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB &bull; {parsedRows.length} baris materi terdeteksi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Ganti File
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {parseError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Rows Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Pratinjau Materi ({parsedRows.length} Mahasiswa)
                </span>
                <span className="text-xs text-gray-400">Menampilkan hingga 4 baris pertama</span>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-100 text-gray-600 font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2 border-b border-gray-200">NPM</th>
                      <th className="px-3 py-2 border-b border-gray-200">Nama Mahasiswa</th>
                      <th className="px-3 py-2 border-b border-gray-200">Materi M1</th>
                      <th className="px-3 py-2 border-b border-gray-200">Materi M2</th>
                      <th className="px-3 py-2 border-b border-gray-200">Materi M3</th>
                      <th className="px-3 py-2 border-b border-gray-200">Materi M10</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedRows.slice(0, 4).map((row, idx) => {
                      const resolvedName = row.nama || studentNameMap.get(row.npm) || '(Akan dicocokkan otomatis)';
                      return (
                        <tr key={idx} className="hover:bg-gray-50/80">
                          <td className="px-3 py-2 font-mono font-bold text-[#525FE1]">{row.npm}</td>
                          <td className="px-3 py-2 font-semibold text-gray-800">{resolvedName}</td>
                          <td className="px-3 py-2 text-gray-600 truncate max-w-[140px]" title={row.materi_m1}>
                            {row.materi_m1 || '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-600 truncate max-w-[140px]" title={row.materi_m2}>
                            {row.materi_m2 || '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-600 truncate max-w-[140px]" title={row.materi_m3}>
                            {row.materi_m3 || '-'}
                          </td>
                          <td className="px-3 py-2 text-gray-600 truncate max-w-[140px]" title={row.materi_m10}>
                            {row.materi_m10 || '-'}
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

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Batal
          </button>

          <button
            type="button"
            id="btn-confirm-upload-materi"
            onClick={handleProcessUpload}
            disabled={parsedRows.length === 0 || isUploading}
            className={`px-5 py-2 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center gap-2 transition ${
              parsedRows.length === 0 || isUploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#525FE1] hover:brightness-110 active:scale-95'
            }`}
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Menyimpan Materi ke PostgreSQL...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Simpan {parsedRows.length > 0 ? `${parsedRows.length} Materi Mahasiswa` : ''} ke Database
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
