# Sistem Pengelolaan Jadwal & Akun Kursus Mahasiswa

Sistem informasi berbasis web modern untuk pengelolaan jadwal perkuliahan, data materi kursus mahasiswa (M1 s/d M10), dan validasi hak akses login kursus per sesi. Aplikasi ini dirancang dengan tema warna **#525FE1** & Putih, serta menggunakan database **PostgreSQL** dengan arsitektur konfigurasi yang dipisahkan secara modular.

---

## 📌 Daftar Isi

1. [Fitur Utama](#-fitur-utama)
2. [Arsitektur Konfigurasi Database Terpisah](#-arsitektur-konfigurasi-database-terpisah)
3. [Panduan Lengkap Pembuatan Database](#-panduan-lengkap-pembuatan-database)
   - [Metode 1: Menggunakan Terminal / CLI (`psql`)](#metode-1-menggunakan-terminal--cli-psql)
   - [Metode 2: Menggunakan pgAdmin 4](#metode-2-menggunakan-pgadmin-4)
   - [Metode 3: Menggunakan DBeaver / Navicat](#metode-3-menggunakan-dbeaver--navicat)
   - [Metode 4: Otomatis Melalui Backend Node.js / PGlite](#metode-4-otomatis-melalui-backend-nodejs--pglite)
4. [Skema & Struktur Tabel Database](#-skema--struktur-tabel-database)
5. [Format File Excel untuk Upload Popup](#-format-file-excel-untuk-upload-popup)
   - [1. Upload Jadwal Mahasiswa](#1-format-excel-upload-jadwal-mahasiswa)
   - [2. Upload Materi Mahasiswa (M1 s/d M10)](#2-format-excel-upload-materi-mahasiswa-m1---m10)
6. [Panduan Menjalankan Aplikasi](#-panduan-menjalankan-aplikasi)
   - [Opsi 1: Menggunakan Docker Compose (Sangat Direkomendasikan)](#opsi-1-menggunakan-docker-compose-sangat-direkomendasikan)
   - [Opsi 2: Versi Fullstack Lokal (React + Node.js + Express)](#opsi-2-menjalankan-aplikasi-react--nodejs-lokal)
7. [Akun Administrator Default](#-akun-administrator-default)

---

## 🚀 Fitur Utama

- **Dashboard Real-Time**: Ringkasan jadwal hari ini, sesi aktif, serta statistik mahasiswa TEKREK & SOSHUM.
- **Data Tabel Jadwal Mahasiswa**: Pencarian instan (NPM/Nama/Kelas), filter tanggal dan sesi, pagination, edit, hapus, dan export ke CSV.
- **Data Tabel Materi Kursus (M1 s/d M10)**: Menampilkan materi pembelajaran lengkap tiap mahasiswa per pertemuan dari M1 sampai M10.
- **Upload Excel via Popup Modal**: Upload jadwal dan upload materi dilakukan secara langsung melalui jendela popup tanpa perlu membuka atau memuat ulang halaman baru.
- **Aturan Duplikasi NPM**: Jika mengunggah NPM yang sama, data tidak menimpa data lama melainkan **menambahkan entri baru** dengan timestamp dan status terbaru.
- **Portal Cek Login Mahasiswa**: Pengecekan izin akses mahasiswa berdasarkan jadwal aktif hari ini dan sesi yang sedang berjalan.
- **Konfigurasi Database Terpisah**: Konfigurasi parameter koneksi diisolasi ke file tersendiri (`.env`, `server/database.ts`, dan `docker-compose.yml`).
- **SQL Console & Latency Test**: Admin dapat menguji query SQL langsung dari antarmuka web dan melakukan tes latensi respon database.

---

## 🗄️ Arsitektur Konfigurasi Database Terpisah

Konfigurasi database dipisahkan secara terisolasi dari kode pemrosesan (business logic), memudahkan migrasi antar lingkungan (*Development*, *Staging*, *Production*):

```
├── .env.example              <- Template variabel lingkungan koneksi database
├── .env                      <- File konfigurasi kredensial lokal
├── server/
│   └── database.ts           <- Modul inisialisasi & query engine PostgreSQL (Node.js)
├── docker-compose.yml        <- Orkestrasi container PostgreSQL 16 & Web App
├── database.sql              <- Skrip DDL tabel, indeks, dan data awal (Seeds)
└── data/pgdata/              <- Direktori penyimpanan data lokal PGlite
```

### 1. `.env` (Environment Variables)
```env
DB_DRIVER=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_kursus_mahasiswa
DB_USER=postgres
DB_PASS=postgres123
DB_SSL=prefer
DB_DATA_DIR=data/pgdata
```

### 2. `server/database.ts` (Node.js Backend)
Modul konfigurasi membaca nilai dari `.env` dan mengekspor koneksi database secara konsisten untuk semua API endpoint.

---

## 🛠️ Panduan Lengkap Pembuatan Database

Database yang digunakan adalah **PostgreSQL** dengan nama default: `db_kursus_mahasiswa`. Anda dapat membuat database menggunakan salah satu metode di bawah ini.

### Metode 1: Menggunakan Terminal / CLI (`psql`)

Metode ini merupakan cara tercepat jika PostgreSQL sudah terpasang di komputer/server Anda.

1. **Buka Terminal / Command Prompt**, lalu masuk ke PostgreSQL:
   ```bash
   psql -U postgres
   ```
   *(Masukkan password akun postgres Anda jika diminta)*

2. **Buat Database Baru**:
   ```sql
   CREATE DATABASE db_kursus_mahasiswa;
   ```

3. **Hubungkan ke Database yang Baru Dibuat**:
   ```sql
   \c db_kursus_mahasiswa;
   ```

4. **Eksekusi File `database.sql`**:
   Jika Anda berada di folder proyek:
   ```sql
   \i database.sql
   ```
   *Atau jalankan langsung dari command line luar tanpa masuk ke psql prompt:*
   ```bash
   psql -U postgres -d db_kursus_mahasiswa -f database.sql
   ```

5. **Verifikasi Tabel Berhasil Dibuat**:
   ```sql
   \dt
   ```
   Anda akan melihat 5 tabel: `admin_users`, `ref_sesi`, `ref_kelas`, `jadwal_kursus`, dan `materi_kursus`.

---

### Metode 2: Menggunakan pgAdmin 4

1. Buka aplikasi **pgAdmin 4**.
2. Di panel kiri (*Browser*), klik kanan pada **Databases** -> pilih **Create** -> **Database...**
3. Pada tab **General**:
   - **Database**: `db_kursus_mahasiswa`
   - **Owner**: `postgres`
4. Klik tombol **Save**.
5. Klik pada database `db_kursus_mahasiswa` yang baru dibuat.
6. Buka menu **Tools** -> pilih **Query Tool**.
7. Buka file `database.sql` (bisa klik icon folder *Open File* atau salin seluruh isi file `database.sql` dan tempel ke jendela editor).
8. Tekan tombol **Execute / Play** (atau tekan tombol keyboard `F5`).
9. Muncul notifikasi *"Query returned successfully"* dan seluruh tabel beserta data awal selesai dibuat.

---

### Metode 3: Menggunakan DBeaver / Navicat

1. Buka DBeaver atau Navicat, lalu hubungkan ke koneksi PostgreSQL Anda.
2. Klik kanan pada folder database -> pilih **Create New Database** -> beri nama `db_kursus_mahasiswa`.
3. Buka **SQL Editor** baru yang terhubung ke `db_kursus_mahasiswa`.
4. Muat atau salin isi file `database.sql`.
5. Jalankan query (*Execute Script* / `Ctrl + Alt + X`).

---

### Metode 4: Otomatis Melalui Backend Node.js / PGlite

Jika Anda menjalankan aplikasi ini langsung di lingkungan Node.js (seperti AI Studio atau lokal dengan `npm run dev`), sistem telah dilengkapi modul **`server/database.ts`** dengan engine **PGlite**. Modul ini akan **secara otomatis membuat tabel dan mengisi data awal (seeds)** saat aplikasi pertama kali dijalankan di direktori `data/pgdata/` tanpa perlu konfigurasi manual!

---

## 📊 Skema & Struktur Tabel Database

File skema lengkap tersedia pada file **`database.sql`**. Berikut adalah rincian 5 tabel utama:

### 1. Tabel `admin_users`
Menyimpan akun administrator dengan hak akses login.
```sql
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nama_lengkap VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Tabel `ref_sesi`
Menyimpan referensi jam sesi perkuliahan.
```sql
CREATE TABLE IF NOT EXISTS ref_sesi (
    id SERIAL PRIMARY KEY,
    nomor_sesi INT UNIQUE NOT NULL,
    nama_sesi VARCHAR(100) NOT NULL,
    waktu_mulai VARCHAR(10) NOT NULL,
    waktu_selesai VARCHAR(10) NOT NULL,
    keterangan VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
*Data default:*
- Sesi 1: 08:00 - 10:00 WIB
- Sesi 2: 10:15 - 12:15 WIB
- Sesi 3: 13:00 - 15:00 WIB
- Sesi 4: 15:15 - 17:15 WIB

### 3. Tabel `ref_kelas`
Menyimpan kode dan kapasitas kelas per bidang TEKREK / SOSHUM.
```sql
CREATE TABLE IF NOT EXISTS ref_kelas (
    id SERIAL PRIMARY KEY,
    kode_kelas VARCHAR(50) UNIQUE NOT NULL,
    nama_kelas VARCHAR(100) NOT NULL,
    bidang VARCHAR(20) NOT NULL CHECK (bidang IN ('SOSHUM', 'TEKREK')),
    kapasitas INT DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Tabel `jadwal_kursus`
Menyimpan data jadwal kursus hasil import file Excel.
```sql
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

-- Indeks Performa
CREATE INDEX IF NOT EXISTS idx_jadwal_npm ON jadwal_kursus(npm);
CREATE INDEX IF NOT EXISTS idx_jadwal_tanggal ON jadwal_kursus(tanggal);
CREATE INDEX IF NOT EXISTS idx_jadwal_sesi ON jadwal_kursus(sesi);
CREATE INDEX IF NOT EXISTS idx_jadwal_bidang ON jadwal_kursus(bidang);
```

### 5. Tabel `materi_kursus`
Menyimpan silabus materi perkuliahan pertemuan 1 sampai 10 per mahasiswa.
```sql
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

-- Indeks Performa
CREATE INDEX IF NOT EXISTS idx_materi_npm ON materi_kursus(npm);
```

---

## 📁 Format File Excel untuk Upload Popup

Upload Excel dapat dilakukan kapan saja melalui **tombol Popup Modal** di navigasi maupun tabel data:

### 1. Format Excel: Upload Jadwal Mahasiswa
File format: `.xlsx` atau `.xls`. Baris pertama wajib memuat header berikut:

| Bidang | Tanggal | Sesi | NPM | Kelas | Nama |
| :--- | :--- | :--- | :--- | :--- | :--- |
| TEKREK | 2026-09-10 | 1 | 2023101001 | TEK-01 | Budi Santoso |
| TEKREK | 2026-09-10 | 2 | 2023101002 | TEK-02 | Siti Rahmawati |
| SOSHUM | 2026-09-10 | 3 | 2023202001 | SOS-01 | Andi Pratama |

> **Catatan Penting (Aturan Duplikasi NPM):**
> Jika mengunggah NPM yang sudah pernah ada di database, sistem **tidak akan menimpa (overwrite)** data lama, melainkan **menambahkan (append)** sebagai entri baru serta mencatat waktu `updated_at` terkini.

---

### 2. Format Excel: Upload Materi Mahasiswa (M1 - M10)
File format: `.xlsx` atau `.xls`. Baris pertama wajib memuat 11 kolom:

| npm | Materi M1 | Materi M2 | Materi M3 | Materi M4 | Materi M5 | Materi M6 | Materi M7 | Materi M8 | Materi M9 | Materi M10 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2023101001 | Pengenalan Algoritma | Variabel & Operator | Percabangan If-Else | Perulangan For | Fungsi Modular | Array 1D & 2D | Pointer & Memori | Stack & Queue | Sorting Searching | Proyek Mini |
| 2023101002 | Basis Data Relasional | ERD & Normalisasi | DDL Create Alter | DML Insert Update | Query Select Where | Inner Left Join | Subquery View | Stored Procedure | Trigger Indeks | Backup Restore |

> **Tips:** Anda dapat mengunduh file template Excel resmi langsung melalui tombol **"Unduh Template Excel"** di dalam jendela popup upload masing-masing.

---

## 💻 Panduan Menjalankan Aplikasi

### Opsi 1: Menggunakan Docker Compose (Sangat Direkomendasikan)

Dengan Docker Compose, Anda **tidak perlu menginstal PostgreSQL atau Node.js secara manual**. Seluruh database PostgreSQL (beserta skema tabel dan data awal dari `database.sql`), aplikasi web, dan pgAdmin 4 akan langsung aktif dan terkonfigurasi secara otomatis dalam satu perintah.

#### 1. Jalankan Seluruh Layanan:
```bash
docker compose up -d --build
```

Docker akan mengunduh image dan menjalankan 3 container:
- 🐘 **`postgres`** (Port `5432`): Database PostgreSQL 16 Alpine. File `database.sql` di-*mount* ke folder `/docker-entrypoint-initdb.d/01-init.sql` sehingga **database, tabel, indeks, dan data awal otomatis dibuat saat container pertama kali start**.
- 🌐 **`app`** (Port `3000`): Aplikasi Fullstack Node.js + Express + React yang langsung terhubung ke database.
- 🖥️ **`pgadmin`** (Port `5050`): Web GUI resmi pgAdmin 4 untuk manajemen visual database PostgreSQL.

#### 2. Akses Aplikasi & Database GUI:
- **Aplikasi Web Kursus**: Buka [http://localhost:3000](http://localhost:3000)
- **pgAdmin 4 (Web GUI)**: Buka [http://localhost:5050](http://localhost:5050)
  - **Email**: `admin@kursus.local`
  - **Password**: `admin123`
  - *(Untuk menghubungkan ke DB dari pgAdmin: Host name/address = `postgres`, Port = `5432`, Maintenance DB = `db_kursus_mahasiswa`, Username = `postgres`, Password = `postgres123`)*

#### 3. Perintah Manajemen Docker yang Sering Digunakan:
```bash
# Melihat status seluruh container
docker compose ps

# Melihat log aplikasi secara real-time
docker compose logs -f app

# Melihat log database PostgreSQL
docker compose logs -f postgres

# Menghentikan seluruh container (data tetap tersimpan di volume)
docker compose stop

# Menghapus container tanpa menghapus data
docker compose down

# Mereset database secara bersih (hapus volume dan buat ulang dari database.sql)
docker compose down -v && docker compose up -d --build
```

---

### Opsi 2: Menjalankan Aplikasi React + Node.js Lokal

Jika Anda ingin menjalankan kode secara langsung di komputer host tanpa Docker:

1. **Install dependensi**:
   ```bash
   npm install
   ```

2. **Atur Variabel Lingkungan** (opsional, sudah ada default di `.env.example`):
   ```bash
   cp .env.example .env
   ```

3. **Jalankan Dev Server**:
   ```bash
   npm run dev
   ```
   Aplikasi akan terbuka pada port `http://localhost:3000`.

4. **Build untuk Production**:
   ```bash
   npm run build
   npm run start
   ```

---

## 🔑 Akun Administrator Default

| Keterangan | Nilai Default |
| :--- | :--- |
| **Username** | `admin` |
| **Password** | `admin123` |
| **Nama Lengkap** | `Administrator Utama` |
| **Role** | Administrator |

---

## 📞 Pemeliharaan & Troubleshooting

- **Koneksi Database Gagal**: Periksa apakah service PostgreSQL Anda sedang berjalan (`sudo systemctl status postgresql` di Linux atau cek di Services Windows).
- **Port 5432 Bentrok**: Jika port default PostgreSQL 5432 sudah dipakai oleh instans lain, ubah `DB_PORT=5433` di file `.env` dan `docker-compose.yml`.
- **Uji Koneksi Langsung**: Gunakan menu **"Konfigurasi Database"** -> klik tombol **"Test Koneksi Database"** untuk memverifikasi latensi dan konektivitas secara instan.
