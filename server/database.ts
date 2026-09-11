import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';

dotenv.config();

/**
 * Konfigurasi Database PostgreSQL Terpisah & Fleksibel
 * Mendukung koneksi ke server PostgreSQL riil (eksternal/eksisting) menggunakan driver 'pg' (node-postgres),
 * serta fallback ke PGlite (embedded wasm) jika server belum dapat dijangkau di lingkungan lokal sandbox.
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
  connectionTimeoutMillis: 4000,
};

export interface DatabaseClient {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount?: number | null }>;
}

// Instance Database (PostgreSQL Pool atau PGlite)
export let db: DatabaseClient;
export let activeEngineName = 'PostgreSQL';
export let isUsingExternalPostgres = false;
export let activeHost = '';

/**
 * Helper untuk mencoba koneksi ke PostgreSQL Pool
 */
async function tryConnectPgPool(hostToTry: string, portToTry: number): Promise<pg.Pool | null> {
  const poolConfig: pg.PoolConfig = {
    host: hostToTry,
    port: portToTry,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    ssl: dbConfig.ssl ? { rejectUnauthorized: false } : undefined,
    max: dbConfig.maxConnections,
    connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
  };

  if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;
  }

  const testPool = new pg.Pool(poolConfig);
  try {
    const client = await testPool.connect();
    client.release();
    return testPool;
  } catch (err: any) {
    await testPool.end().catch(() => {});
    return null;
  }
}

/**
 * Inisialisasi koneksi database:
 * 1. Prioritas utama: Terhubung ke database PostgreSQL eksisting sesuai variabel konfigurasi (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS).
 * 2. Terhubung langsung melalui Docker network (misal nama host: 'postgres') tanpa membutuhkan host.docker.internal.
 * 3. Jika PostgreSQL eksternal tidak aktif di sandbox lokal, beralih ke PGlite sebagai fallback sementara.
 * 4. Memastikan tabel DDL siap (CREATE TABLE IF NOT EXISTS) tanpa mengubah atau menghapus data eksisting.
 * 5. TIDAK ADA PENGISIAN DATA OTOMATIS (AUTO-SEED): Murni membaca data yang ada di database.
 */
export async function initDatabase(): Promise<DatabaseClient> {
  try {
    let pool: pg.Pool | null = null;

    // Coba koneksi ke database PostgreSQL eksternal / eksisting terlebih dahulu jika bukan driver 'pglite'
    if (dbConfig.driver !== 'pglite') {
      console.log(`[Database] Mencoba terhubung ke server PostgreSQL di ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}...`);
      pool = await tryConnectPgPool(dbConfig.host, dbConfig.port);

      // Jika gagal dan host adalah 'localhost' di dalam Docker network, coba hostname service 'postgres':
      if (!pool && (dbConfig.host === 'localhost' || dbConfig.host === '127.0.0.1')) {
        console.log(`[Database] Host '${dbConfig.host}' tidak merespons, mencoba service name 'postgres' di Docker network...`);
        pool = await tryConnectPgPool('postgres', dbConfig.port);
        if (pool) {
          dbConfig.host = 'postgres';
        }
      }
    }

    if (pool) {
      db = pool;
      isUsingExternalPostgres = true;
      activeHost = dbConfig.host;
      activeEngineName = `PostgreSQL Eksternal (${dbConfig.host}:${dbConfig.port}/${dbConfig.database})`;
      console.log(`[Database] BERHASIL terhubung ke database PostgreSQL eksisting di ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    } else {
      // Fallback ke PGlite embedded lokal jika server PostgreSQL eksternal tidak aktif di lingkungan saat ini
      console.warn(`[Database] Server PostgreSQL eksternal di ${dbConfig.host}:${dbConfig.port} tidak merespons. Menggunakan PGlite embedded lokal sebagai fallback.`);
      const internalDir = path.join(process.cwd(), '.pgdata');
      if (!fs.existsSync(internalDir)) {
        fs.mkdirSync(internalDir, { recursive: true });
      }
      db = new PGlite(internalDir);
      isUsingExternalPostgres = false;
      activeHost = 'embedded (local)';
      activeEngineName = 'PostgreSQL (PGlite Embedded Fallback)';
    }

    // Deteksi tabel-tabel yang sudah ada di database pengguna
    try {
      const existingTablesQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name ASC;
      `;
      const tblRes = await db.query(existingTablesQuery);
      const tablesFound = tblRes.rows.map((r: any) => r.table_name);
      console.log(`[Database] Terdeteksi ${tablesFound.length} tabel di schema public:`, tablesFound.join(', ') || '(Belum ada tabel)');
    } catch (e: any) {
      console.log('[Database] Catatan pembacaan information_schema:', e.message);
    }

    // 1. Tabel Admin Users (Role: Admin) - hanya buat jika belum ada
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nama_lengkap VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tabel Referensi Sesi
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

    // TIDAK ADA AUTO-SEED DATA: Menjaga integritas data database eksisting pengguna
    console.log('[Database] Koneksi dan struktur tabel database siap. Mengikuti data riil yang ada.');
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
    if (typeof (db as any).exec === 'function') {
      await (db as any).exec(sqlContent);
    } else {
      await db.query(sqlContent);
    }
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
    engine: activeEngineName,
    driver: dbConfig.driver,
    host: activeHost || dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    ssl: dbConfig.ssl,
    isExternal: isUsingExternalPostgres,
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
      db.query(`SELECT COUNT(*) as count FROM admin_users`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM ref_sesi`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM ref_kelas`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM jadwal_kursus`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM materi_kursus`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM status_login_mahasiswa`).catch(() => ({ rows: [{ count: 0 }] })),
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
        description: 'Referensi waktu dan jam sesi',
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
      engine: activeEngineName,
      isExternal: isUsingExternalPostgres,
      host: activeHost || dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
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

  const result = await db.query(`SELECT CURRENT_TIMESTAMP as server_time, current_database() as db_name;`);
  const latencyMs = Date.now() - startTime;

  return {
    success: true,
    message: isUsingExternalPostgres
      ? `Terhubung langsung ke database PostgreSQL eksisting (${activeHost}:${dbConfig.port}/${dbConfig.database})`
      : 'Terhubung ke database PostgreSQL lokal',
    latencyMs,
    serverTime: (result.rows[0] as any)?.server_time,
    database: (result.rows[0] as any)?.db_name || dbConfig.database,
    engine: activeEngineName,
    isExternal: isUsingExternalPostgres,
  };
}
