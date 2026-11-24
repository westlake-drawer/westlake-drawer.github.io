import {useEffect} from 'react';
import {useHistory, useLocation} from '@docusaurus/router';
import useIsBrowser from '@docusaurus/useIsBrowser';
import snapshot from '@site/src/data/repository-documents.json';
import {getDocumentViews, resolveDocumentView, resolveCustomDocument} from './documents.mjs';

export default function useRepositoryDocument(repositories, customDocuments = []) {
  const history = useHistory();
  const location = useLocation();
  const isBrowser = useIsBrowser();
  const views = getDocumentViews(customDocuments);
  // Static pages have no query string; keep the initial hydration identical.
  const {view, repository} = resolveDocumentView(
    repositories, isBrowser ? location.search : '', isBrowser ? location.hash : '', views,
  );
  const {documentData: customDocument, documents, selectedDocument} = resolveCustomDocument(
    customDocuments, view, isBrowser ? location.search : '', isBrowser ? location.hash : '',
  );
  useEffect(() => {
    if (!isBrowser || view === 'overview' || !location.hash) return undefined;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return undefined; }
    // Query-selected headings do not exist in the static Overview HTML.
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [isBrowser, view, repository, selectedDocument, location.hash]);
  const select = (nextView, nextRepository = repository, nextDocument) => {
    const search = new URLSearchParams(location.search);
    search.delete('view');
    search.delete('repo');
    search.delete('document');
    if (nextView !== 'overview') {
      search.set('view', nextView);
      search.set('repo', nextRepository);
      if (nextDocument) search.set('document', nextDocument);
    }
    history.replace({...location, search: search.toString() ? `?${search}` : '', hash: ''});
  };
  return {
    view, views, repository,
    documents, selectedDocument,
    documentData: customDocument
      ?? (view === 'readme' ? snapshot.repositories[repository]
        : snapshot.repositories[repository]?.documents?.[view]),
    selectView: (value) => select(value),
    selectRepository: (value) => select(view, value),
    selectDocument: (value) => select(view, repository, value),
  };
}
