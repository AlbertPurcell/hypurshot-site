// HyPurShot first-login onboarding wizard.
// Fires only when businesses.onboarded_at is NULL for the current owner.
// Fixed-position full-screen overlay; skip and finish both set onboarded_at = now().
//
// Only affects: team members are excluded (they don't own the business row).
// Only owner-role users see this — team members go straight to Projects.
//
// This file is loaded from projects.html; it self-initializes once the
// window.HPS session bootstraps.
(function () {
  'use strict';

  // Wait for HPS to finish init(), then check whether we should show the wizard.
  // Since this script is loaded with `defer`, DOMContentLoaded may already have
  // fired. Handle both cases.
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  async function bootstrap() {
    // HPS.init is called by projects.html's own bootstrap; wait until session is loaded.
    // Poll briefly for HPS.session — cap at ~5s so we never block if init fails.
    const startedAt = Date.now();
    while (!(window.HPS && window.HPS.session && window.HPS.business) && Date.now() - startedAt < 5000) {
      await sleep(80);
    }
    if (!window.HPS || !window.HPS.business) return;

    const biz = window.HPS.business;

    // Only owners see the wizard (team members won't own the business row).
    if (biz.owner_id !== window.HPS.userId) return;

    // Already onboarded — never show again.
    if (biz.onboarded_at) return;

    showWizard(biz);
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ─────────────────────────── UI ───────────────────────────

  function showWizard(biz) {
    // Prevent page scroll behind the overlay
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.id = 'hps-onboard';
    overlay.innerHTML = markup(biz);
    document.body.appendChild(overlay);

    injectStyles();

    // Wire step navigation
    const steps = overlay.querySelectorAll('.hps-onboard-step');
    let current = 0;

    function go(index) {
      current = index;
      steps.forEach((s, i) => s.classList.toggle('active', i === index));
      // Update progress dots
      overlay.querySelectorAll('.hps-onboard-dot').forEach((d, i) => d.classList.toggle('active', i === index));
    }

    overlay.querySelectorAll('[data-onboard-next]').forEach(btn => btn.addEventListener('click', () => go(current + 1)));
    overlay.querySelectorAll('[data-onboard-back]').forEach(btn => btn.addEventListener('click', () => go(current - 1)));
    overlay.querySelectorAll('[data-onboard-skip]').forEach(btn => btn.addEventListener('click', () => finish('skipped')));
    overlay.querySelectorAll('[data-onboard-finish]').forEach(btn => btn.addEventListener('click', () => finish('completed')));

    // "Copy link" on the URL preview
    const copyBtn = overlay.querySelector('[data-onboard-copy]');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const url = copyBtn.dataset.url;
        try {
          await navigator.clipboard.writeText(url);
        } catch (e) {
          // Fallback for older iOS Safari
          const ta = document.createElement('textarea');
          ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch (_) {}
          document.body.removeChild(ta);
        }
        copyBtn.textContent = 'Link copied';
        copyBtn.classList.add('copied');
        setTimeout(() => { copyBtn.textContent = 'Copy link'; copyBtn.classList.remove('copied'); }, 1600);
      });
    }
  }

  async function finish(reason) {
    // Mark onboarded so the wizard never shows again
    try {
      if (window.HPS && window.HPS.sb && window.HPS.businessId) {
        await window.HPS.sb
          .from('businesses')
          .update({ onboarded_at: new Date().toISOString() })
          .eq('id', window.HPS.businessId);
      }
    } catch (e) {
      // Non-blocking — still close the wizard so the user isn't stuck.
      console.warn('onboarded_at update failed:', e);
    }
    const overlay = document.getElementById('hps-onboard');
    if (overlay) overlay.remove();
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    if (reason === 'completed' && window.HPS && window.HPS.toast) {
      window.HPS.toast('Welcome to HyPurShot — you\u2019re all set.', 'success');
    }
  }

  // ─────────────────────────── Markup ───────────────────────────

  function markup(biz) {
    const firstName = (biz.first_name || '').trim();
    const bizName = escapeHtml(biz.name || 'your business');
    const slug = biz.showcase_slug || '';
    const cardUrl = slug ? ('https://hypurshot.com/card/' + encodeURIComponent(slug)) : '';
    const cardHost = slug ? ('hypurshot.com/card/' + escapeHtml(slug)) : 'Set your slug in the Business tab';

    return (
      '<div class="hps-onboard-inner">' +
        '<button type="button" class="hps-onboard-close" data-onboard-skip aria-label="Skip">Skip for now</button>' +

        '<div class="hps-onboard-dots">' +
          '<span class="hps-onboard-dot active"></span>' +
          '<span class="hps-onboard-dot"></span>' +
          '<span class="hps-onboard-dot"></span>' +
        '</div>' +

        // ── Step 1: Welcome ──
        '<section class="hps-onboard-step active">' +
          '<div class="hps-onboard-eyebrow">Welcome to HyPurShot</div>' +
          '<h1 class="hps-onboard-title">' + (firstName ? ('Hey ' + escapeHtml(firstName) + ',') : 'Let\u2019s get you set up') + '</h1>' +
          '<p class="hps-onboard-lede">The mobile toolkit for solo owner-operators. Three things you\u2019ll use every day:</p>' +

          '<div class="hps-onboard-list">' +
            '<div class="hps-onboard-item"><div class="hps-onboard-item-num">1</div><div class="hps-onboard-item-copy"><b>Snap your work.</b> Before and after shots from every job.</div></div>' +
            '<div class="hps-onboard-item"><div class="hps-onboard-item-num">2</div><div class="hps-onboard-item-copy"><b>Post to social.</b> One tap sends photos to Instagram, TikTok, Facebook.</div></div>' +
            '<div class="hps-onboard-item"><div class="hps-onboard-item-num">3</div><div class="hps-onboard-item-copy"><b>Get reviewed.</b> Text a review link. Follow up if they don\u2019t click.</div></div>' +
          '</div>' +

          '<div class="hps-onboard-actions">' +
            '<button type="button" class="hps-onboard-btn hps-onboard-btn-primary" data-onboard-next>Continue</button>' +
          '</div>' +
        '</section>' +

        // ── Step 2: Card URL preview ──
        '<section class="hps-onboard-step">' +
          '<div class="hps-onboard-eyebrow">Your digital card is live</div>' +
          '<h1 class="hps-onboard-title">Meet your always-on card</h1>' +
          '<p class="hps-onboard-lede">Every account gets a public card at:</p>' +

          '<div class="hps-onboard-url-chip">' +
            '<div class="hps-onboard-url-text">' + cardHost + '</div>' +
            (cardUrl
              ? '<button type="button" class="hps-onboard-copy-btn" data-onboard-copy data-url="' + escapeAttr(cardUrl) + '">Copy link</button>'
              : ''
            ) +
          '</div>' +

          (cardUrl
            ? '<a href="' + escapeAttr(cardUrl) + '" target="_blank" rel="noopener" class="hps-onboard-preview-link">Open a preview \u2197</a>'
            : '<p class="hps-onboard-hint">Head to <b>Team \u2192 Business</b> to set your slug, then come back.</p>'
          ) +

          '<div class="hps-onboard-tip">' +
            '<b>Pro move:</b> add your logo and headshot in <b>Team \u2192 My Card</b>. Cards with photos get twice as many contact saves.' +
          '</div>' +

          '<div class="hps-onboard-actions hps-onboard-actions-split">' +
            '<button type="button" class="hps-onboard-btn hps-onboard-btn-ghost" data-onboard-back>Back</button>' +
            '<button type="button" class="hps-onboard-btn hps-onboard-btn-primary" data-onboard-next>Continue</button>' +
          '</div>' +
        '</section>' +

        // ── Step 3: Ready ──
        '<section class="hps-onboard-step">' +
          '<div class="hps-onboard-eyebrow">You\u2019re ready</div>' +
          '<h1 class="hps-onboard-title">Log your first job</h1>' +
          '<p class="hps-onboard-lede">Every job you finish becomes a portfolio entry and a chance to earn a review. That\u2019s the whole loop.</p>' +

          '<div class="hps-onboard-checklist">' +
            '<div class="hps-onboard-check"><span class="hps-onboard-check-icon">\u2713</span> Account created</div>' +
            '<div class="hps-onboard-check"><span class="hps-onboard-check-icon">\u2713</span> ' + bizName + ' set up</div>' +
            '<div class="hps-onboard-check"><span class="hps-onboard-check-icon">\u2713</span> Digital card live</div>' +
          '</div>' +

          '<div class="hps-onboard-actions hps-onboard-actions-split">' +
            '<button type="button" class="hps-onboard-btn hps-onboard-btn-ghost" data-onboard-back>Back</button>' +
            '<button type="button" class="hps-onboard-btn hps-onboard-btn-primary" data-onboard-finish>Start my first job</button>' +
          '</div>' +
        '</section>' +

      '</div>'
    );
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ─────────────────────────── Styles ───────────────────────────

  function injectStyles() {
    if (document.getElementById('hps-onboard-styles')) return;
    const style = document.createElement('style');
    style.id = 'hps-onboard-styles';
    style.textContent = `
      #hps-onboard {
        position: fixed; inset: 0; z-index: 9999;
        background: #0D0D0D;
        font-family: 'Satoshi', system-ui, -apple-system, sans-serif;
        color: #F0EDE8;
        overflow-y: auto;
        animation: hps-onboard-fade 220ms ease-out;
      }
      @keyframes hps-onboard-fade { from { opacity: 0 } to { opacity: 1 } }
      @media (prefers-reduced-motion: reduce) { #hps-onboard { animation: none } }

      .hps-onboard-inner {
        max-width: 460px;
        margin: 0 auto;
        padding: 56px 24px 40px;
        min-height: 100vh;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        position: relative;
      }

      .hps-onboard-close {
        position: absolute;
        top: 18px; right: 20px;
        background: transparent;
        border: none;
        color: #b8b3aa;
        font-family: inherit;
        font-size: .82rem;
        font-weight: 500;
        cursor: pointer;
        padding: 6px 10px;
        letter-spacing: .01em;
      }
      .hps-onboard-close:hover { color: #F0EDE8; }

      .hps-onboard-dots {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-bottom: 32px;
      }
      .hps-onboard-dot {
        width: 24px; height: 4px;
        border-radius: 2px;
        background: rgba(240,237,232,0.12);
        transition: background 240ms ease;
      }
      .hps-onboard-dot.active { background: #D4A017; }

      .hps-onboard-step {
        display: none;
        flex-direction: column;
        flex: 1;
      }
      .hps-onboard-step.active { display: flex; }

      .hps-onboard-eyebrow {
        font-size: .72rem;
        text-transform: uppercase;
        letter-spacing: .12em;
        color: #D4A017;
        font-weight: 700;
        margin-bottom: 12px;
      }
      .hps-onboard-title {
        font-family: 'Cabinet Grotesk', sans-serif;
        font-weight: 800;
        font-size: 2rem;
        line-height: 1.08;
        letter-spacing: -0.02em;
        margin: 0 0 16px;
      }
      .hps-onboard-lede {
        font-size: 1rem;
        line-height: 1.5;
        color: #b8b3aa;
        margin: 0 0 28px;
      }

      .hps-onboard-list {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-bottom: 36px;
      }
      .hps-onboard-item {
        display: flex;
        gap: 14px;
        align-items: flex-start;
        background: #161616;
        border: 1px solid rgba(240,237,232,0.10);
        border-radius: 12px;
        padding: 14px 16px;
      }
      .hps-onboard-item-num {
        flex-shrink: 0;
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 1.5px solid #D4A017;
        color: #D4A017;
        font-family: 'Cabinet Grotesk', sans-serif;
        font-weight: 700;
        font-size: .9rem;
        display: flex; align-items: center; justify-content: center;
      }
      .hps-onboard-item-copy {
        font-size: .92rem;
        line-height: 1.45;
        color: #F0EDE8;
      }
      .hps-onboard-item-copy b { color: #F0EDE8; font-weight: 700; }

      .hps-onboard-url-chip {
        background: #161616;
        border: 1px solid rgba(212,160,23,0.30);
        border-radius: 12px;
        padding: 14px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
      }
      .hps-onboard-url-text {
        flex: 1;
        min-width: 0;
        font-family: 'Cabinet Grotesk', sans-serif;
        font-weight: 700;
        color: #D4A017;
        font-size: .95rem;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .hps-onboard-copy-btn {
        flex-shrink: 0;
        background: transparent;
        border: 1px solid rgba(240,237,232,0.14);
        color: #F0EDE8;
        font-family: inherit;
        font-size: .78rem;
        font-weight: 600;
        padding: 7px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 160ms, border-color 160ms;
      }
      .hps-onboard-copy-btn:hover { background: rgba(240,237,232,0.06); }
      .hps-onboard-copy-btn.copied { border-color: #D4A017; color: #D4A017; }

      .hps-onboard-preview-link {
        display: inline-block;
        color: #A8D4E6;
        font-size: .88rem;
        font-weight: 600;
        text-decoration: none;
        margin-bottom: 24px;
      }
      .hps-onboard-preview-link:hover { text-decoration: underline; }

      .hps-onboard-hint {
        font-size: .86rem;
        color: #b8b3aa;
        margin: 0 0 24px;
      }

      .hps-onboard-tip {
        background: rgba(212,160,23,0.06);
        border: 1px solid rgba(212,160,23,0.20);
        border-radius: 10px;
        padding: 12px 14px;
        font-size: .84rem;
        line-height: 1.5;
        color: #F0EDE8;
        margin-bottom: 32px;
      }
      .hps-onboard-tip b { color: #D4A017; }

      .hps-onboard-checklist {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 36px;
      }
      .hps-onboard-check {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #161616;
        border: 1px solid rgba(240,237,232,0.10);
        border-radius: 10px;
        padding: 12px 14px;
        font-size: .94rem;
        font-weight: 500;
      }
      .hps-onboard-check-icon {
        display: inline-flex;
        align-items: center; justify-content: center;
        width: 22px; height: 22px;
        border-radius: 50%;
        background: #D4A017;
        color: #0D0D0D;
        font-weight: 800;
        font-size: .78rem;
        flex-shrink: 0;
      }

      .hps-onboard-actions {
        margin-top: auto;
        padding-top: 24px;
        display: flex;
        gap: 12px;
      }
      .hps-onboard-actions .hps-onboard-btn { flex: 1; }
      .hps-onboard-actions-split .hps-onboard-btn-ghost { flex: 0 0 auto; min-width: 90px; }

      .hps-onboard-btn {
        font-family: inherit;
        font-size: .95rem;
        font-weight: 700;
        border: none;
        border-radius: 10px;
        padding: 14px 18px;
        cursor: pointer;
        letter-spacing: .01em;
        transition: transform 120ms, opacity 160ms, background 160ms;
      }
      .hps-onboard-btn:active { transform: scale(0.98); }
      @media (prefers-reduced-motion: reduce) { .hps-onboard-btn { transition: none } .hps-onboard-btn:active { transform: none } }

      .hps-onboard-btn-primary {
        background: #D4A017;
        color: #0D0D0D;
      }
      .hps-onboard-btn-primary:hover { background: #E0AC1F; }

      .hps-onboard-btn-ghost {
        background: transparent;
        color: #F0EDE8;
        border: 1px solid rgba(240,237,232,0.14);
      }
      .hps-onboard-btn-ghost:hover { background: rgba(240,237,232,0.06); }
    `;
    document.head.appendChild(style);
  }
})();
