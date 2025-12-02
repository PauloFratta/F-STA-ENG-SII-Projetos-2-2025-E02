// Sistema de Produtos - NativaStore
// Respeita a configuração já usada pelo auth.js e adiciona fallback
const PRODUCTS_API_BASE =
    (typeof API_BASE_URL === 'string' && API_BASE_URL.length > 0)
        ? API_BASE_URL
        : 'php/api/';
const PRODUCTS_ENDPOINT = `${PRODUCTS_API_BASE.replace(/\/?$/, '/')}products.php`;

// Função para obter token da sessão
function getProductToken() {
    const session = getSession();
    return session ? session.token : null;
}

// Função para formatar preço
function formatPrice(price) {
    if (!price) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price);
}

// Função para mostrar mensagem
function showProductMessage(message, type = 'error') {
    // Remover mensagem anterior se existir
    const existingMessage = document.getElementById('product-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.id = 'product-message';
    messageDiv.className = `auth-message auth-message-${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Carregar produtos do vendedor
async function loadVendorProducts() {
    try {
        const session = getSession();
        if (!session || !session.user || !session.user.id) {
            return [];
        }

        const vendorId = session.user.id;
        const response = await fetch(`${PRODUCTS_ENDPOINT}?vendor_id=${vendorId}`);
        const result = await response.json();
        
        if (result.success) {
            return result.data || [];
        } else {
            showProductMessage('Erro ao carregar produtos: ' + result.message, 'error');
            return [];
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showProductMessage('Erro ao carregar produtos. Tente novamente.', 'error');
        return [];
    }
}

// Carregar todos os produtos (para exibição pública)
async function loadAllProducts() {
    try {
        const response = await fetch(PRODUCTS_ENDPOINT);
        const result = await response.json();
        
        if (result.success) {
            return result.data || [];
        } else {
            return [];
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        return [];
    }
}

// Exibir produtos na página de produtos do site
async function displayProductsOnSite() {
    const productsGrid = document.getElementById('produtos-grid');
    if (!productsGrid) return;
    
    try {
        const products = await loadAllProducts();
        
        if (products.length === 0) {
            return; // Não há produtos para adicionar
        }
        
        // Adicionar produtos do banco após os produtos estáticos
        const productsHTML = products.map(product => {
            const imageHtml = product.image_url 
                ? `<img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='images/products/product-1.png'">`
                : '<img src="images/products/product-1.png" alt="Produto sem imagem" loading="lazy">';
            
            return `
                <article class="product-card">
                    ${imageHtml}
                    <div class="product-card__body">
                        <div>
                            <p class="product-card__category">${product.category ? escapeHtml(product.category) : 'Produto Sustentável'}</p>
                            <h3>${escapeHtml(product.name)}</h3>
                            <p class="product-card__description">${escapeHtml(product.description)}</p>
                        </div>
                        <div class="product-card__footer">
                            <span class="product-card__price">${formatPrice(product.price)}</span>
                            <button class="product-btn secondary add-to-cart-btn" data-product='${JSON.stringify({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                image: product.image_url || 'images/products/product-1.png'
                            })}'>Adicionar</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
        
        // Adicionar os produtos ao grid
        productsGrid.insertAdjacentHTML('beforeend', productsHTML);
        
        // Adicionar event listeners aos botões de adicionar ao carrinho
        const addButtons = productsGrid.querySelectorAll('.add-to-cart-btn');
        addButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                try {
                    const productData = JSON.parse(this.dataset.product);
                    if (typeof handleAddToCart === 'function') {
                        handleAddToCart(productData);
                    }
                } catch (err) {
                    console.error('Erro ao processar produto:', err);
                }
            });
        });
        
    } catch (error) {
        console.error('Erro ao exibir produtos:', error);
    }
}

// Exibir produtos do vendedor no dashboard
async function displayVendorProducts() {
    const productsContainer = document.getElementById('vendor-products-list');
    if (!productsContainer) return;
    
    const products = await loadVendorProducts();
    
    if (products.length === 0) {
        productsContainer.innerHTML = `
            <p style="text-align: center; color: #666; margin: 2rem 0;">
                Nenhum produto cadastrado ainda.
            </p>
        `;
        return;
    }
    
    // Verificar se está no dashboard card (versão compacta) ou na área de gerenciamento (versão completa)
    const isInDashboardCard = productsContainer.closest('.dashboard-card') !== null;
    const isCompact = isInDashboardCard;
    
    productsContainer.innerHTML = products.map(product => {
        const imageHtml = product.image_url 
            ? `<img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" onerror="this.parentElement.innerHTML='<span>📦</span>'">`
            : '<span>📦</span>';
        
        if (isCompact) {
            // Versão compacta para o dashboard card - cards pequenos
            return `
                <article class="vendor-product-card-compact" data-product-id="${product.id}">
                    <div class="vendor-product-card-compact__image">
                        ${imageHtml}
                    </div>
                    <div class="vendor-product-card-compact__body">
                        <h4>${escapeHtml(product.name)}</h4>
                        <p class="vendor-product-card-compact__price">${formatPrice(product.price)}</p>
                    </div>
                </article>
            `;
        } else {
            // Versão completa para a área de gerenciamento - layout tipo eventos
            return `
                <article class="vendor-product-article" data-product-id="${product.id}">
                    <div class="vendor-product-article__image">
                        ${imageHtml}
                    </div>
                    <div class="vendor-product-article__body">
                        <h3 class="vendor-product-article__title">${escapeHtml(product.name)}</h3>
                        <p class="vendor-product-article__description">${escapeHtml(product.description)}</p>
                        <div class="vendor-product-article__info">
                            <p class="vendor-product-article__price">${formatPrice(product.price)}</p>
                            <p class="vendor-product-article__stock">Estoque: ${product.stock || 0}</p>
                            ${product.category ? `<p class="vendor-product-article__category">${escapeHtml(product.category)}</p>` : ''}
                        </div>
                        <div class="vendor-product-article__actions">
                            <button class="edit-product-btn" onclick="showEditProductForm(${product.id})">Editar</button>
                            <button class="delete-product-btn" onclick="deleteProduct(${product.id})">Excluir</button>
                        </div>
                    </div>
                </article>
            `;
        }
    }).join('');
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mostrar modal de adicionar produto
function showAddProductForm() {
    const session = getSession();
    if (!session || !session.token) {
        showProductMessage('Você precisa estar logado como vendedor para adicionar produtos.', 'error');
        showAuthModal('login');
        return;
    }
    
    if (session.user.account_type !== 'vendedor') {
        showProductMessage('Apenas vendedores podem adicionar produtos.', 'error');
        return;
    }
    
    const modal = document.getElementById('add-product-modal');
    if (modal) {
        modal.style.display = 'block';
        document.getElementById('add-product-form').reset();
        document.getElementById('add-product-modal-title').textContent = 'Adicionar Produto';
    }
}

