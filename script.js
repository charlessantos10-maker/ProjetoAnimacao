
/* =========================================
   BANCO DE DADOS LOCAL DO TICP
========================================= */

const DB_NAME = "TICP_Projetos";
const DB_VERSION = 1;

let banco;

const requisicaoDB = indexedDB.open(DB_NAME, DB_VERSION);

requisicaoDB.onupgradeneeded = function(event) {

    banco = event.target.result;

    ["artes", "animacoes", "propostas", "avaliacoes"].forEach(nome => {

        if (!banco.objectStoreNames.contains(nome)) {
            banco.createObjectStore(nome, {
                keyPath: "id",
                autoIncrement: true
            });
        }

    });

};

requisicaoDB.onsuccess = function(event) {

    banco = event.target.result;

    carregarArtes();
    carregarAnimacoes();
    carregarPropostas();

};

requisicaoDB.onerror = function() {
    alert("Não foi possível abrir o armazenamento do TICP.");
};


function guardarDados(tabela, dados) {

    return new Promise((resolve, reject) => {

        const transacao = banco.transaction(tabela, "readwrite");

        const operacao = transacao.objectStore(tabela).put(dados);

        operacao.onsuccess = () => resolve(operacao.result);
        operacao.onerror = () => reject(operacao.error);

    });

}


function obterDados(tabela) {

    return new Promise((resolve, reject) => {

        const transacao = banco.transaction(tabela, "readonly");

        const operacao = transacao.objectStore(tabela).getAll();

        operacao.onsuccess = () => resolve(operacao.result);
        operacao.onerror = () => reject(operacao.error);

    });

}


/* =========================================
   ABRIR E FECHAR PASTAS
========================================= */

const nomesPastas = {

    criar: "Criar Artes e Ilustrações",
    animacoes: "Animações",
    divulgar: "Divulgar",
    notificacoes: "Notificações e Verificações"

};


function abrirPasta(nome) {

    document.getElementById("objetivos").hidden = true;

    document.getElementById("area-interna").hidden = false;

    document.getElementById("nome-pasta").textContent =
        nomesPastas[nome];

    document.querySelectorAll(".conteudo-pasta").forEach(pasta => {
        pasta.hidden = true;
    });

    document.getElementById("pasta-" + nome).hidden = false;

    document.getElementById("area-interna").scrollIntoView();

}


function voltarPastas() {

    pararAnimacao();

    document.getElementById("area-interna").hidden = true;

    document.getElementById("objetivos").hidden = false;

    document.getElementById("objetivos").scrollIntoView();

}


/* =========================================
   PASTA 1 - CRIAR ARTES
========================================= */

const tela = document.getElementById("tela-desenho");
const pincel = tela.getContext("2d");

let desenhando = false;
let ferramenta = "pincel";
let ultimoPonto = null;

pincel.fillStyle = "#ffffff";
pincel.fillRect(0, 0, tela.width, tela.height);


function definirFerramenta(tipo) {
    ferramenta = tipo;
}


function obterPonto(evento, canvas) {

    const retangulo = canvas.getBoundingClientRect();

    return {
        x: (evento.clientX - retangulo.left) *
            canvas.width / retangulo.width,

        y: (evento.clientY - retangulo.top) *
            canvas.height / retangulo.height
    };

}


function iniciarDesenho(evento) {

    desenhando = true;

    ultimoPonto = obterPonto(evento, tela);

    tela.setPointerCapture(evento.pointerId);

    pincel.beginPath();
    pincel.arc(
        ultimoPonto.x,
        ultimoPonto.y,
        Number(document.getElementById("tamanho-pincel").value) / 2,
        0,
        Math.PI * 2
    );

    pincel.fillStyle = ferramenta === "borracha"
        ? "#ffffff"
        : document.getElementById("cor-pincel").value;

    pincel.fill();

}


