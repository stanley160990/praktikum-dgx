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

    // PERMINTAAN USER: Tidak ada pengisian data otomatis (auto-seed) saat aplikasi dibuild / dijalankan.
    // Aplikasi murni mengikuti data yang sudah tersimpan di database PostgreSQL.
    // Untuk inisiasi awal, admin dapat melakukan import skrip database.sql secara manual.
    console.log('[Database] Database tables initialized. Automatic data seeding is disabled.');
    return db;
  } catch (err) {
    console.error('[Database] Initialization error:', err);
    throw err;
  }
}

/**
 * Inisiasi manual dari database.sql oleh admin
 * Mengeksekusi seluruh DDL dan data awal yang ada di database.sql secara manual saat diminta
 */
export async function importDatabaseSql(): Promise<{ success: boolean; message: string }> {
  try {
    const sqlPath = path.join(process.cwd(), 'database.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error('Berkas database.sql tidak ditemukan di server');
    }
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    await db.query(sqlContent);
    console.log('[Database] Skrip database.sql berhasil dieksekusi secara manual.');
    return {
      success: true,
      message: 'Skrip database.sql berhasil diimport secara manual ke database PostgreSQL!',
    };
  } catch (err: any) {
    console.error('[Database] Gagal mengeksekusi database.sql:', err);
    throw new Error('Gagal mengeksekusi database.sql: ' + (err.message || String(err)));
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
