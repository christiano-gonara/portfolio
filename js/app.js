// Conteúdo público em JSON; não há backend nem credenciais neste projeto.
const root = new URL('../', import.meta.url);
const page = document.body.dataset.page;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};
const icon = (name) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#icon-${name}`);
  svg.append(use);
  return svg;
};
const externalLink = (url, label, className = 'text-link') => {
  const link = node('a', className, label);
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  return link;
};
async function loadJSON(file) {
  const response = await fetch(new URL(`data/${file}`, root));
  if (!response.ok) throw new Error(`Falha ao carregar ${file}: ${response.status}`);
  return response.json();
}
function readLanguage() {
  const query = new URLSearchParams(location.search).get('lang');
  if (query === 'pt' || query === 'en') return query;
  try { return localStorage.getItem('portfolio-language') === 'en' ? 'en' : 'pt'; }
  catch { return 'pt'; }
}
let language = readLanguage();
let profile;
let projects = [];
let languages;
let experiences;
let category = 'all';
const locale = () => language === 'pt' ? 'pt-BR' : 'en-US';
const monthYear = (date) => new Intl.DateTimeFormat(locale(), {
  month: 'short', year: 'numeric', timeZone: 'UTC'
}).format(new Date(`${date.slice(0, 7)}-01T12:00:00Z`));

/* ---------- Revelação ao rolar: IntersectionObserver, sem listener de scroll ---------- */

const canObserve = 'IntersectionObserver' in window && !reduceMotion;
const revealObserver = canObserve ? new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }) : null;
function observeReveals(scope = document) {
  scope.querySelectorAll('[data-reveal]:not(.is-visible)').forEach(element => {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add('is-visible');
  });
}

/* ---------- Tagline: cada palavra acende ao cruzar a linha de gatilho ---------- */

let wordObserver;
function prepareTagline() {
  const element = document.querySelector('[data-tagline]');
  if (!element) return;
  wordObserver?.disconnect();
  const words = element.textContent.trim().split(/\s+/);
  element.replaceChildren();
  words.forEach((word, index) => {
    element.append(node('span', 'word', word));
    if (index < words.length - 1) element.append(document.createTextNode(' '));
  });
  const spans = [...element.querySelectorAll('.word')];
  if (!canObserve) {
    spans.forEach(span => span.classList.add('is-lit'));
    return;
  }
  wordObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const span = entry.target;
      const lit = entry.isIntersecting || entry.boundingClientRect.top < 0;
      // Palavras da mesma linha acendem em sequência, na ordem de leitura.
      const sameLine = spans.filter(item => item.offsetTop === span.offsetTop);
      span.style.transitionDelay = lit ? `${sameLine.indexOf(span) * 60}ms` : '0ms';
      span.classList.toggle('is-lit', lit);
    });
  }, { rootMargin: '0px 0px -40% 0px' });
  spans.forEach(span => wordObserver.observe(span));
}

/* ---------- Renderização ---------- */

