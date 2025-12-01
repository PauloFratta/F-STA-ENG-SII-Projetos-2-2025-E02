// Sistema de Carrinho - NativaStore
// Gerencia produtos no carrinho usando localStorage

const CART_KEY_PREFIX = 'nativastore_cart_';
const LEGACY_CART_KEY = 'nativastore_cart';
const PENDING_PRODUCT_KEY = 'nativastore_pending_product';

function getCartStorageKey() {
    const session = typeof getSession === 'function' ? getSession() : null;
    if (!session || !session.user || !session.user.id) {
        return null;
    }
    return `${CART_KEY_PREFIX}${session.user.id}`;
}

function readCartFromStorage() {
    const key = getCartStorageKey();
    if (!key) return [];
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
}

function writeCartToStorage(cart) {
    const key = getCartStorageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(cart));
}

// Limpar chave legada para evitar carrinhos "fantasma"
if (localStorage.getItem(LEGACY_CART_KEY)) {
    localStorage.removeItem(LEGACY_CART_KEY);
}

// Funções de gerenciamento do carrinho
function getCart() {
    return readCartFromStorage();
}

function saveCart(cart) {
    writeCartToStorage(cart);
}

function clearCart() {
    const key = getCartStorageKey();
    if (!key) return;
    localStorage.removeItem(key);
    updateCartUI();
}

