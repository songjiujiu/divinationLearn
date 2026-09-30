import React, { useRef, useState } from 'react';
import { readingRoute, hexagrams } from '../data/interpretations.js';

export default function ReaderHome({ onOpen }) {
  const [active, setActive] = useState(0);
  const routeRef = useRef(null);
  const detailRef = useRef(null);
  const step = readingRoute[active];
  const samples = ['qian', 'kun', 'zhun', 'qian-modesty'].map(id => hexagrams.find(item => item.id === id)).filter(Boolean);
  const scrollBehavior = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  function chooseStep(index) {
    setActive(index);
    window.requestAnimationFrame(() => {
      detailRef.current?.focus({ preventScroll: true });
      if (window.matchMedia('(max-width: 760px)').matches) detailRef.current?.scrollIntoView({ block: 'start', behavior: scrollBehavior() });
    });
  }
  return <>
    <section className="reader-hero">
      <div className="reader-hero-copy"><span className="reader-kicker"><i/> 给第一次翻开《易经》的你</span>
        <h1>从一根线，<br/>读懂<span>变化。</span></h1>
        <p>阴阳、八卦、卦辞，看起来很远，<br className="desktop-break"/>也可以从一个熟悉的生活问题读起。</p>
        <div className="reader-hero-actions"><button className="button" onClick={() => { routeRef.current?.scrollIntoView({ block: 'start', behavior: scrollBehavior() }); routeRef.current?.focus({ preventScroll: true }); }}>从这里读懂 <span aria-hidden="true">↘</span></button><button className="text-button" onClick={() => onOpen('qian')}>先看一卦的白话解读 <span aria-hidden="true">↗</span></button></div>
        <div className="reader-hero-caption">以《周易今注今译》为底本 · <a href="#book/fan-li">先了解本书的读法 ↗</a></div>
      </div>
      <div className="reader-hero-art" role="img" aria-label="乾卦的六条阳爻，从下往上排列；表示以刚健为主题的卦象">
        <div className="reader-art-ring ring-one"/><div className="reader-art-ring ring-two"/>
        <div className="reader-art-seal">观<br/>变</div>
        <span className="reader-art-title">乾 · 为天</span>
        <div className="reader-art-lines">{['上九', '九五', '九四', '九三', '九二', '初九'].map((line, i) => <div key={line}><span>{line}</span><i className={i === 4 ? 'highlight' : ''}/></div>)}</div>
        <div className="reader-art-foot"><span>六个位置，一种整体。</span><small>从下往上读 ↑</small></div>
      </div>
    </section>
    <div className="reader-principles"><span><b>看图</b> 先认清符号</span><span><b>读话</b> 把古文说清楚</span><span><b>想一想</b> 联系自己的处境</span></div>
    <section className="reader-route-section" ref={routeRef} tabIndex={-1} aria-label="五个理解易经的问题">
      <div className="reader-section-heading"><div><span className="eyebrow">A PATH INTO THE I CHING</span><h2>读懂它，从这五个问题开始</h2><p>可以顺着往下读，也可以直接打开你正好奇的部分。</p></div><span className="reader-side-note">不用先背六十四卦</span></div>
      <div className="reader-route-grid">
        <nav className="reader-route-nav" aria-label="易经解读路线">{readingRoute.map((item, index) => <button key={item.id} className={`reader-route-stop ${active === index ? 'is-active' : ''}`} aria-pressed={active === index} aria-controls="route-explanation" onClick={() => chooseStep(index)}><span className="reader-stop-number">{String(index + 1).padStart(2, '0')}</span><span><strong>{item.title}</strong><small>{item.short}</small></span><span className="reader-stop-arrow" aria-hidden="true">↗</span></button>)}</nav>
        <article className="reader-route-detail" id="route-explanation" ref={detailRef} key={step.id} tabIndex={-1} aria-label={step.title}>
          <div className="reader-detail-top"><span className="eyebrow">{step.kicker}</span><span>{String(active + 1).padStart(2, '0')} / 05</span></div>
          <h3>{step.summary}</h3>
          {step.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <div className="reader-example"><span>用一个例子理解</span><h4>{step.example.title}</h4><p>{step.example.text}</p></div>
          <div className="reader-takeaway"><span>先记住这一句</span><strong>{step.takeaway}</strong></div>
          <div className="reader-detail-actions"><a className="text-button" href={`#${step.link.page}`}>{step.link.label} ↗</a>{active < readingRoute.length - 1 && <button className="button outline small" onClick={() => chooseStep(active + 1)}>接着看下一个问题 →</button>}</div>
        </article>
      </div>
    </section>
    <section className="reader-samples"><div className="reader-section-heading"><div><span className="eyebrow">MEET AN IDEA</span><h2>从一个熟悉的处境，走近一卦</h2><p>这里的生活问题是帮助理解文本的类比。</p></div><a href="#reading" className="text-button">看全部精选解读 ↗</a></div><div className="reader-sample-grid">{samples.map(item => <button key={item.id} className="reader-sample" onClick={() => onOpen(item.id)}><div><span className="reader-sample-number">{String(item.number).padStart(2, '0')}</span><span className="reader-sample-name">{item.name}</span><span aria-hidden="true">↗</span></div><h3>{item.theme}</h3><p>{item.summary}</p></button>)}</div></section>
    <aside className="reader-note"><span className="reader-note-mark">读</span><div><h2>原文、解释、自己的理解，分开来看。</h2><p>原文给你线索，白话帮你入门，生活例子帮你提问。不同注本可能有不同理解，可以带着疑问再回到原文。</p></div><a href="#book/fan-li" className="text-button">对照本书的读法 ↗</a></aside>
  </>;
}
