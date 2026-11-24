import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLatexToc} from '../lib/latex-toc.mjs';
import {compileLatexOutline} from '../lib/course-outline.mjs';

test('reads three- and four-argument records preserving original numbering and page labels', () => {
  const entries = parseLatexToc(String.raw`
\contentsline {section}{\numberline {IX}Foundations}{vii}
\contentsline {subsection}{\numberline {IX.a}States}{99}{subsection.9.1}%
\contentsline {subsubsection}{Examples}{100}{example}
\contentsline {section}{Dynamics}{101}{section.10}
`);
  assert.deepEqual(entries, [
    {title: 'Foundations', number: 'IX', page: 'vii', children: [
      {title: 'States', number: 'IX.a', page: '99', children: [
        {title: 'Examples', page: '100', children: []},
      ]},
    ]},
    {title: 'Dynamics', page: '101', children: []},
  ]);
});

test('supports book/article levels, skipped levels, unnumbered entries, and repeated titles', () => {
  const text = String.raw`
\contentsline{part}{Basics}{I}
\contentsline{chapter}{First}{1}
\contentsline{section}{Topic}{2}
\contentsline{paragraph}{Details}{3}
\contentsline{subparagraph}{More}{4}
\contentsline{chapter}{Second}{5}
\contentsline{part}{Basics}{II}
`;
  const {outline, toc} = compileLatexOutline(text, 'owner/repo', 'toc');
  assert.equal(outline.chapters.length, 2);
  assert.equal(outline.chapters[0].children.length, 2);
  assert.equal(outline.chapters[0].children[0].children[0].children[0].children[0].title, 'More');
  assert.equal(outline.chapters[1].id, 'toc-owner-repo-basics-1');
  assert.equal(toc.length, 3);
});

test('handles nested braces, font commands, accents, escaped characters, comments, and multiline records', () => {
  const [entry] = parseLatexToc(String.raw`
\contentsline
 {section}
 {\protect\numberline{1}{\small Schr\"odinger}: \textbf{Bra \& Ket} and \emph{States} \% \# \_}
 {1}{section.1}% trailing comment
`);
  assert.equal(entry.title, 'Schrödinger: Bra & Ket and States % # _');
  assert.equal(entry.number, '1');
  assert.equal(entry.page, '1');
  const [quotes] = parseLatexToc(String.raw`\contentsline{section}{Dirac\textquotesingle s Notation}{1}`);
  assert.equal(quotes.title, "Dirac's Notation");
});

test('renders math with KaTeX and uses texorpdfstring fallback without expanding arbitrary macros', () => {
  const [math, fallback] = parseLatexToc(String.raw`
\contentsline{section}{States $|\psi\rangle$ and \ensuremath{\alpha_1}}{1}
\contentsline{section}{\texorpdfstring{\custommacro{bad}}{Plain title}}{2}
`);
  assert.match(math.titleHtml, /class="katex"/);
  assert.match(math.titleHtml, /States/);
  assert.equal(fallback.title, 'Plain title');
  const {toc} = compileLatexOutline(String.raw`\contentsline{section}{Energy $E$}{1}`, 'o/r', 'toc');
  assert.match(toc[1].value, /class="katex"/);
});

test('does not execute input, file, or shell commands and safely escapes HTML in math titles', () => {
  const entries = parseLatexToc(String.raw`
\input{/not/a/real/file}
\write18{touch /tmp/never-executed}
\contentsline{section}{<img src=x onerror=alert(1)> $x$}{1}{ignored}
`);
  assert.equal(entries.length, 1);
  assert.match(entries[0].titleHtml, /&lt;img/);
  assert.doesNotMatch(entries[0].titleHtml, /<img/);
  assert.throws(() => parseLatexToc(String.raw`\contentsline{section}{\input{secret}}{1}`),
    /unsupported title command \\input/);
  assert.throws(() => parseLatexToc(String.raw`\contentsline{section}{Title}{\input{page}}`),
    /unsupported title command \\input/);
});

test('compiled outlines keep appendix labels, blank pages, and stable anchors without renumbering', () => {
  const compile = (number, page) => compileLatexOutline(
    `\\contentsline{section}{\\numberline{${number}}Appendix}{${page}}`, 'owner/repo', 'toc');
  const first = compile('A.2', 'xii');
  const changed = compile('B.4', 'A-3');
  assert.equal(first.outline.chapters[0].number, 'A.2');
  assert.equal(first.outline.chapters[0].page, 'xii');
  assert.equal(first.toc[1].value, 'A.2 Appendix');
  assert.equal(changed.outline.chapters[0].page, 'A-3');
  assert.equal(first.outline.chapters[0].id, changed.outline.chapters[0].id);
  assert.equal(compile('', '').outline.chapters[0].page, '');
  const escaped = compile('<img>', '1');
  assert.equal(escaped.toc[1].value, '&lt;img&gt; Appendix');
});

test('reports empty, malformed, unsupported, and unsafe sources rather than silently losing topics', () => {
  for (const text of [
    '', '\\relax', '\\contentsline{section}{Broken',
    '\\contentsline{section}{Only title}', '\\contentsline{section}{}{1}',
    '\\contentsline{custom}{Topic}{1}', '\\contentsline{section}{\\unknown{Topic}}{1}',
  ]) assert.throws(() => parseLatexToc(text), /Invalid LaTeX TOC/);
  assert.throws(() => compileLatexOutline('\\contentsline{section}{Topic}{1}', 'o/r', 'toc',
    {label: 'Source', url: 'javascript:alert(1)'}), /Invalid course outline/);
});
