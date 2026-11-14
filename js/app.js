// Interações do portfólio: desafio de xadrez (página inicial) e validação do formulário (contato).

const tabuleiro = document.querySelector('[data-xadrez]');
if (tabuleiro) iniciarXadrez(tabuleiro);

const formulario = document.querySelector('[data-formulario]');
if (formulario) iniciarFormulario(formulario);

function iniciarXadrez(raiz) {
  const casasEl = raiz.querySelector('.tabuleiro');
  const msgEl = raiz.querySelector('.xadrez-msg');
  const recomecar = raiz.querySelector('[data-recomecar]');
  const DICA = 'Dica: olha para a última fileira.';
  const branca = { K: '♔︎', R: '♖︎', P: '♙︎' };
  const preta = { K: '♚︎', P: '♟︎' };
  const inicial = {
    g1: ['b', branca.K, 'rei branco', 'K'], a1: ['b', branca.R, 'torre branca', 'R'],
    f2: ['b', branca.P, 'peão branco', 'P'], g2: ['b', branca.P, 'peão branco', 'P'], h2: ['b', branca.P, 'peão branco', 'P'],
    g8: ['p', preta.K, 'rei preto', 'K'], f7: ['p', preta.P, 'peão preto', 'P'], g7: ['p', preta.P, 'peão preto', 'P'], h7: ['p', preta.P, 'peão preto', 'P'],
  };
  let estado;

  function reiniciar() {
    estado = { pos: { ...inicial }, sel: null, resolvido: false };
    mensagem(DICA, '');
  }

  function mensagem(texto, tipo) {
    msgEl.textContent = texto;
    msgEl.className = 'xadrez-msg' + (tipo ? ' ' + tipo : '');
  }

  function desenhar() {
    casasEl.textContent = '';
    const alvos = estado.sel ? movimentos(estado.sel, estado.pos) : [];
    for (let r = 8; r >= 1; r--) {
      for (let i = 0; i < 8; i++) {
        const nome = 'abcdefgh'[i] + r;
        const peca = estado.pos[nome];
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'casa' + ((i + r) % 2 === 1 ? ' escura' : '');
        if (estado.sel === nome) botao.classList.add('selecionada');
        if (estado.resolvido && nome === 'a8') botao.classList.add('vitoria');
        if (estado.resolvido && nome === 'g8') botao.classList.add('derrota');
        botao.textContent = peca ? peca[1] : '';
        const alvo = alvos.includes(nome);
        if (alvo) botao.classList.add(peca ? 'captura' : 'alvo');
        botao.setAttribute('aria-label', nome + (peca ? ', ' + peca[2] : ', vazia') + (alvo ? ', pode mover' : ''));
        if (estado.sel === nome) botao.setAttribute('aria-pressed', 'true');
        botao.addEventListener('click', () => escolher(nome));
        casasEl.appendChild(botao);
      }
    }
  }

  function escolher(nome) {
    if (estado.resolvido) return;
    const peca = estado.pos[nome];
    const minha = peca && peca[0] === 'b';
    if (!estado.sel) {
      if (minha) { estado.sel = nome; mensagem('Agora escolhe a casa.', ''); }
      else mensagem('Escolhe uma peça branca primeiro.', 'erro');
    } else if (nome === estado.sel) {
      estado.sel = null; mensagem(DICA, '');
    } else if (minha) {
      estado.sel = nome; mensagem('Agora escolhe a casa.', '');
    } else if (!movimentos(estado.sel, estado.pos).includes(nome)) {
      mensagem('Essa peça não anda para lá. Olha as bolinhas.', 'erro');
    } else if (estado.sel === 'a1' && nome === 'a8') {
      estado.pos.a8 = estado.pos.a1;
      delete estado.pos.a1;
      estado.sel = null;
      estado.resolvido = true;
      mensagem('Xeque-mate! Torre em a8: o rei preto ficou preso atrás dos próprios peões.', 'ok');
    } else {
      estado.sel = null;
      mensagem('Esse não dá mate. Tenta outro lance.', 'erro');
    }
    desenhar();
    const foco = casasEl.querySelector(`[aria-label^="${nome}"]`);
    if (foco) foco.focus();
  }

  recomecar.addEventListener('click', () => { reiniciar(); desenhar(); });
  reiniciar();
  desenhar();
}

// Casas para onde a peça pode ir (torre, rei e peão bastam para este desafio).
function movimentos(sq, pos) {
const p = pos[sq];
if (!p) return [];
const cols = 'abcdefgh';
const f = cols.indexOf(sq[0]);
const r = Number(sq[1]);
const dentro = (x, y) => x >= 0 && x < 8 && y >= 1 && y <= 8;
const nome = (x, y) => cols[x] + y;
const res = [];
const tenta = (x, y) => {
if (!dentro(x, y)) return false;
const q = pos[nome(x, y)];
if (!q) { res.push(nome(x, y)); return true; }
if (q[0] !== p[0]) res.push(nome(x, y));
return false;
};
if (p[3] === 'R') {
[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { let x = f + dx, y = r + dy; while (tenta(x, y)) { x += dx; y += dy; } });
} else if (p[3] === 'K') {
for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (dx || dy) tenta(f + dx, r + dy);
} else if (p[3] === 'P') {
if (dentro(f, r + 1) && !pos[nome(f, r + 1)]) {
res.push(nome(f, r + 1));
if (r === 2 && !pos[nome(f, 4)]) res.push(nome(f, 4));
}
[-1, 1].forEach((dx) => { const q = dentro(f + dx, r + 1) && pos[nome(f + dx, r + 1)]; if (q && q[0] !== p[0]) res.push(nome(f + dx, r + 1)); });
}
return res;
}

function iniciarFormulario(form) {
  const regras = [
    { campo: form.elements.name, teste: (v) => v.trim().length >= 2, texto: 'Escreve seu nome.' },
    { campo: form.elements.email, teste: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), texto: 'Confere o email, parece que falta alguma coisa.' },
    { campo: form.elements.message, teste: (v) => v.trim().length >= 10, texto: 'A mensagem precisa de pelo menos 10 caracteres.' },
  ];

  function validar(regra) {
    const ok = regra.teste(regra.campo.value);
    const erro = document.getElementById(regra.campo.getAttribute('aria-describedby'));
    regra.campo.setAttribute('aria-invalid', ok ? 'false' : 'true');
    erro.textContent = ok ? '' : regra.texto;
    erro.hidden = ok;
    return ok;
  }

  regras.forEach((regra) => {
    regra.campo.addEventListener('blur', () => { if (regra.campo.value) validar(regra); });
  });

  form.addEventListener('submit', (evento) => {
    const invalidas = regras.filter((regra) => !validar(regra));
    if (invalidas.length) {
      evento.preventDefault();
      invalidas[0].campo.focus();
    }
  });
}
