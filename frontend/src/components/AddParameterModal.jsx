import { useState, useEffect } from 'react';
import { addParameter, updateParameter, getUnits, getEnumerations } from '../api/client';

const AddParameterModal = ({ open, onClose, onSuccess, editData }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [valueType, setValueType] = useState('');
  const [unitId, setUnitId] = useState(null);
  const [enumId, setEnumId] = useState(null);
  const [units, setUnits] = useState([]);
  const [enums, setEnums] = useState([]);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [enumDropdownOpen, setEnumDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!editData;

  const valueTypes = [
    { value: 'numeric', label: 'Числовой' },
    { value: 'integer', label: 'Целочисленный' },
    { value: 'string', label: 'Строковый' },
    { value: 'datetime', label: 'Дата' },
    { value: 'enum', label: 'Перечисление' },
  ];

  useEffect(() => {
    if (open) {
      getUnits().then((data) => setUnits(data.units)).catch(() => {});
      getEnumerations().then((data) => setEnums(data.enumerations)).catch(() => {});
      if (editData) {
        setCode(editData.code);
        setName(editData.name);
        setDescription(editData.description || '');
        setValueType(editData.value_type);
        setUnitId(editData.unit?.id_ei || null);
        setEnumId(editData.enumeration?.id_enum || null);
      } else {
        setCode('');
        setName('');
        setDescription('');
        setValueType('');
        setUnitId(null);
        setEnumId(null);
      }
      setError('');
      setUnitDropdownOpen(false);
      setEnumDropdownOpen(false);
      setTypeDropdownOpen(false);
    }
  }, [open, editData]);

  if (!open) return null;

  const selectedType = valueTypes.find((t) => t.value === valueType);
  const selectedUnit = units.find((u) => u.id_ei === unitId);
  const selectedEnum = enums.find((e) => e.id_enum === enumId);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Введите название'); return; }
    if (!valueType) { setError('Выберите тип значения'); return; }
    if (valueType === 'enum' && !enumId) { setError('Выберите справочник'); return; }
    setLoading(true);
    setError('');
    try {
      const data = { name: name.trim(), description: description.trim() || undefined };
      if (isEdit) {
        await updateParameter(editData.id_param, data);
      } else {
        if (!code.trim()) { setError('Введите код'); setLoading(false); return; }
        await addParameter({
          code: code.trim(), name: name.trim(),
          description: description.trim() || undefined,
          value_type: valueType, unit_id: unitId,
          enum_id: valueType === 'enum' ? enumId : undefined,
        });
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
          {isEdit ? 'Редактировать параметр' : 'Создать параметр'}
        </h3>
        <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#707070', margin: '0 0 24px 0' }}>
          {isEdit ? 'Изменение названия и описания параметра. Код и тип значения не редактируются' : 'Новая характеристика для автомобилей. После создания параметр можно привязать к классу'}
        </p>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <input placeholder="Код *" value={code} onChange={(e) => setCode(e.target.value)} disabled={isEdit} style={fieldStyle(isEdit)} />
          </div>
          <div style={{ flex: 1 }}>
            <input placeholder="Название *" value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle(false)} />
          </div>
        </div>

        {!isEdit && (
          <>
            <div style={{ marginBottom: 20 }}>
              <input placeholder="Описание" value={description} onChange={(e) => setDescription(e.target.value)} style={fieldStyle(false)} />
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <div onClick={() => { setTypeDropdownOpen(!typeDropdownOpen); setUnitDropdownOpen(false); setEnumDropdownOpen(false); }}
                  style={{ ...fieldStyle(false), display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ color: selectedType ? '#1C1C19' : '#707070' }}>{selectedType ? selectedType.label : 'Тип значения *'}</span>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: typeDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                    <path d="M1 1L6 6L11 1" stroke="#707070" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                {typeDropdownOpen && (
                  <div style={{ position: 'absolute', top: 54, left: 0, right: 0, background: '#FFFFFF', border: '1px solid #8D8D8B', borderRadius: 10, maxHeight: 250, overflow: 'auto', zIndex: 10 }}>
                    {valueTypes.map((t) => (
                      <div key={t.value} className={`dropdown-option ${valueType === t.value ? 'dropdown-option--selected' : ''}`}
                        onClick={() => { setValueType(t.value); setTypeDropdownOpen(false); }}>{t.label}</div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div onClick={() => { setUnitDropdownOpen(!unitDropdownOpen); setTypeDropdownOpen(false); setEnumDropdownOpen(false); }}
                  style={{ ...fieldStyle(false), display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ color: selectedUnit ? '#1C1C19' : '#707070' }}>{selectedUnit ? selectedUnit.name : 'Единица измерения'}</span>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: unitDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                    <path d="M1 1L6 6L11 1" stroke="#707070" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                {unitDropdownOpen && (
                  <div style={{ position: 'absolute', top: 54, left: 0, right: 0, background: '#FFFFFF', border: '1px solid #8D8D8B', borderRadius: 10, maxHeight: 250, overflow: 'auto', zIndex: 10 }}>
                    <div className={`dropdown-option ${unitId === null ? 'dropdown-option--selected' : ''}`} onClick={() => { setUnitId(null); setUnitDropdownOpen(false); }}>Не выбрано</div>
                    {units.map((u) => (
                      <div key={u.id_ei} className={`dropdown-option ${unitId === u.id_ei ? 'dropdown-option--selected' : ''}`}
                        onClick={() => { setUnitId(u.id_ei); setUnitDropdownOpen(false); }}>{u.name}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {valueType === 'enum' && (
              <div style={{ marginBottom: 24, position: 'relative' }}>
                <div onClick={() => { setEnumDropdownOpen(!enumDropdownOpen); setTypeDropdownOpen(false); setUnitDropdownOpen(false); }}
                  style={{ ...fieldStyle(false), display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ color: selectedEnum ? '#1C1C19' : '#707070' }}>{selectedEnum ? selectedEnum.name : 'Справочник *'}</span>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: enumDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                    <path d="M1 1L6 6L11 1" stroke="#707070" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                {enumDropdownOpen && (
                  <div style={{ position: 'absolute', top: 54, left: 0, right: 0, background: '#FFFFFF', border: '1px solid #8D8D8B', borderRadius: 10, maxHeight: 250, overflow: 'auto', zIndex: 10 }}>
                    {enums.map((e) => (
                      <div key={e.id_enum} className={`dropdown-option ${enumId === e.id_enum ? 'dropdown-option--selected' : ''}`}
                        onClick={() => { setEnumId(e.id_enum); setEnumDropdownOpen(false); }}>{e.name}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {error && <p style={{ color: '#E53935', fontSize: 16, margin: '0 0 16px 0', fontFamily: '"Inter Tight", sans-serif' }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', height: 50, background: '#1C1C19', border: 'none', borderRadius: 10, color: '#FFFFFF', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать')}
        </button>
      </div>
    </div>
  );
};

export default AddParameterModal;