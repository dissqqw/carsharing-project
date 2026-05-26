import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnumerations } from '../../api/client';
import AddEnumModal from '../../components/AddEnumModal';
import DeleteEnumModal from '../../components/DeleteEnumModal';

const EnumsPage = () => {
  const [enums, setEnums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hoverAdd, setHoverAdd] = useState(false);
  const navigate = useNavigate();
  const [addEnumOpen, setAddEnumOpen] = useState(false);
  const [editEnum, setEditEnum] = useState(null);
  const [deleteEnum, setDeleteEnum] = useState(null);

  const loadData = async () => {
    const data = await getEnumerations();
    setEnums(data.enumerations);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    if (!search) return enums;
    return enums.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
  }, [enums, search]);

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

  const typeLabels = { string: 'Строковый', numeric: 'Числовой' };

  if (loading) return null;

  return (
    <div style={{ fontFamily: '"Inter Tight", sans-serif', marginTop: 40 }}>
      <h2 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>Справочники</h2>
      <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', margin: '0 0 40px 0' }}>
        Управление перечислениями для характеристик автомобилей. Создание, редактирование и наполнение значениями
      </p>

      <div style={{ display: 'flex', gap: 20, marginBottom: 30 }}>
        <div style={{ position: 'relative', width: 300 }}>
          <input placeholder="Поиск" value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 40, background: '#FFFFFF', border: '1px solid rgba(28, 28, 25, 0.5)', borderRadius: 10, padding: '0 15px 0 45px', fontSize: 18, fontFamily: '"Inter Tight", sans-serif', color: '#1C1C19', outline: 'none', boxSizing: 'border-box' }} />
          <svg width="20" height="20" viewBox="0 0 26 26" fill="none" style={{ position: 'absolute', left: 14, top: 10 }}>
            <circle cx="11" cy="11" r="7" stroke="#1C1C19" strokeWidth="2"/><path d="M16.5 16.5L22 22" stroke="#1C1C19" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <div style={{ flex: 1 }} />

        <button onClick={() => setAddEnumOpen(true)} onMouseEnter={() => setHoverAdd(true)} onMouseLeave={() => setHoverAdd(false)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', height: 40, background: hoverAdd ? '#1C1C19' : '#FFFFFF', border: `1px solid ${hoverAdd ? '#1C1C19' : 'rgba(28, 28, 25, 0.5)'}`, borderRadius: 10, cursor: 'pointer', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', color: hoverAdd ? '#FFFFFF' : '#1C1C19', transition: 'all 0.2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="11" y="0" width="2" height="24" fill={hoverAdd ? '#FFFFFF' : '#1C1C19'}/><rect x="0" y="11" width="24" height="2" fill={hoverAdd ? '#FFFFFF' : '#1C1C19'}/></svg>
          Создать справочник
        </button>
      </div>

      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 40, fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19' }}>
          {search ? 'Ничего не найдено' : 'Нет созданных справочников. Нажмите «Создать справочник», чтобы добавить первый'}
        </p>
      ) : (
        <div style={{ border: '1px solid #8D8D8B', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Название</th>
                <th style={thStyle}>Описание</th>
                <th style={{ ...thStyle, width: 200 }}>Тип значений</th>
                <th style={{ ...thStyle, width: 150 }}>Значений</th>
                <th style={{ ...thStyle, width: 160 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id_enum} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/enums/${e.id_enum}`)}>
                  <td style={tdStyle}>{highlightMatch(e.name, search)}</td>
                  <td style={tdStyle}>{e.description || '—'}</td>
                  <td style={tdStyle}>{typeLabels[e.value_type] || e.value_type}</td>
                  <td style={tdStyle}>{e.values?.length || 0}</td>
                  <td style={tdStyle} onClick={(ev) => ev.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 30 }}>
                      <img src="/pencil.svg" alt="Редактировать" style={{ width: 22, height: 22, cursor: 'pointer' }} onClick={() => setEditEnum(e)} />
                      <img src="/delete.svg" alt="Удалить" style={{ width: 22, height: 22, cursor: 'pointer' }} onClick={() => setDeleteEnum(e)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddEnumModal open={addEnumOpen || !!editEnum} onClose={() => { setAddEnumOpen(false); setEditEnum(null); }} onSuccess={loadData} editData={editEnum} />
      <DeleteEnumModal open={!!deleteEnum} onClose={() => setDeleteEnum(null)} onSuccess={loadData} enumItem={deleteEnum} />
    </div>
  );
};

export default EnumsPage;