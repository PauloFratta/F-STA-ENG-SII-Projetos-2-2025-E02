// Sistema de Autenticação - NativaStore
// Integração com API PHP

// Configuração da API
const API_BASE_URL = 'php/api/';
const SESSION_KEY = 'nativastore_session';

// Funções de API
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = API_BASE_URL + endpoint;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Erro na requisição');
        }
        
        return result;
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
}

// Funções de autenticação via API
async function registerUser(userData) {
    return await apiRequest('auth.php', 'POST', {
        action: 'register',
        ...userData
    });
}

async function loginUser(email, password) {
    return await apiRequest('auth.php', 'POST', {
        action: 'login',
        email: email,
        password: password
    });
}

async function logoutUser(token) {
    return await apiRequest('auth.php', 'POST', {
        action: 'logout',
        token: token
    });
}

async function validateSession(token) {
    return await apiRequest('auth.php', 'POST', {
        action: 'validate',
        token: token
    });
}

// Funções de sessão local
function saveSession(sessionData) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

function getSession() {
    const session = sessionStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

// Funções de interface
function showAuthModal(type = 'choice') {
    const modal = document.getElementById('auth-modal');
    modal.style.display = 'block';
    showAuthForm(type);
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.style.display = 'none';
    resetForms();
}

function showAuthForm(formType) {
    // Esconder todas as telas
    const screens = document.querySelectorAll('.auth-screen');
    screens.forEach(screen => screen.style.display = 'none');
    
    // Mostrar a tela selecionada
    switch(formType) {
        case 'choice':
            document.getElementById('auth-choice').style.display = 'block';
            break;
        case 'login':
            document.getElementById('login-form').style.display = 'block';
            break;
        case 'signup':
            document.getElementById('signup-form').style.display = 'block';
            break;
    }
}

function resetForms() {
    // Limpar formulários
    document.getElementById('loginForm').reset();
    document.getElementById('signupForm').reset();
    
    // Esconder campos de vendedor
    document.getElementById('vendor-fields').style.display = 'none';
    
    // Voltar para tela de escolha
    showAuthForm('choice');
}

function toggleVendorFields() {
    const accountType = document.getElementById('account-type').value;
    const vendorFields = document.getElementById('vendor-fields');
    
    if (accountType === 'vendedor') {
        vendorFields.style.display = 'block';
        // Tornar campos obrigatórios
        document.getElementById('store-name').required = true;
        document.getElementById('store-document').required = true;
        document.getElementById('store-description').required = true;
    } else {
        vendorFields.style.display = 'none';
        // Remover obrigatoriedade
        document.getElementById('store-name').required = false;
        document.getElementById('store-document').required = false;
        document.getElementById('store-description').required = false;
    }
}

// Funções de validação
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

function validatePasswordsMatch(password, confirmPassword) {
    return password === confirmPassword;
}

function validateCNPJCPF(document) {
    // Remover caracteres não numéricos
    const cleanDoc = document.replace(/\D/g, '');
    
    // Verificar se tem 11 (CPF) ou 14 (CNPJ) dígitos
    return cleanDoc.length === 11 || cleanDoc.length === 14;
}

function showMessage(message, type = 'error') {
    // Remover mensagens anteriores
    const existingMessage = document.querySelector('.auth-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message auth-message-${type}`;
    messageDiv.textContent = message;
    
    // Inserir no formulário ativo
    const activeForm = document.querySelector('.auth-screen[style=""]') || 
                      document.querySelector('.auth-screen:not([style*="none"])');
    if (activeForm) {
        activeForm.insertBefore(messageDiv, activeForm.firstChild);
    }
    
    // Remover mensagem após 5 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Função de cadastro
async function handleSignup(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = Object.fromEntries(formData.entries());
    
    // Validações básicas
    if (!validateEmail(userData.email)) {
        showMessage('Por favor, insira um e-mail válido.');
        return;
    }
    
    if (!validatePassword(userData.password)) {
        showMessage('A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    
    if (!validatePasswordsMatch(userData.password, userData.confirmPassword)) {
        showMessage('As senhas não coincidem.');
        return;
    }
    
    // Validações específicas para vendedor
    if (userData.accountType === 'vendedor') {
        if (!userData.storeName || !userData.storeDocument || !userData.storeDescription) {
            showMessage('Todos os campos de vendedor são obrigatórios.');
            return;
        }
        
        if (!validateCNPJCPF(userData.storeDocument)) {
            showMessage('CNPJ/CPF deve ter 11 ou 14 dígitos.');
            return;
        }
    }
    
    try {
        // Mostrar loading
        showMessage('Cadastrando usuário...', 'info');
        
        // Chamar API de cadastro
        const response = await registerUser(userData);
        
        showMessage('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
        
        // Limpar formulário e voltar para login
        setTimeout(() => {
            resetForms();
            showAuthForm('login');
        }, 2000);
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        showMessage(error.message || 'Erro ao cadastrar usuário. Tente novamente.');
    }
}

// Função de login
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Validações básicas
    if (!validateEmail(email)) {
        showMessage('Por favor, insira um e-mail válido.');
        return;
    }
    
    if (!validatePassword(password)) {
        showMessage('A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    
    try {
        // Mostrar loading
        showMessage('Fazendo login...', 'info');
        
        // Chamar API de login
        const response = await loginUser(email, password);
        
        // Salvar sessão
        saveSession({
            user: response.data.user,
            token: response.data.session.token,
            expires_at: response.data.session.expires_at
        });
        
        // Login bem-sucedido
        loginUserSuccess(response.data.user);
        
    } catch (error) {
        console.error('Erro no login:', error);
        showMessage(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
    }
}

function loginUserSuccess(user) {
    // Atualizar interface
    updateAuthUI(user);
    
    // Fechar modal
    closeAuthModal();
    
    // Redirecionar para dashboard apropriado
    redirectToDashboard(user.account_type);
}

function updateAuthUI(user) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    
    authButtons.style.display = 'none';
    userMenu.style.display = 'block';
    userName.textContent = user.name;
}

async function logout() {
    try {
        const session = getSession();
        
        if (session && session.token) {
            // Chamar API de logout
            await logoutUser(session.token);
        }
    } catch (error) {
        console.error('Erro no logout:', error);
    } finally {
        // Limpar sessão local
        clearSession();
        
        // Atualizar interface
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const dashboardContainer = document.getElementById('dashboard-container');
        
        authButtons.style.display = 'block';
        userMenu.style.display = 'none';
        dashboardContainer.style.display = 'none';
        
        // Mostrar conteúdo principal
        document.querySelector('main').style.display = 'block';
        document.querySelector('header').style.display = 'block';
        document.querySelector('footer').style.display = 'block';
    }
}

async function checkAuthStatus() {
    const session = getSession();
    
    if (session && session.token) {
        try {
            // Validar sessão com o servidor
            const response = await validateSession(session.token);
            
            if (response.data.valid) {
                // Atualizar dados do usuário
                saveSession({
                    ...session,
                    user: response.data.user
                });
                
                updateAuthUI(response.data.user);
                redirectToDashboard(response.data.user.account_type);
            } else {
                // Sessão inválida, limpar
                clearSession();
            }
        } catch (error) {
            console.error('Erro ao validar sessão:', error);
            clearSession();
        }
    }
}

function redirectToDashboard(accountType) {
    // Esconder conteúdo principal
    document.querySelector('main').style.display = 'none';
    document.querySelector('header').style.display = 'none';
    document.querySelector('footer').style.display = 'none';
    
    // Mostrar dashboard
    const dashboardContainer = document.getElementById('dashboard-container');
    dashboardContainer.style.display = 'block';
    
    // Mostrar dashboard apropriado
    if (accountType === 'vendedor') {
        document.getElementById('client-dashboard').style.display = 'none';
        document.getElementById('vendor-dashboard').style.display = 'block';
        
        // Preencher dados do vendedor
        const session = getSession();
        if (session && session.user) {
            document.getElementById('vendor-name').textContent = session.user.name;
            document.getElementById('vendor-store').textContent = session.user.store_name;
        }
    } else {
        document.getElementById('vendor-dashboard').style.display = 'none';
        document.getElementById('client-dashboard').style.display = 'block';
        
        // Preencher dados do cliente
        const session = getSession();
        if (session && session.user) {
            document.getElementById('client-name').textContent = session.user.name;
        }
    }
}

// Função para voltar ao site principal (para clientes)
function showMainSite() {
    const session = getSession();
    
    if (session && session.user && session.user.account_type === 'cliente') {
        // Mostrar conteúdo principal
        document.querySelector('main').style.display = 'block';
        document.querySelector('header').style.display = 'block';
        document.querySelector('footer').style.display = 'block';
        
        // Esconder dashboard
        document.getElementById('dashboard-container').style.display = 'none';
    }
}

// Função para adicionar produto (vendedor)
function showAddProductForm() {
    alert('Funcionalidade de adicionar produtos será implementada em breve!');
}

// Sistema inicializado

// Fechar modal ao clicar fora dele
window.addEventListener('click', (event) => {
    const modal = document.getElementById('auth-modal');
    if (event.target === modal) {
        closeAuthModal();
    }
});