function renderTags(values) {
  const list = node('ul', 'skills');
  values.forEach(value => list.append(node('li', 'skill', value)));
  return list;
}
function emptyState(text) {
  const box = node('div', 'state');
  const title = node('h3', '', text.emptyTitle);
  const reset = node('button', 'button', text.emptyAction);
  reset.type = 'button';
  reset.addEventListener('click', () => {
    category = 'all';
    renderProjects();
  });
  box.append(icon('search'), title, node('p', '', text.emptyBody), reset);
  return box;
}
function renderProjects(options = {}) {
  const target = document.querySelector('#project-timeline');
  if (!target) return;
  const text = profile[language];
  // Destaque primeiro; os demais seguem em ordem cronológica.
  const visible = [...projects]
    .sort((a, b) => Boolean(b.destaque) - Boolean(a.destaque) || a.publicadoEm.localeCompare(b.publicadoEm))
    .filter(project => category === 'all' || project.categoria === category);
  target.replaceChildren();
  target.setAttribute('aria-busy', 'false');
  document.querySelector('#project-count').textContent =
    `${visible.length} ${visible.length === 1 ? text.projectCountOne : text.projectCount}`;
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === category));
  });
  if (!visible.length) {
    target.append(emptyState(text));
    return;
  }
  const compactCount = visible.filter(project => !project.destaque).length;
  visible.forEach((project, index) => {
    const detail = project[language];
    const article = node('article', 'project');
    // Cartões simples ficam em pares; o último, se sobrar sozinho, ocupa a linha toda.
    const lastAlone = !project.destaque && compactCount % 2 === 1 && index === visible.length - 1;
    if (project.destaque) article.classList.add('project--featured');
    else if (!lastAlone) article.classList.add('project--compact');
    article.dataset.reveal = '';
    article.style.setProperty('--delay', `${index * 100}ms`);
    const figure = node('figure');
    const imageLink = externalLink(new URL(project.imagem, root).href, '', 'image-link');
    imageLink.setAttribute('aria-label', `${text.openImage}: ${project.nome}`);
    const image = node('img');
    image.src = new URL(project.imagem, root).href;
    image.alt = detail.alt;
    image.loading = 'lazy';
    image.width = 700;
    image.height = 420;
    const imageAction = node('span', 'image-action', text.openImage);
    imageAction.append(icon('zoom'));
    imageLink.append(image, imageAction);
    figure.append(imageLink, node('figcaption', '', detail.legenda));
    const body = node('div', 'project-body');
    const date = node('p', 'project-date');
    const time = node('time', '', monthYear(project.publicadoEm));
    time.dateTime = project.publicadoEm;
    date.append(icon('calendar'), time, node('span', '', text.published));
    const heading = node('h2', '', project.nome);
    heading.id = project.id;
    article.setAttribute('aria-labelledby', project.id);
    const repository = externalLink(project.repositorio, text.repository);
    repository.prepend(icon('github'));
    repository.append(icon('arrow-up-right'));
    const actions = node('div', 'project-actions');
    actions.append(repository);
    if (project.demo) {
      const demo = externalLink(project.demo, text.openDemo);
      demo.append(icon('arrow-up-right'));
      actions.append(demo);
    }
    body.append(date, node('p', 'eyebrow', detail.tipo), heading,
      node('p', 'body-copy', detail.descricao),
      node('p', 'contribution', detail.contribuicao),
      renderTags(project.tecnologias), actions);
    article.append(figure, body);
    target.append(article);
  });
  observeReveals(target);
  // A âncora do projeto só existe depois da renderização.
  if (options.scrollToHash && location.hash) {
    document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  }
}
function renderExperiences() {
  const target = document.querySelector('#experience-list');
  if (!target || !experiences) return;
  const text = profile[language];
  target.replaceChildren();
  target.setAttribute('aria-busy', 'false');
  experiences.experiencias.forEach((item, index) => {
    const article = node('article', 'experience');
    article.dataset.reveal = '';
    article.style.setProperty('--delay', `${index * 100}ms`);
    const meta = node('div', 'experience-meta');
    const period = item.inicio
      ? `${monthYear(item.inicio)} ${text.to} ${item.fim ? monthYear(item.fim) : text.current}`
      : text.noDate;
    const place = node('strong', '', item.instituicao);
    place.prepend(icon('briefcase'));
    meta.append(place, node('span', '', period));
    const description = node('div');
    description.append(node('h2', '', item[language].cargo),
      node('p', '', item[language].descricao), node('p', '', item[language].detalhe));
    article.append(meta, description);
    target.append(article);
  });
  const courses = document.querySelector('#course-list');
  courses.replaceChildren();
  courses.setAttribute('aria-busy', 'false');
  experiences.formacaoComplementar.forEach(course => {
    const row = node('div', 'course');
    row.append(node('span', 'date', course.periodo), node('strong', '', course[language]),
      node('span', 'institution', course.instituicao));
    courses.append(row);
  });
  observeReveals(target);
}
/* ---------- Gráficos: matriz de tecnologias e linha do tempo ---------- */

