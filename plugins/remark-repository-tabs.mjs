import {renderReadme} from '../lib/github/documents.mjs';
import {documentViews} from '../src/features/repositories/documents.mjs';
import {compileOutline, compileLatexOutline, validatePdfSource} from '../lib/course-outline.mjs';

const validId = (id) => typeof id === 'string' && /^[a-z][a-z0-9-]*$/.test(id);
const validLabel = (label) => typeof label === 'string' && Boolean(label.trim());
const invalid = (message) => { throw new Error(`Invalid repositoryTabs entry: ${message}`); };

export default function remarkRepositoryTabs({sources = {}, baseUrl = '/', sourceBase} = {}) {
  const renderDocument = async (document, scope, repository) => {
    if (typeof document.file !== 'string' || !Object.hasOwn(sources, document.file)
      || !/^content\/repository-tabs\/.+\.(?:md|toc|toc\.json)$/.test(document.file)
      || document.file.split('/').includes('..') || document.layout !== undefined) {
      invalid('use an existing .md, .toc, or .toc.json file under content/repository-tabs/; omit layout');
    }
    validatePdfSource(document.source);
    const source = {
      markdown: sources[document.file], path: document.file,
      sourceUrl: sourceBase ? new URL(document.file, sourceBase).href : undefined,
      siteBaseUrl: baseUrl,
    };
    const rendered = document.file.endsWith('.toc')
      ? compileLatexOutline(source.markdown, repository, scope, document.source)
      : document.file.endsWith('.toc.json')
        ? compileOutline(source.markdown, repository, scope)
        : await renderReadme(source, repository, scope);
    return {
      id: document.id, label: document.label.trim(), scope, path: document.file,
      sourceUrl: source.sourceUrl, pdfSource: document.source, local: true, status: 'ready',
      ...rendered,
    };
  };
  return async (_tree, file) => {
    const frontMatter = file.data.frontMatter;
    const tabs = frontMatter.repositoryTabs ?? [];
    if (!Array.isArray(tabs)) throw new Error('repositoryTabs must be an array');
    if (tabs.length && !frontMatter.githubRepositories?.length) {
      throw new Error('repositoryTabs requires a page linking to a GitHub repository');
    }
    const ids = new Set(documentViews.map(({value}) => value));
    for (const tab of tabs) {
      if (!tab || !validId(tab.id) || ids.has(tab.id) || !validLabel(tab.label)
        || tab.layout !== undefined) invalid('use a unique id and nonempty label; omit layout');
      ids.add(tab.id);
    }
    const scopes = new Set(ids);
    frontMatter.repositoryTabDocuments = [];
    for (const tab of tabs) {
      if (tab.documents === undefined) {
        frontMatter.repositoryTabDocuments.push(
          await renderDocument(tab, tab.id, frontMatter.githubRepositories[0]),
        );
        continue;
      }
      if (tab.file !== undefined || tab.source !== undefined
        || !Array.isArray(tab.documents) || !tab.documents.length) {
        invalid('choose either file/source or a nonempty documents list');
      }
      const documents = [];
      for (const document of tab.documents) {
        if (!document || !validId(document.id) || !validLabel(document.label)
          || document.documents !== undefined) invalid('documents need unique ids, labels, and files; nesting is not supported');
        const scope = `${tab.id}--${document.id}`;
        if (scopes.has(scope)) invalid(`duplicate document id or anchor scope: ${scope}`);
        scopes.add(scope);
        documents.push(await renderDocument(document, scope, frontMatter.githubRepositories[0]));
      }
      frontMatter.repositoryTabDocuments.push({
        id: tab.id, label: tab.label.trim(), documents,
      });
    }
  };
}
