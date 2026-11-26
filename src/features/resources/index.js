import React from 'react';
import {useLocation} from '@docusaurus/router';
import resources from '@site/src/data/resources.json';
import releases from '@site/src/data/releases.json';

const withSlash = (pathname) => (pathname.endsWith('/') ? pathname : `${pathname}/`);

export function RepoVersion({repo}) {
  return <span>{releases[repo]?.tag ?? 'unreleased'}</span>;
}

export default function ResourceFacts() {
  const {pathname} = useLocation();
  const facts = resources[withSlash(pathname)];
  if (!facts) return null;
  const chips = [facts.group, facts.subject, facts.course].filter(Boolean);
  return (
    <div className="repo-meta">
      {chips.map((chip) => (
        <span key={chip}>{chip}</span>
      ))}
      {facts.repo && (
        <span>
          <a href={`https://github.com/${facts.repo}`} target="_blank" rel="noreferrer">
            {facts.repo}
          </a>
        </span>
      )}
      {releases[facts.repo]?.tag && <span>{releases[facts.repo].tag}</span>}
    </div>
  );
}
