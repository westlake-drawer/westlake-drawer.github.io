import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import AnimatedIcon from '@site/src/components/AnimatedIcon';
import CampusMap from '@site/src/components/CampusMap';
import CommunityContributors from '@site/src/features/repositories/CommunityContributors';
import {useLang} from '@site/src/features/i18n';
import styles from './index.module.css';

export default function Home() {
  const {t} = useLang();
  return (
    <Layout
      title="Home"
      description="Course notes and shared resources from the Westlake Drawer community."
    >
      <main className={styles.home}>
        <section className={styles.hero} aria-labelledby="home-title">
          <CampusMap />
          <div className={styles.edgeGlass} aria-hidden="true" />
          <div className={styles.copy}>
            <p className={styles.eyebrow}>{t('home.eyebrow')}</p>
            <h1 id="home-title">Westlake Drawer</h1>
            <p className={styles.intro}>
              {t('home.intro1')}<br />{t('home.intro2')}
            </p>
            <div className={styles.actions}>
              <Link className={styles.primary} to="/notes/">
                <AnimatedIcon name="book" /> {t('home.notes')}
              </Link>
              <Link className={styles.secondary} to="/tools/">
                <AnimatedIcon name="tools" /> {t('home.tools')}
              </Link>
            </div>
          </div>
          <div className={styles.caption}>
            <span>{t('home.caption')} <span aria-hidden="true">&middot;</span> Yungu Campus</span>
            <span className={styles.credits}>
              Map: <a href="https://terraink.app">terraink.app</a>
              {' / '}<a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>
            </span>
          </div>
        </section>
        <section className={styles.discover} aria-labelledby="discover-title">
          <Link className={styles.searchBox} to="/explore/">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M10.5 3a7.5 7.5 0 1 1 4.6 13.4l4.2 4.2-1.4 1.4-4.2-4.2A7.5 7.5 0 0 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" fill="currentColor"/>
            </svg>
            <span className={styles.searchText}>{t('home.search')}</span>
            <span className={styles.searchHint}>{t('home.searchHint')}</span>
          </Link>
          <div className={styles.shortcuts}>
            <Link className={styles.shortcut} to="/notes/math/">
              <strong>{t('home.shortMath')}</strong>
              <span>{t('home.shortMathSub')}</span>
            </Link>
            <Link className={styles.shortcut} to="/notes/chemistry/">
              <strong>{t('home.shortChem')}</strong>
              <span>{t('home.shortChemSub')}</span>
            </Link>
            <Link className={styles.shortcut} to="/tools/">
              <strong>{t('home.shortTools')}</strong>
              <span>{t('home.shortToolsSub')}</span>
            </Link>
          </div>
        </section>
        <section className={styles.explore} aria-labelledby="explore-title">
          <div className={styles.sectionHeading}>
            <h2 id="explore-title">{t('home.collection')}</h2>
            <p>{t('home.collectionSub')}</p>
          </div>
          <div className={styles.destinations}>
            <Link to="/notes/" className={styles.destination}>
              <AnimatedIcon name="book" size={24} />
              <div><h3>{t('home.destNotes')}</h3><p>{t('home.destNotesDesc')}</p></div>
            </Link>
            <Link to="/tools/" className={styles.destination}>
              <AnimatedIcon name="tools" size={24} />
              <div><h3>{t('home.destTools')}</h3><p>{t('home.destToolsDesc')}</p></div>
            </Link>
          </div>
        </section>
        <CommunityContributors />
      </main>
    </Layout>
  );
}
