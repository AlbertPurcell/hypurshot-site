# HyPurShot Plain-Language Copy Mapping

Every user-facing string in the app that changes, why, and what it becomes.
Applied by `scripts/apply_copy_changes.py` (dry-run by default; use `--apply` to write).

**Rules used:**
- Plain words a 55-year-old detailer understands on first read
- Verb + benefit where possible ("Send review request", not "Request")
- Never invent new labels for well-understood single words ("Cancel", "Close", "Save", "Photo", "Video", "Public" stay)
- Empty states must teach: 2 lines max, ending in a next action
- No emojis, no markdown italics (per brand rules)

---

## 1. NAVIGATION & TABS (team.html)

| Where | Current | New | Why |
|---|---|---|---|
| Tab | `Business` | `Business` | keep — clear |
| Tab | `Directory` | `Public listing` | "directory" is jargon; this is where they control if they appear on the public find-a-pro page |
| Tab | `Members` | `Team` | "Team" is what they call it |
| Tab | `Invites` | `Invite codes` | matches what's on the panel |
| Tab | `Approvals` | `Review posts` | approvals of what? — this is where owners approve staff posts before they go public |
| Tab | `Connections` | `Social accounts` | matches the H2 already on that panel |

---

## 2. SECTION HEADINGS (team.html)

| Current | New | Why |
|---|---|---|
| `Business Profile` | `Business Profile` | keep |
| `Billing` | `Billing` | keep |
| `Account` | `Account` | keep |
| `Directory visibility` | `Show my business publicly` | plain verb, plain outcome |
| `Profile details` | `About your business` | "profile details" is app-speak |
| `Team Members` | `Your team` | shorter, warmer |
| `Invite Codes` | `Invite codes` | keep — clear |
| `Pending Approvals` | `Posts waiting for your approval` | tells them exactly what's here |
| `Social Accounts` | `Social accounts` | keep casing consistent |
| `Google reviews` | `Google reviews` | keep |
| `Cover photo` | `Cover photo` | keep |
| `New Post` | `New post` | keep casing |
| `Choose cover photo` | `Choose cover photo` | keep |

---

## 3. FIELD LABELS

### team.html
| Current | New | Why |
|---|---|---|
| `Showcase URL` | `Your public page link` | "showcase" isn't a common word |
| `Google review link` | `Google review link` | keep |
| `Google Business Profile URL` | `Google Business page link` | most operators call it "page", not "profile URL" |
| `Facebook Page` | `Facebook Page` | keep |
| `Instagram account` | `Instagram account` | keep |
| `Post type` | `What are you posting?` | already exists as another label — dedupe to this |
| `Privacy` | `Who can see this?` | plain question |
| `Interactions` | `Let viewers…` | followed by the toggles below |
| `Allow Comments` | `Let people comment` | plain verb |
| `Allow Duet` | `Let people Duet` | keep TikTok term but plainer verb |
| `Allow Stitch` | `Let people Stitch` | same |
| `Commercial Content` | `This is a paid or promotional post` | plain-English disclosure |
| `Branded Content` | `Promoting another brand` | plain |
| `Your Brand` | `Promoting my own business` | plain |
| `Caption` | `Caption` | keep |
| `Link URL` | `Link to include (optional)` | plainer |
| `Media` (as label) | `Photo or video` | plain |
| `Video` (as label) | `Video` | keep |
| `Role` | `Role` | keep |
| `Years of experience` | `Years of experience` | keep |
| `Message` | `Message` | keep |
| `Business name` | `Business name` | keep |
| `City` | `City` | keep |
| `State` | `State` | keep |
| `Services offered` | `Services you offer` | plainer |

### project-new.html
| Current | New | Why |
|---|---|---|
| `Work description` | `What's the job?` | question format = friendlier |
| `Make/Model` | `Make/Model` | keep (recently set) |
| `Customer name` | `Customer name` | keep |
| `Phone` | `Phone` | keep |
| `Email` | `Email` | keep |
| `Location` | `Where` | shorter, works in nav-heavy form |
| `Started` | `Started` | keep |

### auth.html
| Current | New | Why |
|---|---|---|
| `Business Phone` | `Business phone` | sentence case for consistency |
| `City / Location` | `City` | already collect state elsewhere |
| `Email Address` | `Email` | shorter |
| `Password` | `Password` | keep |

### reset-password.html
| Current | New | Why |
|---|---|---|
| `New password` | `New password` | keep |
| `Confirm password` | `Type it again` | plainer |

---

## 4. HEADINGS ON APP SCREENS

