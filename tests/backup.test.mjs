import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, parseBackup, validateBackup, normalizeState, MAX_BACKUP_BYTES } from '../src/lib/backup.js';

function sampleState() {
  return normalizeState({
    tasks: { 0: true, 1: false }, taskDate: '2026-09-30', learned: { 2: true },
    milestones: { '0-0': true }, stageDone: { 0: true },
    cases: [{ id: 'case-1', number: 1, title: '第一次练习', question: '本周完成三课？', raw: '  原始资料\n不删空格。\n',
      system: '基础练习', gua: { upper: '乾', lower: '坤' }, analysisDetails: { judgement: '待验证' },
      entries: [{ id: 'entry-1', time: '2026-09-30T10:30', result: '完成两课', reflection: '保留原判断', learned: '继续练习', reasons: ['基础知识记错'] }] }],
    reviews: [{ id: 'review-1', week: 1, count: 1, date: '2026-09-30', learned: '阴阳', lookup: '八卦', failed: '暂无', next: '1. 看图\n2. 默写\n3. 复盘', reasons: ['基础知识'] }],
    study: { current: 'yin-yang', records: { 'yin-yang': { note: '  不截断我的笔记\n', answers: { 0: 1, 1: 2 }, checked: true, completed: true, completedAt: '2026-09-30T01:00:00.000Z' } } },
    drafts: { caseNew: { title: '还没有保存', 'analysis-judgement': '待观察' }, caseAppend: { 'case-1': { result: '草稿', reasons: ['暂时无法判断'] } }, reviewNew: { week: '', count: '0', learned: '新收获', reasons: [] } },
    practiceHistory: [{ id: 'run-1', category: 'elements', total: 8, correct: 6, completedAt: '2026-09-30T01:00:00.000Z' }],
  });
}

test('完整学习档案往返保留笔记、追加、草稿、练习与文本空白', () => {
  const original = sampleState();
  const restored = parseBackup(JSON.stringify(createBackup(original))).state;
  assert.deepEqual(restored, original);
  restored.cases[0].title = '改动副本';
  assert.equal(original.cases[0].title, '第一次练习');
});

