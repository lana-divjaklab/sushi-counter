from pathlib import Path
import requests

NOTION_API_KEY = Path('/root/.openclaw/workspace/credentials/notion.env').read_text().strip().split('=', 1)[1]
PARENT_PAGE_ID = '34a1430d-2036-805e-a2bc-c13a60ff11fd'  # Lana Workspace
TITLE = 'Sushi Counter – Product Spec'

HEADERS = {
    'Authorization': f'Bearer {NOTION_API_KEY}',
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
}


def block_from_line(line: str):
    line = line.rstrip()
    if not line:
        return None
    if line.startswith('# '):
        return {'object': 'block', 'type': 'heading_1', 'heading_1': {'rich_text': [{'type': 'text', 'text': {'content': line[2:][:2000]}}]}}
    if line.startswith('## '):
        return {'object': 'block', 'type': 'heading_2', 'heading_2': {'rich_text': [{'type': 'text', 'text': {'content': line[3:][:2000]}}]}}
    if line.startswith('### '):
        return {'object': 'block', 'type': 'heading_3', 'heading_3': {'rich_text': [{'type': 'text', 'text': {'content': line[4:][:2000]}}]}}
    if line.startswith('- '):
        return {'object': 'block', 'type': 'bulleted_list_item', 'bulleted_list_item': {'rich_text': [{'type': 'text', 'text': {'content': line[2:][:2000]}}]}}
    return {'object': 'block', 'type': 'paragraph', 'paragraph': {'rich_text': [{'type': 'text', 'text': {'content': line[:2000]}}]}}


def append_blocks(page_id: str, blocks):
    for i in range(0, len(blocks), 100):
        chunk = blocks[i:i+100]
        r = requests.patch(f'https://api.notion.com/v1/blocks/{page_id}/children', headers=HEADERS, json={'children': chunk}, timeout=30)
        r.raise_for_status()


def main():
    prd = Path('PRD.md').read_text(encoding='utf-8')
    arch = Path('ARCHITECTURE.md').read_text(encoding='utf-8')
    content = prd + '\n\n# Technical Architecture\n\n' + arch
    blocks = [b for b in (block_from_line(line) for line in content.splitlines()) if b]

    data = {
        'parent': {'type': 'page_id', 'page_id': PARENT_PAGE_ID},
        'properties': {
            'title': [{ 'type': 'text', 'text': { 'content': TITLE } }]
        },
        'children': blocks[:100],
    }
    r = requests.post('https://api.notion.com/v1/pages', headers=HEADERS, json=data, timeout=30)
    r.raise_for_status()
    page = r.json()
    if len(blocks) > 100:
        append_blocks(page['id'], blocks[100:])
    print(page['url'])


if __name__ == '__main__':
    main()
