// SISTEMA DE TAREFAS

const formulario = document.getElementById("formTarefa");

const listaTarefas = document.getElementById("listaTarefas");

// Recupera as tarefas salvas no navegador
let tarefas = JSON.parse(
    localStorage.getItem("tarefas") || "[]"
);



// SELEÇÃO DA CATEGORIA DO PROJETO

const botoesCategoria = document.querySelectorAll(
    ".categoria-card"
);

const campoTipo = document.getElementById("tipo");

const tituloCriacao = document.getElementById("tituloCriacao");

const descricaoCriacao = document.getElementById("descricaoCriacao");

const areaCriacao = document.getElementById("nova-tarefa");

botoesCategoria.forEach(function(botao) {

    botao.addEventListener("click", function() {

        const categoria = botao.dataset.tipo;

        // Define a categoria escolhida
        campoTipo.value = categoria;

        // Atualiza o título da área
        tituloCriacao.textContent = "Criar projeto de " + categoria;

        // Atualiza a descrição
        descricaoCriacao.textContent =
            "Agora você pode desenvolver seu projeto de " +
            categoria + ".";

        // Direciona para a área de criação
        areaCriacao.scrollIntoView({
            behavior: "smooth"
        });

    });

});



// SALVAR NOVA TAREFA

formulario.addEventListener("submit", function(event) {

    event.preventDefault();

    const tipo = document.getElementById("tipo").value;

    const nome = document.getElementById("nome").value;

    const descricao = document.getElementById("descricao").value;

    const status = document.getElementById("status").value;

    const novaTarefa = {
        id: Date.now(),
        tipo: tipo,
        nome: nome,
        descricao: descricao,
        status: status
    };

    // Adiciona a tarefa à lista
    tarefas.push(novaTarefa);

    // Salva no navegador
    localStorage.setItem(
        "tarefas",
        JSON.stringify(tarefas)
    );

    alert("Projeto salvo com sucesso!");

    // Limpa os campos
    formulario.reset();

    // Atualiza a lista
    mostrarTarefas();

});



// CATEGORIAS DAS PASTAS

const categorias = [
    "Artes",
    "Animações",
    "Histórias",
    "Personagens"
];


// ABRIR UMA PASTA

function abrirPasta(categoria) {

    const conteudo = document.getElementById("conteudoPasta");

    const projetos = tarefas.filter(function(tarefa) {
        return tarefa.tipo === categoria;
    });

    conteudo.innerHTML = "";

    const titulo = document.createElement("h3");
    titulo.textContent = "📂 Pasta: " + categoria;

    conteudo.appendChild(titulo);

    const botaoVoltar = document.createElement("button");

    botaoVoltar.textContent = "← Voltar às pastas";

    botaoVoltar.className = "botao-voltar";

    botaoVoltar.onclick = function() {
        mostrarPastas();
    };

    conteudo.appendChild(botaoVoltar);


    if (projetos.length === 0) {

        const vazio = document.createElement("p");

        vazio.textContent =
            "Esta pasta ainda não possui projetos.";

        conteudo.appendChild(vazio);

        return;
    }


    // MOSTRAR PROJETOS DA CATEGORIA

    projetos.forEach(function(projeto) {

        const card = document.createElement("div");

        card.className = "projeto-salvo";

        const nome = document.createElement("h4");
        nome.textContent = projeto.nome;

        const descricao = document.createElement("p");
        descricao.textContent =
            "Descrição: " + projeto.descricao;

        const status = document.createElement("p");
        status.textContent =
            "Status: " + projeto.status;

        const excluir = document.createElement("button");

        excluir.textContent = "Excluir projeto";

        excluir.className = "botao-excluir";

        excluir.onclick = function() {

            const confirmar = confirm(
                "Deseja excluir este projeto?"
            );

            if (!confirmar) return;

            tarefas = tarefas.filter(function(item) {
                return item.id !== projeto.id;
            });

            localStorage.setItem(
                "tarefas",
                JSON.stringify(tarefas)
            );

            atualizarPastas();

            abrirPasta(categoria);

        };

        card.appendChild(nome);
        card.appendChild(descricao);
        card.appendChild(status);
        card.appendChild(excluir);

        conteudo.appendChild(card);

    });

}


// MOSTRAR AS PASTAS

function mostrarPastas() {

    const conteudo = document.getElementById("conteudoPasta");

    conteudo.innerHTML = `
        <h3>📂 Selecione uma pasta</h3>
        <p>Escolha uma categoria para visualizar seus projetos.</p>
    `;

}


// ATUALIZAR CONTADORES

function atualizarPastas() {

    categorias.forEach(function(categoria) {

        const quantidade = tarefas.filter(function(tarefa) {
            return tarefa.tipo === categoria;
        }).length;

        const contador = document.getElementById(
            "contador-" + categoria
        );

        contador.textContent =
            quantidade + (quantidade === 1
                ? " projeto"
                : " projetos");

    });

}


// MOSTRAR PASTAS E CONTADORES

function mostrarTarefas() {

    atualizarPastas();

    mostrarPastas();

}


// CARREGAR AO ABRIR O SITE

mostrarTarefas();


// EXCLUIR TAREFA

function excluirTarefa(id) {

    const confirmar = confirm(
        "Deseja realmente excluir este projeto?"
    );

    if (!confirmar) {
        return;
    }

    tarefas = tarefas.filter(function(tarefa) {
        return tarefa.id !== id;
    });

    localStorage.setItem(
        "tarefas",
        JSON.stringify(tarefas)
    );

    mostrarTarefas();

}


// CARREGAR TAREFAS AO ABRIR O SITE

mostrarTarefas();