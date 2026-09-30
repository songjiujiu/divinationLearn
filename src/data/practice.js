export const practiceCategories = [
  { id: 'elements', label: '五行生克', description: '辨认谁生谁、谁克谁，练习两种五行的关系。' },
  { id: 'stems', label: '十天干', description: '按五行与阴阳记住十个天干的属性。' },
  { id: 'branches', label: '十二地支', description: '先记五行归属，分清四个属土的地支。' },
  { id: 'trigrams', label: '八卦基础', description: '认识八卦的五行和手册中的后天方位。' },
];

const elements = [
  ['wood', '木'], ['fire', '火'], ['earth', '土'], ['metal', '金'], ['water', '水'],
];
const elementNames = elements.map(([, name]) => name);
const generates = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const controls = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
const generationRule = '相生顺序是木 → 火 → 土 → 金 → 水 → 木。';
const controlRule = '相克顺序是木 → 土 → 水 → 火 → 金 → 木。';
const relationshipLabels = ['前者生后者', '后者生前者', '前者克后者', '后者克前者', '同一五行（比和）'];

const stems = [
  ['jia', '甲', '木', '阳'], ['yi', '乙', '木', '阴'],
  ['bing', '丙', '火', '阳'], ['ding', '丁', '火', '阴'],
  ['wu', '戊', '土', '阳'], ['ji', '己', '土', '阴'],
  ['geng', '庚', '金', '阳'], ['xin', '辛', '金', '阴'],
  ['ren', '壬', '水', '阳'], ['gui', '癸', '水', '阴'],
];
const stemRule = '甲乙木、丙丁火、戊己土、庚辛金、壬癸水；每组前阳后阴。';
const stemAttributes = stems.map(([, , element, polarity]) => `${polarity}${element}`);

const branches = [
  ['zi', '子', '水'], ['chou', '丑', '土'], ['yin', '寅', '木'],
  ['mao', '卯', '木'], ['chen', '辰', '土'], ['si', '巳', '火'],
  ['wu', '午', '火'], ['wei', '未', '土'], ['shen', '申', '金'],
  ['you', '酉', '金'], ['xu', '戌', '土'], ['hai', '亥', '水'],
];
const branchRule = '寅卯木、巳午火、申酉金、子亥水；丑辰未戌属土。';

const trigrams = [
  ['qian', '乾', '金', '西北'], ['dui', '兑', '金', '西'],
  ['li', '离', '火', '南'], ['zhen', '震', '木', '东'],
  ['xun', '巽', '木', '东南'], ['kan', '坎', '水', '北'],
  ['gen', '艮', '土', '东北'], ['kun', '坤', '土', '西南'],
];
const directions = trigrams.map(([, , , direction]) => direction);

function question(id, prompt, correct, choices, explanation) {
  return { id, prompt, correct, choices, explanation };
}

function elementQuestions() {
  const questions = elements.flatMap(([id, name]) => {
    const source = elementNames.find((element) => generates[element] === name);
    const controller = elementNames.find((element) => controls[element] === name);
    return [
      question(`elements-generate-${id}`, `${name}生哪个五行？`, generates[name], elementNames, `${name}生${generates[name]}。${generationRule}`),
      question(`elements-generated-by-${id}`, `哪个五行生${name}？`, source, elementNames, `${source}生${name}，注意箭头指向${name}。${generationRule}`),
      question(`elements-control-${id}`, `${name}克哪个五行？`, controls[name], elementNames, `${name}克${controls[name]}。${controlRule}`),
      question(`elements-controlled-by-${id}`, `哪个五行克${name}？`, controller, elementNames, `${controller}克${name}，注意谁是施加克制的一方。${controlRule}`),
    ];
  });

  for (const [firstId, first] of elements) {
    for (const [secondId, second] of elements) {
      let correct;
      let explanation;
      if (first === second) {
        correct = relationshipLabels[4];
        explanation = `两者都是${first}，属于同一五行，称为比和。`;
      } else if (generates[first] === second) {
        correct = relationshipLabels[0];
        explanation = `${first}生${second}；题目中的${first}在前、${second}在后，所以是前者生后者。${generationRule}`;
      } else if (generates[second] === first) {
        correct = relationshipLabels[1];
        explanation = `${second}生${first}；题目中的${second}在后，所以是后者生前者。${generationRule}`;
      } else if (controls[first] === second) {
        correct = relationshipLabels[2];
        explanation = `${first}克${second}；题目中的${first}在前，所以是前者克后者。${controlRule}`;
      } else {
        correct = relationshipLabels[3];
        explanation = `${second}克${first}；题目中的${second}在后，所以是后者克前者。${controlRule}`;
      }
      questions.push(question(
        `elements-relation-${firstId}-${secondId}`,
        `依次给出“${first}”和“${second}”，两者的关系是什么？`,
        correct,
        relationshipLabels,
        explanation,
      ));
    }
  }
  return questions;
}

const questionBanks = {
  elements: elementQuestions(),
  stems: stems.flatMap(([id, name, element, polarity]) => [
    question(`stems-element-${id}`, `天干“${name}”的五行是什么？`, element, elementNames, `${name}属${element}。${stemRule}`),
    question(`stems-polarity-${id}`, `天干“${name}”属阴还是属阳？`, polarity, ['阴', '阳'], `${name}属${polarity}。${stemRule}`),
    question(`stems-attribute-${id}`, `天干“${name}”的阴阳与五行合起来是什么？`, `${polarity}${element}`, stemAttributes, `${name}属${polarity}、五行属${element}，合称${polarity}${element}。${stemRule}`),
  ]),
  branches: branches.map(([id, name, element]) => question(
    `branches-element-${id}`, `地支“${name}”的五行是什么？`, element, elementNames, `${name}属${element}。${branchRule}`,
  )),
  trigrams: trigrams.flatMap(([id, name, element, direction]) => [
    question(`trigrams-element-${id}`, `“${name}”卦的五行是什么？`, element, elementNames, `手册八卦表中，${name}卦属${element}，后天方位是${direction}。`),
    question(`trigrams-direction-${id}`, `“${name}”卦的后天方位是什么？`, direction, directions, `手册列的是后天方位：${name}为${direction}，五行属${element}。本题不使用先天方位。`),
  ]),
};

function shuffle(items, random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError('random 必须返回大于等于 0 且小于 1 的有限数字。');
    }
    const other = Math.floor(value * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}

/**
 * 生成一轮不重复题目。题量超过该分类题库时返回全部题目。
 * random 可注入带种子的随机函数，便于重现练习；不会修改题库。
 */
export function buildPractice(categoryId, count = 10, random = Math.random) {
  if (!Object.hasOwn(questionBanks, categoryId)) {
    throw new RangeError(`未知练习分类：${String(categoryId)}`);
  }
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError('练习题量必须为非负安全整数。');
  }
  if (typeof random !== 'function') {
    throw new TypeError('random 必须是函数。');
  }
  if (count === 0) return [];

  return shuffle(questionBanks[categoryId], random).slice(0, count).map((item) => {
    const distractors = shuffle(item.choices.filter((choice) => choice !== item.correct), random).slice(0, 3);
    const options = shuffle([item.correct, ...distractors], random);
    return {
      id: item.id,
      prompt: item.prompt,
      options,
      answer: options.indexOf(item.correct),
      explanation: item.explanation,
    };
  });
}
