import React, {useEffect, useState} from 'react';
import Link from '@docusaurus/Link';
import collections from '@site/src/data/collections.json';
import styles from './styles.module.css';

const normalize = (url) => url.replace(/\/$/, '');

export default function Collections() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    fetch('/search-index.json')
      .then((response) => (response.ok ? response.json() : {entries: []}))
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => setEntries([]));
  }, []);

  const byUrl = new Map(entries.map((entry) => [normalize(entry.url), entry]));

  return (
    <div className={styles.collections}>
      {collections.map((collection) => (
        <section key={collection.id} className={styles.collection}>
          <header className={styles.header}>
            <h2 className={styles.title}>
              {collection.title}
              <span className={styles.zh}>{collection.zh}</span>
            </h2>
            <p className={styles.desc}>{collection.description}</p>
          </header>
          <ul className={styles.items}>
            {collection.items.map((url) => {
              const entry = byUrl.get(normalize(url));
              return (
                <li key={url}>
                  <Link className={styles.item} to={url}>
                    <span className={styles.itemTitle}>{entry?.title ?? url}</span>
                    {entry && <span className={styles.itemMeta}>{[entry.subject, entry.course].filter(Boolean).join(' · ')}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
