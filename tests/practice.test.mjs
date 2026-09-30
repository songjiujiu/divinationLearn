import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPractice, practiceCategories } from '../src/data/practice.js';

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function answersByPrompt(category) {
  return new Map(buildPractice(category, 1000, seededRandom(19)).map((question) => [question.prompt, question.options[question.answer]]));
}

test('四种分类都有足量、完整、互不重复的题目与选项', () => {
  assert.deepEqual(practiceCategories.map(({ id }) => id), ['elements', 'stems', 'branches', 'trigrams']);
  for (const category of practiceCategories) {
    assert.ok(category.label.length > 0 && category.description.length > 0);
    assert.equal(buildPractice(category.id, undefined, seededRandom(1)).length, 10);
    const questions = buildPractice(category.id, 1000, seededRandom(2));
    assert.ok(questions.length >= 10);
    assert.equal(new Set(questions.map(({ id }) => id)).size, questions.length);
    assert.equal(new Set(questions.map(({ prompt }) => prompt)).size, questions.length);
    for (const question of questions) {
      assert.ok(question.prompt && question.explanation);
      assert.ok(question.options.length >= 2 && question.options.length <= 4);
      assert.equal(new Set(question.options).size, question.options.length);
      assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length);
      assert.equal(question.options.filter((option) => option === question.options[question.answer]).length, 1);
    }
  }
});

test('五行题符合手册，正反方向不混淆', () => {
  const answers = answersByPrompt('elements');
  const generationPairs = ['木火', '火土', '土金', '金水', '水木'];
  const controlPairs = ['木土', '土水', '水火', '火金', '金木'];

  for (const [source, target] of generationPairs) {
    assert.equal(answers.get(`${source}生哪个五行？`), target);
    assert.equal(answers.get(`哪个五行生${target}？`), source);
    assert.equal(answers.get(`依次给出“${source}”和“${target}”，两者的关系是什么？`), '前者生后者');
    assert.equal(answers.get(`依次给出“${target}”和“${source}”，两者的关系是什么？`), '后者生前者');
  }
  for (const [source, target] of controlPairs) {
    assert.equal(answers.get(`${source}克哪个五行？`), target);
    assert.equal(answers.get(`哪个五行克${target}？`), source);
    assert.equal(answers.get(`依次给出“${source}”和“${target}”，两者的关系是什么？`), '前者克后者');
    assert.equal(answers.get(`依次给出“${target}”和“${source}”，两者的关系是什么？`), '后者克前者');
  }
  for (const element of '木火土金水') {
    assert.equal(answers.get(`依次给出“${element}”和“${element}”，两者的关系是什么？`), '同一五行（比和）');
  }
  assert.equal(answers.size, 45, '应覆盖 20 道有方向的生克题和全部 25 种有序配对');
});

test('十天干题覆盖手册全部阴阳与五行属性', () => {
  const answers = answersByPrompt('stems');
  const expected = {
    甲: '阳木', 乙: '阴木', 丙: '阳火', 丁: '阴火', 戊: '阳土',
    己: '阴土', 庚: '阳金', 辛: '阴金', 壬: '阳水', 癸: '阴水',
  };
  for (const [stem, [polarity, element]] of Object.entries(expected)) {
    assert.equal(answers.get(`天干“${stem}”的五行是什么？`), element);
    assert.equal(answers.get(`天干“${stem}”属阴还是属阳？`), polarity);
    assert.equal(answers.get(`天干“${stem}”的阴阳与五行合起来是什么？`), `${polarity}${element}`);
  }
  assert.equal(answers.size, 30);
});

test('十二地支题准确保留四土与其他五行分组', () => {
  const answers = answersByPrompt('branches');
  const expectedGroups = { 木: '寅卯', 火: '巳午', 土: '丑辰未戌', 金: '申酉', 水: '子亥' };
  for (const [element, branches] of Object.entries(expectedGroups)) {
    for (const branch of branches) {
      assert.equal(answers.get(`地支“${branch}”的五行是什么？`), element);
    }
  }
  assert.equal(answers.size, 12);
});

test('八卦采用手册后天方位，四正四隅均不倒置', () => {
  const answers = answersByPrompt('trigrams');
  const expected = {
    坎: ['水', '北'], 艮: ['土', '东北'], 震: ['木', '东'], 巽: ['木', '东南'],
    离: ['火', '南'], 坤: ['土', '西南'], 兑: ['金', '西'], 乾: ['金', '西北'],
  };
  for (const [trigram, [element, direction]] of Object.entries(expected)) {
    assert.equal(answers.get(`“${trigram}”卦的五行是什么？`), element);
    assert.equal(answers.get(`“${trigram}”卦的后天方位是什么？`), direction);
  }
  assert.equal(answers.size, 16);
});

test('同一随机种子重现题序和选项，不同种子会变化且不损坏答案', () => {
  const first = buildPractice('elements', 10, seededRandom(42));
  const repeated = buildPractice('elements', 10, seededRandom(42));
  const different = buildPractice('elements', 10, seededRandom(43));
  assert.deepEqual(first, repeated);
  assert.notDeepEqual(first.map(({ id }) => id), different.map(({ id }) => id));

  const fullA = buildPractice('trigrams', 1000, seededRandom(7));
  const fullB = buildPractice('trigrams', 1000, seededRandom(8));
  const byIdB = new Map(fullB.map((question) => [question.id, question]));
  assert.ok(fullA.some((question) => JSON.stringify(question.options) !== JSON.stringify(byIdB.get(question.id).options)));
  for (const question of fullA) {
    const other = byIdB.get(question.id);
    assert.equal(question.options[question.answer], other.options[other.answer]);
  }
});

test('返回值相互独立，外部修改一轮练习不会污染下一轮', () => {
  const baseline = buildPractice('stems', 10, seededRandom(21));
  const modified = buildPractice('stems', 10, seededRandom(21));
  modified[0].options[0] = '被调用方修改';
  modified[0].prompt = '被调用方修改';
  modified.pop();
  assert.deepEqual(buildPractice('stems', 10, seededRandom(21)), baseline);
});

test('题量边界可预期，不为凑数重复题目', () => {
  assert.deepEqual(buildPractice('elements', 0), []);
  assert.equal(buildPractice('branches', 5, seededRandom(4)).length, 5);
  assert.equal(buildPractice('branches', 1000, seededRandom(4)).length, 12);
  for (const count of [-1, 1.5, NaN, Infinity, '10', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => buildPractice('elements', count), RangeError);
  }
});

test('未知分类及非法随机源给出明确错误，包括对象继承属性名', () => {
  for (const category of ['', 'unknown', 'constructor', '__proto__', null, undefined]) {
    assert.throws(() => buildPractice(category), /未知练习分类/);
  }
  assert.throws(() => buildPractice('elements', 10, null), TypeError);
  for (const value of [-0.1, 1, NaN, Infinity, '0.5']) {
    assert.throws(() => buildPractice('elements', 10, () => value), /random 必须返回/);
  }
});
