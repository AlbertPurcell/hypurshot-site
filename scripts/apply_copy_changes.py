#!/usr/bin/env python3
"""
HyPurShot Plain-Language Copy Applier
=====================================

Applies every change in COPY_MAPPING.md across the repo.

USAGE (baby steps):

  # Step 1 — Preview only. Nothing is written.
  python3 scripts/apply_copy_changes.py

  # Step 2 — See the exact before/after diff.
  python3 scripts/apply_copy_changes.py --diff

  # Step 3 — Apply for real. Creates a .backup-<timestamp> folder first.
  python3 scripts/apply_copy_changes.py --apply

  # Step 4 — Undo if you don't like it.
  python3 scripts/apply_copy_changes.py --restore <backup-folder-name>

DESIGN RULES
- Every rule is context-anchored (e.g. ">Regenerate</button>", not bare "Regenerate")
  so we can never accidentally touch a JavaScript identifier or a legal page.
- We ONLY touch files listed in TARGET_FILES.
- If a rule's `old` pattern doesn't appear in the expected file, we WARN loudly
  (means either the copy was already changed or the file drifted — you decide).
- If a rule's `old` appears more than once and `replace_all=False`, we WARN
  and skip that rule.
- All console output uses plain ASCII, no colors, no emojis.
"""
from __future__ import annotations
import argparse, os, re, shutil, sys, time, difflib
from typing import List, Tuple, Optional

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

TARGET_FILES = [
    "auth.html", "projects.html", "project.html", "project-new.html",
    "camera.html", "team.html", "library.html", "showcase.html",
    "directory.html", "review.html", "reset-password.html",
]

# -------------------- RULES --------------------
# Each rule: (file, old_string, new_string, replace_all)
# Anchors used: > ... <   or   placeholder="..."   or   aria-label="..."
# NEVER include bare words that would collide with JS/CSS.

