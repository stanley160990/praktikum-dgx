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

    // 4. Tabel Referensi Fakultas
    await db.query(`
      CREATE TABLE IF NOT EXISTS ref_fakultas (
        id SERIAL PRIMARY KEY,
        kode_fakultas VARCHAR(20) UNIQUE NOT NULL,
        nama_fakultas VARCHAR(150) NOT NULL,
        keterangan VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4b. Tabel Referensi Minggu (Default: M1 sampai dengan M10)
    await db.query(`
      CREATE TABLE IF NOT EXISTS ref_minggu (
        id SERIAL PRIMARY KEY,
        kode_minggu VARCHAR(20) UNIQUE NOT NULL,
        nomor_minggu INT NOT NULL,
        nama_minggu VARCHAR(100) NOT NULL,
        keterangan VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Tabel Jadwal Kursus Mahasiswa (Format Excel: Bidang, Tanggal, Sesi, Fakultas, Minggu, NPM, Kelas, Nama)
    await db.query(`
      CREATE TABLE IF NOT EXISTS jadwal_kursus (
        id SERIAL PRIMARY KEY,
        bidang VARCHAR(20) NOT NULL,
        tanggal DATE NOT NULL,
        sesi INT NOT NULL,
        fakultas VARCHAR(50),
        minggu VARCHAR(20) DEFAULT 'M1',
        npm VARCHAR(50) NOT NULL,
        kelas VARCHAR(50) NOT NULL,
        nama VARCHAR(255) NOT NULL,
        status_entry VARCHAR(50) DEFAULT 'BARU',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Pastikan kolom fakultas dan minggu ada di jadwal_kursus pada database yang sudah ada
    try {
      await db.query(`ALTER TABLE jadwal_kursus ADD COLUMN IF NOT EXISTS fakultas VARCHAR(50);`);
      await db.query(`ALTER TABLE jadwal_kursus ADD COLUMN IF NOT EXISTS minggu VARCHAR(20) DEFAULT 'M1';`);
    } catch (e: any) {
      // Kolom sudah ada
    }

    // Indeks untuk pencarian cepat
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jadwal_npm ON jadwal_kursus(npm);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jadwal_tanggal ON jadwal_kursus(tanggal);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jadwal_sesi ON jadwal_kursus(sesi);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jadwal_bidang ON jadwal_kursus(bidang);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jadwal_fakultas ON jadwal_kursus(fakultas);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_jadwal_minggu ON jadwal_kursus(minggu);`);

    // Inisialisasi nilai default referensi fakultas jika tabel masih kosong
    try {
      const checkFakultas = await db.query('SELECT COUNT(*) as count FROM ref_fakultas');
      if (Number((checkFakultas.rows[0] as any)?.count || 0) === 0) {
        await db.query(`
          INSERT INTO ref_fakultas (kode_fakultas, nama_fakultas, keterangan) VALUES
          ('FTI', 'Fakultas Teknologi Industri', 'Fakultas Teknologi Industri'),
          ('FIKTI', 'Fakultas Ilmu Komputer dan Teknologi Informasi', 'Fakultas Ilmu Komputer dan Teknologi Informasi'),
          ('FTSP', 'Fakultas Teknik Sipil dan Prencanaan', 'Fakultas Teknik Sipil dan Prencanaan'),
          ('FIKES', 'Fakultas Ilmu Kesehatan Masyarakat', 'Fakultas Ilmu Kesehatan Masyarakat'),
          ('FE', 'Fakultas Ekonomi', 'Fakultas Ekonomi'),
          ('FSB', 'Fakultas Sastra dan Bahasa', 'Fakultas Sastra dan Bahasa'),
          ('FPSI', 'Fakultas Psikologi', 'Fakultas Psikologi'),
          ('FIKOM', 'Fakultas Ilmu Ekonomi', 'Fakultas Ilmu Ekonomi')
          ON CONFLICT (kode_fakultas) DO NOTHING;
        `);
        console.log('[Database] Nilai default referensi fakultas berhasil diinisialisasi.');
      }
    } catch (e: any) {
      console.warn('[Database] Inisialisasi default ref_fakultas:', e.message);
    }

    // Inisialisasi nilai default referensi minggu M1 s/d M10 jika tabel masih kosong
    try {
      const checkMinggu = await db.query('SELECT COUNT(*) as count FROM ref_minggu');
      if (Number((checkMinggu.rows[0] as any)?.count || 0) === 0) {
        await db.query(`
          INSERT INTO ref_minggu (kode_minggu, nomor_minggu, nama_minggu, keterangan) VALUES
          ('M1', 1, 'Minggu 1', 'Pertemuan Perkuliahan Minggu ke-1'),
          ('M2', 2, 'Minggu 2', 'Pertemuan Perkuliahan Minggu ke-2'),
          ('M3', 3, 'Minggu 3', 'Pertemuan Perkuliahan Minggu ke-3'),
          ('M4', 4, 'Minggu 4', 'Pertemuan Perkuliahan Minggu ke-4'),
          ('M5', 5, 'Minggu 5', 'Pertemuan Perkuliahan Minggu ke-5'),
          ('M6', 6, 'Minggu 6', 'Pertemuan Perkuliahan Minggu ke-6'),
          ('M7', 7, 'Minggu 7', 'Pertemuan Perkuliahan Minggu ke-7'),
          ('M8', 8, 'Minggu 8', 'Pertemuan Perkuliahan Minggu ke-8'),
          ('M9', 9, 'Minggu 9', 'Pertemuan Perkuliahan Minggu ke-9'),
          ('M10', 10, 'Minggu 10', 'Pertemuan Perkuliahan Minggu ke-10')
          ON CONFLICT (kode_minggu) DO NOTHING;
        `);
        console.log('[Database] Nilai default referensi minggu M1-M10 berhasil diinisialisasi.');
      }
    } catch (e: any) {
      console.warn('[Database] Inisialisasi default ref_minggu:', e.message);
    }

    // 5. Tabel Materi Kursus Mahasiswa (M1 s/d M10) Berdasarkan FAKULTAS
    await db.query(`
      CREATE TABLE IF NOT EXISTS materi_kursus (
        id SERIAL PRIMARY KEY,
        fakultas VARCHAR(50),
        keterangan VARCHAR(255),
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

    // Pastikan kolom fakultas dan keterangan ada jika tabel sebelumnya ada
    try {
      await db.query(`ALTER TABLE materi_kursus ADD COLUMN IF NOT EXISTS fakultas VARCHAR(50);`);
      await db.query(`ALTER TABLE materi_kursus ADD COLUMN IF NOT EXISTS keterangan VARCHAR(255);`);
      await db.query(`ALTER TABLE materi_kursus ALTER COLUMN npm DROP NOT NULL;`);
    } catch (e: any) {}
    await db.query(`CREATE INDEX IF NOT EXISTS idx_materi_fakultas ON materi_kursus(fakultas);`);

    // Inisialisasi materi default per fakultas jika tabel materi belum ada data fakultas
    try {
      const checkMateri = await db.query('SELECT COUNT(*) as count FROM materi_kursus WHERE fakultas IS NOT NULL');
      if (Number((checkMateri.rows[0] as any)?.count || 0) === 0) {
        await db.query(`
          INSERT INTO materi_kursus (fakultas, keterangan, materi_m1, materi_m2, materi_m3, materi_m4, materi_m5, materi_m6, materi_m7, materi_m8, materi_m9, materi_m10) VALUES
          ('FIKTI', 'Kurikulum Komputasi & Pemrograman Terapan',
           'Pengenalan Algoritma & Dasar Pemrograman', 
           'Variabel, Tipe Data, & Operator Logika', 
           'Struktur Percabangan If-Else & Switch-Case', 
           'Perulangan For, While & Do-While', 
           'Fungsi & Prosedur Modular', 
           'Array 1 Dimensi & 2 Dimensi', 
           'Pointer & Manajemen Alokasi Memori', 
           'Struktur Data Stack & Queue', 
           'Algoritma Sorting & Searching', 
           'Proyek Mini Solusi Algoritma Mandiri'),
          ('FTI', 'Kurikulum Sistem Basis Data & Rekayasa Industri',
           'Pengantar Basis Data Relasional & DBMS', 
           'Perancangan ERD & Normalisasi 3NF', 
           'Data Definition Language (CREATE/ALTER/DROP)', 
           'Data Manipulation Language (INSERT/UPDATE/DELETE)', 
           'Query SELECT, WHERE, ORDER BY, GROUP BY', 
           'Relasi Antar Tabel: INNER JOIN & LEFT JOIN', 
           'Subquery & Database View Dinamis', 
           'Stored Procedure & User Defined Function', 
           'Database Trigger & Optimasi Indeks', 
           'Backup, Restore, & Manajemen Hak Akses'),
          ('FE', 'Kurikulum Manajemen Bisnis & Analisis Pasar',
           'Komunikasi Bisnis & Negosiasi Interpersonal', 
           'Teknik Presentasi & Pitching Ide Bisnis', 
           'Etika Profesi & Tata Kelola Bisnis Modern', 
           'Manajemen Organisasi & Pengembangan SDM', 
           'Riset Pasar & Analisis Perilaku Konsumen', 
           'Strategi Pemasaran Digital & Social Media', 
           'Kepemimpinan & Kerja Sama Tim Lintas Fungsi', 
           'Perencanaan Rencana Bisnis Strategis (Business Plan)', 
           'Evaluasi Kinerja Keuangan & Manajemen Risiko', 
           'Presentasi Sidang Studi Kasus Akhir');
        `);
        console.log('[Database] Materi default berdasarkan fakultas berhasil diinisialisasi.');
      }
    } catch (e: any) {
      console.warn('[Database] Inisialisasi materi default:', e.message);
    }

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

    // 7. Tabel Arsip Jadwal Mahasiswa (Arsip per Semester)
    // Berisi hanya: npm, kelas, nama_mahasiswa, sesi, dan nama semester
    await db.query(`
      CREATE TABLE IF NOT EXISTS jadwal_kursus_archive (
        id SERIAL PRIMARY KEY,
        npm VARCHAR(50) NOT NULL,
        kelas VARCHAR(50) NOT NULL,
        nama_mahasiswa VARCHAR(255) NOT NULL,
        sesi INT NOT NULL,
        nama_semester VARCHAR(100) NOT NULL,
        archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_archive_semester ON jadwal_kursus_archive(nama_semester);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_archive_npm ON jadwal_kursus_archive(npm);`);

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
    const [adminRes, sesiRes, kelasRes, fakultasRes, mingguRes, jadwalRes, materiRes, statusLoginRes, archiveRes] = await Promise.all([
      db.query(`SELECT COUNT(*) as count FROM admin_users`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM ref_sesi`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM ref_kelas`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM ref_fakultas`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM ref_minggu`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM jadwal_kursus`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM materi_kursus`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM status_login_mahasiswa`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM jadwal_kursus_archive`).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    const tables = [
      {
        name: 'status_login_mahasiswa',
        description: 'Pencatatan status login mahasiswa oleh sistem eksternal (NPM, Kelas, Sesi, Tgl Login)',
        rowCount: Number((statusLoginRes.rows[0] as any)?.count || 0),
      },
      {
        name: 'jadwal_kursus',
        description: 'Data jadwal mahasiswa aktif (Bidang, Tanggal, Sesi, Fakultas, Minggu, NPM, Kelas, Nama)',
        rowCount: Number((jadwalRes.rows[0] as any)?.count || 0),
      },
      {
        name: 'jadwal_kursus_archive',
        description: 'Data arsip jadwal mahasiswa per semester (NPM, Kelas, Nama Mahasiswa, Sesi, Nama Semester)',
        rowCount: Number((archiveRes.rows[0] as any)?.count || 0),
      },
      {
        name: 'materi_kursus',
        description: 'Data silabus materi per fakultas (Materi M1 s/d M10)',
        rowCount: Number((materiRes.rows[0] as any)?.count || 0),
      },
      {
        name: 'ref_sesi',
        description: 'Referensi waktu dan jam sesi perkuliahan',
        rowCount: Number((sesiRes.rows[0] as any)?.count || 0),
      },
      {
        name: 'ref_kelas',
        description: 'Referensi daftar kelas per bidang SOSHUM & TEKREK',
        rowCount: Number((kelasRes.rows[0] as any)?.count || 0),
      },
      {
        name: 'ref_fakultas',
        description: 'Referensi daftar fakultas universitas (FTI, FIKTI, FTSP, dll)',
        rowCount: Number((fakultasRes.rows[0] as any)?.count || 0),
      },
      {
        name: 'ref_minggu',
        description: 'Referensi minggu perkuliahan (M1 sampai dengan M10)',
        rowCount: Number((mingguRes.rows[0] as any)?.count || 0),
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
