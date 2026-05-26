import { useState, useEffect } from 'react';
import { updateEnumeration, getEnumerations } from '../api/client';

const EditEnumModal = ({ open, onClose, onSuccess, enumItem }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [values, setValues] = useState([]);
  const [newValue, setNewValue] = useState('');
  const [newOrder, setNewOrder] = useState('');
  const [newNumeric, setNewNumeric] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && enumItem) {
      setName(enumItem.name);
      setDescription(enumItem.description || '');
      setValues(enumItem.values || []);
      setNewValue('');
      setNewOrder('');
      setNewNumeric('');
      setError('');
    }
  }, [open, enumItem]);

  if (!open || !enumItem) return null;

  const handleSaveInfo = async () => {
    if (!name.trim()) { setError('Введите название'); return; }
    setLoading(true);
    setError('');
    try {
      await updateEnumeration(enumItem.id_enum, { name: name.trim(), description: description.trim() });
      onSuccess();
      onClose();
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const handleAddValue = async () => {
    if (!newValue.trim()) { setError('Введите значение'); return; }
    setLoading(true);
    setError('');
    try {
      await fetch(`http://127.0.0.1:5000/api/enumeration/${enumItem.id_enum}/value/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: newValue.trim(),
          sort_order: newOrder ? Number(newOrder) : 0,
          numeric_value: newNumeric ? Number(newNumeric) : undefined,
        }),
      });
      const data = await getEnumerations();
      const updated = data.enumerations.find((e) => e.id_enum === enumItem.id_enum);
      if (updated) {
        setValues(updated.values || []);
        onSuccess();
      }
      setNewValue('');
      setNewOrder('');
      setNewNumeric('');
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Ошибка при добавлении значения');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteValue = async (id_value) => {
    setLoading(true);
    setError('');
    try {
      await fetch(`http://127.0.0.1:5000/api/enum-value/${id_value}`, { method: 'DELETE' });
      setValues(values.filter((v) => v.id_value !== id_value));
      onSuccess();
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Ошибка при удалении значения');
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

  const smallFieldStyle = {
    ...fieldStyle, height: 40, fontSize: 16,
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ width: 900, maxHeight: '85vh', overflow: 'auto', background: '#FFFFFF', borderRadius: 10, padding: '40px', position: 'relative', fontFamily: '"Inter Tight", sans-serif' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer' }} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="#1C1C19" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>

        <h3 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 24px 0' }}>Редактировать справочник</h3>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 14, color: '#707070', marginBottom: 8, display: 'block' }}>Название</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 14, color: '#707070', marginBottom: 8, display: 'block' }}>Описание</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} style={fieldStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 14, color: '#707070', marginBottom: 8, display: 'block' }}>Тип значений</label>
            <input value={enumItem.value_type === 'numeric' ? 'Числовой' : 'Строковый'} disabled style={{ ...fieldStyle, opacity: 0.5, background: '#F5F5F5' }} />
          </div>
        </div>

        <button onClick={handleSaveInfo} disabled={loading}
          style={{ padding: '10px 20px', height: 40, background: '#1C1C19', border: 'none', borderRadius: 10, color: '#FFFFFF', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', cursor: 'pointer', marginBottom: 32 }}>
          Сохранить изменения
        </button>

        <h4 style={{ fontWeight: 600, fontSize: 20, lineHeight: '22px', color: '#1C1C19', margin: '0 0 16px 0' }}>Значения</h4>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: 14, color: '#707070', marginBottom: 8, display: 'block' }}>Значение</label>
            <input placeholder="Значение" value={newValue} onChange={(e) => setNewValue(e.target.value)} style={smallFieldStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 14, color: '#707070', marginBottom: 8, display: 'block' }}>Порядок</label>
            <input placeholder="Порядок" value={newOrder} onChange={(e) => setNewOrder(e.target.value)} style={smallFieldStyle} />
          </div>
          {enumItem.value_type === 'numeric' && (
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 14, color: '#707070', marginBottom: 8, display: 'block' }}>Числовое</label>
              <input placeholder="Числовое" value={newNumeric} onChange={(e) => setNewNumeric(e.target.value)} style={smallFieldStyle} />
            </div>
          )}
          <button onClick={handleAddValue} disabled={loading}
            style={{ height: 40, padding: '0 16px', background: '#1C1C19', border: 'none', borderRadius: 10, color: '#FFFFFF', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 16, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ＋ Добавить
          </button>
        </div>

        {values.length > 0 && (
          <div style={{ border: '1px solid #8D8D8B', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ fontWeight: 600, fontSize: 16, lineHeight: '18px', color: '#1C1C19', textAlign: 'left', padding: '10px 16px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif' }}>Значение</th>
                  <th style={{ fontWeight: 600, fontSize: 16, lineHeight: '18px', color: '#1C1C19', textAlign: 'left', padding: '10px 16px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif', width: 80 }}>Порядок</th>
                  {enumItem.value_type === 'numeric' && (
                    <th style={{ fontWeight: 600, fontSize: 16, lineHeight: '18px', color: '#1C1C19', textAlign: 'left', padding: '10px 16px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif', width: 120 }}>Числовое</th>
                  )}
                  <th style={{ fontWeight: 600, fontSize: 16, lineHeight: '18px', color: '#1C1C19', textAlign: 'left', padding: '10px 16px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif', width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {values.map((v) => (
                  <tr key={v.id_value}>
                    <td style={{ fontWeight: 400, fontSize: 16, lineHeight: '18px', color: '#1C1C19', padding: '8px 16px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif' }}>{v.value}</td>
                    <td style={{ fontWeight: 400, fontSize: 16, lineHeight: '18px', color: '#1C1C19', padding: '8px 16px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif' }}>{v.sort_order}</td>
                    {enumItem.value_type === 'numeric' && (
                      <td style={{ fontWeight: 400, fontSize: 16, lineHeight: '18px', color: '#1C1C19', padding: '8px 16px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif' }}>{v.numeric_value || '—'}</td>
                    )}
                    <td style={{ fontWeight: 400, fontSize: 16, lineHeight: '18px', color: '#1C1C19', padding: '8px 16px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif', textAlign: 'center' }}>
                      <span onClick={() => handleDeleteValue(v.id_value)} style={{ cursor: 'pointer', color: '#E60023', fontSize: 18 }}>✕</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && <p style={{ color: '#E53935', fontSize: 16, margin: '0 0 16px 0', fontFamily: '"Inter Tight", sans-serif' }}>{error}</p>}
      </div>
    </div>
  );
};

export default EditEnumModal;