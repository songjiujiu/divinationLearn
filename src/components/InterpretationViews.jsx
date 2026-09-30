import React, { useEffect, useId, useRef, useState } from 'react';
import { trigrams, hexagrams } from '../data/interpretations.js';
import { bookIndex } from '../data/book-index.js';
import '../interpretation-views.css';

const naturePaths = {
  qian: ['M15 22a8 8 0 0 1 15-4 6 6 0 1 1 2 12H15a4 4 0 0 1 0-8Z', 'M10 12h8M14 8v8'],
  dui: ['M7 22h34', 'M11 28c6 8 20 8 26 0', 'M15 17l4-6M28 16l3-7'],
  li: ['M26 7c0 10 10 11 10 21a12 12 0 0 1-24 0c0-7 6-11 7-17 1 6 4 8 4 8 3-4 3-8 3-12Z', 'M24 24c-5 5-6 10 0 13 6-3 5-8 0-13Z'],
  zhen: ['M8 18h14M7 24h10M32 13h9', 'M26 7 17 25h9l-4 16 13-21h-9Z'],
  xun: ['M7 16h23c8 0 8-9 2-9-3 0-4 2-4 4', 'M7 23h31c7 0 7 9 1 9-3 0-4-2-4-4', 'M7 30h14c7 0 7 9 1 9'],
  kan: ['M6 17c6-8 12 8 18 0s12 8 18 0', 'M6 25c6-8 12 8 18 0s12 8 18 0', 'M6 33c6-8 12 8 18 0s12 8 18 0'],
  gen: ['M5 36 21 10l16 26H5Z', 'M29 23l5-8 10 21h-7', 'm15 20 6 4 5-5'],
  kun: ['M6 18c12-8 24-8 36 0', 'M6 26c12-8 24-8 36 0', 'M6 34c12-8 24-8 36 0', 'M24 11v25'],
};

function NatureGlyph({ id }) {
  return <svg className="iv-nature-glyph" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{(naturePaths[id] || naturePaths.qian).map((path, index) => <path d={path} key={index} />)}</svg>;
}

function TrigramMark({ trigram, large = false }) {
  if (!trigram) return null;
  return <span className={`iv-trigram-mark ${large ? 'iv-trigram-mark-large' : ''}`} role="img" aria-label={`${trigram.name}卦，自下而上为${trigram.lines.map(line => line ? '阳' : '阴').join('、')}爻`}>
    {[...trigram.lines].reverse().map((line, index) => <span className={`iv-line ${line ? 'iv-line-yang' : 'iv-line-yin'}`} key={index}><i /><i /></span>)}
  </span>;
}

