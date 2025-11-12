# Virada ENEM

Uma plataforma moderna de preparação para o ENEM com AI, simulados interativos e pagamentos via PIX.

## 🚀 Features

- **Autenticação**: Cadastro e login seguro
- **Exercícios Práticos**: Banco de questões randomizado (Matemática e Ciências)
- **Mini Simulados**: Testes de 10 questões com timer
- **Resumos Rápidos**: Material de revisão estruturado por tópico
- **Tutor IA**: Assistente com Google Generative AI para tirar dúvidas
- **Ranking**: Competição com outros usuários
- **Pagamento PIX**: Integração mock (pronto para PSP real)

## 📋 Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **AI**: Google Generative AI
- **Banco de Dados**: localStorage (cliente) + arquivo JSON (servidor - dev)
- **Build**: Vite

## 🛠️ Setup Local

### 1. Clonar e instalar dependências

```bash
git clone <repo-url>
cd enem
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (use `.env.example` como referência):

```bash
cp .env.example .env
```

Edite `.env` e adicione sua chave do Google Generative AI:
```
SERVER_API_KEY=sua_chave_google_aqui
PORT=4000
```

Obtenha uma chave gratuita em: https://ai.google.dev/

### 3. Iniciar o servidor e frontend

**Terminal 1 - Servidor (porta 4000):**
```bash
node server.js
```

**Terminal 2 - Frontend (porta 3000):**
```bash
npm run dev
```

Abra http://localhost:3000 no navegador.

## 📝 Estrutura de Pastas

```
enem/
├── index.tsx              # Entrada React
├── App.tsx                # Componente principal (SPA)
├── index.html             # HTML template
├── server.js              # Servidor Express (API + chat)
├── package.json           # Dependências
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
├── .env.example           # Exemplo de variáveis
├── .gitignore             # Git ignore rules
├── data/                  # Dados locais (dev)
│   ├── payments.json      # Mock charges
│   └── users-server.json  # Subscrições (servidor)
└── README.md              # Este arquivo
```

## 🎮 Fluxo de Uso

1. **Cadastro/Login**: Crie uma conta ou entre com credenciais
2. **Quiz Inicial**: Responda questões sobre seu perfil (opcional)
3. **Assinatura**: Escolha um plano e simule pagamento PIX
4. **Dashboard**: Acesse exercícios, simulados e chat IA
5. **Estude**: Pratique e acompanhe progresso em tempo real

## 💳 Pagamento PIX (Mock para Desenvolvimento)

O modal de pagamento permite:
- Ver o QR code gerado
- Copiar o copia-e-cola
- Simular pagamento (botão "Verificar")
- Confirmar assinatura após "pagamento"

**Para produção**: Integre com um PSP real (Gerencianet, Mercado Pago, Pagar.me).

## 🔐 Segurança

⚠️ **IMPORTANTE**: Nunca commite `.env` ou arquivos com chaves sensíveis.

- `.env` está em `.gitignore`
- Use `.env.example` como template
- Rotacione chaves expostas imediatamente
- Em produção: use HTTPS, webhooks assinados, variáveis de ambiente do host

## 📦 Dependências Principais

- `react`, `react-dom` - UI
- `recharts` - Gráficos
- `express`, `cors`, `dotenv` - Servidor
- `@google/generative-ai` - Tutor IA
- `tailwind` - CSS (via CDN)

## 🚀 Deploy

### Frontend (Vercel, Netlify, GitHub Pages)

```bash
npm run build
# Deploy o conteúdo de `dist/`
```

### Servidor (Heroku, Railway, AWS, etc.)

Defina a variável `SERVER_API_KEY` no painel do host e faça deploy de `server.js`.

## 📄 Licença

MIT

## 📞 Suporte

Dúvidas? Abra uma issue no GitHub.

---

Desenvolvido com ❤️ para ajudar você a virar o jogo no ENEM!
