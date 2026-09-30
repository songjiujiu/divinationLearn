import React, { useId, useMemo, useState } from 'react';
import Practice from './Practice.jsx';
import { cards } from '../data/reference.js';
import { lessons } from '../data/lessons.js';

export default function Knowledge({ learned, onChange, openLesson, history, onPracticeComplete }) {
  const [mode, setMode] = useState('cards');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const panelId = useId();
  const cardLessons = [1,3,4,5,6,8,9,10,10,10];
  const visible = useMemo(() => cards.map((card, index) => ({ ...card, index })).filter(card => (category === '全部' || card.category === category) && `${card.title} ${card.body} ${card.relation} ${card.extra}`.includes(query.trim())), [query, category]);
  return <>
    <div className="page-head"><div className="eyebrow">随时查一查 · QUICK REFERENCE</div><h1 className="page-title">知识速查与记忆练习</h1><p className="subhead">先查清楚，再试着不看答案回忆。不懂的概念，可以打开对应课程从头学。</p></div>
    <div className="knowledge-tabs" role="group" aria-label="速查与练习切换"><button id={`${panelId}-cards-toggle`} aria-controls={`${panelId}-cards`} aria-pressed={mode === 'cards'} onClick={() => setMode('cards')}>知识速查</button><button id={`${panelId}-practice-toggle`} aria-controls={`${panelId}-practice`} aria-pressed={mode === 'practice'} onClick={() => setMode('practice')}>十题自测</button></div>
    <div id={`${panelId}-cards`} role="region" aria-labelledby={`${panelId}-cards-toggle`} hidden={mode !== 'cards'}>
      <div className="knowledge-tools"><input className="search" aria-label="搜索知识点" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索五行、八卦、用神……"/><select className="filter" aria-label="知识分类" value={category} onChange={event => setCategory(event.target.value)}><option>全部</option>{[...new Set(cards.map(card => card.category))].map(name => <option key={name}>{name}</option>)}</select></div>
      <div className="grid knowledge-grid">{visible.map(card => <article className="knowledge-card" key={card.title}><span className="tag">{card.category}</span><h3>{card.title}</h3><p>{card.body}</p><div className="relation">{card.relation}</div><p className="card-extra">{card.extra}</p><div className="knowledge-bottom"><label className="learned"><input className="check" type="checkbox" aria-label={`已记住：${card.title}`} checked={!!learned[card.index]} onChange={event => onChange({ ...learned, [card.index]: event.target.checked })}/>已记住</label><button className="link-button text-link" aria-label={`看白话讲解：${card.title}`} onClick={() => openLesson(lessons[cardLessons[card.index]].id)}>看白话讲解 →</button></div></article>)}</div>
      <div role="status" aria-live="polite" aria-atomic="true">{!visible.length && <div className="panel empty">没有找到匹配的知识点，换个词试试。</div>}</div>
    </div>
    <div id={`${panelId}-practice`} role="region" aria-labelledby={`${panelId}-practice-toggle`} hidden={mode !== 'practice'}><Practice history={history} onComplete={onPracticeComplete} /></div>
  </>;
}