RULES: List[Tuple[str, str, str, bool]] = [

    # ============ team.html — TABS ============
    ("team.html",
     '<button class="tab-btn" data-tab="directory" onclick="switchTab(\'directory\')">Directory</button>',
     '<button class="tab-btn" data-tab="directory" onclick="switchTab(\'directory\')">Public listing</button>',
     False),
    ("team.html",
     '<button class="tab-btn" data-tab="members" onclick="switchTab(\'members\')">Members</button>',
     '<button class="tab-btn" data-tab="members" onclick="switchTab(\'members\')">Team</button>',
     False),
    ("team.html",
     '<button class="tab-btn" data-tab="invites" onclick="switchTab(\'invites\')">Invites</button>',
     '<button class="tab-btn" data-tab="invites" onclick="switchTab(\'invites\')">Invite codes</button>',
     False),
    ("team.html",
     '<button class="tab-btn" data-tab="approvals" onclick="switchTab(\'approvals\')">Approvals</button>',
     '<button class="tab-btn" data-tab="approvals" onclick="switchTab(\'approvals\')">Review posts</button>',
     False),
    ("team.html",
     '<button class="tab-btn" data-tab="connections" onclick="switchTab(\'connections\')">Connections</button>',
     '<button class="tab-btn" data-tab="connections" onclick="switchTab(\'connections\')">Social accounts</button>',
     False),

    # ============ team.html — HEADINGS ============
    ("team.html", ">Directory visibility<", ">Show my business publicly<", False),
    ("team.html", ">Profile details<", ">About your business<", False),
    ("team.html", ">Team Members<", ">Your team<", False),
    ("team.html", ">Invite Codes<", ">Invite codes<", False),
    ("team.html", ">Pending Approvals<", ">Posts waiting for your approval<", False),
    ("team.html", ">Social Accounts<", ">Social accounts<", False),
    ("team.html", ">New Post<", ">New post<", False),

    # ============ team.html — LABELS ============
    (   "team.html",
        ">Showcase URL<", ">Your public page link<", False),
    (   "team.html",
        ">Google Business Profile URL<", ">Google Business page link<", False),
    (   "team.html",
        ">Allow Comments<", ">Let people comment<", False),
    (   "team.html",
        ">Allow Duet<", ">Let people Duet<", False),
    (   "team.html",
        ">Allow Stitch<", ">Let people Stitch<", False),
    (   "team.html",
        ">Commercial Content<", ">Paid or promotional content<", False),
    (   "team.html",
        ">Branded Content<", ">Promoting another brand<", False),
    (   "team.html",
        ">Your Brand<", ">Promoting my own business<", False),
    (   "team.html",
        ">Interactions<", ">What viewers can do<", False),
    (   "team.html",
        ">Privacy<", ">Who can see this?<", False),
    (   "team.html",
        ">Link URL<", ">Link to include (optional)<", False),
    (   "team.html",
        ">Services offered<", ">Services you offer<", False),

    # ============ team.html — BUTTONS ============
    ("team.html",
     'onclick="regenerateShareLink()">Regenerate<',
     'onclick="regenerateShareLink()" title="Replaces your current link — the old one will stop working">Replace link<', False),
    ("team.html", ">Save settings<", ">Save changes<", False),
    ("team.html", ">Save directory settings<", ">Save changes<", False),
    ("team.html", ">Refresh reviews now<", ">Check for new reviews<", False),
    ("team.html", ">Save to TikTok Drafts<", ">Save as TikTok draft<", False),
    ("team.html", ">Use latest<", ">Use most recent<", False),

    # ============ team.html — PILLS ============
    ("team.html", ">Needs Approval<", ">Needs your approval<", False),
    ("team.html", ">Can Capture<", ">Can add photos<", False),
    ("team.html", ">Can Post<", ">Can post to social<", False),
    ("team.html", ">Privacy: Not selected<", ">Pick who can see this<", False),
    ("team.html", ">Comments: off<", ">Comments off<", False),
    ("team.html", ">Duet: off<", ">Duet off<", False),
    ("team.html", ">Stitch: off<", ">Stitch off<", False),
    ("team.html", "Coming soon · Meta review in progress",
                  "Coming soon — Meta reviewing", True),
    ("team.html", "Coming soon · Meta review",
                  "Coming soon — Meta review", True),

    # ============ team.html — HELPER TEXT ============
    ("team.html",
     "Turn on if this content promotes a brand, product, or service",
     "Turn on if you are being paid to post this or promoting a brand", False),
    ("team.html",
     "You are promoting another brand or a third party",
     "I am promoting another brand or a third party", False),
    ("team.html",
     "You are promoting yourself or your own business",
     "I am promoting my own business", False),
    ("team.html", ">No caption yet.<", ">No caption yet<", False),
    ("team.html", ">Posting to Facebook Page<", ">Posting to Facebook<", False),

    # ============ team.html — PLACEHOLDERS ============
    ("team.html",
     'placeholder="What\'s on your mind?"',
     'placeholder="Write a caption…"', False),
    ("team.html",
     'placeholder="Write a caption... use #hashtags and @mentions to reach people."',
     'placeholder="Write a caption… use #hashtags and @mentions to reach people."', False),
    ("team.html",
     'placeholder="Write a caption for your TikTok post..."',
     'placeholder="Write a caption for your TikTok post…"', False),
    ("team.html",
     'placeholder="Reason for rejection..."',
     'placeholder="Tell them why (optional)"', False),

    # ============ team.html — EMPTY STATES ============
    # We look for the trigger phrase and replace it with a two-line block.
    # These are anchored by their surrounding text so they stay unique.
    ("team.html", "No team members yet.", "No team members yet", False),
    ("team.html", "No services added yet.", "No services added yet", False),
    ("team.html",
     "No published media yet. Upload some media first.",
     "No public photos or videos yet — mark one as Public in a job first, then come back.", False),
    ("team.html",
     "Add a video to see the preview",
     "Pick a video above to see how it will look", True),

    # ============ team.html — SUBHEADS on coming-soon panels ============
    ("team.html", ">Facebook posting is coming soon.<",
                  ">Facebook posting — coming soon<", False),
    ("team.html", ">Instagram posting is coming soon.<",
                  ">Instagram posting — coming soon<", False),

    # ============ projects.html ============
    ("projects.html",
     ">Start your first project<", ">Start your first job<", False),
    # Kept as double-quoted JS string in projects.html because the sentence contains an apostrophe ("That's").
    # The applier wraps this specific block manually in projects.html.
    ("projects.html",
     "'Capture proof of your work. Build a portfolio that closes sales.'",
     '"Snap before-and-after photos. Text customers a review link. That\'s it."', False),
    ("projects.html",
     ">No completed projects yet<", ">No finished jobs yet<", False),
    ("projects.html",
     "Finish a project to see it here.",
     "Finish a job to see it here.", False),
    ("projects.html",
     ">Could not load projects<", ">We could not load your jobs<", False),
    ("projects.html",
     '>New project</button>', '>New job</button>', True),
    ("projects.html",
     'aria-label="New project"', 'aria-label="New job"', False),

    # ============ project.html ============
    ("project.html", ">Media<", ">Photos & videos<", False),
    ("project.html", ">No captures yet<", ">No photos or videos yet<", False),
    ("project.html",
     "Tap Capture to add your first photo or video.",
     "Tap the camera button below to add your first shot.", False),
    ("project.html", ">Mark complete<", ">Mark job done<", False),
    ("project.html",
     ">Request a Google review<", ">Ask for a Google review<", False),
    ("project.html",
     "Send your customer a one-tap link to your Google Business profile.",
     "Send your customer a one-tap link to leave you a Google review.", False),
    ("project.html",
     "Add your Google review link in Settings before sending.",
     "Add your Google review link in Business Profile settings before sending.", False),
    ("project.html",
     "Only public items appear on your portfolio page.",
     "Only Public photos and videos appear on your public page.", False),
    ("project.html",
     'onclick="sendReviewRequest()">Send request<',
     'onclick="sendReviewRequest()">Send review request<', False),

    # ============ project-new.html ============
    ("project-new.html", ">Work description<", ">What's the job?<", False),
    ("project-new.html", ">Location<", ">Where<", False),
    ("project-new.html", ">Use my location<", ">Use my current location<", False),
    ("project-new.html", ">Location not set<", ">No location yet<", False),
    ("project-new.html",
     "Briefly describe the job. This is the title clients will see.",
     "A short line describing the job. This becomes the title customers see.", False),

    # ============ auth.html ============
    ("auth.html",
     "The mobile toolkit for detailers and service professionals. Capture your best work, edit for social media, automate distribution across platforms, and collect five-star reviews from happy clients.",
     "The mobile toolkit for solo owner-operators. Snap your work. Post to social. Collect five-star reviews. All from your phone.", False),
    ("auth.html",
     "Sign in to your HyPurShot account.",
     "Sign in to your account.", False),
    ("auth.html",
     "Start capturing and sharing your best work.",
     "Start showing off your best work.", False),
    ("auth.html",
     "Tell us about your business so we can customize your experience.",
     "A few basics about your business.", False),
    ("auth.html",
     "Link your social accounts for automated posting. You can always update these later.",
     "Connect social accounts so you can post from HyPurShot. You can add these later.", False),
    ("auth.html", ">Business Phone<", ">Business phone<", False),
    ("auth.html", ">City / Location<", ">City<", False),
    ("auth.html", ">Email Address<", ">Email<", False),

    # ============ reset-password.html ============
    ("reset-password.html",
     "Choose a strong password for your HyPurShot account.",
     "Pick a strong password.", False),
    ("reset-password.html",
     "Use at least 8 characters with a mix of letters and numbers.",
     "At least 8 characters, mix letters and numbers.", False),
    ("reset-password.html",
     "You can now sign in with your new password.",
     "Sign in with your new password.", False),
    ("reset-password.html", ">Confirm password<", ">Type it again<", False),

    # ============ library.html ============
    ("library.html", ">Library is empty<", ">No photos or videos yet<", False),
    ("library.html", ">Nothing here yet<", ">Nothing matches that filter<", False),
    ("library.html", ">Post to social<", ">Share to social<", False),
    ("library.html", ">Open project<", ">Open job<", False),
    ("library.html", ">New project<", ">New job<", False),

    # ============ directory.html ============
    ("directory.html", ">No operators yet<", ">No matches yet<", False),
    ("directory.html", ">Find a professional.<", ">Find a professional<", False),
    ("directory.html", ">Are you an operator?<", ">Are you a pro?<", False),

    # ============ review.html ============
    ("review.html",
     'type="button">\n          Submit Feedback\n        </button>',
     'type="button">\n          Send feedback\n        </button>', False),
    ("review.html",
     'placeholder="Your feedback is private and helps us improve..."',
     'placeholder="Your feedback is private and helps us get better…"', False),

    # ============ camera.html ============
    # Empty state — check that pattern exists
    ("camera.html", ">Camera not available<", ">Camera not available<", False),
    # No text change here — this is a placeholder rule confirming presence,
    # so we skip actual replacement by making old == new (script tolerates).

    # ============ showcase.html ============
    ("showcase.html", ">Coming soon<", ">New work coming soon<", False),
]

