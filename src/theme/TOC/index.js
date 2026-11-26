import React from 'react';
import TOC from '@theme-original/TOC';
import {useLocation} from '@docusaurus/router';
import StarRanking from '@site/src/features/ranking';

export default function TOCWrapper(props) {
  const {pathname} = useLocation();
  const isExplore = pathname.replace(/\/$/, '') === '/explore';
  return (
    <>
      {isExplore && <StarRanking />}
      <TOC {...props} />
    </>
  );
}
