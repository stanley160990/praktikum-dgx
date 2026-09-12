export interface AdminUser {
  id: number;
  username: string;
  nama_lengkap: string;
  role: 'admin';
  created_at?: string;
  loginTime?: string;
}

export interface RefSesi {
  id: number;
  nomor_sesi: number;
  nama_sesi: string;
  waktu_mulai: string;
  waktu_selesai: string;
  keterangan: string;
  created_at?: string;
}

export interface RefKelas {
  id: number;
  kode_kelas: string;
  nama_kelas: string;
  bidang: 'SOSHUM' | 'TEKREK';
  kapasitas: number;
  created_at?: string;
}

export interface RefFakultas {
  id: number;
  kode_fakultas: string;
  nama_fakultas: string;
  keterangan?: string;
  created_at?: string;
}

export interface RefMinggu {
  id: number;
  kode_minggu: string;
  nomor_minggu: number;
  nama_minggu: string;
  keterangan?: string;
  created_at?: string;
}

export interface JadwalKursus {
  id: number;
  bidang: 'SOSHUM' | 'TEKREK';
  tanggal: string; // YYYY-MM-DD
  sesi: number; // 1, 2, 3, 4
  fakultas?: string;
  minggu?: string;
  npm: string;
  kelas: string;
  nama: string;
  status_entry?: string;
  created_at: string;
  updated_at: string;
}

export interface MateriKursus {
  id: number;
  fakultas: string;
  nama_fakultas?: string;
  keterangan?: string;
  npm?: string;
  nama?: string;
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
  created_at?: string;
  updated_at?: string;
}

export interface UploadHistory {
  id: number;
  nama_file: string;
  total_baris: number;
  berhasil: number;
  duplikat_ditambahkan: number;
  tanggal_upload: string;
}

export interface StatusLoginMahasiswa {
  id: number;
  npm: string;
  kelas: string;
  fakultas?: string;
  sesi: number;
  tgl_login: string;
}

export interface MahasiswaLoginCheckResult {
  allowed: boolean;
  message: string;
  today: string;
  data?: JadwalKursus[];
  matchedSesi?: RefSesi;
}

export interface DatabaseTableInfo {
  name: string;
  description: string;
  rowCount: number;
}

export interface DatabaseConfigInfo {
  engine: string;
  driver: string;
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: boolean;
  maxConnections: number;
  connectionTimeoutMillis: number;
  phpConfigFile: string;
  phpKoneksiFile: string;
  envFile: string;
}

export interface DatabaseStatusInfo {
  status: 'connected' | 'disconnected' | 'error';
  engine: string;
  tables: DatabaseTableInfo[];
  timestamp: string;
  error?: string;
}

export interface DatabaseTestResult {
  success: boolean;
  message: string;
  latencyMs: number;
  serverTime: string;
  engine: string;
}

export interface JadwalKursusArchive {
  id: number;
  npm: string;
  kelas: string;
  nama_mahasiswa: string;
  sesi: number;
  nama_semester: string;
  archived_at?: string;
}

export interface ArchiveSemesterSummary {
  nama_semester: string;
  total_mahasiswa: number;
  last_archived?: string;
}

export interface StatusLoginArchive {
  id: number;
  npm: string;
  kelas: string;
  fakultas?: string;
  sesi: number;
  tgl_login: string;
  nama_semester: string;
  archived_at?: string;
}

export interface ArchiveLoginSemesterSummary {
  nama_semester: string;
  total_login: number;
  last_archived?: string;
}

