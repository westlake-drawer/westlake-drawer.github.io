import React, {useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import {paths} from '@site/src/data/paths.json';
import resources from '@site/src/data/resources.json';
import styles from './styles.module.css';

const titleOf = (url) => resources[url]?.title ?? url;

function matchPaths(goal) {
  const text = goal.trim().toLowerCase();
  if (!text) return [];
  return paths
    .map((path) => ({
      path,
      score: path.keywords.reduce((total, keyword) => total + (text.includes(keyword.toLowerCase()) ? 1 : 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.path);
}

function matchResources(goal) {
  const terms = goal.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return Object.entries(resources)
    .map(([url, item]) => {
      const haystack = [item.title, item.subject, item.course].join(' ').toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return {url, item, score};
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function PathFinder() {
  const [goal, setGoal] = useState('');
  const [submitted, setSubmitted] = useState('');

  const suggested = useMemo(() => matchPaths(submitted), [submitted]);
  const fallback = useMemo(() => (suggested.length ? [] : matchResources(submitted)), [suggested, submitted]);

  return (
    <div className={styles.guide}>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(goal);
        }}
      >
        <input
          className={styles.input}
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="e.g. I want to build a mathematics foundation"
          aria-label="Describe what you want to learn"
        />
        <button className={styles.button} type="submit">Get a path</button>
      </form>

      {!submitted && (
        <div className={styles.chips}>
          {paths.map((path) => (
            <button
              key={path.id}
              type="button"
              className={styles.chip}
              onClick={() => {
                setGoal(path.keywords[0]);
                setSubmitted(path.keywords[0]);
              }}
            >
              {path.title}
            </button>
          ))}
        </div>
      )}

      {submitted && suggested.length === 0 && fallback.length === 0 && (
        <p className={styles.empty}>
          No path matched. Try different wording, or browse <Link to="/explore/">Explore</Link> directly.
        </p>
      )}

      {suggested.map((path) => (
        <section key={path.id} className={styles.path}>
          <h3 className={styles.pathTitle}>{path.title}</h3>
          <p className={styles.summary}>{path.summary}</p>
          <ol className={styles.steps}>
            {path.steps.map((step) => (
              <li key={step.url} className={styles.step}>
                <Link className={styles.stepTitle} to={step.url}>{titleOf(step.url)}</Link>
                <span className={styles.stepWhy}>{step.why}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {submitted && suggested.length === 0 && fallback.length > 0 && (
        <section className={styles.path}>
          <h3 className={styles.pathTitle}>Maybe related</h3>
          <p className={styles.summary}>No ready-made path, but these are closest to what you described.</p>
          <ol className={styles.steps}>
            {fallback.map(({url, item}) => (
              <li key={url} className={styles.step}>
                <Link className={styles.stepTitle} to={url}>{item.title}</Link>
                <span className={styles.stepWhy}>{[item.group, item.subject, item.course].filter(Boolean).join(' · ')}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

const MAJORS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biological Sciences', 'Materials Science',
  'Electronic Information', 'Artificial Intelligence', 'Clinical Medicine', 'Other / general',
];
const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate', 'Any'];

function buildPrompt({major, year, goal}) {
  const items = Object.entries(resources)
    .filter(([, item]) => major === 'Other / general' || item.subject === major)
    .map(([url, item]) => `- ${item.title} | https://westlake-drawer.github.io${url} | ${[item.subject, item.course].filter(Boolean).join(' · ')}`);
  const list = items.length ? items.join('\n') : '(no indexed resources in this area yet)';
  return `You are helping me plan my study. You are not teaching me the material.

About me: Westlake University, ${year === 'Any' ? 'no fixed year' : year}, studying ${major}.
What I want: ${goal || 'a sensible entry point into this subject'}.

Resources I have on Westlake Drawer (use only these; title | link | subject · course):
${list}

Do this:
1. Choose 3 to 5 items from the list that form a sensible order for my goal.
2. For each, write one sentence explaining why it comes at that point.

Rules:
- Do not explain the course content, derive anything, or summarise the notes.
- Do not add resources, links, or courses that are not in the list above.
- If the list cannot serve my goal, say so in one sentence and stop.

Output: a numbered list where each item is "Title — link — one-sentence reason".`;
}

export function PromptBuilder() {
  const [major, setMajor] = useState(MAJORS[0]);
  const [year, setYear] = useState('Year 2');
  const [goal, setGoal] = useState('');
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(() => buildPrompt({major, year, goal}), [major, year, goal]);
  const count = useMemo(
    () => Object.values(resources).filter((item) => major === 'Other / general' || item.subject === major).length,
    [major]
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className={styles.builder}>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span>Direction</span>
          <select value={major} onChange={(event) => setMajor(event.target.value)}>
            {MAJORS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span>Year</span>
          <select value={year} onChange={(event) => setYear(event.target.value)}>
            {YEARS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className={`${styles.field} ${styles.wide}`}>
          <span>Goal</span>
          <input
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="e.g. build a maths foundation from zero"
          />
        </label>
      </div>
      <div className={styles.copyRow}>
        <button type="button" className={styles.button} onClick={copy}>
          {copied ? 'Copied' : 'Copy prompt'}
        </button>
        <span className={styles.copyNote}>
          {count} {count === 1 ? 'resource' : 'resources'} included · paste it into the assistant you already use
        </span>
      </div>
    </section>
  );
}

export default PathFinder;