function addToCart(product) {
    const cart = getCart();
    
    // Verificar se o produto já está no carrinho
    const existingProduct = cart.find(item => item.id === product.id);
    
    if (existingProduct) {
        // Se já existe, incrementar quantidade
        existingProduct.quantity = (existingProduct.quantity || 1) + 1;
    } else {
        // Adicionar novo produto com quantidade 1
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    saveCart(cart);
    updateCartUI();
    return cart;
}

function removeFromCart(productId) {
    const cart = getCart();
    const filteredCart = cart.filter(item => item.id !== productId);
    saveCart(filteredCart);
    updateCartUI();
    return filteredCart;
}

function updateProductQuantity(productId, quantity) {
    if (quantity <= 0) {
        return removeFromCart(productId);
    }
    
    const cart = getCart();
    const product = cart.find(item => item.id === productId);
    
    if (product) {
        product.quantity = quantity;
        saveCart(cart);
        updateCartUI();
    }
    
    return cart;
}

// Função para obter produto pendente (quando usuário não está logado)
function getPendingProduct() {
    const pending = localStorage.getItem(PENDING_PRODUCT_KEY);
    return pending ? JSON.parse(pending) : null;
}

function setPendingProduct(product) {
    localStorage.setItem(PENDING_PRODUCT_KEY, JSON.stringify(product));
}

function clearPendingProduct() {
    localStorage.removeItem(PENDING_PRODUCT_KEY);
}

// Função principal para adicionar produto ao carrinho
function handleAddToCart(productData) {
    const session = getSession();
    
    if (session && session.user && session.token) {
        // Usuário está logado - adicionar diretamente ao carrinho
        addToCart(productData);
        showCartMessage('Produto adicionado ao carrinho!', 'success');
    } else {
        // Usuário não está logado - salvar produto pendente e mostrar modal de login
        setPendingProduct(productData);
        showAuthModal('choice');
        showCartMessage('Por favor, faça login ou cadastre-se para adicionar produtos ao carrinho.', 'info');
    }
}

// Função para processar produto pendente após login/cadastro
function processPendingProduct() {
    const pendingProduct = getPendingProduct();
    
    if (pendingProduct) {
        addToCart(pendingProduct);
        clearPendingProduct();
        showCartMessage('Produto adicionado ao carrinho!', 'success');
    }
}

// Função para atualizar a UI do carrinho
function updateCartUI() {
    const cartSection = document.getElementById('cart-section');
    const cartCount = document.getElementById('cart-count');
    const cartEmpty = document.getElementById('cart-empty');
    const cartItems = document.getElementById('cart-items');
    
    // Verificar se o usuário está logado
    const session = typeof getSession === 'function' ? getSession() : null;
    const isLoggedIn = session && session.user && session.token;
    
    // Mostrar/ocultar seção do carrinho baseado no status de login
    if (cartSection) {
        cartSection.style.display = isLoggedIn ? 'block' : 'none';
    }
    
    if (!isLoggedIn) {
        if (cartItems) {
            cartItems.innerHTML = '';
            cartItems.style.display = 'none';
        }
        if (cartEmpty) {
            cartEmpty.style.display = 'none';
        }
        if (cartCount) {
            cartCount.style.display = 'none';
        }
        return;
    }

    const cart = getCart();

    // Atualizar contador no ícone do carrinho (se existir)
    const cartIcon = document.querySelector('.nav-icon-container img[alt*="Carrinho"], .nav-icon-container img[alt*="carrinho"]');
    if (cartIcon) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        
        // Criar ou atualizar contador
        let countElement = document.getElementById('cart-count');
        if (!countElement && totalItems > 0) {
            countElement = document.createElement('span');
            countElement.id = 'cart-count';
            cartIcon.parentElement.appendChild(countElement);
        }
        
        if (countElement) {
            countElement.textContent = totalItems;
            countElement.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }
    
    // Atualizar seção do carrinho na página inicial (apenas se estiver logado)
    if (cartSection) {
        if (cart.length === 0) {
            if (cartEmpty) cartEmpty.style.display = 'block';
            if (cartItems) cartItems.style.display = 'none';
        } else if (cartItems) {
            if (cartEmpty) cartEmpty.style.display = 'none';
            cartItems.style.display = 'block';
            renderCartItems(cartItems, cart);
        }
    }
}

// Função para renderizar itens do carrinho
function renderCartItems(container, cart) {
    container.innerHTML = '';
    
    cart.forEach(product => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="cart-item-details">
                <h4>${product.name}</h4>
                <p class="cart-item-description">${product.description || ''}</p>
                <p class="cart-item-price">${product.price}</p>
            </div>
            <div class="cart-item-controls">
                <div class="quantity-controls">
                    <button onclick="updateCartQuantity('${product.id}', ${(product.quantity || 1) - 1})">-</button>
                    <span>${product.quantity || 1}</span>
                    <button onclick="updateCartQuantity('${product.id}', ${(product.quantity || 1) + 1})">+</button>
                </div>
                <button class="remove-btn" onclick="removeCartItem('${product.id}')">Remover</button>
            </div>
        `;
        container.appendChild(cartItem);
    });
}

// Funções globais para uso nos botões
function updateCartQuantity(productId, quantity) {
    updateProductQuantity(productId, quantity);
}

function removeCartItem(productId) {
    removeFromCart(productId);
}

// Função para extrair dados do produto do botão clicado
function extractProductData(button) {
    const productCard = button.closest('.product-card') || button.closest('.product');
    
    if (!productCard) {
        console.error('Não foi possível encontrar o card do produto');
        return null;
    }
    
    // Tentar encontrar a imagem
    const img = productCard.querySelector('img');
    const image = img ? img.src : '';
    
    // Tentar encontrar o nome
    const nameElement = productCard.querySelector('h3') || productCard.querySelector('.product-name') || productCard.querySelector('.product-card__name');
    const name = nameElement ? nameElement.textContent.trim() : 'Produto';
    
    // Tentar encontrar a descrição
    const descElement = productCard.querySelector('.product-card__description') || 
                      productCard.querySelector('.product-description') ||
                      productCard.querySelector('p');
    const description = descElement ? descElement.textContent.trim() : '';
    
    // Tentar encontrar o preço
    const priceElement = productCard.querySelector('.product-card__price') || 
                        productCard.querySelector('.product-price');
    const price = priceElement ? priceElement.textContent.trim() : 'R$ 0,00';
    
    // Gerar ID único baseado no nome e preço
    const id = `product-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    return {
        id: id,
        name: name,
        description: description,
        price: price,
        image: image
    };
}

// Função para mostrar mensagem
function showCartMessage(message, type = 'info') {
    // Remover mensagens anteriores
    const existingMessage = document.querySelector('.cart-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `cart-message cart-message-${type}`;
    messageDiv.textContent = message;
    
    // Adicionar ao body
    document.body.appendChild(messageDiv);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

// Função para verificar e atualizar visibilidade do carrinho quando o status de login mudar
function checkCartVisibility() {
    const session = typeof getSession === 'function' ? getSession() : null;
    const isLoggedIn = session && session.user && session.token;
    const cartSection = document.getElementById('cart-section');
    
    if (cartSection) {
        cartSection.style.display = isLoggedIn ? 'block' : 'none';
    }
    
    updateCartUI();
}

// Inicializar carrinho ao carregar a página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        updateCartUI();
        // Verificar novamente após um pequeno delay para garantir que auth.js foi carregado
        setTimeout(updateCartUI, 100);
    });
} else {
    updateCartUI();
    setTimeout(updateCartUI, 100);
}

// Observar mudanças no sessionStorage para atualizar o carrinho quando o usuário fizer login/logout
window.addEventListener('storage', function(e) {
    if (e.key === 'nativastore_session') {
        checkCartVisibility();
    }
});

// Atualizar carrinho quando a função updateAuthUI for chamada (após login)
const originalUpdateAuthUI = typeof updateAuthUI !== 'undefined' ? updateAuthUI : null;
if (originalUpdateAuthUI) {
    window.updateAuthUI = function(user) {
        originalUpdateAuthUI(user);
        setTimeout(checkCartVisibility, 100);
    };
}

