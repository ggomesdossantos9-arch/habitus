import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../src/contexts/AuthContext.jsx';
import { ThemeContext } from '../src/contexts/ThemeContext.jsx';
import { AppLayout } from '../src/layouts/AppLayout.jsx';
import { DashboardPage } from '../src/pages/dashboard/DashboardPage.jsx';
import '../src/styles.css';

const user = { id: 'qa-only', name: 'Usuário', email: 'usuario@exemplo.com', createdAt: '2026-06-23T12:00:00.000Z' };

createRoot(document.getElementById('root')).render(
  <MemoryRouter initialEntries={['/app/dashboard']}>
    <ThemeContext.Provider value={{ theme: 'light', toggle() {} }}>
      <AuthContext.Provider value={{ user, isLoading: false, async logout() {} }}>
        <Routes><Route path="/app" element={<AppLayout/>}><Route path="dashboard" element={<DashboardPage/>}/></Route></Routes>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  </MemoryRouter>,
);
