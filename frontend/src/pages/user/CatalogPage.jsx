import { useState, useEffect } from 'react';
import { getCars, getTree, getCarDetails } from '../../api/client';

const CatalogPage = () => {
  const [cars, setCars] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState(null);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [carDetails, setCarDetails] = useState(null);

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

  const handleCarClick = async (car) => {
    setSelectedCar(car);
    try {
      const details = await getCarDetails(car.id_car);
      setCarDetails(details);
    } catch (e) {
      setCarDetails(null);
    }
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
      <h2 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>Каталог автомобилей</h2>
      <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', margin: '0 0 40px 0' }}>
        Поиск и просмотр автомобилей каршеринга
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
                onClick={() => { setClassFilter(null); setClassDropdownOpen(false); }}>Все классы</div>
              {allClasses.map((c) => (
                <div key={c.id_class} className={`dropdown-option ${classFilter === c.id_class ? 'dropdown-option--selected' : ''}`}
                  onClick={() => { setClassFilter(c.id_class); setClassDropdownOpen(false); }}
                  style={{ paddingLeft: 12 + c.level * 16 }}>{c.name}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {filteredCars.map((car) => (
          <div key={car.id_car} onClick={() => handleCarClick(car)}
            style={{ width: 425, background: '#FFFFFF', border: '1px solid rgba(28, 28, 25, 0.5)', borderRadius: 10, padding: 20, cursor: 'pointer', boxSizing: 'border-box', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1C1C19'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#1C1C19'; }}>
            <div style={{ fontWeight: 500, fontSize: 20, lineHeight: '22px' }}>{car.short_name}</div>
            <div style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', opacity: 0.7, marginTop: 8 }}>{car.name}</div>
            {car.parameters && car.parameters.length > 0 && (
              <div style={{ fontWeight: 400, fontSize: 16, lineHeight: '18px', opacity: 0.5, marginTop: 12 }}>
                {car.parameters.length} характеристик
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedCar && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => { setSelectedCar(null); setCarDetails(null); }}>
          <div style={{ width: 800, maxHeight: '80vh', overflow: 'auto', background: '#FFFFFF', borderRadius: 10, padding: '40px', position: 'relative', fontFamily: '"Inter Tight", sans-serif' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer' }} onClick={() => { setSelectedCar(null); setCarDetails(null); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="#1C1C19" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <h3 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 8px 0' }}>
              {selectedCar.short_name} — {selectedCar.name}
            </h3>
            {carDetails && (
              <>
                {carDetails.class_path && (
                  <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', opacity: 0.5, margin: '0 0 20px 0' }}>
                    {carDetails.class_path.map((c) => c.name).join(' → ')}
                  </p>
                )}
                {carDetails.enum_attributes && carDetails.enum_attributes.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ fontWeight: 600, fontSize: 18, lineHeight: '20px', color: '#1C1C19', margin: '0 0 12px 0' }}>Характеристики</h4>
                    {carDetails.enum_attributes.map((a, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E3E3E3' }}>
                        <span style={{ fontWeight: 400, fontSize: 16, color: '#707070' }}>{a.enum_name}</span>
                        <span style={{ fontWeight: 400, fontSize: 16, color: '#1C1C19' }}>{a.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {carDetails.flexible_parameters && carDetails.flexible_parameters.length > 0 && (
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: 18, lineHeight: '20px', color: '#1C1C19', margin: '0 0 12px 0' }}>Параметры</h4>
                    {carDetails.flexible_parameters.map((p, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E3E3E3' }}>
                        <span style={{ fontWeight: 400, fontSize: 16, color: '#707070' }}>{p.name}{p.unit ? `, ${p.unit.name}` : ''}</span>
                        <span style={{ fontWeight: 400, fontSize: 16, color: '#1C1C19' }}>{p.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;