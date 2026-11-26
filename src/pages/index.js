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
