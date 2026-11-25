import React, {useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const KIND_LABELS = {'Course Notes': 'Course Notes', Tools: 'Tools'};

export default function Explore() {
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [subject, setSubject] = useState('all');
  const [course, setCourse] = useState('all');

  useEffect(() => {
    fetch('/search-index.json')
      .then((response) => (response.ok ? response.json() : {entries: []}))
      .then((data) => setEntries((data.entries ?? []).filter((entry) => entry.kind !== 'page')))
      .catch(() => setEntries([]));
  }, []);

  const subjects = useMemo(
    () => [...new Set(entries.map((entry) => entry.subject).filter(Boolean))].sort(),
    [entries]
  );
  const courses = useMemo(
    () =>
      [
        ...new Set(
          entries
            .filter((entry) => entry.kind === 'notes' && (subject === 'all' || entry.subject === subject))
            .map((entry) => entry.course)
            .filter(Boolean)
        ),
      ].sort(),
    [entries, subject]
  );

  const results = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return entries.filter((entry) => {
      if (kind !== 'all' && entry.group !== kind) return false;
      if (subject !== 'all' && entry.subject !== subject) return false;
      if (course !== 'all' && entry.course !== course) return false;
      if (!terms.length) return true;
      const haystack = [entry.title, entry.description, entry.subject, entry.course, entry.path]
        .join(' ')
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [entries, kind, subject, course, query]);

  return (
    <div className={styles.explore}>
      <div className={styles.controls}>
        <input
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search courses, topics, or tools…"
          aria-label="Search resources"
        />
        <div className={styles.chips} role="group" aria-label="Resource type">
          {['all', ...Object.keys(KIND_LABELS)].map((value) => (
            <button
              key={value}
              type="button"
              className={`${styles.chip} ${kind === value ? styles.chipActive : ''}`}
              onClick={() => setKind(value)}
            >
              {value === 'all' ? 'All' : KIND_LABELS[value]}
            </button>
          ))}
        </div>
        {subjects.length > 0 && (
          <div className={styles.chips} role="group" aria-label="Subject">
            <button
              type="button"
              className={`${styles.chip} ${subject === 'all' ? styles.chipActive : ''}`}
              onClick={() => {
                  setSubject('all');
                  setCourse('all');
                }}
            >
              All subjects
            </button>
            {subjects.map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.chip} ${subject === value ? styles.chipActive : ''}`}
                onClick={() => {
                  setSubject(value);
                  setCourse('all');
                }}
              >
                {value}
              </button>
            ))}
          </div>
        )}
        {courses.length > 0 && (
          <div className={styles.chips} role="group" aria-label="Course">
            <button
              type="button"
              className={`${styles.chip} ${course === 'all' ? styles.chipActive : ''}`}
              onClick={() => setCourse('all')}
            >
              All courses
            </button>
            {courses.map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.chip} ${course === value ? styles.chipActive : ''}`}
                onClick={() => setCourse(value)}
              >
                {value}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className={styles.count}>
        {results.length} {results.length === 1 ? 'resource' : 'resources'}
      </p>

      <ul className={styles.grid}>
        {results.map((entry) => (
          <li key={entry.url}>
            <Link className={styles.card} to={entry.url}>
              <span className={styles.cardKind}>{entry.group}</span>
              <strong className={styles.cardTitle}>{entry.title}</strong>
              {entry.description && <span className={styles.cardDesc}>{entry.description}</span>}
              <span className={styles.cardMeta}>
                {[entry.subject, entry.course].filter(Boolean).join(' · ')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {results.length === 0 && <p className={styles.empty}>Nothing matches those filters.</p>}
    </div>
  );
}
