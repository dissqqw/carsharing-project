import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTree, getCars, getParameters, getEnumerations, getCarValidation, getClassEnums, getCarDetails } from '../../api/client';
import AddClassModal from '../../components/AddClassModal';
import AddCarModal from '../../components/AddCarModal';
import AddParameterModal from '../../components/AddParameterModal';
import DeleteCarModal from '../../components/DeleteCarModal';

const cards = [
  { title: 'Классы автомобилей', icon: '/folder.svg', path: '/admin/classes', desc: 'Иерархическая структура моделей. Создание, редактирование и перемещение классов в дереве' },
  { title: 'Автомобили', icon: '/car.svg', path: '/admin/cars', desc: 'Реестр конкретных машин. Добавление экземпляров, заполнение характеристик, удаление записей' },
  { title: 'Параметры', icon: '/settings.svg', path: '/admin/parameters', desc: 'Гибкие характеристики изделий. Создание параметров, настройка ограничений и группировка в агрегаты' },
  { title: 'Справочники', icon: '/book.svg', path: '/admin/enums', desc: 'Перечисления для характеристик. Цвета, типы топлива, КПП и другие списки значений' },
];

const quickActions = [
  { label: 'Добавить класс', icon: '/plus.svg', modal: 'class' },
  { label: 'Добавить автомобиль', icon: '/plus.svg', modal: 'car' },
  { label: 'Создать параметр', icon: '/plus.svg', modal: 'parameter' },
];