// Fechar modal de adicionar produto
function closeAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    const form = document.getElementById('add-product-form');
    if (modal) {
        modal.style.display = 'none';
        if (form) {
            form.reset();
            form.dataset.editId = '';
            document.getElementById('add-product-modal-title').textContent = 'Adicionar Produto';
        }
    }
}

// Mostrar modal de editar produto
async function showEditProductForm(productId) {
    const session = getSession();
    if (!session || !session.token) {
        showProductMessage('Você precisa estar logado como vendedor para editar produtos.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${PRODUCTS_ENDPOINT}?id=${productId}`);
        const result = await response.json();
        
        if (!result.success || !result.data) {
            showProductMessage('Erro ao carregar produto para edição.', 'error');
            return;
        }
        
        const product = result.data;
        const form = document.getElementById('add-product-form');
        
        // Preencher formulário
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('product-image-url').value = product.image_url || '';
        document.getElementById('product-stock').value = product.stock || 0;
        document.getElementById('product-category').value = product.category || '';
        
        // Atualizar título do modal
        document.getElementById('add-product-modal-title').textContent = 'Editar Produto';
        
        // Armazenar ID do produto sendo editado
        form.dataset.editId = productId;
        
        // Mostrar modal
        const modal = document.getElementById('add-product-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao carregar produto:', error);
        showProductMessage('Erro ao carregar produto para edição.', 'error');
    }
}

// Criar ou atualizar produto
async function handleSaveProduct(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productData = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: formData.get('price'),
        image_url: formData.get('image_url') || null,
        stock: formData.get('stock') || 0,
        category: formData.get('category') || null
    };
    
    // Validações
    if (!productData.name || !productData.description || !productData.price) {
        showProductMessage('Nome, descrição e preço são obrigatórios.', 'error');
        return;
    }
    
    const price = parseFloat(productData.price);
    if (isNaN(price) || price <= 0) {
        showProductMessage('O preço deve ser um valor maior que zero.', 'error');
        return;
    }
    
    const session = getSession();
    if (!session || !session.token) {
        showProductMessage('Você precisa estar logado para salvar produtos.', 'error');
        return;
    }
    
    const isEditing = event.target.dataset.editId;
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing 
        ? `${PRODUCTS_ENDPOINT}?id=${isEditing}`
        : PRODUCTS_ENDPOINT;
    
    try {
        showProductMessage(isEditing ? 'Atualizando produto...' : 'Criando produto...', 'info');
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.token}`
            },
            body: JSON.stringify({
                ...productData,
                token: session.token
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showProductMessage(
                isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!', 
                'success'
            );
            closeAddProductModal();
            
            // Limpar ID de edição
            event.target.dataset.editId = '';
            
            // Recarregar produtos
            await displayVendorProducts();
            
            // Atualizar contagem no card
            const products = await loadVendorProducts();
            updateProductsCard(products);
        } else {
            showProductMessage('Erro ao salvar produto: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        showProductMessage('Erro ao salvar produto. Tente novamente.', 'error');
    }
}

// Deletar produto
async function deleteProduct(productId) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
        return;
    }
    
    const session = getSession();
    if (!session || !session.token) {
        showProductMessage('Você precisa estar logado para excluir produtos.', 'error');
        return;
    }
    
    try {
        showProductMessage('Excluindo produto...', 'info');
        
        const response = await fetch(`${PRODUCTS_ENDPOINT}?id=${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${session.token}`
            },
            body: JSON.stringify({
                token: session.token
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showProductMessage('Produto excluído com sucesso!', 'success');
            await displayVendorProducts();
            
            // Atualizar contagem no card
            const products = await loadVendorProducts();
            updateProductsCard(products);
        } else {
            showProductMessage('Erro ao excluir produto: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        showProductMessage('Erro ao excluir produto. Tente novamente.', 'error');
    }
}

// Atualizar card de produtos no dashboard
function updateProductsCard(products) {
    const productsCard = document.querySelector('#vendor-dashboard .dashboard-card:first-child p');
    if (productsCard && products.length === 0) {
        productsCard.textContent = 'Nenhum produto cadastrado ainda.';
    } else if (productsCard) {
        productsCard.textContent = `${products.length} produto(s) cadastrado(s).`;
    }
}

// Mostrar interface de gerenciar produtos
function showManageProducts() {
    const session = getSession();
    if (!session || !session.token || session.user.account_type !== 'vendedor') {
        showProductMessage('Apenas vendedores podem gerenciar produtos.', 'error');
        return;
    }
    
    // Esconder cards do dashboard
    const dashboardContent = document.querySelector('#vendor-dashboard .dashboard-content');
    if (dashboardContent) {
        dashboardContent.style.display = 'none';
    }
    
    // Mostrar área de gerenciamento
    let manageArea = document.getElementById('manage-products-area');
    if (!manageArea) {
        // Criar área de gerenciamento se não existir
        manageArea = document.createElement('div');
        manageArea.id = 'manage-products-area';
        manageArea.className = 'manage-products-area';
        
        const dashboardHeader = document.querySelector('#vendor-dashboard .dashboard-header');
        if (dashboardHeader && dashboardHeader.parentNode) {
            dashboardHeader.parentNode.insertBefore(manageArea, dashboardHeader.nextSibling);
        }
    }
    
    manageArea.innerHTML = `
        <div class="manage-products-header">
            <h3>Gerenciar Produtos</h3>
            <button class="back-to-dashboard-btn" onclick="showVendorDashboard()">← Voltar ao Dashboard</button>
        </div>
        <div class="manage-products-actions">
            <button class="add-product-btn" onclick="showAddProductForm()">+ Adicionar Novo Produto</button>
        </div>
        <div id="vendor-products-list" class="vendor-products-list">
            <p style="text-align: center; color: #666; margin: 2rem 0;">Carregando produtos...</p>
        </div>
    `;
    
    manageArea.style.display = 'block';
    
    // Carregar e exibir produtos
    displayVendorProducts();
}

// Voltar para o dashboard do vendedor
function showVendorDashboard() {
    const manageArea = document.getElementById('manage-products-area');
    if (manageArea) {
        manageArea.style.display = 'none';
    }
    
    const dashboardContent = document.querySelector('#vendor-dashboard .dashboard-content');
    if (dashboardContent) {
        dashboardContent.style.display = 'grid';
    }
}

// Fechar modal ao clicar fora
window.addEventListener('click', function(event) {
    const addProductModal = document.getElementById('add-product-modal');
    if (event.target === addProductModal) {
        closeAddProductModal();
    }
});

// Inicializar quando o dashboard do vendedor for exibido
function initVendorProducts() {
    const vendorDashboard = document.getElementById('vendor-dashboard');
    if (vendorDashboard && vendorDashboard.style.display === 'block') {
        displayVendorProducts();
    }
}

// Observar mudanças no dashboard
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const vendorDashboard = document.getElementById('vendor-dashboard');
            if (vendorDashboard && vendorDashboard.style.display === 'block') {
                displayVendorProducts();
            }
        }
    });
});

// Observar o dashboard quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        const vendorDashboard = document.getElementById('vendor-dashboard');
        if (vendorDashboard) {
            observer.observe(vendorDashboard, { attributes: true, attributeFilter: ['style'] });
        }
    });
} else {
    const vendorDashboard = document.getElementById('vendor-dashboard');
    if (vendorDashboard) {
        observer.observe(vendorDashboard, { attributes: true, attributeFilter: ['style'] });
    }
}

