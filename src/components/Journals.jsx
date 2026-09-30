import React, { useId, useState } from 'react';
import '../journals.css';

const caseReasons = ['基础知识记错', '起卦 / 排卦错误', '取用问题', '旺衰判断问题', '生克动变分析问题', '事后解释倾向', '规则与现实结果不符', '暂时无法判断'];
const reviewReasons = ['基础知识', '起卦 / 排卦', '取用', '旺衰', '动变', '生克冲合', '事后解释', '暂时无法确定'];
const legacyReasons = ['基础知识记错', '起卦 / 排卦错误', '取用问题', '旺衰判断问题', '动变分析问题', '生克冲合问题', '事后解释倾向', '规则与现实不符', '暂时无法判断'];
const guaFields = [['base', '本卦'], ['upper', '上卦'], ['lower', '下卦'], ['moving', '动爻'], ['mutual', '互卦'], ['changed', '变卦']];
const analysisFields = [['relation', '五行关系'], ['focus', '体用 / 用神'], ['strength', '旺衰'], ['changes', '动变'], ['judgement', '当时的判断']];

function localDateTime() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function makeId() { return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function displayDate(date) { return String(date || '时间未填写').replace('T', ' '); }
function reasonLabels(values) { return Array.isArray(values) ? values.map(value => typeof value === 'number' || /^\d+$/.test(String(value)) ? legacyReasons[Number(value)] || `旧检查项 ${Number(value) + 1}` : String(value)) : []; }
function records(values) { return Array.isArray(values) ? values.filter(item => item && typeof item === 'object') : []; }
function readForm(form, trim = true) { return Object.fromEntries([...new FormData(form)].filter(([key]) => key !== 'reasons').map(([key, value]) => [key, trim && typeof value === 'string' ? value.trim() : value])); }
function readDraftForm(form, withReasons = false) { return { ...readForm(form, false), ...(withReasons ? { reasons: new FormData(form).getAll('reasons') } : {}) }; }
function hasDraft(draft) { return draft && typeof draft === 'object' && Object.keys(draft).length > 0; }
function appendDraftKey(item, index) { return String(item.id ?? `legacy-${index}`); }

function downloadMarkdown(filename, text, notify) {
  const blob = new Blob(['\uFEFF', text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').slice(0, 100)}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify?.('已发起 Markdown 下载');
}

function Field({ label, multiline = false, full = false, hint, ...props }) {
  const id = useId();
  const Tag = multiline ? 'textarea' : 'input';
  return <div className={`journal-field ${full ? 'journal-full' : ''}`}>
    <label htmlFor={id}>{label}{props.required && <span className="journal-required"> *</span>}</label>
    <Tag id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
    {hint && <small id={`${id}-hint`}>{hint}</small>}
  </div>;
}

function SelectField({ label, name, options, defaultValue }) {
  const id = useId();
  return <div className="journal-field"><label htmlFor={id}>{label}</label><select id={id} name={name} defaultValue={defaultValue}>{options.map(value => <option key={value}>{value}</option>)}</select></div>;
}

function ReasonChecks({ options, selected, onChange, legend = '可能原因（可多选）' }) {
  return <fieldset className="journal-reasons"><legend>{legend}</legend><div>{options.map(reason => <label key={reason}><input type="checkbox" name="reasons" value={reason} checked={selected.includes(reason)} onChange={event => onChange(event.target.checked ? [...selected, reason] : selected.filter(item => item !== reason))} /><span>{reason}</span></label>)}</div></fieldset>;
}

function DraftNote({ enabled }) {
  return enabled ? <p className="journal-draft-note"><span aria-hidden="true">●</span> 编辑内容自动保留为草稿，点击保存后才成为正式记录。</p> : null;
}

function ReadText({ label, value }) {
  return <section className="journal-read-section"><h4>{label}</h4><p className={value ? '' : 'journal-unfilled'}>{value || '未填写'}</p></section>;
}

function PageIntro({ eyebrow, title, children }) {
  return <div className="page-head"><div className="eyebrow">{eyebrow}</div><h1 className="page-title">{title}</h1><p className="subhead">{children}</p></div>;
}

function caseMarkdown(item) {
  const gua = item.gua || {};
  const analysis = item.analysisDetails ? analysisFields.map(([key, label]) => `### ${label}\n${item.analysisDetails[key] || '未填写'}`).join('\n\n') : item.analysis || '未填写';
  const entries = records(item.entries).map((entry, index) => `### 追加 ${index + 1} · ${displayDate(entry.time)}\n\n#### 实际结果\n${entry.result || '未填写'}\n\n#### 复盘\n${entry.reflection || '未填写'}\n\n#### 可能原因\n${reasonLabels(entry.reasons).map(reason => `- [x] ${reason}`).join('\n') || '未选择'}\n\n#### 本案例学到了什么\n${entry.learned || '未填写'}`).join('\n\n');
  return `# ${item.title || '学习案例'}\n\n案例编号：${item.number || item.id || '未编号'}\n学习体系：${item.system || '未注明'}\n\n## 问题\n${item.question || '未填写'}\n\n## 起卦 / 记录时间\n${displayDate(item.time)}\n\n## 起卦 / 记录方式\n${item.method || '未填写'}\n\n## 原始信息\n${item.raw || '未填写'}\n\n## 卦象\n${guaFields.map(([key, label]) => `${label}：${gua[key] || '未填写'}`).join('\n')}\n\n## 当时的分析（原始记录）\n${analysis}\n\n## 后续记录（按时间追加）\n${entries || '尚未追加实际结果与复盘。'}\n`;
}

function reviewMarkdown(item) {
  return `# ${item.week ? `第 ${item.week} 周复盘` : '每周复盘（旧记录未注明周数）'}\n\n记录日期：${item.date || '未填写'}\n\n## 本周学会了什么？\n${item.learned || '未填写'}\n\n## 哪些内容仍需要查表？\n${item.lookup || '未填写'}\n\n## 本周完成案例数\n数量：${item.count || 0}\n\n## 判断失败的案例\n${item.failed || '未填写'}\n\n## 失败原因\n${reasonLabels(item.reasons).map(reason => `- [x] ${reason}`).join('\n') || '未选择'}\n\n## 下周只解决三个问题\n${item.next || '未填写'}\n`;
}

function NewCaseForm({ onSave, draft = {}, onDraftChange }) {
  const [error, setError] = useState('');
  return <form className="journal-form" onChange={event => onDraftChange?.(readDraftForm(event.currentTarget))} onSubmit={event => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    if (![data.title, data.question, data.raw, data['analysis-judgement']].every(Boolean)) { setError('请填写标题、具体问题、原始信息和当时的判断，不能仅填写空格。'); return; }
    const gua = Object.fromEntries(guaFields.map(([key]) => [key, data[`gua-${key}`]]));
    const analysisDetails = Object.fromEntries(analysisFields.map(([key]) => [key, data[`analysis-${key}`]]));
    onSave({ id: makeId(), title: data.title, system: data.system, time: data.time, method: data.method, question: data.question, raw: data.raw, gua, analysisDetails, analysis: analysisFields.map(([key, label]) => `${label}：${analysisDetails[key] || '未填写'}`).join('\n'), createdAt: new Date().toISOString(), entries: [] });
  }}>
    <DraftNote enabled={!!onDraftChange} />
    <div className="journal-form-grid">
      <Field label="案例标题" name="title" defaultValue={draft.title ?? ''} required maxLength={120} placeholder="例如：案例 001 · 五行关系练习" full />
      <SelectField label="学习体系" name="system" defaultValue={draft.system ?? '基础练习'} options={['基础练习', '梅花易数', '六爻', '其他']} />
      <Field label="起卦 / 记录时间" type="datetime-local" name="time" defaultValue={draft.time ?? localDateTime()} required />
      <SelectField label="起卦 / 记录方式" name="method" defaultValue={draft.method ?? '未起卦 · 基础记录'} options={['未起卦 · 基础记录', '数字起卦', '时间起卦', '摇卦', '书中案例', '其他']} />
      <Field label="具体问题" name="question" defaultValue={draft.question ?? ''} full required multiline rows={2} placeholder="把这次练习要分析的问题写清楚，尽量包含观察期限。" />
      <Field label="原始信息" name="raw" defaultValue={draft.raw ?? ''} full required multiline rows={3} placeholder="记录练习材料、原始数字、六次摇卦结果，或教材名称与页码。" hint="先核对再保存。保存后保留原样，后续更正写在追加复盘中。" />
    </div>
    <fieldset className="journal-fieldset"><legend>卦象 · 学到哪里，填到哪里</legend><p>没有起卦时可留空。六爻从下往上数，最下面是初爻，最上面是上爻。</p><div className="journal-form-grid journal-gua-grid">{guaFields.map(([key, label]) => <Field key={key} label={label} name={`gua-${key}`} defaultValue={draft[`gua-${key}`] ?? ''} placeholder={key === 'moving' ? '如：初爻、三爻；无动爻写“无”' : `填写${label}`} />)}</div></fieldset>
    <fieldset className="journal-fieldset"><legend>当时的分析</legend><p>把规则、出处与自己的推演写下来；尚未学到的内容可以留空。</p><div className="journal-form-grid">{analysisFields.map(([key, label]) => <Field key={key} label={label} name={`analysis-${key}`} defaultValue={draft[`analysis-${key}`] ?? ''} multiline rows={2} full={key === 'judgement'} required={key === 'judgement'} placeholder={key === 'judgement' ? '写下此刻的判断、依据和不确定的地方；只做结构练习时，也可以写本次观察。' : `记录${label}与推演依据`} />)}</div></fieldset>
    {error && <p role="alert" className="journal-error">{error}</p>}
    <div className="journal-form-footer"><p>保存后，原始信息与当时分析将只读。</p><button type="submit" className="button">保存原始案例 →</button></div>
  </form>;
}

function AppendCaseForm({ onSave, draft = {}, onDraftChange }) {
  const [reasons, setReasons] = useState(() => reasonLabels(draft.reasons));
  const [error, setError] = useState('');
  return <form className="journal-append-form" onChange={event => onDraftChange?.(readDraftForm(event.currentTarget, true))} onSubmit={event => {
    event.preventDefault();
    const data = readForm(event.currentTarget);
    if (![data.result, data.reflection, data.learned].some(Boolean)) { setError('请至少填写实际结果、复盘或学到的内容中的一项。'); return; }
    onSave({ ...data, id: makeId(), time: localDateTime(), reasons });
    event.currentTarget.reset();
    setReasons([]);
    setError('');
  }}>
    <h4>追加结果与复盘</h4><p className="journal-help">补充新的观察，或写明对前一次记录的更正。原始分析和已保存的复盘都会保留。</p>
    <DraftNote enabled={!!onDraftChange} />
    <Field label="实际结果" name="result" defaultValue={draft.result ?? ''} multiline rows={2} placeholder="后来实际发生了什么？未到观察期限时，可注明“待观察”。" />
    <Field label="复盘" name="reflection" defaultValue={draft.reflection ?? ''} multiline rows={3} placeholder="哪些符合？哪些不符合？是否有事后牵强解释？" />
    <ReasonChecks options={caseReasons} selected={reasons} onChange={setReasons} />
    <Field label="本案例学到了什么？" name="learned" defaultValue={draft.learned ?? ''} multiline rows={2} placeholder="写下 1–3 条收获，或下一次需要核对的规则。" />
    {error && <p role="alert" className="journal-error">{error}</p>}
    <div className="journal-form-footer"><span>追加于保存时刻</span><button type="submit" className="button small">保存这次追加</button></div>
  </form>;
}

function CaseRecord({ item, index, onAppend, notify, draft = {}, onDraftChange }) {
  const entries = records(item.entries);
  const gua = item.gua || {};
  const [expanded, setExpanded] = useState(() => !!hasDraft(draft));
  return <details className="journal-record" open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}>
    <summary><span className="journal-record-number">{String(item.number || index + 1).padStart(3, '0')}</span><span className="journal-record-heading"><strong>{item.title || '未命名案例'}</strong><small>{displayDate(item.time)} · {item.method || '方法未填写'}{hasDraft(draft) ? ' · 有未提交草稿' : ''}</small></span><span className="journal-record-state">{entries.length ? `${entries.length} 次追加` : '待观察'}</span><span className="journal-chevron" aria-hidden="true">⌄</span></summary>
    <div className="journal-record-body">
      <div className="journal-record-actions"><span className="journal-lock">{item.system ? `${item.system} · ` : ''}原始记录只读</span><button type="button" className="button outline small" onClick={() => downloadMarkdown(`案例-${String(item.number || index + 1).padStart(3, '0')}-${item.title || '学习记录'}`, caseMarkdown(item), notify)}>下载 Markdown</button></div>
      <ReadText label="具体问题" value={item.question} />
      <ReadText label="原始信息" value={item.raw} />
      <section className="journal-read-section"><h4>卦象</h4><dl className="journal-gua-read">{guaFields.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{gua[key] || '未填写'}</dd></div>)}</dl></section>
      <section className="journal-original-analysis"><h3>当时的分析</h3>{item.analysisDetails ? analysisFields.map(([key, label]) => <ReadText key={key} label={label} value={item.analysisDetails[key]} />) : <p className="journal-preserve">{item.analysis || '未填写分析'}</p>}</section>
      <section className="journal-entries"><h3>后续结果与复盘 <span>{entries.length}</span></h3>{entries.length === 0 ? <p className="journal-help">结果还没发生也没关系。等有实际观察后，再追加到这里。</p> : entries.map((entry, entryIndex) => <article className="journal-entry" key={entry.id || entryIndex}><div className="journal-entry-head"><strong>追加 {entryIndex + 1}</strong><time>{displayDate(entry.time)}</time></div><ReadText label="实际结果" value={entry.result} /><ReadText label="复盘" value={entry.reflection} />{reasonLabels(entry.reasons).length > 0 && <div className="journal-reason-tags" aria-label="可能原因">{reasonLabels(entry.reasons).map((reason, reasonIndex) => <span key={`${reason}-${reasonIndex}`}>{reason}</span>)}</div>}<ReadText label="本案例学到了什么？" value={entry.learned} /></article>)}</section>
      <AppendCaseForm key={entries.length} draft={draft} onDraftChange={onDraftChange} onSave={entry => onAppend(entry)} />
    </div>
  </details>;
}