# -------------------- ENGINE --------------------

def color_off(): return ""
def bold(s): return s

class Report:
    def __init__(self):
        self.applied: List[Tuple[str, str, str]] = []
        self.skipped: List[Tuple[str, str, str]] = []
        self.warned: List[Tuple[str, str, str]] = []

    def summary(self):
        print()
        print("=" * 64)
        print("SUMMARY")
        print("=" * 64)
        print(f"  Applied:  {len(self.applied)}")
        print(f"  Skipped:  {len(self.skipped)}  (rule text already updated or no-op)")
        print(f"  Warnings: {len(self.warned)}  (needs manual attention)")
        if self.warned:
            print()
            print("WARNINGS (rule did not match — check manually):")
            for f, old, why in self.warned:
                print(f"  - {f}: {why}")
                print(f"      looking for: {short(old)}")

def short(s: str, n: int = 80) -> str:
    s = s.replace("\n", "\\n")
    return s if len(s) <= n else s[:n] + "…"

def load(path: str) -> str:
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()

def save(path: str, content: str):
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)

def run(apply: bool, show_diff: bool) -> Report:
    rpt = Report()
    per_file_changes: dict[str, List[Tuple[str, str]]] = {}

    for fname, old, new, replace_all in RULES:
        path = os.path.join(REPO, fname)
        if not os.path.exists(path):
            rpt.warned.append((fname, old, "file missing"))
            continue
        text = load(path)
        if old == new:
            # presence-check-only rule
            if old not in text:
                rpt.warned.append((fname, old, "presence check failed"))
            else:
                rpt.skipped.append((fname, old, "presence-only rule ok"))
            continue

        count = text.count(old)
        if count == 0:
            # Might already have been applied — check for `new`
            if new in text:
                rpt.skipped.append((fname, old, "already updated"))
            else:
                rpt.warned.append((fname, old, "old text not found (drift?)"))
            continue

        if count > 1 and not replace_all:
            rpt.warned.append((fname, old, f"appears {count} times; add anchor or set replace_all"))
            continue

        new_text = text.replace(old, new, count if replace_all else 1)
        per_file_changes.setdefault(fname, []).append((old, new))
        rpt.applied.append((fname, old, new))
        if apply:
            save(path, new_text)

    # Print per-file summary
    print()
    print("=" * 64)
    print("PER-FILE CHANGES" + ("  (DRY-RUN — nothing written)" if not apply else "  (APPLIED)"))
    print("=" * 64)
    for fname in sorted(per_file_changes):
        print()
        print(f"[{fname}]  {len(per_file_changes[fname])} change(s)")
        for old, new in per_file_changes[fname]:
            print(f"  - {short(old, 70)}")
            print(f"    -> {short(new, 70)}")

    if show_diff:
        print()
        print("=" * 64)
        print("UNIFIED DIFFS (dry-run only — reflects what --apply would write)")
        print("=" * 64)
        for fname in sorted(per_file_changes):
            path = os.path.join(REPO, fname)
            original = load(path)
            simulated = original
            for old, new in per_file_changes[fname]:
                simulated = simulated.replace(old, new, 1)
            diff = difflib.unified_diff(
                original.splitlines(keepends=True),
                simulated.splitlines(keepends=True),
                fromfile=f"a/{fname}", tofile=f"b/{fname}", n=1,
            )
            sys.stdout.writelines(diff)

    return rpt

