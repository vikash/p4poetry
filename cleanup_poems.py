#!/usr/bin/env python3
"""
Cleanup script for P4Poetry recovered poems.
Fixes content_text by removing embedded comments and form text.
Extracts comments into a separate structure.
"""

import json
import os
import re
from bs4 import BeautifulSoup
import sys

OUTPUT_DIR = "recovered_poems"

def extract_clean_content(content_html):
    """Extract clean poem content from HTML, stopping before comments."""
    if not content_html:
        return None, []

    soup = BeautifulSoup(content_html, 'html.parser')

    # Remove comment sections
    for elem in soup.select('#comments-wrap, .post-bottom, #commentlist, #commentform, form'):
        elem.decompose()

    # Remove scripts
    for elem in soup.select('script'):
        elem.decompose()

    # Get remaining paragraphs as poem content
    paragraphs = []
    for p in soup.find_all('p'):
        text = p.get_text(strip=True)
        # Skip empty or navigation-like content
        if text and not text.startswith('Possibly Related'):
            paragraphs.append(p.get_text(separator='\n', strip=True))

    clean_text = '\n\n'.join(paragraphs)
    return clean_text, []


def extract_comments_from_html(content_html):
    """Extract comments from HTML."""
    if not content_html:
        return []

    soup = BeautifulSoup(content_html, 'html.parser')
    comments = []

    # Find all comment list divs
    for commentlist in soup.select('#commentlist'):
        # Get comment metadata
        metadata = commentlist.select_one('.comment-metadata')
        if not metadata:
            continue

        # Extract author
        author_elem = metadata.select_one('strong')
        author = author_elem.get_text(strip=True) if author_elem else 'Anonymous'

        # Extract timestamp
        timestamp_elem = metadata.select_one('.comment-timestamp')
        timestamp = ''
        if timestamp_elem:
            timestamp = timestamp_elem.get_text(strip=True)
            # Clean up timestamp format
            timestamp = re.sub(r'^on\s+', '', timestamp)

        # Extract comment body
        body_div = commentlist.select_one('.comment-body')
        if body_div:
            body_p = body_div.select_one('p')
            if body_p:
                # Get text but exclude "Comment on this comment" link
                body_text = ''
                for child in body_p.children:
                    if hasattr(child, 'name') and child.name == 'p' and 'thdrpy' in child.get('class', []):
                        continue
                    if hasattr(child, 'get_text'):
                        text = child.get_text(strip=True)
                        if 'Comment on this comment' not in text:
                            body_text += text + ' '
                    else:
                        body_text += str(child).strip() + ' '

                body_text = body_text.strip()
                if body_text and 'Comment on this comment' not in body_text:
                    comments.append({
                        'author': author,
                        'timestamp': timestamp,
                        'text': body_text
                    })

        # Check for nested replies
        for reply_div in commentlist.select('.comment-childs'):
            cite = reply_div.select_one('cite')
            reply_author = cite.get_text(strip=True) if cite else 'Anonymous'

            reply_meta = reply_div.select_one('.commentmetadata')
            reply_timestamp = reply_meta.get_text(strip=True) if reply_meta else ''

            # Get reply text (next p after metadata)
            reply_p = reply_div.select_one('p:not(.thdrpy)')
            if reply_p:
                reply_text = reply_p.get_text(strip=True)
                if reply_text and 'Comment on this comment' not in reply_text:
                    comments.append({
                        'author': reply_author,
                        'timestamp': reply_timestamp,
                        'text': reply_text,
                        'is_reply': True
                    })

    return comments


def clean_content_text(content_text):
    """Clean content_text by removing comment form and embedded comments."""
    if not content_text:
        return content_text

    # Patterns to remove
    patterns = [
        # Comment form
        r'Leave a comment\nName\n\(required\).*?Click to cancel comment',
        r'Leave a comment\nName\n\(required\).*$',
        # Comments section markers
        r'\nComments\n',
        # Individual comments pattern
        r'Comment by\n[^\n]+\non [^\n]+\n[^\n]+\n(?:\[Comment on this comment\])?',
        r'Comment on this comment',
        r'\[Comment on this comment\]',
        # Reply patterns
        r'[^\n]+\nReply:\n[^\n]+\n[^\n]+',
        # Category tags at end
        r'\n(?:English Poetry|Hindi Poetry|हिंदी कविता)\s*$',
    ]

    cleaned = content_text
    for pattern in patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.DOTALL | re.IGNORECASE)

    # Remove multiple newlines
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

    return cleaned.strip()


def process_file(json_path):
    """Process a single JSON file."""
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    modified = False

    # Clean content_text
    original_text = data.get('content_text', '')

    # Try to clean from HTML first if available
    if data.get('content_html'):
        clean_text, _ = extract_clean_content(data['content_html'])
        if clean_text and len(clean_text) > 20:
            data['content_text'] = clean_text
            modified = True
    else:
        # Fallback to regex cleaning
        cleaned = clean_content_text(original_text)
        if cleaned != original_text:
            data['content_text'] = cleaned
            modified = True

    # Extract comments if present in HTML
    if data.get('content_html'):
        comments = extract_comments_from_html(data['content_html'])
        if comments:
            data['comments'] = comments
            modified = True

    if modified:
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True

    return False


def main():
    by_author_dir = os.path.join(OUTPUT_DIR, "by_author")

    if not os.path.exists(by_author_dir):
        print(f"Directory not found: {by_author_dir}")
        return

    processed = 0
    modified = 0

    # Process all JSON files
    for author_dir in os.listdir(by_author_dir):
        author_path = os.path.join(by_author_dir, author_dir)
        if not os.path.isdir(author_path):
            continue

        for filename in os.listdir(author_path):
            if not filename.endswith('.json'):
                continue

            json_path = os.path.join(author_path, filename)
            processed += 1

            try:
                if process_file(json_path):
                    modified += 1
                    if modified % 100 == 0:
                        print(f"Modified {modified} files...")
            except Exception as e:
                print(f"Error processing {json_path}: {e}")

    print(f"\nProcessed: {processed}")
    print(f"Modified: {modified}")


if __name__ == "__main__":
    main()
