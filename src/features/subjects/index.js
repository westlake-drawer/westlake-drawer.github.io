import React, {useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import subjects from '@site/src/data/subjects.json';
import {useLang} from '@site/src/features/i18n';
import styles from './styles.module.css';

const KIND_ZH = {'Course Notes': '课程笔记', Tools: '工具'};

export function SubjectGrid() {
  const {lang} = useLang();
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    fetch('/search-index.json')
      .then((response) => (response.ok ? response.json() : {entries: []}))
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => setEntries([]));
  }, []);

  const counts = useMemo(() => {
    const map = {};
    for (const entry of entries) {
      if (entry.kind !== 'notes') continue;
      map[entry.subject] = (map[entry.subject] ?? 0) + 1;
    }
    return map;
  }, [entries]);

  return (
    <ul className={styles.grid}>
      {subjects.map((subject) => {
        const count = counts[subject.label] ?? 0;
        return (
          <li key={subject.slug}>
            <Link className={styles.card} to={`/notes/${subject.slug}/`}>
              <strong className={styles.title}>
                {lang === 'zh' && subject.labelZh ? subject.labelZh : subject.label}
              </strong>
              {lang === 'zh' && subject.labelZh && (
                <span className={styles.alt}>{subject.label}</span>
              )}
              <span className={styles.desc}>
                {lang === 'zh' && subject.descriptionZh ? subject.descriptionZh : subject.description}
              </span>
              <span className={styles.count}>
                {count} {lang === 'zh' ? '条资源' : count === 1 ? 'resource' : 'resources'}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function SubjectIntro({slug}) {
  const {lang} = useLang();
  const subject = subjects.find((item) => item.slug === slug);
  const label = subject ? (lang === 'zh' && subject.labelZh ? subject.labelZh : subject.label) : slug;
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    fetch('/search-index.json')
      .then((response) => (response.ok ? response.json() : {entries: []}))
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => setEntries([]));
  }, []);

  const courses = entries.filter(
    (entry) => entry.kind === 'notes' && subject && entry.subject === subject.label
  );

  if (!courses.length) {
    return (
      <p className={styles.intro}>
        {lang === 'zh' ? (
          <>
            {label}方向目前还没有收录课程笔记。若你整理了相关课程的讲义，欢迎按
            <Link to="/submit/">提交指引</Link>投稿。
          </>
        ) : (
          <>
            No course notes are indexed under {label} yet. If you have notes for a course in this
            area, see the <Link to="/submit/">submission guide</Link>.
          </>
        )}
      </p>
    );
  }

  return (
    <>
      <p className={styles.intro}>
        {lang === 'zh'
          ? `${label}方向目前收录 ${courses.length} 门课程。`
          : `${courses.length} ${courses.length === 1 ? 'course is' : 'courses are'} indexed under ${label}.`}
      </p>
      <ul className={styles.courses}>
        {courses.map((course) => (
          <li key={course.url}>
            <Link className={styles.courseCard} to={course.url}>
              <strong className={styles.title}>{course.title}</strong>
              <span className={styles.desc}>
                {lang === 'zh' && course.descriptionZh ? course.descriptionZh : course.description}
              </span>
              <span className={styles.count}>{course.course}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
