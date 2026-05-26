import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import CarsPage from './pages/admin/CarsPage';
import ParametersPage from './pages/admin/ParametersPage';
import ClassesPage from './pages/admin/ClassesPage';
import EnumsPage from './pages/admin/EnumsPage';
import ClassDetailPage from './pages/admin/ClassDetailPage';
import CarDetailPage from './pages/admin/CarDetailPage';
import CatalogPage from './pages/user/CatalogPage';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/catalog" />;
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="cars" element={<CarsPage />} />
        <Route path="cars/:id" element={<CarDetailPage />} />
        <Route path="parameters" element={<ParametersPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="classes/:id" element={<ClassDetailPage />} />
        <Route path="enums" element={<EnumsPage />} />
      </Route>
      <Route
        path="/catalog"
        element={
          <ProtectedRoute>
            <UserLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CatalogPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default App;