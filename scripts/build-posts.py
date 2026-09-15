#!/usr/bin/env python3
"""
يبني posts.json من ملفات Markdown في content/posts/
"""

import json
import os
from pathlib import Path
import frontmatter
import markdown

CONTENT_DIR = Path("content/posts")
OUTPUT_FILE = Path("posts.json")

def build():
    posts = []
    post_id = 1
    
    if not CONTENT_DIR.exists():
        print("لا يوجد مجلد content/posts")
        return
    
    # المرور على اللغات
    for lang_dir in CONTENT_DIR.iterdir():
        if not lang_dir.is_dir():
            continue
        
        lang = lang_dir.name  # ar, en, fr
        
        # المرور على الملفات
        for md_file in lang_dir.glob("*.md"):
            try:
                with open(md_file, "r", encoding="utf-8") as f:
                    post = frontmatter.load(f)
                
                # تحويل Markdown إلى HTML
                content_html = markdown.markdown(
                    post.content,
                    extensions=["extra", "tables", "fenced_code"]
                )
                
                posts.append({
                    "id": str(post_id),
                    "lang": lang,
                    "category": post.get("category", "tech"),
                    "title": post.get("title", ""),
                    "excerpt": post.get("excerpt", ""),
                    "image": post.get("image", ""),
                    "date": str(post.get("date", "")),
                    "author": post.get("author", ""),
                    "content": content_html,
                    "slug": post.get("slug", md_file.stem),
                })
                post_id += 1
            except Exception as e:
                print(f"خطأ في {md_file}: {e}")
    
    # ترتيب حسب التاريخ (الأحدث أولاً)
    posts.sort(key=lambda p: p["date"], reverse=True)
    
    # إعادة ترقيم
    for i, p in enumerate(posts, 1):
        p["id"] = str(i)
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump({"posts": posts}, f, ensure_ascii=False, indent=2)
    
    print(f"✅ تم بناء posts.json مع {len(posts)} مقالة")

if __name__ == "__main__":
    build()