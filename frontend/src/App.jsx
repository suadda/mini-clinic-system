import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import RegistrationsPage from './pages/RegistrationsPage';
import QueuePage from './pages/QueuePage';
import ExaminationPage from './pages/ExaminationPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/patients" element={<ProtectedRoute roles={['administrator', 'petugas']}><PatientsPage /></ProtectedRoute>} />
        <Route path="/registrations" element={<ProtectedRoute roles={['administrator', 'petugas']}><RegistrationsPage /></ProtectedRoute>} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/examination" element={<ProtectedRoute roles={['administrator', 'dokter']}><ExaminationPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
