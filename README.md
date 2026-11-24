# Westlake Drawer Website

**[Visit the website](https://westlake-drawer.github.io/)**

This repository owns the Docusaurus application, theme, rendering, repository
synchronization, tests, and GitHub Pages deployment.

Content is maintained separately in
**[westlake-drawer/notes-index](https://github.com/westlake-drawer/notes-index)**:
Markdown/MDX pages, category metadata, local repository tabs/TOCs, and static
images. Do not copy those files into this repository.

## Local Development

Use Node.js 22:

```sh
npm ci
npm start
```

The lifecycle hook clones public content into the ignored `.content-source/`
directory on first use. Open `http://localhost:3000/`. Subsequent commands reuse
that checkout without silently pulling over local edits.

To fetch newer content:

```sh
npm run content:update
```

To work with a separate local content checkout instead:

```sh
NOTES_CONTENT_DIR=../notes-index npm start
NOTES_CONTENT_DIR=../notes-index npm test
NOTES_CONTENT_DIR=../notes-index npm run build
```

See the content repository's [contribution guide](https://github.com/westlake-drawer/notes-index/blob/main/CONTRIBUTING.md)
and [content API](https://github.com/westlake-drawer/notes-index/blob/main/CONTENT_API.md)
for authoring and automatic navigation conventions.

## Publishing

Use **Actions > Build and Deploy Pages > Run workflow** on `main`, or wait for
the daily 03:23 UTC+8 run. Pushes to either repository do not automatically
publish. Daily runs refresh upstream repository information; unchanged effective
site inputs skip building and deployment.

The workflow checks out both repositories. Fingerprints include engine inputs
and content files, but exclude repository documentation and snapshot freshness
timestamps. It reuses npm, compilation, and repository-data caches. Publication
state is saved only after a successful deployment. Both branch revisions are
checked before publishing.

The Pages source must be **GitHub Actions** in this repository, with site
`baseUrl: '/'`. Content editing links continue to point to `notes-index`.

## Code Map

- `src/`: application, shared components, theme, and styles.
- `lib/`, `plugins/`: navigation, repository data, Markdown and LaTeX rendering.
- `scripts/`: content preparation, synchronization, and build planning.
- `tests/`: engine tests and integration checks against checked-out content.
- `.github/workflows/pages.yml`: validation, daily refresh, and publication.

## PDF Previews

A local repository tab's existing `source: {label, url}` declaration also supplies
a PDF preview tab, placed after TOC and before README. Grouped documents can
declare separate sources; repeated URLs are previewed once. Legacy `.toc.json`
outlines can supply their embedded `source` too. No PDF tab appears without a
declared source. Custom tab IDs must not use the reserved `pdf` identifier.

The PDF tab embeds the browser's native PDF reader without custom navigation
or rendering controls. Available controls depend on the browser. An open-in-new-tab
link remains available, including on browsers without an embedded PDF reader.
Multi-file selection survives refresh
via `?view=pdf&document=<document-scope>`.

At startup/build, `plugins/pdf-previews.mjs` caches public HTTPS PDFs under
`.cache/pdf-static/` and serves them from the site's own origin, avoiding GitHub
Release CORS/download restrictions. Sources must be actual PDFs, up to 32 MB.
The cache is reused for 24 hours, then revalidated using ETags; transient failures
retain a cached copy. A failed first download leaves an original-file link.
No PDF rendering library or CDN is needed.
Cached PDFs are ignored by Git. The preview does not convert PDF
contents into Markdown or recolor the document itself.

The repository retains the original site's commit history for traceability.
Generated compatibility pages redirect `/notes-index/...` to the corresponding
root-domain routes while preserving document-tab queries and heading fragments.
The former project Pages site must be disabled after the root site is verified
so it no longer shadows those compatibility paths.
