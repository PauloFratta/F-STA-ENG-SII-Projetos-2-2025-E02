# Instruções para Testar o Sistema de Autenticação

## 🚀 Passos para Testar

### 1. Configurar o Banco de Dados
1. Abra o XAMPP e inicie o **Apache** e **MySQL**
2. Acesse o phpMyAdmin: http://localhost/phpmyadmin
3. Crie um banco de dados chamado `nativastore`
4. Execute o script SQL localizado em `php/database/schema.sql`

### 2. Testar o Sistema
1. Acesse: http://localhost/F-STA-ENG-SII-Projetos-2-2025-E02/
2. Clique nos botões **"Entrar"** ou **"Cadastrar"** na barra de navegação
3. O modal de autenticação deve aparecer

### 3. Usuários de Teste
**Cliente:**
- Email: `cliente@teste.com`
- Senha: `123456`

**Vendedor:**
- Email: `vendedor@teste.com`
- Senha: `123456`

### 4. Testar a API Separadamente
1. Acesse: http://localhost/F-STA-ENG-SII-Projetos-2-2025-E02/php/test_api.html
2. Use os botões para testar login e cadastro via API

## 🔧 Solução de Problemas

### Se os botões não funcionarem:
1. Abra o **Console do Navegador** (F12)
2. Verifique se há erros em vermelho
3. Verifique se as mensagens de debug aparecem:
   - "Página carregada completamente"
   - "showAuthModal disponível: function"
   - "showAuthForm disponível: function"

### Se o modal não aparecer:
1. Verifique se o arquivo `js/auth.js` está sendo carregado
2. Verifique se não há erros de JavaScript no console
3. Teste com o arquivo `php/test_api.html` para verificar se a API está funcionando

### Se houver erro de conexão com o banco:
1. Verifique se o MySQL está rodando no XAMPP
2. Verifique se o banco `nativastore` foi criado
3. Verifique se as tabelas foram criadas corretamente

## 📁 Arquivos Importantes

- `index.html` - Página principal com os botões
- `js/auth.js` - Sistema de autenticação JavaScript
- `php/api/auth.php` - API de autenticação PHP
- `php/config/database.php` - Configuração do banco
- `php/database/schema.sql` - Script para criar as tabelas

## 🎯 Funcionalidades Testáveis

✅ **Cadastro de Cliente** - Formulário simples  
✅ **Cadastro de Vendedor** - Com dados da loja  
✅ **Login** - Com validação  
✅ **Sistema de Sessões** - Tokens seguros  
✅ **Dashboards** - Diferentes para cliente e vendedor  
✅ **Logout** - Limpeza de sessão  

## 📞 Suporte

Se ainda houver problemas, verifique:
1. Console do navegador para erros
2. Se todos os arquivos estão no local correto
3. Se o XAMPP está rodando corretamente
4. Se o banco de dados foi criado e populado
