# How to apply the plain-language copy changes — baby steps

Everything runs from the repo root: `/home/user/workspace/hypurshot-repo`.

## What you're about to change

- 11 HTML files (auth, projects, project, project-new, camera, team, library, showcase, directory, review, reset-password)
- 98 individual string replacements
- No JavaScript logic changes — only user-visible text
- No changes to legal (privacy/terms/tiktok-integration), technical (security/status), or marketing (index.html) pages

Full before/after list: `COPY_MAPPING.md`

---

## Step 1 — Preview only (nothing gets written)

```bash
cd /home/user/workspace/hypurshot-repo
python3 scripts/apply_copy_changes.py
```

You'll see a per-file summary like:

```
[team.html]  50 change(s)
  - <button class="tab-btn" data-tab="directory"…>Directory</button>
    -> <button class="tab-btn" data-tab="directory"…>Public listing</button>
  ...
```

Ending with:
```
SUMMARY
  Applied:  98
  Skipped:  1
  Warnings: 0
```

If Warnings is 0, you're safe to apply. If Warnings > 0, read the warning — the mapping doc may have drifted from the current code.

---

## Step 2 — See exact before/after diff

```bash
python3 scripts/apply_copy_changes.py --diff | less
```

Press `q` to quit. Scroll through and eyeball a handful of changes so you know what you're getting.

---

## Step 3 — Apply for real

```bash
python3 scripts/apply_copy_changes.py --apply
```

This does two things:

1. Copies every target file into `.backup-YYYYMMDD-HHMMSS/` inside the repo (so nothing is ever lost)
2. Writes the new copy to disk

You'll see:
```
Backup saved to: /home/user/workspace/hypurshot-repo/.backup-20260705-123045
...
SUMMARY
  Applied:  98
  Skipped:  1
  Warnings: 0
```

---

## Step 4 — Sanity-check locally before pushing

```bash
# Confirm JS still parses in the file that changed most (team.html)
python3 -c "import re; html=open('team.html').read(); blocks=re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.DOTALL); open('/tmp/_x.js','w').write('\n;\n'.join(blocks))" \
  && node --check /tmp/_x.js && echo "team.html JS OK"

# Same for auth.html and project.html
for f in auth.html project.html projects.html project-new.html library.html directory.html review.html reset-password.html; do
  python3 -c "import re; html=open('$f').read(); blocks=re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', html, re.DOTALL); open('/tmp/_x.js','w').write('\n;\n'.join(blocks))" \
    && node --check /tmp/_x.js && echo "$f OK"
done
```

Every file should print `OK`.

---

## Step 5 — Commit and push

```bash
git add -A
git -c user.email="ronnie.purcell@gmail.com" -c user.name="Ron Purcell" \
    commit -m "copy: plain-language pass across app (98 changes)"

git push "https://${GH_HOST}/AlbertPurcell/hypurshot-site.git" master
```

Wait ~75 seconds for GitHub Pages to rebuild, then hard-refresh hypurshot.com on your phone.

---

## Step 6 — If something looks wrong: restore

Every backup folder has the exact files that existed before the change. To undo everything:

```bash
# List backups
ls -la .backup-*

# Restore from the one you want
python3 scripts/apply_copy_changes.py --restore .backup-20260705-123045
```

Then `git diff` — it should show zero changes.

You can also cherry-pick a single file by hand:
```bash
cp .backup-20260705-123045/team.html team.html
```

---

## What to check after applying

Open each of these pages on your phone and eyeball them:

1. **hypurshot.com/auth.html** — sign-in copy, first step of signup
2. **hypurshot.com/projects.html** — empty state should say "Start your first job"
3. **hypurshot.com/project-new.html** — labels say "What's the job?", "Where"
4. **hypurshot.com/project.html?id=…** — "Photos & videos", "Ask for a Google review"
5. **hypurshot.com/team.html** — every tab renamed; check Connections still opens; Regenerate button now says "Get a new link"
6. **hypurshot.com/library.html** — "Share to social" button, "Open job" button
7. **hypurshot.com/directory.html** — "Find a professional" (no period), "Are you a pro?"

---

## Adding more changes later

`scripts/apply_copy_changes.py` is designed to be edited. To add a new rule:

1. Open `scripts/apply_copy_changes.py`
2. Find the section for the file you want (e.g. `# ============ team.html`)
3. Add a tuple:
   ```python
   ("team.html", "OLD TEXT WITH SURROUNDING CONTEXT", "NEW TEXT WITH CONTEXT", False),
   ```
4. Dry-run to preview: `python3 scripts/apply_copy_changes.py`
5. If warnings, tighten the anchor until it matches exactly once
6. Apply: `python3 scripts/apply_copy_changes.py --apply`

Rule of thumb: **anchor the pattern with enough surrounding HTML that it appears exactly once in the file.** Use `>Text<` or `placeholder="Text"` or `onclick="fn()">Text<` etc.

---

## Files created for this pass

- `COPY_MAPPING.md` — human-readable full mapping (before → after with reasoning)
- `scripts/apply_copy_changes.py` — the applier (dry-run by default, --apply to write)
- `COPY_APPLY_INSTRUCTIONS.md` — this file
