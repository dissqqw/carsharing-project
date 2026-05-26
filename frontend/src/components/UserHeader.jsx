import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const UserHeader = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [hoverLogout, setHoverLogout] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const topRowHeight = 50;

  return (
    <div style={{
      background: '#FFFFFF',
      fontFamily: '"Inter Tight", sans-serif',
      padding: '20px 50px 20px',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      minHeight: 120,
    }}>
      {/* Левая группа: аватарка, роль и имя */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <div style={{
          width: topRowHeight,
          height: topRowHeight,
          borderRadius: 10,
          background: '#D9D9D9',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <img src="/profile.svg" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ marginLeft: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 18, lineHeight: '18px', color: '#1C1C19', marginBottom: 10 }}>
            Пользователь
          </div>
          <div style={{ fontWeight: 400, fontSize: 16, lineHeight: '16px', color: '#1C1C19', opacity: 0.5 }}>
            {user?.firstName} {user?.lastName}
          </div>
        </div>
      </div>

      {/* Центральная группа: логотип и меню */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
        <img src="/logo-small.svg" alt="DriveHub" style={{ width: 140, height: 29, marginBottom: 20 }} />
        <div style={{ display: 'flex', gap: 40 }}>
          <div
            onClick={() => navigate('/catalog')}
            style={{
              fontWeight: 400, fontSize: 16, color: '#1C1C19', cursor: 'pointer',
              paddingBottom: 4,
              borderBottom: '2px solid #1C1C19',
            }}
          >
            Каталог
          </div>
        </div>
      </div>

      {/* Правая группа: кнопка выйти */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
        <button
          onClick={handleLogout}
          onMouseEnter={() => setHoverLogout(true)}
          onMouseLeave={() => setHoverLogout(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '10px', height: 40,
            background: hoverLogout ? '#FFFFFF' : '#1C1C19',
            border: `1px solid ${hoverLogout ? 'rgba(28, 28, 25, 0.5)' : '#1C1C19'}`,
            borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <img src="/exit.svg" alt="Exit" style={{ width: 15, height: 14, filter: hoverLogout ? 'brightness(0)' : 'none', transition: 'filter 0.2s' }} />
          <span style={{ fontWeight: 400, fontSize: 16, lineHeight: '18px', color: hoverLogout ? '#1C1C19' : '#FFFFFF' }}>Выйти</span>
        </button>
      </div>
    </div>
  );
};

export default UserHeader;