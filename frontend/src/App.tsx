import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { AuthPage } from './pages/Auth/AuthPage';
import { HomePage } from './pages/Home/HomePage';
import { GeneratePage } from './pages/Generate/GeneratePage';
import { DebatePage } from './pages/Debate/DebatePage';
import { SessionsPage } from './pages/Sessions/SessionsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { ToastProvider } from './components/common/Toast';

import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            {/* Debate is FULL SCREEN — no sidebar */}
            <Route path="/debate" element={<DebatePage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/generate" element={<GeneratePage />} />
              <Route path="/sessions" element={<SessionsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}
