#!/usr/bin/env node
/**
 * Westlake Drawer MCP server.
 *
 * Exposes the site's resource index and curated learning paths to a local agent.
 * No network calls, no API keys: it reads the bundled snapshot in ./data.
 * The model stays on the user's side; this process only answers "where to look".
 */
import {createInterface} from 'node:readline';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const load = async (name) => JSON.parse(await readFile(path.join(here, 'data', name), 'utf8'));

const [index, pathsData] = await Promise.all([load('search-index.json'), load('paths.json')]);
const entries = index.entries ?? [];
const resources = Object.fromEntries(entries.map((entry) => [entry.url, entry]));
const paths = pathsData.paths ?? [];

const SITE = 'https://westlake-drawer.github.io';

const TOOLS = [
  {
    name: 'search_resources',
    description: 'Search course notes and tools indexed on Westlake Drawer. Returns title, URL, subject and course.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {type: 'string', description: 'Course, topic, tool name, or keyword'},
        limit: {type: 'number', description: 'Max results (default 8)'},
      },
      required: ['query'],
    },
  },
  {
    name: 'get_learning_path',
    description: 'Return a curated learning path for a goal such as "mathematics foundation", "analysis", "quantum mechanics", "AI tools".',
    inputSchema: {
      type: 'object',
      properties: {goal: {type: 'string', description: 'What the learner wants to do'}},
      required: ['goal'],
    },
  },
  {
    name: 'get_resource',
    description: 'Look up one resource by URL or title.',
    inputSchema: {
      type: 'object',
      properties: {key: {type: 'string', description: 'Site path such as /notes/math/calculus/ or a title'}},
      required: ['key'],
    },
  },
  {
    name: 'list_majors',
    description: 'List the majors and subjects covered by the index, with resource counts.',
    inputSchema: {type: 'object', properties: {}},
  },
];

function searchResources({query = '', limit = 8}) {
  const terms = String(query).toLowerCase().split(/\s+/).filter(Boolean);
  return entries
    .map((entry) => {
      const haystack = [entry.title, entry.description, entry.subject, entry.course, entry.repo, entry.path]
        .join(' ').toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return {entry, score};
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(Number(limit) || 8, 20))
    .map(({entry}) => ({
      title: entry.title,
      url: `${SITE}${entry.url}`,
      subject: entry.subject,
      course: entry.course,
      repo: entry.repo || undefined,
    }));
}

function getLearningPath({goal = ''}) {
  const text = String(goal).toLowerCase();
  const matched = paths
    .map((p) => ({p, score: p.keywords.reduce((t, k) => t + (text.includes(k.toLowerCase()) ? 1 : 0), 0)}))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.p);
  if (!matched.length) {
    return {found: false, hint: 'No curated path matched. Try search_resources, or say the index has nothing for this goal.'};
  }
  return {
    found: true,
    paths: matched.slice(0, 3).map((p) => ({
      title: p.title,
      summary: p.summary,
      steps: p.steps.map((step) => ({
        title: resources[step.url]?.title ?? step.url,
        url: `${SITE}${step.url}`,
        why: step.why,
      })),
    })),
  };
}

function getResource({key = ''}) {
  const needle = String(key).trim();
  const byUrl = resources[needle.endsWith('/') ? needle : `${needle}/`];
  if (byUrl) return {...byUrl, url: `${SITE}${byUrl.url}`};
  const found = entries.find((entry) => entry.title.toLowerCase() === needle.toLowerCase());
  return found ? {...found, url: `${SITE}${found.url}`} : {found: false, hint: 'Not in the index.'};
}

function listMajors() {
  const counts = {};
  for (const entry of entries) {
    const key = entry.subject || entry.course || entry.group;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return {majors: Object.entries(counts).map(([name, count]) => ({name, count})), total: entries.length};
}

const HANDLERS = {
  search_resources: searchResources,
  get_learning_path: getLearningPath,
  get_resource: getResource,
  list_majors: listMajors,
};

function reply(id, result) {
  process.stdout.write(JSON.stringify({jsonrpc: '2.0', id, result}) + '\n');
}
function fail(id, message) {
  process.stdout.write(JSON.stringify({jsonrpc: '2.0', id, error: {code: -32000, message}}) + '\n');
}

const rl = createInterface({input: process.stdin});
rl.on('line', (line) => {
  const text = line.trim();
  if (!text) return;
  let message;
  try {
    message = JSON.parse(text);
  } catch {
    return;
  }
  const {id, method, params} = message;
  if (method === 'initialize') {
    reply(id, {
      protocolVersion: params?.protocolVersion ?? '2024-11-05',
      capabilities: {tools: {}},
      serverInfo: {name: 'westlake-drawer-mcp', version: '0.1.0'},
    });
    return;
  }
  if (method === 'tools/list') {
    reply(id, {tools: TOOLS});
    return;
  }
  if (method === 'tools/call') {
    const name = params?.name;
    const handler = HANDLERS[name];
    if (!handler) return fail(id, `Unknown tool: ${name}`);
    try {
      const result = handler(params?.arguments ?? {});
      reply(id, {content: [{type: 'text', text: JSON.stringify(result, null, 2)}]});
    } catch (error) {
      fail(id, error.message);
    }
    return;
  }
  if (method === 'ping') return reply(id, {});
  if (id !== undefined) return fail(id, `Unsupported method: ${method}`);
});
