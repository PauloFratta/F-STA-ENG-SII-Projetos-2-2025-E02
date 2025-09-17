# Sistema de Autenticação - NativaStore

## 📋 Funcionalidades Implementadas

### ✅ Página de Login e Signup
- **Tela inicial de escolha**: Permite ao usuário escolher entre Login ou Criar Conta
- **Interface intuitiva**: Design moderno e responsivo
- **Navegação fluida**: Transições suaves entre telas

### ✅ Cadastro (Sign Up)
- **Tipos de conta**: Cliente e Vendedor
- **Campos obrigatórios**:
  - Nome completo
  - E-mail
  - Senha (mínimo 6 caracteres)
  - Confirmar senha
- **Campos específicos para vendedores**:
  - Nome da loja
  - CNPJ/CPF
  - Descrição da loja

### ✅ Login (Sign In)
- **Formulário simples**: E-mail e senha
- **Suporte a ambos os tipos**: Cliente e Vendedor
- **Redirecionamento inteligente**:
  - Cliente → Dashboard do Cliente
  - Vendedor → Dashboard do Vendedor

### ✅ Validações Implementadas
- **Senha**: Mínimo 6 caracteres
- **E-mail**: Formato válido e único
- **CNPJ/CPF**: Validação de formato (11 ou 14 dígitos)
- **Confirmação de senha**: Verificação de coincidência
- **Campos obrigatórios**: Validação de preenchimento

### ✅ Banco de Dados (Simulação)
- **LocalStorage**: Armazenamento local dos usuários
- **Estrutura de dados**: Preparada para diferenciar tipos de conta
- **Relacionamentos**: Base para produtos vinculados a vendedores
- **Persistência**: Dados mantidos entre sessões

### ✅ Dashboards Específicos

#### Dashboard do Cliente
- **Informações pessoais**: Nome e dados da conta
- **Seções**:
  - Meus Pedidos
  - Favoritos
  - Meu Perfil
- **Navegação**: Botão para voltar ao site principal

#### Dashboard do Vendedor
- **Informações da loja**: Nome, descrição, documento
- **Seções**:
  - Meus Produtos (com botão para adicionar)
  - Vendas e Relatórios
  - Configurações da Loja
- **Navegação**: Botão para voltar ao site principal

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos com gradientes e animações
- **JavaScript**: Lógica de autenticação e validações
- **LocalStorage**: Simulação de banco de dados

## 📁 Estrutura de Arquivos

```
projeto/
├── index.html              # Página principal com sistema de auth
├── styles/
│   └── globals.css         # Estilos globais + sistema de auth
├── js/
│   └── auth.js            # Lógica de autenticação
└── README_AUTH.md         # Esta documentação
```

## 🚀 Como Usar

### 1. Acesso ao Sistema
- Clique em "Cadastrar" ou "Entrar" na navbar
- Escolha a opção desejada na tela inicial

### 2. Cadastro
- Preencha os dados básicos
- Selecione "Vendedor" para ver campos adicionais
- Complete todos os campos obrigatórios
- Confirme o cadastro

### 3. Login
- Insira e-mail e senha
- Sistema redireciona automaticamente para o dashboard apropriado

### 4. Navegação
- **Clientes**: Podem voltar ao site principal a qualquer momento
- **Vendedores**: Dashboard dedicado para gerenciar produtos e vendas

## 🔒 Segurança

### Implementado
- Validação de formato de e-mail
- Verificação de unicidade de e-mail
- Validação de senha mínima
- Confirmação de senha
- Validação de CNPJ/CPF

### Para Produção (Recomendações)
- Hash de senhas (bcrypt, scrypt, etc.)
- Tokens JWT para sessões
- HTTPS obrigatório
- Rate limiting para tentativas de login
- Validação server-side
- Sanitização de inputs

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop
- Tablet
- Mobile

## 🔮 Funcionalidades Futuras

### Preparado para Implementação
- Sistema de produtos para vendedores
- Carrinho de compras
- Sistema de pedidos
- Relatórios de vendas
- Edição de perfil
- Recuperação de senha
- Notificações

### Estrutura de Dados Preparada
```javascript
// Usuário Cliente
{
  id: "timestamp",
  name: "Nome Completo",
  email: "email@exemplo.com",
  password: "senha123",
  accountType: "cliente",
  createdAt: "2024-01-01T00:00:00.000Z"
}

// Usuário Vendedor
{
  id: "timestamp",
  name: "Nome Completo",
  email: "email@exemplo.com", 
  password: "senha123",
  accountType: "vendedor",
  storeName: "Nome da Loja",
  storeDocument: "12345678901",
  storeDescription: "Descrição da loja",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

## 🎨 Design

- **Cores**: Paleta verde sustentável (#2d5016, #4a9d3a)
- **Tipografia**: Inter (Google Fonts)
- **Animações**: Transições suaves e efeitos hover
- **Layout**: Grid responsivo e flexbox
- **UX**: Interface intuitiva com feedback visual

## 📞 Suporte

Para dúvidas ou melhorias, o sistema está preparado para expansão e pode ser facilmente integrado com:
- Backend em Node.js, Python, PHP, etc.
- Bancos de dados relacionais (MySQL, PostgreSQL)
- Sistemas de autenticação externos (OAuth, Firebase)
- Frameworks frontend (React, Vue, Angular)
