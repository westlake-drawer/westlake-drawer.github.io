import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const DOCUMENTS = [
  {slug: '/legal/governance', title: 'Governance', zh: '组织章程与治理', desc: '谁维护、谁决策、如何退出与解散'},
  {slug: '/legal/terms', title: 'Terms of Use', zh: '用户使用条款', desc: '你与本站的关系、使用限制、争议解决'},
  {slug: '/legal/privacy', title: 'Privacy Policy', zh: '隐私政策', desc: '收集哪些信息、保存多久、你的权利'},
  {slug: '/legal/copyright', title: 'Copyright', zh: '版权与许可', desc: '笔记归谁、教师材料边界、第三方许可'},
  {slug: '/legal/cla', title: 'Contributor Licence', zh: '贡献者许可', desc: '投稿授权范围与权利保证'},
  {slug: '/legal/takedown', title: 'Notices', zh: '侵权通知与反通知', desc: '投诉材料、处理时限、恢复程序'},
  {slug: '/legal/disclaimer', title: 'Disclaimer', zh: '免责声明', desc: '本站承诺什么、不承诺什么'},
  {slug: '/legal/academic-integrity', title: 'Academic Integrity', zh: '学术诚信', desc: '作业、考试、科研资料的边界'},
  {slug: '/legal/tool-policy', title: 'Tool Policy', zh: '工具收录', desc: '工具如何被收录、标注与下架'},
  {slug: '/legal/brand', title: 'Name & Affiliation', zh: '名称与非官方关联', desc: '校名、地图、标识的使用边界'},
  {slug: '/legal/security', title: 'Security', zh: '安全须知', desc: '运行工具的风险、漏洞披露、事故响应'},
  {slug: '/legal/responsibility', title: 'Responsibility', zh: '责任分配', desc: '贡献者、维护者、工具作者、读者的分工'},
];

export default function LegalIndex() {
  return (
    <ul className={styles.grid}>
      {DOCUMENTS.map((doc) => (
        <li key={doc.slug}>
          <Link className={styles.card} to={doc.slug}>
            <span className={styles.cardTitle}>{doc.title}</span>
            <span className={styles.cardZh}>{doc.zh}</span>
            <span className={styles.cardDesc}>{doc.desc}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
