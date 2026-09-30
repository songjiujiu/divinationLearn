export const BACKUP_APP = 'yixue-study';
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
export const BEFORE_RESTORE_KEY = 'yixue-study-before-restore';

const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const dangerousKeys = new Set(['__proto__', 'constructor', 'prototype']);
const fail = (path, message) => { throw new Error(`${path}：${message}`); };
const text = (value, path) => {
  if (typeof value !== 'string') fail(path, '应为文字');
  return value;
};
const bool = (value, path) => {
  if (typeof value !== 'boolean') fail(path, '应为是 / 否');
  return value;
};
const integer = (value, path) => {
  if (!Number.isSafeInteger(value) || value < 0) fail(path, '应为非负整数');
  return value;
};
const id = (value, path) => {
  if (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) return value;
  fail(path, '应为文字或数字编号');
};
const legacyNumber = (value, path) => {
  if (typeof value === 'string' && /^\d+$/.test(value) && Number.isSafeInteger(Number(value))) return value;
  return integer(value, path);
};
const isoDate = (value, path) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) || !Number.isFinite(Date.parse(value))) fail(path, '应为有效的 ISO 时间');
  // Date.parse normalizes dates such as February 30; reject those rather than changing them.
  if (new Date(value).toISOString().slice(0, 19) !== value.slice(0, 19)) fail(path, '应为有效的 ISO 时间');
  return value;
};
const practiceCategory = (value, path) => {
  text(value, path);
  if (!['elements', 'stems', 'branches', 'trigrams'].includes(value)) fail(path, '不支持的练习分类');
  return value;
};

function object(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) fail(path, '应为记录对象');
  return value;
}

function shape(value, fields, path) {
  object(value, path);
  const result = {};
  for (const key of Object.keys(value)) {
    if (dangerousKeys.has(key) || !has(fields, key)) fail(`${path}.${key}`, '不支持的字段');
    result[key] = fields[key](value[key], `${path}.${key}`);
  }
  return result;
}

function dictionary(value, validate, path) {
  object(value, path);
  const result = {};
  for (const key of Object.keys(value)) {
    if (dangerousKeys.has(key)) fail(`${path}.${key}`, '不支持的键名');
    result[key] = validate(value[key], `${path}.${key}`);
  }
  return result;
}

function list(value, validate, path) {
  if (!Array.isArray(value)) fail(path, '应为列表');
  return Array.from(value, (item, index) => validate(item, `${path}[${index}]`));
}

const textFields = names => Object.fromEntries(names.map(name => [name, text]));
const reasons = (value, path) => list(value, (item, itemPath) => typeof item === 'string' ? item : integer(item, itemPath), path);
const gua = (value, path) => shape(value, textFields(['base', 'upper', 'lower', 'moving', 'mutual', 'changed']), path);
const analysis = (value, path) => shape(value, textFields(['relation', 'focus', 'strength', 'changes', 'judgement']), path);
const entry = (value, path) => shape(value, {
  ...textFields(['time', 'result', 'reflection', 'learned', 'createdAt']), id, reasons,
}, path);
const caseRecord = (value, path) => shape(value, {
  ...textFields(['title', 'system', 'time', 'method', 'question', 'raw', 'analysis', 'createdAt']),
  id, number: legacyNumber, gua, analysisDetails: analysis,
  entries: (items, itemPath) => list(items, entry, itemPath),
}, path);
const reviewRecord = (value, path) => shape(value, {
  ...textFields(['date', 'learned', 'lookup', 'failed', 'next', 'createdAt']),
  id, week: legacyNumber, count: (value, path) => value === '' ? '' : legacyNumber(value, path), reasons,
}, path);
const lessonRecord = (value, path) => shape(value, {
  note: text, checked: bool, completed: bool, completedAt: isoDate,
  answers: (items, itemPath) => dictionary(items, integer, itemPath),
}, path);
const caseDraft = (value, path) => shape(value, textFields([
  'title', 'system', 'time', 'method', 'question', 'raw',
  'gua-base', 'gua-upper', 'gua-lower', 'gua-moving', 'gua-mutual', 'gua-changed',
  'analysis-relation', 'analysis-focus', 'analysis-strength', 'analysis-changes', 'analysis-judgement',
]), path);
const appendDraft = (value, path) => shape(value, {
  ...textFields(['result', 'reflection', 'learned']), reasons,
}, path);
const reviewDraft = (value, path) => shape(value, {
  ...textFields(['week', 'count', 'learned', 'lookup', 'failed', 'next']), reasons,
}, path);