function continuarDesenho(evento) {

    if (!desenhando) return;

    const ponto = obterPonto(evento, tela);

    pincel.beginPath();

    pincel.moveTo(ultimoPonto.x, ultimoPonto.y);
    pincel.lineTo(ponto.x, ponto.y);

    pincel.lineWidth =
        Number(document.getElementById("tamanho-pincel").value);

    pincel.lineCap = "round";
    pincel.lineJoin = "round";

    pincel.strokeStyle = ferramenta === "borracha"
        ? "#ffffff"
        : document.getElementById("cor-pincel").value;

    pincel.stroke();

    ultimoPonto = ponto;

}


function finalizarDesenho() {
    desenhando = false;
    ultimoPonto = null;
}


tela.addEventListener("pointerdown", iniciarDesenho);
tela.addEventListener("pointermove", continuarDesenho);
tela.addEventListener("pointerup", finalizarDesenho);
tela.addEventListener("pointercancel", finalizarDesenho);


function limparDesenho() {

    if (!confirm("Deseja limpar o desenho atual?")) return;

    pincel.fillStyle = "#ffffff";
    pincel.fillRect(0, 0, tela.width, tela.height);

}


async function salvarDesenho() {

    const nome = prompt("Qual será o nome desta criação?");

    if (!nome || !nome.trim()) return;

    const dados = {

        nome: nome.trim(),
        imagem: tela.toDataURL("image/png"),
        data: new Date().toLocaleString("pt-BR")

    };

    await guardarDados("artes", dados);

    carregarArtes();

    alert("Sua criação foi salva na pasta Criar Artes e Ilustrações!");

}


async function carregarArtes() {

    if (!banco) return;

    const artes = await obterDados("artes");

    const lista = document.getElementById("lista-artes");

    lista.innerHTML = "";

    artes.forEach(arte => {

        const item = document.createElement("div");
        item.className = "item-salvo";

        const imagem = document.createElement("img");
        imagem.src = arte.imagem;

        const nome = document.createElement("strong");
        nome.textContent = arte.nome;

        const baixar = document.createElement("button");
        baixar.textContent = "Baixar";

        baixar.onclick = () => {

            const link = document.createElement("a");

            link.href = arte.imagem;
            link.download = arte.nome + ".png";
            link.click();

        };

        item.append(imagem, nome, baixar);

        lista.appendChild(item);

    });

}


/* =========================================
   PASTA 2 - ANIMAÇÕES
========================================= */

const telaAnimacao = document.getElementById("tela-animacao");
const pincelAnimacao = telaAnimacao.getContext("2d");

let quadros = [];
let quadroAtual = 0;
let ferramentaAnimacao = "pincel";
let desenhandoAnimacao = false;
let pontoAnimacao = null;
let intervaloAnimacao = null;

function fundoBranco() {

    pincelAnimacao.fillStyle = "#ffffff";

    pincelAnimacao.fillRect(
        0, 0, telaAnimacao.width, telaAnimacao.height
    );

}


function adicionarQuadro() {

    if (quadros.length) {
        quadros[quadroAtual] =
            telaAnimacao.toDataURL("image/png");
    }

    quadros.push(null);

    quadroAtual = quadros.length - 1;

    fundoBranco();

    atualizarQuadros();

}


function definirFerramentaAnimacao(tipo) {
    ferramentaAnimacao = tipo;
}


function iniciarDesenhoAnimacao(evento) {

    pararAnimacao();

    desenhandoAnimacao = true;

    pontoAnimacao = obterPonto(evento, telaAnimacao);

    telaAnimacao.setPointerCapture(evento.pointerId);

    pincelAnimacao.beginPath();

    pincelAnimacao.arc(
        pontoAnimacao.x,
        pontoAnimacao.y,
        3,
        0,
        Math.PI * 2
    );

    pincelAnimacao.fillStyle =
        ferramentaAnimacao === "borracha"
            ? "#ffffff"
            : document.getElementById("cor-animacao").value;

    pincelAnimacao.fill();

}