| File | Current | New | Why |
|---|---|---|---|
| project.html | `Media` | `Photos & videos` | plain |
| project.html | `No captures yet` | `No photos or videos yet` | "captures" is app-speak |
| project.html | `Request a Google review` | `Ask for a Google review` | verb "ask" > "request" for warmth |
| projects.html | `Start your first project` | `Start your first job` | operators say "job" not "project" |
| projects.html | `No completed projects yet` | `No finished jobs yet` | plain |
| projects.html | `Could not load projects` | `We could not load your jobs` | first-person, softer |
| library.html | `Library is empty` | `No photos or videos yet` | matches project.html; same feeling |
| library.html | `Nothing here yet` | `Nothing matches that filter` | actual reason it's empty when filters are on |
| team.html | `Facebook posting is coming soon.` | `Facebook posting — coming soon` | keep tone; no period |
| team.html | `Instagram posting is coming soon.` | `Instagram posting — coming soon` | same |
| showcase.html | `Coming soon` | `New work coming soon` | more specific |
| directory.html | `No operators yet` | `No matches yet` | filter/search context |
| directory.html | `Find a professional.` | `Find a professional` | drop trailing period on heading |
| directory.html | `Are you an operator?` | `Are you a pro?` | "operator" is jargon outside detailing |

---

## 5. BUTTONS

| File | Current | New | Why |
|---|---|---|---|
| projects.html | `New project` | `New job` | operators say "job" |
| project.html | `Mark complete` | `Mark job done` | plain |
| project.html | `Send request` (in review modal) | `Send review request` | tells them what's being sent |
| project-new.html | `Use my location` | `Use my current location` | plainer |
| team.html | `Regenerate` (share link) | `Get a new link` | "regenerate" sounds scary |
| team.html | `Save settings` | `Save changes` | plain |
| team.html | `Save directory settings` | `Save changes` | dedupe |
| team.html | `Refresh reviews now` | `Check for new reviews` | tells them what happens |
| team.html | `Revoke` (invite) | `Cancel invite` | plainer |
| team.html | `Manage subscription` | `Manage subscription` | keep — clear |
| team.html | `See plans` | `See plans` | keep |
| team.html | `Use latest` (media) | `Use most recent` | plainer |
| team.html | `Save to TikTok Drafts` | `Save as TikTok draft` | plainer singular |
| library.html | `Post to social` | `Share to social` | "share" is what they think |
| library.html | `Open project` | `Open job` | consistent |
| library.html | `New project` | `New job` | consistent |
| review.html | `Submit Feedback` | `Send feedback` | plainer |
| review.html | `No thanks` | `No thanks` | keep |

---

## 6. PILLS & BADGES

| File | Current | New | Why |
|---|---|---|---|
| team.html | `Beta` (on TikTok) | `Waiting on TikTok approval` | tells them the real state |
| team.html | `Coming soon · Meta review` | `Coming soon — Meta review` | typography |
| team.html | `Coming soon · Meta review in progress` | `Coming soon — Meta reviewing` | shorter |
| team.html | `Needs Approval` | `Needs your approval` | second-person = actionable |
| team.html | `Can Capture` | `Can add photos` | plainer |
| team.html | `Can Post` | `Can post to social` | plainer |
| team.html | `Privacy: Not selected` | `Pick who can see this` | tells them what to do |
| team.html | `Comments: off` | `Comments off` | drop colon |
| team.html | `Duet: off` | `Duet off` | drop colon |
| team.html | `Stitch: off` | `Stitch off` | drop colon |
| library.html | `Public` | `Public` | keep |
| library.html | `Video` | `Video` | keep |
| project.html | `Public` | `Public` | keep |

---

## 7. HELP TEXT (hints, descriptions, subtitles)

| File | Current | New | Why |
|---|---|---|---|
| project.html | `Only public items appear on your portfolio page.` | `Only Public photos and videos appear on your public page.` | plainer |
| project.html | `Send your customer a one-tap link to your Google Business profile.` | `Send your customer a one-tap link to leave you a Google review.` | says the outcome |
| project.html | `Add your Google review link in Settings before sending.` | `Add your Google review link in Business Profile settings before sending.` | tells them where |
| project.html | `SMS will open in your phone's Messages app — you tap Send.` | keep — already excellent | — |
| project-new.html | `Briefly describe the job. This is the title clients will see.` | `A short line describing the job. This becomes the title customers see.` | plainer |
| project-new.html | `Location not set` | `No location yet` | plainer |
| team.html | `Turn on if this content promotes a brand, product, or service` | `Turn on if you are being paid to post this or promoting a brand` | plain |
| team.html | `You are promoting another brand or a third party` | `I am promoting another brand or a third party` | first-person disclosure |
| team.html | `You are promoting yourself or your own business` | `I am promoting my own business` | first-person disclosure |
| team.html | `No caption yet.` | `No caption yet` | drop period |
| team.html | `Posting to Facebook Page` | `Posting to Facebook` | shorter |
| team.html | `Posting to Instagram` | `Posting to Instagram` | keep |
| team.html | `Posting to TikTok` | `Posting to TikTok` | keep |
| team.html | `JPG, PNG, WebP up to 8 MB · MP4 or MOV up to 100 MB` | keep | already good |
| auth.html | `The mobile toolkit for detailers and service professionals. Capture your best work, edit for social media, automate distribution across platforms, and collect five-star reviews from happy clients.` | `The mobile toolkit for solo owner-operators. Snap your work. Post to social. Collect five-star reviews. All from your phone.` | plainer, punchier |
| auth.html | `Sign in to your HyPurShot account.` | `Sign in to your account.` | dedupe brand name |
| auth.html | `Start capturing and sharing your best work.` | `Start showing off your best work.` | plainer |
| auth.html | `Tell us about your business so we can customize your experience.` | `A few basics about your business.` | plainer |
| auth.html | `Link your social accounts for automated posting. You can always update these later.` | `Connect social accounts so you can post from HyPurShot. You can add these later.` | plainer |
| auth.html | `Enter your email and we'll send a reset link.` | keep | good |
| auth.html | `Ask your manager for the invite code` | keep | good |
| auth.html | `I run my own business` | keep | good |
| auth.html | `I work for a company` | keep | good |
| auth.html | `Type anything — we serve every solo owner-operator.` | keep | good |
| reset-password.html | `Choose a strong password for your HyPurShot account.` | `Pick a strong password.` | plainer |
| reset-password.html | `Use at least 8 characters with a mix of letters and numbers.` | `At least 8 characters, mix letters and numbers.` | plainer |
| reset-password.html | `You can now sign in with your new password.` | `Sign in with your new password.` | plainer |
| review.html | `Would you mind sharing your experience on Google? It helps more than you know.` | keep | already great |
| review.html | `What could we have done better?` | keep | good |

