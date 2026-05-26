import { useState, useEffect, useMemo } from 'react';
import { getParameters, getUnits, getEnumerations } from '../../api/client';
import AddParameterModal from '../../components/AddParameterModal';
import DeleteParameterModal from '../../components/DeleteParameterModal';

const typeLabels = {
  numeric: 'Числовой',
  integer: 'Целочисленный',
  string: 'Строковый',
  datetime: 'Дата',
  enum: 'Перечисление',
};

const ParametersPage = () => {
  const [parameters, setParameters] = useState([]);
  const [units, setUnits] = useState([]);
  const [enums, setEnums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addParamOpen, setAddParamOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(null);
  const [hoverAdd, setHoverAdd] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [editParam, setEditParam] = useState(null);
  const [deleteParam, setDeleteParam] = useState(null);

  const typeOptions = [
    { value: 'numeric', label: 'Числовой' },
    { value: 'integer', label: 'Целочисленный' },
    { value: 'string', label: 'Строковый' },
    { value: 'datetime', label: 'Дата' },
    { value: 'enum', label: 'Перечисление' },
  ];

  const loadData = async () => {
    const [paramsData, unitsData, enumsData] = await Promise.all([getParameters(), getUnits(), getEnumerations()]);
    setParameters(paramsData.parameters);
    setUnits(unitsData.units);
    setEnums(enumsData.enumerations);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filteredParams = useMemo(() => {
    if (!search && !typeFilter) return parameters;
    return parameters.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || p.value_type === typeFilter;
      return matchSearch && matchType;
    });
  }, [parameters, search, typeFilter]);

  const selectedType = typeOptions.find((t) => t.value === typeFilter);

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ fontWeight: 600 }}>{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const thStyle = {
    fontWeight: 600, fontSize: 18, lineHeight: '20px', color: '#1C1C19', textAlign: 'left',
    padding: '14px 20px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B',
    fontFamily: '"Inter Tight", sans-serif',
  };

  const tdStyle = {
    fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19',
    padding: '14px 20px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B',
    fontFamily: '"Inter Tight", sans-serif',
  };

  const fieldStyle = {
    width: '100%', height: 40, background: '#FFFFFF',
    border: '1px solid rgba(28, 28, 25, 0.5)', borderRadius: 10,
    padding: '0 12px', fontSize: 18, fontFamily: '"Inter Tight", sans-serif',
    color: '#1C1C19', boxSizing: 'border-box', outline: 'none',
  };

  if (loading) return null;

  return (
    <div style={{ fontFamily: '"Inter Tight", sans-serif', marginTop: 40 }}>
      <h2 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>Параметры</h2>
      <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', margin: '0 0 40px 0' }}>
        Управление гибкими характеристиками автомобилей. Создание, редактирование и привязка к классам
      </p>

      <div style={{ display: 'flex', gap: 20, marginBottom: 30 }}>
        <div style={{ position: 'relative', width: 300 }}>
          <input placeholder="Поиск" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ ...fieldStyle, padding: '0 15px 0 45px' }} />
          <svg width="20" height="20" viewBox="0 0 26 26" fill="none" style={{ position: 'absolute', left: 14, top: 10 }}>
            <circle cx="11" cy="11" r="7" stroke="#1C1C19" strokeWidth="2"/><path d="M16.5 16.5L22 22" stroke="#1C1C19" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <div style={{ position: 'relative', width: 300 }}>
          <div onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
            style={{ ...fieldStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ color: selectedType ? '#1C1C19' : '#707070' }}>{selectedType ? selectedType.label : 'Тип значения'}</span>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: typeDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M1 1L6 6L11 1" stroke="#707070" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          {typeDropdownOpen && (
            <div style={{ position: 'absolute', top: 44, left: 0, right: 0, background: '#FFFFFF', border: '1px solid #8D8D8B', borderRadius: 10, maxHeight: 250, overflow: 'auto', zIndex: 10 }}>
              <div className={`dropdown-option ${typeFilter === null ? 'dropdown-option--selected' : ''}`}
                onClick={() => { setTypeFilter(null); setTypeDropdownOpen(false); }}>
                Все типы
              </div>
              {typeOptions.map((t) => (
                <div key={t.value}
                  className={`dropdown-option ${typeFilter === t.value ? 'dropdown-option--selected' : ''}`}
                  onClick={() => { setTypeFilter(t.value); setTypeDropdownOpen(false); }}>
                  {t.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <button onMouseEnter={() => setHoverAdd(true)} onMouseLeave={() => setHoverAdd(false)} onClick={() => setAddParamOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', height: 40, background: hoverAdd ? '#1C1C19' : '#FFFFFF', border: `1px solid ${hoverAdd ? '#1C1C19' : 'rgba(28, 28, 25, 0.5)'}`, borderRadius: 10, cursor: 'pointer', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', color: hoverAdd ? '#FFFFFF' : '#1C1C19', transition: 'all 0.2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="11" y="0" width="2" height="24" fill={hoverAdd ? '#FFFFFF' : '#1C1C19'}/><rect x="0" y="11" width="24" height="2" fill={hoverAdd ? '#FFFFFF' : '#1C1C19'}/></svg>
          Создать параметр
        </button>
      </div>

      {filteredParams.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 40, fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19' }}>
          {search || typeFilter ? 'Ничего не найдено' : 'Нет созданных параметров. Нажмите «Создать параметр», чтобы добавить первый'}
        </p>
      ) : (
        <div style={{ border: '1px solid #8D8D8B', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 200 }}>Код</th>
                <th style={thStyle}>Название</th>
                <th style={{ ...thStyle, width: 200 }}>Тип</th>
                <th style={{ ...thStyle, width: 200 }}>Единица</th>
                <th style={{ ...thStyle, width: 200 }}>Справочник</th>
                <th style={{ ...thStyle, width: 160 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredParams.map((p) => (
                <tr key={p.id_param}>
                  <td style={tdStyle}>{highlightMatch(p.code, search)}</td>
                  <td style={tdStyle}>{highlightMatch(p.name, search)}</td>
                  <td style={tdStyle}>{typeLabels[p.value_type] || p.value_type}</td>
                  <td style={tdStyle}>{p.unit?.name || '—'}</td>
                  <td style={tdStyle}>{p.enumeration?.name || '—'}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 30 }}>
                      <img src="/pencil.svg" alt="Редактировать" style={{ width: 22, height: 22, cursor: 'pointer' }} onClick={() => setEditParam(p)} />
                      <img src="/delete.svg" alt="Удалить" style={{ width: 22, height: 22, cursor: 'pointer' }} onClick={() => setDeleteParam(p)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddParameterModal open={addParamOpen || !!editParam} onClose={() => { setAddParamOpen(false); setEditParam(null); }} onSuccess={loadData} editData={editParam} />
      <DeleteParameterModal open={!!deleteParam} onClose={() => setDeleteParam(null)} onSuccess={loadData} parameter={deleteParam} />
    </div>
  );
};

export default ParametersPage;