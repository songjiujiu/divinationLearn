"""Import the reader's supplied EPUB as text segments; never execute its HTML."""
import argparse
import hashlib
import json
import posixpath
import re
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SELECTED_IDS = {1: 'qian', 2: 'kun', 3: 'zhun', 4: 'meng', 5: 'xu', 15: 'qian-modesty', 24: 'fu', 64: 'wei-ji'}
OTHER_CHAPTERS = {
    'part0001.xhtml': ('copyright', '版本信息', '关于本书'),
    'part0002.xhtml': ('editor-preface', '编纂古籍今注今译序', '读书之前'),
    'part0003.xhtml': ('fan-li', '周易今注今译凡例', '读书之前'),
    'part0004.xhtml': ('preface', '周易今注今译叙言', '读书之前'),
    'part0008.xhtml': ('xi-ci-shang', '系辞上传', '易传'),
    'part0009.xhtml': ('xi-ci-xia', '系辞下传', '易传'),
    'part0010.xhtml': ('shuo-gua', '说卦传', '易传'),
    'part0011.xhtml': ('xu-gua', '序卦传', '易传'),
    'part0012.xhtml': ('za-gua', '杂卦传', '易传'),
    'part0013.xhtml': ('afterword', '周易今注今译再校后记', '关于本书'),
    'part0014.xhtml': ('fourth-preface', '周易今注今译四版序', '关于本书'),
}


def tag(node):
    return node.tag.rsplit('}', 1)[-1]