---

## 8. PLACEHOLDERS

| File | Current | New | Why |
|---|---|---|---|
| team.html | `What's on your mind?` | `Write a caption…` | function-first |
| team.html | `Write a caption... use #hashtags and @mentions to reach people.` | `Write a caption… use #hashtags and @mentions to reach people.` | proper ellipsis |
| team.html | `Write a caption for your TikTok post...` | `Write a caption for your TikTok post…` | proper ellipsis |
| team.html | `Reason for rejection...` | `Tell them why (optional)` | second-person, actionable |
| team.html | `Add a service (e.g. Ceramic coating) and press Enter` | keep | good |
| team.html | `Leave blank for a universal invite code` | keep | good |
| team.html | `https://g.page/r/... or https://maps.google.com/?cid=...` | keep | technical field |
| review.html | `Your feedback is private and helps us improve...` | `Your feedback is private and helps us get better…` | plainer, proper ellipsis |

---

## 9. EMPTY STATES — full rewrites

Empty states are two lines: **what's missing** + **next action**.

### projects.html — "Start your first project"
**Before:**
> Start your first project
> Capture proof of your work. Build a portfolio that closes sales.

**After:**
> Start your first job
> Snap before-and-after photos. Text customers a review link. That's it.

### project.html — "No captures yet"
**Before:**
> No captures yet
> Tap Capture to add your first photo or video.

**After:**
> No photos or videos yet
> Tap the camera button below to add your first shot.

### library.html — "Library is empty"
**Before:**
> Library is empty

**After:**
> No photos or videos yet
> Everything you capture across every job shows up here.

### library.html — "Nothing here yet" (filtered)
**Before:**
> Nothing here yet

**After:**
> Nothing matches that filter
> Try switching to All above.

### team.html — Team empty
**Before:**
> No team members yet.

**After:**
> No team members yet
> Invite helpers so they can capture jobs from their own phones. You approve their posts before they go public.

### team.html — Services empty
**Before:**
> No services added yet.

**After:**
> No services added yet
> Add what you offer (e.g. Ceramic coating, Deck staining) so customers know what you do.

### team.html — Cover photo empty
**Before:**
> No published media yet. Upload some media first.

**After:**
> No public photos or videos yet
> Mark a photo or video as Public in a job first, then come back to pick a cover.

### team.html — Preview empty
**Before:**
> Add a video to see the preview

**After:**
> Pick a video above to see how it will look

### directory.html — No operators
**Before:**
> No operators yet

**After:**
> No matches yet
> Try a different city or clear the filters.

### camera.html — Camera not available
**Before:**
> Camera not available

**After:**
> Camera not available
> Check your browser permissions, then reload the page.

---

## 10. WHAT WE'RE NOT CHANGING

To keep scope tight, these stay as-is:
- Legal pages (privacy.html, terms.html, tiktok-integration.html) — legal review already done
- security.html — technical audience
- status.html — technical audience
- Marketing hero copy on index.html landing sections — hero already optimized
- Any button whose text is a single verb already understood (Save, Close, Cancel, Send, Add, Post, Copy)
- Email templates in edge functions (separate change if desired)

---

## Sync-with-code checklist

Files touched by the apply script:
- auth.html
- projects.html
- project.html
- project-new.html
- camera.html
- team.html
- library.html
- showcase.html
- directory.html
- review.html
- reset-password.html

Files NOT touched:
- index.html (marketing)
- privacy.html, terms.html (legal)
- tiktok-integration.html (legal)
- security.html, status.html (technical)
- 404.html, p.html
