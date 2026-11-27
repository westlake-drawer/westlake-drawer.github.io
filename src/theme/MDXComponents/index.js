import MDXComponents from '@theme-original/MDXComponents';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import AutoDocIndex from '@site/src/components/AutoDocIndex';
import Explore from '@site/src/features/explore';
import LegalIndex from '@site/src/features/legal';
import ResourceFacts, {RepoVersion} from '@site/src/features/resources';
import {PathFinder, PromptBuilder} from '@site/src/features/guide';
import McpSetup from '@site/src/features/mcp';
import SubmitButtons from '@site/src/features/submit';
import {SubjectGrid, SubjectIntro} from '@site/src/features/subjects';
import Bi from '@site/src/features/i18n/Bi';
import LangTabs from '@site/src/features/i18n/LangTabs';

export default {
  ...MDXComponents,
  AutoDocIndex,
  Explore,
  LegalIndex,
  ResourceFacts,
  RepoVersion,
  PathFinder,
  PromptBuilder,
  McpSetup,
  SubmitButtons,
  SubjectGrid,
  SubjectIntro,
  Bi,
  LangTabs,
  Tabs,
  TabItem,
};