function continuarDesenhoAnimacao(evento) {

    if (!desenhandoAnimacao) return;

    const ponto = obterPonto(evento, telaAnimacao);

    pincelAnimacao.beginPath();

    pincelAnimacao.moveTo(pontoAnimacao.x, pontoAnimacao.y);
    pincelAnimacao.lineTo(ponto.x, ponto.y);

    pincelAnimacao.lineWidth =
        Number(document.getElementById("tamanho-animacao").value);

    pincelAnimacao.lineCap = "round";
    pincelAnimacao.lineJoin = "round";

    pincelAnimacao.strokeStyle =
        ferramentaAnimacao === "borracha"
            ? "#ffffff"
            : document.getElementById("cor-animacao").value;

    pincelAnimacao.stroke();

    pontoAnimacao = ponto;

}


function finalizarDesenhoAnimacao() {

    desenhandoAnimacao = false;
    pontoAnimacao = null;

    if (quadros.length) {
        quadros[quadroAtual] =
            telaAnimacao.toDataURL("image/png");

        atualizarQuadros();
    }

}


telaAnimacao.addEventListener("pointerdown", iniciarDesenhoAnimacao);
telaAnimacao.addEventListener("pointermove", continuarDesenhoAnimacao);
telaAnimacao.addEventListener("pointerup", finalizarDesenhoAnimacao);
telaAnimacao.addEventListener("pointercancel", finalizarDesenhoAnimacao);


function atualizarQuadros() {

    const lista = document.getElementById("lista-quadros");

    lista.innerHTML = "";

    quadros.forEach((imagem, indice) => {

        const botao = document.createElement("button");

        botao.className = "quadro-miniatura";

        if (indice === quadroAtual) {
            botao.classList.add("selecionado");
        }

        const miniatura = document.createElement("img");

        miniatura.src = imagem || "";

        if (!imagem) {
            miniatura.style.height = "65px";
            miniatura.style.background = "#fff";
        }

        const titulo = document.createElement("span");

        titulo.textContent = "Quadro " + (indice + 1);

        botao.append(miniatura, titulo);

        botao.onclick = () => selecionarQuadro(indice);

        lista.appendChild(botao);

    });

}


function selecionarQuadro(indice) {

    pararAnimacao();

    if (quadros.length) {
        quadros[quadroAtual] =
            telaAnimacao.toDataURL("image/png");
    }

    quadroAtual = indice;

    fundoBranco();

    if (quadros[indice]) {

        const imagem = new Image();

        imagem.onload = () => {
            pincelAnimacao.drawImage(imagem, 0, 0);
        };

        imagem.src = quadros[indice];

    }

    atualizarQuadros();

}


function limparQuadro() {

    if (!confirm("Deseja apagar o conteúdo deste quadro?")) return;

    fundoBranco();

    quadros[quadroAtual] =
        telaAnimacao.toDataURL("image/png");

    atualizarQuadros();

}


function reproduzirAnimacao() {

    pararAnimacao();

    if (!quadros.length) {
        alert("Adicione pelo menos um quadro.");
        return;
    }

    quadros[quadroAtual] =
        telaAnimacao.toDataURL("image/png");

    let indice = 0;

    intervaloAnimacao = setInterval(() => {

        const imagem = new Image();

        imagem.onload = () => {

            fundoBranco();

            pincelAnimacao.drawImage(imagem, 0, 0);

        };

        imagem.src = quadros[indice];

        indice = (indice + 1) % quadros.length;

    }, 200);

}


function pararAnimacao() {

    if (intervaloAnimacao) {
        clearInterval(intervaloAnimacao);
        intervaloAnimacao = null;
    }

}


async function salvarAnimacao() {

    pararAnimacao();

    if (!quadros.length) {
        alert("Crie pelo menos um quadro.");
        return;
    }

    quadros[quadroAtual] =
        telaAnimacao.toDataURL("image/png");

    const nome = prompt("Nome da animação:");

    if (!nome || !nome.trim()) return;

    await guardarDados("animacoes", {

        nome: nome.trim(),
        quadros: [...quadros],
        data: new Date().toLocaleString("pt-BR")

    });

    carregarAnimacoes();

    alert("Animação salva com sucesso!");

}


