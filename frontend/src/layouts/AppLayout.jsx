import { useEffect, useState } from 'react'; import { Outlet } from 'react-router-dom'; import { Sidebar } from '../components/layout/Sidebar.jsx'; import { Header } from '../components/layout/Header.jsx';
export function AppLayout() {
  const [open,setOpen]=useState(false), [collapsed,setCollapsed]=useState(() => localStorage.getItem('habitus-sidebar') === 'collapsed');
  const [isMobile, setIsMobile] = useState(() => matchMedia('(max-width: 950px)').matches);
  useEffect(() => { const media = matchMedia('(max-width: 950px)'); const update = () => setIsMobile(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => { localStorage.setItem('habitus-sidebar', collapsed ? 'collapsed' : 'expanded'); }, [collapsed]);
  useEffect(() => { if (!isMobile) { setOpen(false); return undefined; } document.body.style.overflow = open ? 'hidden' : ''; const close = (event) => { if (event.key === 'Escape') setOpen(false); }; addEventListener('keydown', close); return () => { document.body.style.overflow = ''; removeEventListener('keydown', close); }; }, [open, isMobile]);
  return <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}><a className="skip-link" href="#main-content">Ir para o conteúdo</a><Sidebar open={open} onClose={()=>setOpen(false)} collapsed={collapsed} isMobile={isMobile}/><Header onMenu={()=>setOpen(true)} onCollapse={()=>setCollapsed(v=>!v)} collapsed={collapsed} menuOpen={open}/><main id="main-content" className="app-content" tabIndex="-1"><Outlet/></main></div>;
}
