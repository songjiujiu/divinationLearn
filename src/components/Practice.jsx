import React, { useEffect, useId, useRef, useState } from 'react';
import { buildPractice, practiceCategories } from '../data/practice.js';
import '../practice.css';

export default function Practice({ history = [], onComplete }) {
  const [category, setCategory] = useState('elements');
  const [round, setRound] = useState(null);
  const practiceId = useId();
  const questionFocus = useRef(null);
  const resultFocus = useRef(null);
  const startFocus = useRef(null);
  const hadRound = useRef(false);
  const completionRecorded = useRef(false);
  const selectedCategory = practiceCategories.find(item => item.id === category);
  const label = id => practiceCategories.find(item => item.id === id)?.label || id;
  const roundQuestions = round?.questions;
  const roundIndex = round?.index;
  const roundFinished = round?.finished;
  useEffect(() => {
    if (roundQuestions) {
      (roundFinished ? resultFocus : questionFocus).current?.focus();
    } else if (hadRound.current) {
      startFocus.current?.focus();
    }
    hadRound.current = Boolean(roundQuestions);
  }, [roundQuestions, roundIndex, roundFinished]);
  function start(questions = buildPractice(category, 10), isReview = false) {
    completionRecorded.current = false;
    setRound({ questions, category, isReview, index: 0, selected: null, revealed: false, answers: [], finished: false });
  }
  function check() {
    setRound(current => {
      if (!current || current.finished || current.revealed || current.selected === null) return current;
      return { ...current, revealed: true, answers: [...current.answers, current.selected] };
    });
  }
  function next() {
    if (!round || !round.revealed || round.finished || completionRecorded.current) return;
    if (round.index < round.questions.length - 1) {
      setRound(current => current.revealed && !current.finished
        ? { ...current, index: current.index + 1, selected: null, revealed: false }
        : current);
      return;
    }
    const correct = round.questions.filter((item, index) => round.answers[index] === item.answer).length;
    completionRecorded.current = true;
    onComplete?.({ id: crypto.randomUUID(), category: round.category, total: round.questions.length, correct, completedAt: new Date().toISOString() });
    setRound(current => ({ ...current, finished: true }));
  }
  const question = round?.questions[round.index];
  const mistakes = round?.finished ? round.questions.map((item, index) => ({ ...item, selected: round.answers[index] })).filter(item => item.selected !== item.answer) : [];
  function retryMistakes() {
    const ids = new Set(mistakes.map(item => item.id));
    start(buildPractice(round.category, Number.MAX_SAFE_INTEGER).filter(item => ids.has(item.id)), true);
  }
  return <section className="practice-space" aria-label="基础记忆练习">
    <div className="practice-intro"><div><div className="eyebrow">先回忆，再核对 · MEMORY PRACTICE</div><h2>十道小题，把基础记牢</h2><p>根据手册中的五行、干支与八卦属性出题。每题提交后显示解析，帮助找到记混的地方。</p></div><span className="practice-total">{history.length} 次练习已完成</span></div>
    {!round && <>
      <div className="practice-categories" role="group" aria-label="选择练习内容">{practiceCategories.map(item => <button key={item.id} className={`practice-category ${category === item.id ? 'selected' : ''}`} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div>
      <div className="practice-start panel"><div><h3>本次练习：{selectedCategory.label}</h3><p>10 道单选题，约 5 分钟。完成全部题目并查看结果后，计入练习记录。</p><p>本页切换“知识速查”可保留答题进度；离开此页或刷新后，未完成的练习需重新开始。</p></div><button className="button" ref={startFocus} onClick={() => start()}>开始十题练习 →</button></div>
    </>}
    {round && !round.finished && <article className="practice-question panel">
      <div className="practice-progress" id={`${practiceId}-progress`}><span>{label(round.category)}{round.isReview ? ' · 错题重练' : ''}</span><b>第 {round.index + 1} / {round.questions.length} 题</b></div><div className="progress-track" role="progressbar" aria-label="本轮已作答题数" aria-valuemin={0} aria-valuemax={round.questions.length} aria-valuenow={round.answers.length}><i style={{ width: `${round.answers.length / round.questions.length * 100}%` }} /></div>
      <fieldset className="practice-options"><legend ref={questionFocus} tabIndex={-1} aria-describedby={`${practiceId}-progress`}>{question.prompt}</legend>{question.options.map((option, index) => <label className={`quiz-option ${round.selected === index ? 'chosen' : ''}`} key={`${question.id}-${option}`}><input type="radio" name={`${practiceId}-answer`} checked={round.selected === index} disabled={round.revealed} onChange={() => setRound(current => current.revealed ? current : ({ ...current, selected: index }))} /><span>{option}</span></label>)}</fieldset>
      <p className={round.revealed ? `answer-feedback ${round.selected === question.answer ? 'correct' : 'incorrect'}` : undefined} role="status" aria-atomic="true">{round.revealed && <>{round.selected === question.answer ? '答对了。' : `这题需要再记一遍，正确答案是“${question.options[question.answer]}”。`}{question.explanation}</>}</p>
      <div className="practice-actions"><button className="link-button text-link" onClick={() => setRound(null)}>结束本轮（不计入记录）</button>{round.revealed ? <button className="button" onClick={next}>{round.index + 1 === round.questions.length ? '查看本轮结果 →' : '下一题 →'}</button> : <button className="button" disabled={round.selected === null} onClick={check}>提交答案</button>}</div>
    </article>}
    {round?.finished && <article className="practice-result panel"><div className="eyebrow">本轮完成 · 已加入练习记录</div><h2 ref={resultFocus} tabIndex={-1}>本轮答对 {round.questions.length - mistakes.length} / {round.questions.length} 题</h2><p>{mistakes.length ? `还有 ${mistakes.length} 道题需要复习。对照解析再练一次，题目和选项会重新排序。` : '这一轮全部答对。可以换个分类继续练习。'}</p>
      {mistakes.length > 0 && <div className="practice-mistakes">{mistakes.map(item => <section key={item.id}><h3>{item.prompt}</h3><p>你的答案：{item.options[item.selected]}<br/><strong>正确答案：{item.options[item.answer]}</strong></p><p>{item.explanation}</p></section>)}</div>}
      <div className="practice-actions"><button className="button outline" onClick={() => setRound(null)}>返回分类</button>{mistakes.length > 0 && <button className="button" onClick={retryMistakes}>再练这 {mistakes.length} 道错题 →</button>}{mistakes.length === 0 && <button className="button" onClick={() => start()}>再来十题 →</button>}</div>
    </article>}
    {history.length > 0 && <section className="practice-history"><h3>最近的练习</h3><div>{history.slice(-5).reverse().map(item => <div className="practice-history-row" key={item.id}><span>{label(item.category)}</span><time dateTime={item.completedAt}>{new Date(item.completedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time><b>{item.correct}/{item.total} 题</b></div>)}</div><small>这里显示最近 5 次，全部记录包含在学习档案备份中。</small></section>}
  </section>;
}