async function carregarAnimacoes() {

    if (!banco) return;

    const animacoes = await obterDados("animacoes");

    const lista = document.getElementById("lista-animacoes");

    lista.innerHTML = "";

    animacoes.forEach(animacao => {

        const item = document.createElement("div");
        item.className = "item-salvo";

        const nome = document.createElement("strong");
        nome.textContent = animacao.nome +
            " (" + animacao.quadros.length + " quadros)";

        const abrir = document.createElement("button");

        abrir.textContent = "Abrir animação";

        abrir.onclick = () => {

            pararAnimacao();

            quadros = [...animacao.quadros];

            quadroAtual = 0;

            selecionarQuadro(0);

            atualizarQuadros();

            document.getElementById("pasta-animacoes")
                .scrollIntoView();

        };

        item.append(nome, abrir);

        lista.appendChild(item);

    });

}


/* =========================================
   PASTA 3 - DIVULGAR
========================================= */

let redeAtual = "";


function selecionarRede(rede, botao) {

    redeAtual = rede;

    document.getElementById("rede-selecionada").value = rede;

    document.querySelectorAll(".rede-card").forEach(card => {
        card.classList.remove("selecionada");
    });

    botao.classList.add("selecionada");

}


function prepararPublicacao() {

    const descricao =
        document.getElementById("descricao-publicacao").value;

    const arquivo =
        document.getElementById("arquivo-publicacao").files[0];

    const mensagem =
        document.getElementById("mensagem-publicacao");

    if (!redeAtual) {
        alert("Escolha primeiro uma rede social.");
        return;
    }

    if (!arquivo) {
        alert("Selecione uma imagem ou vídeo.");
        return;
    }

    if (!descricao.trim()) {
        alert("Escreva uma descrição para a publicação.");
        return;
    }

    const plataformas = {

        Instagram: "https://www.instagram.com/",
        Facebook: "https://www.facebook.com/",
        YouTube: "https://studio.youtube.com/",
        X: "https://x.com/intent/post"

    };

    const link = document.createElement("a");

    link.href = URL.createObjectURL(arquivo);
    link.download = arquivo.name;

    link.click();

    const texto = descricao + "\n\nArquivo: " + arquivo.name;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(texto).catch(() => {});
    }

    window.open(plataformas[redeAtual], "_blank", "noopener");

    mensagem.textContent =
        "Arquivo preparado! A plataforma foi aberta. " +
        "Conclua a publicação manualmente.";

}


/* =========================================
   PASTA 4 - NOTIFICAÇÕES
========================================= */

let propostaAtual = null;


function mostrarFormularioProposta() {

    const formulario =
        document.getElementById("formulario-proposta");

    formulario.hidden = !formulario.hidden;

}


async function registrarProposta() {

    const nome =
        document.getElementById("empresa-nome").value.trim();

    const servico =
        document.getElementById("empresa-servico").value.trim();

    const valor =
        document.getElementById("empresa-valor").value.trim();

    const descricao =
        document.getElementById("empresa-descricao").value.trim();

    const site =
        document.getElementById("empresa-site").value.trim();

    if (!nome || !servico || !descricao) {
        alert("Preencha o nome da empresa, serviço e descrição.");
        return;
    }

    if (site) {

        try {
            const url = new URL(site);

            if (!["http:", "https:"].includes(url.protocol)) {
                throw new Error("Endereço inválido");
            }

        } catch {
            alert("Informe um endereço de site válido.");
            return;
        }

    }

    await guardarDados("propostas", {

        nome,
        servico,
        valor,
        descricao,
        site,
        decisao: "Pendente",
        data: new Date().toLocaleString("pt-BR")

    });

    document.getElementById("empresa-nome").value = "";
    document.getElementById("empresa-servico").value = "";
    document.getElementById("empresa-valor").value = "";
    document.getElementById("empresa-descricao").value = "";
    document.getElementById("empresa-site").value = "";

    document.getElementById("formulario-proposta").hidden = true;

    carregarPropostas();

    alert("Proposta registrada!");

}


