import { useState, useEffect } from 'react';
import { deleteParameter, getClassParametersGrouped } from '../api/client';

const DeleteParameterModal = ({ open, onClose, onSuccess, parameter }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [classCount, setClassCount] = useState(0);

  useEffect(() => {
    if (open && parameter) {
      getClassParametersGrouped(parameter.id_param).catch(() => {});
      setClassCount(0);
    }
  }, [open, parameter]);

  if (!open || !parameter) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await deleteParameter(parameter.id_param);
      onSuccess();
      onClose();
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Ошибка при удалении параметра');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ width: 733, background: '#FFFFFF', borderRadius: 10, padding: '40px', position: 'relative', fontFamily: '"Inter Tight", sans-serif' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ position: 'absolute', top: 20, right: 20, cursor: 'pointer' }} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 6L18 18M6 18L18 6" stroke="#1C1C19" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>

        <h3 style={{ fontWeight: 600, fontSize: 26, lineHeight: '28px', color: '#1C1C19', margin: '0 0 12px 0' }}>
          Вы уверены, что хотите удалить параметр «{parameter.name}» ({parameter.code})?
        </h3>
        <p style={{ fontWeight: 400, fontSize: 18, lineHeight: '20px', color: '#707070', margin: '0 0 24px 0' }}>
          Это действие нельзя отменить. Параметр будет удалён из всех классов.
        </p>

        {error && <p style={{ color: '#E53935', fontSize: 16, margin: '0 0 16px 0', fontFamily: '"Inter Tight", sans-serif' }}>{error}</p>}

        <button onClick={handleDelete} disabled={loading} style={{ width: '100%', height: 50, background: '#E60023', border: 'none', borderRadius: 10, color: '#FFFFFF', fontFamily: '"Inter Tight", sans-serif', fontWeight: 500, fontSize: 18, lineHeight: '20px', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Удаление...' : 'Удалить'}
        </button>
      </div>
    </div>
  );
};

export default DeleteParameterModal;