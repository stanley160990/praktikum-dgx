import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { PGlite } from '@electric-sql/pglite';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Import modular, separated database configuration and instance
import { 
  db, 
  initDatabase, 
  dbConfig, 
  getSanitizedConfig, 
  getDatabaseStatus, 
  testDatabaseConnection,
  importDatabaseSql
} from './server/database';

// ==========================================
// API ROUTES
// ==========================================

// 1. Health check & Database Config Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', engine: `PostgreSQL (${dbConfig.driver})`, timestamp: new Date().toISOString() });
});

// Dedicated route: Get Separated Database Configuration
app.get('/api/database/config', (req, res) => {
  try {
    const config = getSanitizedConfig();
    res.json({ success: true, data: config });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dedicated route: Get Database Status & Table Statistics
app.get('/api/database/status', async (req, res) => {
  try {
    const status = await getDatabaseStatus();
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dedicated route: Test Database Connection & Latency
app.post('/api/database/test', async (req, res) => {
  try {
    const testResult = await testDatabaseConnection();
    res.json({ success: true, ...testResult });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Dedicated route: Inisiasi Manual dari database.sql oleh Admin
app.post('/api/database/import-sql', async (req, res) => {
  try {
    const result = await importDatabaseSql();
    res.json({ success: true, message: result.message });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Admin Login (SQL Query verification with SHA1 password hashing)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi!' });
    }

    // Direct SQL Query: Login menggunakan username dan verifikasi password di database SQL
    const query = 'SELECT id, username, password, nama_lengkap FROM admin_users WHERE username = $1 LIMIT 1';
    const result = await db.query(query, [username]);

    if (result.rows.length === 0) {
      // Periksa apakah tabel admin_users masih kosong (belum diimport database.sql)
      const countRes = await db.query('SELECT COUNT(*) as c FROM admin_users');
      const isEmpty = Number((countRes.rows[0] as any)?.c || 0) === 0;
      const msg = isEmpty
        ? 'Tabel pengguna admin masih kosong. Silakan import database.sql terlebih dahulu untuk inisiasi awal.'
        : 'Username tidak ditemukan di database SQL!';
      return res.status(401).json({ success: false, message: msg, needImport: isEmpty });
    }

    const user = result.rows[0] as any;

    // Enkripsi password yang diinputkan menggunakan algoritma SHA1 (heksadesimal 40 karakter)
    const hashedInput = crypto.createHash('sha1').update(password).digest('hex');

    // Cek kecocokan password:
    // 1. Password di database sudah berupa hash SHA1 (standar keamanan)
    // 2. Dukungan transisi bila database eksisting sebelumnya masih menyimpan plain-text
    const isSha1Match = user.password && user.password.toLowerCase() === hashedInput.toLowerCase();
    const isLegacyPlaintextMatch = user.password === password;

    if (!isSha1Match && !isLegacyPlaintextMatch) {
      return res.status(401).json({ success: false, message: 'Password salah!' });
    }

    // Jika database eksisting lama masih menyimpan format plain-text, otomatis migrasikan ke SHA1
    if (isLegacyPlaintextMatch && !isSha1Match) {
      try {
        await db.query('UPDATE admin_users SET password = $1 WHERE id = $2', [hashedInput, user.id]);
        console.log(`[Auth] Password admin '${username}' berhasil dimigrasikan dari plain-text ke hash SHA1.`);
      } catch (updateErr) {
        console.error('[Auth] Peringatan: Gagal memigrasikan password ke SHA1:', updateErr);
      }
    }

    return res.json({
      success: true,
      message: 'Login berhasil!',
      user: {
        id: user.id,
        username: user.username,
        nama_lengkap: user.nama_lengkap,
        role: 'admin',
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada database SQL: ' + err.message });
  }
});

// 2b. Admin Ubah Password (Menyimpan Password Baru dalam format SHA1)
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Username, password lama, dan password baru wajib diisi!' });
    }

    if (newPassword.length < 5) {
      return res.status(400).json({ success: false, message: 'Password baru minimal 5 karakter!' });
    }

    const query = 'SELECT id, username, password FROM admin_users WHERE username = $1 LIMIT 1';
    const result = await db.query(query, [username]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna admin tidak ditemukan!' });
    }

    const user = result.rows[0] as any;
    const oldHashed = crypto.createHash('sha1').update(oldPassword).digest('hex');
    const isOldMatch = (user.password && user.password.toLowerCase() === oldHashed.toLowerCase()) || user.password === oldPassword;

    if (!isOldMatch) {
      return res.status(401).json({ success: false, message: 'Password lama tidak sesuai!' });
    }

    // Hash password baru dengan SHA1
    const newHashed = crypto.createHash('sha1').update(newPassword).digest('hex');
    await db.query('UPDATE admin_users SET password = $1 WHERE id = $2', [newHashed, user.id]);

    return res.json({
      success: true,
      message: 'Password berhasil diperbarui dan disimpan dalam format SHA1!',
    });
  } catch (err: any) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui password: ' + err.message });
  }
});

// 3. Get Jadwal List (with search, filter, sorting)
app.get('/api/jadwal', async (req, res) => {
  try {
    const { search, bidang, sesi, tanggal, kelas, fakultas } = req.query;

    let sql = `SELECT * FROM jadwal_kursus WHERE 1=1`;
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      sql += ` AND (nama ILIKE $${pIdx} OR npm ILIKE $${pIdx} OR kelas ILIKE $${pIdx} OR COALESCE(fakultas, '') ILIKE $${pIdx})`;
      params.push(`%${search}%`);
      pIdx++;
    }

    if (bidang && (bidang === 'SOSHUM' || bidang === 'TEKREK')) {
      sql += ` AND bidang = $${pIdx}`;
      params.push(bidang);
      pIdx++;
    }

    if (sesi) {
      sql += ` AND sesi = $${pIdx}`;
      params.push(Number(sesi));
      pIdx++;
    }

    if (tanggal) {
      sql += ` AND tanggal = $${pIdx}`;
      params.push(tanggal);
      pIdx++;
    }

    if (kelas) {
      sql += ` AND kelas = $${pIdx}`;
      params.push(kelas);
      pIdx++;
    }

    if (fakultas) {
      sql += ` AND fakultas = $${pIdx}`;
      params.push(fakultas);
      pIdx++;
    }

    sql += ` ORDER BY tanggal DESC, sesi ASC, id DESC`;

    const result = await db.query(sql, params);

    // Format dates to YYYY-MM-DD strings for clean frontend display
    const formatted = result.rows.map((row: any) => {
      let tglStr = row.tanggal;
      if (tglStr instanceof Date) {
        tglStr = tglStr.toISOString().split('T')[0];
      } else if (typeof tglStr === 'string' && tglStr.includes('T')) {
        tglStr = tglStr.split('T')[0];
      }
      return {
        ...row,
        tanggal: tglStr,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err: any) {
    console.error('Fetch jadwal error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Create Single Jadwal Manual
app.post('/api/jadwal', async (req, res) => {
  try {
    const { bidang, tanggal, sesi, fakultas, minggu, npm, kelas, nama } = req.body;
    if (!bidang || !tanggal || !sesi || !npm || !kelas || !nama) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi lengkap!' });
    }

    const cleanMinggu = (minggu || 'M1').toString().trim().toUpperCase();

    // Check if NPM already exists
    const checkResult = await db.query('SELECT COUNT(*) as count FROM jadwal_kursus WHERE npm = $1', [npm]);
    const isDuplicate = Number((checkResult.rows[0] as any).count) > 0;
    const statusEntry = isDuplicate ? 'DUPLIKAT_DITAMBAHKAN' : 'BARU';

    const insertSql = `
      INSERT INTO jadwal_kursus (bidang, tanggal, sesi, fakultas, minggu, npm, kelas, nama, status_entry, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const result = await db.query(insertSql, [bidang, tanggal, Number(sesi), (fakultas || '').trim(), cleanMinggu, npm, kelas, nama, statusEntry]);

    res.json({
      success: true,
      message: isDuplicate ? 'Data NPM sama ditemukan, status menambahkan data baru.' : 'Data jadwal berhasil ditambahkan.',
      data: result.rows[0],
    });
  } catch (err: any) {
    console.error('Insert jadwal error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Update Jadwal
app.put('/api/jadwal/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { bidang, tanggal, sesi, fakultas, minggu, npm, kelas, nama } = req.body;
    const cleanMinggu = (minggu || 'M1').toString().trim().toUpperCase();

    const updateSql = `
      UPDATE jadwal_kursus
      SET bidang = $1, tanggal = $2, sesi = $3, fakultas = $4, minggu = $5, npm = $6, kelas = $7, nama = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *;
    `;
    const result = await db.query(updateSql, [bidang, tanggal, Number(sesi), (fakultas || '').trim(), cleanMinggu, npm, kelas, nama, Number(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    res.json({ success: true, message: 'Data berhasil diperbarui!', data: result.rows[0] });
  } catch (err: any) {
    console.error('Update jadwal error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Delete Jadwal
app.delete('/api/jadwal/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM jadwal_kursus WHERE id = $1', [Number(id)]);
    res.json({ success: true, message: 'Data berhasil dihapus dari database!' });
  } catch (err: any) {
    console.error('Delete jadwal error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. Bulk Upload Jadwal from Excel (Requirement 4 & 5)
// "Jika admin mgenupload npm yang sama maka data statusnya menambahkan, bukan mengupdate data sebelumya, berikan juga tanggal update pada databasesnya."
app.post('/api/jadwal/bulk-upload', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Data rows kosong atau tidak valid!' });
    }

    let insertedCount = 0;
    let duplicateAddedCount = 0;
    let newEntriesCount = 0;
    const insertedRows: any[] = [];

    for (const item of rows) {
      const bidang = (item.bidang || item.Bidang || '').toString().trim().toUpperCase();
      let tanggal = (item.tanggal || item.Tanggal || '').toString().trim();
      const sesi = parseInt(item.sesi || item.Sesi || '1', 10);
      const fakultas = (item.fakultas || item.Fakultas || item.FAKULTAS || item.kode_fakultas || '').toString().trim();
      const rawMinggu = (item.minggu || item.Minggu || item.MINGGU || item.m || item.M || 'M1').toString().trim().toUpperCase();
      const minggu = rawMinggu.startsWith('M') ? rawMinggu : `M${rawMinggu}`;
      const npm = (item.npm || item.NPM || '').toString().trim();
      const kelas = (item.kelas || item.Kelas || '').toString().trim();
      const nama = (item.nama || item.Nama || '').toString().trim();

      if (!npm || !nama) continue;

      // Ensure valid bidang
      const validBidang = bidang === 'TEKREK' ? 'TEKREK' : 'SOSHUM';

      // Check if NPM exists in database prior to this insertion
      const checkResult = await db.query('SELECT COUNT(*) as count FROM jadwal_kursus WHERE npm = $1', [npm]);
      const hasPrior = Number((checkResult.rows[0] as any).count) > 0;

      const statusEntry = hasPrior ? 'DUPLIKAT_DITAMBAHKAN' : 'BARU';
      if (hasPrior) {
        duplicateAddedCount++;
      } else {
        newEntriesCount++;
      }

      const insertQuery = `
        INSERT INTO jadwal_kursus (bidang, tanggal, sesi, fakultas, minggu, npm, kelas, nama, status_entry, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *;
      `;

      const insertRes = await db.query(insertQuery, [
        validBidang,
        tanggal,
        sesi,
        fakultas,
        minggu,
        npm,
        kelas,
        nama,
        statusEntry,
      ]);

      insertedRows.push(insertRes.rows[0]);
      insertedCount++;
    }

    res.json({
      success: true,
      message: `Berhasil mengupload dan menyimpan ${insertedCount} data jadwal ke database PostgreSQL!`,
      summary: {
        total: insertedCount,
        baru: newEntriesCount,
        duplikat_ditambahkan: duplicateAddedCount,
      },
    });
  } catch (err: any) {
    console.error('Bulk upload error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengupload jadwal: ' + err.message });
  }
});

// ==========================================
// MATERI KURSUS (M1 - M10 BERDASARKAN FAKULTAS) API ROUTES
// ==========================================

// GET all materi berdasarkan fakultas
app.get('/api/materi', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id,
        COALESCE(m.fakultas, '') as fakultas,
        COALESCE(rf.nama_fakultas, m.fakultas, 'Fakultas') as nama_fakultas,
        COALESCE(m.keterangan, '') as keterangan,
        COALESCE(m.materi_m1, '') as materi_m1,
        COALESCE(m.materi_m2, '') as materi_m2,
        COALESCE(m.materi_m3, '') as materi_m3,
        COALESCE(m.materi_m4, '') as materi_m4,
        COALESCE(m.materi_m5, '') as materi_m5,
        COALESCE(m.materi_m6, '') as materi_m6,
        COALESCE(m.materi_m7, '') as materi_m7,
        COALESCE(m.materi_m8, '') as materi_m8,
        COALESCE(m.materi_m9, '') as materi_m9,
        COALESCE(m.materi_m10, '') as materi_m10,
        TO_CHAR(m.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
        TO_CHAR(m.updated_at, 'YYYY-MM-DD HH24:MI:SS') as updated_at
      FROM materi_kursus m
      LEFT JOIN ref_fakultas rf ON m.fakultas = rf.kode_fakultas
      ORDER BY m.fakultas ASC, m.id DESC;
    `;
    const result = await db.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    console.error('Get materi error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST single materi (Tambah materi berdasarkan fakultas)
app.post('/api/materi', async (req, res) => {
  try {
    const { fakultas, keterangan, materi_m1, materi_m2, materi_m3, materi_m4, materi_m5, materi_m6, materi_m7, materi_m8, materi_m9, materi_m10 } = req.body;
    if (!fakultas || !fakultas.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Fakultas wajib dipilih dari referensi!' });
    }

    const cleanFakultas = fakultas.toString().trim().toUpperCase();

    const insertQuery = `
      INSERT INTO materi_kursus (fakultas, keterangan, materi_m1, materi_m2, materi_m3, materi_m4, materi_m5, materi_m6, materi_m7, materi_m8, materi_m9, materi_m10, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const result = await db.query(insertQuery, [
      cleanFakultas,
      (keterangan || '').trim(),
      materi_m1 || '',
      materi_m2 || '',
      materi_m3 || '',
      materi_m4 || '',
      materi_m5 || '',
      materi_m6 || '',
      materi_m7 || '',
      materi_m8 || '',
      materi_m9 || '',
      materi_m10 || '',
    ]);

    res.json({ success: true, message: 'Data materi fakultas berhasil ditambahkan.', data: result.rows[0] });
  } catch (err: any) {
    console.error('Insert materi error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update materi by ID
app.put('/api/materi/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fakultas, keterangan, materi_m1, materi_m2, materi_m3, materi_m4, materi_m5, materi_m6, materi_m7, materi_m8, materi_m9, materi_m10 } = req.body;

    if (!fakultas || !fakultas.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Fakultas wajib diisi!' });
    }

    const cleanFakultas = fakultas.toString().trim().toUpperCase();

    const updateQuery = `
      UPDATE materi_kursus
      SET fakultas = $1,
          keterangan = $2,
          materi_m1 = $3,
          materi_m2 = $4,
          materi_m3 = $5,
          materi_m4 = $6,
          materi_m5 = $7,
          materi_m6 = $8,
          materi_m7 = $9,
          materi_m8 = $10,
          materi_m9 = $11,
          materi_m10 = $12,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *;
    `;

    const result = await db.query(updateQuery, [
      cleanFakultas,
      (keterangan || '').trim(),
      materi_m1 || '',
      materi_m2 || '',
      materi_m3 || '',
      materi_m4 || '',
      materi_m5 || '',
      materi_m6 || '',
      materi_m7 || '',
      materi_m8 || '',
      materi_m9 || '',
      materi_m10 || '',
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Data materi tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Data materi berhasil diperbarui.', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE single materi by ID
app.delete('/api/materi/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM materi_kursus WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Data materi tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Data materi berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. Referensi Sesi
app.get('/api/referensi/sesi', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ref_sesi ORDER BY nomor_sesi ASC');
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/referensi/sesi', async (req, res) => {
  try {
    const { nomor_sesi, nama_sesi, waktu_mulai, waktu_selesai, keterangan } = req.body;
    const upsertSql = `
      INSERT INTO ref_sesi (nomor_sesi, nama_sesi, waktu_mulai, waktu_selesai, keterangan)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (nomor_sesi) DO UPDATE
      SET nama_sesi = EXCLUDED.nama_sesi,
          waktu_mulai = EXCLUDED.waktu_mulai,
          waktu_selesai = EXCLUDED.waktu_selesai,
          keterangan = EXCLUDED.keterangan
      RETURNING *;
    `;
    const result = await db.query(upsertSql, [Number(nomor_sesi), nama_sesi, waktu_mulai, waktu_selesai, keterangan || '']);
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/referensi/sesi/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM ref_sesi WHERE id = $1', [Number(req.params.id)]);
    res.json({ success: true, message: 'Sesi berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. Referensi Kelas
app.get('/api/referensi/kelas', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ref_kelas ORDER BY bidang ASC, kode_kelas ASC');
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/referensi/kelas', async (req, res) => {
  try {
    const { kode_kelas, nama_kelas, bidang, kapasitas } = req.body;
    const upsertSql = `
      INSERT INTO ref_kelas (kode_kelas, nama_kelas, bidang, kapasitas)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (kode_kelas) DO UPDATE
      SET nama_kelas = EXCLUDED.nama_kelas,
          bidang = EXCLUDED.bidang,
          kapasitas = EXCLUDED.kapasitas
      RETURNING *;
    `;
    const result = await db.query(upsertSql, [
      kode_kelas.toUpperCase(),
      nama_kelas,
      bidang,
      Number(kapasitas || 40),
    ]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/referensi/kelas/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM ref_kelas WHERE id = $1', [Number(req.params.id)]);
    res.json({ success: true, message: 'Kelas berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. Referensi Fakultas (Nilai Default: FTI, FIKTI, FTSP, FIKES, FE, FSB, FPSI, FIKOM)
app.get('/api/referensi/fakultas', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ref_fakultas ORDER BY kode_fakultas ASC');
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/referensi/fakultas', async (req, res) => {
  try {
    const { kode_fakultas, nama_fakultas, keterangan } = req.body;
    if (!kode_fakultas || !nama_fakultas) {
      return res.status(400).json({ success: false, message: 'Kode Fakultas dan Nama Fakultas wajib diisi!' });
    }

    const cleanKode = kode_fakultas.toString().trim().toUpperCase();
    const cleanNama = nama_fakultas.toString().trim();
    const cleanKet = (keterangan || '').toString().trim();

    const upsertSql = `
      INSERT INTO ref_fakultas (kode_fakultas, nama_fakultas, keterangan)
      VALUES ($1, $2, $3)
      ON CONFLICT (kode_fakultas) DO UPDATE
      SET nama_fakultas = EXCLUDED.nama_fakultas,
          keterangan = EXCLUDED.keterangan
      RETURNING *;
    `;
    const result = await db.query(upsertSql, [cleanKode, cleanNama, cleanKet]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/referensi/fakultas/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM ref_fakultas WHERE id = $1', [Number(req.params.id)]);
    res.json({ success: true, message: 'Fakultas berhasil dihapus' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset / Seed Default Fakultas
app.post('/api/referensi/fakultas/reset-default', async (req, res) => {
  try {
    const defaultFakultas = [
      ['FTI', 'Fakultas Teknologi Industri', 'Fakultas Teknologi Industri'],
      ['FIKTI', 'Fakultas Ilmu Komputer dan Teknologi Informasi', 'Fakultas Ilmu Komputer dan Teknologi Informasi'],
      ['FTSP', 'Fakultas Teknik Sipil dan Prencanaan', 'Fakultas Teknik Sipil dan Prencanaan'],
      ['FIKES', 'Fakultas Ilmu Kesehatan Masyarakat', 'Fakultas Ilmu Kesehatan Masyarakat'],
      ['FE', 'Fakultas Ekonomi', 'Fakultas Ekonomi'],
      ['FSB', 'Fakultas Sastra dan Bahasa', 'Fakultas Sastra dan Bahasa'],
      ['FPSI', 'Fakultas Psikologi', 'Fakultas Psikologi'],
      ['FIKOM', 'Fakultas Ilmu Ekonomi', 'Fakultas Ilmu Ekonomi'],
    ];

    for (const [kode, nama, ket] of defaultFakultas) {
      await db.query(`
        INSERT INTO ref_fakultas (kode_fakultas, nama_fakultas, keterangan)
        VALUES ($1, $2, $3)
        ON CONFLICT (kode_fakultas) DO UPDATE
        SET nama_fakultas = EXCLUDED.nama_fakultas,
            keterangan = EXCLUDED.keterangan;
      `, [kode, nama, ket]);
    }

    const all = await db.query('SELECT * FROM ref_fakultas ORDER BY kode_fakultas ASC');
    res.json({ success: true, message: 'Berhasil memuat 8 referensi fakultas default!', data: all.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 11. Referensi Minggu (Default: M1 sampai dengan M10)
app.get('/api/referensi/minggu', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ref_minggu ORDER BY nomor_minggu ASC');
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/referensi/minggu', async (req, res) => {
  try {
    const { kode_minggu, nomor_minggu, nama_minggu, keterangan } = req.body;
    if (!kode_minggu || !nama_minggu) {
      return res.status(400).json({ success: false, message: 'Kode Minggu dan Nama Minggu wajib diisi!' });
    }

    const cleanKode = kode_minggu.toString().trim().toUpperCase();
    const cleanNama = nama_minggu.toString().trim();
    const cleanKet = (keterangan || '').toString().trim();
    const numMinggu = parseInt(nomor_minggu || cleanKode.replace(/\D/g, '') || '1', 10);

    const upsertSql = `
      INSERT INTO ref_minggu (kode_minggu, nomor_minggu, nama_minggu, keterangan)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (kode_minggu) DO UPDATE
      SET nomor_minggu = EXCLUDED.nomor_minggu,
          nama_minggu = EXCLUDED.nama_minggu,
          keterangan = EXCLUDED.keterangan
      RETURNING *;
    `;
    const result = await db.query(upsertSql, [cleanKode, numMinggu, cleanNama, cleanKet]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/referensi/minggu/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM ref_minggu WHERE id = $1', [Number(req.params.id)]);
    res.json({ success: true, message: 'Referensi minggu berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset / Seed Default Minggu (M1 s/d M10)
app.post('/api/referensi/minggu/reset-default', async (req, res) => {
  try {
    const defaultMinggu = [
      ['M1', 1, 'Minggu 1', 'Pertemuan Perkuliahan Minggu ke-1'],
      ['M2', 2, 'Minggu 2', 'Pertemuan Perkuliahan Minggu ke-2'],
      ['M3', 3, 'Minggu 3', 'Pertemuan Perkuliahan Minggu ke-3'],
      ['M4', 4, 'Minggu 4', 'Pertemuan Perkuliahan Minggu ke-4'],
      ['M5', 5, 'Minggu 5', 'Pertemuan Perkuliahan Minggu ke-5'],
      ['M6', 6, 'Minggu 6', 'Pertemuan Perkuliahan Minggu ke-6'],
      ['M7', 7, 'Minggu 7', 'Pertemuan Perkuliahan Minggu ke-7'],
      ['M8', 8, 'Minggu 8', 'Pertemuan Perkuliahan Minggu ke-8'],
      ['M9', 9, 'Minggu 9', 'Pertemuan Perkuliahan Minggu ke-9'],
      ['M10', 10, 'Minggu 10', 'Pertemuan Perkuliahan Minggu ke-10'],
    ];

    for (const [kode, num, nama, ket] of defaultMinggu) {
      await db.query(`
        INSERT INTO ref_minggu (kode_minggu, nomor_minggu, nama_minggu, keterangan)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (kode_minggu) DO UPDATE
        SET nomor_minggu = EXCLUDED.nomor_minggu,
            nama_minggu = EXCLUDED.nama_minggu,
            keterangan = EXCLUDED.keterangan;
      `, [kode, num, nama, ket]);
    }

    const all = await db.query('SELECT * FROM ref_minggu ORDER BY nomor_minggu ASC');
    res.json({ success: true, message: 'Berhasil memuat 10 referensi minggu default (M1 sampai dengan M10)!', data: all.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. Mahasiswa Login Check (Requirement 3: "Sistem adalah mengelola akun kurus mahasiswa yang dapat login pada hari yang telah ditentukan berdasarkan Excel yang telah diupload")
app.post('/api/mahasiswa/check-login', async (req, res) => {
  try {
    const { npm, testDate } = req.body;
    if (!npm) {
      return res.status(400).json({ allowed: false, message: 'Silakan masukkan NPM Anda!' });
    }

    const checkDate = testDate || new Date().toISOString().split('T')[0];

    // Check if student has schedule for today
    const queryToday = `
      SELECT j.*, s.nama_sesi, s.waktu_mulai, s.waktu_selesai
      FROM jadwal_kursus j
      LEFT JOIN ref_sesi s ON j.sesi = s.nomor_sesi
      WHERE j.npm = $1 AND j.tanggal = $2
      ORDER BY j.sesi ASC;
    `;
    const resultToday = await db.query(queryToday, [npm.trim(), checkDate]);

    if (resultToday.rows.length > 0) {
      return res.json({
        allowed: true,
        message: `Akses Diizinkan! Anda memiliki ${resultToday.rows.length} jadwal kursus aktif pada tanggal ${checkDate}.`,
        today: checkDate,
        data: resultToday.rows,
      });
    }

    // If not today, check if student has schedule on ANY other date
    const queryOther = `
      SELECT tanggal, sesi, bidang, kelas, nama
      FROM jadwal_kursus
      WHERE npm = $1
      ORDER BY tanggal ASC, sesi ASC;
    `;
    const resultOther = await db.query(queryOther, [npm.trim()]);

    if (resultOther.rows.length > 0) {
      return res.json({
        allowed: false,
        message: `Akses Ditolak. Anda TIDAK dijadwalkan untuk login pada tanggal ${checkDate}.`,
        today: checkDate,
        otherSchedules: resultOther.rows,
      });
    }

    return res.json({
      allowed: false,
      message: `NPM '${npm}' tidak ditemukan dalam database jadwal kursus. Silakan hubungi admin untuk pendaftaran.`,
      today: checkDate,
    });
  } catch (err: any) {
    console.error('Check login error:', err);
    res.status(500).json({ allowed: false, message: err.message });
  }
});

// 11. Status Login Mahasiswa (Read-only view for admin, insert by external system)
app.get('/api/status-login', async (req, res) => {
  try {
    const { search, sesi, todayOnly, date } = req.query;
    let query = `
      SELECT id, npm, kelas, sesi, tgl_login
      FROM status_login_mahasiswa
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(npm ILIKE $${params.length} OR kelas ILIKE $${params.length})`);
    }

    if (sesi && sesi !== 'all') {
      params.push(parseInt(sesi as string, 10));
      conditions.push(`sesi = $${params.length}`);
    }

    if (date) {
      params.push(String(date));
      conditions.push(`to_char(tgl_login, 'YYYY-MM-DD') = $${params.length}`);
    } else if (todayOnly === 'true') {
      conditions.push(`DATE(tgl_login) = CURRENT_DATE`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY tgl_login DESC, id DESC LIMIT 500`;

    const result = await db.query(query, params);
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (err: any) {
    console.error('Error fetching status login:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Endpoint untuk sistem lain menginput status login mahasiswa secara otomatis
app.post('/api/status-login', async (req, res) => {
  try {
    const { npm, kelas, sesi, tgl_login } = req.body;
    if (!npm || !kelas || sesi === undefined) {
      return res.status(400).json({ success: false, message: 'Kolom npm, kelas, dan sesi wajib diisi oleh sistem eksternal!' });
    }

    let result;
    if (tgl_login) {
      result = await db.query(
        `INSERT INTO status_login_mahasiswa (npm, kelas, sesi, tgl_login) VALUES ($1, $2, $3, $4) RETURNING *`,
        [String(npm).trim(), String(kelas).trim(), parseInt(sesi, 10), tgl_login]
      );
    } else {
      result = await db.query(
        `INSERT INTO status_login_mahasiswa (npm, kelas, sesi, tgl_login) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *`,
        [String(npm).trim(), String(kelas).trim(), parseInt(sesi, 10)]
      );
    }

    res.json({
      success: true,
      message: 'Status login mahasiswa berhasil dicatat ke database PostgreSQL',
      data: result.rows[0],
    });
  } catch (err: any) {
    console.error('Error recording status login:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Endpoint opsional untuk admin menghapus rekaman log jika diperlukan
app.delete('/api/status-login/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM status_login_mahasiswa WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Data status login berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// VITE MIDDLEWARE & SERVER START
// ==========================================
async function startServer() {
  await initDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
