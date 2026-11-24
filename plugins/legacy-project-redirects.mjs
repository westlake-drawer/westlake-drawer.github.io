import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

export function redirectHtml(route) {
  const href = route.replace(/[&"<>]/g, (character) =>
    ({'&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;'}[character]));
  const target = JSON.stringify(route).replaceAll('<', '\\u003c');
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Page moved</title>`
    + `<link rel="canonical" href="https://westlake-drawer.github.io${href}">`
    + `<meta http-equiv="refresh" content="0;url=${href}">`
    + `<script>location.replace(${target}+location.search+location.hash)</script>`
    + `<a href="${href}">Continue to Westlake Noter</a></html>`;
}

export default function legacyProjectRedirects() {
  return {
    name: 'legacy-project-redirects',
    async postBuild({outDir, routesPaths}) {
      await Promise.all(routesPaths.filter((route) => route.startsWith('/') && route.endsWith('/')
        && !route.startsWith('/notes-index/')).map(async (route) => {
        const directory = path.join(outDir, 'notes-index', route.slice(1));
        await mkdir(directory, {recursive: true});
        await writeFile(path.join(directory, 'index.html'), redirectHtml(route));
      }));
    },
  };
}
