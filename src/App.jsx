import React, { useEffect, useState } from 'react';
import ReaderHome from './components/ReaderHome.jsx';
import BookReader from './components/BookReader.jsx';
import { SymbolsView, ReadingView } from './components/InterpretationViews.jsx';
import Backup from './components/Backup.jsx';
import { normalizeState } from './lib/backup.js';
import { hexagrams } from './data/interpretations.js';
import { bookIndex } from './data/book-index.js';
import './reader.css';

const storageKey = 'yixue-study-state';
const pages = { home: '解读路线', symbols: '卦象图解', reading: '白话导读', book: '原书阅读', data: '阅读档案' };
const navigation = ['home', 'symbols', 'book'];
const aliases = { learn: 'home', knowledge: 'home', glossary: 'home', notes: 'home', cases: 'data', review: 'data' };
function readRoute() {
  const [requested, item] = window.location.hash.slice(1).split('/');
  const page = aliases[requested] || requested;
  return { page: pages[page] ? page : 'home', item };
}
function readState() {
  let raw = null;
  try {
    raw = localStorage.getItem(storageKey);
    return { data: normalizeState(raw ? JSON.parse(raw) : {}), error: '', raw: null };
  } catch {
    return { data: normalizeState({}), error: '暂时无法读取本地档案。原始记录已保留，可以先下载原始数据，或恢复之前导出的备份。', raw };
  }
}
function NavIcon({ name }) {
  const paths = {
    home: <><path d="M6 5h12M6 12h8M6 19h12"/><circle cx="3" cy="5" r=".6"/><circle cx="3" cy="12" r=".6"/><circle cx="3" cy="19" r=".6"/></>,
    symbols: <path d="M4 5h16M4 12h6m4 0h6M4 19h16"/>,
    reading: <path d="M12 5v15M12 6C8 3 5 3 2 4v14c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-6-1-10 2Z"/>,
  };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name === 'book' ? 'reading' : name]}</svg>;
}

