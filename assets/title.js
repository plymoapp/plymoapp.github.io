// A title shared from Plymo: https://plymoapp.github.io/t/?kind=movie&id=396535&l=ar
// Where the app is installed, iOS opens the title in it and this page never
// shows; elsewhere the page shows the title from Plymo's public catalog and a
// way into the app. Every value from the catalog is set as text, never as
// markup.
'use strict';

const catalog = 'https://wixkzaymnbdnimaxeobl.supabase.co/functions/v1/public-catalog';
// The public key the app itself ships with; it reads the public catalog only.
const publicKey = 'sb_publishable_znLsLrCz-n02FkzaZHlORg_ErSEyfH3';
const kinds = new Set(['movie', 'series', 'game']);

const words = {
  ar: {
    movie: 'فيلم', series: 'مسلسل', game: 'لعبة',
    minutes: n => `${n} دقيقة`,
    seasons: n => (n === 1 ? 'موسم واحد' : n === 2 ? 'موسمان' : `${n} مواسم`),
    open: 'افتح في Plymo',
    soon: 'قريبًا على App Store',
    pitch: 'Plymo يجمع أفلامك ومسلسلاتك وألعابك في مكان واحد: تتابع ما تشاهده، وتقيّمه، ويخبرك بكل حلقة جديدة.',
    missing: 'هذا الرابط ناقص، اطلب من صاحبه يرسله مرة ثانية.',
    failed: 'ما قدرنا نجيب هذا العمل الحين.',
    retry: 'حاول مرة ثانية',
    tmdb: 'بيانات الأفلام والمسلسلات من TMDB، وهو غير معتمد منها.',
    igdb: 'بيانات الألعاب من IGDB.',
  },
  en: {
    movie: 'Movie', series: 'Series', game: 'Game',
    minutes: n => `${n} min`,
    seasons: n => (n === 1 ? '1 season' : `${n} seasons`),
    open: 'Open in Plymo',
    soon: 'Coming soon to the App Store',
    pitch: 'Plymo keeps your films, series and games in one place: track what you watch, rate it, and hear of every new episode.',
    missing: 'This link is incomplete; ask for it again.',
    failed: "We couldn't load this title just now.",
    retry: 'Try again',
    tmdb: 'Film and series data from TMDB; not endorsed or certified by TMDB.',
    igdb: 'Game data from IGDB.',
  },
};

// Latin figures everywhere, as in the app.
const latin = text => String(text ?? '').replace(/[٠-٩]/g, d => d.charCodeAt(0) - 0x660)
  .replace(/[۰-۹]/g, d => d.charCodeAt(0) - 0x6f0);

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const kind = params.get('kind');
const id = params.get('id');
const language = params.get('l') === 'en' ? 'en' : 'ar';
const say = words[language];

function setLanguage() {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  $('open-label').textContent = say.open;
  $('soon').textContent = say.soon;
  $('pitch').textContent = say.pitch;
  $('retry').textContent = say.retry;
  $('credit').textContent = kind === 'game' ? say.igdb : say.tmdb;
}

function showProblem(text) {
  $('page').classList.remove('loading');
  $('title').hidden = true;
  $('problem').hidden = false;
  $('problem-text').textContent = text;
  $('retry').hidden = text === say.missing;
}

function show(item) {
  const title = latin(item.title);
  document.title = `${title} · Plymo`;
  $('name').textContent = title;
  $('poster').setAttribute('aria-label', title);
  if (item.coverUrl) $('poster').style.backgroundImage = `url("${encodeURI(item.coverUrl)}")`;
  if (item.backdropUrl) {
    const picture = new Image();
    picture.onload = () => {
      $('backdrop').style.backgroundImage = `url("${encodeURI(item.backdropUrl)}")`;
      $('backdrop').classList.add('shown');
    };
    picture.src = item.backdropUrl;
  }
  const facts = [say[item.kind] ?? '', ...(item.genres ?? []).slice(0, 2)];
  if (/^\d{4}/.test(item.releaseDate ?? '')) facts.push(item.releaseDate.slice(0, 4));
  if (item.kind === 'series' && item.seasons?.length) {
    facts.push(say.seasons(item.seasons.filter(n => n > 0).length || item.seasons.length));
  } else if (item.runtimeMinutes > 0) {
    facts.push(say.minutes(item.runtimeMinutes));
  }
  $('facts').textContent = latin(facts.filter(Boolean).join(' · '));
  if (item.source === 'tmdb' && typeof item.sourceRating === 'number') {
    $('score-value').textContent = item.sourceRating.toFixed(1);
    $('score').hidden = false;
  }
  $('synopsis').textContent = latin(item.overview);
  $('synopsis').hidden = !item.overview;
  $('synopsis').dir = item.overviewLanguage === 'en' ? 'ltr' : 'auto';
  $('open').href = `com.plymo.plymo://title?kind=${item.kind}&id=${item.sourceId}`;
  $('page').classList.remove('loading');
}

async function load() {
  $('problem').hidden = true;
  $('title').hidden = false;
  $('page').classList.add('loading');
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), 15000);
  try {
    const response = await fetch(catalog, {
      method: 'POST',
      headers: {
        apikey: publicKey,
        authorization: `Bearer ${publicKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ action: 'details', kind, sourceId: Number(id), language }),
      signal: stop.signal,
    });
    if (!response.ok) throw new Error(`catalog ${response.status}`);
    const data = await response.json();
    if (!data?.item?.title) throw new Error('no title');
    show(data.item);
  } catch (_) {
    showProblem(say.failed);
  } finally {
    clearTimeout(timer);
  }
}

setLanguage();
$('retry').addEventListener('click', load);
if (kinds.has(kind) && /^\d{1,15}$/.test(id ?? '')) {
  load();
} else {
  showProblem(say.missing);
}
