import { useState } from 'react';
import { createGroup } from '../api/client';

const CreateGroupModal = ({ open, onClose, onSuccess, classId, className }) => {
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Введите название группы'); return; }
    setLoading(true);
    setError('');
    try {
      await createGroup(classId, { name: name.trim(), sort_order: sortOrder ? Number(sortOrder) : 0 });
      onSuccess();
      onClose();
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Ошибка при создании группы');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    width: '100%', height: 50, background: '#FFFFFF',
    border: '1px solid rgba(28, 28, 25, 0.5)', borderRadius: 10,
    padding: '0 12px', fontSize: 18, fontFamily: '"Inter Tight", sans-serif',
    color: '#1C1C19', boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ width: 733, background: '#FFFFFF', borderRadius: 10, padding: '40px', position: 'relative', fontFamily: '"Inter Tight", sans-serif' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer' }} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="#1C1C19" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>

        <h3 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>Создать группу</h3>
        <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#707070', margin: '0 0 24px 0' }}>
          Новый агрегат для группировки параметров
        </p>

        <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <input placeholder="Название *" value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <input placeholder="Порядок" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={fieldStyle} />
          </div>
        </div>

        {error && <p style={{ color: '#E53935', fontSize: 16, margin: '0 0 16px 0', fontFamily: '"Inter Tight", sans-serif' }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', height: 50, background: '#1C1C19', border: 'none', borderRadius: 10, color: '#FFFFFF', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Создание...' : 'Создать'}
        </button>
      </div>
    </div>
  );
};

export default CreateGroupModal;