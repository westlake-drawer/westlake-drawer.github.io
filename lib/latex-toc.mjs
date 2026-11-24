import {parseMinimal} from '@unified-latex/unified-latex-util-parse';
import {printRaw} from '@unified-latex/unified-latex-util-print-raw';
import katex from 'katex';

const levels = ['part', 'chapter', 'section', 'subsection', 'subsubsection', 'paragraph', 'subparagraph'];
const ignored = new Set([
  'protect', 'ignorespaces', 'relax', 'normalfont', 'normalcolor', 'bfseries',
  'mdseries', 'itshape', 'slshape', 'scshape', 'upshape', 'rmfamily', 'sffamily',
  'ttfamily', 'tiny', 'scriptsize', 'footnotesize', 'small', 'normalsize',
  'large', 'Large', 'LARGE', 'huge', 'Huge',
]);
const wrappers = new Set([
  'textbf', 'textmd', 'textit', 'textsl', 'textsc', 'textup', 'textrm',
  'textsf', 'texttt', 'textnormal', 'emph', 'mbox', 'MakeUppercase', 'MakeLowercase',
]);
const symbols = {
  '&': '&', '%': '%', '#': '#', '_': '_', '$': '$', '{': '{', '}': '}',
  ' ': ' ', ',': ' ', ';': ' ', ':': ' ', '!': '', '\\': ' ',
  quad: ' ', qquad: ' ', enspace: ' ', nobreakspace: ' ',
  textquotesingle: "'", textquoteright: "'", textquoteleft: "'",
  textquotedblleft: '"', textquotedblright: '"', textendash: '\u2013',
  textemdash: '\u2014', textbackslash: '\\', textasciitilde: '~',
  LaTeX: 'LaTeX', TeX: 'TeX', oe: '\u0153', OE: '\u0152', ae: '\u00e6',
  AE: '\u00c6', aa: '\u00e5', AA: '\u00c5', ss: '\u00df', o: '\u00f8', O: '\u00d8',
};
const accents = {
  '"': '\u0308', "'": '\u0301', '`': '\u0300', '^': '\u0302', '~': '\u0303',
  '=': '\u0304', '.': '\u0307', c: '\u0327', v: '\u030c', u: '\u0306', H: '\u030b',
};
const escapeHtml = (value) => value.replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);
const insignificant = (node) => ['whitespace', 'parbreak', 'comment'].includes(node?.type);
const invalid = (message) => { throw new Error(`Invalid LaTeX TOC: ${message}`); };

function readTitle(nodes) {
  let title = '';
  let html = '';
  let hasMath = false;
  let number;
  const append = (value) => { title += value; html += escapeHtml(value); };
  const appendTitle = (value) => {
    title += value.title; html += value.titleHtml ?? escapeHtml(value.title);
    hasMath ||= value.titleHtml !== undefined;
    if (value.number !== undefined) number = value.number;
  };
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const argument = () => {
      while (insignificant(nodes[i + 1])) i++;
      const next = nodes[++i];
      if (next?.type !== 'group') invalid(`expected a braced argument after \\${node.content}`);
      return next.content;
    };
    const math = (content) => {
      const tex = printRaw(content);
      title += `$${tex}$`;
      html += katex.renderToString(tex, {throwOnError: true, trust: false, strict: 'ignore'});
      hasMath = true;
    };
    if (node.type === 'string') append(node.content.replaceAll('~', ' '));
    else if (node.type === 'whitespace' || node.type === 'parbreak') append(' ');
    else if (node.type === 'group') appendTitle(readTitle(node.content));
    else if (node.type === 'inlinemath' || node.type === 'displaymath') math(node.content);
    else if (node.type === 'comment') continue;
    else if (node.type === 'macro') {
      const name = node.content;
      // A control word's terminating space is a delimiter, not visible text.
      if (/^[A-Za-z]+$/.test(name) && nodes[i + 1]?.type === 'whitespace') i++;
      if (name === 'numberline') number = readTitle(argument()).title;
      else if (name === 'texorpdfstring') { argument(); appendTitle(readTitle(argument())); }
      else if (name === 'ensuremath') math(argument());
      else if (wrappers.has(name)) appendTitle(readTitle(argument()));
      else if (Object.hasOwn(accents, name)) {
        while (insignificant(nodes[i + 1])) i++;
        const next = nodes[++i];
        const value = next?.type === 'group' ? readTitle(next.content).title : next?.content;
        if (!value || next.type === 'macro') invalid(`unsupported accent argument after \\${name}`);
        const [first, ...rest] = value;
        append((first + accents[name]).normalize('NFC') + rest.join(''));
      } else if (Object.hasOwn(symbols, name)) append(symbols[name]);
      else if (!ignored.has(name)) invalid(`unsupported title command \\${name}; use a plain short title or \\texorpdfstring in the original TeX source`);
    } else invalid(`unsupported title node ${node.type}`);
  }
  title = title.replace(/\s+/g, ' ').trim();
  return {
    title, ...(number !== undefined ? {number} : {}),
    ...(hasMath ? {titleHtml: html.trim()} : {}),
  };
}

export function parseLatexToc(text) {
  let nodes;
  try { nodes = parseMinimal(text).content; } catch (error) {
    invalid(`cannot parse file: ${error.message}`);
  }
  const entries = [];
  const stack = [];
  // Only inspect top-level contentsline records. Never execute TeX or follow input commands.
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].type !== 'macro' || nodes[i].content !== 'contentsline') continue;
    const argument = () => {
      while (insignificant(nodes[i + 1])) i++;
      const next = nodes[++i];
      if (next?.type !== 'group') invalid('contentsline requires type, title, and page groups');
      return next.content;
    };
    const kind = printRaw(argument()).trim();
    const titleNodes = argument();
    const page = readTitle(argument()).title;
    const level = levels.indexOf(kind);
    if (level < 0) invalid(`unsupported heading type ${kind}`);
    const entry = {...readTitle(titleNodes), page, children: []};
    if (!entry.title) invalid('heading title is empty');
    while (stack.length && stack.at(-1).level >= level) stack.pop();
    (stack.at(-1)?.entry.children ?? entries).push(entry);
    stack.push({level, entry});
  }
  if (!entries.length) invalid('no contentsline headings found; compile the original document with its table of contents enabled');
  return entries;
}
