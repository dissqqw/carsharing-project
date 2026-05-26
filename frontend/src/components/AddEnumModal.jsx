import { useState, useEffect } from 'react';
import { addEnumeration, updateEnumeration } from '../api/client';

const AddEnumModal = ({ open, onClose, onSuccess, editData }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [valueType, setValueType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const isEdit = !!editData;

  const typeOptions = [
    { value: 'string', label: 'Строковый' },
    { value: 'numeric', label: 'Числовой' },
  ];

  useEffect(() => {
    if (open) {
      if (editData) {
        setName(editData.name);
        setDescription(editData.description || '');
        setValueType(editData.value_type);
      } else {
        setName('');
        setDescription('');
        setValueType('');
      }
      setError('');
      setTypeDropdownOpen(false);
    }
  }, [open, editData]);

  if (!open) return null;

  const selectedType = typeOptions.find((t) => t.value === valueType);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Введите название'); return; }
    if (!valueType && !isEdit) { setError('Выберите тип значения'); return; }
    setLoading(true);
    setError('');
    try {
      const data = { name: name.trim(), description: description.trim() };
      if (isEdit) {
        await updateEnumeration(editData.id_enum, data);
      } else {
        await addEnumeration({ ...data, value_type: valueType });
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = (disabled) => ({
    width: '100%', height: 50, background: disabled ? '#F5F5F5' : '#FFFFFF',
    border: '1px solid rgba(28, 28, 25, 0.5)', borderRadius: 10,
    padding: '0 12px', fontSize: 18, fontFamily: '"Inter Tight", sans-serif',
    color: disabled ? '#707070' : '#1C1C19', boxSizing: 'border-box', outline: 'none',
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ width: 733, background: '#FFFFFF', borderRadius: 10, padding: '40px', position: 'relative', fontFamily: '"Inter Tight", sans-serif' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer' }} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="#1C1C19" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>

        <h3 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>
          {isEdit ? 'Редактировать справочник' : 'Создать справочник'}
        </h3>
        <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#707070', margin: '0 0 24px 0' }}>
          {isEdit ? 'Изменение названия и описания справочника' : 'Новое перечисление для характеристик автомобилей'}
        </p>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <input placeholder="Название *" value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle(false)} />
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <div onClick={() => !isEdit && setTypeDropdownOpen(!typeDropdownOpen)}
              style={{ ...fieldStyle(isEdit), display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: isEdit ? 'default' : 'pointer' }}>
              <span style={{ color: selectedType ? '#1C1C19' : '#707070' }}>{selectedType ? selectedType.label : 'Тип значения *'}</span>
              {!isEdit && (
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: typeDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M1 1L6 6L11 1" stroke="#707070" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            {typeDropdownOpen && !isEdit && (
              <div style={{ position: 'absolute', top: 54, left: 0, right: 0, background: '#FFFFFF', border: '1px solid #8D8D8B', borderRadius: 10, maxHeight: 250, overflow: 'auto', zIndex: 10 }}>
                {typeOptions.map((t) => (
                  <div key={t.value}
                    className={`dropdown-option ${valueType === t.value ? 'dropdown-option--selected' : ''}`}
                    onClick={() => { setValueType(t.value); setTypeDropdownOpen(false); }}>
                    {t.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <input placeholder="Описание" value={description} onChange={(e) => setDescription(e.target.value)} style={fieldStyle(false)} />
        </div>

        {error && <p style={{ color: '#E53935', fontSize: 16, margin: '0 0 16px 0', fontFamily: '"Inter Tight", sans-serif' }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', height: 50, background: '#1C1C19', border: 'none', borderRadius: 10, color: '#FFFFFF', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать')}
        </button>
      </div>
    </div>
  );
};

export default AddEnumModal;