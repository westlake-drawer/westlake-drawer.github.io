import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useHistory} from '@docusaurus/router';
import styles from './styles.module.css';

let indexCache = null;

async function loadIndex() {
  if (indexCache) return indexCache;
  try {
    const response = await fetch('/search-index.json');
    indexCache = response.ok ? (await response.json()).entries ?? [] : [];
  } catch {
    indexCache = [];
  }
  return indexCache;
}

function score(entry, terms) {
  const title = entry.title.toLowerCase();
  const haystack = [entry.title, entry.description, entry.subject, entry.course, entry.path]
    .join(' ')
    .toLowerCase();
  let total = 0;
  for (const term of terms) {
    if (!haystack.includes(term)) return 0;
    total += title.includes(term) ? 4 : 1;
  }
  return total;
}

export function SearchButton() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => setOpen(true)} aria-label="Search">
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path
            d="M10.5 3a7.5 7.5 0 1 1 4.6 13.4l4.2 4.2-1.4 1.4-4.2-4.2A7.5 7.5 0 0 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
            fill="currentColor"
          />
        </svg>
        <span className={styles.triggerLabel}>Search</span>
        <kbd className={styles.kbd}>Ctrl K</kbd>
      </button>
      {open && <SearchDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchDialog({onClose}) {
  const history = useHistory();
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    loadIndex().then(setEntries);
    inputRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const pool = terms.length
      ? entries
          .map((entry) => ({entry, score: score(entry, terms)}))
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((item) => item.entry)
      : entries.filter((entry) => entry.kind !== 'page');
    return pool.slice(0, 12);
  }, [entries, query]);

  useEffect(() => setActive(0), [query]);

  const go = useCallback(
    (entry) => {
      if (!entry) return;
      onClose();
      history.push(entry.url);
    },
    [history, onClose]
  );

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((value) => Math.min(value + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => Math.max(value - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(results[active]);
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Search">
      <div className={styles.panel}>
        <input
          ref={inputRef}
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search courses, notes, tools…"
          aria-label="Search query"
        />
        <ul className={styles.results}>
          {results.length === 0 && <li className={styles.empty}>No results</li>}
          {results.map((entry, position) => (
            <li key={entry.url}>
              <button
                type="button"
                className={`${styles.result} ${position === active ? styles.active : ''}`}
                onMouseEnter={() => setActive(position)}
                onClick={() => go(entry)}
              >
                <span className={styles.resultTitle}>{entry.title}</span>
                <span className={styles.resultMeta}>
                  {[entry.group, entry.subject, entry.course].filter(Boolean).join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className={styles.hint}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
