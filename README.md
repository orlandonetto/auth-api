# Netto Dev Single Sign-On (SSO)

Este projeto é uma implementação de SSO (Single Sign-On) usando Node.js. Ele permite que os usuários se autentiquem em várias aplicações com uma única conta.

## Recursos
- Autenticação de usuários através de login e senha
- Suporte a autenticação multifator
- Suporte a recuperação de senha
- Integração com provedores de autenticação externos, como Google

## Instalação
1. Faça o clone do repositório: `git clone https://github.com/orlandonetto/auth-api.git`
2. Instale as dependências: `npm install`
3. Configure as variáveis de ambiente (veja a seção "Configuração" abaixo)
4. Inicie o servidor: `npm start`

## Configuração
As seguintes variáveis de ambiente devem ser configuradas antes de iniciar o servidor:
- `DATABASE_URL`: URL de conexão com o banco de dados (exemplo: `mongodb://username:password@host:port/database`)
- `SECRET`: Segredo usado para assinar o jwt do usuário
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (opcional): ID e segredo do cliente do Google para autenticação com conta do Google

## Documentação da API
A documentação da API está disponível em `/docs` após o início do servidor.
