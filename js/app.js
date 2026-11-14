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
    g1: ['b', branca.K, 'rei branco'], a1: ['b', branca.R, 'torre branca'],
    f2: ['b', branca.P, 'peão branco'], g2: ['b', branca.P, 'peão branco'], h2: ['b', branca.P, 'peão branco'],
    g8: ['p', preta.K, 'rei preto'], f7: ['p', preta.P, 'peão preto'], g7: ['p', preta.P, 'peão preto'], h7: ['p', preta.P, 'peão preto'],
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
        botao.setAttribute('aria-label', nome + (peca ? ', ' + peca[2] : ', vazia'));
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
