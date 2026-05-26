import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCarDetails, getTree, setCarParameter, getClassEnums } from '../../api/client';

const CarDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [tree, setTree] = useState([]);
  const [classEnums, setClassEnums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const loadData = async () => {
    const [carData, treeData] = await Promise.all([getCarDetails(id), getTree()]);
    setCar(carData);
    setTree(treeData.tree);
    if (carData.id_class) {
      try {
        const enumsData = await getClassEnums(carData.id_class);
        setClassEnums(enumsData.enums || []);
      } catch (e) {}
    }
    const init = {};
    if (carData.enum_attributes) {
      carData.enum_attributes.forEach((a) => { init[`enum_${a.id_enum}`] = a.value_id; });
    }
    if (carData.flexible_parameters) {
      carData.flexible_parameters.forEach((p) => { init[`param_${p.id_param}`] = p.value || ''; });
    }
    setEditValues(init);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handleChange = (key, value) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const key of Object.keys(editValues)) {
        if (key.startsWith('param_')) {
          const id_param = Number(key.replace('param_', ''));
          const value = editValues[key];
          if (value !== '') {
            await setCarParameter(car.id_car, { id_param, value });
          }
        }
        if (key.startsWith('enum_')) {
          const id_enum = Number(key.replace('enum_', ''));
          const id_value = editValues[key];
          if (id_value) {
            await fetch(`http://127.0.0.1:5000/api/car/${car.id_car}/attribute`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id_enum, id_value }),
            });
          }
        }
      }
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !car) return null;

  const flatTree = (nodes) => {
    let result = [];
    for (const node of nodes) {
      result.push(node);
      if (node.children) result = result.concat(flatTree(node.children));
    }
    return result;
  };

  const allNodes = flatTree(tree);
  const classNode = allNodes.find((n) => n.id_class === car.id_class);

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

  return (
    <div style={{ fontFamily: '"Inter Tight", sans-serif', marginTop: 40 }}>
      <div onClick={() => navigate('/admin/cars')} style={{ cursor: 'pointer', color: '#1C1C19', fontSize: 16, lineHeight: '18px', marginBottom: 12 }}>
        ← Автомобили / {car.short_name}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 }}>
        <div>
          <h2 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 8px 0' }}>
            {car.short_name} — {classNode?.name || ''}
          </h2>
          <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', opacity: 0.5, margin: 0 }}>
            {car.class_path ? car.class_path.map((c) => c.name).join(' → ') : ''}
          </p>
        </div>
        <button onClick={handleSave} disabled={saving}
          onMouseEnter={(e) => { if (!saving) { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#1C1C19'; e.currentTarget.style.border = '1px solid rgba(28, 28, 25, 0.5)'; } }}
          onMouseLeave={(e) => { if (!saving) { e.currentTarget.style.background = '#1C1C19'; e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.border = 'none'; } }}
          style={{ padding: '10px 20px', height: 50, background: '#1C1C19', border: 'none', borderRadius: 10, color: '#FFFFFF', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', cursor: 'pointer', opacity: saving ? 0.7 : 1, transition: 'all 0.2s' }}>
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>
      </div>

      {classEnums.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontWeight: 600, fontSize: 20, lineHeight: '22px', color: '#1C1C19', margin: '0 0 16px 0' }}>Характеристики</h3>
          <div style={{ border: '1px solid #8D8D8B', borderRadius: 10, overflow: 'visible' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Характеристика</th>
                  <th style={{ ...thStyle, width: 400 }}>Значение</th>
                </tr>
              </thead>
              <tbody>
                {classEnums.map((enm) => {
                  const selectedValue = enm.values?.find((v) => v.id_value === editValues[`enum_${enm.id_enum}`]);
                  const isOpen = openDropdownId === enm.id_enum;
                  return (
                    <tr key={enm.id_enum}>
                      <td style={tdStyle}>{enm.name}</td>
                      <td style={{ ...tdStyle, position: 'relative' }}>
                        <div data-enum-id={enm.id_enum} onClick={() => setOpenDropdownId(isOpen ? null : enm.id_enum)}
                          style={{ ...fieldStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', height: 40, width: 360 }}>
                          <span style={{ color: selectedValue ? '#1C1C19' : '#707070' }}>{selectedValue ? selectedValue.value : 'Не выбрано'}</span>
                          <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                            <path d="M1 1L6 6L11 1" stroke="#707070" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {classEnums.length > 0 && openDropdownId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999 }} onClick={() => setOpenDropdownId(null)}>
          <div style={{
            position: 'absolute',
            top: document.querySelector(`[data-enum-id="${openDropdownId}"]`)?.getBoundingClientRect().bottom + window.scrollY + 4 || 300,
            left: document.querySelector(`[data-enum-id="${openDropdownId}"]`)?.getBoundingClientRect().left + window.scrollX || 300,
            width: 360, background: '#FFFFFF', border: '1px solid #8D8D8B', borderRadius: 10,
            maxHeight: 200, overflow: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }} onClick={(e) => e.stopPropagation()}>
            {(() => {
              const enm = classEnums.find((e) => e.id_enum === openDropdownId);
              if (!enm) return null;
              const currentVal = editValues[`enum_${enm.id_enum}`];
              return (
                <>
                  <div className={`dropdown-option ${currentVal === '' || currentVal === undefined ? 'dropdown-option--selected' : ''}`}
                    onClick={() => { handleChange(`enum_${enm.id_enum}`, ''); setOpenDropdownId(null); }}>
                    Не выбрано
                  </div>
                  {enm.values?.map((v) => (
                    <div key={v.id_value}
                      className={`dropdown-option ${currentVal === v.id_value ? 'dropdown-option--selected' : ''}`}
                      onClick={() => { handleChange(`enum_${enm.id_enum}`, v.id_value); setOpenDropdownId(null); }}>
                      {v.value}
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {car.flexible_parameters && car.flexible_parameters.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontWeight: 600, fontSize: 20, lineHeight: '22px', color: '#1C1C19', margin: '0 0 16px 0' }}>Гибкие параметры</h3>
          <div style={{ border: '1px solid #8D8D8B', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Параметр</th>
                  <th style={thStyle}>Значение</th>
                  <th style={thStyle}>Единица</th>
                </tr>
              </thead>
              <tbody>
                {car.flexible_parameters.map((p) => (
                  <tr key={p.id_param}>
                    <td style={tdStyle}>{p.name}</td>
                    <td style={tdStyle}>
                      <input type="text" value={editValues[`param_${p.id_param}`] || ''}
                        onChange={(e) => handleChange(`param_${p.id_param}`, e.target.value)} style={fieldStyle} />
                    </td>
                    <td style={tdStyle}>{p.unit?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarDetailPage;