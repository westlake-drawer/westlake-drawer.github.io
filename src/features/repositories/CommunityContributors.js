import React from 'react';
import Link from '@docusaurus/Link';
import snapshot from '@site/src/data/repository-contributors.json';
import ContributorAvatars from './ContributorAvatars';
import {useLang} from '@site/src/features/i18n';
import styles from './styles.module.css';

const MAINTAINERS = ['JiamingShi-JsPhys', 'JieteXue', 'qwerasdasd1'];

export default function CommunityContributors() {
  const {t} = useLang();
  const users = new Map();
  Object.values(snapshot.repositories).forEach((repository) => {
    repository.contributors?.forEach((user) => users.set(user.id, user));
  });
  const maintainers = MAINTAINERS.map((login) =>
    [...users.values()].find((user) => user.login.toLowerCase() === login.toLowerCase())
    ?? {id: null, login});
  if (!users.size) return null;
  return (
    <section className={styles.community} aria-labelledby="community-contributors">
      <div className={styles.communityHeading}>
        <div>
          <h2 id="community-contributors">{t('contributors.title')}</h2>
          <p>{t('contributors.sub')}</p>
        </div>
        <Link to="/notes/">{t('contributors.link')}</Link>
      </div>
      <ContributorAvatars
        users={[...users.values()].sort((a, b) => a.login.localeCompare(b.login))}
        limit={48}
      />
      <div className={styles.communityHeading}>
        <div>
          <h2>{t('maintainers.title')}</h2>
          <p>{t('maintainers.sub')}</p>
        </div>
        <Link to="/explore/assistants/">{t('maintainers.link')}</Link>
      </div>
      <ContributorAvatars users={maintainers} limit={3} />
    </section>
  );
}
