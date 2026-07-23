import { Navigate, Outlet } from 'react-router-dom'; import { LoadingSpinner } from '../components/ui/LoadingSpinner.jsx'; import { useAuth } from '../hooks/useAuth.js';
export function AuthLayout() { const { user,isLoading }=useAuth(); if(isLoading) return <LoadingSpinner label="Restaurando sessão"/>; return user ? <Navigate to="/app/dashboard" replace/> : <Outlet/>; }
