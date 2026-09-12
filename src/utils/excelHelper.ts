import * as XLSX from 'xlsx';
import { JadwalKursus, MateriKursus, JadwalKursusArchive, StatusLoginArchive } from '../types';

export interface ExcelRow {
  Bidang: string;
  Tanggal: string;
  Sesi: number | string;
  Fakultas?: string;
  Minggu?: string;
  NPM: string;
  Kelas: string;
  Nama: string;
}

export interface ExcelMateriRow {
  npm?: string;
  nama?: string;
  fakultas?: string;
  materi_m1: string;
  materi_m2: string;
  materi_m3: string;
  materi_m4: string;
  materi_m5: string;
  materi_m6: string;
  materi_m7: string;
  materi_m8: string;
  materi_m9: string;
  materi_m10: string;
}

export function parseExcelFile(file: File): Promise<ExcelRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse raw rows as JSON array of objects
        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const formattedRows: ExcelRow[] = rawRows.map((row) => {
          // Normalize column keys (case-insensitive search)
          const findVal = (possibleKeys: string[]) => {
            for (const key of Object.keys(row)) {
              if (possibleKeys.includes(key.trim().toLowerCase())) {
                return row[key];
              }
            }
            return '';
          };

          const rawBidang = String(findVal(['bidang', 'jurusan', 'peminatan'])).trim().toUpperCase();
          const bidang = rawBidang.includes('TEK') ? 'TEKREK' : 'SOSHUM';

          let tanggal = String(findVal(['tanggal', 'tgl', 'date'])).trim();
          // If Excel date was a serial number
          if (!isNaN(Number(tanggal)) && Number(tanggal) > 40000) {
            const dateObj = XLSX.SSF.parse_date_code(Number(tanggal));
            if (dateObj) {
              const y = dateObj.y;
              const m = String(dateObj.m).padStart(2, '0');
              const d = String(dateObj.d).padStart(2, '0');
              tanggal = `${y}-${m}-${d}`;
            }
          }

          let sesi = parseInt(String(findVal(['sesi', 'session', 'sesi_ke'])), 10);
          if (isNaN(sesi) || sesi < 1) sesi = 1;

          const fakultas = String(findVal(['fakultas', 'kode_fakultas', 'fak', 'faculty'])).trim().toUpperCase();
          
          let rawMinggu = String(findVal(['minggu', 'week', 'minggu_ke', 'kode_minggu', 'm'])).trim().toUpperCase();
          let minggu = 'M1';
          if (rawMinggu) {
            minggu = rawMinggu.startsWith('M') ? rawMinggu : `M${rawMinggu}`;
          }

          const npm = String(findVal(['npm', 'nim', 'nomor_pokok', 'id_mahasiswa'])).trim();
          const kelas = String(findVal(['kelas', 'class', 'kode_kelas'])).trim();
          const nama = String(findVal(['nama', 'name', 'nama_mahasiswa'])).trim();

          return {
            Bidang: bidang,
            Tanggal: tanggal || new Date().toISOString().split('T')[0],
            Sesi: sesi,
            Fakultas: fakultas || '',
            Minggu: minggu,
            NPM: npm,
            Kelas: kelas || (bidang === 'TEKREK' ? 'TEK-01' : 'SOS-01'),
            Nama: nama,
          };
        }).filter((r) => r.NPM && r.Nama);

        resolve(formattedRows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function downloadSampleExcel() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const sampleData: ExcelRow[] = [
    { Bidang: 'TEKREK', Tanggal: today, Sesi: 1, Fakultas: 'FIKTI', Minggu: 'M1', NPM: '2023101001', Kelas: 'TEK-01', Nama: 'Budi Santoso' },
    { Bidang: 'TEKREK', Tanggal: today, Sesi: 2, Fakultas: 'FTI', Minggu: 'M1', NPM: '2023101002', Kelas: 'TEK-02', Nama: 'Siti Rahmawati' },
    { Bidang: 'SOSHUM', Tanggal: today, Sesi: 3, Fakultas: 'FE', Minggu: 'M2', NPM: '2023202001', Kelas: 'SOS-01', Nama: 'Andi Pratama' },
    { Bidang: 'SOSHUM', Tanggal: tomorrow, Sesi: 1, Fakultas: 'FSB', Minggu: 'M2', NPM: '2023202002', Kelas: 'SOS-02', Nama: 'Dewi Lestari' },
    { Bidang: 'TEKREK', Tanggal: tomorrow, Sesi: 4, Fakultas: 'FIKTI', Minggu: 'M3', NPM: '2023101003', Kelas: 'TEK-01', Nama: 'Rizky Firmansyah' },
    // Contoh NPM sama untuk menguji Aturan #5 (Menambahkan, bukan replace)
    { Bidang: 'TEKREK', Tanggal: tomorrow, Sesi: 2, Fakultas: 'FIKTI', Minggu: 'M4', NPM: '2023101001', Kelas: 'TEK-02', Nama: 'Budi Santoso' },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal_Mahasiswa');

  XLSX.writeFile(workbook, 'Template_Jadwal_Kursus_Mahasiswa.xlsx');
}

export function exportJadwalToExcel(data: JadwalKursus[], filename = 'Data_Jadwal_Mahasiswa.xlsx') {
  const rows = data.map((d, index) => ({
    No: index + 1,
    Bidang: d.bidang,
    Tanggal: d.tanggal,
    Sesi: `Sesi ${d.sesi}`,
    Fakultas: d.fakultas || '-',
    Minggu: d.minggu || 'M1',
    NPM: d.npm,
    Kelas: d.kelas,
    Nama: d.nama,
    Status: d.status_entry || 'BARU',
    'Tanggal Update': d.updated_at,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jadwal');

  XLSX.writeFile(workbook, filename);
}

export function parseExcelMateriFile(file: File): Promise<ExcelMateriRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const formattedRows: ExcelMateriRow[] = rawRows
          .map((row) => {
            const findVal = (possibleKeys: string[]) => {
              for (const key of Object.keys(row)) {
                const cleanKey = key.trim().toLowerCase().replace(/\s+/g, ' ');
                if (possibleKeys.includes(cleanKey)) {
                  return String(row[key] || '').trim();
                }
              }
              return '';
            };

            const npm = findVal(['npm', 'nim', 'nomor_pokok', 'id_mahasiswa']);
            const nama = findVal(['nama', 'name', 'nama_mahasiswa', 'nama mahasiswa']);

            // Find Materi M1 to M10 with flexible matching
            const m1 = findVal(['materi m1', 'materi 1', 'm1', 'materi_m1']);
            const m2 = findVal(['materi m2', 'materi 2', 'm2', 'materi_m2']);
            const m3 = findVal(['materi m3', 'materi 3', 'm3', 'materi_m3']);
            const m4 = findVal(['materi m4', 'materi 4', 'm4', 'materi_m4']);
            const m5 = findVal(['materi m5', 'materi 5', 'm5', 'materi_m5']);
            const m6 = findVal(['materi m6', 'materi 6', 'm6', 'materi_m6']);
            const m7 = findVal(['materi m7', 'materi 7', 'm7', 'materi_m7']);
            const m8 = findVal(['materi m8', 'materi 8', 'm8', 'materi_m8']);
            const m9 = findVal(['materi m9', 'materi 9', 'm9', 'materi_m9']);
            const m10 = findVal(['materi m10', 'materi 10', 'm10', 'materi_m10']);

            return {
              npm,
              nama: nama || undefined,
              materi_m1: m1,
              materi_m2: m2,
              materi_m3: m3,
              materi_m4: m4,
              materi_m5: m5,
              materi_m6: m6,
              materi_m7: m7,
              materi_m8: m8,
              materi_m9: m9,
              materi_m10: m10,
            };
          })
          .filter((r) => r.npm);

        resolve(formattedRows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

export function downloadSampleMateriExcel() {
  const sampleData = [
    {
      npm: '2023101001',
      'Materi M1': 'Pengenalan Algoritma & Dasar Pemrograman',
      'Materi M2': 'Variabel, Tipe Data, & Operator',
      'Materi M3': 'Struktur Kontrol Percabangan If-Else',
      'Materi M4': 'Struktur Perulangan For, While, Do-While',
      'Materi M5': 'Fungsi, Parameter, & Return Value',
      'Materi M6': 'Array 1 Dimensi & Multidimensi',
      'Materi M7': 'Pointer & Alokasi Memori Dinamis',
      'Materi M8': 'Struktur Data Stack & Queue',
      'Materi M9': 'Algoritma Sorting & Searching',
      'Materi M10': 'Proyek Akhir & Implementasi Solusi',
    },
    {
      npm: '2023101002',
      'Materi M1': 'Pengantar Basis Data Relasional',
      'Materi M2': 'Perancangan ERD & Normalisasi',
      'Materi M3': 'Data Definition Language (CREATE, ALTER)',
      'Materi M4': 'Data Manipulation Language (INSERT, UPDATE)',
      'Materi M5': 'Query SELECT Tingkat Lanjut & Aggregate',
      'Materi M6': 'Relasi Antar Tabel & Multi JOIN',
      'Materi M7': 'Subquery, View, & Indexing',
      'Materi M8': 'Stored Procedure & User Defined Function',
      'Materi M9': 'Database Trigger & Transaksi ACID',
      'Materi M10': 'Backup, Restore, & Keamanan Basis Data',
    },
    {
      npm: '2023202001',
      'Materi M1': 'Komunikasi Bisnis & Profesional',
      'Materi M2': 'Teknik Presentasi & Negosiasi',
      'Materi M3': 'Etika Profesi & Tanggung Jawab Sosial',
      'Materi M4': 'Manajemen Organisasi Modern',
      'Materi M5': 'Riset Pasar & Analisis Konsumen',
      'Materi M6': 'Strategi Branding & Pemasaran Digital',
      'Materi M7': 'Kepemimpinan & Dinamika Tim Kerja',
      'Materi M8': 'Penyusunan Rencana Strategis Bisnis',
      'Materi M9': 'Evaluasi Kinerja & Manajemen Risiko',
      'Materi M10': 'Presentasi Sidang Studi Kasus Akhir',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Materi_Mahasiswa');

  XLSX.writeFile(workbook, 'Template_Upload_Materi_M1_M10.xlsx');
}

export function exportMateriToExcel(data: MateriKursus[], filename = 'Data_Materi_Fakultas.xlsx') {
  const rows = data.map((d, index) => ({
    No: index + 1,
    'Kode Fakultas': d.fakultas || '-',
    'Nama Fakultas': d.nama_fakultas || d.fakultas || '-',
    'Keterangan / Kurikulum': d.keterangan || '-',
    'Materi M1': d.materi_m1 || '-',
    'Materi M2': d.materi_m2 || '-',
    'Materi M3': d.materi_m3 || '-',
    'Materi M4': d.materi_m4 || '-',
    'Materi M5': d.materi_m5 || '-',
    'Materi M6': d.materi_m6 || '-',
    'Materi M7': d.materi_m7 || '-',
    'Materi M8': d.materi_m8 || '-',
    'Materi M9': d.materi_m9 || '-',
    'Materi M10': d.materi_m10 || '-',
    'Terakhir Diperbarui': d.updated_at || d.created_at || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Materi_Fakultas');

  XLSX.writeFile(workbook, filename);
}

export function exportArchiveToExcel(data: JadwalKursusArchive[], filename = 'Data_Mahasiswa_Archive.xlsx') {
  const rows = data.map((d, index) => ({
    No: index + 1,
    NPM: d.npm,
    'Nama Mahasiswa': d.nama_mahasiswa,
    Kelas: d.kelas,
    Sesi: d.sesi,
    'Nama Semester': d.nama_semester,
    'Waktu Archive': d.archived_at ? new Date(d.archived_at).toLocaleString('id-ID') : '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Archive_Jadwal');

  XLSX.writeFile(workbook, filename);
}

export function exportStatusLoginArchiveToExcel(data: StatusLoginArchive[], filename = 'Data_Riwayat_Login_Archive.xlsx') {
  const rows = data.map((d, index) => ({
    No: index + 1,
    NPM: d.npm,
    Kelas: d.kelas,
    Fakultas: d.fakultas || '-',
    Sesi: `Sesi ${d.sesi}`,
    'Tanggal & Waktu Login': d.tgl_login ? new Date(d.tgl_login).toLocaleString('id-ID') : '-',
    'Nama Semester': d.nama_semester,
    'Waktu Archive': d.archived_at ? new Date(d.archived_at).toLocaleString('id-ID') : '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Archive_Riwayat_Login');

  XLSX.writeFile(workbook, filename);
}

