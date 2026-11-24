import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {repositoriesFromMarkdown} from '../lib/github/repositories.mjs';
import {sortSidebarByStars} from '../lib/sidebar-stars.mjs';
import {withGeneratedCategoryLinks} from '../lib/docs-navigation.mjs';

const defaultSnapshotPath = new URL('../src/data/repository-contributors.json', import.meta.url);

export default function createStarSortedSidebarGenerator({snapshotPath = defaultSnapshotPath} = {}) {
  return async (args) => {
    const items = await args.defaultSidebarItemsGenerator(withGeneratedCategoryLinks(args));
    const directory = args.item.dirName;

    const docs = args.docs.filter((doc) =>
      directory === '.' || doc.sourceDirName === directory || doc.sourceDirName.startsWith(`${directory}/`));
    const documentRepositories = new Map(await Promise.all(docs.map(async (doc) => {
      const filename = path.join(args.version.contentPath, doc.sourceDirName,
        path.posix.basename(doc.source));
      return [doc.id, repositoriesFromMarkdown(await readFile(filename, 'utf8'))];
    })));
    const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
    const pinnedIds = new Set(docs.filter((doc) => {
      const {name: fileName, ext: extension} = path.posix.parse(doc.source);
      return doc.sourceDirName === directory && args.isCategoryIndex({
        fileName, extension, directories: doc.sourceDirName.split('/').reverse(),
      });
    }).map(({id}) => id));
    const documentLabels = new Map(docs.map((doc) =>
      [doc.id, doc.frontMatter?.sidebar_label ?? doc.title ?? doc.id]));
    return sortSidebarByStars(items, documentRepositories, snapshot.repositories ?? {},
      pinnedIds, documentLabels);
  };
}
