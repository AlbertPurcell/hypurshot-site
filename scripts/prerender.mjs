#!/usr/bin/env node
// Static prerender for HyPurShot share pages.
//
// Pulls every business with a showcase_slug and visibility != 'private',
// plus every public post media item, and writes static HTML files under
// /share/<slug>/index.html and /share/post/<id>/index.html with hydrated
// Open Graph + Twitter + JSON-LD tags so social crawlers and Google get
// real metadata. Humans are bounced through to the live SPA via meta-refresh.
//
// Runs in GitHub Actions every 6 hours and on push to master.

import fs from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = 'https://xjsicupdpzawxlwcvxzv.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc2ljdXBkcHphd3hsd2N2eHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjgxNjEsImV4cCI6MjA5MDMwNDE2MX0.ZIuEFOCz1T7aVv6a39hXzvUucSZKgTJhDW5iPyXh1KM';
const SITE = 'https://hypurshot.com';
const OG_DEFAULT = `${SITE}/og-default.png`;
const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const escape = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

async function sb(pathStr) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathStr}`, {
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase ${pathStr} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function pickImageUrl(media) {
  if (!media) return null;
  // Prefer Instagram-square if available (1080x1080), then watermarked, then original
  return media.ig_square_url || media.watermarked_url || media.original_url || null;
}

function isImageUrl(u) {
  if (!u) return false;
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u);
}

function buildBusinessSchema(biz, ratingCount, ratingAvg, image) {
  const safeImg = image && isImageUrl(image) ? image : OG_DEFAULT;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: biz.name,
    url: `${SITE}/showcase.html?slug=${encodeURIComponent(biz.showcase_slug)}`,
    image: safeImg,
  };
  if (biz.city) schema.address = { '@type': 'PostalAddress', addressLocality: biz.city };
  if (Array.isArray(biz.services_tags) && biz.services_tags.length) {
    schema.makesOffer = biz.services_tags.slice(0, 8).map((t) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: t },
    }));
  }
  if (ratingAvg && ratingCount && Number(ratingCount) > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: String(ratingAvg),
      reviewCount: Number(ratingCount),
      bestRating: '5',
      worstRating: '1',
    };
  }
  return schema;
}

function renderSharePage({ title, description, url, image, canonical, schema, redirectTo }) {
  const safeImage = image && isImageUrl(image) ? image : OG_DEFAULT;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <link rel="canonical" href="${escape(canonical)}">
  <link rel="icon" type="image/webp" href="/logo-nav.webp">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="HyPurShot">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:url" content="${escape(url)}">
  <meta property="og:image" content="${escape(safeImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${escape(safeImage)}">

  <!-- Bounce humans through to the live SPA. Crawlers ignore this. -->
  <meta http-equiv="refresh" content="0; url=${escape(redirectTo)}">
  <script>
    // Belt-and-suspenders client redirect (only for real browsers, not bots).
    setTimeout(function () { window.location.replace(${JSON.stringify(redirectTo)}); }, 50);
  </script>

  <script type="application/ld+json">${JSON.stringify(schema)}</script>

  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0D0D0D;color:#F0EDE8;font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;text-align:center}
    .wrap{max-width:520px}
    h1{font-size:1.5rem;margin-bottom:.5rem;color:#D4A017}
    p{color:#888680;line-height:1.6}
    a{color:#A8D4E6}
  </style>
</head>
<body>
  <div class="wrap">
    <h1>${escape(title)}</h1>
    <p>${escape(description)}</p>
    <p style="margin-top:1rem"><a href="${escape(redirectTo)}">Open the full portfolio →</a></p>
  </div>
</body>
</html>
`;
}

async function buildBusinessPages() {
  const businesses = await sb(
    'businesses?select=id,name,showcase_slug,visibility,city,services_tags,logo_url,google_rating_avg,google_rating_count,years_experience,cover_media_id&showcase_slug=not.is.null&visibility=in.(public,shared)'
  );

  let built = 0;
  const sitemapEntries = [];
  for (const biz of businesses) {
    if (!biz.showcase_slug) continue;
    const slug = String(biz.showcase_slug).toLowerCase();

    // Get one cover media item — prefer cover_media_id, else newest public media
    let cover = null;
    if (biz.cover_media_id) {
      const rows = await sb(
        `media?select=original_url,watermarked_url,ig_square_url,mime_type&id=eq.${biz.cover_media_id}&limit=1`
      );
      cover = rows[0] || null;
    }
    if (!cover) {
      const rows = await sb(
        `media?select=original_url,watermarked_url,ig_square_url,mime_type&business_id=eq.${biz.id}&is_public=eq.true&order=captured_at.desc.nullslast,created_at.desc&limit=1`
      );
      cover = rows[0] || null;
    }
    const image = pickImageUrl(cover);

    const ratingNote =
      biz.google_rating_avg && biz.google_rating_count > 0
        ? ` · ${Number(biz.google_rating_avg).toFixed(1)}★ from ${biz.google_rating_count} Google review${biz.google_rating_count === 1 ? '' : 's'}`
        : '';
    // City may be stored as "Ashburn,VA" with no space — normalize it for readability.
    const prettyCity = (biz.city || '').replace(/,(\S)/g, ', $1').trim();
    const cityNote = prettyCity ? ` · ${prettyCity}` : '';
    const title = `${biz.name} — HyPurShot Portfolio`;
    const description = `See ${biz.name}'s recent detailing work${cityNote}${ratingNote}. Proof of work, not promises.`;

    const url = `${SITE}/share/${slug}/`;
    const redirectTo = `/showcase.html?slug=${encodeURIComponent(slug)}`;
    const canonical = `${SITE}/showcase.html?slug=${encodeURIComponent(slug)}`;
    const schema = buildBusinessSchema(biz, biz.google_rating_count, biz.google_rating_avg, image);

    const html = renderSharePage({ title, description, url, image, canonical, schema, redirectTo });
    const outDir = path.join(REPO_ROOT, 'share', slug);
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, 'index.html'), html);
    sitemapEntries.push({ loc: url, priority: '0.8' });
    built++;
    console.log(`  ✓ share/${slug}/`);
  }
  return { count: built, sitemapEntries };
}

