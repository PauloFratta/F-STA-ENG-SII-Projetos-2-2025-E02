# Backend NativaStore - Sistema de Autenticação

## Instalação e Configuração

### 1. Configurar XAMPP
- Certifique-se de que o XAMPP está rodando (Apache e MySQL)
- Acesse o phpMyAdmin: http://localhost/phpmyadmin

### 2. Criar Banco de Dados
1. No phpMyAdmin, crie um novo banco de dados chamado `nativastore`
2. Execute o script SQL localizado em `php/database/schema.sql`
3. O script criará as tabelas necessárias e inserirá usuários de teste

### 3. Configurar Banco de Dados
- Edite o arquivo `php/config/database.php` se necessário
- Configurações padrão para XAMPP:
  - Host: localhost
  - Database: nativastore
  - Username: root
  - Password: (vazio)

### 4. Testar a API
- Acesse: http://localhost/F-STA-ENG-SII-Projetos-2-2025-E02/php/api/auth.php
- Deve retornar um erro "Ação não reconhecida" (isso é normal)

## Usuários de Teste

O sistema inclui usuários de teste pré-cadastrados:

### Cliente
- Email: cliente@teste.com
- Senha: 123456

### Vendedor
- Email: vendedor@teste.com
- Senha: 123456
- Loja: Loja Teste

## Estrutura da API

### Endpoint: /php/api/auth.php

#### Cadastro (POST)
```json
{
  "action": "register",
  "name": "Nome do Usuário",
  "email": "email@exemplo.com",
  "password": "senha123",
  "accountType": "cliente",
  "storeName": "Nome da Loja", // apenas para vendedores
  "storeDocument": "12345678000195", // apenas para vendedores
  "storeDescription": "Descrição da loja" // apenas para vendedores
}
```

#### Login (POST)
```json
{
  "action": "login",
  "email": "email@exemplo.com",
  "password": "senha123"
}
```

#### Validar Sessão (POST)
```json
{
  "action": "validate",
  "token": "token_da_sessao"
}
```

#### Logout (POST)
```json
{
  "action": "logout",
  "token": "token_da_sessao"
}
```

## Resposta da API

### Sucesso
```json
{
  "success": true,
  "message": "Mensagem de sucesso",
  "data": { ... }
}
```

### Erro
```json
{
  "success": false,
  "message": "Mensagem de erro"
}
```

## Segurança

- Senhas são hasheadas usando `password_hash()`
- Tokens de sessão são gerados aleatoriamente
- Sessões expiram em 24 horas
- Validação de email e senha no servidor
- Proteção contra SQL injection usando prepared statements
