// 来源：用户提供的《周易今注今译》（王云五主编，南怀瑾、徐芹庭注译，贵州人民出版社 2020 年版）。
// id、number、name 与 book-index.js 对应；original 取首段原文纯文本，去除上标注号，供检索与纯文本回退。
// 井、震首段含以图片表示的字，original 不能保留这些字；显示时优先用去除 sup 后的 originalSegments。
// 上下卦依据每章首组六条爻辞的爻位名称提取：九为阳、六为阴，自下向上取下三爻与上三爻。
// 乾《文言》等后续重复引文不参与；组合已与本书各章《象传》的自然意象对照阅读。
// fullName 为“上卦自然意象 + 下卦自然意象 + 卦名”的常用组合称呼；纯卦作“某为某”。
// 此模块不依赖整本 book.js，供卦象组合界面同步查找。

export const hexagramCombinations = [
  {"id": "qian", "number": 1, "name": "乾", "upper": "qian", "lower": "qian", "fullName": "乾为天", "original": "乾，元、亨、利、贞。"},
  {"id": "kun", "number": 2, "name": "坤", "upper": "kun", "lower": "kun", "fullName": "坤为地", "original": "坤，元、亨，利牝马之贞。君子有攸往，先迷后得，主利。西南得朋，东北丧朋。安贞，吉。"},
  {"id": "zhun", "number": 3, "name": "屯", "upper": "kan", "lower": "zhen", "fullName": "水雷屯", "original": "屯，元、亨、利、贞。勿用有攸往，利建侯。"},
  {"id": "meng", "number": 4, "name": "蒙", "upper": "gen", "lower": "kan", "fullName": "山水蒙", "original": "蒙，亨。匪我求童蒙，童蒙求我。初筮告，再三渎，渎则不告。利贞。"},
  {"id": "xu", "number": 5, "name": "需", "upper": "kan", "lower": "qian", "fullName": "水天需", "original": "需，有孚，光亨，贞吉。利涉大川。"},
  {"id": "gua-06", "number": 6, "name": "讼", "upper": "qian", "lower": "kan", "fullName": "天水讼", "original": "讼，有孚窒，惕中吉，终凶。利见大人，不利涉大川。"},
  {"id": "gua-07", "number": 7, "name": "师", "upper": "kun", "lower": "kan", "fullName": "地水师", "original": "师，贞，丈人吉，无咎。"},
  {"id": "gua-08", "number": 8, "name": "比", "upper": "kan", "lower": "kun", "fullName": "水地比", "original": "比，吉。原筮，元永贞，无咎。不宁方来，后夫凶。"},
  {"id": "gua-09", "number": 9, "name": "小畜", "upper": "xun", "lower": "qian", "fullName": "风天小畜", "original": "小畜，亨，密云不雨，自我西郊。"},
  {"id": "gua-10", "number": 10, "name": "履", "upper": "qian", "lower": "dui", "fullName": "天泽履", "original": "履虎尾，不咥人，亨。"},
  {"id": "gua-11", "number": 11, "name": "泰", "upper": "kun", "lower": "qian", "fullName": "地天泰", "original": "泰，小往大来，吉，亨。"},
  {"id": "gua-12", "number": 12, "name": "否", "upper": "qian", "lower": "kun", "fullName": "天地否", "original": "否，之匪人，不利君子，贞，大往小来。"},
  {"id": "gua-13", "number": 13, "name": "同人", "upper": "qian", "lower": "li", "fullName": "天火同人", "original": "同人于野，亨，利涉大川，利君子贞。"},
  {"id": "gua-14", "number": 14, "name": "大有", "upper": "li", "lower": "qian", "fullName": "火天大有", "original": "大有，元、亨。"},
  {"id": "qian-modesty", "number": 15, "name": "谦", "upper": "kun", "lower": "gen", "fullName": "地山谦", "original": "谦，亨，君子有终。"},
  {"id": "gua-16", "number": 16, "name": "豫", "upper": "zhen", "lower": "kun", "fullName": "雷地豫", "original": "豫，利建侯行师。"},
  {"id": "gua-17", "number": 17, "name": "随", "upper": "dui", "lower": "zhen", "fullName": "泽雷随", "original": "随，元、亨、利、贞，无咎。"},
  {"id": "gua-18", "number": 18, "name": "蛊", "upper": "gen", "lower": "xun", "fullName": "山风蛊", "original": "蛊，元、亨，利涉大川。先甲三日，后甲三日。"},
  {"id": "gua-19", "number": 19, "name": "临", "upper": "kun", "lower": "dui", "fullName": "地泽临", "original": "临，元、亨、利、贞，至于八月有凶。"},
  {"id": "gua-20", "number": 20, "name": "观", "upper": "xun", "lower": "kun", "fullName": "风地观", "original": "观，盥而不荐，有孚颙若。"},
  {"id": "gua-21", "number": 21, "name": "噬嗑", "upper": "li", "lower": "zhen", "fullName": "火雷噬嗑", "original": "噬嗑，亨，利用狱。"},
  {"id": "gua-22", "number": 22, "name": "贲", "upper": "gen", "lower": "li", "fullName": "山火贲", "original": "贲，亨，小利，有攸往。"},
  {"id": "gua-23", "number": 23, "name": "剥", "upper": "gen", "lower": "kun", "fullName": "山地剥", "original": "剥，不利有攸往。"},
  {"id": "fu", "number": 24, "name": "复", "upper": "kun", "lower": "zhen", "fullName": "地雷复", "original": "复，亨。出入无疾，朋来无咎。反复其道，七日来复。利有攸往。"},
  {"id": "gua-25", "number": 25, "name": "无妄", "upper": "qian", "lower": "zhen", "fullName": "天雷无妄", "original": "无妄，元、亨、利、贞，其匪正有眚，不利有攸往。"},
  {"id": "gua-26", "number": 26, "name": "大畜", "upper": "gen", "lower": "qian", "fullName": "山天大畜", "original": "大畜，利贞，不家食吉，利涉大川。"},
  {"id": "gua-27", "number": 27, "name": "颐", "upper": "gen", "lower": "zhen", "fullName": "山雷颐", "original": "颐，贞吉。观颐，自求口食。"},
  {"id": "gua-28", "number": 28, "name": "大过", "upper": "dui", "lower": "xun", "fullName": "泽风大过", "original": "大过，栋桡，利有攸往，亨。"},
  {"id": "gua-29", "number": 29, "name": "坎", "upper": "kan", "lower": "kan", "fullName": "坎为水", "original": "习坎，有孚，维心亨，行有尚。"},
  {"id": "gua-30", "number": 30, "name": "离", "upper": "li", "lower": "li", "fullName": "离为火", "original": "离，利贞亨，畜牝牛，吉。"},
  {"id": "gua-31", "number": 31, "name": "咸", "upper": "dui", "lower": "gen", "fullName": "泽山咸", "original": "咸，亨利贞，取女吉。"},
  {"id": "gua-32", "number": 32, "name": "恒", "upper": "zhen", "lower": "xun", "fullName": "雷风恒", "original": "恒，亨，无咎，利贞，利有攸往。"},
  {"id": "gua-33", "number": 33, "name": "遁", "upper": "qian", "lower": "gen", "fullName": "天山遁", "original": "遁，亨，小利贞。"},
  {"id": "gua-34", "number": 34, "name": "大壮", "upper": "zhen", "lower": "qian", "fullName": "雷天大壮", "original": "大壮，利贞。"},
  {"id": "gua-35", "number": 35, "name": "晋", "upper": "li", "lower": "kun", "fullName": "火地晋", "original": "晋，康侯用锡马蕃庶，昼日三接。"},
  {"id": "gua-36", "number": 36, "name": "明夷", "upper": "kun", "lower": "li", "fullName": "地火明夷", "original": "明夷，利艰贞。"},
  {"id": "gua-37", "number": 37, "name": "家人", "upper": "xun", "lower": "li", "fullName": "风火家人", "original": "家人，利女贞。"},
  {"id": "gua-38", "number": 38, "name": "睽", "upper": "li", "lower": "dui", "fullName": "火泽睽", "original": "睽，小事吉。"},
  {"id": "gua-39", "number": 39, "name": "蹇", "upper": "kan", "lower": "gen", "fullName": "水山蹇", "original": "蹇，利西南，不利东北，利见大人，贞吉。"},
  {"id": "gua-40", "number": 40, "name": "解", "upper": "zhen", "lower": "kan", "fullName": "雷水解", "original": "解，利西南，无所往，其来复吉，有攸往，夙吉。"},
  {"id": "gua-41", "number": 41, "name": "损", "upper": "gen", "lower": "dui", "fullName": "山泽损", "original": "损，有孚，元吉，无咎，可贞，利有攸往。曷之用？二簋可用享。"},
  {"id": "gua-42", "number": 42, "name": "益", "upper": "xun", "lower": "zhen", "fullName": "风雷益", "original": "益，利有攸往，利涉大川。"},
  {"id": "gua-43", "number": 43, "name": "夬", "upper": "dui", "lower": "qian", "fullName": "泽天夬", "original": "夬，扬于王庭，孚号有厉，告自邑，不利即戎，利有攸往。"},
  {"id": "gua-44", "number": 44, "name": "姤", "upper": "qian", "lower": "xun", "fullName": "天风姤", "original": "姤，女壮，勿用取女。"},
  {"id": "gua-45", "number": 45, "name": "萃", "upper": "dui", "lower": "kun", "fullName": "泽地萃", "original": "萃，亨，王假有庙，利见大人，亨，利贞，用大牲吉，利有攸往。"},
  {"id": "gua-46", "number": 46, "name": "升", "upper": "kun", "lower": "xun", "fullName": "地风升", "original": "升，元亨，用见大人，勿恤，南征吉。"},
  {"id": "gua-47", "number": 47, "name": "困", "upper": "dui", "lower": "kan", "fullName": "泽水困", "original": "困，亨，贞，大人吉，无咎，有言不信。"},
  {"id": "gua-48", "number": 48, "name": "井", "upper": "kan", "lower": "xun", "fullName": "水风井", "original": "井，改邑不改井，无丧无得，往来井井。汔至，亦未井，羸其瓶，凶。", "originalSegments": [{"type": "text", "text": "井"}, {"type": "text", "text": "，改邑不改井，无丧无得，往来井井。汔至，亦未"}, {"type": "image", "src": "/book-assets/image00911.jpeg", "alt": "书中图符"}, {"type": "text", "text": "井"}, {"type": "text", "text": "，羸其瓶"}, {"type": "text", "text": "，凶。"}]},
  {"id": "gua-49", "number": 49, "name": "革", "upper": "dui", "lower": "li", "fullName": "泽火革", "original": "革，已日乃孚，元、亨、利、贞，悔亡。"},
  {"id": "gua-50", "number": 50, "name": "鼎", "upper": "li", "lower": "xun", "fullName": "火风鼎", "original": "鼎，元吉，亨。"},
  {"id": "gua-51", "number": 51, "name": "震", "upper": "zhen", "lower": "zhen", "fullName": "震为雷", "original": "震，亨，震来，笑言哑哑，震惊百里，不丧匕鬯。", "originalSegments": [{"type": "text", "text": "震"}, {"type": "text", "text": "，亨，震来"}, {"type": "image", "src": "/book-assets/image00530.jpeg", "alt": "书中图符"}, {"type": "image", "src": "/book-assets/image00620.jpeg", "alt": "书中图符"}, {"type": "text", "text": "，笑言哑哑"}, {"type": "text", "text": "，震惊百里，不丧匕鬯"}, {"type": "text", "text": "。"}]},
  {"id": "gua-52", "number": 52, "name": "艮", "upper": "gen", "lower": "gen", "fullName": "艮为山", "original": "艮其背，不获其身，行其庭，不见其人，无咎。"},
  {"id": "gua-53", "number": 53, "name": "渐", "upper": "xun", "lower": "gen", "fullName": "风山渐", "original": "渐，女归吉，利贞。"},
  {"id": "gua-54", "number": 54, "name": "归妹", "upper": "zhen", "lower": "dui", "fullName": "雷泽归妹", "original": "归妹，征凶，无攸利。"},
  {"id": "gua-55", "number": 55, "name": "丰", "upper": "zhen", "lower": "li", "fullName": "雷火丰", "original": "丰，亨，王假之，勿忧，宜日中。"},
  {"id": "gua-56", "number": 56, "name": "旅", "upper": "li", "lower": "gen", "fullName": "火山旅", "original": "旅，小亨，旅贞吉。"},
  {"id": "gua-57", "number": 57, "name": "巽", "upper": "xun", "lower": "xun", "fullName": "巽为风", "original": "巽，小亨，利有攸往，利见大人。"},
  {"id": "gua-58", "number": 58, "name": "兑", "upper": "dui", "lower": "dui", "fullName": "兑为泽", "original": "兑，亨，利贞。"},
  {"id": "gua-59", "number": 59, "name": "涣", "upper": "xun", "lower": "kan", "fullName": "风水涣", "original": "涣，亨，王假有庙，利涉大川，利贞。"},
  {"id": "gua-60", "number": 60, "name": "节", "upper": "kan", "lower": "dui", "fullName": "水泽节", "original": "节，亨，苦节，不可贞。"},
  {"id": "gua-61", "number": 61, "name": "中孚", "upper": "xun", "lower": "dui", "fullName": "风泽中孚", "original": "中孚，豚鱼吉，利涉大川，利贞。"},
  {"id": "gua-62", "number": 62, "name": "小过", "upper": "zhen", "lower": "gen", "fullName": "雷山小过", "original": "小过，亨，利贞，可小事，不可大事。飞鸟遗之音，不宜上，宜下，大吉。"},
  {"id": "gua-63", "number": 63, "name": "既济", "upper": "kan", "lower": "li", "fullName": "水火既济", "original": "既济，亨小，利贞，初吉终乱。"},
  {"id": "wei-ji", "number": 64, "name": "未济", "upper": "li", "lower": "kan", "fullName": "火水未济", "original": "未济，亨，小狐汔济，濡其尾，无攸利。"},
];

const combinationsByPair = new Map(
  hexagramCombinations.map((hexagram) => [`${hexagram.upper}/${hexagram.lower}`, hexagram]),
);

export function getHexagramCombination(upper, lower) {
  return combinationsByPair.get(`${upper}/${lower}`);
}
