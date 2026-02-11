const state = {
  lang: localStorage.getItem('lang') || 'en',
  data: null,
};

const dateFormatters = {
  en: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
  es: new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }),
};

function t(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[state.lang] || value.en || '';
}

function applyLabels(labels) {
  document.documentElement.lang = state.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    const entry = labels[key];
    if (entry) {
      el.textContent = entry[state.lang] || entry.en || '';
    }
  });
}

function setActiveLang() {
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === state.lang);
  });
}

function renderPhotos(target, photos) {
  if (!target || !photos) return;
  target.innerHTML = photos
    .map(
      (photo) => `
      <div class="photo">
        <img src="${photo.src}" alt="${t(photo.alt)}">
        <div class="photo-caption">${t(photo.caption)}</div>
      </div>
    `,
    )
    .join('');
}

function renderCountdown(element, targetDate) {
  if (!element || !targetDate) return () => {};
  const end = new Date(targetDate).getTime();

  const update = () => {
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) {
      element.textContent = state.lang === 'es' ? 'En curso / Nos vemos ahí' : 'Now live / See you there';
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    element.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  update();
  const timer = setInterval(update, 1000);
  return () => clearInterval(timer);
}

function renderHome(data) {
  const { band, events, links, discography } = data;
  const heroName = document.getElementById('band-name');
  const heroTag = document.getElementById('band-tagline');
  if (heroName) heroName.textContent = band.name;
  if (heroTag) heroTag.textContent = t(band.tagline);

  const nextEvent = events.nextEvent;
  const eventWrap = document.getElementById('next-event');
  if (eventWrap && nextEvent) {
    eventWrap.innerHTML = `
      <div class="card">
        <div class="badge">${t(nextEvent.type)}</div>
        <h3>${t(nextEvent.title)}</h3>
        <p>${t(nextEvent.location)}</p>
        <p>${dateFormatters[state.lang].format(new Date(nextEvent.date))}</p>
        <div class="divider-line"></div>
        <div class="countdown" id="countdown-home"></div>
      </div>
    `;
    renderCountdown(document.getElementById('countdown-home'), nextEvent.date);
  }

  const photosWrap = document.getElementById('home-photos');
  renderPhotos(photosWrap, band.photos.slice(0, 3));

  const latestDropLinks = document.getElementById('latest-drop-links');
  if (latestDropLinks) {
    latestDropLinks.innerHTML = `
      <a class="btn" href="${links.streaming.spotify}" target="_blank" rel="noopener">Spotify</a>
      <a class="btn" href="${links.streaming.appleMusic}" target="_blank" rel="noopener">Apple Music</a>
    `;
  }

  const latestDropArt = document.getElementById('latest-drop-art');
  if (latestDropArt) {
    const latestRelease = discography && discography.releases && discography.releases[0];
    if (latestRelease) {
      latestDropArt.innerHTML = `
        <div class="latest-release">
          <img src="${latestRelease.cover}" alt="${t(latestRelease.title)}">
          <div class="photo-caption">${t(latestRelease.title)} • ${latestRelease.year}</div>
        </div>
        <div class="divider-line"></div>
      `;
    } else {
      latestDropArt.innerHTML = '';
    }
  }
}

function renderAbout(data) {
  const { band } = data;
  const bio = document.getElementById('band-bio');
  if (bio) bio.textContent = t(band.bio);
  const photosWrap = document.getElementById('about-photos');
  renderPhotos(photosWrap, band.photos);
}

function renderMusic(data) {
  const { discography, links } = data;
  const streamWrap = document.getElementById('streaming-links');
  if (streamWrap) {
    streamWrap.innerHTML = `
      <div class="inline-links">
        <a href="${links.streaming.appleMusic}" target="_blank" rel="noopener">Apple Music</a>
        <a href="${links.streaming.spotify}" target="_blank" rel="noopener">Spotify</a>
      </div>
    `;
  }

  const list = document.getElementById('discography');
  if (list) {
    list.innerHTML = discography.releases
      .map(
        (release) => `
        <div class="card">
          <img src="${release.cover}" alt="${t(release.title)}">
          <div class="divider-line"></div>
          <h3>${t(release.title)}</h3>
          <p>${release.year} · ${t(release.type)}</p>
          <p>${t(release.description)}</p>
        </div>
      `,
      )
      .join('');
  }
}

function renderUpcoming(data) {
  const { events } = data;
  const heroCountdown = document.getElementById('countdown-hero');
  const nextEventTitle = document.getElementById('upcoming-title');
  const nextEventMeta = document.getElementById('upcoming-meta');

  if (events.nextEvent) {
    if (nextEventTitle) nextEventTitle.textContent = t(events.nextEvent.title);
    if (nextEventMeta) {
      nextEventMeta.textContent = `${t(events.nextEvent.location)} · ${dateFormatters[state.lang].format(new Date(events.nextEvent.date))}`;
    }
    renderCountdown(heroCountdown, events.nextEvent.date);
  }

  const list = document.getElementById('upcoming-list');
  if (list) {
    const releases = events.upcomingReleases || [];
    list.innerHTML = releases
      .map(
        (item) => `
        <div class="card">
          <img src="${item.image}" alt="${t(item.title)}">
          <div class="divider-line"></div>
          <h3>${t(item.title)}</h3>
          <p>${t(item.location)}</p>
          <p>${dateFormatters[state.lang].format(new Date(item.date))}</p>
          <p>${t(item.description)}</p>
        </div>
      `,
      )
      .join('');
  }
}

function renderPage() {
  if (!state.data) return;
  const { labels, band } = state.data;
  applyLabels(labels);
  setActiveLang();

  const headerBrandText = document.getElementById('brand-text');
  if (headerBrandText) headerBrandText.textContent = band.name;

  const page = document.body.dataset.page;
  if (page === 'home') renderHome(state.data);
  if (page === 'about') renderAbout(state.data);
  if (page === 'music') renderMusic(state.data);
  if (page === 'upcoming') renderUpcoming(state.data);

  const footerName = document.getElementById('footer-band');
  if (footerName) footerName.textContent = band.name;
}

async function init() {
  try {
    const fetchJson = async (path) => {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
      return res.json();
    };

    const [band, events, discography, links, labels] = await Promise.all([
      fetchJson('data/band.json'),
      fetchJson('data/events.json'),
      fetchJson('data/discography.json'),
      fetchJson('data/links.json'),
      fetchJson('data/labels.json'),
    ]);

    state.data = { band, events, discography, links, labels };
    renderPage();
  } catch (err) {
    console.error('Init error:', err);
    const fallback = document.getElementById('band-name');
    if (fallback) fallback.textContent = 'Data load error';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.lang = btn.dataset.lang;
      localStorage.setItem('lang', state.lang);
      renderPage();
    });
  });

  init();
});
