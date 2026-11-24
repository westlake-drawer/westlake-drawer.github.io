import React from 'react';
import styles from './outline.module.css';

function OutlineTitle({entry}) {
  return entry.titleHtml
    ? <span dangerouslySetInnerHTML={{__html: entry.titleHtml}} />
    : <span>{entry.title}</span>;
}

function OutlineRow({entry}) {
  const hasPage = entry.page !== undefined && entry.page !== '';
  return (
    <span className={styles.row}>
      <span className={styles.label}>
        {entry.number && <span className={styles.number}>{entry.number}</span>}
        <OutlineTitle entry={entry} />
      </span>
      {hasPage && <>
        <span className={styles.leader} aria-hidden="true" />
        <span className={styles.page} aria-label={`Page ${entry.page}`}>{entry.page}</span>
      </>}
    </span>
  );
}

function OutlineEntries({entries}) {
  return (
    <ul className={styles.entries}>
      {entries.map((entry, index) => (
        <li key={index}>
          <OutlineRow entry={entry} />
          {entry.children.length > 0 && <OutlineEntries entries={entry.children} />}
        </li>
      ))}
    </ul>
  );
}

export default function CourseOutline({outline}) {
  const {title, titleId, source, chapters} = outline;
  return (
    <div className={styles.outline} data-paginated={chapters.some((chapter) => chapter.page !== undefined)}>
      <h1 id={titleId}>{title}</h1>
      {source && <p className={styles.meta}><a href={source.url}>{source.label}</a></p>}
      {chapters.map((chapter) => (
        <section className={styles.chapter} key={chapter.id}>
          <h2 id={chapter.id}><OutlineRow entry={chapter} /></h2>
          {chapter.children.length > 0 && <OutlineEntries entries={chapter.children} />}
        </section>
      ))}
    </div>
  );
}
