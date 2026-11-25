import { themes as prismThemes } from 'prism-react-renderer';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkRepositoryContributors from './plugins/remark-repository-contributors.mjs';
import remarkRepositoryTabs from './plugins/remark-repository-tabs.mjs';
import {loadLocalTabSources} from './lib/local-repository-tabs.mjs';
import createStarSortedSidebarGenerator from './plugins/sidebar-stars.mjs';
import {discoverDocSections, sectionNavbarItems} from './lib/docs-navigation.mjs';
import path from 'node:path';
import {contentRoot, contentRepository, siteRoot} from './lib/content-source.mjs';
import legacyProjectRedirects from './plugins/legacy-project-redirects.mjs';
import pdfPreviews from './plugins/pdf-previews.mjs';

const sections = discoverDocSections();
// Legal pages live in the footer, not the top navigation.
const navSections = sections
  .filter(({directory}) => directory !== 'legal')
  .sort((a, b) => (a.directory === 'explore' ? -1 : b.directory === 'explore' ? 1 : 0));
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Westlake Drawer',
  tagline: 'Course Notes Index',
  favicon: 'img/westlake-logo.svg',
  url: 'https://westlake-drawer.github.io',
  baseUrl: '/',
  organizationName: 'westlake-drawer',
  projectName: 'westlake-drawer.github.io',
  staticDirectories: [path.join(siteRoot, 'static'), path.join(contentRoot, 'static'), '.cache/pdf-static'],
  onBrokenLinks: 'throw',
  future: {
    faster: {
      swcJsLoader: true,
      swcJsMinimizer: true,
      swcHtmlMinimizer: true,
      lightningCssMinimizer: true,
      mdxCrossCompilerCache: true,
      gitEagerVcs: false,
    },
  },
  markdown: {
    mermaid: true,
    hooks: { onBrokenMarkdownLinks: 'throw' },
  },
  trailingSlash: true,
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          path: path.join(contentRoot, 'docs'),
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          sidebarItemsGenerator: createStarSortedSidebarGenerator(),
          breadcrumbs: true,
          editUrl: ({docPath}) => `https://github.com/${contentRepository}/edit/main/docs/${docPath}`,
          showLastUpdateTime: true,
          remarkPlugins: [
            remarkMath,
            remarkRepositoryContributors,
            [remarkRepositoryTabs, {
              sources: loadLocalTabSources(),
              baseUrl: '/',
              sourceBase: 'https://github.com/westlake-drawer/notes-index/blob/main/',
            }],
          ],
          rehypePlugins: [rehypeKatex],
        },
        blog: false,
        theme: {
          customCss: ['./src/css/custom.css', './src/css/glass.css'],
        },
      },
    ],
  ],
  themes: ['@docusaurus/theme-mermaid'],
  plugins: [legacyProjectRedirects, pdfPreviews],
  themeConfig: {
    mermaid: {
      theme: { light: 'neutral', dark: 'dark' },
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Westlake Drawer',
      logo: {
        alt: 'Westlake Drawer',
        src: 'img/westlake-logo.svg',
      },
      items: [
        ...sectionNavbarItems(navSections),
        {
          type: 'custom-expandNavigation',
          position: 'right',
        },
        {
          href: 'https://github.com/westlake-drawer/notes-index',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      links: [
        {
          title: 'Index',
          items: [
            ...navSections.map(({directory, label}) => ({to: `/${directory}`, label})),
          ],
        },
        {
          title: 'Legal',
          items: [
            {label: 'Legal & Safety', to: '/legal'},
            {label: 'Terms of Use', to: '/legal/terms'},
            {label: 'Privacy Policy', to: '/legal/privacy'},
            {label: 'Copyright', to: '/legal/copyright'},
            {label: 'Takedown', to: '/legal/takedown'},
            {label: 'Security', to: '/legal/security'},
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Community Hub',
              href: 'https://github.com/westlake-drawer/community',
            },
            {
              label: 'Join the Organization',
              href: 'https://github.com/westlake-drawer/membership-application',
            },
          ],
        },
      ],
      copyright: `Westlake Drawer · ${new Date().getFullYear()} · Not affiliated with Westlake University`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
};

export default config;
