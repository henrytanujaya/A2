import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut, BarChart3, Bell } from 'lucide-react';
import SakuraBackground from '../../components/SakuraBackground';
import axiosInstance from '../../api/axiosInstance';

export default function AdminLayout({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchNotificationCount = async () => {
    try {
      const res = await axiosInstance.get('/api/v1/orders/paged', {
        params: { tab: 'Waiting_Verification', page: 0, size: 1 }
      });
      if (res.data.success) {
        setNotificationCount(res.data.data.totalElements);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(() => {
      fetchNotificationCount();
    }, 5000); // 5 detik untuk Live Demo
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminUserData');
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    // setIsLoggedIn(false); // Jangan set global login ke false jika masih ingin customer tetap login
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', backgroundColor: '#0f0f15', color: '#fff' }}>
      <SakuraBackground />
      
      {/* Sidebar */}
      <aside style={{
        width: '250px',
        background: 'rgba(26, 26, 36, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(220, 20, 60, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        position: 'fixed',
        height: '100vh',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', gap: '10px' }}>
          <img src="/src/assets/logo.png" alt="Logo" style={{ width: '40px', height: '40px' }} />
          <h2 className="brand-font" style={{ fontSize: '1.2rem', margin: 0, color: '#dc143c' }}>ADMIN PANEL</h2>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', padding: '0 15px' }}>
          <Link 
            to="/admin" 
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px',
              borderRadius: '8px', textDecoration: 'none',
              background: isActive('/admin') ? 'rgba(220, 20, 60, 0.2)' : 'transparent',
              color: isActive('/admin') ? '#dc143c' : '#a0a0b0',
              border: isActive('/admin') ? '1px solid rgba(220, 20, 60, 0.5)' : '1px solid transparent',
              transition: 'all 0.3s ease'
            }}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link 
            to="/admin/stock" 
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px',
              borderRadius: '8px', textDecoration: 'none',
              background: isActive('/admin/stock') ? 'rgba(220, 20, 60, 0.2)' : 'transparent',
              color: isActive('/admin/stock') ? '#dc143c' : '#a0a0b0',
              border: isActive('/admin/stock') ? '1px solid rgba(220, 20, 60, 0.5)' : '1px solid transparent',
              transition: 'all 0.3s ease'
            }}
          >
            <Package size={20} />
            Kelola Stok
          </Link>
          <Link 
            to="/admin/orders" 
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px',
              borderRadius: '8px', textDecoration: 'none',
              background: isActive('/admin/orders') ? 'rgba(220, 20, 60, 0.2)' : 'transparent',
              color: isActive('/admin/orders') ? '#dc143c' : '#a0a0b0',
              border: isActive('/admin/orders') ? '1px solid rgba(220, 20, 60, 0.5)' : '1px solid transparent',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            <Package size={20} />
            <span style={{ flex: 1 }}>Pesanan</span>
            {notificationCount > 0 && !isActive('/admin/orders') && (
              <span style={{
                background: '#dc143c',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                padding: '2px 6px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Bell size={10} /> {notificationCount}
              </span>
            )}
          </Link>
          <Link 
            to="/admin/audit" 
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px',
              borderRadius: '8px', textDecoration: 'none',
              background: isActive('/admin/audit') ? 'rgba(220, 20, 60, 0.2)' : 'transparent',
              color: isActive('/admin/audit') ? '#dc143c' : '#a0a0b0',
              border: isActive('/admin/audit') ? '1px solid rgba(220, 20, 60, 0.5)' : '1px solid transparent',
              transition: 'all 0.3s ease'
            }}
          >
            <BarChart3 size={20} />
            Audit Penjualan
          </Link>
        </nav>

        <div style={{ padding: '0 15px' }}>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 15px',
              width: '100%', borderRadius: '8px', background: 'transparent',
              color: '#a0a0b0', border: '1px solid #333', cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)' }}
            onMouseOut={(e) => { e.currentTarget.style.color = '#a0a0b0'; e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      <main style={{
        flex: 1,
        marginLeft: '250px',
        padding: '30px',
        position: 'relative',
        zIndex: 10,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
        <div style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '30px', color: '#a0a0b0', fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} Kitsune Noir E-Commerce. All rights reserved.
        </div>
      </main>
    </div>
  );
}
