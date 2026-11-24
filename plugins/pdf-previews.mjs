import {mkdirSync} from 'node:fs';
import {readFile, readdir, rm} from 'node:fs/promises';
import path from 'node:path';
import {DEFAULT_PARSE_FRONT_MATTER} from '@docusaurus/utils';
import {contentRoot} from '../lib/content-source.mjs';
import {cachePdf} from '../lib/pdf-previews.mjs';

export default function pdfPreviews(context) {
  const directory = path.join(context.siteDir, '.cache/pdf-static');
  mkdirSync(directory, {recursive: true});
  return {
    name: 'pdf-previews',
    getPathsToWatch() {
      return [path.join(contentRoot, 'docs/**/*.{md,mdx}'), path.join(contentRoot, 'content/**/*.toc.json')];
    },
    async loadContent() {
      const sources = new Map();
      const add = (source) => { if (source?.url) sources.set(source.url, source); };
      const docs = path.join(contentRoot, 'docs');
      for (const relative of await readdir(docs, {recursive: true})) {
        if (!/\.mdx?$/.test(relative)) continue;
        const filePath = path.join(docs, relative);
        const {frontMatter} = await DEFAULT_PARSE_FRONT_MATTER({
          filePath, fileContent: await readFile(filePath, 'utf8'),
        });
        for (const tab of frontMatter.repositoryTabs ?? []) {
          for (const document of tab.documents ?? [tab]) {
            add(document.source);
          }
        }
      }
      const tabs = path.join(contentRoot, 'content/repository-tabs');
      const entries = await readdir(tabs, {recursive: true}).catch((error) => {
        if (error.code === 'ENOENT') return [];
        throw error;
      });
      for (const relative of entries.filter((name) => name.endsWith('.toc.json'))) {
        add(JSON.parse(await readFile(path.join(tabs, relative), 'utf8')).source);
      }
      const assets = {};
      await rm(path.join(directory, 'pdfjs'), {recursive: true, force: true});
      for (const source of sources.values()) {
        try {
          assets[source.url] = `${context.baseUrl}${await cachePdf(source, directory)}`;
        } catch (error) {
          console.warn(`[PDF preview] ${source.url}: ${error.message}`);
        }
      }
      return assets;
    },
    contentLoaded({content, actions}) {
      actions.setGlobalData(content);
    },
  };
}
