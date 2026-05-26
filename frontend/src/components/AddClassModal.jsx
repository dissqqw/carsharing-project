import { useState, useEffect } from 'react';
import { getTree, addClass, getUnits } from '../api/client';

const AddClassModal = ({ open, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [parentId, setParentId] = useState(null);
  const [unitId, setUnitId] = useState(null);
  const [tree, setTree] = useState([]);
  const [units, setUnits] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      getTree().then((data) => setTree(data.tree)).catch(() => {});
      getUnits().then((data) => setUnits(data.units)).catch(() => {});
      setName('');
      setShortName('');
      setParentId(null);
      setUnitId(null);
      setError('');
      setDropdownOpen(false);
      setUnitDropdownOpen(false);
    }
  }, [open]);

  if (!open) return null;

  const flatTree = (nodes, level = 0) => {
    let result = [];
    for (const node of nodes) {
      result.push({ ...node, level });
      if (node.children) result = result.concat(flatTree(node.children, level + 1));
    }
    return result;
  };

  const flatNodes = flatTree(tree);
  const selectedParent = flatNodes.find((n) => n.id_class === parentId);
  const selectedUnit = units.find((u) => u.id_ei === unitId);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Введите название класса');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addClass({
        name: name.trim(),
        short_name: shortName.trim() || undefined,
        main_class: parentId,
        base_ei: unitId,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Ошибка при создании класса');
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

        <h3 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>Добавить класс</h3>
        <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#707070', margin: '0 0 24px 0' }}>Новый узел в иерархии классов. Наследует параметры от родителя</p>

        <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <input placeholder="Название *" value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <input placeholder="Краткое название" value={shortName} onChange={(e) => setShortName(e.target.value)} style={fieldStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div onClick={() => { setDropdownOpen(!dropdownOpen); setUnitDropdownOpen(false); }} style={{ ...fieldStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ color: selectedParent ? '#1C1C19' : '#707070' }}>{selectedParent ? selectedParent.name : 'Родительский класс'}</span>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="M1 1L6 6L11 1" stroke="#707070" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            {dropdownOpen && (
              <div style={{ position: 'absolute', top: 44, left: 0, right: 0, background: '#FFFFFF', border: '1px solid #8D8D8B', borderRadius: 10, maxHeight: 250, overflow: 'auto', zIndex: 10 }}>
                <div className={`dropdown-option ${parentId === null ? 'dropdown-option--selected' : ''}`} onClick={() => { setParentId(null); setDropdownOpen(false); }}>Без родителя</div>
                {flatNodes.map((node) => (
                  <div key={node.id_class} className={`dropdown-option ${parentId === node.id_class ? 'dropdown-option--selected' : ''}`} onClick={() => { setParentId(node.id_class); setDropdownOpen(false); }} style={{ paddingLeft: 12 + node.level * 16 }}>
                    {node.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <div onClick={() => { setUnitDropdownOpen(!unitDropdownOpen); setDropdownOpen(false); }} style={{ ...fieldStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ color: selectedUnit ? '#1C1C19' : '#707070' }}>{selectedUnit ? selectedUnit.name : 'Базовая единица измерения'}</span>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transform: unitDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="M1 1L6 6L11 1" stroke="#707070" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            {unitDropdownOpen && (
              <div style={{ position: 'absolute', top: 44, left: 0, right: 0, background: '#FFFFFF', border: '1px solid #8D8D8B', borderRadius: 10, maxHeight: 250, overflow: 'auto', zIndex: 10 }}>
                <div className={`dropdown-option ${unitId === null ? 'dropdown-option--selected' : ''}`} onClick={() => { setUnitId(null); setUnitDropdownOpen(false); }}>Не выбрано</div>
                {units.map((u) => (
                  <div key={u.id_ei} className={`dropdown-option ${unitId === u.id_ei ? 'dropdown-option--selected' : ''}`} onClick={() => { setUnitId(u.id_ei); setUnitDropdownOpen(false); }}>
                    {u.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <p style={{ color: '#E53935', fontSize: 16, margin: '0 0 16px 0', fontFamily: '"Inter Tight", sans-serif' }}>{error}</p>}

        <button onClick={handleSubmit} disabled={loading} style={{ width: '100%', height: 50, background: '#1C1C19', border: 'none', borderRadius: 10, color: '#FFFFFF', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Добавление...' : 'Добавить'}
        </button>
      </div>
    </div>
  );
};

export default AddClassModal;