const dot = (on) => {
  const mark = node('span', on ? 'dot' : 'dot is-off');
  mark.setAttribute('aria-hidden', 'true');
  return mark;
};
function renderStackMatrix() {
  const target = document.querySelector('#profile-skills');
  if (!target || !profile) return;
  const text = profile[language];
  target.setAttribute('aria-busy', 'false');
  if (!projects.length) {
    target.replaceChildren(renderTags(profile.tecnologias));
    return;
  }
  const ordered = [...projects].sort((a, b) => a.publicadoEm.localeCompare(b.publicadoEm));
  const used = (name) => ordered.filter(project => project.pilha.includes(name)).length;
  const rows = [...profile.tecnologias].sort((a, b) => used(b) - used(a));
  const table = node('table', 'matrix');
  table.append(node('caption', 'sr-only', text.matrixCaption));
  const head = node('tr');
  head.append(node('td'));
  ordered.forEach(project => {
    const th = node('th');
    th.scope = 'col';
    const link = node('a', 'text-link');
    link.setAttribute('aria-label', project.nome);
    link.append(node('span', 'name-long', project.nome), node('span', 'name-short', project.nomeCurto));
    link.href = `projetos.html#${project.id}`;
    link.dataset.internal = '';
    th.append(link);
    head.append(th);
  });
  const total = node('th', 'sr-only', '#');
  total.scope = 'col';
  head.append(total);
  const thead = node('thead');
  thead.append(head);
  table.append(thead);
  const body = node('tbody');
  rows.forEach(name => {
    const row = node('tr');
    const label = node('th', '', name);
    label.scope = 'row';
    row.append(label);
    ordered.forEach(project => {
      const on = project.pilha.includes(name);
      const cell = node('td');
      cell.append(dot(on), node('span', 'sr-only', on ? text.matrixUsed : text.matrixUnused));
      row.append(cell);
    });
    row.append(node('td', 'matrix-count', `${used(name)} ${text.of} ${ordered.length}`));
    body.append(row);
  });
  table.append(body);
  const card = node('div', 'chart-card');
  card.append(table);
  target.replaceChildren(card);
}

const percent = (value) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(value);
function renderLanguages() {
  const target = document.querySelector('#language-chart');
  if (!target || !profile || !languages) return;
  const text = profile[language];
  const total = languages.linguagens.reduce((sum, item) => sum + item.bytes, 0);
  const bar = node('div', 'lang-bar');
  bar.setAttribute('aria-hidden', 'true');
  const list = node('ul', 'lang-legend');
  languages.linguagens.forEach((item, index) => {
    const share = item.bytes / total * 100;
    const name = item.nome === 'Outras' ? text.langOther : item.nome;
    const label = `${name}: ${percent(share)}%${item.detalhe ? ` (${item.detalhe})` : ''}`;
    const segment = node('span', 'lang-segment');
    segment.style.flexGrow = share.toFixed(2);
    segment.style.setProperty('--series', `var(--lang-${index + 1})`);
    segment.title = label;
    bar.append(segment);
    const row = node('li', 'lang-row');
    row.style.setProperty('--series', `var(--lang-${index + 1})`);
    row.append(node('i', 'lang-swatch'), node('span', '', name), node('strong', '', `${percent(share)}%`));
    list.append(row);
  });
  const card = node('div', 'chart-card');
  card.append(bar, list);
  target.replaceChildren(card);
  target.setAttribute('aria-busy', 'false');
  const note = document.querySelector('#language-note');
  const date = new Intl.DateTimeFormat(locale(), { dateStyle: 'medium', timeZone: 'UTC' })
    .format(new Date(`${languages.atualizadoEm}T12:00:00Z`));
  note.textContent = text.langNote.replace('{n}', languages.repositorios).replace('{date}', date);
}

function renderLanguage() {
  const text = profile[language];
  document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const translated = text[element.dataset.i18n];
    if (translated !== undefined) element.textContent = translated;
  });
  document.querySelectorAll('[data-i18n-label]').forEach(element => {
    element.setAttribute('aria-label', text[element.dataset.i18nLabel]);
  });
  document.querySelectorAll('[data-placeholder]').forEach(element => {
    element.placeholder = text[element.dataset.placeholder];
  });
  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  const titleKey = { about: 'aboutTitleDocument', projects: 'projectsTitleDocument',
    experience: 'experienceTitleDocument', contact: 'contactTitleDocument',
    thanks: 'thanksTitleDocument', legal: 'privacyTitleDocument',
    notfound: 'notFoundTitleDocument' }[page];
  document.title = `${text[titleKey]} · ${profile.nome}`;
  updateMenuLabel();
  renderStackMatrix();
  prepareTagline();
  renderProjects();
  renderExperiences();
  renderLanguages();
  document.querySelectorAll('.field-error:not([hidden])').forEach(error => {
    error.textContent = text[error.dataset.error];
  });
  // Mantém o idioma ao compartilhar ou navegar para outra página.
  document.querySelectorAll('a[data-internal]').forEach(link => {
    const url = new URL(link.getAttribute('href'), location.href);
    url.searchParams.set('lang', language);
    link.href = url.href;
  });
  const next = document.querySelector('[name="_next"]');
  if (next) next.value = new URL(`obrigado.html?lang=${language}`, location.href).href;
}

/* ---------- Menu em tela cheia ---------- */

