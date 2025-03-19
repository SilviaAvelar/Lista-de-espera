// ==========================================================================
//  Configurações Globais
// ==========================================================================

const API_URL = process.env.NODE_ENV === 'production'
  ? '/api' // URL base da API (Vercel Serverless Functions em produção)
  : 'http://localhost:3000/api'; // URL base da API (desenvolvimento local)

let participants = []; // Array para armazenar os participantes
let editingParticipantId = null; // ID do participante em edição

// ==========================================================================
//  Funções de Mensagens (Toastify)
// ==========================================================================

/**
 * Exibe uma mensagem usando o Toastify.
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} color - A cor de fundo do popup (ex: 'green', 'red').
 */
function displayMessage(message, color) {
    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: color,
        stopOnFocus: true,
    }).showToast();
}

// ==========================================================================
//  Funções da API
// ==========================================================================

/**
 * Busca a lista de participantes da API.
 * @param {string} role - Filtra os participantes por função (opcional).
 */
async function getParticipants(role = null) {
    try {
        let url = `${API_URL}/participants`;
        if (role) {
            url += `?role=${role}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erro ao buscar participantes: ${response.status}`);
        }

        const data = await response.json();
        participants = data;
        displayParticipants(data, role); // Passa o 'role' para exibir o título
    } catch (error) {
        console.error("Erro ao buscar participantes:", error);
        displayMessage("Erro ao buscar participantes. Verifique o console.", "red");
    }
}

/**
 * Adiciona um novo participante à API.
 * @param {object} participant - O objeto contendo os dados do participante.
 */
async function addParticipant(participant) {
    try {
        const response = await fetch(`${API_URL}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(participant)
        });

        if (!response.ok) {
            throw new Error(`Erro ao adicionar participante: ${response.status}`);
        }

        getParticipants(); // Atualiza a lista
        displayMessage("Adicionado com sucesso!", "green");
        document.getElementById("waitlist-form").reset();
    } catch (error) {
        console.error("Erro ao adicionar participante:", error);
        displayMessage("Erro ao adicionar participante. Verifique o console.", "red");
    }
}

/**
 * Atualiza os dados de um participante existente na API.
 * @param {object} participant - Objeto com os dados atualizados.
 */
async function updateParticipant(participant) {
    try {
        const token = localStorage.getItem('authToken');
        const {
            _id,
            ...updateData
        } = participant;

        const response = await fetch(`${API_URL}/participants?id=${_id}`, { // Envia o ID pela query
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error(`Erro ao atualizar participante: ${response.status}`);
        }

        getParticipants(); // Atualiza a lista
        displayMessage("Participante atualizado com sucesso!", "green");
    } catch (error) {
        console.error("Erro ao atualizar participante:", error);
        displayMessage("Erro ao atualizar participante. Verifique o console.", "red");
    } finally {
        cancelEdit();
        scrollToParticipants();
    }
}

/**
 * Exclui um participante da API.
 */
async function deleteParticipant(id) {
    try {
        const token = localStorage.getItem('authToken');

        const response = await fetch(`${API_URL}/participants?id=${id}`, { // Envia o ID pela query
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ao excluir participante: ${response.status}`);
        }

        getParticipants(); // Atualiza a lista
        displayMessage("Participante excluído com sucesso!", "green");
    } catch (error) {
        console.error("Erro ao excluir participante:", error);
        displayMessage("Erro ao excluir participante. Verifique o console.", "red");
    }
}

// ==========================================================================
//  Funções de Manipulação da Interface
// ==========================================================================

/**
 * Filtra os participantes por função e exibe a lista.
 * @param {string} role - A função a ser filtrada.
 */
function filterRole(role) {
    document.getElementById("participants-list-section").style.display = "block";
    getParticipants(role);
    console.log("Filtrar por função:", role);
}

/**
 * Exibe a lista de participantes na página.
 * @param {Array} participantsList - A lista de participantes a serem exibidos.
 * @param {string} currentRole - A função que está sendo exibida (opcional).
 */
