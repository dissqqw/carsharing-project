import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Form, Input, Button, DatePicker, message } from 'antd';
import { UserOutlined, LockOutlined, CalendarOutlined } from '@ant-design/icons';

const ADMIN_KEY = 'drivehub-admin-2026';

const LoginPage = () => {
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = (values) => {
    setLoading(true);
    if (role === 'admin' && values.key !== ADMIN_KEY) {
      message.error('Неверный ключ доступа');
      setLoading(false);
      return;
    }
    const userData = {
      firstName: values.firstName,
      lastName: values.lastName,
      birthDate: values.birthDate?.format('DD.MM.YYYY'),
      role,
    };
    setTimeout(() => {
      login(userData);
      message.success('Вход выполнен');
      navigate(role === 'admin' ? '/admin' : '/catalog');
      setLoading(false);
    }, 500);
  };

  const fieldStyle = {
    width: 400,
    height: 50,
    background: '#FFFFFF',
    border: '1px solid rgba(28, 28, 25, 0.5)',
    borderRadius: 10,
  };

  const tabStyle = (isActive) => ({
    flex: 1,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    fontSize: 18,
    fontFamily: '"Inter Tight", sans-serif',
    fontWeight: 400,
    cursor: 'pointer',
    letterSpacing: '0.03em',
    color: isActive ? '#1C1C19' : '#707070',
    background: isActive ? '#FFFFFF' : 'transparent',
    transition: 'all 0.15s',
    margin: 5,
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F4F5F0',
      fontFamily: '"Inter Tight", sans-serif',
      position: 'relative',
    }}>
      <img src="/logo.svg" alt="DriveHub" style={{ position: 'absolute', top: 50, left: 50, width: 200, height: 49 }} />

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
      }}>
        <h2 style={{
          fontFamily: '"Inter Tight", sans-serif',
          fontWeight: 600,
          fontSize: 28,
          color: '#1C1C19',
          margin: '0 0 8px 0',
          textAlign: 'center',
        }}>
          Добро пожаловать в DRIVEHUB!
        </h2>

        <p style={{
          fontFamily: '"Inter Tight", sans-serif',
          fontWeight: 400,
          fontSize: 16,
          color: '#1C1C19',
          margin: '0 0 32px 0',
          textAlign: 'center',
        }}>
          Выберите роль для входа в систему
        </p>

        <div style={{
          display: 'flex',
          width: 400,
          height: 50,
          background: '#E1E1E1',
          borderRadius: 10,
          margin: '0 auto 20px',
        }}>
          <div onClick={() => setRole('user')} style={tabStyle(role === 'user')}>
            Клиент
          </div>
          <div onClick={() => setRole('admin')} style={tabStyle(role === 'admin')}>
            Администратор
          </div>
        </div>

        <Form layout="vertical" onFinish={onFinish} requiredMark="optional">
          <Form.Item
            name="firstName"
            rules={[
              { required: true, message: 'Введите имя' },
              { pattern: /^[a-zA-Zа-яА-ЯёЁ\s-]+$/, message: 'Только буквы, пробел и дефис' },
            ]}
            style={{ marginBottom: 20 }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#1C1C19', opacity: 0.4 }} />}
              placeholder="Имя *"
              style={{ ...fieldStyle, fontFamily: '"Inter Tight", sans-serif', fontSize: 14, color: '#1C1C19' }}
            />
          </Form.Item>

          <Form.Item
            name="lastName"
            rules={[
              { required: true, message: 'Введите фамилию' },
              { pattern: /^[a-zA-Zа-яА-ЯёЁ\s-]+$/, message: 'Только буквы, пробел и дефис' },
            ]}
            style={{ marginBottom: 20 }}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#1C1C19', opacity: 0.4 }} />}
              placeholder="Фамилия *"
              style={{ ...fieldStyle, fontFamily: '"Inter Tight", sans-serif', fontSize: 14, color: '#1C1C19' }}
            />
          </Form.Item>

          <Form.Item
            name="birthDate"
            rules={[{ required: true, message: 'Выберите дату рождения' }]}
            style={{ marginBottom: 20 }}
          >
            <DatePicker
              format="DD.MM.YYYY"
              placeholder="ДД.ММ.ГГГГ *"
              style={{ ...fieldStyle, fontFamily: '"Inter Tight", sans-serif', fontSize: 14, color: '#1C1C19' }}
              suffixIcon={<CalendarOutlined style={{ color: '#1C1C19', opacity: 0.4 }} />}
            />
          </Form.Item>

          {role === 'admin' && (
            <Form.Item
              name="key"
              rules={[{ required: true, message: 'Введите ключ доступа' }]}
              style={{ marginBottom: 40 }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#1C1C19', opacity: 0.4 }} />}
                placeholder="Ключ доступа *"
                style={{ ...fieldStyle, fontFamily: '"Inter Tight", sans-serif', fontSize: 14, color: '#1C1C19' }}
              />
            </Form.Item>
          )}

          {role === 'user' && <div style={{ marginBottom: 40 }} />}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                width: 400,
                height: 50,
                background: '#1C1C19',
                border: 'none',
                borderRadius: 10,
                fontSize: 16,
                fontFamily: '"Inter Tight", sans-serif',
                fontWeight: 500,
              }}
            >
              Войти
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default LoginPage;