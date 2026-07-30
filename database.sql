-- =====================================================================
-- Mini Clinic Information System
-- PostgreSQL Schema + Seed Data
-- ---------------------------------------------------------------------
-- Run on a fresh database, e.g.:
--   createdb clinic_db
--   psql -U postgres -d clinic_db -f database.sql
--
-- Seeded login accounts (password for all: password123):
--   Administrator       -> admin@clinic.com
--   Dokter              -> dokter@clinic.com
--   Petugas Pendaftaran -> petugas@clinic.com
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Clean slate (safe re-run)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS prescription_items CASCADE;
DROP TABLE IF EXISTS prescriptions      CASCADE;
DROP TABLE IF EXISTS medical_actions    CASCADE;
DROP TABLE IF EXISTS medical_records    CASCADE;
DROP TABLE IF EXISTS queues             CASCADE;
DROP TABLE IF EXISTS registrations      CASCADE;
DROP TABLE IF EXISTS patients           CASCADE;
DROP TABLE IF EXISTS doctors            CASCADE;
DROP TABLE IF EXISTS medications        CASCADE;
DROP TABLE IF EXISTS poli               CASCADE;
DROP TABLE IF EXISTS users              CASCADE;

DROP TYPE IF EXISTS user_role           CASCADE;
DROP TYPE IF EXISTS gender_type         CASCADE;
DROP TYPE IF EXISTS payment_type        CASCADE;
DROP TYPE IF EXISTS registration_status CASCADE;
DROP TYPE IF EXISTS queue_status        CASCADE;

DROP SEQUENCE IF EXISTS rm_seq CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- ---------------------------------------------------------------------
-- 1. ENUM types
-- ---------------------------------------------------------------------
CREATE TYPE user_role           AS ENUM ('administrator', 'dokter', 'petugas');
CREATE TYPE gender_type         AS ENUM ('L', 'P');                                  -- L = Laki-laki, P = Perempuan
CREATE TYPE payment_type        AS ENUM ('umum', 'bpjs', 'asuransi');
CREATE TYPE registration_status AS ENUM ('menunggu', 'check_in', 'pemeriksaan', 'selesai');
CREATE TYPE queue_status        AS ENUM ('menunggu', 'dipanggil', 'dilayani', 'selesai', 'dilewati');

-- Sequence used to auto-generate Nomor Rekam Medis (RM000001, RM000002, ...)
CREATE SEQUENCE rm_seq START 1;

-- Shared trigger to keep updated_at fresh on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 2. USERS (authentication + roles)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(120) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,               -- bcrypt hash, never plaintext
    role       user_role    NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 3. POLI (clinic departments; kode is also the queue prefix)
