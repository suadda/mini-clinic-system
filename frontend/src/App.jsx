import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const Login = () => <div>Halaman Login</div>;
const Dashboard = () => <div>Dashboard</div>;
const MasterPasien = () => <div>Modul Master Data Pasien</div>;
const Pendaftaran = () => <div>Modul Pendaftaran Pasien</div>;
const Antrean = () => <div>Modul Antrean</div>;
const Pemeriksaan = () => <div>Modul Pemeriksaan Dokter (SOAP)</div>;

// Dummy Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = true; // TODO: Replace with JWT logic
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/pasien" element={<ProtectedRoute><MasterPasien /></ProtectedRoute>} />
                <Route path="/pendaftaran" element={<ProtectedRoute><Pendaftaran /></ProtectedRoute>} />
                <Route path="/antrean" element={<ProtectedRoute><Antrean /></ProtectedRoute>} />
                <Route path="/pemeriksaan" element={<ProtectedRoute><Pemeriksaan /></ProtectedRoute>} />
            </Routes>
        </Router>
    );
};

export default App;