async function buildPostPages() {
  // Public job posts: jobs marked with public-shareable media. We use the
  // media row itself as the share unit (one row per shared shot/video).
  // Reuse review_requests' review_token would also work, but media is the
  // simpler shareable atom.
  const posts = await sb(
    'media?select=id,business_id,original_url,watermarked_url,ig_square_url,mime_type,caption,created_at,businesses!media_business_id_fkey(name,showcase_slug,city,google_rating_avg,google_rating_count)&is_public=eq.true&order=created_at.desc&limit=200'
  );

  let built = 0;
  const sitemapEntries = [];
  for (const m of posts) {
    if (!m.id) continue;
    const biz = m.businesses || {};
    const image = pickImageUrl(m);
    const name = biz.name || 'HyPurShot';
    const cityNote = biz.city ? ` in ${biz.city}` : '';
    const title = `${name} — Detailing work${cityNote}`;
    const description = m.caption
      ? String(m.caption).slice(0, 180)
      : `Latest detailing work from ${name}. Tap to view the full portfolio on HyPurShot.`;

    const url = `${SITE}/share/post/${m.id}/`;
    const redirectTo = `/p.html?id=${encodeURIComponent(m.id)}`;
    const canonical = `${SITE}/p.html?id=${encodeURIComponent(m.id)}`;
    const safeImg = image && isImageUrl(image) ? image : OG_DEFAULT;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ImageObject',
      contentUrl: safeImg,
      caption: description,
      author: { '@type': 'LocalBusiness', name: name },
      url: canonical,
    };

    const html = renderSharePage({ title, description, url, image, canonical, schema, redirectTo });
    const outDir = path.join(REPO_ROOT, 'share', 'post', m.id);
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, 'index.html'), html);
    sitemapEntries.push({ loc: url, priority: '0.6' });
    built++;
  }
  console.log(`  ✓ wrote ${built} share/post/<id>/ pages`);
  return { count: built, sitemapEntries };
}

async function writeSitemap(allEntries) {
  // Static top-level pages
  const staticPages = [
    { loc: `${SITE}/`, priority: '1.0' },
    { loc: `${SITE}/directory.html`, priority: '0.9' },
    { loc: `${SITE}/privacy.html`, priority: '0.3' },
    { loc: `${SITE}/terms.html`, priority: '0.3' },
    { loc: `${SITE}/security.html`, priority: '0.4' },
    { loc: `${SITE}/status.html`, priority: '0.3' },
    { loc: `${SITE}/tiktok-integration.html`, priority: '0.4' },
  ];
  const now = new Date().toISOString().slice(0, 10);
  const entries = [...staticPages, ...allEntries];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${now}</lastmod>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
  await fs.writeFile(path.join(REPO_ROOT, 'sitemap.xml'), xml);
  console.log(`  ✓ sitemap.xml (${entries.length} urls)`);
}

async function writeRobots() {
  const txt = `User-agent: *
Allow: /

# Don't waste crawl budget on the SPA-only routes; the /share/ tree
# is the canonical entry point for crawlers.
Disallow: /reset-password.html
Disallow: /auth.html
Disallow: /project-new.html
Disallow: /project.html
Disallow: /camera.html
Disallow: /library.html
Disallow: /team.html

Sitemap: ${SITE}/sitemap.xml
`;
  await fs.writeFile(path.join(REPO_ROOT, 'robots.txt'), txt);
  console.log('  ✓ robots.txt');
}

(async () => {
  console.log('Building business pages...');
  const biz = await buildBusinessPages();
  console.log(`Built ${biz.count} business pages`);

  console.log('Building post pages...');
  const posts = await buildPostPages();
  console.log(`Built ${posts.count} post pages`);

  console.log('Writing sitemap and robots...');
  await writeSitemap([...biz.sitemapEntries, ...posts.sitemapEntries]);
  await writeRobots();

  console.log('\nDone.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