function HexagramMark({ upper, lower, numbered = false }) {
  if (!upper || !lower) return null;
  const lines = [...lower.lines, ...upper.lines];
  return <div className={`iv-hexagram-mark ${numbered ? 'iv-hexagram-numbered' : ''}`} role="img" aria-label={`${upper.name}上${lower.name}下，六爻从下向上数`}>
    {lines.map((line, index) => ({ line, index })).reverse().map(({ line, index }) => <div className={`iv-hexagram-row ${index === 3 ? 'iv-upper-boundary' : ''}`} key={index}>
      {numbered && <span className="iv-line-number">{['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][index]}</span>}
      <span className={`iv-line ${line ? 'iv-line-yang' : 'iv-line-yin'}`}><i /><i /></span>
      {numbered && <span className="iv-line-type">{line ? '阳' : '阴'}</span>}
    </div>)}
  </div>;
}

function ViewIntro({ eyebrow, title, children }) {
  return <header className="iv-view-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{children}</p></header>;
}

export function SymbolsView() {
  const [selectedId, setSelectedId] = useState(trigrams[0].id);
  const [upperId, setUpperId] = useState('qian');
  const [lowerId, setLowerId] = useState('kun');
  const selected = trigrams.find(item => item.id === selectedId) || trigrams[0];
  const upper = trigrams.find(item => item.id === upperId) || trigrams[0];
  const lower = trigrams.find(item => item.id === lowerId) || trigrams[0];
  const combination = hexagrams.find(item => item.upper === upper.id && item.lower === lower.id);
  const upperInputId = useId();
  const lowerInputId = useId();
  return <div className="iv-view iv-symbols-view">
    <ViewIntro eyebrow="八种自然意象 · THE EIGHT TRIGRAMS" title="从天地山泽，认识八卦">先看符号，再看它借用了什么自然意象。点开一卦，读懂三个爻如何组成一个形象。</ViewIntro>
    <div className="iv-symbol-grid" role="group" aria-label="选择八卦意象">{trigrams.map(item => <button type="button" key={item.id} className={`iv-symbol-card ${selected.id === item.id ? 'iv-is-selected' : ''}`} aria-pressed={selected.id === item.id} onClick={() => setSelectedId(item.id)}>
      <span className="iv-symbol-card-top"><NatureGlyph id={item.id} /><span className="iv-symbol-nature">{item.nature}</span></span><span className="iv-symbol-card-bottom"><strong>{item.name}</strong><TrigramMark trigram={item} /></span>
    </button>)}</div>
    <section className="iv-symbol-detail" aria-label={`${selected.name}卦的意象说明`}>
      <div className="iv-symbol-portrait"><NatureGlyph id={selected.id} /><span>{selected.nature}</span></div>
      <div className="iv-symbol-copy"><p className="iv-overline">{selected.name} · {selected.nature}</p><h2>{selected.quality}</h2><p>{selected.description}</p><div className="iv-symbol-use"><button className="button outline small" type="button" onClick={() => setUpperId(selected.id)}>用作上卦 ↓</button><button className="button outline small" type="button" onClick={() => setLowerId(selected.id)}>用作下卦 ↓</button></div></div>
      <div className="iv-symbol-lines"><TrigramMark trigram={selected} large /><small>三爻为一卦<br/>从下向上看</small></div>
    </section>
    <section className="iv-combination">
      <div className="iv-combination-intro"><p className="eyebrow">把符号放在一起 · COMPOSITION</p><h2>三爻叠三爻，就有了六爻</h2><p>下卦在下，上卦在上。八卦两两组合，共有 64 种六爻结构。试着换一个符号，看看构成怎样变化。</p><div className="iv-line-key"><span><i className="iv-key-yang" />阳爻：完整的一横</span><span><i className="iv-key-yin" />阴爻：中间断开</span></div><p className="iv-small-note">图中的“上、下”指符号位置。这里展示卦的构成，不给出吉凶判断。</p></div>
      <div className="iv-combination-controls"><div className="iv-select-field"><label htmlFor={upperInputId}>上卦 · 上面三爻</label><select id={upperInputId} value={upper.id} onChange={event => setUpperId(event.target.value)}>{trigrams.map(item => <option key={item.id} value={item.id}>{item.name} · {item.nature}</option>)}</select></div><div className="iv-select-field"><label htmlFor={lowerInputId}>下卦 · 下面三爻</label><select id={lowerInputId} value={lower.id} onChange={event => setLowerId(event.target.value)}>{trigrams.map(item => <option key={item.id} value={item.id}>{item.name} · {item.nature}</option>)}</select></div><button type="button" className="iv-swap-button" onClick={() => { setUpperId(lower.id); setLowerId(upper.id); }}>⇅ 交换上下卦</button></div>
      <div className="iv-combination-preview"><HexagramMark upper={upper} lower={lower} numbered /><p aria-live="polite">{combination ? `${combination.name} · 第 ${combination.number} 卦` : `${upper.name}上 · ${lower.name}下`}</p><small>{upper.nature}在上，{lower.nature}在下</small></div>
    </section>
  </div>;
}

export function ReadingView({ selectedId, onSelect, notes = {}, onNoteChange, bookmarks = {}, onToggleBookmark }) {
  const [query, setQuery] = useState('');
  const selected = hexagrams.find(item => item.id === selectedId) || hexagrams[0];
  const upper = trigrams.find(item => item.id === selected.upper);
  const lower = trigrams.find(item => item.id === selected.lower);
  const note = typeof notes[selected.id] === 'string' ? notes[selected.id] : '';
  const articleTitle = useRef(null);
  const previousSelection = useRef(selected.id);
  useEffect(() => {
    if (previousSelection.current !== selected.id) {
      articleTitle.current?.scrollIntoView({ block: 'start' });
      articleTitle.current?.focus({ preventScroll: true });
      previousSelection.current = selected.id;
    }
  }, [selected.id]);
  const searchId = useId();
  const noteId = useId();
  const search = query.trim().toLowerCase();
  const filtered = hexagrams.filter(item => [item.name, item.pinyin, item.theme, item.summary, item.number].join(' ').toLowerCase().includes(search));
  return <div className="iv-view iv-reading-view">
    <ViewIntro eyebrow="原文与白话 · READING THE CHANGES" title="读一卦，理解一种处境">从原文出发，借助白话和生活类比，慢慢读出自己的理解。</ViewIntro>
    <div className="iv-reading-layout">
      <aside className="iv-reading-index" aria-label="选择卦目"><div className="iv-index-title"><h2>八篇入门解读</h2><span>{hexagrams.length} 篇</span></div><label className="iv-search-label" htmlFor={searchId}>按卦名或主题查找</label><input id={searchId} className="iv-search-input" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="试试：谦、开始、需要…" /><div className="iv-reading-list">{filtered.map(item => <button type="button" className={`iv-reading-choice ${item.id === selected.id ? 'iv-is-selected' : ''}`} key={item.id} aria-pressed={item.id === selected.id} onClick={() => onSelect(item.id)}><span className="iv-choice-number">{String(item.number).padStart(2, '0')}</span><span><strong>{item.name}</strong><small>{item.theme}</small></span>{bookmarks[item.id] && <span className="iv-choice-bookmark" aria-label="已收藏">★</span>}</button>)}</div>{filtered.length === 0 && <div className="iv-search-empty"><p>没有找到这个主题。</p><button className="iv-text-button" type="button" onClick={() => setQuery('')}>查看全部解读</button></div>}<p className="iv-index-note">选取八种常见处境，作为第一次读《易经》的入口。</p></aside>
      <article className="iv-reading-article" key={selected.id}>
        <header className="iv-article-header"><div><p className="iv-overline">第 {String(selected.number).padStart(2, '0')} 卦 <span>·</span> {selected.pinyin}</p><h2 ref={articleTitle} tabIndex={-1}>{selected.name}<span>{selected.theme}</span></h2><p>{selected.summary}</p></div><HexagramMark upper={upper} lower={lower} /></header>
        <div className="iv-article-tools"><span>{upper?.name}上 · {lower?.name}下</span><button type="button" className={`iv-bookmark-button ${bookmarks[selected.id] ? 'iv-is-bookmarked' : ''}`} aria-pressed={!!bookmarks[selected.id]} onClick={() => onToggleBookmark(selected.id)}><span aria-hidden="true">{bookmarks[selected.id] ? '★' : '☆'}</span>{bookmarks[selected.id] ? '已收藏' : '收藏这篇'}</button></div>
        <section className="iv-original"><p className="iv-section-label">01 / 本书所载原文</p><blockquote>{selected.original.text}</blockquote><p className="iv-source">{selected.original.url ? <a href={selected.original.url} target={selected.original.url.startsWith('#') ? undefined : '_blank'} rel="noreferrer">{selected.original.source} ↗</a> : selected.original.source}</p></section>
        <section className="iv-plain"><p className="iv-section-label">02 / 换成白话</p><h3>这段话，可以怎样理解？</h3><p className="iv-plain-lead">{selected.plain}</p>{selected.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>
        <section className="iv-structure"><span className="iv-structure-icon" aria-hidden="true">☷</span><div><h3>再看一眼卦象</h3><p>{selected.structure}</p></div></section>
        <section className="iv-life-example"><p className="iv-section-label">03 / 放回生活</p><h3>{selected.lifeExample.title}</h3><p>{selected.lifeExample.text}</p><small>生活类比，用来帮助阅读与理解。</small></section>
        <section className="iv-reflection"><p className="iv-section-label">04 / 留一个问题给自己</p><h3>{selected.prompt}</h3><p className="iv-reading-caution">{selected.caution}</p><label htmlFor={noteId}>我的理解</label><textarea id={noteId} rows={6} value={note} onChange={event => onNoteChange(selected.id, event.target.value)} placeholder="哪句话让你有感触？它让你想到什么经历？用自己的话记下来。" /><div className="iv-note-footer"><span>输入即保存，下次读到这里可以接着写。</span><span>{Array.from(note).length} 字</span></div></section>
      </article>
    </div>
  </div>;
}

export function ReaderNotes({ notes = {}, bookmarks = {}, onOpen }) {
  const [mode, setMode] = useState('all');
  const entries = bookIndex.map(item => hexagrams.find(guide => guide.id === item.id) || { ...item, name: item.title, theme: item.group, summary: '回到《周易今注今译》对应章节，继续阅读。' });
  const saved = entries.filter(item => !!bookmarks[item.id]);
  const written = entries.filter(item => typeof notes[item.id] === 'string' && notes[item.id].trim());
  const visible = entries.filter(item => mode === 'bookmarks' ? !!bookmarks[item.id] : mode === 'notes' ? typeof notes[item.id] === 'string' && notes[item.id].trim() : !!bookmarks[item.id] || typeof notes[item.id] === 'string' && notes[item.id].trim());
  return <div className="iv-view iv-notes-view">
    <ViewIntro eyebrow="属于自己的理解 · READER'S NOTES" title="把读过的，变成自己的话">收藏想重读的一篇，写下此刻的理解。过些日子再读，也许会看到不一样的意思。</ViewIntro>
    <div className="iv-notes-summary"><div><strong>{saved.length}</strong><span>篇收藏</span></div><div><strong>{written.length}</strong><span>篇札记</span></div><p>不必写得完整。<br/>留下一句话，也是一段阅读的痕迹。</p></div>
    <div className="iv-notes-filters" role="group" aria-label="筛选阅读记录">{[['all', '全部记录'], ['bookmarks', '我的收藏'], ['notes', '我的札记']].map(([id, title]) => <button key={id} type="button" className={mode === id ? 'iv-is-selected' : ''} aria-pressed={mode === id} onClick={() => setMode(id)}>{title}</button>)}</div>
    <div className="iv-notes-grid">{visible.map(item => { const note = typeof notes[item.id] === 'string' ? notes[item.id] : ''; return <article className="iv-note-card" key={item.id}><div className="iv-note-card-head"><span>{item.number ? `第 ${String(item.number).padStart(2, '0')} 卦` : item.group}</span>{bookmarks[item.id] && <span className="iv-note-saved">★ 已收藏</span>}</div><h2>{item.name}<span>{item.theme}</span></h2>{note.trim() ? <p className="iv-note-excerpt">{note}</p> : <p className="iv-note-unwritten">{item.summary}<br/><span>还没写札记，下次阅读时留下一点想法。</span></p>}<button type="button" className="iv-text-button" onClick={() => onOpen(item.id)}>{note.trim() ? '继续阅读与书写' : '打开这篇解读'} <span aria-hidden="true">→</span></button></article>; })}</div>
    {visible.length === 0 && <div className="iv-empty-notes"><span className="iv-empty-mark" aria-hidden="true">一</span><h2>{mode === 'bookmarks' ? '还没有收藏的解读' : mode === 'notes' ? '第一篇札记，从一句话开始' : '给下一次重读，留一点线索'}</h2><p>读到有共鸣的地方，可以收藏这篇，或在文末写下自己的理解。</p><button type="button" className="button" onClick={() => onOpen(hexagrams[0].id)}>从第一篇读起 →</button></div>}
  </div>;
}