def backup() -> str:
    ts = time.strftime("%Y%m%d-%H%M%S")
    dest = os.path.join(REPO, f".backup-{ts}")
    os.makedirs(dest, exist_ok=True)
    for f in TARGET_FILES:
        src = os.path.join(REPO, f)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(dest, f))
    return dest

def restore(name: str):
    src_dir = os.path.join(REPO, name)
    if not os.path.isdir(src_dir):
        print(f"ERROR: backup folder not found: {src_dir}")
        sys.exit(2)
    for f in TARGET_FILES:
        src = os.path.join(src_dir, f)
        dst = os.path.join(REPO, f)
        if os.path.exists(src):
            shutil.copy2(src, dst)
            print(f"  restored {f}")
    print("Done. Review with `git diff`.")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="Write changes to disk (default is dry-run)")
    ap.add_argument("--diff",  action="store_true", help="Show unified diff of proposed changes")
    ap.add_argument("--restore", metavar="BACKUP_DIR",
                    help="Restore files from a previous .backup-* folder")
    args = ap.parse_args()

    if args.restore:
        restore(args.restore)
        return

    if args.apply:
        d = backup()
        print(f"Backup saved to: {d}")
        print()

    rpt = run(apply=args.apply, show_diff=args.diff)
    rpt.summary()

    if not args.apply and (rpt.applied or rpt.warned):
        print()
        print("This was a DRY RUN. To write changes:")
        print("  python3 scripts/apply_copy_changes.py --apply")

if __name__ == "__main__":
    main()
