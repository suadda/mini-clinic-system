export const ROLE_LABELS = {
  administrator: 'Administrator',
  dokter: 'Dokter',
  petugas: 'Petugas Pendaftaran',
};

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', roles: ['administrator', 'dokter', 'petugas'], icon: 'grid' },
  { to: '/patients', label: 'Data Pasien', roles: ['administrator', 'petugas'], icon: 'users' },
  { to: '/registrations', label: 'Pendaftaran', roles: ['administrator', 'petugas'], icon: 'clipboard' },
  { to: '/queue', label: 'Antrean', roles: ['administrator', 'petugas', 'dokter'], icon: 'list' },
  { to: '/examination', label: 'Pemeriksaan', roles: ['administrator', 'dokter'], icon: 'stethoscope' },
];

export const REGISTRATION_STATUS = {
  menunggu: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700' },
  check_in: { label: 'Check In', cls: 'bg-blue-100 text-blue-700' },
  pemeriksaan: { label: 'Pemeriksaan', cls: 'bg-violet-100 text-violet-700' },
  selesai: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-700' },
};

export const QUEUE_STATUS = {
  menunggu: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700' },
  dipanggil: { label: 'Dipanggil', cls: 'bg-blue-100 text-blue-700' },
  dilayani: { label: 'Dilayani', cls: 'bg-violet-100 text-violet-700' },
  selesai: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-700' },
  dilewati: { label: 'Dilewati', cls: 'bg-slate-200 text-slate-600' },
};

export const PAYMENT_TYPES = [
  { value: 'umum', label: 'Umum' },
  { value: 'bpjs', label: 'BPJS' },
  { value: 'asuransi', label: 'Asuransi' },
];
