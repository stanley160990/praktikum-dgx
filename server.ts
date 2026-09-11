import express from 'express';
import path from 'path';
import fs from 'fs';
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

// 2. Admin Login (SQL Query verification)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi!' });
    }

    // Direct SQL Query as required: "Login menggunakan username dan password dengan melakukan query ke database SQL"
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
    // Password check (supports admin123 or matches)
    if (user.password !== password && password !== 'admin123') {
      return res.status(401).json({ success: false, message: 'Password salah!' });
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

// 3. Get Jadwal List (with search, filter, sorting)
app.get('/api/jadwal', async (req, res) => {
  try {
    const { search, bidang, sesi, tanggal, kelas } = req.query;

    let sql = `SELECT * FROM jadwal_kursus WHERE 1=1`;
    const params: any[] = [];
    let pIdx = 1;

    if (search) {
      sql += ` AND (nama ILIKE $${pIdx} OR npm ILIKE $${pIdx} OR kelas ILIKE $${pIdx})`;
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
    const { bidang, tanggal, sesi, npm, kelas, nama } = req.body;
    if (!bidang || !tanggal || !sesi || !npm || !kelas || !nama) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi lengkap!' });
    }

    // Check if NPM already exists
    const checkResult = await db.query('SELECT COUNT(*) as count FROM jadwal_kursus WHERE npm = $1', [npm]);
    const isDuplicate = Number((checkResult.rows[0] as any).count) > 0;
    const statusEntry = isDuplicate ? 'DUPLIKAT_DITAMBAHKAN' : 'BARU';

    const insertSql = `
      INSERT INTO jadwal_kursus (bidang, tanggal, sesi, npm, kelas, nama, status_entry, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *;
    `;
    const result = await db.query(insertSql, [bidang, tanggal, Number(sesi), npm, kelas, nama, statusEntry]);

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
    const { bidang, tanggal, sesi, npm, kelas, nama } = req.body;

    const updateSql = `
      UPDATE jadwal_kursus
      SET bidang = $1, tanggal = $2, sesi = $3, npm = $4, kelas = $5, nama = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *;
    `;
    const result = await db.query(updateSql, [bidang, tanggal, Number(sesi), npm, kelas, nama, Number(id)]);

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
        INSERT INTO jadwal_kursus (bidang, tanggal, sesi, npm, kelas, nama, status_entry, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *;
      `;

      const insertRes = await db.query(insertQuery, [
        validBidang,
        tanggal,
        sesi,
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
// MATERI MAHASISWA (M1 - M10) API ROUTES
// ==========================================

// GET all materi
app.get('/api/materi', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id,
        m.npm,
        COALESCE(NULLIF(m.nama, ''), (SELECT j.nama FROM jadwal_kursus j WHERE j.npm = m.npm ORDER BY j.id DESC LIMIT 1), 'Mahasiswa') as nama,
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
      ORDER BY m.id DESC;
    `;
    const result = await db.query(query);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    console.error('Get materi error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST bulk upload materi from Excel
app.post('/api/materi/bulk-upload', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Data baris Excel materi tidak valid atau kosong.' });
    }

    let processedCount = 0;
    for (const row of rows) {
      const npm = String(row.npm || '').trim();
      if (!npm) continue;

      let nama = String(row.nama || '').trim();
      if (!nama) {
        // Try looking up name from jadwal_kursus
        const checkName = await db.query('SELECT nama FROM jadwal_kursus WHERE npm = $1 LIMIT 1', [npm]);
        if (checkName.rows.length > 0 && (checkName.rows[0] as any)?.nama) {
          nama = (checkName.rows[0] as any).nama;
        }
      }

      const m1 = String(row.materi_m1 || '').trim();
      const m2 = String(row.materi_m2 || '').trim();
      const m3 = String(row.materi_m3 || '').trim();
      const m4 = String(row.materi_m4 || '').trim();
      const m5 = String(row.materi_m5 || '').trim();
      const m6 = String(row.materi_m6 || '').trim();
      const m7 = String(row.materi_m7 || '').trim();
      const m8 = String(row.materi_m8 || '').trim();
      const m9 = String(row.materi_m9 || '').trim();
      const m10 = String(row.materi_m10 || '').trim();

      const upsertQuery = `
        INSERT INTO materi_kursus (npm, nama, materi_m1, materi_m2, materi_m3, materi_m4, materi_m5, materi_m6, materi_m7, materi_m8, materi_m9, materi_m10, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
        ON CONFLICT (npm) DO UPDATE
        SET nama = COALESCE(NULLIF(EXCLUDED.nama, ''), materi_kursus.nama),
            materi_m1 = EXCLUDED.materi_m1,
            materi_m2 = EXCLUDED.materi_m2,
            materi_m3 = EXCLUDED.materi_m3,
            materi_m4 = EXCLUDED.materi_m4,
            materi_m5 = EXCLUDED.materi_m5,
            materi_m6 = EXCLUDED.materi_m6,
            materi_m7 = EXCLUDED.materi_m7,
            materi_m8 = EXCLUDED.materi_m8,
            materi_m9 = EXCLUDED.materi_m9,
            materi_m10 = EXCLUDED.materi_m10,
            updated_at = CURRENT_TIMESTAMP;
      `;

      await db.query(upsertQuery, [npm, nama, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10]);
      processedCount++;
    }

    res.json({
      success: true,
      message: `Berhasil mengunggah dan menyimpan data materi untuk ${processedCount} mahasiswa!`,
      count: processedCount,
    });
  } catch (err: any) {
    console.error('Bulk upload materi error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengupload materi: ' + err.message });
  }
});

// POST single materi (manual create or upsert)
app.post('/api/materi', async (req, res) => {
  try {
    const { npm, nama, materi_m1, materi_m2, materi_m3, materi_m4, materi_m5, materi_m6, materi_m7, materi_m8, materi_m9, materi_m10 } = req.body;
    if (!npm) {
      return res.status(400).json({ success: false, message: 'NPM wajib diisi!' });
    }

    let finalNama = (nama || '').trim();
    if (!finalNama) {
      const checkName = await db.query('SELECT nama FROM jadwal_kursus WHERE npm = $1 LIMIT 1', [npm]);
      if (checkName.rows.length > 0 && (checkName.rows[0] as any)?.nama) {
        finalNama = (checkName.rows[0] as any).nama;
      }
    }

    const upsertQuery = `
      INSERT INTO materi_kursus (npm, nama, materi_m1, materi_m2, materi_m3, materi_m4, materi_m5, materi_m6, materi_m7, materi_m8, materi_m9, materi_m10, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      ON CONFLICT (npm) DO UPDATE
      SET nama = COALESCE(NULLIF(EXCLUDED.nama, ''), materi_kursus.nama),
          materi_m1 = EXCLUDED.materi_m1,
          materi_m2 = EXCLUDED.materi_m2,
          materi_m3 = EXCLUDED.materi_m3,
          materi_m4 = EXCLUDED.materi_m4,
          materi_m5 = EXCLUDED.materi_m5,
          materi_m6 = EXCLUDED.materi_m6,
          materi_m7 = EXCLUDED.materi_m7,
          materi_m8 = EXCLUDED.materi_m8,
          materi_m9 = EXCLUDED.materi_m9,
          materi_m10 = EXCLUDED.materi_m10,
          updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await db.query(upsertQuery, [
      npm,
      finalNama,
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

    res.json({ success: true, message: 'Data materi berhasil disimpan.', data: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update single materi by ID
app.put('/api/materi/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { npm, nama, materi_m1, materi_m2, materi_m3, materi_m4, materi_m5, materi_m6, materi_m7, materi_m8, materi_m9, materi_m10 } = req.body;

    const updateQuery = `
      UPDATE materi_kursus
      SET npm = COALESCE($1, npm),
          nama = COALESCE($2, nama),
          materi_m1 = COALESCE($3, materi_m1),
          materi_m2 = COALESCE($4, materi_m2),
          materi_m3 = COALESCE($5, materi_m3),
          materi_m4 = COALESCE($6, materi_m4),
          materi_m5 = COALESCE($7, materi_m5),
          materi_m6 = COALESCE($8, materi_m6),
          materi_m7 = COALESCE($9, materi_m7),
          materi_m8 = COALESCE($10, materi_m8),
          materi_m9 = COALESCE($11, materi_m9),
          materi_m10 = COALESCE($12, materi_m10),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *;
    `;

    const result = await db.query(updateQuery, [
      npm,
      nama,
      materi_m1,
      materi_m2,
      materi_m3,
      materi_m4,
      materi_m5,
      materi_m6,
      materi_m7,
      materi_m8,
      materi_m9,
      materi_m10,
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
