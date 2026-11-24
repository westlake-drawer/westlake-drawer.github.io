import test from 'node:test';
import assert from 'node:assert/strict';
import {compileOutline} from '../lib/course-outline.mjs';

const source = {label: 'PDF v1', url: 'https://example.com/notes.pdf'};
const compile = (changes = {}) => compileOutline(JSON.stringify({
  title: 'Table of Contents', source,
  entries: ['Foundations', {title: 'Dynamics', children: [
    'States', {title: 'Operators', children: ['Examples']},
  ]}],
  ...changes,
}), 'owner/repo', 'toc');

test('outline accepts title-only leaves and nested children without numbers or pages', () => {
  const {outline, toc, html} = compile();
  assert.equal(outline.chapters.length, 2);
  assert.deepEqual(outline.chapters[0].children, []);
  assert.deepEqual(outline.chapters[1].children[1], {
    title: 'Operators', children: [{title: 'Examples', children: []}],
  });
  assert.equal(outline.chapters[0].id, 'toc-owner-repo-foundations');
  assert.equal(outline.titleId, 'toc-owner-repo-table-of-contents');
  assert.deepEqual(outline.source, source);
  assert.equal(toc.length, 3);
  assert.equal(html, undefined);
});

test('outline rejects malformed JSON, empty titles, legacy fields, and invalid children', () => {
  assert.throws(() => compileOutline('{', 'owner/repo', 'toc'), /valid JSON/);
  for (const changes of [
    {title: ''}, {entries: []}, {entries: ['']}, {entries: [null]},
    {entries: [3]}, {entries: [{}]}, {entries: [{title: 'A', children: 'B'}]},
    {entries: [{title: 'A', number: '1'}]}, {entries: [{title: 'A', page: 1}]},
    {entries: [{title: 'A', titleHtml: '<img src=x onerror=alert(1)>'}]},
    {entries: [{title: 'A', children: [' ']}]},
  ]) assert.throws(() => compile(changes), /Invalid course outline/);
  let nested = 'Leaf';
  for (let i = 0; i < 22; i++) nested = {title: 'Parent', children: [nested]};
  assert.throws(() => compile({entries: [nested]}), /nesting exceeds/);
});

test('outline source is optional and source URLs must be safe HTTPS URLs', () => {
  assert.equal(compile({source: undefined}).outline.source, undefined);
  for (const changes of [
    {source: null}, {source: {...source, label: ''}},
    {source: {...source, url: 'javascript:alert(1)'}},
    {source: {...source, url: 'https://user:password@example.com/notes.pdf'}},
  ]) assert.throws(() => compile(changes), /Invalid course outline/);
});

test('outline escapes labels and generates unique anchors stable across reordering', () => {
  const {outline, toc} = compile({entries: ['<img src=x> & Notes', 'Topic', 'Topic']});
  assert.equal(outline.chapters[0].title, '<img src=x> & Notes');
  assert.equal(toc[1].value, '&lt;img src=x&gt; &amp; Notes');
  assert.equal(outline.chapters[1].id, 'toc-owner-repo-topic');
  assert.equal(outline.chapters[2].id, 'toc-owner-repo-topic-1');
  assert.equal(compile({entries: ['Dynamics', 'Foundations']}).outline.chapters[1].id,
    compile().outline.chapters[0].id);
});