export function CasesPage({ cases = [], onChange, notify, drafts = {}, onDraftChange }) {
  const list = records(cases);
  const [showForm, setShowForm] = useState(list.length === 0 || hasDraft(drafts.caseNew));
  const [search, setSearch] = useState('');
  const visible = list.map((item, index) => ({ item, index })).filter(({ item }) => [item.title, item.question, item.method, item.system, item.number].join(' ').toLowerCase().includes(search.trim().toLowerCase())).reverse();
  const formId = useId();
  return <div className="journals-page">
    <PageIntro eyebrow="CASE JOURNAL" title="让每一次练习，都留下依据">先写问题和当时的分析，再等待结果、追加复盘。成功与失败的案例都值得保留。</PageIntro>
    <div className="journal-workflow" aria-label="案例记录顺序"><span><b>01</b>记录问题与原始信息</span><span><b>02</b>保存当时的分析</span><span><b>03</b>追加结果与复盘</span></div>
    <div className="journal-section-head"><div><h2>我的案例本 <span>{list.length} 篇</span></h2><p>新手可以先记录一次基础练习，复杂卦象留待学到时填写。</p></div><button type="button" className={`button ${showForm ? 'outline' : ''}`} aria-expanded={showForm} aria-controls={formId} onClick={() => setShowForm(!showForm)}>{showForm ? '收起填写区' : '+ 记录新案例'}</button></div>
    <section id={formId} className="journal-compose" hidden={!showForm}><h2>记录一个新案例</h2><NewCaseForm key={list.length} draft={drafts.caseNew} onDraftChange={onDraftChange ? value => onDraftChange('caseNew', value) : undefined} onSave={item => { onChange([...list, { ...item, number: Math.max(list.length, ...list.map(record => Number(record.number) || 0)) + 1 }]); onDraftChange?.('caseNew', {}); setShowForm(false); setSearch(''); notify?.('案例已保存；以后可展开记录追加复盘'); }} /></section>
    {list.length > 0 && <div className="journal-search"><Field label="查找案例" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索标题、问题、方法或编号" /><span>展开一条记录，查看全文或追加结果</span></div>}
    <div className="journal-records">{visible.map(({ item, index }) => <CaseRecord key={item.id || index} item={item} index={index} notify={notify} draft={drafts.caseAppend?.[appendDraftKey(item, index)]} onDraftChange={onDraftChange ? value => onDraftChange('caseAppend', { ...drafts.caseAppend, [appendDraftKey(item, index)]: value }) : undefined} onAppend={entry => { onChange(list.map((record, recordIndex) => recordIndex === index ? { ...record, entries: [...records(record.entries), entry] } : record)); const remainingDrafts = { ...drafts.caseAppend }; delete remainingDrafts[appendDraftKey(item, index)]; onDraftChange?.('caseAppend', remainingDrafts); notify?.('复盘已追加，原始分析已保留'); }} />)}</div>
    {list.length === 0 && <div className="journal-empty"><span aria-hidden="true">↗</span><h3>第一篇记录，从写清楚问题开始</h3><p>填好上面的原始信息与学习观察，再保存到案例本。</p></div>}
    {list.length > 0 && visible.length === 0 && <div className="journal-empty"><h3>没有找到匹配的案例</h3><p>试试更短的关键词，或清空搜索内容。</p></div>}
  </div>;
}

function ReviewRecord({ item, index, notify }) {
  return <details className="journal-record"><summary><span className="journal-record-number">{item.week ? `W${String(item.week).padStart(2, '0')}` : '旧'}</span><span className="journal-record-heading"><strong>{item.week ? `第 ${item.week} 周复盘` : '旧复盘 · 周数未记录'}</strong><small>{item.date || '日期未填写'} · {item.count || 0} 个案例</small></span><span className="journal-chevron" aria-hidden="true">⌄</span></summary><div className="journal-record-body"><div className="journal-record-actions"><span className="journal-lock">完整复盘记录</span><button type="button" className="button outline small" onClick={() => downloadMarkdown(item.week ? `第${item.week}周复盘-${item.date}` : `旧复盘-${index + 1}`, reviewMarkdown(item), notify)}>下载 Markdown</button></div><ReadText label="本周学会了什么？" value={item.learned} /><ReadText label="哪些内容仍需要查表？" value={item.lookup} /><ReadText label="判断失败或需要继续观察的案例" value={item.failed} /><section className="journal-read-section"><h4>失败原因</h4>{reasonLabels(item.reasons).length ? <div className="journal-reason-tags">{reasonLabels(item.reasons).map((reason, reasonIndex) => <span key={`${reason}-${reasonIndex}`}>{reason}</span>)}</div> : <p className="journal-unfilled">未选择</p>}</section><ReadText label="下周只解决三个问题" value={item.next} /></div></details>;
}

export function ReviewPage({ reviews = [], cases = [], onChange, notify, drafts = {}, onDraftChange }) {
  const list = records(reviews);
  const caseList = records(cases);
  const draft = drafts.reviewNew || {};
  const [reasons, setReasons] = useState(() => reasonLabels(draft.reasons));
  const [error, setError] = useState('');
  const suggestedWeek = Math.max(0, ...list.map(item => Number(item.week) || 0)) + 1;
  return <div className="journals-page">
    <PageIntro eyebrow="WEEKLY REFLECTION" title="每周停一停，看看学到了什么">记住的、仍需查表的、判断不符的，都写下来。下周集中解决三个问题。</PageIntro>
    <div className="journal-review-layout">
      <section className="journal-compose"><h2>写下本周复盘</h2><p className="journal-help">周数按自己的学习进度填写；同一周也可以保存补充记录。</p><form className="journal-form" onChange={event => onDraftChange?.('reviewNew', readDraftForm(event.currentTarget, true))} onSubmit={event => {
        event.preventDefault();
        const data = readForm(event.currentTarget);
        if (!data.learned || !data.next) { setError('请填写本周学到的内容和下周要解决的问题，不能仅填写空格。'); return; }
        const item = { ...data, week: Number(data.week), count: Number(data.count) || 0, reasons: [...reasons], id: makeId(), date: localDateTime().slice(0, 10), createdAt: new Date().toISOString() };
        onChange([...list, item]);
        onDraftChange?.('reviewNew', {});
        event.currentTarget.reset();
        setReasons([]);
        setError('');
        notify?.(`第 ${item.week} 周复盘已保存，可在下方展开查看`);
      }} key={list.length}>
        <DraftNote enabled={!!onDraftChange} />
        <div className="journal-form-grid"><Field label="学习周数" name="week" type="number" min="1" step="1" defaultValue={draft.week ?? suggestedWeek} required hint="12 周是建议节奏，超过 12 周也可以继续记录。" /><Field label="本周完成案例数" name="count" type="number" min="0" step="1" defaultValue={draft.count ?? '0'} required hint="填写本周实际完成的数量。" /></div>
        <Field label="本周学会了什么？" name="learned" defaultValue={draft.learned ?? ''} multiline rows={3} required placeholder={'1. 能按顺序写出五行相生\n2. …\n3. …'} />
        <Field label="哪些内容仍需要查表？" name="lookup" defaultValue={draft.lookup ?? ''} multiline rows={2} placeholder="例如：天干阴阳、八卦方位；没有也可以写“暂无”。" />
        <Field label="判断失败或需要继续观察的案例" name="failed" defaultValue={draft.failed ?? ''} multiline rows={2} placeholder="填写案例编号、标题与不符合的地方；还没有案例可写“暂无”。" />
        <ReasonChecks options={reviewReasons} selected={reasons} onChange={setReasons} legend="失败原因（有依据再勾选，可多选）" />
        <Field label="下周只解决三个问题" name="next" defaultValue={draft.next ?? ''} multiline rows={3} required placeholder={'1. …\n2. …\n3. …'} />
        {error && <p role="alert" className="journal-error">{error}</p>}
        <div className="journal-form-footer"><span>保存后可下载完整 Markdown</span><button type="submit" className="button">保存本周复盘 →</button></div>
      </form></section>
      <aside className="journal-review-aside"><section className="journal-note"><div className="eyebrow">复盘时，问问自己</div><h3>能解释“为什么”了吗？</h3><ol><li>不看资料，我能讲清楚哪些概念？</li><li>分析的每一步，都有当时写下的依据吗？</li><li>结果不符合时，我有没有保留原判断？</li><li>下周哪三个小问题最值得解决？</li></ol></section><section className="journal-note journal-case-reference"><h3>翻翻案例本 <span>{caseList.length} 篇</span></h3>{caseList.length ? <ul>{caseList.slice(-5).reverse().map((item, index) => <li key={item.id || index}><span>{String(item.number || caseList.length - index).padStart(3, '0')}</span><strong>{item.title || '未命名案例'}</strong></li>)}</ul> : <p>还没有案例也能复盘。先写基础知识的收获与疑问。</p>}<a href="#cases" className="text-link">去案例记录 →</a></section><p className="journal-help">复盘原因用来定位下一步练习。没有足够信息时，可以选择“暂时无法确定”。</p></aside>
    </div>
    <div className="journal-section-head"><div><h2>过往复盘 <span>{list.length} 篇</span></h2><p>展开查看完整内容，包括检查项和下周计划。</p></div></div>
    <div className="journal-records">{list.map((item, index) => ({ item, index })).reverse().map(({ item, index }) => <ReviewRecord key={item.id || index} item={item} index={index} notify={notify} />)}</div>
    {list.length === 0 && <div className="journal-empty"><h3>你的第一周，从一份小结开始</h3><p>今天学会一个概念，也值得记录。</p></div>}
  </div>;
}