function practiceRecord(value, path) {
  const result = shape(value, { id, category: practiceCategory, total: integer, correct: integer, completedAt: isoDate }, path);
  for (const key of ['id', 'category', 'total', 'correct', 'completedAt']) {
    if (!has(result, key)) fail(`${path}.${key}`, '缺少字段');
  }
  if (result.total === 0 || result.correct > result.total) fail(path, '答对数量必须在题目总数以内，题目总数应大于零');
  return result;
}

function localDay() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Clone and validate every rendered field. Missing fields in older saves get defaults. */
export function normalizeState(raw) {
  const value = shape(raw, {
    tasks: (items, path) => dictionary(items, bool, path),
    taskDate: text,
    learned: (items, path) => dictionary(items, bool, path),
    cases: (items, path) => list(items, caseRecord, path),
    reviews: (items, path) => list(items, reviewRecord, path),
    stageDone: (items, path) => dictionary(items, bool, path),
    milestones: (items, path) => dictionary(items, bool, path),
    study: (items, path) => shape(items, {
      current: text, records: (records, recordPath) => dictionary(records, lessonRecord, recordPath),
    }, path),
    drafts: (items, path) => shape(items, {
      caseNew: caseDraft,
      caseAppend: (records, recordPath) => dictionary(records, appendDraft, recordPath),
      reviewNew: reviewDraft,
    }, path),
    practiceHistory: (items, path) => list(items, practiceRecord, path),
    reader: (items, path) => shape(items, {
      selectedHexagram: text,
      notes: (records, recordPath) => dictionary(records, text, recordPath),
      bookmarks: (records, recordPath) => dictionary(records, bool, recordPath),
    }, path),
  }, '阅读档案');
  return {
    tasks: {}, taskDate: localDay(), learned: {}, cases: [], reviews: [], stageDone: {}, milestones: {},
    ...value,
    study: { current: 'yin-yang', records: {}, ...value.study },
    drafts: { caseNew: {}, caseAppend: {}, reviewNew: {}, ...value.drafts },
    practiceHistory: value.practiceHistory || [],
    reader: { selectedHexagram: 'qian', notes: {}, bookmarks: {}, ...value.reader },
  };
}

/** Validate the supported envelope and return an independently cloned backup. */
export function validateBackup(raw) {
  object(raw, '备份');
  for (const key of Object.keys(raw)) {
    if (!['app', 'version', 'exportedAt', 'state'].includes(key)) fail(`备份.${key}`, '不支持的字段');
  }
  if (raw.app !== BACKUP_APP) fail('备份', '不是受支持的阅读档案或旧版学习档案');
  if (raw.version !== BACKUP_VERSION) fail('备份版本', '暂不支持，请使用版本 1 的备份');
  isoDate(raw.exportedAt, '导出时间');
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: raw.exportedAt, state: normalizeState(raw.state) };
}

export function createBackup(state) {
  return validateBackup({ app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), state });
}

/** Size is measured as UTF-8 bytes, matching File.size, rather than character count. */
export function parseBackup(contents) {
  if (typeof contents !== 'string') fail('备份文件', '应为 JSON 文本');
  if (new TextEncoder().encode(contents).byteLength > MAX_BACKUP_BYTES) fail('备份文件', '超过 5 MB，未读取或改动当前档案');
  let value;
  try { value = JSON.parse(contents.replace(/^\uFEFF/, '')); }
  catch { fail('备份文件', 'JSON 格式错误，请重新选择完整的备份文件'); }
  return validateBackup(value);
}
