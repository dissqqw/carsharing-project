import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCars, getTree } from '../../api/client';
import AddCarModal from '../../components/AddCarModal';
import DeleteCarModal from '../../components/DeleteCarModal';

const CarsPage = () => {
  const [cars, setCars] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addCarOpen, setAddCarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState(null);
  const [hoverAdd, setHoverAdd] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [editCar, setEditCar] = useState(null);
  const [deleteCarOpen, setDeleteCarOpen] = useState(null);
  const navigate = useNavigate();

  const loadData = async () => {
    const [carsData, treeData] = await Promise.all([getCars(), getTree()]);
    setCars(carsData.cars);
    setTree(treeData.tree);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const flatTree = (nodes, level = 0) => {
    let result = [];
    for (const node of nodes) {
      result.push({ ...node, level });
      if (node.children) result = result.concat(flatTree(node.children, level + 1));
    }
    return result;
  };

  const allClasses = flatTree(tree);
  const selectedClass = allClasses.find((c) => c.id_class === classFilter);

  const filteredCars = cars.filter((car) => {
    const matchSearch = !search || car.short_name.toLowerCase().includes(search.toLowerCase()) || car.name.toLowerCase().includes(search.toLowerCase());
    let matchClass = true;
    if (classFilter) {
      const getChildrenIds = (node) => {
        let ids = [node.id_class];
        if (node.children) for (const child of node.children) ids = ids.concat(getChildrenIds(child));
        return ids;
      };
      const selectedNode = allClasses.find((c) => c.id_class === classFilter);
      const allowedIds = selectedNode ? getChildrenIds(selectedNode) : [classFilter];
      matchClass = allowedIds.includes(car.id_class);
    }
    return matchSearch && matchClass;
  });

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
      <h2 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>Автомобили</h2>
      <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', margin: '0 0 40px 0' }}>
        Управление реестром автомобилей. Добавление, редактирование и удаление записей
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
          <div onClick={() => setClassDropdownOpen(!classDropdownOpen)}
            style={{ ...fieldStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ color: selectedClass ? '#1C1C19' : '#707070' }}>{selectedClass ? selectedClass.name : 'Все классы'}</span>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: classDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M1 1L6 6L11 1" stroke="#707070" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          {classDropdownOpen && (
            <div style={{ position: 'absolute', top: 44, left: 0, right: 0, background: '#FFFFFF', border: '1px solid #8D8D8B', borderRadius: 10, maxHeight: 250, overflow: 'auto', zIndex: 10 }}>
              <div className={`dropdown-option ${classFilter === null ? 'dropdown-option--selected' : ''}`}
                onClick={() => { setClassFilter(null); setClassDropdownOpen(false); }}>
                Все классы
              </div>
              {allClasses.map((c) => (
                <div key={c.id_class}
                  className={`dropdown-option ${classFilter === c.id_class ? 'dropdown-option--selected' : ''}`}
                  onClick={() => { setClassFilter(c.id_class); setClassDropdownOpen(false); }}
                  style={{ paddingLeft: 12 + c.level * 16 }}>
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <button onMouseEnter={() => setHoverAdd(true)} onMouseLeave={() => setHoverAdd(false)} onClick={() => setAddCarOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', height: 40, background: hoverAdd ? '#1C1C19' : '#FFFFFF', border: `1px solid ${hoverAdd ? '#1C1C19' : 'rgba(28, 28, 25, 0.5)'}`, borderRadius: 10, cursor: 'pointer', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', color: hoverAdd ? '#FFFFFF' : '#1C1C19', transition: 'all 0.2s' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="11" y="0" width="2" height="24" fill={hoverAdd ? '#FFFFFF' : '#1C1C19'}/><rect x="0" y="11" width="24" height="2" fill={hoverAdd ? '#FFFFFF' : '#1C1C19'}/></svg>
          Добавить автомобиль
        </button>
      </div>

      {filteredCars.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 40, fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19' }}>
          {search || classFilter ? 'Ничего не найдено' : 'Нет добавленных автомобилей. Нажмите «Добавить автомобиль», чтобы создать первый'}
        </p>
      ) : (
        <div style={{ border: '1px solid #8D8D8B', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Гос. номер</th>
                <th style={thStyle}>Модель</th>
                <th style={{ ...thStyle, width: 160 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredCars.map((car) => (
                <tr key={car.id_car}>
                  <td style={tdStyle}>{car.short_name}</td>
                  <td style={tdStyle}>{car.name}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 30 }}>
                      <img src="/pencil.svg" alt="Детали" style={{ width: 22, height: 22, cursor: 'pointer' }} onClick={() => navigate(`/admin/cars/${car.id_car}`)} />
                      <img src="/delete.svg" alt="Удалить" style={{ width: 22, height: 22, cursor: 'pointer' }} onClick={() => setDeleteCarOpen(car)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddCarModal open={addCarOpen || !!editCar} onClose={() => { setAddCarOpen(false); setEditCar(null); }} onSuccess={loadData} editData={editCar} />
      <DeleteCarModal open={!!deleteCarOpen} onClose={() => setDeleteCarOpen(null)} onSuccess={loadData} car={deleteCarOpen} />
    </div>
  );
};

export default CarsPage;