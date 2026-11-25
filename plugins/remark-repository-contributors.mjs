import {repositoriesFromTree} from '../lib/github/repositories.mjs';

// Legal pages link to GitHub for convenience; they are not repository pages,
// so no README tabs or repository cards should be generated for them.
const NON_REPOSITORY_SECTIONS = ['/docs/legal/'];

export default function remarkRepositoryContributors() {
  return (tree, file) => {
    const normalized = (file.path ?? '').split(String.fromCharCode(92)).join('/');
    if (NON_REPOSITORY_SECTIONS.some((section) => normalized.includes(section))) {
      delete file.data.frontMatter.githubRepositories;
      file.data.frontMatter.repositoryTabs = [];
      return;
    }
    const repositories = repositoriesFromTree(tree);
    file.data.frontMatter.githubRepositories = repositories;
  };
}
