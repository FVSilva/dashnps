import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
  group?: string;
}

interface Props {
  label: string;
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
  placeholder?: string;
  maxDisplay?: number;
}

export function MultiSelect({ label, options, value, onChange, searchable = false, placeholder = 'Todos', maxDisplay = 2 }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const groups = [...new Set(filtered.map(o => o.group ?? ''))];

  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  }

  function toggleAll() {
    if (value.length === options.length) onChange([]);
    else onChange(options.map(o => o.value));
  }

  const displayLabel = value.length === 0
    ? placeholder
    : value.length <= maxDisplay
    ? value.map(v => options.find(o => o.value === v)?.label ?? v).join(', ')
    : `${value.length} selecionados`;

  return (
    <div className="filter-wrap" ref={ref}>
      <label className="filter-label">{label}</label>
      <button className={`filter-trigger ${open ? 'open' : ''}`} onClick={() => setOpen(p => !p)}>
        <span className="filter-trigger-text">{displayLabel}</span>
        <span className="filter-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="filter-dropdown">
          {searchable && (
            <input
              className="filter-search"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          )}
          <label className="filter-option filter-option-all">
            <input type="checkbox" checked={value.length === options.length} onChange={toggleAll} />
            <span>Todos</span>
          </label>
          <div className="filter-divider" />
          {groups.map(group => (
            <React.Fragment key={group}>
              {group && <div className="filter-group-label">{group}</div>}
              {filtered.filter(o => (o.group ?? '') === group).map(opt => (
                <label key={opt.value} className="filter-option">
                  <input
                    type="checkbox"
                    checked={value.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
