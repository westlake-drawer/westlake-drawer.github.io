import React, {useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import liveStars from '@site/src/data/stars.json';
import trend from '@site/src/data/stars-trend.json';
import snapshot from '@site/src/data/repository-contributors.json';
import styles from './styles.module.css';

const snapshotStars = Object.fromEntries(
  Object.entries(snapshot.repositories ?? {}).map(([key, value]) => [key, value.info?.stars ?? 0])
);

const liveOf = (repo) => (repo ? liveStars[repo] ?? liveStars[repo.toLowerCase()] : undefined);
const starsOf = (repo) => liveOf(repo) ?? (repo ? snapshotStars[repo.toLowerCase()] ?? 0 : 0);
const deltaOf = (repo) => {
  if (!repo) return 0;
  const live = liveOf(repo);
  const base = snapshotStars[repo.toLowerCase()];
  if (typeof live === 'number' && typeof base === 'number') return live - base;
  return trend[repo] ?? trend[repo.toLowerCase()] ?? 0;
};

export default function StarRanking() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    fetch('/search-index.json')
      .then((response) => (response.ok ? response.json() : {entries: []}))
      .then((data) => setEntries((data.entries ?? []).filter((entry) => entry.kind !== 'page')))
      .catch(() => setEntries([]));
  }, []);

  const ranking = useMemo(
    () =>
      entries
        .map((entry) => ({entry, stars: starsOf(entry.repo), delta: deltaOf(entry.repo)}))
        .filter((item) => item.stars > 0)
        .sort((a, b) => b.stars - a.stars || a.entry.title.localeCompare(b.entry.title))
        .slice(0, 8),
    [entries]
  );

  if (!ranking.length) return null;

  return (
    <section className={styles.ranking} aria-label="Ranking by GitHub stars">
      <h4 className={styles.title}>Ranking</h4>
      <p className={styles.note}>By GitHub stars · ▲▼ vs. the October snapshot</p>
      <ol className={styles.list}>
        {ranking.map(({entry, stars, delta}, index) => (
          <li key={entry.url} className={styles.item}>
            <span className={styles.number}>{index + 1}</span>
            <Link className={styles.title2} to={entry.url}>{entry.title}</Link>
            <span className={styles.stars}>{stars}</span>
            <span
              className={
                delta > 0 ? styles.up : delta < 0 ? styles.down : styles.flat
              }
              title={delta === 0 ? 'no change since the last build' : `${delta > 0 ? '+' : ''}${delta} since the last build`}
            >
              {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '–'}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
