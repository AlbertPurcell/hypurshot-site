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
