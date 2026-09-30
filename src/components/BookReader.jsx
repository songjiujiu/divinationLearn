import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { bookMetadata, bookIndex } from '../data/book-index.js';
import '../book-reader.css';

const layerLabels = {
  original: '原文', annotation: '今注', translation: '今译', commentary: '今释', prose: '正文',
};
const guideIds = new Set(['qian', 'kun', 'zhun', 'meng', 'xu', 'qian-modesty', 'fu', 'wei-ji']);
const readingModes = [
  ['essential', '原文与今译'], ['all', '全部内容'], ['original', '仅原文'],
];

function SourceNote({ chapter, block, position }) {
  const source = chapter.source || {};
  const anchor = block?.sourceAnchor || source.anchor;
  return <details className={block ? 'br-block-source' : 'br-chapter-source'}>
    <summary>{block ? `段落 ${position} · 查看出处` : '本章出处与版本位置'}</summary>
    <div>
      <p>来源：{bookMetadata.title} · {chapter.title}</p>
      {!block && <p>底本文件：{bookMetadata.sourceFilename}</p>}
      <p>EPUB 文件：<code>{source.file || '未提供文件位置'}</code></p>
      <p>{block?.sourceAnchor ? '本段锚点' : '章节锚点'}：<code>{anchor || '未提供锚点'}</code></p>
      {block && <p>本站段落编号：<code>{block.id}</code>{!block.sourceAnchor && <span>（本段没有独立原书锚点，按章节位置与段落编号定位）</span>}</p>}
      {!block && <p>这里标注电子书文件和锚点；不换算为纸书页码。</p>}
    </div>
  </details>;
}

function BookSegments({ block, chapter, onImage }) {
  const segments = Array.isArray(block.segments) && block.segments.length ? block.segments : [{ type: 'text', text: block.text || '' }];
  return segments.map((segment, index) => {
    const key = `${block.id}-${index}`;
    if (segment.type === 'image') {
      const alt = segment.alt || '书内图符';
      if (typeof segment.src !== 'string' || !segment.src.startsWith('/book-assets/')) return <span key={key} className="br-image-missing">〔{alt}〕</span>;
      return <button key={key} type="button" className="br-inline-image" aria-label={`${alt}，点击放大`} title="点击放大书内图符" onClick={() => onImage({ ...segment, alt, chapter, block })}>
        <img src={segment.src} alt={alt} loading="lazy" />
      </button>;
    }
    if (segment.type === 'sup') return <sup key={key}>{segment.text}</sup>;
    if (segment.type === 'sub') return <sub key={key}>{segment.text}</sub>;
    return <React.Fragment key={key}>{segment.text}</React.Fragment>;
  });
}

function BookBlock({ block, chapter, position, onImage }) {
  const imageOnly = block.segments?.some(segment => segment.type === 'image') && block.segments.every(segment => segment.type === 'image' || !segment.text?.trim());
  const Body = imageOnly ? 'figure' : 'p';
  return <section id={block.id} className={`br-block br-block-${block.type}${imageOnly ? ' br-block-figure' : ''}`} data-source-file={chapter.source?.file} data-source-anchor={block.sourceAnchor || chapter.source?.anchor}>
    {block.type === 'heading'
      ? <h3 className="br-text-heading"><BookSegments block={block} chapter={chapter} onImage={onImage} /></h3>
      : <><span className="br-layer-label">{layerLabels[block.type] || '正文'}</span><Body className="br-paragraph"><BookSegments block={block} chapter={chapter} onImage={onImage} /></Body></>}
    <SourceNote chapter={chapter} block={block} position={position} />
  </section>;
}

