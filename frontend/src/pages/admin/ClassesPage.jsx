import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTree, getCars, getUnits } from '../../api/client';
import AddClassModal from '../../components/AddClassModal';
import DeleteClassModal from '../../components/DeleteClassModal';

const ClassesPage = () => {
  const navigate = useNavigate();
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [deleteClassOpen, setDeleteClassOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [tree, setTree] = useState([]);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [units, setUnits] = useState([]);

  const loadData = async () => {
    try {
      const [treeData, carsData, unitsData] = await Promise.all([getTree(), getCars(), getUnits()]);
      const filtered = treeData.tree.flatMap((root) => root.children || []);
      setUnits(unitsData.units);
      setTree(filtered);
      setCars(carsData.cars);
      const ids = new Set();
      const collectIds = (nodes) => {
        for (const node of nodes) {
          ids.add(node.id_class);
          if (node.children) collectIds(node.children);
        }
      };
      collectIds(filtered);
      setExpandedIds(ids);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const countCars = (node) => {
    let count = cars.filter((c) => c.id_class === node.id_class).length;
    if (node.children) {
      for (const child of node.children) count += countCars(child);
    }
    return count;
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filterTree = (nodes, query) => {
    if (!query) return nodes;
    const q = query.toLowerCase();
    return nodes.reduce((acc, node) => {
      const nameMatch = node.name.toLowerCase().includes(q);
      let filteredChildren = [];
      if (node.children) {
        filteredChildren = filterTree(node.children, query);
      }
      if (nameMatch || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
      return acc;
    }, []);
  };

  const filteredTree = useMemo(() => filterTree(tree, search), [tree, search]);

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
    fontWeight: 600,
    fontSize: 18,
    lineHeight: '20px',
    color: '#1C1C19',
    textAlign: 'left',
    padding: '14px 20px',
    background: '#FFFFFF',
    borderBottom: '1px solid #8D8D8B',
    fontFamily: '"Inter Tight", sans-serif',
  };

  const tdStyle = {
    fontWeight: 400,
    fontSize: 18,
    lineHeight: '20px',
    color: '#1C1C19',
    padding: '14px 20px',
    background: '#FFFFFF',
    borderBottom: '1px solid #8D8D8B',
    fontFamily: '"Inter Tight", sans-serif',
  };

  const renderNode = (node, level = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id_class) || search.length > 0;
    const carCount = countCars(node);

    const rows = [];
    rows.push(
      <tr key={node.id_class}>
        <td style={{ ...tdStyle, paddingLeft: 20 + level * 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {hasChildren ? (
              <span onClick={() => toggleExpand(node.id_class)} style={{ cursor: 'pointer', color: '#707070', fontSize: 14, userSelect: 'none' }}>
                {isExpanded ? '▼' : '▶'}
              </span>
            ) : (
              <span style={{ width: 14, display: 'inline-block' }} />
            )}
            <span onClick={() => hasChildren && toggleExpand(node.id_class)} style={{ cursor: hasChildren ? 'pointer' : 'default' }}>
              {highlightMatch(node.name, search)}
            </span>
          </div>
        </td>
        <td style={tdStyle}>{units.find((u) => u.id_ei === node.base_ei)?.name || '—'}</td>
        <td style={tdStyle}>{hasChildren ? node.children.length : '—'}</td>
        <td style={tdStyle}>{carCount}</td>
        <td style={tdStyle}>
          <div style={{ display: 'flex', gap: 30 }}>
            <img src="/pencil.svg" alt="Детали" style={{ width: 22, height: 22, cursor: 'pointer' }} onClick={() => navigate(`/admin/classes/${node.id_class}`)} />
            <img src="/delete.svg" alt="Удалить" style={{ width: 22, height: 22, cursor: 'pointer' }} onClick={() => { setClassToDelete(node); setDeleteClassOpen(true); }} />
          </div>
        </td>
      </tr>
    );

    if (hasChildren && isExpanded) {
      rows.push(...node.children.map((child) => renderNode(child, level + 1)));
    }

    return rows;
  };

  const allRows = filteredTree.flatMap((node) => renderNode(node, 0));

  return (
    <div style={{ fontFamily: '"Inter Tight", sans-serif', marginTop: 40 }}>
      <h2 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>
        Классы автомобилей
      </h2>
      <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', margin: '0 0 40px 0' }}>
        Иерархическая структура моделей. Создание, редактирование и настройка параметров
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div style={{ position: 'relative', width: 400 }}>
          <input
            placeholder="Поиск"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', height: 40, background: '#FFFFFF',
              border: '1px solid rgba(28, 28, 25, 0.5)', borderRadius: 10,
              padding: '0 15px 0 45px', fontSize: 18, fontFamily: '"Inter Tight", sans-serif',
              color: '#1C1C19', outline: 'none', boxSizing: 'border-box',
            }}
          />
          <svg width="20" height="20" viewBox="0 0 26 26" fill="none" style={{ position: 'absolute', left: 14, top: 10 }}>
            <circle cx="11" cy="11" r="7" stroke="#1C1C19" strokeWidth="2"/>
            <path d="M16.5 16.5L22 22" stroke="#1C1C19" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <button
        onClick={() => setAddClassOpen(true)}
        onMouseEnter={(e) => {
            e.currentTarget.style.background = '#1C1C19';
            e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.color = '#1C1C19';
        }}
        style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', height: 40,
            background: '#FFFFFF', border: '1px solid rgba(28, 28, 25, 0.5)', borderRadius: 10,
            cursor: 'pointer', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500,
            fontSize: 18, lineHeight: '20px', color: '#1C1C19', transition: 'all 0.2s',
        }}
        >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="11" y="0" width="2" height="24" fill="#1C1C19" className="plus-icon"/>
        <rect x="0" y="11" width="24" height="2" fill="#1C1C19" className="plus-icon"/>
        </svg>
        Добавить класс
        </button>
      </div>

      {allRows.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#1C1C19', fontFamily: '"Inter Tight", sans-serif' }}>
            {search ? 'Ничего не найдено' : 'Нет созданных классов. Нажмите «Добавить класс», чтобы создать первый'}
          </p>
        </div>
      ) : (
        <div style={{ border: '1px solid #8D8D8B', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Название</th>
                <th style={{ ...thStyle, width: 200 }}>Единица</th>
                <th style={{ ...thStyle, width: 150 }}>Подклассов</th>
                <th style={{ ...thStyle, width: 180 }}>Количество авто</th>
                <th style={{ ...thStyle, width: 160 }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {allRows}
            </tbody>
          </table>
        </div>
      )}

      <AddClassModal open={addClassOpen} onClose={() => setAddClassOpen(false)} onSuccess={loadData} />
      <DeleteClassModal open={deleteClassOpen} onClose={() => setDeleteClassOpen(false)} onSuccess={loadData} classItem={classToDelete} />
    </div>
  );
};

export default ClassesPage;