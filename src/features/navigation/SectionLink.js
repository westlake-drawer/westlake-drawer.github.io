import React from 'react';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import {useLang} from '@site/src/features/i18n';

const KEYS = {explore: 'nav.explore', notes: 'nav.notes', tools: 'nav.tools', submit: 'nav.submit'};

export default function SectionLink({to, dir, label}) {
  const {t} = useLang();
  const {pathname} = useLocation();
  const active = pathname === to || pathname.startsWith(`${to}/`);
  return (
    <Link
      className={`navbar__link section-link${active ? ' navbar__link--active' : ''}`}
      to={to}
      aria-current={active ? 'page' : undefined}
    >
      {KEYS[dir] ? t(KEYS[dir], label) : label}
    </Link>
  );
}
