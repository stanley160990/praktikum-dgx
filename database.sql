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
-- Kolom password menyimpan hash SHA1 (40 karakter heksadesimal)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Format enkripsi hash SHA1
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
-- 4. TABEL: ref_fakultas
-- Referensi kode dan nama fakultas universitas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ref_fakultas (
    id SERIAL PRIMARY KEY,
    kode_fakultas VARCHAR(20) UNIQUE NOT NULL,
    nama_fakultas VARCHAR(150) NOT NULL,
    keterangan VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 5. TABEL: ref_minggu
-- Referensi minggu pertemuan kursus (Default: M1 sampai dengan M10)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ref_minggu (
    id SERIAL PRIMARY KEY,
    kode_minggu VARCHAR(20) UNIQUE NOT NULL,
    nomor_minggu INT NOT NULL,
    nama_minggu VARCHAR(100) NOT NULL,
    keterangan VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 6. TABEL: jadwal_kursus
-- Format Data Excel: Bidang, Tanggal, Sesi, Fakultas, Minggu, NPM, Kelas, Nama
-- Aturan Khusus: Duplikasi NPM tetap ditambahkan (append)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jadwal_kursus (
    id SERIAL PRIMARY KEY,
    bidang VARCHAR(20) NOT NULL CHECK (bidang IN ('SOSHUM', 'TEKREK')),
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

-- Indeks Performa Query
CREATE INDEX IF NOT EXISTS idx_jadwal_npm ON jadwal_kursus(npm);
CREATE INDEX IF NOT EXISTS idx_jadwal_tanggal ON jadwal_kursus(tanggal);
CREATE INDEX IF NOT EXISTS idx_jadwal_sesi ON jadwal_kursus(sesi);
CREATE INDEX IF NOT EXISTS idx_jadwal_bidang ON jadwal_kursus(bidang);
CREATE INDEX IF NOT EXISTS idx_jadwal_fakultas ON jadwal_kursus(fakultas);
CREATE INDEX IF NOT EXISTS idx_jadwal_minggu ON jadwal_kursus(minggu);

-- ------------------------------------------------------------
-- 7. TABEL: materi_kursus
-- Data Materi Pembelajaran M1 s/d M10 Berdasarkan FAKULTAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS materi_kursus (
    id SERIAL PRIMARY KEY,
    fakultas VARCHAR(50) NOT NULL,
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

-- Indeks Performa Query Materi
CREATE INDEX IF NOT EXISTS idx_materi_fakultas ON materi_kursus(fakultas);

-- ------------------------------------------------------------
-- 8. TABEL: status_login_mahasiswa
-- Data login mahasiswa yang dicatat otomatis oleh sistem eksternal
-- Kolom: npm, kelas, fakultas, sesi, tgl_login
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_login_mahasiswa (
    id SERIAL PRIMARY KEY,
    npm VARCHAR(50) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    fakultas VARCHAR(50),
    sesi INT NOT NULL,
    tgl_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indeks Performa Query Status Login
CREATE INDEX IF NOT EXISTS idx_status_login_npm ON status_login_mahasiswa(npm);
CREATE INDEX IF NOT EXISTS idx_status_login_tgl ON status_login_mahasiswa(tgl_login);
CREATE INDEX IF NOT EXISTS idx_status_login_fakultas ON status_login_mahasiswa(fakultas);

-- ------------------------------------------------------------
-- 9. TABEL: jadwal_kursus_archive
-- Data arsip jadwal mahasiswa yang telah di-archive per semester
-- Kolom: npm, kelas, nama_mahasiswa, sesi, nama_semester
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jadwal_kursus_archive (
    id SERIAL PRIMARY KEY,
    npm VARCHAR(50) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    nama_mahasiswa VARCHAR(255) NOT NULL,
    sesi INT NOT NULL,
    nama_semester VARCHAR(100) NOT NULL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_archive_semester ON jadwal_kursus_archive(nama_semester);
CREATE INDEX IF NOT EXISTS idx_archive_npm ON jadwal_kursus_archive(npm);

-- ------------------------------------------------------------
-- 10. TABEL: status_login_mahasiswa_archive
-- Data arsip riwayat login mahasiswa yang telah di-archive per semester
-- Kolom: npm, kelas, fakultas, sesi, tgl_login, nama_semester, archived_at
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_login_mahasiswa_archive (
    id SERIAL PRIMARY KEY,
    npm VARCHAR(50) NOT NULL,
    kelas VARCHAR(50) NOT NULL,
    fakultas VARCHAR(50),
    sesi INT NOT NULL,
    tgl_login TIMESTAMP WITH TIME ZONE,
    nama_semester VARCHAR(100) NOT NULL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_archive_login_semester ON status_login_mahasiswa_archive(nama_semester);
CREATE INDEX IF NOT EXISTS idx_archive_login_npm ON status_login_mahasiswa_archive(npm);
CREATE INDEX IF NOT EXISTS idx_archive_login_tgl ON status_login_mahasiswa_archive(tgl_login);

-- ============================================================
-- DATA AWAL (INITIAL SEED DATA)
-- ============================================================

-- 1. Akun Admin Default: admin / admin123
-- Password 'admin123' disimpan dalam format enkripsi hash SHA1:
-- SHA1('admin123') = 'f865b53623b121fd34ee5426c792e5c33af8c227'
INSERT INTO admin_users (username, password, nama_lengkap) 
VALUES ('admin', 'f865b53623b121fd34ee5426c792e5c33af8c227', 'Administrator Utama')
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password;

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

-- 4. Referensi Fakultas (Nilai Default Universitas)
INSERT INTO ref_fakultas (kode_fakultas, nama_fakultas, keterangan) VALUES
('FTI', 'Fakultas Teknologi Industri', 'Fakultas Teknologi Industri'),
('FIKTI', 'Fakultas Ilmu Komputer dan Teknologi Informasi', 'Fakultas Ilmu Komputer dan Teknologi Informasi'),
('FTSP', 'Fakultas Teknik Sipil dan Prencanaan', 'Fakultas Teknik Sipil dan Prencanaan'),
('FIKES', 'Fakultas Ilmu Kesehatan Masyarakat', 'Fakultas Ilmu Kesehatan Masyarakat'),
('FE', 'Fakultas Ekonomi', 'Fakultas Ekonomi'),
('FSB', 'Fakultas Sastra dan Bahasa', 'Fakultas Sastra dan Bahasa'),
('FPSI', 'Fakultas Psikologi', 'Fakultas Psikologi'),
('FIKOM', 'Fakultas Ilmu Ekonomi', 'Fakultas Ilmu Ekonomi')
ON CONFLICT (kode_fakultas) DO UPDATE SET nama_fakultas = EXCLUDED.nama_fakultas;

-- 5. Referensi Minggu Pertemuan (M1 sampai dengan M10)
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

-- 6. Contoh Data Jadwal Kursus
INSERT INTO jadwal_kursus (bidang, tanggal, sesi, fakultas, minggu, npm, kelas, nama, status_entry) VALUES
('TEKREK', CURRENT_DATE, 1, 'FIKTI', 'M1', '2023101001', 'TEK-01', 'Budi Santoso', 'BARU'),
('TEKREK', CURRENT_DATE, 2, 'FTI', 'M1', '2023101002', 'TEK-02', 'Siti Rahmawati', 'BARU'),
('SOSHUM', CURRENT_DATE, 3, 'FE', 'M2', '2023202001', 'SOS-01', 'Andi Pratama', 'BARU'),
('SOSHUM', CURRENT_DATE + INTERVAL '1 day', 1, 'FSB', 'M2', '2023202002', 'SOS-02', 'Dewi Lestari', 'BARU'),
('TEKREK', CURRENT_DATE + INTERVAL '1 day', 4, 'FIKTI', 'M3', '2023101003', 'TEK-01', 'Rizky Firmansyah', 'BARU');

-- 7. Contoh Data Materi Kursus Berdasarkan FAKULTAS (M1 s/d M10)
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

-- 6. Contoh Data Status Login Mahasiswa (Diinput oleh Sistem Lain)
INSERT INTO status_login_mahasiswa (npm, kelas, sesi, tgl_login) VALUES
('2023101001', 'TEK-01', 1, CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
('2023101002', 'TEK-02', 2, CURRENT_TIMESTAMP - INTERVAL '35 minutes'),
('2023202001', 'SOS-01', 3, CURRENT_TIMESTAMP - INTERVAL '1 hour 20 minutes'),
('2023202002', 'SOS-02', 1, CURRENT_TIMESTAMP - INTERVAL '2 hours 45 minutes'),
('2023101003', 'TEK-01', 4, CURRENT_TIMESTAMP - INTERVAL '3 hours 10 minutes'),
('2023101004', 'TEK-02', 2, CURRENT_TIMESTAMP - INTERVAL '5 hours 20 minutes'),
('2023202003', 'SOS-01', 3, CURRENT_TIMESTAMP - INTERVAL '1 day 2 hours');