export default function App() {
  const [initial] = useState(readState);
  const [state, setState] = useState(initial.data);
  const [readError, setReadError] = useState(initial.error);
  const [storageError, setStorageError] = useState(false);
  const [route, setRoute] = useState(readRoute);
  const [toast, setToast] = useState('');
  const page = route.page;
  useEffect(() => {
    if (readError) return;
    try { localStorage.setItem(storageKey, JSON.stringify(state)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [state, readError]);
  useEffect(() => {
    const onHash = () => { setRoute(readRoute()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    document.title = pages[page] + ' · 易经白话';
    if ((page === 'reading' || page === 'book') && bookIndex.some(item => item.id === route.item)) {
      setState(previous => previous.reader.selectedHexagram === route.item ? previous : { ...previous, reader: { ...previous.reader, selectedHexagram: route.item } });
    }
  }, [page, route.item]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);
  function updateReader(patch) { setState(previous => ({ ...previous, reader: { ...previous.reader, ...(typeof patch === 'function' ? patch(previous.reader) : patch) } })); }
  function openHexagram(id) {
    updateReader({ selectedHexagram: id });
    window.location.hash = (hexagrams.some(item => item.id === id) ? 'reading/' : 'book/') + id;
  }
  function openBook(id) { updateReader({ selectedHexagram: id }); window.location.hash = 'book/' + id; }
  function restoreState(value) {
    const restored = normalizeState(value);
    try {
      if (initial.raw && readError) localStorage.setItem('yixue-study-unreadable-original', initial.raw);
      localStorage.setItem(storageKey, JSON.stringify(restored));
    } catch { throw new Error('浏览器未能保存恢复后的档案，当前内容未被替换。请先导出当前档案，再检查存储空间与权限。'); }
    setState(restored); setReadError(''); setStorageError(false);
  }
  function downloadOriginal() {
    const url = URL.createObjectURL(new Blob([initial.raw || ''], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = '易经白话-原始记录.json'; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const selectedId = hexagrams.some(item => item.id === route.item) ? route.item : state.reader.selectedHexagram;
  return <div className="reader-app">
    <a href="#reader-main" className="skip-link" onClick={event => { event.preventDefault(); document.getElementById('reader-main').focus(); }}>跳至正文</a>
    <aside className="reader-sidebar">
      <a href="#home" className="reader-brand"><span className="reader-brand-mark">易</span><span><b>易经白话</b><small>读懂古老智慧中的变化</small></span></a>
      <div className="reader-nav-label">一本可以读懂的易经</div>
      <nav className="reader-navigation" aria-label="主导航">{navigation.map(id => <a key={id} href={'#' + id} aria-current={page === id || (id === 'book' && page === 'reading') ? 'page' : undefined}><NavIcon name={id}/><span>{pages[id]}</span>{(page === id || (id === 'book' && page === 'reading')) && <i aria-hidden="true"/>}</a>)}</nav>
      <div className="reader-sidebar-bottom"><span className="reader-sidebar-seal">慢<br/>读</span><p>先理解一个意思，<br/>再读下一句话。</p><a href="#data">阅读档案与备份 <span aria-hidden="true">↗</span></a></div>
    </aside>
    <main className="reader-main" id="reader-main" tabIndex={-1}>
      <header className="reader-topbar"><div><span>易经白话</span><i>/</i><b>{pages[page]}</b></div><a href="#data" className="reader-top-link">阅读档案与备份 <span aria-hidden="true">↗</span></a></header>
      <div className="reader-content">
        {storageError && <p className="storage-warning" role="alert">当前内容尚未保存到浏览器。请先<a href="#data">导出阅读档案</a>，再检查存储空间与权限。</p>}
        {readError && <div className="storage-warning" role="alert"><p>{readError}</p>{initial.raw && <button className="button outline small" onClick={downloadOriginal}>下载原始数据</button>} <a className="button small" href="#data">恢复备份</a><p>本次阅读笔记暂时不会写入原存储。</p></div>}
        {page === 'home' && <ReaderHome onOpen={openHexagram}/>}
        {page === 'symbols' && <SymbolsView/>}
        {page === 'book' && <BookReader chapterId={route.item || state.reader.selectedHexagram} onSelect={openBook} notes={state.reader.notes} onNoteChange={(id, note) => updateReader(reader => ({ notes: { ...reader.notes, [id]: note } }))} bookmarks={state.reader.bookmarks} onToggleBookmark={id => updateReader(reader => ({ bookmarks: { ...reader.bookmarks, [id]: !reader.bookmarks[id] } }))} onOpenGuide={openHexagram}/>}
        {page === 'reading' && <ReadingView selectedId={selectedId} onSelect={openHexagram} notes={state.reader.notes} onNoteChange={(id, note) => updateReader(reader => ({ notes: { ...reader.notes, [id]: note } }))} bookmarks={state.reader.bookmarks} onToggleBookmark={id => updateReader(reader => ({ bookmarks: { ...reader.bookmarks, [id]: !reader.bookmarks[id] } }))}/>}
        {page === 'data' && <><div className="reader-page-head"><span className="eyebrow">KEEP YOUR WORDS</span><h1>把理解，慢慢留下来。</h1><p>阅读笔记与收藏保存在当前浏览器。导出一份档案，也能把它们带到另一个浏览器。</p></div><Backup state={state} onRestore={restoreState} notify={setToast}/><LegacyArchive state={state}/></>}
      </div>
      <footer className="reader-footer"><a href="#home">易经白话</a><span>底本：《周易今注今译》 · 南怀瑾、徐芹庭注译</span><a href="#book/copyright">本书版本与出处 ↗</a></footer>
    </main>
    <div className={'reader-toast ' + (toast ? 'is-visible' : '')} role="status" aria-live="polite">{toast}</div>
  </div>;
}

function LegacyArchive({ state }) {
  const oldNotes = Object.entries(state.study.records || {}).filter(([, record]) => record.note?.trim());
  if (!state.cases.length && !state.reviews.length && !oldNotes.length) return null;
  return <details className="reader-legacy panel"><summary>查看之前保存的记录</summary><p>以前的案例、复盘与笔记仍包含在完整档案中，可以在这里阅读。</p>
    {oldNotes.map(([id, record], index) => <details key={id}><summary>之前的笔记 {index + 1}</summary><p>{record.note}</p></details>)}
    {state.cases.map((item, index) => <details key={'case-' + (item.id ?? index)}><summary>案例 · {item.title || '记录 ' + (index + 1)}</summary>{[['问题', item.question], ['原始信息', item.raw], ['当时的分析', item.analysis || Object.values(item.analysisDetails || {}).join('\n')]].map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text || '未填写'}</p></section>)}{item.gua && <p>{Object.entries(item.gua).map(([key, value]) => (({ base: '本卦', upper: '上卦', lower: '下卦', moving: '动爻', mutual: '互卦', changed: '变卦' })[key]) + '：' + (value || '未填写')).join('\n')}</p>}{item.entries?.map((entry, i) => <section key={entry.id ?? i}><h3>追加 {i + 1} · {entry.time}</h3><p>{[entry.result, entry.reflection, entry.learned].filter(Boolean).join('\n\n')}</p></section>)}</details>)}
    {state.reviews.map((item, index) => <details key={'review-' + (item.id ?? index)}><summary>复盘 · {item.date || '记录 ' + (index + 1)}</summary>{[['收获', item.learned], ['仍需查阅', item.lookup], ['问题', item.failed], ['接下来的想法', item.next]].map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text || '未填写'}</p></section>)}</details>)}
  </details>;
}
