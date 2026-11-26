import MDXComponents from '@theme-original/MDXComponents';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import AutoDocIndex from '@site/src/components/AutoDocIndex';
import Explore from '@site/src/features/explore';
import LegalIndex from '@site/src/features/legal';
import ResourceFacts, {RepoVersion} from '@site/src/features/resources';
import {PathFinder, PromptBuilder} from '@site/src/features/guide';

export default {
  ...MDXComponents,
  AutoDocIndex,
  Explore,
  LegalIndex,
  ResourceFacts,
  RepoVersion,
  PathFinder,
  PromptBuilder,
  Tabs,
  TabItem,
};
