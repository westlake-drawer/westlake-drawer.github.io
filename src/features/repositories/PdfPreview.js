import React from 'react';
import {ExternalLink} from 'lucide-react';
import {usePluginData} from '@docusaurus/useGlobalData';
import styles from './pdf.module.css';

export default function PdfPreview({source}) {
  const assets = usePluginData('pdf-previews');
  const url = assets?.[source.url];
  return (
    <section className={styles.preview} aria-label={source.label}>
      <div className={styles.actions}>
        <a href={url ?? source.url} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={16} /> Open PDF in new tab
        </a>
      </div>
      {url ? (
        <object className={styles.reader} data={url} type="application/pdf" aria-label={source.label}>
          <p><a href={url} target="_blank" rel="noopener noreferrer">Open PDF</a></p>
        </object>
      ) : (
        <p role="alert">PDF preview is unavailable. <a href={source.url}>Open the original PDF</a>.</p>
      )}
    </section>
  );
}
