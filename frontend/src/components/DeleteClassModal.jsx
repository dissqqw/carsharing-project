import { useState, useEffect } from 'react';
import { deleteClass, getTree, getCars } from '../api/client';

const DeleteClassModal = ({ open, onClose, onSuccess, classItem }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parentName, setParentName] = useState('');
  const [childrenCount, setChildrenCount] = useState(0);
  const [carCount, setCarCount] = useState(0);

  useEffect(() => {
    if (open && classItem) {
      const load = async () => {
        const [treeData, carsData] = await Promise.all([getTree(), getCars()]);
        const flatTree = (nodes) => {
          let result = [];
          for (const node of nodes) {
            result.push(node);
            if (node.children) result = result.concat(flatTree(node.children));
          }
          return result;
        };
        const allNodes = flatTree(treeData.tree);
        const node = allNodes.find((n) => n.id_class === classItem.id_class);

        if (node) {
          const parent = allNodes.find((n) => n.id_class === node.main_class);
          setParentName(parent ? parent.name : '');
          setChildrenCount(node.children ? node.children.length : 0);
          const countRecursive = (n) => {
            let count = carsData.cars.filter((c) => c.id_class === n.id_class).length;
            if (n.children) for (const child of n.children) count += countRecursive(child);
            return count;
          };
          setCarCount(countRecursive(node));
        }
      };
      load();
    }
  }, [open, classItem]);

  if (!open || !classItem) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await deleteClass(classItem.id_class);
      onSuccess();
      onClose();
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Ошибка при удалении класса');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        width: 733, background: '#FFFFFF', borderRadius: 10, padding: '40px',
        position: 'relative', fontFamily: '"Inter Tight", sans-serif',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer' }} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 6L18 18M6 18L18 6" stroke="#1C1C19" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <h3 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>
          Вы уверены, что хотите удалить класс «{classItem.name}»?
        </h3>
        <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#707070', margin: '0 0 24px 0' }}>
          {childrenCount > 0 || carCount > 0 ? (
            <>
              {childrenCount > 0 && `${childrenCount} подкласса(ов)`}
              {childrenCount > 0 && carCount > 0 && ' и '}
              {carCount > 0 && `${carCount} автомобиля(ей)`}
              {' будут перенесены в родительский класс '}
              {parentName ? `«${parentName}»` : ''}.
              {' '}
            </>
          ) : null}
          Это действие нельзя отменить.
        </p>

        {error && <p style={{ color: '#E53935', fontSize: 16, margin: '0 0 16px 0', fontFamily: '"Inter Tight", sans-serif' }}>{error}</p>}

        <button onClick={handleDelete} disabled={loading} style={{ width: '100%', height: 50, background: '#1C1C19', border: 'none', borderRadius: 10, color: '#FFFFFF', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Удаление...' : 'Удалить'}
        </button>
      </div>
    </div>
  );
};

export default DeleteClassModal;