function displayParticipants(participantsList, currentRole = null) {
    const listContainer = document.getElementById("participants-list");
    listContainer.innerHTML = "";

    // Adiciona o título da função, se houver uma função selecionada
    if (currentRole) {
        const roleTitle = document.createElement("h3");
        roleTitle.textContent = `Função Selecionada: ${currentRole}`;
        listContainer.appendChild(roleTitle);
    }

    if (participantsList.length === 0) {
        listContainer.innerHTML = "<p>Nenhum participante encontrado.</p>";
        return;
    }

    const ul = document.createElement("ul");
    participantsList.forEach((participant, index) => {
        const li = document.createElement("li");
        li.classList.add("participant-item");
        li.innerHTML = `
            <span class="participant-number">${index + 1}.</span>
            <span class="participant-name">${participant.name}</span> -
            <span class="participant-role">${participant.role}</span>
            <div class="participant-actions">
                <button class="edit-button" data-id="${participant._id}"><i class="fas fa-pencil-alt"></i></button>
                <button class="delete-button" data-id="${participant._id}"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        li.style.animationDelay = `${index * 0.1}s`;
        ul.appendChild(li);
    });

    listContainer.appendChild(ul);

    // Adiciona event listeners aos botões de editar e excluir usando delegação de eventos
    listContainer.addEventListener('click', handleActionButtonClick);
}

/**
 * Rola a página para a seção de participantes.
 */
function scrollToParticipants() {
    const participantsSection = document.getElementById('participants-list-section');
    participantsSection.scrollIntoView({
        behavior: 'smooth'
    });
}

// ==========================================================================
//  Funções de Edição de Participantes
// ==========================================================================

/**
 * Preenche o formulário com os dados do participante para edição.
 * @param {object} participant - Objeto com os dados do participante.
 */
function startEditParticipant(participant) {
    editingParticipantId = participant._id;
    document.getElementById("full-name").value = participant.name;
    document.getElementById("role").value = participant.role;

    const submitButton = document.querySelector("#waitlist-form button[type='submit']");
    submitButton.textContent = "Atualizar";

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancelar";
    cancelButton.type = "button";
    cancelButton.addEventListener("click", cancelEdit);

    submitButton.parentNode.insertBefore(cancelButton, submitButton.nextSibling);
    document.getElementById("form-section").scrollIntoView({
        behavior: 'smooth'
    });
}

/**
 * Cancela o modo de edição e limpa o formulário.
 */
function cancelEdit() {
    editingParticipantId = null;
    document.getElementById("waitlist-form").reset();

    const submitButton = document.querySelector("#waitlist-form button[type='submit']");
    submitButton.textContent = "Adicionar";

    const cancelButton = document.querySelector("#waitlist-form button[type='button']");
    if (cancelButton) {
        cancelButton.remove();
    }
    scrollToParticipants();
}

// ==========================================================================
//  Funções do Modal de Senha
// ==========================================================================

let submitPasswordHandler; // Declarar fora para poder ser removida
let cancelPasswordHandler; // Declarar fora para poder ser removida

// Função para mostrar o modal de senha
function showPasswordModal(actionButton) {
    const passwordModal = document.getElementById('passwordModal');
    passwordModal.style.display = 'block'; // Exibe o modal

    const submitPasswordButton = document.getElementById('submitPassword');
    const cancelPasswordButton = document.getElementById('cancelPassword');
    const passwordInput = document.getElementById('passwordInput');

    // Limpa o campo de senha ao abrir o modal
    passwordInput.value = '';

    // Remove event listeners antigos para evitar múltiplos disparos
    submitPasswordButton.removeEventListener('click', submitPasswordHandler);
    cancelPasswordButton.removeEventListener('click', cancelPasswordHandler);

    // Define a função para lidar com o envio da senha (declarada fora para poder ser removida)
    submitPasswordHandler = async function () {
        const senhaInserida = passwordInput.value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: senhaInserida
                })
            });

            if (response.ok) {
                const data = await response.json();
                const token = data.token;
                localStorage.setItem('authToken', token);

                // Executa a ação (editar ou excluir)
                executeAction(actionButton); // Passa o botão para executeAction
            } else {
                displayMessage("Senha incorreta. Ação não permitida.", "red");
            }
        } catch (error) {
            console.error("Erro ao autenticar:", error);
            displayMessage("Erro ao autenticar. Tente novamente.", "red");
        } finally {
            closePasswordModal(); // Fecha o modal após a tentativa
        }
    };

    // Define a função para cancelar (declarada fora para poder ser removida)
    cancelPasswordHandler = function () {
        closePasswordModal();
    };

    // Adiciona os event listeners (agora usando as funções declaradas)
    submitPasswordButton.addEventListener('click', submitPasswordHandler);
    cancelPasswordButton.addEventListener('click', cancelPasswordHandler);
}

// Função para fechar o modal de senha
function closePasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    passwordModal.style.display = 'none';
}

// Função para executar a ação (editar ou excluir) após a autenticação
async function executeAction(button) {
    if (button.classList.contains("edit-button")) {
        const id = button.dataset.id;
        const participant = participants.find(p => p._id === id);
        startEditParticipant(participant);
    } else if (button.classList.contains("delete-button")) {
        const id = button.dataset.id;
        await deleteParticipant(id);
    }
}

/**
 * Manipula o evento de clique nos botões de editar e excluir.
 */
async function handleActionButtonClick(event) {
    let button = event.target;

    // Se o clique não foi diretamente no botão (mas sim no ícone dentro),
    // sobe na árvore DOM para pegar o botão correto.
    if (button.tagName === 'I') {
        button = button.parentNode;
    }

    if (button.classList.contains("edit-button") || button.classList.contains("delete-button")) {
        showPasswordModal(button); // Mostra o modal de senha
    }
}

// ==========================================================================
//  Event Listeners
// ==========================================================================

// Event listener para o formulário
document.getElementById("waitlist-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const fullName = document.getElementById("full-name").value.trim();
    const role = document.getElementById("role").value;

    if (fullName === "" || role === "") {
        displayMessage("Por favor, preencha todos os campos.", "red");
        return;
    }

    const newParticipant = {
        name: fullName,
        role: role
    };
    if (editingParticipantId) {
        newParticipant._id = editingParticipantId;
        await updateParticipant(newParticipant);
        editingParticipantId = null;
    } else {
        await addParticipant(newParticipant);
    }

    document.getElementById("waitlist-form").reset();
});

// Event listener para o botão "Saiba Mais"
document.getElementById('saiba-mais-button').addEventListener('click', function () {
    window.location.href = '/oficina-digital.html';
});

// Função genérica para adicionar event listeners aos botões de filtro
function addFilterEventListener(buttonId, role) {
    document.getElementById(buttonId).addEventListener('click', function () {
        filterRole(role);
        scrollToParticipants();
    });
}

// Adiciona os event listeners para os botões de filtro
document.querySelectorAll("#filter-section button[data-role]").forEach(button => {
    button.addEventListener("click", function () {
        const role = this.dataset.role;
        filterRole(role);
        scrollToParticipants();
    });
});

// ==========================================================================
//  Inicialização
// ==========================================================================

getParticipants(); // Carrega a lista inicial de participantes

// ==========================================================================
// Código para correção do select
// ==========================================================================

const roleSelect = document.getElementById('role');

roleSelect.addEventListener('change', function () {
    if (this.value !== '') {
        this.classList.add('selected');
    } else {
        this.classList.remove('selected');
    }
});