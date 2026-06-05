# Info Clash Monorepo

Repositori ini adalah sebuah monorepo yang berisi aplikasi **Frontend** (React + Vite) dan **Backend** (Laravel 12). Repositori ini sudah dilengkapi dengan konfigurasi Docker Compose untuk memudahkan proses instalasi dan pengembangan.

## Struktur Direktori

- `apps/frontend/` - Aplikasi web frontend berbasis React dan Vite.
- `apps/backend/` - REST API backend berbasis Laravel 12 dan Laravel Reverb untuk WebSocket.
- `docker-compose.yml` - Konfigurasi Docker untuk menjalankan semua servis (Postgres, Redis, pgAdmin, Backend, Frontend, Reverb).

## Persyaratan (Prerequisites)

Sebelum menjalankan aplikasi, pastikan sistem Anda sudah terinstal:
- [Docker](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js & NPM (jika ingin menjalankan di luar Docker)
- PHP & Composer (jika ingin menjalankan di luar Docker)

## Cara Menjalankan Aplikasi (Menggunakan Docker)

Cara termudah untuk menjalankan aplikasi ini adalah menggunakan Docker.

### 1. Persiapan Environment Variables

Salin file `.env.example` menjadi `.env` di aplikasi backend:
```bash
cp apps/backend/.env.example apps/backend/.env
```
*(Sesuaikan juga konfigurasi database di dalam `.env` backend jika diperlukan. Secara default sudah disesuaikan untuk Docker)*

Jika aplikasi frontend memiliki file environment tersendiri (misal `.env`), pastikan juga sudah diatur dengan benar sesuai kebutuhan (misalnya VITE_API_URL).

### 2. Jalankan Docker Compose

Di root folder repositori ini, jalankan perintah berikut untuk mem-build dan menjalankan semua container:
```bash
docker-compose up -d --build
```

Proses ini mungkin membutuhkan waktu beberapa menit untuk mengunduh image dan mem-build aplikasi.

### 3. Setup Backend (Migrasi & Key)

Setelah container berjalan, lakukan setup pada backend Laravel dengan masuk ke container backend:
```bash
docker-compose exec backend composer setup
```
Atau jika Anda ingin menjalankan satu per satu:
```bash
docker-compose exec backend php artisan key:generate
docker-compose exec backend php artisan migrate
```

## Akses Layanan

Setelah semua servis berhasil dijalankan, Anda dapat mengakses layanan-layanan berikut di browser:

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **Laravel Reverb (WebSocket):** Berjalan di port `8080`
- **pgAdmin (Database Manager):** [http://localhost:5050](http://localhost:5050)
  - *Email:* `admin@admin.com` (Sesuai `PGADMIN_DEFAULT_EMAIL` di `docker-compose.yml`)
  - *Password:* `admin` (Sesuai `PGADMIN_DEFAULT_PASSWORD` di `docker-compose.yml`)
- **PostgreSQL:** `localhost:5432`
- **Redis:** `localhost:6379`

## Perintah Bermanfaat Lainnya

Melihat log dari seluruh container:
```bash
docker-compose logs -f
```

Melihat log khusus servis tertentu (contoh: backend):
```bash
docker-compose logs -f backend
```

Masuk ke dalam terminal container backend:
```bash
docker-compose exec backend bash
```

Masuk ke dalam terminal container frontend:
```bash
docker-compose exec frontend sh
```

Menghentikan seluruh layanan:
```bash
docker-compose down
```

Menghentikan dan menghapus semua volume database (Hati-hati data akan hilang):
```bash
docker-compose down -v
```

## Pengembangan Tanpa Docker (Manual)

Jika Anda ingin menjalankan aplikasi tanpa Docker, Anda perlu mengaktifkan servis database (Postgres & Redis) secara manual dan membuka dua terminal.

**Terminal 1: Menjalankan Backend**
```bash
cd apps/backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```
*(Jangan lupa jalankan juga `php artisan reverb:start` dan worker antrian jika menggunakan WebSocket/Queue)*

**Terminal 2: Menjalankan Frontend**
```bash
cd apps/frontend
npm install
npm run dev
```
