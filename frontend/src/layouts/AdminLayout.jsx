import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AdminLayout = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#F4F5F0', fontFamily: '"Inter Tight", sans-serif', display: 'flex', flexDirection: 'column' }}>
      <Header />
        <div style={{ flex: 1, padding: '24px 50px 100px' }}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default AdminLayout;