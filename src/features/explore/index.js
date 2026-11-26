import React, {useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import liveStars from '@site/src/data/stars.json';
import snapshot from '@site/src/data/repository-contributors.json';
import styles from './styles.module.css';

const snapshotStars = Object.fromEntries(
  Object.entries(snapshot.repositories ?? {}).map(([key, value]) => [key, value.info?.stars ?? 0])
);

function starsOf(repo) {
  if (!repo) return 0;
  return liveStars[repo] ?? liveStars[repo.toLowerCase()] ?? snapshotStars[repo.toLowerCase()] ?? 0;
}

const kinds = ['all', 'Course Notes', 'Tools'];

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

  const ranking = useMemo(
    () =>
      [...entries]
        .map((entry) => ({entry, stars: starsOf(entry.repo)}))
        .filter((item) => item.stars > 0)
        .sort((a, b) => b.stars - a.stars || a.entry.title.localeCompare(b.entry.title))
        .slice(0, 8),
    [entries]
  );

  const countFor = (predicate) => entries.filter(predicate).length;

  return (
    <div className={styles.layout}>
      <aside className={styles.facets}>
        <h4 className={styles.facetTitle}>Type</h4>
        {kinds.map((value) => (
          <button
            key={value}
            type="button"
            className={`${styles.facet} ${kind === value ? styles.facetActive : ''}`}
            onClick={() => setKind(value)}
          >
            <span>{value === 'all' ? 'All' : value}</span>
            <span>{value === 'all' ? entries.length : countFor((entry) => entry.group === value)}</span>
          </button>
        ))}

        <h4 className={styles.facetTitle}>Subject</h4>
        <button
          type="button"
          className={`${styles.facet} ${subject === 'all' ? styles.facetActive : ''}`}
          onClick={() => {
            setSubject('all');
            setCourse('all');
          }}
        >
          <span>All</span>
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
          placeholder="Search courses, topics, or tools…"
          aria-label="Search resources"
        />
        {courses.length > 0 && (
          <label className={styles.courseSelect}>
            <span>Course</span>
            <select value={course} onChange={(event) => setCourse(event.target.value)}>
              <option value="all">All courses</option>
              {courses.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>
        )}

        <p className={styles.count}>
          {filtered.length} {filtered.length === 1 ? 'resource' : 'resources'}
          {filtered.length > results.length ? ` · showing the first ${results.length}` : ''}
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

      <aside className={styles.ranking}>
        <h4 className={styles.facetTitle}>Ranking</h4>
        <p className={styles.rankingNote}>By GitHub stars</p>
        <ol className={styles.rankList}>
          {ranking.map(({entry, stars}, index) => (
            <li key={entry.url} className={styles.rankItem}>
              <span className={styles.rankNumber}>{index + 1}</span>
              <Link className={styles.rankTitle} to={entry.url}>{entry.title}</Link>
              <span className={styles.rankStars}>{stars}</span>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
