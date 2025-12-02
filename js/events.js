// Respeita a configuração já usada pelo auth.js e adiciona fallback
const EVENTS_API_BASE =
    (typeof API_BASE_URL === 'string' && API_BASE_URL.length > 0)
        ? API_BASE_URL
        : 'php/api/';
const EVENTS_ENDPOINT = `${EVENTS_API_BASE.replace(/\/?$/, '/') }events.php`;

// Função para obter token da sessão
function getEventToken() {
    const session = getSession();
    return session ? session.token : null;
}

// Função para formatar data
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('pt-BR', options);
}

// Função para mostrar mensagem
function showEventMessage(message, type = 'error') {
    // Remover mensagem anterior se existir
    const existingMessage = document.getElementById('event-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.id = 'event-message';
    messageDiv.className = `auth-message auth-message-${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Carregar eventos
async function loadEvents() {
    try {
        const response = await fetch(EVENTS_ENDPOINT);
        const result = await response.json();
        
        if (result.success) {
            displayEvents(result.data || []);
        } else {
            showEventMessage('Erro ao carregar eventos: ' + result.message, 'error');
            displayEvents([]);
        }
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
        showEventMessage('Erro ao carregar eventos. Tente novamente.', 'error');
        displayEvents([]);
    }
}

// Exibir eventos na página
function displayEvents(events) {
    const eventsGrid = document.getElementById('events-grid');
    
    if (!eventsGrid) return;
    
    if (events.length === 0) {
        eventsGrid.innerHTML = `
            <div class="empty-events" style="grid-column: 1 / -1;">
                <p>Nenhum evento cadastrado ainda.</p>
                <button class="product-btn primary" onclick="showCreateEventModal()">Criar Primeiro Evento</button>
            </div>
        `;
        return;
    }
    
    const session = getSession();
    const currentUserId = session && session.user ? session.user.id : null;
    
    eventsGrid.innerHTML = events.map(event => {
        const isOwner = currentUserId && event.user_id == currentUserId;
        const imageHtml = event.image_url 
            ? `<img src="${event.image_url}" alt="${event.title}" onerror="this.parentElement.innerHTML='<span>🌱</span>'">`
            : '<span>🌱</span>';
        
        return `
            <article class="event-article">
                <div class="event-article__image">
                    ${imageHtml}
                </div>
                <div class="event-article__body">
                    <div class="event-article__meta">
                        <span class="event-article__date">${formatDate(event.event_date || event.created_at)}</span>
                        ${event.location ? `<span>📍 ${event.location}</span>` : ''}
                    </div>
                    <h3 class="event-article__title">${escapeHtml(event.title)}</h3>
                    <p class="event-article__description">${escapeHtml(event.description)}</p>
                    ${event.location ? `<div class="event-article__location">📍 ${escapeHtml(event.location)}</div>` : ''}
                    <div class="event-article__author">
                        Por: ${escapeHtml(event.author_name || 'Usuário')}
                    </div>
                    <div class="event-article__actions">
                        <button class="event-btn" onclick="alert('Funcionalidade de participação em desenvolvimento!')">Participar</button>
                        ${isOwner ? `<button class="delete-event-btn" onclick="deleteEvent(${event.id})">Excluir</button>` : ''}
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mostrar modal de criar evento
function showCreateEventModal() {
    const session = getSession();
    if (!session || !session.token) {
        showEventMessage('Você precisa estar logado para criar um evento.', 'error');
        showAuthModal('login');
        return;
    }
    
    const modal = document.getElementById('create-event-modal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('create-event-form').reset();
    }
}

// Fechar modal de criar evento
function closeCreateEventModal() {
    const modal = document.getElementById('create-event-modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('create-event-form').reset();
    }
}

// Criar evento
async function handleCreateEvent(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const eventData = {
        title: formData.get('title'),
        description: formData.get('description'),
        image_url: formData.get('image_url') || null,
        event_date: formData.get('event_date') || null,
        location: formData.get('location') || null
    };
    
    const session = getSession();
    if (!session || !session.token) {
        showEventMessage('Você precisa estar logado para criar um evento.', 'error');
        return;
    }
    
    try {
        showEventMessage('Criando evento...', 'info');
        
        const response = await fetch(EVENTS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.token}`
            },
            body: JSON.stringify({
                ...eventData,
                token: session.token
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showEventMessage('Evento criado com sucesso!', 'success');
            closeCreateEventModal();
            loadEvents();
        } else {
            showEventMessage('Erro ao criar evento: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao criar evento:', error);
        showEventMessage('Erro ao criar evento. Tente novamente.', 'error');
    }
}

// Deletar evento
async function deleteEvent(eventId) {
    if (!confirm('Tem certeza que deseja excluir este evento?')) {
        return;
    }
    
    const session = getSession();
    if (!session || !session.token) {
        showEventMessage('Você precisa estar logado para excluir um evento.', 'error');
        return;
    }
    
    try {
        showEventMessage('Excluindo evento...', 'info');
        
        const response = await fetch(`${EVENTS_ENDPOINT}?id=${eventId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${session.token}`
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showEventMessage('Evento excluído com sucesso!', 'success');
            loadEvents();
        } else {
            showEventMessage('Erro ao excluir evento: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir evento:', error);
        showEventMessage('Erro ao excluir evento. Tente novamente.', 'error');
    }
}

// Fechar modal ao clicar fora
window.addEventListener('click', function(event) {
    const createEventModal = document.getElementById('create-event-modal');
    if (event.target === createEventModal) {
        closeCreateEventModal();
    }
});

// Atualizar visibilidade do botão criar evento baseado no login
function updateCreateEventButton() {
    const createBtn = document.getElementById('create-event-btn');
    const session = getSession();
    
    if (createBtn) {
        if (session && session.token) {
            createBtn.style.display = 'block';
        } else {
            createBtn.style.display = 'block'; // Sempre mostrar, mas verificar login no click
        }
    }
}

// Observar mudanças na autenticação
if (typeof updateAuthUI === 'function') {
    const originalUpdateAuthUI = updateAuthUI;
    window.updateAuthUI = function(user) {
        originalUpdateAuthUI(user);
        updateCreateEventButton();
    };
}

