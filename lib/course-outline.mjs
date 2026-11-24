import GithubSlugger from 'github-slugger';
import {parseLatexToc} from './latex-toc.mjs';

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

export function validatePdfSource(source) {
  if (source === undefined) return;
  const invalid = (message) => { throw new Error(`Invalid course outline: ${message}`); };
  if (!source || typeof source.label !== 'string' || !source.label.trim()
    || typeof source.url !== 'string') invalid('source needs a label and HTTPS url');
  let url;
  try { url = new URL(source.url); } catch { invalid('source URL is invalid'); }
  if (url.protocol !== 'https:' || url.username || url.password) invalid('source URL must use HTTPS without credentials');
}

export function compileOutline(text, repository, tabId) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Invalid course outline: expected valid JSON'); }
  return buildOutline(data, repository, tabId);
}

export function compileLatexOutline(text, repository, tabId, source) {
  return buildOutline({title: 'Table of Contents', source, entries: parseLatexToc(text)},
    repository, tabId, true);
}

function buildOutline(data, repository, tabId, richTitles = false) {
  const invalid = (message) => { throw new Error(`Invalid course outline: ${message}`); };
  if (!data || typeof data.title !== 'string' || !data.title.trim()
    || !Array.isArray(data.entries) || !data.entries.length) invalid('provide a title and entries');
  validatePdfSource(data.source);
  const slugger = new GithubSlugger();
  const id = (title) => `${tabId}-${repository.replaceAll('/', '-')}-${slugger.slug(title)}`;
  const titleId = id(data.title);
  const toc = [{id: titleId, value: escapeHtml(data.title), level: 1}];
  const normalize = (entry, depth = 0) => {
    if (depth > 20) invalid('outline nesting exceeds 20 levels');
    const title = typeof entry === 'string' ? entry : entry?.title;
    if (typeof title !== 'string' || !title.trim()) invalid('entries need a nonempty title');
    const allowed = richTitles ? ['title', 'children', 'titleHtml', 'number', 'page'] : ['title', 'children'];
    if (typeof entry !== 'string' && Object.keys(entry).some((key) => !allowed.includes(key))) {
      invalid('entries accept only title and children');
    }
    const children = typeof entry === 'string' ? [] : entry.children ?? [];
    if (!Array.isArray(children)) invalid('children must be a list');
    return {
      title: title.trim(), children: children.map((child) => normalize(child, depth + 1)),
      ...(richTitles && entry.titleHtml ? {titleHtml: entry.titleHtml} : {}),
      ...(richTitles && entry.number !== undefined ? {number: entry.number} : {}),
      ...(richTitles && entry.page !== undefined ? {page: entry.page} : {}),
    };
  };
  const chapters = data.entries.map((entry) => {
    const chapter = normalize(entry);
    chapter.id = id(chapter.title);
    const label = `${chapter.number ? `${escapeHtml(chapter.number)} ` : ''}${chapter.titleHtml ?? escapeHtml(chapter.title)}`;
    toc.push({id: chapter.id, value: label, level: 2});
    return chapter;
  });
  return {
    outline: {title: data.title.trim(), titleId, source: data.source, chapters},
    toc,
  };
}
