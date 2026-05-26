import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTree, getCars, getClassParametersGrouped, getUnits, getClassEnums } from '../../api/client';
import LinkParameterModal from '../../components/LinkParameterModal';
import CreateGroupModal from '../../components/CreateGroupModal';
import DeleteClassModal from '../../components/DeleteClassModal';
import MoveClassModal from '../../components/MoveClassModal';
import LinkEnumModal from '../../components/LinkEnumModal';

const typeLabels = {
  numeric: 'Числовой',
  integer: 'Целочисленный',
  string: 'Строковый',
  datetime: 'Дата',
  enum: 'Перечисление',
};

const ClassDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tree, setTree] = useState([]);
  const [cars, setCars] = useState([]);
  const [units, setUnits] = useState([]);
  const [grouped, setGrouped] = useState({ groups: [], ungrouped: [] });
  const [classEnums, setClassEnums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverMove, setHoverMove] = useState(false);
  const [hoverDelete, setHoverDelete] = useState(false);
  const [hoverLink, setHoverLink] = useState(false);
  const [hoverGroup, setHoverGroup] = useState(false);
  const [hoverLinkEnum, setHoverLinkEnum] = useState(false);
  const [linkParamOpen, setLinkParamOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [linkEnumOpen, setLinkEnumOpen] = useState(false);

  const loadData = async () => {
    const [treeData, carsData, groupedData, unitsData, enumsData] = await Promise.all([
      getTree(), getCars(), getClassParametersGrouped(id), getUnits(), getClassEnums(id),
    ]);
    setTree(treeData.tree);
    setCars(carsData.cars);
    setClassEnums(enumsData.enums || []);

    const flatTree = (nodes) => {
      let result = [];
      for (const node of nodes) {
        result.push(node);
        if (node.children) result = result.concat(flatTree(node.children));
      }
      return result;
    };
    const allNodes = flatTree(treeData.tree);

    const resolveInherited = (p) => {
      if (!p.inherited_from) return p;
      const parentNode = allNodes.find((n) => n.id_class === p.inherited_from);
      return { ...p, inherited_from: parentNode ? parentNode.name : p.inherited_from };
    };

    const processGrouped = (data) => ({
      groups: data.groups.map((g) => ({ ...g, parameters: g.parameters.map(resolveInherited) })),
      ungrouped: data.ungrouped.map(resolveInherited),
    });

    setGrouped(processGrouped(groupedData));
    setUnits(unitsData.units);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  if (loading) return null;

  const flatTree = (nodes) => {
    let result = [];
    for (const node of nodes) {
      result.push(node);
      if (node.children) result = result.concat(flatTree(node.children));
    }
    return result;
  };

  const allNodes = flatTree(tree);
  const node = allNodes.find((n) => n.id_class === Number(id));
  if (!node) return <p style={{ fontFamily: '"Inter Tight", sans-serif', padding: 40 }}>Класс не найден</p>;

  const countCarsRecursive = (n) => {
    let count = cars.filter((c) => c.id_class === n.id_class).length;
    if (n.children) for (const child of n.children) count += countCarsRecursive(child);
    return count;
  };

  const carCount = countCarsRecursive(node);
  const childrenCount = node.children ? node.children.length : 0;

  const getPath = (targetId, nodes, path = []) => {
    for (const n of nodes) {
      if (n.id_class === targetId) return [...path, n];
      if (n.children) {
        const found = getPath(targetId, n.children, [...path, n]);
        if (found) return found;
      }
    }
    return null;
  };

  const path = getPath(node.id_class, tree);
  const pathNames = path ? path.map((n) => n.name).join(' → ') : node.name;

  const infoParts = [];
  if (childrenCount === 0) infoParts.push('Терминальный класс');
  const parentClass = path ? path[path.length - 2] : null;
  if (parentClass) infoParts.push(parentClass.name);
  if (carCount > 0) infoParts.push(`${carCount} автомобиля`);

  const unitName = units.find((u) => u.id_ei === node.base_ei)?.name || '—';

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

  const cardStyle = {
    flex: 1, background: '#FFFFFF', border: '1px solid rgba(28, 28, 25, 0.5)',
    borderRadius: 10, padding: 20,
  };

  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '10px 15px', height: 40, width: 200, borderRadius: 10, cursor: 'pointer',
    fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px',
    transition: 'all 0.2s',
  };

  const sectionTitleStyle = {
    fontWeight: 400, fontSize: 16, lineHeight: '18px', color: '#1C1C19', margin: '0 0 16px 0',
  };

  const hasParams = grouped.groups.length > 0 || grouped.ungrouped.length > 0;
  const hasGroups = grouped.groups.length > 0;

  return (
    <div style={{ fontFamily: '"Inter Tight", sans-serif', marginTop: 40 }}>
      <div onClick={() => navigate('/admin/classes')} style={{ cursor: 'pointer', color: '#1C1C19', fontSize: 16, lineHeight: '18px', marginBottom: 12 }}>
        ← Классы / {node.name}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 50 }}>
        <div>
          <h2 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 8px 0' }}>{node.name}</h2>
          {infoParts.length > 0 && (
            <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', opacity: 0.5, margin: 0 }}>
              {infoParts.join(' • ')}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onMouseEnter={() => setHoverMove(true)} onMouseLeave={() => setHoverMove(false)} onClick={() => setMoveModalOpen(true)}
            style={{ ...btnBase, background: hoverMove ? '#1C1C19' : '#FFFFFF', border: `1px solid ${hoverMove ? '#1C1C19' : 'rgba(28, 28, 25, 0.5)'}`, color: hoverMove ? '#FFFFFF' : '#1C1C19' }}>
            Переместить
          </button>
          <button onMouseEnter={() => setHoverDelete(true)} onMouseLeave={() => setHoverDelete(false)} onClick={() => setDeleteModalOpen(true)}
            style={{ ...btnBase, background: hoverDelete ? '#1C1C19' : '#E60023', border: `1px solid ${hoverDelete ? '#1C1C19' : '#E60023'}`, color: '#FFFFFF' }}>
            Удалить
          </button>
        </div>
      </div>

      <p style={sectionTitleStyle}>О классе</p>

      <div style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
        <div style={cardStyle}><div style={{ fontWeight: 500, fontSize: 20, lineHeight: '22px', color: '#1C1C19', marginBottom: 12 }}>Путь в иерархии</div><div style={{ fontWeight: 400, fontSize: 18, lineHeight: '22px', color: '#1C1C19', opacity: 0.7 }}>{pathNames}</div></div>
        <div style={cardStyle}><div style={{ fontWeight: 500, fontSize: 20, lineHeight: '22px', color: '#1C1C19', marginBottom: 12 }}>Единица измерения</div><div style={{ fontWeight: 400, fontSize: 18, lineHeight: '22px', color: '#1C1C19', opacity: 0.7 }}>{unitName}</div></div>
        <div style={cardStyle}><div style={{ fontWeight: 500, fontSize: 20, lineHeight: '22px', color: '#1C1C19', marginBottom: 12 }}>Подклассов</div><div style={{ fontWeight: 400, fontSize: 18, lineHeight: '22px', color: '#1C1C19', opacity: 0.7 }}>{childrenCount || '—'}</div></div>
        <div style={cardStyle}><div style={{ fontWeight: 500, fontSize: 20, lineHeight: '22px', color: '#1C1C19', marginBottom: 12 }}>Автомобилей в классе</div><div style={{ fontWeight: 400, fontSize: 18, lineHeight: '22px', color: '#1C1C19', opacity: 0.7 }}>{carCount}</div></div>
      </div>

      {/* Блок: Характеристики класса */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={sectionTitleStyle}>Характеристики класса</p>
          <button onMouseEnter={() => setHoverLink(true)} onMouseLeave={() => setHoverLink(false)} onClick={() => setLinkParamOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', height: 40, background: hoverLink ? '#1C1C19' : '#FFFFFF', border: `1px solid ${hoverLink ? '#1C1C19' : 'rgba(28, 28, 25, 0.5)'}`, borderRadius: 10, cursor: 'pointer', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', color: hoverLink ? '#FFFFFF' : '#1C1C19', transition: 'all 0.2s' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="11" y="0" width="2" height="24" fill={hoverLink ? '#FFFFFF' : '#1C1C19'}/><rect x="0" y="11" width="24" height="2" fill={hoverLink ? '#FFFFFF' : '#1C1C19'}/></svg>
            Привязать параметр
          </button>
        </div>

        <div style={{ border: '1px solid #8D8D8B', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Параметр</th>
                <th style={thStyle}>Тип</th>
                <th style={thStyle}>Обязательный</th>
                <th style={thStyle}>Ограничения</th>
                <th style={thStyle}>Источник</th>
                <th style={thStyle}>Группа</th>
              </tr>
            </thead>
            <tbody>
              {hasParams ? [...grouped.groups.flatMap((g) => g.parameters), ...grouped.ungrouped].map((p, i) => (
                <tr key={p.id_param || i}>
                  <td style={tdStyle}>{p.param_name || p.name}</td>
                  <td style={tdStyle}>{typeLabels[p.value_type] || p.value_type}</td>
                  <td style={tdStyle}>{p.is_required ? 'Да' : 'Нет'}</td>
                  <td style={tdStyle}>{p.min_value || p.max_value ? `${p.min_value || '—'} – ${p.max_value || '—'}` : '—'}</td>
                  <td style={tdStyle}>{p.inherited_from ? `Унаследован от «${p.inherited_from}»` : 'Свой'}</td>
                  <td style={tdStyle}>{p.group_name || '—'}</td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
        {!hasParams && (
          <p style={{ textAlign: 'center', marginTop: 16, fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19' }}>
            Нет привязанных параметров. Нажмите «Привязать параметр», чтобы добавить.
          </p>
        )}
      </div>

      {/* Блок: Справочники класса */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={sectionTitleStyle}>Справочники класса</p>
          <button onMouseEnter={() => setHoverLinkEnum(true)} onMouseLeave={() => setHoverLinkEnum(false)} onClick={() => setLinkEnumOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', height: 40, background: hoverLinkEnum ? '#1C1C19' : '#FFFFFF', border: `1px solid ${hoverLinkEnum ? '#1C1C19' : 'rgba(28, 28, 25, 0.5)'}`, borderRadius: 10, cursor: 'pointer', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', color: hoverLinkEnum ? '#FFFFFF' : '#1C1C19', transition: 'all 0.2s' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="11" y="0" width="2" height="24" fill={hoverLinkEnum ? '#FFFFFF' : '#1C1C19'}/><rect x="0" y="11" width="24" height="2" fill={hoverLinkEnum ? '#FFFFFF' : '#1C1C19'}/></svg>
            Привязать справочник
          </button>
        </div>

        <div style={{ border: '1px solid #8D8D8B', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Справочник</th>
                <th style={thStyle}>Обязательный</th>
                <th style={thStyle}>Тип значений</th>
                <th style={thStyle}>Значений</th>
              </tr>
            </thead>
            <tbody>
              {classEnums.length > 0 ? classEnums.map((e) => (
                <tr key={e.id_enum}>
                  <td style={tdStyle}>{e.name}</td>
                  <td style={tdStyle}>{e.is_required ? 'Да' : 'Нет'}</td>
                  <td style={tdStyle}>{e.value_type === 'numeric' ? 'Числовой' : 'Строковый'}</td>
                  <td style={tdStyle}>{e.values?.length || 0}</td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
        {classEnums.length === 0 && (
          <p style={{ textAlign: 'center', marginTop: 16, fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19' }}>
            Нет привязанных справочников. Нажмите «Привязать справочник», чтобы добавить.
          </p>
        )}
      </div>

      {/* Блок: Группы параметров */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={sectionTitleStyle}>Группы параметров</p>
          <button onMouseEnter={() => setHoverGroup(true)} onMouseLeave={() => setHoverGroup(false)} onClick={() => setCreateGroupOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', height: 40, background: hoverGroup ? '#1C1C19' : '#FFFFFF', border: `1px solid ${hoverGroup ? '#1C1C19' : 'rgba(28, 28, 25, 0.5)'}`, borderRadius: 10, cursor: 'pointer', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', color: hoverGroup ? '#FFFFFF' : '#1C1C19', transition: 'all 0.2s' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="11" y="0" width="2" height="24" fill={hoverGroup ? '#FFFFFF' : '#1C1C19'}/><rect x="0" y="11" width="24" height="2" fill={hoverGroup ? '#FFFFFF' : '#1C1C19'}/></svg>
            Создать группу
          </button>
        </div>

        <div style={{ border: '1px solid #8D8D8B', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Группа</th>
                <th style={thStyle}>Параметров</th>
                <th style={thStyle}>Порядок</th>
              </tr>
            </thead>
            <tbody>
              {hasGroups ? grouped.groups.map((g) => (
                <tr key={g.id_group}>
                  <td style={tdStyle}>{g.name}</td>
                  <td style={tdStyle}>{g.parameters.length}</td>
                  <td style={tdStyle}>{g.sort_order || 1}</td>
                </tr>
              )) : null}
              {grouped.ungrouped.length > 0 && (
                <tr>
                  <td style={tdStyle}>Без группы</td>
                  <td style={tdStyle}>{grouped.ungrouped.length}</td>
                  <td style={tdStyle}>—</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!hasGroups && grouped.ungrouped.length === 0 && (
          <p style={{ textAlign: 'center', marginTop: 16, fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19' }}>
            Нет созданных групп. Нажмите «Создать группу», чтобы добавить.
          </p>
        )}
      </div>

      <LinkParameterModal open={linkParamOpen} onClose={() => setLinkParamOpen(false)} onSuccess={() => window.location.reload()} classId={id} className={node.name} />
      <LinkEnumModal open={linkEnumOpen} onClose={() => setLinkEnumOpen(false)} onSuccess={() => window.location.reload()} classId={id} className={node.name} />
      <CreateGroupModal open={createGroupOpen} onClose={() => setCreateGroupOpen(false)} onSuccess={() => window.location.reload()} classId={id} className={node.name} />
      <DeleteClassModal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onSuccess={() => navigate('/admin/classes')} classItem={node} />
      <MoveClassModal open={moveModalOpen} onClose={() => setMoveModalOpen(false)} onSuccess={() => window.location.reload()} classItem={node} />
    </div>
  );
};

export default ClassDetailPage;