import { useState, useEffect } from 'react';
import { getTree } from '../api/client';

const MoveClassModal = ({ open, onClose, onSuccess, classItem }) => {
  const [tree, setTree] = useState([]);
  const [newParentId, setNewParentId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      getTree().then((data) => setTree(data.tree)).catch(() => {});
      setNewParentId(null);
      setError('');
      setDropdownOpen(false);
    }
  }, [open]);

  if (!open || !classItem) return null;

  const flatTree = (nodes, level = 0) => {
    let result = [];
    for (const node of nodes) {
      result.push({ ...node, level });
      if (node.children) result = result.concat(flatTree(node.children, level + 1));
    }
    return result;
  };

  const allNodes = flatTree(tree).filter((n) => n.id_class !== classItem.id_class);
  const selectedParent = allNodes.find((n) => n.id_class === newParentId);

  const handleSubmit = async () => {
    if (!newParentId) { setError('Выберите родительский класс'); return; }
    setLoading(true);
    setError('');
    try {
      await fetch(`http://127.0.0.1:5000/api/class/${classItem.id_class}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_parent_id: newParentId }),
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Ошибка при перемещении класса');
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

        <h3 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>Переместить класс</h3>
        <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#707070', margin: '0 0 24px 0' }}>
          Выберите новый родительский класс для «{classItem.name}»
        </p>

        <div style={{ position: 'relative', marginBottom: 24 }}>
          <div onClick={() => setDropdownOpen(!dropdownOpen)} style={{ ...fieldStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span style={{ color: selectedParent ? '#1C1C19' : '#707070' }}>{selectedParent ? selectedParent.name : 'Родительский класс *'}</span>
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <path d="M1 1L6 6L11 1" stroke="#707070" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          {dropdownOpen && (
            <div style={{ position: 'absolute', top: 54, left: 0, right: 0, background: '#FFFFFF', border: '1px solid #8D8D8B', borderRadius: 10, maxHeight: 250, overflow: 'auto', zIndex: 10 }}>
              {allNodes.map((n) => (
                <div key={n.id_class} className={`dropdown-option ${newParentId === n.id_class ? 'dropdown-option--selected' : ''}`}
                  onClick={() => { setNewParentId(n.id_class); setDropdownOpen(false); }}
                  style={{ paddingLeft: 12 + n.level * 16 }}>
                  {n.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p style={{ color: '#E53935', fontSize: 16, margin: '0 0 16px 0', fontFamily: '"Inter Tight", sans-serif' }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', height: 50, background: '#1C1C19', border: 'none', borderRadius: 10, color: '#FFFFFF', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Перемещение...' : 'Переместить'}
        </button>
      </div>
    </div>
  );
};

export default MoveClassModal;