def import_book(source):
    assets = ROOT / 'public' / 'book-assets'
    assets.mkdir(parents=True, exist_ok=True)
    saved_images = set()
    chapters = []
    with zipfile.ZipFile(source) as archive:
        container = ET.fromstring(archive.read('META-INF/container.xml'))
        opf_path = container.find('.//{*}rootfile').attrib['full-path']
        package = ET.fromstring(archive.read(opf_path))
        prefix = posixpath.dirname(opf_path)
        manifest = {item.attrib['id']: item.attrib for item in package.findall('{*}manifest/{*}item')}
        ncx_path = next(posixpath.join(prefix, item['href']) for item in manifest.values() if item['media-type'] == 'application/x-dtbncx+xml')
        toc = ET.fromstring(archive.read(ncx_path))
        titles = {}
        for point in toc.findall('.//{*}navPoint'):
            content = point.find('{*}content').attrib['src']
            if '#' in content:
                filename, anchor = content.split('#', 1)
                titles[(posixpath.basename(filename), anchor)] = ''.join(point.find('{*}navLabel').itertext()).strip()

        def segments(node, document):
            result = []
            if node.text:
                result.append({'type': 'text', 'text': node.text})
            for child in node:
                kind = tag(child)
                if kind == 'img':
                    path = posixpath.normpath(posixpath.join(posixpath.dirname(document), child.attrib['src']))
                    filename = posixpath.basename(path)
                    if path not in saved_images:
                        (assets / filename).write_bytes(archive.read(path))
                        saved_images.add(path)
                    result.append({'type': 'image', 'src': '/book-assets/' + filename, 'alt': child.attrib.get('alt') or '书中图符'})
                elif kind in ('sup', 'sub'):
                    result.append({'type': kind, 'text': ''.join(child.itertext())})
                elif kind == 'br':
                    result.append({'type': 'text', 'text': '\n'})
                else:
                    result.extend(segments(child, document))
                if child.tail:
                    result.append({'type': 'text', 'text': child.tail})
            return result

        for itemref in package.findall('{*}spine/{*}itemref'):
            document = posixpath.normpath(posixpath.join(prefix, manifest[itemref.attrib['idref']]['href']))
            filename = posixpath.basename(document)
            if filename not in OTHER_CHAPTERS and filename not in ('part0006.xhtml', 'part0007.xhtml'):
                continue
            body = ET.fromstring(archive.read(document)).find('{*}body')
            chapter = None
            current_type = 'prose'
            if filename in OTHER_CHAPTERS:
                chapter_id, title, group = OTHER_CHAPTERS[filename]
                first_anchor = next((child.attrib.get('id') for child in body if child.attrib.get('id')), body.attrib.get('id', ''))
                chapter = {'id': chapter_id, 'title': title, 'group': group, 'number': None, 'source': {'file': document, 'anchor': first_anchor}, 'blocks': []}
                chapters.append(chapter)
            for node in body:
                anchor = node.attrib.get('id', '')
                match = re.fullmatch(r'isbn9787221160263_([12])_1_(\d+)', anchor)
                if match and filename in ('part0006.xhtml', 'part0007.xhtml'):
                    number = int(match[2]) + (30 if match[1] == '2' else 0)
                    chapter_id = SELECTED_IDS.get(number, f'gua-{number:02d}')
                    chapter = {'id': chapter_id, 'title': titles[(filename, anchor)], 'group': '上经' if match[1] == '1' else '下经', 'number': number, 'source': {'file': document, 'anchor': anchor}, 'blocks': []}
                    chapters.append(chapter)
                    current_type = 'prose'
                if chapter is None or tag(node) in ('script', 'style'):
                    continue
                content = segments(node, document)
                plain = ''.join(part['text'] for part in content if part['type'] == 'text').strip()
                marker = ''.join(node.itertext()).strip()
                if marker in ('今注', '今译', '今释'):
                    current_type = {'今注': 'annotation', '今译': 'translation', '今释': 'commentary'}[marker]
                    continue
                if not plain and not any(part['type'] == 'image' for part in content):
                    continue
                css_class = node.attrib.get('class', '')
                if tag(node).startswith('h') or (node.find('{*}b') is not None and marker and len(marker) < 50):
                    kind = 'heading'
                elif css_class in ('bodyContent-1-top', 'bodyContent-1-top1'):
                    kind = 'original'
                    current_type = kind
                else:
                    kind = current_type
                block_id = f"{chapter['id']}-{len(chapter['blocks']) + 1:04d}"
                chapter['blocks'].append({'id': block_id, 'type': kind, 'text': plain, 'segments': content, 'sourceAnchor': anchor})

    numbers = [chapter['number'] for chapter in chapters if chapter['number'] is not None]
    if numbers != list(range(1, 65)):
        raise ValueError('未能按本书目录读取完整六十四卦，取消生成阅读数据。')
    for chapter in chapters:
        if chapter['number'] is not None and not any(block['type'] == 'original' for block in chapter['blocks']):
            raise ValueError(f"{chapter['title']} 缺少原文段落，取消生成阅读数据。")
    metadata = {
        'title': '周易今注今译', 'editor': '王云五', 'annotators': ['南怀瑾', '徐芹庭'],
        'publisher': '贵州人民出版社', 'edition': '2020年8月第1版', 'isbn': '978-7-221-16026-3',
        'sourceFilename': source.name, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'sourceDescription': '用户提供的 EPUB；按书内标题、段落与今注／今译／今释标记整理。',
    }
    index = [{key: value for key, value in chapter.items() if key != 'blocks'} for chapter in chapters]
    target = ROOT / 'src' / 'data'
    (target / 'book-index.js').write_text('export const bookMetadata = ' + json.dumps(metadata, ensure_ascii=False, indent=2) + ';\n\nexport const bookIndex = ' + json.dumps(index, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    (target / 'book.js').write_text('// Extracted from the user-provided EPUB by scripts/import-book.py.\nexport const bookChapters = ' + json.dumps(chapters, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    print(json.dumps({'chapters': len(chapters), 'hexagrams': sum(chapter['number'] is not None for chapter in chapters), 'blocks': sum(len(chapter['blocks']) for chapter in chapters), 'images': len(saved_images), 'output': str(target / 'book.js')}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('epub', type=Path)
    import_book(parser.parse_args().epub)
