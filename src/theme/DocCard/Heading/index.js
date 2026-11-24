import React from 'react';
import OriginalHeading from '@theme-original/DocCard/Heading';
import AnimatedIcon from '@site/src/components/AnimatedIcon';
import styles from './styles.module.css';

export default function DocCardHeading(props) {
  const stats = props.item.customProps?.repositoryStats;
  return (
    <div className={styles.heading}>
      <OriginalHeading {...props} />
      {stats && (
        <span className={styles.stats}>
          <span title={`${stats.stars} stars`} aria-label={`${stats.stars} stars`}>
            <AnimatedIcon name="star" size={15} />
            {stats.stars}
          </span>
          <span title={`${stats.forks} forks`} aria-label={`${stats.forks} forks`}>
            <AnimatedIcon name="fork" size={15} />
            {stats.forks}
          </span>
        </span>
      )}
    </div>
  );
}
