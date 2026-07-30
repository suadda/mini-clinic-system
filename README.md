# Mini Clinic Information System

Aplikasi berbasis web untuk membantu proses administrasi dan pelayanan pasien klinik pratama secara terintegrasi. 

## Teknologi
- **Frontend**: React.js
- **Backend**: Node.js (Express.js)
- **Database**: PostgreSQL / MySQL

## Cara Instalasi & Menjalankan Aplikasi

### 1. Database Setup
1. Buat database baru dengan nama `clinic_db`.
2. Import file `database.sql` (jika ada) ke dalam database tersebut.

### 2. Backend Setup
1. Buka terminal dan masuk ke folder backend: `cd backend`
2. Install dependencies: `npm install`
3. Salin file `.env.example` menjadi `.env` dan sesuaikan konfigurasi database dan JWT.
4. Jalankan server: `npm run dev`

### 3. Frontend Setup
1. Buka terminal baru dan masuk ke folder frontend: `cd frontend`
2. Install dependencies: `npm install`
3. Salin file `.env.example` menjadi `.env` dan pastikan URL API sudah benar.
4. Jalankan aplikasi: `npm run dev`

## Akun Login (Testing)
- **Administrator**: admin@clinic.com / password123
- **Dokter**: dokter@clinic.com / password123
- **Petugas Pendaftaran**: petugas@clinic.com / password123

## Struktur Project
```text
nexa-clinic-system/
├── backend/       # Node.js & Express API
└── frontend/      # React.js UI