-- ---------------------------------------------------------------------
CREATE TABLE poli (
    id         SERIAL PRIMARY KEY,
    nama       VARCHAR(80) NOT NULL,
    kode       VARCHAR(5)  NOT NULL UNIQUE,          -- e.g. 'A' -> queue A001, A002...
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 4. DOCTORS (a doctor may be linked to a login user with role 'dokter')
-- ---------------------------------------------------------------------
CREATE TABLE doctors (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    nama         VARCHAR(100) NOT NULL,
    spesialisasi VARCHAR(100),
    poli_id      INTEGER REFERENCES poli(id) ON DELETE SET NULL,
    no_str       VARCHAR(50),                        -- nomor Surat Tanda Registrasi
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 5. PATIENTS (master data pasien)
--    no_rekam_medis auto-generates at DB level -> never insert it manually
-- ---------------------------------------------------------------------
CREATE TABLE patients (
    id             SERIAL PRIMARY KEY,
    no_rekam_medis VARCHAR(20) NOT NULL UNIQUE
                     DEFAULT ('RM' || LPAD(nextval('rm_seq')::text, 6, '0')),
    nik            VARCHAR(16) NOT NULL UNIQUE,
    nama           VARCHAR(100) NOT NULL,
    jenis_kelamin  gender_type NOT NULL,
    tanggal_lahir  DATE NOT NULL,
    no_telepon     VARCHAR(20),
    alamat         TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_nik_16_digits CHECK (nik ~ '^[0-9]{16}$')
);

-- ---------------------------------------------------------------------
-- 6. REGISTRATIONS (pendaftaran kunjungan)
-- ---------------------------------------------------------------------
CREATE TABLE registrations (
    id                SERIAL PRIMARY KEY,
    patient_id        INTEGER NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id         INTEGER NOT NULL REFERENCES doctors(id)  ON DELETE RESTRICT,
    poli_id           INTEGER NOT NULL REFERENCES poli(id)     ON DELETE RESTRICT,
    tanggal_kunjungan DATE NOT NULL DEFAULT CURRENT_DATE,
    jenis_pembayaran  payment_type NOT NULL DEFAULT 'umum',
    keluhan_awal      TEXT,
    status            registration_status NOT NULL DEFAULT 'menunggu',
    created_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 7. QUEUES (antrean; one queue row per registration)
-- ---------------------------------------------------------------------
CREATE TABLE queues (
    id              SERIAL PRIMARY KEY,
    registration_id INTEGER NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
    poli_id         INTEGER NOT NULL REFERENCES poli(id) ON DELETE RESTRICT,
    queue_number    VARCHAR(10) NOT NULL,                 -- e.g. A001
    queue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    status          queue_status NOT NULL DEFAULT 'menunggu',
    called_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_queue_per_day UNIQUE (poli_id, queue_date, queue_number)
);

-- ---------------------------------------------------------------------
-- 8. MEDICAL RECORDS (pemeriksaan dokter - metode SOAP)
-- ---------------------------------------------------------------------
CREATE TABLE medical_records (
    id              SERIAL PRIMARY KEY,
    registration_id INTEGER NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
    patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id       INTEGER NOT NULL REFERENCES doctors(id)  ON DELETE RESTRICT,
    -- S : Subjective
    keluhan         TEXT,
    -- O : Objective
    tekanan_darah   VARCHAR(15),          -- e.g. 120/80
    suhu_tubuh      NUMERIC(4,1),         -- degrees Celsius, e.g. 36.7
    berat_badan     NUMERIC(5,2),         -- kg
    tinggi_badan    NUMERIC(5,2),         -- cm
    -- A : Assessment
    diagnosa        TEXT,
    -- P : Plan
    rencana_terapi  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 9. MEDICAL ACTIONS (tindakan medis; many per medical record)
-- ---------------------------------------------------------------------
CREATE TABLE medical_actions (
    id                SERIAL PRIMARY KEY,
    medical_record_id INTEGER NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    nama_tindakan     VARCHAR(150) NOT NULL,
    biaya             NUMERIC(12,2) NOT NULL DEFAULT 0,
    keterangan        TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 10. MEDICATIONS (master obat)
-- ---------------------------------------------------------------------
CREATE TABLE medications (
    id         SERIAL PRIMARY KEY,
    nama_obat  VARCHAR(120) NOT NULL UNIQUE,
    satuan     VARCHAR(30) NOT NULL DEFAULT 'tablet',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 11. PRESCRIPTIONS + ITEMS (resep obat)
-- ---------------------------------------------------------------------
CREATE TABLE prescriptions (
    id                SERIAL PRIMARY KEY,
    medical_record_id INTEGER NOT NULL UNIQUE REFERENCES medical_records(id) ON DELETE CASCADE,
    catatan           TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prescription_items (
    id              SERIAL PRIMARY KEY,
    prescription_id INTEGER NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_id   INTEGER REFERENCES medications(id) ON DELETE SET NULL,
    nama_obat       VARCHAR(120) NOT NULL,      -- snapshot at prescribing time
    dosis           VARCHAR(60),                -- e.g. 500mg
    jumlah          INTEGER NOT NULL DEFAULT 1,
    aturan_pakai    VARCHAR(120),               -- e.g. 3x1 sehari sesudah makan
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_jumlah_positive CHECK (jumlah > 0)
);

-- ---------------------------------------------------------------------
-- 12. Indexes (search / filter hot paths)
-- ---------------------------------------------------------------------
CREATE INDEX idx_patients_nama        ON patients (LOWER(nama));
CREATE INDEX idx_registrations_tgl    ON registrations (tanggal_kunjungan);
CREATE INDEX idx_registrations_status ON registrations (status);
CREATE INDEX idx_queues_date_status   ON queues (queue_date, status);
CREATE INDEX idx_medrec_patient       ON medical_records (patient_id);

-- ---------------------------------------------------------------------
-- 13. updated_at triggers
-- ---------------------------------------------------------------------
CREATE TRIGGER trg_users_updated         BEFORE UPDATE ON users            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_poli_updated          BEFORE UPDATE ON poli             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_doctors_updated       BEFORE UPDATE ON doctors          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_patients_updated      BEFORE UPDATE ON patients         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_registrations_updated BEFORE UPDATE ON registrations    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_queues_updated        BEFORE UPDATE ON queues           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_medrec_updated        BEFORE UPDATE ON medical_records  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_medications_updated   BEFORE UPDATE ON medications      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_prescriptions_updated BEFORE UPDATE ON prescriptions    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================================
-- SEED DATA
-- =====================================================================

-- Users (bcrypt hash below = "password123")
INSERT INTO users (name, email, password, role) VALUES
  ('Administrator Klinik', 'admin@clinic.com',   '$2a$10$dzBez5yJq10/.3.o8xqiVOrfp4/Vf7bapYlc3IS39UE8RnA1z6py6', 'administrator'),
  ('dr. Andini Pratama',   'dokter@clinic.com',  '$2a$10$dzBez5yJq10/.3.o8xqiVOrfp4/Vf7bapYlc3IS39UE8RnA1z6py6', 'dokter'),
  ('Petugas Pendaftaran',  'petugas@clinic.com', '$2a$10$dzBez5yJq10/.3.o8xqiVOrfp4/Vf7bapYlc3IS39UE8RnA1z6py6', 'petugas');

-- Poli
INSERT INTO poli (nama, kode) VALUES
  ('Poli Umum', 'A'),
  ('Poli Gigi', 'B'),
  ('Poli Anak', 'C');

-- Doctors (dr. Andini is linked to the dokter login account)
INSERT INTO doctors (user_id, nama, spesialisasi, poli_id, no_str) VALUES
  ((SELECT id FROM users WHERE email = 'dokter@clinic.com'),
   'dr. Andini Pratama', 'Dokter Umum', (SELECT id FROM poli WHERE kode = 'A'), 'STR-001-2023'),
  (NULL,
   'drg. Bima Saputra',  'Dokter Gigi', (SELECT id FROM poli WHERE kode = 'B'), 'STR-002-2023');

-- Medications (master obat)
INSERT INTO medications (nama_obat, satuan) VALUES
  ('Paracetamol 500mg', 'tablet'),
  ('Amoxicillin 500mg', 'kapsul'),
  ('Antasida',          'tablet'),
  ('CTM',               'tablet'),
  ('Vitamin C',         'tablet'),
  ('Ibuprofen 400mg',   'tablet');

-- Patients (no_rekam_medis auto-generates -> not listed)
INSERT INTO patients (nik, nama, jenis_kelamin, tanggal_lahir, no_telepon, alamat) VALUES
  ('3273010101900001', 'Budi Santoso',   'L', '1990-01-01', '081234567801', 'Jl. Merdeka No. 10, Bandung'),
  ('3273020202950002', 'Siti Aminah',    'P', '1995-02-02', '081234567802', 'Jl. Asia Afrika No. 5, Bandung'),
  ('3273030303880003', 'Agus Wijaya',    'L', '1988-03-03', '081234567803', 'Jl. Braga No. 21, Bandung'),
  ('3273040404000004', 'Dewi Lestari',   'P', '2000-04-04', '081234567804', 'Jl. Dago No. 88, Bandung');

-- ---------------------------------------------------------------------
-- Visit 1 (COMPLETED): full chain
--   registration(selesai) -> queue(A001, selesai)
--   -> medical_record -> medical_action -> prescription -> 2 items
-- Data-modifying CTEs chain the generated IDs together.
-- ---------------------------------------------------------------------
WITH reg AS (
    INSERT INTO registrations (patient_id, doctor_id, poli_id, jenis_pembayaran, keluhan_awal, status, created_by)
    VALUES (
        (SELECT id FROM patients WHERE nik = '3273010101900001'),
        (SELECT id FROM doctors  WHERE nama = 'dr. Andini Pratama'),
        (SELECT id FROM poli     WHERE kode = 'A'),
        'umum', 'Demam dan batuk sejak 3 hari', 'selesai',
        (SELECT id FROM users    WHERE email = 'petugas@clinic.com')
    )
    RETURNING id, patient_id, doctor_id, poli_id
),
q AS (
    INSERT INTO queues (registration_id, poli_id, queue_number, queue_date, status, called_at)
    SELECT id, poli_id, 'A001', CURRENT_DATE, 'selesai', NOW() FROM reg
),
mr AS (
    INSERT INTO medical_records
        (registration_id, patient_id, doctor_id, keluhan, tekanan_darah, suhu_tubuh, berat_badan, tinggi_badan, diagnosa, rencana_terapi)
    SELECT id, patient_id, doctor_id,
           'Demam, batuk berdahak, badan pegal', '120/80', 37.8, 60.5, 168.0,
           'ISPA (Infeksi Saluran Pernapasan Akut)',
           'Istirahat cukup, perbanyak minum air putih, kontrol bila tidak membaik dalam 3 hari'
    FROM reg
    RETURNING id
),
act AS (
    INSERT INTO medical_actions (medical_record_id, nama_tindakan, biaya, keterangan)
    SELECT id, 'Pemeriksaan Fisik Umum', 25000, 'Pemeriksaan tanda-tanda vital' FROM mr
),
presc AS (
    INSERT INTO prescriptions (medical_record_id, catatan)
    SELECT id, 'Antibiotik dihabiskan sampai selesai' FROM mr
    RETURNING id
)
INSERT INTO prescription_items (prescription_id, medication_id, nama_obat, dosis, jumlah, aturan_pakai)
SELECT presc.id, m.id, m.nama_obat, x.dosis, x.jumlah, x.aturan
FROM presc
CROSS JOIN (VALUES
    ('Paracetamol 500mg', '500mg', 10, '3x1 sehari sesudah makan'),
    ('Amoxicillin 500mg', '500mg', 15, '3x1 sehari sebelum makan')
) AS x(nama, dosis, jumlah, aturan)
JOIN medications m ON m.nama_obat = x.nama;

-- ---------------------------------------------------------------------
-- Visit 2 (WAITING): registration(menunggu) -> queue(A002, menunggu)
-- ---------------------------------------------------------------------
WITH reg AS (
    INSERT INTO registrations (patient_id, doctor_id, poli_id, jenis_pembayaran, keluhan_awal, status, created_by)
    VALUES (
        (SELECT id FROM patients WHERE nik = '3273020202950002'),
        (SELECT id FROM doctors  WHERE nama = 'dr. Andini Pratama'),
        (SELECT id FROM poli     WHERE kode = 'A'),
        'bpjs', 'Sakit kepala dan pusing', 'menunggu',
        (SELECT id FROM users    WHERE email = 'petugas@clinic.com')
    )
    RETURNING id, poli_id
)
INSERT INTO queues (registration_id, poli_id, queue_number, queue_date, status)
SELECT id, poli_id, 'A002', CURRENT_DATE, 'menunggu' FROM reg;

-- ---------------------------------------------------------------------
-- Visit 3 (CHECK IN): Poli Gigi -> queue(B001, menunggu)
-- ---------------------------------------------------------------------
WITH reg AS (
    INSERT INTO registrations (patient_id, doctor_id, poli_id, jenis_pembayaran, keluhan_awal, status, created_by)
    VALUES (
        (SELECT id FROM patients WHERE nik = '3273030303880003'),
        (SELECT id FROM doctors  WHERE nama = 'drg. Bima Saputra'),
        (SELECT id FROM poli     WHERE kode = 'B'),
        'umum', 'Sakit gigi geraham bawah', 'check_in',
        (SELECT id FROM users    WHERE email = 'petugas@clinic.com')
    )
    RETURNING id, poli_id
)
INSERT INTO queues (registration_id, poli_id, queue_number, queue_date, status)
SELECT id, poli_id, 'B001', CURRENT_DATE, 'menunggu' FROM reg;

-- =====================================================================
-- Quick verification (optional): row counts
-- =====================================================================
-- SELECT 'users' t, COUNT(*) FROM users
-- UNION ALL SELECT 'patients', COUNT(*) FROM patients
-- UNION ALL SELECT 'registrations', COUNT(*) FROM registrations
-- UNION ALL SELECT 'queues', COUNT(*) FROM queues
-- UNION ALL SELECT 'medical_records', COUNT(*) FROM medical_records
-- UNION ALL SELECT 'prescription_items', COUNT(*) FROM prescription_items;
