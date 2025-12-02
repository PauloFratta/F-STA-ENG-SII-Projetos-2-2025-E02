# Funcionalidade de Produtos para Vendedores - NativaStore

## Resumo

Foi implementada a funcionalidade completa de gerenciamento de produtos para vendedores. Quando um usuário fizer login como vendedor, os botões "Adicionar Produto" e "Gerenciar Produtos" na aba "Início" (dashboard do vendedor) estão agora totalmente funcionais.

## Arquivos Criados/Modificados

### Novos Arquivos:
1. **php/database/add_products_table.sql** - Script SQL para criar a tabela de produtos
2. **php/api/products.php** - API REST completa para CRUD de produtos
3. **js/products.js** - JavaScript com todas as funções de gerenciamento de produtos

### Arquivos Modificados:
1. **index.html** - Adicionado modal de produtos e scripts necessários
2. **produtos.html** - Adicionado modal de produtos e scripts necessários
3. **js/auth.js** - Removida função placeholder e atualizada função showMainSite
4. **styles/globals.css** - Adicionados estilos para interface de gerenciamento de produtos

## Instalação

### 1. Criar Tabela no Banco de Dados

Execute o script SQL no phpMyAdmin:
```sql
-- Acesse: http://localhost/phpmyadmin
-- Selecione o banco: nativastore
-- Execute o script: php/database/add_products_table.sql
```

Ou copie e cole o conteúdo do arquivo diretamente no phpMyAdmin.

### 2. Verificar Configuração

O sistema usa as mesmas configurações de banco de dados já existentes em `php/config/database.php`.

## Funcionalidades Implementadas

### Para Vendedores:

1. **Adicionar Produto**
   - Botão "Adicionar Produto" abre um modal com formulário completo
   - Campos: Nome, Descrição, Preço, URL da Imagem (opcional), Estoque, Categoria (opcional)
   - Validação de campos obrigatórios
   - Validação de preço (deve ser maior que zero)

2. **Gerenciar Produtos**
   - Botão "Gerenciar Produtos" mostra interface completa de gerenciamento
   - Lista todos os produtos do vendedor
   - Exibe: Nome, Descrição, Preço, Estoque, Imagem
   - Possibilidade de editar cada produto
   - Possibilidade de excluir cada produto (com confirmação)

3. **Editar Produto**
   - Clique no botão "Editar" em qualquer produto
   - Abre o mesmo modal, mas pré-preenchido com os dados do produto
   - Permite atualizar qualquer campo
   - Salva as alterações na API

4. **Excluir Produto**
   - Clique no botão "Excluir" em qualquer produto
   - Solicita confirmação antes de excluir
   - Remove o produto do banco de dados

5. **Visualização no Dashboard**
   - Lista resumida dos produtos no card "Meus Produtos"
   - Contador de produtos cadastrados

## Como Usar

1. **Faça login como vendedor:**
   - Email: vendedor@teste.com
   - Senha: 123456

2. **No Dashboard do Vendedor:**
   - Clique em "Adicionar Produto" para criar um novo produto
   - Clique em "Gerenciar Produtos" para ver, editar ou excluir produtos existentes

3. **Adicionar Produto:**
   - Preencha o formulário no modal
   - Nome, Descrição e Preço são obrigatórios
   - Clique em "Salvar Produto"

4. **Gerenciar Produtos:**
   - Visualize todos os seus produtos em uma lista
   - Use "Editar" para modificar um produto
   - Use "Excluir" para remover um produto

## Estrutura da API

### Endpoints Disponíveis:

- **GET** `/php/api/products.php` - Listar todos os produtos
- **GET** `/php/api/products.php?vendor_id=X` - Listar produtos de um vendedor específico
- **GET** `/php/api/products.php?id=X` - Buscar produto específico
- **POST** `/php/api/products.php` - Criar novo produto (requer autenticação)
- **PUT** `/php/api/products.php?id=X` - Atualizar produto (requer autenticação)
- **DELETE** `/php/api/products.php?id=X` - Deletar produto (requer autenticação)

### Formato de Dados:

#### Criar/Atualizar Produto:
```json
{
  "name": "Nome do Produto",
  "description": "Descrição detalhada",
  "price": 99.90,
  "image_url": "https://exemplo.com/imagem.jpg",
  "stock": 10,
  "category": "Categoria",
  "token": "token_de_autenticacao"
}
```

## Segurança

- Apenas vendedores autenticados podem criar, editar ou excluir produtos
- Cada vendedor só pode gerenciar seus próprios produtos
- Validação de token de sessão em todas as operações
- Validação de dados no frontend e backend
- Proteção contra XSS (escape de HTML)

## Responsividade

A interface é totalmente responsiva e funciona bem em:
- Desktop
- Tablets
- Smartphones

## Observações

- As imagens dos produtos devem ser URLs válidas (não há upload de arquivos ainda)
- O sistema valida que apenas vendedores podem criar produtos
- Produtos podem ser editados e excluídos apenas pelo vendedor que os criou
- A lista de produtos é atualizada automaticamente após criar, editar ou excluir

## Próximos Passos (Sugestões)

- Upload de imagens de produtos
- Fotos múltiplas por produto
- Busca e filtros de produtos
- Categorias pré-definidas
- Integração com sistema de vendas
- Relatórios de produtos mais vendidos

