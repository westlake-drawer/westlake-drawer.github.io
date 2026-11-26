import React, {useState} from 'react';
import {useLang} from '@site/src/features/i18n';
import styles from './styles.module.css';

const REPO = 'westlake-drawer/notes-index';

const TEMPLATE = `### Repository
https://github.com/owner/repo

### Type
Course notes / Tool

### Subject and course
Mathematics · Calculus (2025-2026)

### What it covers
One or two sentences.

### Licence
MIT — LICENSE present? yes / no

### Checklist
- [ ] public repository
- [ ] LICENSE present with a named licence
- [ ] README explains what it covers and how to build or read it
- [ ] no problem sets, solution keys, or past exam papers
- [ ] no instructor material uploaded without permission
- [ ] no personal data (student IDs, email lists, grades)
- [ ] I have the right to publish this content and accept the contributor licence`;

const issueUrl = () => {
  const title = encodeURIComponent('[Resource] <name>');
  const body = encodeURIComponent(TEMPLATE);
  return `https://github.com/${REPO}/issues/new?title=${title}&body=${body}`;
};

export default function SubmitButtons() {
  const {t} = useLang();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <a className={styles.primary} href={issueUrl()} target="_blank" rel="noreferrer">
        {t('submit.open')}
      </a>
      <button type="button" className={styles.secondary} onClick={copy}>
        {copied ? t('submit.copied') : t('submit.copy')}
      </button>
    </div>
  );
}