const menuButton = document.querySelector('.menu-button');
const overlay = document.querySelector('.overlay');
function updateMenuLabel() {
  if (!menuButton || !profile) return;
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-label', profile[language][open ? 'menuClose' : 'menu']);
}
function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  overlay.classList.toggle('is-open', open);
  overlay.inert = !open;
  document.body.classList.toggle('menu-open', open);
  updateMenuLabel();
  if (open) overlay.querySelector('a')?.focus();
}
function initMenu() {
  menuButton.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  overlay.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });
  matchMedia('(min-width: 861px)').addEventListener('change', event => {
    if (event.matches) setMenu(false);
  });
}

/* ---------- Formulário: validação no navegador, com mensagens específicas ---------- */

function initForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;
  const submit = form.querySelector('[type="submit"]');
  const label = submit.querySelector('span');
  const fields = [...form.querySelectorAll('input[name="name"], input[name="email"], textarea')];
  const rules = {
    name: value => value.trim().length >= 2,
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()),
    message: value => value.trim().length >= 10
  };
  const check = field => {
    const valid = rules[field.name](field.value);
    const error = form.querySelector(`#${field.id}-erro`);
    field.setAttribute('aria-invalid', String(!valid));
    error.hidden = valid;
    error.textContent = valid ? '' : profile[language][error.dataset.error];
    return valid;
  };
  fields.forEach(field => field.addEventListener('input', () => {
    if (field.hasAttribute('aria-invalid')) check(field);
  }));
  form.addEventListener('submit', event => {
    const invalid = fields.filter(field => !check(field));
    if (invalid.length) {
      event.preventDefault();
      invalid[0].focus();
      return;
    }
    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    label.textContent = profile[language].sending;
  });
  // Ao voltar pelo histórico, o botão não pode ficar travado.
  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    submit.disabled = false;
    submit.removeAttribute('aria-busy');
    label.textContent = profile[language].formSubmit;
  });
}

/* ---------- Erro e inicialização ---------- */

function showError(error) {
  console.error(error);
  const box = document.querySelector('#content-status');
  document.querySelectorAll('[aria-busy="true"]').forEach(element => {
    element.setAttribute('aria-busy', 'false');
    element.querySelectorAll('[data-skeleton]').forEach(item => item.remove());
  });
  if (!box) return;
  const text = profile?.[language];
  const message = text ? text.loadError
    : 'Não foi possível carregar o conteúdo. Tente de novo ou escreva para christiano.gonara@gmail.com.';
  const retry = node('button', 'button', text ? text.retry : 'Tentar de novo');
  retry.type = 'button';
  retry.addEventListener('click', () => location.reload());
  box.replaceChildren(icon('warning'), node('p', '', message), retry);
  box.hidden = false;
}
/* ---------- Copiar email ---------- */

// Cada sistema abre um app de email diferente, então copiar o endereço é o caminho universal.
async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const field = node('textarea');
    field.value = value;
    field.style.cssText = 'position:fixed;opacity:0';
    document.body.append(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  }
}
function initCopy() {
  document.querySelectorAll('[data-copy-email]').forEach(button => {
    const label = button.querySelector('span');
    label.setAttribute('aria-live', 'polite');
    let timer;
    button.addEventListener('click', async () => {
      if (!(await copyText(button.dataset.copyEmail))) return;
      button.dataset.copied = '';
      label.textContent = profile[language].copied;
      clearTimeout(timer);
      timer = setTimeout(() => {
        delete button.dataset.copied;
        label.textContent = profile[language].copyEmail;
      }, 2000);
    });
  });
}
async function init() {
  if (menuButton && overlay) initMenu();
  profile = await loadJSON('perfil.json');
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => {
      language = button.dataset.language;
      try { localStorage.setItem('portfolio-language', language); } catch { /* Idioma funciona sem armazenamento. */ }
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      history.replaceState(null, '', url);
      renderLanguage();
    });
  });
  initForm();
  initCopy();
  // Gráficos usam os projetos; se falhar, a página segue sem eles.
  if (page === 'about') {
    projects = await loadJSON('projetos.json').catch(() => []);
    languages = await loadJSON('linguagens.json').catch(() => undefined);
  }
  renderLanguage();
  observeReveals();
  if (page === 'projects') {
    projects = await loadJSON('projetos.json');
    document.querySelectorAll('[data-filter]').forEach(button => {
      button.addEventListener('click', () => {
        category = button.dataset.filter;
        renderProjects();
      });
    });
    renderProjects({ scrollToHash: true });
  }
  if (page === 'experience') {
    experiences = await loadJSON('experiencias.json');
    renderExperiences();
  }
}
init().catch(showError);
