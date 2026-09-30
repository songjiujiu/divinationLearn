import React, { useEffect, useRef, useState } from 'react';
import { glossary } from '../data/glossary.js';

export default function Glossary({ selectedId }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [expanded, setExpanded] = useState(selectedId || null);
  const entries = useRef({});
  useEffect(() => {
    if (!selectedId) return;
    setExpanded(selectedId); setQuery(''); setCategory('全部');
    const frame = requestAnimationFrame(() => {
      entries.current[selectedId]?.scrollIntoView({ block: 'center' });
      entries.current[selectedId]?.querySelector('summary')?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId]);
  const visible = glossary.filter(item => (category === '全部' || category === item.category) && `${item.term} ${item.pronunciation} ${item.short} ${item.explanation}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="reader-glossary"><div className="reader-page-head"><span className="eyebrow">WORDS IN PLAIN LANGUAGE</span><h1>生词，换句白话说。</h1><p>读到哪里不明白，就来查一个词。先理解它的作用，再慢慢熟悉古文。</p></div>
    <div className="reader-search"><label htmlFor="glossary-search">查一个词</label><input id="glossary-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="试试“爻”“卦辞”或“九五”"/><span>{visible.length} 个词语</span></div>
    <div className="reader-filters" role="group" aria-label="词语分类">{['全部', ...new Set(glossary.map(item => item.category))].map(item => <button key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="reader-glossary-list">{visible.map(item => <details key={item.id} className="reader-term" open={expanded === item.id} ref={node => { entries.current[item.id] = node; }}><summary onClick={event => { event.preventDefault(); setExpanded(expanded === item.id ? null : item.id); }}><span className="reader-term-name"><strong>{item.term}</strong><small>{item.pronunciation}</small></span><span className="reader-term-short">{item.short}</span><span className="reader-term-sign" aria-hidden="true">{expanded === item.id ? '−' : '+'}</span></summary><div className="reader-term-body"><span className="eyebrow">{item.category}</span><p>{item.explanation}</p><div className="reader-example"><span>这样想，更容易懂</span><p>{item.example}</p></div><a className="text-button" href="#reading">带着这个词，读一卦 ↗</a></div></details>)}</div>
    {visible.length === 0 && <div className="reader-empty" role="status"><h2>这个词暂时没有收录</h2><p>可以换成单个汉字搜索，或查看全部白话词条。</p><button className="button outline" onClick={() => { setQuery(''); setCategory('全部'); }}>查看全部词语</button></div>}
    <p className="reader-source-note">依据你提供的《周易今注今译》整理。可对照 <a href="#book/fan-li">本书凡例 ↗</a> 与 <a href="#book/qian">乾卦原文、今注、今译、今释 ↗</a>。</p>
  </section>;
}