export default function BookReader({ chapterId, onSelect, notes = {}, onNoteChange, bookmarks = {}, onToggleBookmark, onOpenGuide }) {
  const uid = useId();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('全部');
  const [mode, setMode] = useState('essential');
  const [catalogueOpen, setCatalogueOpen] = useState(() => typeof window === 'undefined' || !window.matchMedia('(max-width: 980px)').matches);
  const [chapters, setChapters] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const [expandedImage, setExpandedImage] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const requested = bookIndex.find(item => item.id === chapterId);
  const selected = requested || bookIndex.find(item => item.id === 'qian') || bookIndex[0];
  const previousChapter = useRef(selected?.id);
  const chapter = chapters.find(item => item.id === selected?.id);
  const blocks = Array.isArray(chapter?.blocks) ? chapter.blocks : [];
  const structured = blocks.some(block => ['original', 'annotation', 'translation', 'commentary'].includes(block.type));
  const visibleBlocks = blocks.map((block, index) => ({ block, position: index + 1 })).filter(({ block }) => !structured || mode === 'all' || block.type === 'heading' || block.type === 'original' || mode === 'essential' && block.type === 'translation');
  const note = typeof notes[selected?.id] === 'string' ? notes[selected.id] : '';
  const groups = [...new Set(bookIndex.map(item => item.group || '其他'))];
  const selectedPosition = bookIndex.findIndex(item => item.id === selected?.id);
  const visibleIndex = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return bookIndex.filter(item => (group === '全部' || (item.group || '其他') === group) && [item.title, item.id, item.group, item.number ?? ''].join(' ').toLowerCase().includes(keyword));
  }, [query, group]);

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    import('../data/book.js').then(module => {
      if (!Array.isArray(module.bookChapters) || !module.bookChapters.length) throw new Error('书籍正文不可用');
      if (!cancelled) { setChapters(module.bookChapters); setLoadState('ready'); }
    }).catch(() => { if (!cancelled) setLoadState('error'); });
    return () => { cancelled = true; };
  }, [attempt]);

  useEffect(() => {
    if (chapter && previousChapter.current !== chapter.id) {
      titleRef.current?.scrollIntoView({ block: 'start' });
      titleRef.current?.focus({ preventScroll: true });
      previousChapter.current = chapter.id;
    }
    setExpandedImage(null);
  }, [chapter?.id]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expandedImage && !dialog.open) dialog.showModal();
    else if (!expandedImage && dialog.open) dialog.close();
  }, [expandedImage]);

  function selectChapter(id) {
    onSelect?.(id);
    if (window.matchMedia('(max-width: 980px)').matches) setCatalogueOpen(false);
  }

  function showImage(value) { setImageFailed(false); setExpandedImage(value); }
  function closeImage() { dialogRef.current?.close(); setExpandedImage(null); }

  return <div className="br-reader">
    <header className="br-book-header">
      <div className="br-book-emblem" aria-hidden="true"><span>周<br />易</span><i>今注今译</i></div>
      <div className="br-book-info"><span className="br-eyebrow">以书为据 · 原文与注译</span><h1>{bookMetadata.title}</h1><p>{bookMetadata.editor} 主编<span> · </span>{bookMetadata.annotators.join('、')} 注译</p><div className="br-edition"><span>{bookMetadata.publisher}</span><span>{bookMetadata.edition}</span><span>ISBN {bookMetadata.isbn}</span></div><p className="br-book-intro">从原文读到今译，遇到疑问再展开今注、今释。每一段保留书中的次序和出处。</p></div>
    </header>

    <div className="br-layout">
      <aside className="br-index" aria-label="书籍章节目录">
        <button type="button" className="br-index-toggle" aria-expanded={catalogueOpen} aria-controls={`${uid}-catalogue`} onClick={() => setCatalogueOpen(value => !value)}><span><strong>全书目录</strong><small>{bookIndex.length} 个章节 · 含六十四卦与附传</small></span><span aria-hidden="true">{catalogueOpen ? '−' : '+'}</span></button>
        <div id={`${uid}-catalogue`} className="br-catalogue" hidden={!catalogueOpen}>
          <label className="br-field-label" htmlFor={`${uid}-search`}>找一卦或一篇</label><input id={`${uid}-search`} className="br-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="卦名、卦序、系辞、凡例…" />
          <label className="br-field-label" htmlFor={`${uid}-group`}>按分组查看</label><select id={`${uid}-group`} className="br-group-select" value={group} onChange={event => setGroup(event.target.value)}><option>全部</option>{groups.map(name => <option key={name}>{name}</option>)}</select>
          <p className="br-index-count" role="status">{query.trim() || group !== '全部' ? `找到 ${visibleIndex.length} 个章节` : '按书中次序排列，随时可以跳读'}</p>
          <nav className="br-index-groups" aria-label="选择章节">{groups.map(name => {
            const entries = visibleIndex.filter(item => (item.group || '其他') === name);
            return entries.length > 0 && <section className="br-index-group" key={name}><h2>{name}</h2>{entries.map(item => <button type="button" key={item.id} className={`br-chapter-choice ${selected?.id === item.id ? 'br-is-selected' : ''}`} aria-current={selected?.id === item.id ? 'page' : undefined} onClick={() => selectChapter(item.id)}><span className="br-chapter-number">{item.number === null ? '·' : String(item.number).padStart(2, '0')}</span><span>{item.title}</span>{bookmarks[item.id] && <span className="br-index-star" aria-label="已收藏">★</span>}</button>)}</section>;
          })}</nav>
          {visibleIndex.length === 0 && <div className="br-index-empty"><p>没有找到这个章节。</p><button type="button" className="br-text-button" onClick={() => { setQuery(''); setGroup('全部'); }}>查看完整目录 →</button></div>}
        </div>
      </aside>

      <div className="br-reading-column">
        {chapterId && !requested && selected && <p className="br-notice" role="status">未找到指定章节，先为你打开「{selected.title}」。可以在目录重新选择。</p>}
        {!selected && <div className="br-status" role="alert"><h2>暂时没有可阅读的目录</h2><p>请稍后重新打开本页。</p></div>}
        {selected && <article className="br-article" aria-busy={loadState === 'loading'}>
          <header className="br-chapter-heading"><div><span className="br-eyebrow">{selected.group}{selected.number !== null && ` · 第 ${selected.number} 卦`}</span><h2 ref={titleRef} tabIndex={-1}>{selected.title}</h2></div><button type="button" className={`br-bookmark ${bookmarks[selected.id] ? 'br-is-bookmarked' : ''}`} aria-pressed={!!bookmarks[selected.id]} onClick={() => onToggleBookmark?.(selected.id)}><span aria-hidden="true">{bookmarks[selected.id] ? '★' : '☆'}</span>{bookmarks[selected.id] ? '已收藏' : '收藏本章'}</button></header>
          <SourceNote chapter={selected} />

          {guideIds.has(selected.id) && onOpenGuide && <div className="br-guide-link"><div><strong>想先抓住这卦的意思？</strong><p>打开本站的简明导读，再回来对照本书阅读。</p></div><button type="button" className="br-text-button" onClick={() => onOpenGuide(selected.id)}>看白话导读 ↗</button></div>}

          <div className="br-reading-tools"><span>这次怎样读</span><div role="group" aria-label="筛选阅读层次">{readingModes.map(([id, label]) => <button type="button" key={id} aria-pressed={mode === id} disabled={loadState !== 'ready' || !structured} onClick={() => setMode(id)}>{label}</button>)}</div></div>
          {loadState === 'loading' && <div className="br-status" role="status"><span className="br-loading-mark" aria-hidden="true">卷</span><h3>正在展开书页…</h3><p>正文首次打开时加载，请稍候。</p></div>}
          {(loadState === 'error' || loadState === 'ready' && !chapter) && <div className="br-status br-status-error" role="alert"><h3>这一章暂时没有加载成功</h3><p>当前笔记与收藏仍然保留，可以重试加载正文。</p><button type="button" className="button outline small" onClick={() => setAttempt(value => value + 1)}>重新加载正文</button></div>}
          {loadState === 'ready' && chapter && <>
            <p className="br-mode-help">{!structured ? '本章为说明文字，不分原文与注译，按原书顺序完整显示。' : mode === 'essential' ? '先读原文与今译。需要字词说明或进一步解释时，切换「全部内容」。' : mode === 'original' ? '当前只显示原文和章节标题。可随时切换阅读今译与解释。' : '按原书次序显示原文、今注、今译与今释，各层文字分别标注。'}</p>
            <div className="br-blocks">{visibleBlocks.map(({ block, position }) => <BookBlock key={block.id} block={block} chapter={chapter} position={position} onImage={showImage} />)}</div>
            {visibleBlocks.length === 0 && <div className="br-status"><p>本章没有符合当前筛选的文字。</p><button type="button" className="br-text-button" onClick={() => setMode('all')}>查看本章全部内容 →</button></div>}
          </>}

          <section className="br-personal-note"><span className="br-eyebrow">留给自己的话</span><h3>读到这里，我的理解是…</h3><label htmlFor={`${uid}-note`}>「{selected.title}」阅读笔记</label><textarea id={`${uid}-note`} value={note} onChange={event => onNoteChange?.(selected.id, event.target.value)} rows={6} placeholder="摘下有感触的一句，或记下暂时没想明白的问题。" /><div><span>输入后自动保留，可在阅读档案中备份。</span><span>{Array.from(note).length} 字</span></div></section>
          <nav className="br-pagination" aria-label="相邻章节"><button type="button" disabled={selectedPosition <= 0} onClick={() => selectChapter(bookIndex[selectedPosition - 1].id)}><small>← 上一章</small><span>{selectedPosition > 0 ? bookIndex[selectedPosition - 1].title : '已到全书开头'}</span></button><button type="button" disabled={selectedPosition < 0 || selectedPosition >= bookIndex.length - 1} onClick={() => selectChapter(bookIndex[selectedPosition + 1].id)}><small>下一章 →</small><span>{selectedPosition >= 0 && selectedPosition < bookIndex.length - 1 ? bookIndex[selectedPosition + 1].title : '已到全书末尾'}</span></button></nav>
        </article>}
      </div>
    </div>

    <dialog className="br-image-dialog" ref={dialogRef} onCancel={event => { event.preventDefault(); closeImage(); }} onClose={() => setExpandedImage(null)} onClick={event => { if (event.target === event.currentTarget) closeImage(); }} aria-labelledby={`${uid}-image-title`}>
      {expandedImage && <div className="br-image-dialog-body"><div className="br-image-dialog-head"><h2 id={`${uid}-image-title`}>书内图符 · {expandedImage.chapter.title}</h2><button type="button" className="br-close-image" onClick={closeImage} aria-label="关闭放大图符">×</button></div><figure>{imageFailed ? <p className="br-status" role="alert">这张图符暂时无法显示，请关闭后重试。</p> : <img src={expandedImage.src} alt={expandedImage.alt} onError={() => setImageFailed(true)} />}<figcaption>{expandedImage.alt}<small>《{bookMetadata.title}》 · {expandedImage.chapter.title} · {layerLabels[expandedImage.block.type] || '章节标题'}</small><small>{expandedImage.chapter.source?.file}{(expandedImage.block.sourceAnchor || expandedImage.chapter.source?.anchor) && `#${expandedImage.block.sourceAnchor || expandedImage.chapter.source.anchor}`} · 段落 {expandedImage.block.id}</small></figcaption></figure><p className="br-image-hint">图符来自书中原图，可按 Esc 关闭。</p></div>}
    </dialog>
  </div>;
}