async function carregarPropostas() {

    if (!banco) return;

    const propostas = await obterDados("propostas");

    const lista = document.getElementById("lista-propostas");

    lista.innerHTML = "";

    if (!propostas.length) {

        lista.innerHTML =
            '<p class="aviso-vazio">Nenhuma proposta registrada.</p>';

        return;

    }

    propostas.forEach(proposta => {

        const card = document.createElement("div");

        card.className = "proposta-card";

        const titulo = document.createElement("h4");
        titulo.textContent = proposta.nome;

        const descricao = document.createElement("p");

        descricao.textContent =
            proposta.servico + " | " + proposta.valor;

        const status = document.createElement("p");

        status.textContent = "Situação: " + proposta.decisao;

        const botao = document.createElement("button");

        botao.textContent = "Investigar empresa";

        botao.onclick = () => selecionarProposta(proposta);

        card.append(titulo, descricao, status, botao);

        lista.appendChild(card);

    });

}


function selecionarProposta(proposta) {

    propostaAtual = proposta;

    document.getElementById("verifica-nome").value =
        proposta.nome;

    document.getElementById("verifica-site").value =
        proposta.site;

    carregarAvaliacao(proposta.id);

    document.querySelector(".painel-verificacao").scrollIntoView({
        behavior: "smooth"
    });

}


async function carregarAvaliacao(id) {

    const avaliacoes = await obterDados("avaliacoes");

    const avaliacao = avaliacoes.find(item =>
        item.propostaId === id
    );

    document.getElementById("verifica-reputacao").value =
        avaliacao?.reputacao || "";

    document.getElementById("verifica-publico").value =
        avaliacao?.publico || "";

    document.getElementById("verifica-compatibilidade").value =
        avaliacao?.compatibilidade || "";

    document.getElementById("verifica-direitos").value =
        avaliacao?.direitos || "";

    document.getElementById("resultado-verificacao").textContent =
        avaliacao?.decisao
            ? "Última decisão: " + avaliacao.decisao
            : "";

}


async function salvarVerificacao() {

    if (!propostaAtual) {
        alert("Selecione primeiro uma proposta.");
        return;
    }

    const avaliacoes = await obterDados("avaliacoes");

    const existente = avaliacoes.find(item =>
        item.propostaId === propostaAtual.id
    );

    const avaliacao = {

        propostaId: propostaAtual.id,

        reputacao:
            document.getElementById("verifica-reputacao").value,

        publico:
            document.getElementById("verifica-publico").value,

        compatibilidade:
            document.getElementById("verifica-compatibilidade").value,

        direitos:
            document.getElementById("verifica-direitos").value

    };

    if (existente) {
        avaliacao.id = existente.id;
    }

    await guardarDados("avaliacoes", avaliacao);

    alert("Avaliação salva com sucesso!");

}


async function decidirProposta(decisao) {

    if (!propostaAtual) {
        alert("Selecione uma proposta primeiro.");
        return;
    }

    const confirmacao = confirm(
        "Deseja realmente registrar a decisão: " + decisao + "?"
    );

    if (!confirmacao) return;

    const avaliacoes = await obterDados("avaliacoes");

    const existente = avaliacoes.find(item =>
        item.propostaId === propostaAtual.id
    );

    const avaliacao = {

        ...(existente || {}),

        propostaId: propostaAtual.id,

        reputacao:
            document.getElementById("verifica-reputacao").value,

        publico:
            document.getElementById("verifica-publico").value,

        compatibilidade:
            document.getElementById("verifica-compatibilidade").value,

        direitos:
            document.getElementById("verifica-direitos").value,

        decisao

    };

    if (existente) {
        avaliacao.id = existente.id;
    }

    await guardarDados("avaliacoes", avaliacao);

    propostaAtual.decisao = decisao;

    await guardarDados("propostas", propostaAtual);

    document.getElementById("resultado-verificacao").textContent =
        "Decisão registrada: " + decisao;

    carregarPropostas();

    alert("Sua decisão foi registrada!");

}


/* =========================================
   LOGIN DA PÁGINA INICIAL
========================================= */

function abrirLogin() {

    alert(
        "Bem-vindo ao TICP!\n\n" +
        "O sistema de login está em desenvolvimento."
    );

}



