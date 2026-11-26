import React, {useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import {useLang} from '@site/src/features/i18n';
import subjectMeta from '@site/src/data/subjects.json';
import styles from './styles.module.css';

const kinds = ['all', 'Course Notes', 'Tools'];

export default function Explore() {
  const {t, lang} = useLang();
  const subjectZh = Object.fromEntries(subjectMeta.map((s) => [s.label, s.labelZh || s.label]));
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

  const filtered = useMemo(() => {
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

  const results = useMemo(() => filtered.slice(0, 9), [filtered]);

  const countFor = (predicate) => entries.filter(predicate).length;

  return (
    <div className={styles.layout}>
      <aside className={styles.facets}>
        <h4 className={styles.facetTitle}>{t('explore.type')}</h4>
        {kinds.map((value) => (
          <button
            key={value}
            type="button"
            className={`${styles.facet} ${kind === value ? styles.facetActive : ''}`}
            onClick={() => setKind(value)}
          >
            <span>{value === 'all' ? t('explore.all') : value === 'Course Notes' ? t('explore.notes') : t('explore.tools')}</span>
            <span>{value === 'all' ? entries.length : countFor((entry) => entry.group === value)}</span>
          </button>
        ))}

        <h4 className={styles.facetTitle}>{t('explore.subject')}</h4>
        <button
          type="button"
          className={`${styles.facet} ${subject === 'all' ? styles.facetActive : ''}`}
          onClick={() => {
            setSubject('all');
            setCourse('all');
          }}
        >
          <span>{t('explore.all')}</span>
          <span>{subjects.length}</span>
        </button>
        {subjects.map((value) => (
          <button
            key={value}
            type="button"
            className={`${styles.facet} ${subject === value ? styles.facetActive : ''}`}
            onClick={() => {
              setSubject(value);
              setCourse('all');
            }}
          >
            <span>{value}</span>
            <span>{countFor((entry) => entry.subject === value)}</span>
          </button>
        ))}
      </aside>

      <div className={styles.main}>
        <input
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('explore.search')}
          aria-label="Search resources"
        />
        {courses.length > 0 && (
          <label className={styles.courseSelect}>
            <span>{t('explore.course')}</span>
            <select value={course} onChange={(event) => setCourse(event.target.value)}>
              <option value="all">{t('explore.allCourses')}</option>
              {courses.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
        )}

        <p className={styles.count}>
          {lang === 'zh' ? `${filtered.length} 条资源` : `${filtered.length} ${filtered.length === 1 ? 'resource' : 'resources'}`}
          {filtered.length > results.length ? ` · ${t('explore.showing')} ${results.length}` : ''}
        </p>

        <ul className={styles.grid}>
          {results.map((entry) => (
            <li key={entry.url}>
              <Link className={styles.card} to={entry.url}>
                <span className={styles.cardKind}>{entry.group === 'Course Notes' ? t('explore.notes') : t('explore.tools')}</span>
                <strong className={styles.cardTitle}>{entry.title}</strong>
                <span className={styles.cardDesc}>{lang === 'zh' && entry.descriptionZh ? entry.descriptionZh : entry.description}</span>
                <span className={styles.cardMeta}>
                  {[entry.subject, entry.course].filter(Boolean).join(' · ')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {results.length === 0 && <p className={styles.empty}>{t('explore.none')}</p>}
      </div>

    </div>
  );
}
