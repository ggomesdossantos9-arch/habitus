import { useContext } from 'react'; import { ThemeContext } from '../contexts/ThemeContext.jsx';
export function useTheme() { return useContext(ThemeContext); }
