// HyPurShot — Proof-of-Work shared bootstrap.
// Provides: window.HPS = { sb, session, businessId, userId, business, init, requireAuth, toast,
//                          fmtDate, fmtRelative, slugify, qs, route }

(function () {
  const SUPABASE_URL = 'https://xjsicupdpzawxlwcvxzv.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc2ljdXBkcHphd3hsd2N2eHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjgxNjEsImV4cCI6MjA5MDMwNDE2MX0.ZIuEFOCz1T7aVv6a39hXzvUucSZKgTJhDW5iPyXh1KM';

  const HPS = {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    sb: null,
    session: null,
    userId: null,
    businessId: null,
    business: null,
  };

  // ─── Supabase client ───
  try {
    HPS.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn('Supabase init failed:', e && e.message);
  }

  // ─── Toast ───
  HPS.toast = function (message, kind) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = message;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2800);
  };

  // ─── Auth boot ───
  // Pulls session + business once; redirects to auth.html if missing and `redirect` is not false.
  HPS.init = async function (opts) {
    opts = opts || {};
    if (!HPS.sb) {
      HPS.toast('Backend not configured.', 'error');
      return null;
    }
    const { data: { session } } = await HPS.sb.auth.getSession();
    if (!session) {
      if (opts.redirect !== false) {
        setTimeout(() => { window.location.href = 'auth.html'; }, 600);
      }
      return null;
    }
    HPS.session = session;
    HPS.userId = session.user.id;

    // Find business — owner first, fallback to team member
    const { data: ownedBiz } = await HPS.sb
      .from('businesses')
      .select('*')
      .eq('owner_id', HPS.userId)
      .maybeSingle();

    if (ownedBiz) {
      HPS.business = ownedBiz;
      HPS.businessId = ownedBiz.id;
    } else {
      const { data: tm } = await HPS.sb
        .from('team_members')
        .select('business_id')
        .eq('user_id', HPS.userId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      if (tm) {
        HPS.businessId = tm.business_id;
        const { data: bizRow } = await HPS.sb
          .from('businesses')
          .select('*')
          .eq('id', HPS.businessId)
          .maybeSingle();
        HPS.business = bizRow || null;
      }
    }

    if (!HPS.businessId) {
      HPS.toast('No business found on your account.', 'error');
      return null;
    }
    return HPS;
  };

  // ─── Helpers ───
  HPS.fmtDate = function (iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) { return ''; }
  };

  HPS.fmtRelative = function (iso) {
    if (!iso) return '';
    const d = new Date(iso); const now = new Date();
    const sec = Math.floor((now - d) / 1000);
    if (sec < 60) return 'just now';
    if (sec < 3600) return Math.floor(sec / 60) + 'm ago';
    if (sec < 86400) return Math.floor(sec / 3600) + 'h ago';
    if (sec < 7 * 86400) return Math.floor(sec / 86400) + 'd ago';
    return HPS.fmtDate(iso);
  };

  HPS.slugify = function (str) {
    return (str || '')
      .toLowerCase()
      .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'shot-' + Date.now().toString(36);
  };

  HPS.qs = function (k) {
    const params = new URLSearchParams(window.location.search);
    return params.get(k);
  };

  HPS.route = function (path) { window.location.href = path; };

  // ─── Storage helper ───
  HPS.uploadToStorage = async function (file, prefix) {
    if (!HPS.sb) throw new Error('Supabase not initialized');
    if (!HPS.businessId) throw new Error('No business selected');
    const ext = (file.name && file.name.includes('.')) ? file.name.split('.').pop().toLowerCase() : 'bin';
    const safeExt = ext.replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin';
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const path = HPS.businessId + '/' + (prefix || 'capture') + '/' + ts + '-' + rand + '.' + safeExt;
    const { error: upErr } = await HPS.sb.storage
      .from('post-media')
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || undefined });
    if (upErr) throw upErr;
    const { data: pubData } = HPS.sb.storage.from('post-media').getPublicUrl(path);
    return { path, public_url: pubData.publicUrl, content_type: file.type || '', size: file.size };
  };

  // ─── Icons (inline SVG strings) ───
  HPS.icons = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    library: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.7 6.3.9-4.5 4.4 1 6.3-5.5-2.9-5.5 2.9 1-6.3L3 9.6l6.3-.9z"/></svg>',
    settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><path d="M15 18l-6-6 6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"/></svg>',
  };

  // ─── Bottom nav renderer ───
  HPS.renderBottomNav = function (active) {
    const items = [
      { id: 'projects', label: 'Projects', href: 'projects.html', icon: HPS.icons.folder },
      { id: 'library', label: 'Library', href: 'library.html', icon: HPS.icons.library },
      { id: 'showcase', label: 'Showcase', href: '#showcase', icon: HPS.icons.star },
      { id: 'team', label: 'Settings', href: 'team.html', icon: HPS.icons.settings },
    ];
    const html = items.map(it => {
      const isShowcase = it.id === 'showcase';
      return '<a data-id="' + it.id + '" class="' + (active === it.id ? 'active' : '') + '"' +
             (isShowcase ? '' : ' href="' + it.href + '"') + '>' +
             it.icon + '<span>' + it.label + '</span></a>';
    }).join('');
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.innerHTML = html;
    document.body.appendChild(nav);

    // Wire showcase to user's business slug after init
    nav.querySelector('[data-id="showcase"]').addEventListener('click', (e) => {
      e.preventDefault();
      if (HPS.business && HPS.business.showcase_slug) {
        window.location.href = 'showcase.html?slug=' + encodeURIComponent(HPS.business.showcase_slug);
      } else {
        HPS.toast('Set a showcase slug in Settings first.', 'error');
      }
    });
  };

  // ─── Freemium plan limits ───
  HPS.PLAN_LIMITS = {
    free:    { media: 30,       reviews_month: 3,        seats: 1   },
    starter: { media: Infinity, reviews_month: Infinity, seats: 1   },
    pro:     { media: Infinity, reviews_month: Infinity, seats: 5   },
    agency:  { media: Infinity, reviews_month: Infinity, seats: Infinity }
  };

  // Fetch current usage for the active business. Cached for 30s on the window.
  HPS._usageCache = { data: null, ts: 0 };
  HPS.getUsage = async function (opts) {
    opts = opts || {};
    if (!HPS.sb || !HPS.businessId) return null;
    const now = Date.now();
    if (!opts.force && HPS._usageCache.data && (now - HPS._usageCache.ts) < 30000) {
      return HPS._usageCache.data;
    }
    const { data, error } = await HPS.sb.rpc('get_business_usage', { p_business_id: HPS.businessId });
    if (error || !data || !data.length) return null;
    const row = data[0];
    const plan = (row.plan || 'free').toLowerCase();
    const limits = HPS.PLAN_LIMITS[plan] || HPS.PLAN_LIMITS.free;
    const out = {
      plan,
      limits,
      media_count: Number(row.media_count || 0),
      reviews_this_month: Number(row.reviews_this_month || 0),
      active_members: Number(row.active_members || 0),
      media_remaining: Math.max(0, limits.media - Number(row.media_count || 0)),
      reviews_remaining: Math.max(0, limits.reviews_month - Number(row.reviews_this_month || 0)),
      seats_remaining: Math.max(0, limits.seats - Number(row.active_members || 0))
    };
    HPS._usageCache = { data: out, ts: now };
    return out;
  };

  // Invalidate the usage cache (call after an upload, review send, or member invite).
  HPS.invalidateUsage = function () { HPS._usageCache = { data: null, ts: 0 }; };

  // Pre-flight check: returns { allowed, usage, reason }.
  // kind: 'media' | 'review' | 'seat'
  HPS.checkLimit = async function (kind) {
    const usage = await HPS.getUsage();
    if (!usage) return { allowed: true, usage: null };
    const L = usage.limits;
    if (kind === 'media' && usage.media_count >= L.media) {
      return { allowed: false, usage, reason: 'media', limit: L.media, current: usage.media_count };
    }
    if (kind === 'review' && usage.reviews_this_month >= L.reviews_month) {
      return { allowed: false, usage, reason: 'review', limit: L.reviews_month, current: usage.reviews_this_month };
    }
    if (kind === 'seat' && usage.active_members >= L.seats) {
      return { allowed: false, usage, reason: 'seat', limit: L.seats, current: usage.active_members };
    }
    return { allowed: true, usage };
  };

  // Upgrade modal — soft block. Renders into body, idempotent.
  HPS.showUpgradeModal = function (info) {
    info = info || {};
    const titles = {
      media: 'You\u2019ve reached your media limit',
      review: 'You\u2019ve sent all your review requests this month',
      seat: 'Free plan includes one user',
      generic: 'Upgrade to unlock more'
    };
    const bodies = {
      media: 'The Free plan includes 30 media items. Upgrade to Starter for unlimited photos and videos, white-labeled showcase, and unlimited review requests.',
      review: 'The Free plan includes 3 review requests per month. Upgrade to Starter for unlimited review requests and a white-labeled showcase page.',
      seat: 'The Free plan supports one user. Upgrade to Pro to invite up to 5 team members, or Agency for unlimited.',
      generic: 'Unlock unlimited media, reviews, and team seats with a paid plan.'
    };
    const reason = info.reason || 'generic';
    const title = titles[reason] || titles.generic;
    const body = bodies[reason] || bodies.generic;
    const usageLine = info.current != null && info.limit != null && isFinite(info.limit)
      ? '<div class="upg-usage">Current usage: <b>' + info.current + ' / ' + info.limit + '</b></div>'
      : '';

    // Remove any existing modal
    const old = document.getElementById('hps-upgrade-modal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'hps-upgrade-modal';
    modal.className = 'hps-modal-backdrop';
    modal.innerHTML =
      '<div class="hps-modal">' +
        '<div class="hps-modal-icon">' +
          '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M12 2L2 19h20L12 2z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' +
          '</svg>' +
        '</div>' +
        '<h2>' + title + '</h2>' +
        '<p>' + body + '</p>' +
        usageLine +
        '<div class="hps-modal-actions">' +
          '<button class="hps-btn-gold" onclick="window.location.href=\'index.html#pricing\'">See plans</button>' +
          '<button class="hps-btn-ghost" onclick="document.getElementById(\'hps-upgrade-modal\').remove()">Not now</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  };

  // Inject modal CSS once.
  (function injectUpgradeCSS() {
    if (document.getElementById('hps-upgrade-css')) return;
    const css = document.createElement('style');
    css.id = 'hps-upgrade-css';
    css.textContent =
      '.hps-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.78);' +
        'display:flex;align-items:center;justify-content:center;z-index:9999;' +
        'padding:24px;animation:hpsFade .18s ease-out}' +
      '@keyframes hpsFade{from{opacity:0}to{opacity:1}}' +
      '.hps-modal{background:#161616;border:1px solid rgba(255,255,255,.08);' +
        'border-radius:14px;padding:32px 28px;max-width:420px;width:100%;' +
        'color:#F0EDE8;font-family:\'Satoshi\',sans-serif;text-align:center;' +
        'box-shadow:0 20px 60px rgba(0,0,0,.5)}' +
      '.hps-modal-icon{width:56px;height:56px;border-radius:50%;' +
        'background:rgba(212,160,23,.12);border:1px solid rgba(212,160,23,.35);' +
        'color:#D4A017;display:flex;align-items:center;justify-content:center;' +
        'margin:0 auto 18px}' +
      '.hps-modal h2{font-family:\'Cabinet Grotesk\',sans-serif;font-weight:800;' +
        'font-size:1.35rem;margin-bottom:10px;letter-spacing:-.01em}' +
      '.hps-modal p{color:#888680;font-size:.92rem;line-height:1.55;margin-bottom:14px}' +
      '.upg-usage{font-size:.82rem;color:#888680;margin-bottom:20px;' +
        'padding:10px 14px;background:#0D0D0D;border:1px solid rgba(255,255,255,.06);' +
        'border-radius:8px;display:inline-block}' +
      '.upg-usage b{color:#F0EDE8;font-weight:700}' +
      '.hps-modal-actions{display:flex;gap:10px;justify-content:center;margin-top:8px}' +
      '.hps-btn-gold{background:#D4A017;color:#000;border:none;border-radius:8px;' +
        'padding:12px 22px;font-family:\'Satoshi\',sans-serif;font-weight:700;font-size:.92rem;' +
        'cursor:pointer;transition:background .15s}' +
      '.hps-btn-gold:hover{background:#c2920f}' +
      '.hps-btn-ghost{background:transparent;color:#888680;border:1px solid rgba(255,255,255,.1);' +
        'border-radius:8px;padding:12px 22px;font-family:\'Satoshi\',sans-serif;font-weight:500;' +
        'font-size:.92rem;cursor:pointer;transition:color .15s,border-color .15s}' +
      '.hps-btn-ghost:hover{color:#F0EDE8;border-color:rgba(255,255,255,.2)}';
    document.head.appendChild(css);
  })();

  // ─── Service worker registration ───
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW register failed:', e));
    });
  }

  // ─── PWA install prompt (Android/Chrome) ───
  let deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    HPS.installPrompt = deferredInstallPrompt;
  });
  HPS.showInstallPrompt = async function () {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      return choice && choice.outcome === 'accepted';
    }
    return false;
  };

  window.HPS = HPS;
})();
