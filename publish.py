#!/usr/bin/env python3
"""
Usage:
  python publish.py <html-file> [feature-name]

Renames the given HTML file to <feature-name>-sample-A/B/C.html,
commits and pushes to main, then prints the GitHub Pages URL.
"""

import sys
import os
import shutil
import subprocess
import glob

REPO_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_URL = "https://teamhoot.github.io/projects"


def next_letter(feature_name):
    pattern = os.path.join(REPO_DIR, f"{feature_name}-sample-*.html")
    existing = glob.glob(pattern)
    used = set()
    for f in existing:
        suffix = os.path.basename(f).removeprefix(f"{feature_name}-sample-").removesuffix(".html")
        if len(suffix) == 1 and suffix.isalpha():
            used.add(suffix.upper())
    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        if letter not in used:
            return letter
    raise ValueError("A-Z 모두 사용됨")


def run(cmd):
    result = subprocess.run(cmd, cwd=REPO_DIR, check=True, capture_output=True, text=True)
    return result.stdout.strip()


def main():
    if len(sys.argv) < 2:
        print("사용법: python publish.py <html파일> [기능명]")
        print("예시:   python publish.py ~/Downloads/foo.html member-list")
        sys.exit(1)

    src = os.path.abspath(sys.argv[1])
    if not os.path.isfile(src):
        print(f"파일 없음: {src}")
        sys.exit(1)

    feature = (sys.argv[2].strip().lower() if len(sys.argv) >= 3
               else input("영어 기능명 입력 (예: group-sms): ").strip().lower())

    letter = next_letter(feature)
    new_name = f"{feature}-sample-{letter}.html"
    dest = os.path.join(REPO_DIR, new_name)

    src_in_repo = os.path.dirname(src) == REPO_DIR

    if src_in_repo:
        os.rename(src, dest)
    else:
        shutil.copy2(src, dest)

    run(["git", "add", new_name])
    # If renamed inside repo, also stage the deletion of the old file
    if src_in_repo and os.path.basename(src) != new_name:
        run(["git", "add", os.path.basename(src)])

    run(["git", "commit", "-m",
         f"Add {new_name}\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"])
    run(["git", "push", "origin", "main"])

    url = f"{BASE_URL}/{new_name.removesuffix('.html')}"
    print(f"\n배포 완료!")
    print(f"파일명 : {new_name}")
    print(f"URL    : {url}")


if __name__ == "__main__":
    main()
