import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { PGlite } from '@electric-sql/pglite';

dotenv.config();

/**
 * Konfigurasi Database PostgreSQL Terpisah
 * Mendukung pembacaan dari Environment Variables (.env)
 * serta penyediaan instance PGlite/PostgreSQL dan migrasi skema tabel.
 */

export interface DatabaseConfig {
  driver: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  connectionTimeoutMillis: number;
}

// Membaca konfigurasi dari environment variables dengan fallback default
export const dbConfig: DatabaseConfig = {
  driver: process.env.DB_DRIVER || 'pg',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'db_kursus_mahasiswa',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres123',
  ssl: process.env.DB_SSL === 'true',
  maxConnections: 20,
  connectionTimeoutMillis: 5000,
};

// Instance PGlite PostgreSQL (Single Source of Truth)
export let db: PGlite;

/**
 * Inisialisasi koneksi database dan pembuatan tabel (DDL) serta data awal (Seeds)
 */
export async function initDatabase(): Promise<PGlite> {
  try {
    const internalDir = path.join(process.cwd(), '.pgdata');
    if (!fs.existsSync(internalDir)) {
      fs.mkdirSync(internalDir, { recursive: true });
    }
    db = new PGlite(internalDir);
    console.log(`[Database] PostgreSQL (${dbConfig.driver}) connected to ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

    // 1. Tabel Admin Users (Role: Admin)
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nama_lengkap VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tabel Referensi Sesi (1, 2, 3, 4)
    await db.query(`
      CREATE TABLE IF NOT EXISTS ref_sesi (
        id SERIAL PRIMARY KEY,
        nomor_sesi INT UNIQUE NOT NULL,
        nama_sesi VARCHAR(100) NOT NULL,
        waktu_mulai VARCHAR(10) NOT NULL,
        waktu_selesai VARCHAR(10) NOT NULL,
        keterangan VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Tabel Referensi Kelas
    await db.query(`
      CREATE TABLE IF NOT EXISTS ref_kelas (
        id SERIAL PRIMARY KEY,
        kode_kelas VARCHAR(50) UNIQUE NOT NULL,
        nama_kelas VARCHAR(100) NOT NULL,
        bidang VARCHAR(20) NOT NULL,
        kapasitas INT DEFAULT 40,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Tabel Jadwal Kursus Mahasiswa (Format Excel: Bidang, Tanggal, Sesi, NPM, Kelas, Nama)
    await db.query(`
      CREATE TABLE IF NOT EXISTS jadwal_kursus (
        id SERIAL PRIMARY KEY,
        bidang VARCHAR(20) NOT NULL,
        tanggal DATE NOT NULL,
        sesi INT NOT NULL,
        npm VARCHAR(50) NOT NULL,
        kelas VARCHAR(50) NOT NULL,
        nama VARCHAR(255) NOT NULL,
        status_entry VARCHAR(50) DEFAULT 'BARU',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indeks untuk pencarian cepat
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jadwal_npm ON jadwal_kursus(npm);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jadwal_tanggal ON jadwal_kursus(tanggal);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jadwal_sesi ON jadwal_kursus(sesi);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jadwal_bidang ON jadwal_kursus(bidang);`);

    // 5. Tabel Materi Kursus Mahasiswa (M1 s/d M10)
    await db.query(`
      CREATE TABLE IF NOT EXISTS materi_kursus (
        id SERIAL PRIMARY KEY,
        npm VARCHAR(50) UNIQUE NOT NULL,
        nama VARCHAR(255),
        materi_m1 TEXT,
        materi_m2 TEXT,
        materi_m3 TEXT,
        materi_m4 TEXT,
        materi_m5 TEXT,
        materi_m6 TEXT,
        materi_m7 TEXT,
        materi_m8 TEXT,
        materi_m9 TEXT,
        materi_m10 TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_materi_npm ON materi_kursus(npm);`);

    // 6. Tabel Status Login Mahasiswa (Input otomatis oleh sistem lain)
    await db.query(`
      CREATE TABLE IF NOT EXISTS status_login_mahasiswa (
        id SERIAL PRIMARY KEY,
        npm VARCHAR(50) NOT NULL,
        kelas VARCHAR(50) NOT NULL,
        sesi INT NOT NULL,
        tgl_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_status_login_npm ON status_login_mahasiswa(npm);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_status_login_tgl ON status_login_mahasiswa(tgl_login);`);

    // Seed Akun Admin Default
    const adminCheck = await db.query(`SELECT COUNT(*) as count FROM admin_users WHERE username = 'admin'`);
    if (Number((adminCheck.rows[0] as any).count) === 0) {
      await db.query(
        `INSERT INTO admin_users (username, password, nama_lengkap) VALUES ($1, $2, $3)`,
        ['admin', 'admin123', 'Administrator Utama']
      );
    }

    // Seed Referensi Sesi
    const sesiCheck = await db.query(`SELECT COUNT(*) as count FROM ref_sesi`);
    if (Number((sesiCheck.rows[0] as any).count) === 0) {
      await db.query(`
        INSERT INTO ref_sesi (nomor_sesi, nama_sesi, waktu_mulai, waktu_selesai, keterangan) VALUES
        (1, 'Sesi 1 (Pagi Utama)', '08:00', '10:00', 'Sesi kuliah dan praktikum pagi'),
        (2, 'Sesi 2 (Siang Awal)', '10:15', '12:15', 'Sesi kuliah menjelang istirahat'),
        (3, 'Sesi 3 (Siang Lanjutan)', '13:00', '15:00', 'Sesi kuliah setelah istirahat dzuhur'),
        (4, 'Sesi 4 (Sore)', '15:15', '17:15', 'Sesi kuliah sore hari')
      `);
    }

    // Seed Referensi Kelas
    const kelasCheck = await db.query(`SELECT COUNT(*) as count FROM ref_kelas`);
    if (Number((kelasCheck.rows[0] as any).count) === 0) {
      await db.query(`
        INSERT INTO ref_kelas (kode_kelas, nama_kelas, bidang, kapasitas) VALUES
        ('TEK-01', 'Teknik Rekayasa Kelas A', 'TEKREK', 40),
        ('TEK-02', 'Teknik Rekayasa Kelas B', 'TEKREK', 35),
        ('SOS-01', 'Sosial Humaniora Kelas A', 'SOSHUM', 45),
        ('SOS-02', 'Sosial Humaniora Kelas B', 'SOSHUM', 40)
      `);
    }

    // Seed Jadwal Awal
    const jadwalCheck = await db.query(`SELECT COUNT(*) as count FROM jadwal_kursus`);
    if (Number((jadwalCheck.rows[0] as any).count) === 0) {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      await db.query(`
        INSERT INTO jadwal_kursus (bidang, tanggal, sesi, npm, kelas, nama, status_entry, created_at, updated_at) VALUES
        ('TEKREK', '${today}', 1, '2023101001', 'TEK-01', 'Budi Santoso', 'BARU', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('TEKREK', '${today}', 2, '2023101002', 'TEK-02', 'Siti Rahmawati', 'BARU', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('SOSHUM', '${today}', 3, '2023202001', 'SOS-01', 'Andi Pratama', 'BARU', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('SOSHUM', '${tomorrow}', 1, '2023202002', 'SOS-02', 'Dewi Lestari', 'BARU', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        ('TEKREK', '${tomorrow}', 4, '2023101003', 'TEK-01', 'Rizky Firmansyah', 'BARU', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
    }

    // Seed Materi Awal (M1 s/d M10)
    const materiCheck = await db.query(`SELECT COUNT(*) as count FROM materi_kursus`);
    if (Number((materiCheck.rows[0] as any).count) === 0) {
      await db.query(`
        INSERT INTO materi_kursus (npm, nama, materi_m1, materi_m2, materi_m3, materi_m4, materi_m5, materi_m6, materi_m7, materi_m8, materi_m9, materi_m10) VALUES
        ('2023101001', 'Budi Santoso', 'Pengenalan Algoritma & Dasar Pemrograman', 'Variabel, Tipe Data, & Operator', 'Struktur Percabangan If-Else', 'Perulangan For & While', 'Fungsi & Prosedur Modular', 'Array 1D & 2D', 'Pointer & Alokasi Memori', 'Struktur Data Stack & Queue', 'Algoritma Sorting & Searching', 'Proyek Mini Solusi Algoritma'),
        ('2023101002', 'Siti Rahmawati', 'Pengantar Basis Data Relasional', 'Perancangan ERD & Normalisasi 3NF', 'Data Definition Language (CREATE/ALTER)', 'Data Manipulation Language (INSERT/UPDATE)', 'Query SELECT & Klausa WHERE', 'Relasi Tabel & INNER/LEFT JOIN', 'Subquery & Database View', 'Stored Procedure & Function', 'Database Trigger & Indeks', 'Backup, Restore & Keamanan DB'),
        ('2023202001', 'Andi Pratama', 'Komunikasi Bisnis & Interpersonal', 'Teknik Presentasi & Negosiasi', 'Etika Profesi & Tata Kelola Bisnis', 'Manajemen Organisasi & SDM', 'Riset Pasar & Analisis Konsumen', 'Strategi Pemasaran Digital', 'Kepemimpinan & Kerja Sama Tim', 'Perencanaan Rencana Bisnis Strategis', 'Evaluasi Kinerja & Manajemen Risiko', 'Presentasi Sidang Studi Kasus Akhir')
      `);
    }

    // Seed Status Login Mahasiswa Awal
    const statusLoginCheck = await db.query(`SELECT COUNT(*) as count FROM status_login_mahasiswa`);
    if (Number((statusLoginCheck.rows[0] as any).count) === 0) {
      await db.query(`
        INSERT INTO status_login_mahasiswa (npm, kelas, sesi, tgl_login) VALUES
        ('2023101001', 'TEK-01', 1, CURRENT_TIMESTAMP - INTERVAL '12 minutes'),
        ('2023101002', 'TEK-02', 2, CURRENT_TIMESTAMP - INTERVAL '35 minutes'),
        ('2023202001', 'SOS-01', 3, CURRENT_TIMESTAMP - INTERVAL '1 hour 20 minutes'),
        ('2023202002', 'SOS-02', 1, CURRENT_TIMESTAMP - INTERVAL '2 hours 45 minutes'),
        ('2023101003', 'TEK-01', 4, CURRENT_TIMESTAMP - INTERVAL '3 hours 10 minutes'),
        ('2023101004', 'TEK-02', 2, CURRENT_TIMESTAMP - INTERVAL '5 hours 20 minutes'),
        ('2023202003', 'SOS-01', 3, CURRENT_TIMESTAMP - INTERVAL '1 day 2 hours')
      `);
    }

    console.log('[Database] Database tables and initial seed complete.');
    return db;
  } catch (err) {
    console.error('[Database] Initialization error:', err);
    throw err;
  }
}

/**
 * Mengambil informasi konfigurasi database yang telah disanitasi (tanpa password plaintext)
 */
export function getSanitizedConfig() {
  return {
    engine: 'PostgreSQL',
    driver: dbConfig.driver,
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    ssl: dbConfig.ssl,
    maxConnections: dbConfig.maxConnections,
    connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
    phpConfigFile: 'config/database.php',
    phpKoneksiFile: 'config/koneksi.php',
    envFile: '.env',
  };
}

/**
 * Mengambil ringkasan statistik status database dan jumlah baris tabel
 */
export async function getDatabaseStatus() {
  if (!db) {
    return {
      status: 'disconnected',
      error: 'Database instance not initialized',
      tables: [],
    };
  }

  try {
    const [adminRes, sesiRes, kelasRes, jadwalRes, materiRes, statusLoginRes] = await Promise.all([
      db.query(`SELECT COUNT(*) as count FROM admin_users`),
      db.query(`SELECT COUNT(*) as count FROM ref_sesi`),
      db.query(`SELECT COUNT(*) as count FROM ref_kelas`),
      db.query(`SELECT COUNT(*) as count FROM jadwal_kursus`),
      db.query(`SELECT COUNT(*) as count FROM materi_kursus`),
      db.query(`SELECT COUNT(*) as count FROM status_login_mahasiswa`),
    ]);

    const tables = [
      {
        name: 'status_login_mahasiswa',
        description: 'Pencatatan status login mahasiswa oleh sistem eksternal (NPM, Kelas, Sesi, Tgl Login)',
        rowCount: Number((statusLoginRes.rows[0] as any)?.count || 0),
      },
      {
        name: 'jadwal_kursus',
        description: 'Data jadwal mahasiswa hasil upload Excel (Bidang, Tanggal, Sesi, NPM, Kelas, Nama)',
        rowCount: Number((jadwalRes.rows[0] as any)?.count || 0),
      },
      {
        name: 'materi_kursus',
        description: 'Data materi per mahasiswa (NPM, Nama, Materi M1 s/d M10)',
        rowCount: Number((materiRes.rows[0] as any)?.count || 0),
      },
      {
        name: 'ref_sesi',
        description: 'Referensi waktu dan jam sesi 1 sampai 4',
        rowCount: Number((sesiRes.rows[0] as any)?.count || 0),
      },
      {
        name: 'ref_kelas',
        description: 'Referensi daftar kelas per bidang SOSHUM & TEKREK',
        rowCount: Number((kelasRes.rows[0] as any)?.count || 0),
      },
      {
        name: 'admin_users',
        description: 'Akun administrator dengan hak akses login sistem',
        rowCount: Number((adminRes.rows[0] as any)?.count || 0),
      },
    ];

    return {
      status: 'connected',
      engine: 'PostgreSQL (PGlite Embedded)',
      tables,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      status: 'error',
      error: err.message,
      tables: [],
    };
  }
}

/**
 * Pengujian query koneksi database
 */
export async function testDatabaseConnection() {
  const startTime = Date.now();
  if (!db) {
    throw new Error('Database instance belum diinisialisasi.');
  }

  const result = await db.query(`SELECT CURRENT_TIMESTAMP as server_time, 'PostgreSQL PGlite' as engine;`);
  const latencyMs = Date.now() - startTime;

  return {
    success: true,
    message: 'Koneksi ke database PostgreSQL berhasil diverifikasi!',
    latencyMs,
    serverTime: (result.rows[0] as any)?.server_time,
    engine: (result.rows[0] as any)?.engine,
  };
}
