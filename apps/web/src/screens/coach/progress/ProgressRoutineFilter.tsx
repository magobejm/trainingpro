import React, { useRef, useState } from 'react';
import { usePerformedTemplatesQuery } from '../../../data/hooks/usePerformedTemplatesQuery';

type Props = {
  clientId: string | null;
  from: string;
  to: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  t: (k: string) => string;
};

export function ProgressRoutineFilter({ clientId, from, to, selectedId, onSelect, t }: Props) {
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const performedQuery = usePerformedTemplatesQuery(
    { clientId: clientId ?? undefined, from, to },
    { enabled: Boolean(clientId) },
  );

  const allTemplates = performedQuery.data?.templates ?? [];
  const q = search.toLowerCase();
  const filtered = allTemplates.filter((r) => r.name.toLowerCase().includes(q));
  const dropdownItems = filtered.slice(0, 10);
  function handleSelect(id: string, name: string) {
    onSelect(id);
    setSearch(name);
    setDropdownOpen(false);
  }

  function handleInputChange(value: string) {
    setSearch(value);
    setDropdownOpen(true);
    if (!value) onSelect(null);
  }

  return (
    <div style={filterBlock}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          style={searchInput}
          placeholder={t('coach.progress.filter.routine.placeholder')}
          value={search}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
        />
        {dropdownOpen && (
          <div style={dropdownContainer}>
            {dropdownItems.length > 0 ? (
              dropdownItems.map((item) => (
                <button
                  key={item.id}
                  style={{ ...dropdownItem, ...(selectedId === item.id ? dropdownItemActive : {}) }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(item.id, item.name);
                  }}
                >
                  {item.name}
                </button>
              ))
            ) : (
              <p style={dropdownEmpty}>{t('coach.progress.filter.noResultsPeriod')}</p>
            )}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div style={chipList}>
          {filtered.slice(0, 12).map((item) => (
            <button
              key={item.id}
              style={{ ...chip, ...(selectedId === item.id ? chipActive : {}) }}
              onClick={() => {
                if (selectedId === item.id) {
                  onSelect(null);
                  setSearch('');
                } else {
                  handleSelect(item.id, item.name);
                }
              }}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      {!clientId && <p style={noClientMsg}>{t('coach.progress.filter.noClient')}</p>}
    </div>
  );
}

const filterBlock: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, width: '100%' };
const searchInput: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1.5px solid #dce3eb',
  fontSize: 14,
  color: '#0f1b2f',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};
const dropdownContainer: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  background: '#fff',
  border: '1.5px solid #dce3eb',
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  zIndex: 50,
  padding: '8px 4px',
  maxHeight: 320,
  overflowY: 'auto',
};
const dropdownItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '9px 14px',
  border: 'none',
  background: 'transparent',
  color: '#334155',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  borderRadius: 10,
  textAlign: 'left',
};
const dropdownItemActive: React.CSSProperties = { background: '#eff6ff', color: '#3b82f6' };
const dropdownEmpty: React.CSSProperties = { margin: '12px', fontSize: 13, color: '#94a3b8', textAlign: 'center' };
const chipList: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 };
const chip: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 10,
  border: '1.5px solid #dce3eb',
  background: '#fff',
  color: '#5d6f85',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 13,
};
const chipActive: React.CSSProperties = { background: '#0f1b2f', color: '#fff', borderColor: '#0f1b2f' };
const noClientMsg: React.CSSProperties = { margin: 0, fontSize: 13, color: '#94a3b8' };
