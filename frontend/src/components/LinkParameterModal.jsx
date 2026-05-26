import { useState, useEffect } from 'react';
import { linkParameterToClass, getParameters } from '../api/client';

const LinkParameterModal = ({ open, onClose, onSuccess, classId, className }) => {
  const [paramId, setParamId] = useState(null);
  const [isRequired, setIsRequired] = useState(false);
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [parameters, setParameters] = useState([]);
  const [paramDropdownOpen, setParamDropdownOpen] = useState(false);
  const [requiredDropdownOpen, setRequiredDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      getParameters().then((data) => setParameters(data.parameters)).catch(() => {});
      setParamId(null);
      setIsRequired(false);
      setMinValue('');
      setMaxValue('');
      setError('');
      setParamDropdownOpen(false);
      setRequiredDropdownOpen(false);
    }
  }, [open]);

  if (!open) return null;

  const selectedParam = parameters.find((p) => p.id_param === paramId);

  const handleSubmit = async () => {
    if (!paramId) { setError('Выберите параметр'); return; }
    setLoading(true);
    setError('');
    try {
      await linkParameterToClass(classId, {
        id_param: paramId,
        is_required: isRequired,
        min_value: minValue ? Number(minValue) : undefined,
        max_value: maxValue ? Number(maxValue) : undefined,
        sort_order: 1,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Ошибка при привязке параметра');
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

        <h3 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>Привязать параметр</h3>
        <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#707070', margin: '0 0 24px 0' }}>
          Добавление характеристики для класса «{className}»
        </p>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div onClick={() => { setParamDropdownOpen(!paramDropdownOpen); setRequiredDropdownOpen(false); }} style={{ ...fieldStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ color: selectedParam ? '#1C1C19' : '#707070' }}>{selectedParam ? selectedParam.name : 'Параметр *'}</span>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: paramDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="M1 1L6 6L11 1" stroke="#707070" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            {paramDropdownOpen && (
              <div style={{ position: 'absolute', top: 54, left: 0, right: 0, background: '#FFFFFF', border: '1px solid #8D8D8B', borderRadius: 10, maxHeight: 250, overflow: 'auto', zIndex: 10 }}>
                {parameters.map((p) => (
                  <div key={p.id_param} className={`dropdown-option ${paramId === p.id_param ? 'dropdown-option--selected' : ''}`}
                    onClick={() => { setParamId(p.id_param); setParamDropdownOpen(false); }}>
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <div onClick={() => { setRequiredDropdownOpen(!requiredDropdownOpen); setParamDropdownOpen(false); }} style={{ ...fieldStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ color: '#1C1C19' }}>{isRequired ? 'Обязательно' : 'Не обязательно'}</span>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: requiredDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="M1 1L6 6L11 1" stroke="#707070" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            {requiredDropdownOpen && (
              <div style={{ position: 'absolute', top: 54, left: 0, right: 0, background: '#FFFFFF', border: '1px solid #8D8D8B', borderRadius: 10, maxHeight: 250, overflow: 'auto', zIndex: 10 }}>
                <div className={`dropdown-option ${!isRequired ? 'dropdown-option--selected' : ''}`} onClick={() => { setIsRequired(false); setRequiredDropdownOpen(false); }}>Не обязательно</div>
                <div className={`dropdown-option ${isRequired ? 'dropdown-option--selected' : ''}`} onClick={() => { setIsRequired(true); setRequiredDropdownOpen(false); }}>Обязательно</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <input placeholder="Минимальное значение" value={minValue} onChange={(e) => setMinValue(e.target.value)} style={fieldStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <input placeholder="Максимальное значение" value={maxValue} onChange={(e) => setMaxValue(e.target.value)} style={fieldStyle} />
          </div>
        </div>

        {error && <p style={{ color: '#E53935', fontSize: 16, margin: '0 0 16px 0', fontFamily: '"Inter Tight", sans-serif' }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', height: 50, background: '#1C1C19', border: 'none', borderRadius: 10, color: '#FFFFFF', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Привязка...' : 'Привязать'}
        </button>
      </div>
    </div>
  );
};

export default LinkParameterModal;