const DashboardPage = () => {
  const [counts, setCounts] = useState({ classes: 0, cars: 0, parameters: 0, enumerations: 0 });
  const [drafts, setDrafts] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredAction, setHoveredAction] = useState(null);
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [addCarOpen, setAddCarOpen] = useState(false);
  const [addParameterOpen, setAddParameterOpen] = useState(false);
  const [deleteCarOpen, setDeleteCarOpen] = useState(null);
  const navigate = useNavigate();

  const loadData = async () => {
    const tree = await getTree();
    const cars = await getCars();
    const params = await getParameters();
    const enums = await getEnumerations();
    const countTree = (node) => 1 + (node.children ? node.children.reduce((s, c) => s + countTree(c), 0) : 0);
    setCounts({
      classes: tree.tree.reduce((s, r) => s + countTree(r), 0),
      cars: cars.cars.length,
      parameters: params.parameters.length,
      enumerations: enums.enumerations.length,
    });

    const draftList = [];
    for (const car of cars.cars) {
      try {
        const [validation, details, classEnums] = await Promise.all([
          getCarValidation(car.id_car),
          getCarDetails(car.id_car),
          getClassEnums(car.id_class),
        ]);

        const missing = [];

        if (validation.status === 'invalid') {
          validation.missing_required.forEach((code) => {
            const p = params.parameters.find((pp) => pp.code === code);
            if (p) missing.push(p.name);
          });
        }

        if (classEnums && classEnums.enums) {
          classEnums.enums.forEach((enm) => {
            if (enm.is_required) {
              const hasValue = details.enum_attributes?.some((a) => a.id_enum === enm.id_enum);
              if (!hasValue) missing.push(enm.name);
            }
          });
        }

        if (missing.length > 0) {
          draftList.push({
            id: car.id_car,
            name: car.short_name,
            className: car.name,
            missing: missing.join(', '),
            carData: car,
          });
        }
      } catch (e) {}
    }
    setDrafts(draftList);
  };

  useEffect(() => { loadData(); }, []);

  const countValues = [counts.classes, counts.cars, counts.parameters, counts.enumerations];

  return (
    <div style={{ fontFamily: '"Inter Tight", sans-serif', marginTop: 40 }}>
      <h2 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>
        Управление системой
      </h2>
      <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', margin: '0 0 20px 0' }}>
        Выберите раздел для работы со справочником
      </p>

      <div style={{ display: 'flex', gap: 39, marginBottom: 100 }}>
        {cards.map((card, i) => {
          const isHovered = hoveredCard === i;
          return (
            <div key={card.path} onClick={() => navigate(card.path)} onMouseEnter={() => setHoveredCard(i)} onMouseLeave={() => setHoveredCard(null)} style={{
              width: 425, background: isHovered ? '#1C1C19' : '#FFFFFF',
              border: `1px solid ${isHovered ? '#1C1C19' : 'rgba(28, 28, 25, 0.5)'}`,
              borderRadius: 10, padding: '20px', cursor: 'pointer', boxSizing: 'border-box', transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 500, fontSize: 20, lineHeight: '22px', color: isHovered ? '#FFFFFF' : '#1C1C19', transition: 'color 0.2s' }}>{card.title}</span>
                  <span style={{ fontWeight: 500, fontSize: 20, lineHeight: '22px', color: isHovered ? 'rgba(255,255,255,0.5)' : '#1C1C19', opacity: isHovered ? 1 : 0.5, transition: 'all 0.2s' }}>({countValues[i]})</span>
                </div>
                <img src={card.icon} alt="" style={{ width: 26, height: 22, filter: isHovered ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.2s' }} />
              </div>
              <p style={{ fontWeight: 400, fontSize: 16, lineHeight: '20px', color: isHovered ? '#FFFFFF' : '#1C1C19', margin: 0, maxWidth: 250, transition: 'color 0.2s', opacity: isHovered ? 1 : 0.7 }}>{card.desc}</p>
            </div>
          );
        })}
      </div>

      <h2 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>Быстрые действия</h2>
      <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', margin: '0 0 24px 0' }}>Наиболее частые операции — доступны в один клик с главной страницы</p>

      <div style={{ display: 'flex', gap: 20, marginBottom: 100 }}>
        {quickActions.map((action, i) => {
          const isHovered = hoveredAction === i;
          return (
            <button key={action.label} onMouseEnter={() => setHoveredAction(i)} onMouseLeave={() => setHoveredAction(null)} onClick={() => {
              if (action.modal === 'class') setAddClassOpen(true);
              if (action.modal === 'car') setAddCarOpen(true);
              if (action.modal === 'parameter') setAddParameterOpen(true);
            }} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', height: 40,
              background: isHovered ? '#1C1C19' : '#FFFFFF',
              border: `1px solid ${isHovered ? '#1C1C19' : 'rgba(28, 28, 25, 0.5)'}`,
              borderRadius: 10, cursor: 'pointer',
              fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px',
              color: isHovered ? '#FFFFFF' : '#1C1C19', transition: 'all 0.2s',
            }}>
              <img src={action.icon} alt="" style={{ width: 20, height: 20, filter: isHovered ? 'brightness(0) invert(1)' : 'none', transition: 'filter 0.2s' }} />
              {action.label}
            </button>
          );
        })}
      </div>

      <h2 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>Черновики</h2>
      <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', margin: '0 0 24px 0' }}>Автомобили с незаполненными характеристиками</p>

      <div style={{ border: '1px solid #8D8D8B', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ fontWeight: 600, fontSize: 18, lineHeight: '20px', color: '#1C1C19', textAlign: 'left', padding: '14px 20px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif', width: 120 }}>ID</th>
              <th style={{ fontWeight: 600, fontSize: 18, lineHeight: '20px', color: '#1C1C19', textAlign: 'left', padding: '14px 20px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif' }}>Модель</th>
              <th style={{ fontWeight: 600, fontSize: 18, lineHeight: '20px', color: '#1C1C19', textAlign: 'left', padding: '14px 20px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif' }}>Класс</th>
              <th style={{ fontWeight: 600, fontSize: 18, lineHeight: '20px', color: '#1C1C19', textAlign: 'left', padding: '14px 20px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif' }}>Незаполненные характеристики</th>
              <th style={{ fontWeight: 600, fontSize: 18, lineHeight: '20px', color: '#1C1C19', textAlign: 'left', padding: '14px 20px', background: '#FFFFFF', borderBottom: '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif', width: 160 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {drafts.length === 0 ? null : drafts.map((draft, i) => (
              <tr key={draft.id}>
                <td style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', padding: '14px 20px', background: '#FFFFFF', borderBottom: i === drafts.length - 1 ? 'none' : '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif' }}>{draft.id}</td>
                <td style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', padding: '14px 20px', background: '#FFFFFF', borderBottom: i === drafts.length - 1 ? 'none' : '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif' }}>{draft.name}</td>
                <td style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', padding: '14px 20px', background: '#FFFFFF', borderBottom: i === drafts.length - 1 ? 'none' : '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif' }}>{draft.className}</td>
                <td style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', padding: '14px 20px', background: '#FFFFFF', borderBottom: i === drafts.length - 1 ? 'none' : '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif' }}>{draft.missing}</td>
                <td style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', padding: '14px 20px', background: '#FFFFFF', borderBottom: i === drafts.length - 1 ? 'none' : '1px solid #8D8D8B', fontFamily: '"Inter Tight", sans-serif' }}>
                  <div style={{ display: 'flex', gap: 30 }}>
                    <img src="/pencil.svg" alt="Редактировать" style={{ width: 22, height: 22, cursor: 'pointer' }} onClick={() => navigate(`/admin/cars/${draft.id}`)} />
                    <img src="/delete.svg" alt="Удалить" style={{ width: 22, height: 22, cursor: 'pointer' }} onClick={() => setDeleteCarOpen(draft.carData)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {drafts.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 16 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M1 5L4.5 8.5L11 1.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', fontFamily: '"Inter Tight", sans-serif' }}>Все автомобили заполнены корректно</span>
        </div>
      )}

      <AddClassModal open={addClassOpen} onClose={() => setAddClassOpen(false)} onSuccess={loadData} />
      <AddCarModal open={addCarOpen} onClose={() => setAddCarOpen(false)} onSuccess={loadData} />
      <AddParameterModal open={addParameterOpen} onClose={() => setAddParameterOpen(false)} onSuccess={loadData} />
      <DeleteCarModal open={!!deleteCarOpen} onClose={() => setDeleteCarOpen(null)} onSuccess={loadData} car={deleteCarOpen} />
    </div>
  );
};

export default DashboardPage;