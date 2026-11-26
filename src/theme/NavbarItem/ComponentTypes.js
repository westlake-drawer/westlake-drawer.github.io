import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import {ExpandNavigation} from '@site/src/features/navigation/Expansion';
import SectionLink from '@site/src/features/navigation/SectionLink';
import LanguageToggle from '@site/src/features/i18n/LanguageToggle';

export default {
  ...ComponentTypes,
  'custom-expandNavigation': ExpandNavigation,
  'custom-sectionLink': SectionLink,
  'custom-language': LanguageToggle,
};
