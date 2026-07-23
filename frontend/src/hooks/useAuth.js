import { useContext } from 'react'; import { AuthContext } from '../contexts/AuthContext.jsx';
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider'); return value; }
