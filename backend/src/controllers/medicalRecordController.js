const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// POST /medical-records
// body: { registration_id, keluhan, tekanan_darah, suhu_tubuh, berat_badan,
//         tinggi_badan, diagnosa, rencana_terapi, actions?[], prescription?{catatan, items[]} }
exports.create = asyncHandler(async (req, res) => {
  const {
    registration_id, keluhan, tekanan_darah, suhu_tubuh, berat_badan,
    tinggi_badan, diagnosa, rencana_terapi, actions, prescription,
  } = req.body;

  if (!registration_id)
    throw new ApiError(422, 'Validation Error', { registration_id: 'Registration wajib diisi' });

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const regRes = await client.query(
      'SELECT id, patient_id, doctor_id FROM registrations WHERE id = $1 FOR UPDATE', [registration_id]
    );
    const reg = regRes.rows[0];
    if (!reg) throw new ApiError(404, 'Pendaftaran tidak ditemukan');

    const dup = await client.query('SELECT id FROM medical_records WHERE registration_id = $1', [registration_id]);
    if (dup.rows[0]) throw new ApiError(409, 'Pemeriksaan untuk pendaftaran ini sudah ada');

    const mrRes = await client.query(
      `INSERT INTO medical_records
        (registration_id, patient_id, doctor_id, keluhan, tekanan_darah,
         suhu_tubuh, berat_badan, tinggi_badan, diagnosa, rencana_terapi)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [registration_id, reg.patient_id, reg.doctor_id, keluhan || null, tekanan_darah || null,
       suhu_tubuh || null, berat_badan || null, tinggi_badan || null, diagnosa || null, rencana_terapi || null]
    );
    const record = mrRes.rows[0];

    const savedActions = [];
    if (Array.isArray(actions)) {
      for (const a of actions) {
        if (!a.nama_tindakan) continue;
        const r = await client.query(
          `INSERT INTO medical_actions (medical_record_id, nama_tindakan, biaya, keterangan)
           VALUES ($1,$2,$3,$4) RETURNING *`,
          [record.id, a.nama_tindakan, a.biaya || 0, a.keterangan || null]
        );
        savedActions.push(r.rows[0]);
      }
    }

    let prescriptionData = null;
    if (prescription && Array.isArray(prescription.items) && prescription.items.length) {
      const pRes = await client.query(
        'INSERT INTO prescriptions (medical_record_id, catatan) VALUES ($1,$2) RETURNING *',
        [record.id, prescription.catatan || null]
      );
      const presc = pRes.rows[0];
      const items = [];
      for (const it of prescription.items) {
        if (!it.nama_obat) throw new ApiError(422, 'Validation Error', { 'prescription.items': 'nama_obat wajib diisi' });
        const r = await client.query(
          `INSERT INTO prescription_items
            (prescription_id, medication_id, nama_obat, dosis, jumlah, aturan_pakai)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
          [presc.id, it.medication_id || null, it.nama_obat, it.dosis || null, it.jumlah || 1, it.aturan_pakai || null]
        );
        items.push(r.rows[0]);
      }
      prescriptionData = { ...presc, items };
    }

    // Finishing the exam completes the visit and its queue.
    await client.query(`UPDATE registrations SET status = 'selesai' WHERE id = $1`, [registration_id]);
    await client.query(`UPDATE queues SET status = 'selesai' WHERE registration_id = $1`, [registration_id]);

    await client.query('COMMIT');
    res.sendSuccess(
      { ...record, actions: savedActions, prescription: prescriptionData },
      'Pemeriksaan berhasil disimpan', 201
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// GET /medical-records/:patientId  -> examination history for a patient
exports.historyByPatient = asyncHandler(async (req, res) => {
  const patientId = req.params.patientId;
  const patRes = await db.query('SELECT * FROM patients WHERE id = $1', [patientId]);
  if (!patRes.rows[0]) throw new ApiError(404, 'Pasien tidak ditemukan');

  const { rows } = await db.query(
    `SELECT mr.*, d.nama AS dokter_nama, r.tanggal_kunjungan, pl.nama AS poli_nama
     FROM medical_records mr
     JOIN doctors d ON d.id = mr.doctor_id
     JOIN registrations r ON r.id = mr.registration_id
     JOIN poli pl ON pl.id = r.poli_id
     WHERE mr.patient_id = $1
     ORDER BY mr.created_at DESC`,
    [patientId]
  );

  for (const rec of rows) {
    const acts = await db.query('SELECT * FROM medical_actions WHERE medical_record_id = $1', [rec.id]);
    rec.actions = acts.rows;
    const presc = await db.query('SELECT * FROM prescriptions WHERE medical_record_id = $1', [rec.id]);
    if (presc.rows[0]) {
      const items = await db.query('SELECT * FROM prescription_items WHERE prescription_id = $1', [presc.rows[0].id]);
      rec.prescription = { ...presc.rows[0], items: items.rows };
    } else {
      rec.prescription = null;
    }
  }

  res.sendSuccess({ patient: patRes.rows[0], records: rows }, 'Success');
});
