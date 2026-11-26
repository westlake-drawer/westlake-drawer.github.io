import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';

const STRINGS = {
  'nav.explore': {en: 'Explore', zh: '浏览'},
  'nav.notes': {en: 'Course Notes', zh: '课程笔记'},
  'nav.tools': {en: 'Tools', zh: '工具'},
  'nav.submit': {en: 'Submit', zh: '提交'},

  'home.eyebrow': {en: 'A student-led, open-source collection', zh: '由学生发起、开源共享的课程笔记库'},
  'home.intro1': {en: 'Notes worth sharing.', zh: '值得分享的笔记。'},
  'home.intro2': {en: 'Knowledge worth building together.', zh: '值得一起积累的知识。'},
  'home.notes': {en: 'Explore notes', zh: '浏览笔记'},
  'home.tools': {en: 'Tools', zh: '工具'},
  'home.caption': {en: 'Westlake University', zh: '西湖大学'},
  'home.collection': {en: 'Explore the collection', zh: '开始浏览'},
  'home.collectionSub': {en: 'Shared by students. Open to everyone.', zh: '同学共享，向所有人开放。'},
  'home.destNotes': {en: 'Course Notes', zh: '课程笔记'},
  'home.destNotesDesc': {en: 'Browse notes by subject and course.', zh: '按学科与课程浏览笔记。'},
  'home.destTools': {en: 'Tools', zh: '工具'},
  'home.destToolsDesc': {en: 'Browse tools for study and research.', zh: '浏览学习与研究用的工具。'},
  'contributors.title': {en: 'Contributors', zh: '贡献者'},
  'contributors.sub': {en: 'The people behind our shared notes.', zh: '这些笔记背后的人。'},
  'contributors.link': {en: 'Explore their notes', zh: '看他们的笔记'},
  'maintainers.title': {en: 'Website design & maintenance', zh: '网站设计与维护'},
  'maintainers.sub': {en: 'The site, the index, and the MCP server.', zh: '站点、索引与 MCP 服务。'},
  'maintainers.link': {en: 'Use the index with your own agent', zh: '用自己的 Agent 使用索引'},

  'explore.search': {en: 'Search courses, topics, or tools…', zh: '搜索课程、主题或工具…'},
  'explore.type': {en: 'Type', zh: '类型'},
  'explore.subject': {en: 'Subject', zh: '学科'},
  'explore.course': {en: 'Course', zh: '课程'},
  'explore.all': {en: 'All', zh: '全部'},
  'explore.allCourses': {en: 'All courses', zh: '全部课程'},
  'explore.notes': {en: 'Course Notes', zh: '课程笔记'},
  'explore.tools': {en: 'Tools', zh: '工具'},
  'explore.showing': {en: 'showing the first', zh: '先显示前'},
  'explore.none': {en: 'Nothing matches those filters.', zh: '没有匹配的结果。'},

  'path.placeholder': {en: 'e.g. I want to build a mathematics foundation', zh: '例如：我想补一下数学基础'},
  'path.submit': {en: 'Get a path', zh: '给我一条路径'},
  'path.empty': {en: 'No path matched. Try different wording, or browse', zh: '没有匹配的路径。换个说法，或者直接去'},
  'path.related': {en: 'Maybe related', zh: '可能相关'},
  'path.relatedSub': {en: 'No ready-made path, but these are closest to what you described.', zh: '没有现成路径，这些与你描述的更接近。'},

  'prompt.direction': {en: 'Direction', zh: '方向'},
  'prompt.year': {en: 'Year', zh: '年级'},
  'prompt.goal': {en: 'Goal', zh: '目标'},
  'prompt.copy': {en: 'Copy prompt', zh: '复制提示词'},
  'prompt.copied': {en: 'Copied', zh: '已复制'},
  'prompt.note': {en: 'paste it into the assistant you already use', zh: '粘贴到你常用的助手'},
  'prompt.resources': {en: 'resources', zh: '条资源'},

  'mcp.agent': {en: 'Agent', zh: '客户端'},
  'mcp.replace': {en: 'Replace', zh: '把'},
  'mcp.with': {en: 'with the absolute path of', zh: '换成'},
  'mcp.unlisted': {en: 'If your client is not listed, it almost certainly accepts the JSON form above.', zh: '如果客户端不在列表里，基本都接受上面的 JSON 配置。'},

  'submit.open': {en: 'Open a submission issue', zh: '打开提交 issue'},
  'submit.copy': {en: 'Copy the template', zh: '复制模板'},
  'submit.copied': {en: 'Copied', zh: '已复制'},

  'rank.title': {en: 'Ranking', zh: '榜单'},
  'rank.note': {en: 'By GitHub stars', zh: '按 GitHub 星标'},

  'footer.index': {en: 'Index', zh: '索引'},
  'footer.legal': {en: 'Legal', zh: '法律'},
  'footer.community': {en: 'Community', zh: '社区'},
};


// Docusaurus renders some strings at build time and cannot read React context.
// These exact-phrase swaps cover that chrome; they never touch page copy.
const THEME_PAIRS = [
  ['Edit this page', '编辑此页'],
  ['On this page', '本页内容'],
  ['Previous', '上一篇'],
  ['Next', '下一篇'],
  ['Index', '索引'],
  ['Legal', '法律'],
  ['Community', '社区'],
  ['Explore', '浏览'],
  ['Course Notes', '课程笔记'],
  ['Submit', '提交'],
  ['Tools', '工具'],
  ['Legal & Safety', '法律与安全'],
  ['Terms of Use', '使用条款'],
  ['Privacy Policy', '隐私政策'],
  ['Copyright', '版权'],
  ['Takedown', '侵权处理'],
  ['Security', '安全'],
  ['Community Hub', '社区中心'],
  ['Join the Organization', '加入组织'],
  ['Last updated on', '最后更新于'],
];

function swapTextNodes(lang) {
  const pairs = lang === 'zh' ? THEME_PAIRS : THEME_PAIRS.map(([en, zh]) => [zh, en]);
  const dict = new Map(pairs);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const raw = node.nodeValue;
    if (!raw) continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const hit = dict.get(trimmed);
    if (hit) node.nodeValue = raw.replace(trimmed, hit);
  }
}

const LanguageContext = createContext({lang: 'en', setLang: () => {}, t: (key, fallback) => fallback ?? key});

const STORAGE_KEY = 'westlake-drawer-lang';

export function LanguageProvider({children}) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'zh' || stored === 'en') setLangState(stored);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    swapTextNodes(lang);
    const observer = new MutationObserver(() => swapTextNodes(lang));
    observer.observe(document.body, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  const t = useCallback(
    (key, fallback) => {
      const entry = STRINGS[key];
      if (!entry) return fallback ?? key;
      return entry[lang] ?? entry.en;
    },
    [lang]
  );

  const value = useMemo(() => ({lang, setLang, t}), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  return useContext(LanguageContext);
}
