import {repositoriesFromTree} from '../lib/github/repositories.mjs';

// Legal pages and subject landing pages link to GitHub only for convenience;
// they are not repository pages, so no README tabs or repository cards.
const NON_REPOSITORY_SECTIONS = ['/docs/legal/'];
const NON_REPOSITORY_PAGES = [/\/docs\/notes\/[^/]+\/index\.mdx?$/];

export default function remarkRepositoryContributors() {
  return (tree, file) => {
    const normalized = (file.path ?? '').split(String.fromCharCode(92)).join('/');
    if (
      NON_REPOSITORY_SECTIONS.some((section) => normalized.includes(section)) ||
      NON_REPOSITORY_PAGES.some((pattern) => pattern.test(normalized))
    ) {
      delete file.data.frontMatter.githubRepositories;
      file.data.frontMatter.repositoryTabs = [];
      return;
    }
    const repositories = repositoriesFromTree(tree);
    file.data.frontMatter.githubRepositories = repositories;
  };
}
