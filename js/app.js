// Conteúdo público em JSON; não há backend nem credenciais neste projeto.
const root = new URL('../', import.meta.url);
const page = document.body.dataset.page;
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
let experiences;
let category = 'all';
const locale = () => language === 'pt' ? 'pt-BR' : 'en-US';
const monthYear = (date) => new Intl.DateTimeFormat(locale(), {
  month: 'short', year: 'numeric', timeZone: 'UTC'
}).format(new Date(`${date.slice(0, 7)}-01T12:00:00Z`));

function renderTags(values) {
  const list = node('ul', 'skills');
  values.forEach(value => list.append(node('li', 'skill', value)));
  return list;
}
function renderProjects() {
  const target = document.querySelector('#project-timeline');
  if (!target) return;
  const text = profile[language];
  const visible = [...projects].sort((a, b) => a.publicadoEm.localeCompare(b.publicadoEm))
    .filter(project => category === 'all' || project.categoria === category);
  target.replaceChildren();
  document.querySelector('#project-count').textContent = `${visible.length} ${text.projectCount}`;
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === category));
  });
  if (!visible.length) {
    target.append(node('p', 'status-message', text.noProjects));
    return;
  }
  visible.forEach(project => {
    const detail = project[language];
    const article = node('article', 'project');
    const date = node('div', 'project-date');
    const time = node('time', '', monthYear(project.publicadoEm));
    time.dateTime = project.publicadoEm;
    date.append(time, node('span', '', text.published));
    const content = node('div', 'project-content');
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
    imageAction.append(icon('arrow'));
    imageLink.append(image, imageAction);
    figure.append(imageLink, node('figcaption', '', detail.legenda));
    const description = node('div');
    const heading = node('h2', '', project.nome);
    heading.id = project.id;
    article.setAttribute('aria-labelledby', project.id);
    const repository = externalLink(project.repositorio, text.repository);
    repository.prepend(icon('github'));
    repository.append(icon('arrow'));
    const actions = node('div', 'project-actions');
    actions.append(repository);
    if (project.demo) {
      const demo = externalLink(project.demo, text.openDemo);
      demo.append(icon('arrow'));
      actions.append(demo);
    }
    description.append(node('p', 'eyebrow', detail.tipo), heading,
      node('p', 'body-copy', detail.descricao),
      node('p', 'contribution', detail.contribuicao),
      renderTags(project.tecnologias), actions);
    content.append(figure, description);
    article.append(date, content);
    target.append(article);
  });
}
function renderExperiences() {
  const target = document.querySelector('#experience-list');
  if (!target || !experiences) return;
  const text = profile[language];
  target.replaceChildren();
  experiences.experiencias.forEach(item => {
    const article = node('article', 'experience');
    const meta = node('div', 'experience-meta');
    const period = item.inicio
      ? `${monthYear(item.inicio)} — ${item.fim ? monthYear(item.fim) : text.current}`
      : text.noDate;
    meta.append(node('strong', '', item.instituicao), node('span', '', period));
    const description = node('div');
    description.append(node('h2', '', item[language].cargo),
      node('p', '', item[language].descricao), node('p', '', item[language].detalhe));
    article.append(meta, description);
    target.append(article);
  });
  const courses = document.querySelector('#course-list');
  courses.replaceChildren();
  experiences.formacaoComplementar.forEach(course => {
    const row = node('div', 'course');
    row.append(node('span', 'date', course.periodo), node('strong', '', course[language]),
      node('span', 'institution', course.instituicao));
    courses.append(row);
  });
}
function renderLanguage() {
  const text = profile[language];
  document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const translated = text[element.dataset.i18n];
    if (translated !== undefined) element.textContent = translated;
  });
  document.querySelectorAll('[data-placeholder]').forEach(element => {
    element.placeholder = text[element.dataset.placeholder];
  });
  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  const titleKey = { about: 'aboutTitleDocument', projects: 'projectsTitleDocument',
    experience: 'experienceTitleDocument', contact: 'contactTitleDocument', thanks: 'thanksTitleDocument' }[page];
  document.title = `${text[titleKey]} · ${profile.nome}`;
  const menu = document.querySelector('.menu-button');
  menu.setAttribute('aria-label', text.menu);
  const skills = document.querySelector('#profile-skills');
  if (skills) skills.replaceChildren(renderTags(profile.tecnologias));
  renderProjects();
  renderExperiences();
  // Mantém o idioma ao compartilhar ou navegar para outra página.
  document.querySelectorAll('a[data-internal]').forEach(link => {
    const url = new URL(link.getAttribute('href'), location.href);
    url.searchParams.set('lang', language);
    link.href = url.href;
  });
  const next = document.querySelector('[name="_next"]');
  if (next) next.value = new URL(`obrigado.html?lang=${language}`, location.href).href;
}
function showError(error) {
  console.error(error);
  const message = document.querySelector('#content-status');
  if (message) {
    message.hidden = false;
    message.textContent = profile ? profile[language].loadError
      : 'Não foi possível carregar o conteúdo. Atualize a página ou escreva para christiano.gonara@gmail.com.';
  }
}
async function init() {
  const menu = document.querySelector('.menu-button');
  menu.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(expanded));
    document.querySelector('.nav').classList.toggle('is-open', expanded);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      menu.setAttribute('aria-expanded', 'false');
      document.querySelector('.nav').classList.remove('is-open');
      menu.focus();
    }
  });
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
  renderLanguage();
  if (page === 'projects') {
    projects = await loadJSON('projetos.json');
    document.querySelectorAll('[data-filter]').forEach(button => {
      button.addEventListener('click', () => {
        category = button.dataset.filter;
        renderProjects();
      });
    });
    renderProjects();
  }
  if (page === 'experience') {
    experiences = await loadJSON('experiencias.json');
    renderExperiences();
  }
  const status = document.querySelector('#content-status');
  if (status) status.hidden = true;
}
init().catch(showError);
