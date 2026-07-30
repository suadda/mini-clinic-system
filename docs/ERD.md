# Entity Relationship Diagram — Mini Clinic Information System

Database: **PostgreSQL**. This diagram renders automatically on GitHub.

```mermaid
erDiagram
    users ||--o| doctors : "has login account"
    users ||--o{ registrations : "created_by (petugas)"
    poli ||--o{ doctors : "assigned to"
    poli ||--o{ registrations : "visited"
    poli ||--o{ queues : "belongs to"
    patients ||--o{ registrations : "makes"
    patients ||--o{ medical_records : "has history"
    doctors ||--o{ registrations : "attends"
    doctors ||--o{ medical_records : "records"
    registrations ||--|| queues : "generates"
    registrations ||--o| medical_records : "results in"
    medical_records ||--o{ medical_actions : "includes"
    medical_records ||--o| prescriptions : "produces"
    prescriptions ||--o{ prescription_items : "contains"
    medications ||--o{ prescription_items : "listed as"

    users {
        serial id PK
        varchar name
        varchar email UK
        varchar password "bcrypt hash"
        enum role "administrator | dokter | petugas"
        boolean is_active
    }

    poli {
        serial id PK
        varchar nama
        varchar kode UK "queue prefix, e.g. A"
    }

    doctors {
        serial id PK
        int user_id FK "UK, nullable"
        varchar nama
        varchar spesialisasi
        int poli_id FK
        varchar no_str
    }

    patients {
        serial id PK
        varchar no_rekam_medis UK "auto RM000001"
        varchar nik UK "16 digits, checked"
        varchar nama
        enum jenis_kelamin "L | P"
        date tanggal_lahir
        varchar no_telepon
        text alamat
    }

    registrations {
        serial id PK
        int patient_id FK
        int doctor_id FK
        int poli_id FK
        date tanggal_kunjungan
        enum jenis_pembayaran "umum | bpjs | asuransi"
        text keluhan_awal
        enum status "menunggu | check_in | pemeriksaan | selesai"
        int created_by FK
    }

    queues {
        serial id PK
        int registration_id FK "UK"
        int poli_id FK
        varchar queue_number "e.g. A001"
        date queue_date
        enum status "menunggu | dipanggil | dilayani | selesai | dilewati"
        timestamptz called_at
    }

    medical_records {
        serial id PK
        int registration_id FK "UK"
        int patient_id FK
        int doctor_id FK
        text keluhan "S"
        varchar tekanan_darah "O"
        numeric suhu_tubuh "O"
        numeric berat_badan "O"
        numeric tinggi_badan "O"
        text diagnosa "A"
        text rencana_terapi "P"
    }

    medical_actions {
        serial id PK
        int medical_record_id FK
        varchar nama_tindakan
        numeric biaya
        text keterangan
    }

    medications {
        serial id PK
        varchar nama_obat UK
        varchar satuan
    }

    prescriptions {
        serial id PK
        int medical_record_id FK "UK"
        text catatan
    }

    prescription_items {
        serial id PK
        int prescription_id FK
        int medication_id FK "nullable"
        varchar nama_obat
        varchar dosis
        int jumlah
        varchar aturan_pakai
    }
```

## Relationship notes

- A **doctor** is optionally linked to a **user** (role `dokter`) so the same person can both log in and be selected during registration.
- Each **registration** generates exactly one **queue** row (`registration_id` is unique).
- A **medical record** is created only after the doctor examines the patient, so a registration has *zero or one* record.
- **SOAP** maps to columns on `medical_records`: `keluhan` (S), vitals (O), `diagnosa` (A), `rencana_terapi` (P).
- `medical_actions` (tindakan) and `prescriptions` → `prescription_items` (resep) hang off a medical record, giving each visit a full clinical trail.
- Patient examination history = all `medical_records` for a `patient_id`, ordered by date.
