#!/usr/bin/env python3
import json
import re
from pathlib import Path
import yaml
import markdown

CONTENT_DIR = Path("content/posts")
OUTPUT_FILE = Path("posts.json")

def parse_frontmatter(text):
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', text, re.DOTALL)
    if not match:
        return {}, text
    yaml_text, body = match.groups()
    try:
        metadata = yaml.safe_load(yaml_text) or {}
    except yaml.YAMLError:
        metadata = {}
    return metadata, body

def build():
    posts = []
    post_id = 1
    
    if not CONTENT_DIR.exists():
        print("⚠️ لا يوجد مجلد content/posts")
        OUTPUT_FILE.write_text('{"posts":[]}', encoding="utf-8")
        return
    
    for lang_dir in CONTENT_DIR.iterdir():
        if not lang_dir.is_dir():
            continue
        lang = lang_dir.name
        
        for md_file in lang_dir.glob("*.md"):
            try:
                text = md_file.read_text(encoding="utf-8")
                meta, body = parse_frontmatter(text)
                content_html = markdown.markdown(
                    body, extensions=["extra", "tables", "fenced_code"]
                )
                
                posts.append({
                    "id": str(post_id),
                    "lang": lang,
                    "category": meta.get("category", "tech"),
                    "title": meta.get("title", ""),
                    "excerpt": meta.get("excerpt", ""),
                    "image": meta.get("image", ""),
                    "date": str(meta.get("date", "")),
                    "author": meta.get("author", ""),
                    "content": content_html,
                })
                post_id += 1
            except Exception as e:
                print(f"❌ خطأ في {md_file}: {e}")
    
    posts.sort(key=lambda p: p["date"], reverse=True)
    for i, p in enumerate(posts, 1):
        p["id"] = str(i)
    
    OUTPUT_FILE.write_text(
        json.dumps({"posts": posts}, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"✅ تم بناء posts.json مع {len(posts)} مقالة")

if __name__ == "__main__":
    build()