test('旧版数值编号、字符串编号、原因索引和缺失新字段兼容', () => {
  const raw = { cases: [{ id: 1720000000000, number: '001', title: '旧案例', analysis: '原始分析', entries: [{ id: 'old-entry', result: '旧结果', reasons: [0, 6, 8] }] }], reviews: [{ id: 42, count: '2', reasons: [1, 7] }], study: { records: { 'yin-yang': { note: '旧笔记' } } } };
  const state = normalizeState(raw);
  assert.equal(state.cases[0].id, 1720000000000);
  assert.equal(state.cases[0].number, '001');
  assert.deepEqual(state.cases[0].entries[0].reasons, [0, 6, 8]);
  assert.equal(state.study.current, 'yin-yang');
  assert.deepEqual(state.drafts, { caseNew: {}, caseAppend: {}, reviewNew: {} });
  assert.deepEqual(state.practiceHistory, []);
  assert.match(state.taskDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual(parseBackup(JSON.stringify(createBackup(raw))).state, state);
});

test('原生旧版未填写案例数量的空字符串复盘可往返恢复', () => {
  const state = { reviews: [{ id: 1712345678, count: '', learned: '  学习记录原文\n', reasons: [0] }] };
  const restored = parseBackup(JSON.stringify(createBackup(state))).state;
  assert.equal(restored.reviews[0].count, '');
  assert.equal(restored.reviews[0].learned, '  学习记录原文\n');
  assert.throws(() => normalizeState({ reviews: [{ count: 'abc' }] }));
});

test('拒绝所有会把对象当成 React 文本的嵌套字段', () => {
  const invalid = [
    { cases: [{ title: { forged: true } }] },
    { cases: [{ id: {} }] },
    { cases: [{ gua: { upper: [] } }] },
    { cases: [{ analysisDetails: { judgement: {} } }] },
    { cases: [{ entries: [{ result: {} }] }] },
    { reviews: [{ learned: {} }] },
    { reviews: [{ count: {} }] },
    { reviews: [{ reasons: [{}] }] },
    { study: { records: { lesson: { note: {} } } } },
    { study: { records: { lesson: { answers: { 0: {} } } } } },
    { drafts: { caseNew: { title: {} } } },
    { drafts: { caseAppend: { one: { reasons: [{}] } } } },
    { drafts: { reviewNew: { learned: [] } } },
    { practiceHistory: [{ id: 'a', category: {}, total: 1, correct: 1, completedAt: 'now' }] },
  ];
  for (const value of invalid) assert.throws(() => normalizeState(value), /应为/);
});

test('严格字段白名单与映射键检查，阻止原型键与未知数据', () => {
  for (const source of ['{"__proto__":{}}', '{"tasks":{"__proto__":true}}', '{"study":{"records":{"constructor":{}}}}', '{"cases":[{"title":"ok","surprise":"不可默默丢弃"}]}']) {
    assert.throws(() => normalizeState(JSON.parse(source)), /不支持/);
  }
  assert.equal({}.polluted, undefined);
  assert.throws(() => normalizeState({ cases: [null] }), /记录对象/);
  assert.throws(() => normalizeState({ learned: [] }), /记录对象/);
  assert.throws(() => normalizeState({ tasks: { 1: 'true' } }), /是 \/ 否/);
});

test('损坏 JSON、未知版本、外来 app、错误 envelope 不可恢复', () => {
  const backup = createBackup(sampleState());
  assert.throws(() => parseBackup('{broken'), /JSON 格式错误/);
  assert.throws(() => validateBackup({ ...backup, version: 2 }), /不支持/);
  assert.throws(() => validateBackup({ ...backup, app: 'other' }), /不是/);
  assert.throws(() => validateBackup({ ...backup, exportedAt: 'not-a-date' }), /ISO/);
  assert.throws(() => validateBackup({ ...backup, state: [] }), /记录对象/);
  assert.throws(() => validateBackup({ ...backup, unexpected: 1 }), /不支持/);
  assert.throws(() => validateBackup(null), /记录对象/);
});

test('按 UTF-8 字节限制 5 MB，兼容文本 BOM，保留长文本全文', () => {
  const content = '长笔记'.repeat(20000);
  const backup = createBackup({ study: { records: { one: { note: content } } } });
  assert.equal(parseBackup('\uFEFF' + JSON.stringify(backup)).state.study.records.one.note, content);
  assert.throws(() => parseBackup('字'.repeat(Math.ceil(MAX_BACKUP_BYTES / 3) + 1)), /超过 5 MB/);
});

test('练习成绩必须有合法总数与正确数，编号和数组元素禁止异常类型', () => {
  const entry = { id: 'run', category: 'elements', total: 5, correct: 4, completedAt: '2026-09-30T01:00:00.000Z' };
  for (const patch of [{ total: 0 }, { correct: 6 }, { correct: -1 }, { correct: 1.5 }, { id: NaN }]) {
    assert.throws(() => normalizeState({ practiceHistory: [{ ...entry, ...patch }] }));
  }
  assert.throws(() => normalizeState({ practiceHistory: [{ category: 'elements' }] }), /缺少字段/);
  const state = sampleState();
  const before = JSON.stringify(state);
  assert.throws(() => validateBackup({ ...createBackup(state), state: { cases: [{ title: {} }] } }));
  assert.equal(JSON.stringify(state), before, '验证失败不能修改当前档案');
});

test('练习只接受现有四类及有效 ISO 日期，拒绝非法日历日期', () => {
  const entry = { id: 'run', category: 'elements', total: 5, correct: 4, completedAt: '2026-09-30T01:00:00.000Z' };
  for (const category of ['elements', 'stems', 'branches', 'trigrams']) {
    assert.equal(normalizeState({ practiceHistory: [{ ...entry, category }] }).practiceHistory[0].category, category);
  }
  assert.throws(() => normalizeState({ practiceHistory: [{ ...entry, category: 'unknown' }] }), /不支持的练习分类/);
  for (const completedAt of ['now', '2026-09-30', '2026-02-30T01:00:00.000Z', '2026-13-30T01:00:00.000Z']) {
    assert.throws(() => normalizeState({ practiceHistory: [{ ...entry, completedAt }] }), /ISO 时间/);
    assert.throws(() => normalizeState({ study: { records: { lesson: { completedAt } } } }), /ISO 时间/);
  }
  const backup = createBackup({});
  assert.throws(() => validateBackup({ ...backup, exportedAt: '2026-02-30T01:00:00Z' }), /ISO 时间/);
});
