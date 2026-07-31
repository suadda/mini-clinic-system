import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS, ROLE_LABELS } from '../lib/constants';

const ICONS = {
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  users: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z',
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  list: 'M4 6h16M4 12h16M4 18h16',
  stethoscope: 'M6 3v6a4 4 0 008 0V3M9 21a3 3 0 003-3v-3',
};

function Icon({ name }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8"
      viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name] || ICONS.grid} />
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV_ITEMS.filter((i) => i.roles.includes(user.role));
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col bg-slate-900 text-slate-300">
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-bold text-white">N</div>
          <div>
            <p className="text-sm font-semibold leading-tight text-white">Nexa Clinic</p>
            <p className="text-xs text-slate-400">Sistem Informasi</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {items.map((it) => (
            <NavLink key={it.to} to={it.to} end={it.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}>
              <Icon name={it.icon} />
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="mb-3 text-xs text-slate-400">{ROLE_LABELS[user.role]}</p>
          <button onClick={handleLogout} className="btn btn-secondary w-full">Keluar</button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden bg-slate-100">
        <div className="mx-auto max-w-6xl p-6 lg:p-8"><Outlet /></div>
      </main>
    </div>
  );
}
