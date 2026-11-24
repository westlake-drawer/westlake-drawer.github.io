# Contributing to the Website Engine

For course/tool pages, images, categories, and local tabs, contribute to
[notes-index](https://github.com/westlake-drawer/notes-index), not this repository.

This repository owns the application and deployment system. Use Node.js 22 and
run `npm ci` before development. `npm start`, `npm test`, `npm run build`, and
`npm run sync:repositories` prepare the content checkout automatically.

## Content Boundary

`lib/content-source.mjs` defines the content repository and local checkout path.
The default checkout is `.content-source/`; `NOTES_CONTENT_DIR` overrides it.
Never assume content lives directly beside the application code.

Read documents, categories, and static assets from that source. Generated
snapshots remain in `src/data/`; API tokens exist only in the synchronization
environment and must never reach browser bundles.

`lib/docs-navigation.mjs` discovers root entries from content and adds native
generated pages for nested directories. Keep the same behavior for every root;
do not add section-specific navigation branches.

## Checks

```sh
npm test
npm run build
git diff --check
```

For changes involving actual content, set `NOTES_CONTENT_DIR` to a local content
repository and run the same checks. Check desktop/mobile, light/dark, URLs,
custom tabs, and keyboard behavior for affected user interfaces.

The lazy Git metadata strategy reads dates from the separate content repository.
Do not enable site-root-only eager Git metadata without accounting for that
boundary. CI fetches full content history only when a build is required.

## Deployment Changes

Keep manual publishing and the daily schedule. PRs validate but do not deploy.
Build planning must account for both repositories, including new/deleted content
and public repository statistics; freshness-only timestamps should not rebuild.

Do not save publication fingerprints before Pages succeeds. Before deploying,
verify that neither the application nor content branch has moved since checkout.
Keep the `force_build` and `refresh_repositories` recovery options.

For configuration or rendering changes, add focused regression tests. Preserve
content repository editing links and the root-domain `baseUrl: '/'`.
