// A raiz do GitHub Pages mantém apenas o ponto de entrada.
const destination = new URL('html/sobre.html', location.href);
destination.search = location.search;
destination.hash = location.hash;
location.replace(destination.href);
