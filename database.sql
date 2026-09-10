-- ============================================================
-- SKEMA DATABASE POSTGRESQL: db_kursus_mahasiswa
-- Aplikasi: Sistem Pengelolaan Jadwal & Akun Kursus Mahasiswa
-- Tema Warna: #525FE1 & Putih
-- ============================================================

-- Buat Database (Jalankan ini terlebih dahulu jika belum dibuat):
-- CREATE DATABASE db_kursus_mahasiswa;
-- \c db_kursus_mahasiswa;

-- ------------------------------------------------------------
-- 1. TABEL: admin_users
-- Pengguna dengan peran Administrator utama untuk login
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. TABEL: ref_sesi
-- Referensi nomor sesi dan rentang waktu perkuliahan
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ref_sesi (
    id SERIAL PRIMARY KEY,
    nomor_sesi INT UNIQUE NOT NULL,
    nama_sesi VARCHAR(100) NOT NULL,
    waktu_mulai VARCHAR(10) NOT NULL,
    waktu_selesai VARCHAR(10) NOT NULL,
    keterangan VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 3. TABEL: ref_kelas
-- Referensi kode kelas dan kapasitas per bidang TEKREK / SOSHUM
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ref_kelas (
    id SERIAL PRIMARY KEY,
    kode_kelas VARCHAR(50) UNIQUE NOT NULL,
    nama_kelas VARCHAR(100) NOT NULL,
    bidang VARCHAR(20) NOT NULL CHECK (bidang IN ('SOSHUM', 'TEKREK')),
    kapasitas INT DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 4. TABEL: jadwal_kursus
-- Format Data Excel: Bidang, Tanggal, Sesi, NPM, Kelas, Nama
-- Aturan Khusus: Duplikasi NPM tetap ditambahkan (append)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jadwal_kursus (
    id SERIAL PRIMARY KEY,
    bidang VARCHAR(20) NOT NULL CHECK (bidang IN ('SOSHUM', 'TEKREK')),
    tanggal DATE NOT NULL,
    sesi INT NOT NULL,
    npm VARCHAR(50) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    status_entry VARCHAR(50) DEFAULT 'BARU',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks Performa Query
CREATE INDEX IF NOT EXISTS idx_jadwal_npm ON jadwal_kursus(npm);
CREATE INDEX IF NOT EXISTS idx_jadwal_tanggal ON jadwal_kursus(tanggal);
CREATE INDEX IF NOT EXISTS idx_jadwal_sesi ON jadwal_kursus(sesi);
CREATE INDEX IF NOT EXISTS idx_jadwal_bidang ON jadwal_kursus(bidang);

-- ------------------------------------------------------------
-- 5. TABEL: materi_kursus
-- Format Data Excel: npm, nama, Materi M1 s/d Materi M10
-- ------------------------------------------------------------
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

-- Indeks Performa Query Materi
CREATE INDEX IF NOT EXISTS idx_materi_npm ON materi_kursus(npm);

-- ------------------------------------------------------------
-- 6. TABEL: status_login_mahasiswa
-- Data login mahasiswa yang dicatat otomatis oleh sistem eksternal
-- Kolom: npm, kelas, sesi, tgl_login
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_login_mahasiswa (
    id SERIAL PRIMARY KEY,
    npm VARCHAR(50) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    sesi INT NOT NULL,
    tgl_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks Performa Query Status Login
CREATE INDEX IF NOT EXISTS idx_status_login_npm ON status_login_mahasiswa(npm);
CREATE INDEX IF NOT EXISTS idx_status_login_tgl ON status_login_mahasiswa(tgl_login);

-- ============================================================
-- DATA AWAL (INITIAL SEED DATA)
-- ============================================================

-- 1. Akun Admin Default: admin / admin123
INSERT INTO admin_users (username, password, nama_lengkap) 
VALUES ('admin', 'admin123', 'Administrator Utama')
ON CONFLICT (username) DO NOTHING;

-- 2. Referensi Sesi (Sesi 1 s/d Sesi 4)
INSERT INTO ref_sesi (nomor_sesi, nama_sesi, waktu_mulai, waktu_selesai, keterangan) VALUES
(1, 'Sesi 1 (Pagi Utama)', '08:00', '10:00', 'Sesi kuliah dan praktikum pagi'),
(2, 'Sesi 2 (Siang Awal)', '10:15', '12:15', 'Sesi kuliah menjelang siang'),
(3, 'Sesi 3 (Siang Lanjutan)', '13:00', '15:00', 'Sesi kuliah setelah istirahat siang'),
(4, 'Sesi 4 (Sore)', '15:15', '17:15', 'Sesi kuliah sore hari')
ON CONFLICT (nomor_sesi) DO NOTHING;

-- 3. Referensi Kelas
INSERT INTO ref_kelas (kode_kelas, nama_kelas, bidang, kapasitas) VALUES
('TEK-01', 'Teknik Rekayasa Kelas A', 'TEKREK', 40),
('TEK-02', 'Teknik Rekayasa Kelas B', 'TEKREK', 35),
('SOS-01', 'Sosial Humaniora Kelas A', 'SOSHUM', 45),
('SOS-02', 'Sosial Humaniora Kelas B', 'SOSHUM', 40)
ON CONFLICT (kode_kelas) DO NOTHING;

-- 4. Contoh Data Jadwal Kursus
INSERT INTO jadwal_kursus (bidang, tanggal, sesi, npm, kelas, nama, status_entry) VALUES
('TEKREK', CURRENT_DATE, 1, '2023101001', 'TEK-01', 'Budi Santoso', 'BARU'),
('TEKREK', CURRENT_DATE, 2, '2023101002', 'TEK-02', 'Siti Rahmawati', 'BARU'),
('SOSHUM', CURRENT_DATE, 3, '2023202001', 'SOS-01', 'Andi Pratama', 'BARU'),
('SOSHUM', CURRENT_DATE + INTERVAL '1 day', 1, '2023202002', 'SOS-02', 'Dewi Lestari', 'BARU'),
('TEKREK', CURRENT_DATE + INTERVAL '1 day', 4, '2023101003', 'TEK-01', 'Rizky Firmansyah', 'BARU');

-- 5. Contoh Data Materi Kursus (M1 s/d M10)
INSERT INTO materi_kursus (npm, nama, materi_m1, materi_m2, materi_m3, materi_m4, materi_m5, materi_m6, materi_m7, materi_m8, materi_m9, materi_m10) VALUES
('2023101001', 'Budi Santoso', 
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
('2023101002', 'Siti Rahmawati', 
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
('2023202001', 'Andi Pratama', 
 'Komunikasi Bisnis & Negosiasi Interpersonal', 
 'Teknik Presentasi & Pitching Ide', 
 'Etika Profesi & Tata Kelola Bisnis Modern', 
 'Manajemen Organisasi & Pengembangan SDM', 
 'Riset Pasar & Analisis Perilaku Konsumen', 
 'Strategi Pemasaran Digital & Social Media', 
 'Kepemimpinan & Kerja Sama Tim Lintas Fungsi', 
 'Perencanaan Rencana Bisnis Strategis (Business Plan)', 
 'Evaluasi Kinerja Keuangan & Manajemen Risiko', 
 'Presentasi Sidang Studi Kasus Akhir')
ON CONFLICT (npm) DO NOTHING;

-- 6. Contoh Data Status Login Mahasiswa (Diinput oleh Sistem Lain)
INSERT INTO status_login_mahasiswa (npm, kelas, sesi, tgl_login) VALUES
('2023101001', 'TEK-01', 1, CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
('2023101002', 'TEK-02', 2, CURRENT_TIMESTAMP - INTERVAL '35 minutes'),
('2023202001', 'SOS-01', 3, CURRENT_TIMESTAMP - INTERVAL '1 hour 20 minutes'),
('2023202002', 'SOS-02', 1, CURRENT_TIMESTAMP - INTERVAL '2 hours 45 minutes'),
('2023101003', 'TEK-01', 4, CURRENT_TIMESTAMP - INTERVAL '3 hours 10 minutes'),
('2023101004', 'TEK-02', 2, CURRENT_TIMESTAMP - INTERVAL '5 hours 20 minutes'),
('2023202003', 'SOS-01', 3, CURRENT_TIMESTAMP - INTERVAL '1 day 2 hours');
