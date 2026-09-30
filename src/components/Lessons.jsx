import React, { useEffect, useRef, useState } from 'react';
import { lessons } from '../data/lessons.js';
import { stages } from '../data/reference.js';

export default function Lessons({ study, onChange }) {
  const index = Math.max(0, lessons.findIndex(lesson => lesson.id === study.current));
  const lesson = lessons[index];
  const titleRef = useRef(null);
  const lastLesson = useRef(lesson.id);
  useEffect(() => {
    if (lastLesson.current !== lesson.id) {
      titleRef.current?.scrollIntoView({ block: 'start' });
      titleRef.current?.focus({ preventScroll: true });
      lastLesson.current = lesson.id;
    }
  }, [lesson.id]);
  const record = study.records?.[lesson.id] || {};
  const answers = record.answers || {};
  const completeCount = lessons.filter(item => study.records?.[item.id]?.completed).length;
  const allAnswered = lesson.questions.every((_, i) => Number.isInteger(answers[i]));
  const passed = allAnswered && lesson.questions.every((question, i) => answers[i] === question.answer);
  function updateRecord(patch) {
    onChange({ ...study, records: { ...study.records, [lesson.id]: { ...record, ...patch } } });
  }
  function selectLesson(id) { onChange({ ...study, current: id }); }
  return <>
    <div className="page-head"><div className="eyebrow">一步一步学 · BEGINNER COURSE</div><h1 className="page-title">从零开始，每次学会一点</h1><p className="subhead">先读白话解释，再看例子，最后做两道题。可以反复练习，不需要一次记住所有术语。</p></div>
    <div className="classroom">
      <aside className="lesson-menu panel" aria-label="课程目录">
        <div className="lesson-menu-head"><strong>12 节入门导读</strong><span>{completeCount}/12 已完成</span></div>
        {stages.map((stage, stageIndex) => <section key={stage.name}>
          <h2>{stage.name}<small>{stage.weeks}</small></h2>
          {lessons.map((item, i) => item.stage === stageIndex && <button key={item.id} type="button" className={`lesson-link ${index === i ? 'selected' : ''}`} onClick={() => selectLesson(item.id)} aria-current={index === i ? 'step' : undefined}>
            <span className="lesson-number">{study.records?.[item.id]?.completed ? '✓' : String(i + 1).padStart(2, '0')}</span><span>{item.title}</span>
          </button>)}
        </section>)}
      </aside>
      <article className="lesson-body panel" key={lesson.id}>
        <div className="eyebrow">第 {index + 1} 课 · 建议 {lesson.minutes} 分钟{lesson.introOnly ? ' · 流程导读' : ''}</div>
        <h2 className="lesson-title" ref={titleRef} tabIndex={-1}>{lesson.title}</h2>
        <div className="lesson-goal"><b>这节课学什么</b><p>{lesson.goal}</p></div>
        {lesson.sections.map(section => <section className="lesson-section" key={section.title}><h3>{section.title}</h3>{section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</section>)}
        {(index === 6 || index === 7) && <LineExplorer />}
        <section className="worked-example"><span className="eyebrow">跟着例子走一遍</span><h3>{lesson.example.title}</h3><ol>{lesson.example.steps.map((step, i) => <li key={i}>{step}</li>)}</ol></section>
        <section className="lesson-section"><h3>动手做一次</h3><p>{lesson.practice}</p><label className="note-label" htmlFor="lesson-note">我的练习笔记 <small>输入后自动保存</small></label><textarea id="lesson-note" className="lesson-note" value={record.note || ''} onChange={event => updateRecord({ note: event.target.value })} placeholder="试着用自己的话解释，记下还没弄懂的地方。" /></section>
        <section className="lesson-quiz"><h3>两道题，检查是否理解</h3><p>答错也没关系，读完解析再试一次。</p>
          {lesson.questions.map((question, i) => <fieldset key={i}><legend>{i + 1}. {question.prompt}</legend>{question.options.map((option, j) => <label key={option} className={`quiz-option ${answers[i] === j ? 'chosen' : ''}`}><input type="radio" name={`${lesson.id}-${i}`} checked={answers[i] === j} onChange={() => updateRecord({ answers: { ...answers, [i]: j }, checked: false })} /><span>{option}</span></label>)}{record.checked && <p className={`answer-feedback ${answers[i] === question.answer ? 'correct' : 'incorrect'}`} role="status">{answers[i] === question.answer ? '答对了。' : `再想一想，正确答案是“${question.options[question.answer]}”。`}{question.explanation}</p>}</fieldset>)}
          <div className="lesson-actions"><button className="button outline" disabled={!allAnswered} onClick={() => updateRecord({ checked: true })}>查看答案与解析</button><button className="button" disabled={record.completed || !(record.checked && passed)} onClick={() => updateRecord({ completed: true, completedAt: new Date().toISOString() })}>{record.completed ? '✓ 本课已完成' : '标记本课完成'}</button></div>
          {record.completed && <div className="course-completed" role="status"><span>这节课已经学完，笔记和进度已保留。</span>{index < lessons.length - 1 && <button className="button small" onClick={() => selectLesson(lessons[index + 1].id)}>继续下一课 →</button>}</div>}
          {!allAnswered && <p className="quiz-hint">选好两道题的答案后，即可查看解析。</p>}
        </section>
        <nav className="lesson-pagination" aria-label="课程翻页"><button className="button outline small" disabled={index === 0} onClick={() => selectLesson(lessons[index - 1].id)}>← 上一课</button><small>依据：{lesson.source}</small>{index < lessons.length - 1 ? <button className="button small" onClick={() => selectLesson(lessons[index + 1].id)}>下一课 →</button> : <a className="button small" href="#review">去写学习复盘 →</a>}</nav>
        {index === lessons.length - 1 && <p className="tip">导读完成后，继续按 12 周计划练习。梅花和六爻的完整起卦、装卦与旺衰规则，需要结合注明来源的教材逐步学习；完成这里的小测不等于完成实操阶段。</p>}
      </article>
    </div>
  </>;
}

function LineExplorer() {
  const [base, setBase] = useState([true,true,true,true,true,true]);
  const [moving, setMoving] = useState([1]);
  const positions = ['初爻 · 第 1 爻', '第 2 爻', '第 3 爻', '第 4 爻', '第 5 爻', '上爻 · 第 6 爻'];
  return <section className="line-explorer"><h3>点一点：从下往上数爻</h3><p>点击左侧线条切换本卦的阴阳，点击“静 / 动”选择动爻，再观察右侧的变化。</p>
    <div className="line-controls"><button className="button outline small" onClick={() => {setBase(Array(6).fill(true));setMoving([]);}}>设为六阳爻</button><button className="button outline small" onClick={() => {setBase(Array(6).fill(false));setMoving([]);}}>设为六阴爻</button><button className="button outline small" onClick={() => {setBase(Array(6).fill(true));setMoving([1]);}}>还原二爻动示例</button></div>
    <div className="hexagram-pair"><div><h4>本卦 · 点击线条或动静</h4>{[5,4,3,2,1,0].map(i => <div key={i} className={`line-row ${moving.includes(i) ? 'moving' : ''}`}><span>{positions[i]}</span><button className={`yao yao-button ${!base[i] ? 'yin' : ''}`} aria-label={`${positions[i]}，本卦${base[i] ? '阳' : '阴'}爻，点击切换`} onClick={() => setBase(lines => lines.map((line, index) => index === i ? !line : line))}><i/>{!base[i] && <i/>}</button><button className="line-toggle" aria-pressed={moving.includes(i)} aria-label={`${positions[i]}，${moving.includes(i) ? '取消' : '设为'}动爻`} onClick={() => setMoving(lines => lines.includes(i) ? lines.filter(n => n !== i) : [...lines, i])}>{moving.includes(i) ? '动' : '静'}</button></div>)}</div>
    <div><h4>变卦 · 动爻阴阳互换</h4>{[5,4,3,2,1,0].map(i => { const yang = moving.includes(i) ? !base[i] : base[i]; return <div key={i} className="line-row"><span>{i < 3 ? '下卦' : '上卦'}</span><span className={`yao ${yang ? '' : 'yin'}`}><i/>{!yang && <i/>}</span><small>{yang ? '阳' : '阴'}</small></div>; })}</div></div><p className="quiz-hint">这是爻位与变化的结构演示，动爻由你选择，用于学习练习。</p></section>;
}
