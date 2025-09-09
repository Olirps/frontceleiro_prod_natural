# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Auditoria de Segurança e Melhores Práticas (Frontend)

Abaixo um resumo objetivo das vulnerabilidades e oportunidades de melhoria identificadas no frontend, seguido de recomendações práticas.

### Vulnerabilidades e Riscos

- Exposição de endpoints por configuração hardcoded:
  - `src/services/api.js` define `ambiente` e `baseURL` diretamente no código, incluindo um IP interno (`http://192.168.3.108:3001/api`). Isso dificulta o deploy seguro e pode vazar informações de rede.
  - Recomendação: utilizar variáveis de ambiente (`process.env.REACT_APP_API_URL`) e `REACT_APP_ENV` para alternar ambientes.

- Token JWT em `localStorage` sem rotação/expiração ativa:
  - `src/context/AuthContext.js` lê e persiste `authToken` em `localStorage`. Isso permite persistência pós-XSS e não trata expiração/refresh.
  - Recomendação: preferir `httpOnly secure cookies` emitidos pelo backend; se mantiver `localStorage`, implementar: verificação de expiração ao carregar, logout automático, e refresh token com interceptors.

- Decodificação manual de JWT sem validações:
  - `src/utils/functions.js` implementa `decodeJWT` com `atob` e sem validação de assinatura/expiração.
  - Recomendação: usar biblioteca bem testada (ex.: `jwt-decode`) apenas para leitura e sempre checar `exp`/`nbf` antes de usar claims.

- Permissões frágeis no client:
  - `src/components/PrivateRoute.js` usa `user?.permissoes[requiredPermission]`. Não há fallback seguro e pode quebrar caso `permissoes` seja objeto/array diferente.
  - Recomendação: normalizar estrutura de permissões, validar presença e fazer negação explícita; garantir enforcement no backend (o client é só UX).

- Imports de bibliotecas via CDN no `public/index.html`:
  - React/ReactDOM/Babel e Tailwind via CDN sem SRI (Subresource Integrity).
  - Recomendação: remover CDN e usar dependências do `package.json` (build bundlado). Se mantiver CDN, adicionar atributos `integrity` e `crossorigin`.

- Possível vazamento de dados em logs de erro:
  - Múltiplas funções em `src/services/api.js` fazem `console.error(error.response?.data || error.message)`, potencialmente logando dados sensíveis.
  - Recomendação: sanitizar mensagens de erro e padronizar logging no client para não exibir payloads.

- Falta de política de Content Security Policy (CSP):
  - `public/index.html` não define cabeçalho/meta CSP, aumentando risco de XSS quando combinado com token em `localStorage`.
  - Recomendação: configurar CSP no servidor; se necessário, adicionar `<meta http-equiv="Content-Security-Policy" ...>` durante desenvolvimento.

- Ausência de bloqueio CSRF (se usar cookies futuramente):
  - Se migrar token para `cookies`, será necessário CSRF token/header.

### Melhores Práticas e Manutenibilidade

- Centralizar configuração da API:
  - Criar `src/config/env.js` que leia `REACT_APP_API_URL`, `REACT_APP_ENV` e exporte `API_URL`.

- Axios interceptors:
  - Adicionar interceptor para anexar token, lidar com 401/403 (logout/refresh), e mapeamento uniforme de erros.

- Tipagem básica e contratos:
  - Padronizar respostas (`{ data, pagination }`) e criar helpers para paginação; considerar TypeScript para reduzir erros em endpoints.

- Validações e tratamento de erros consistentes:
  - Hoje há padrões diferentes (ora retorna `response`, ora `response.data`). Uniformizar para evitar bugs.

- Estrutura de permissões:
  - Definir shape único (ex.: objeto com booleans) e util `hasPermission(user, 'feature.action')`.

- Build hygiene:
  - Remover `frontappcarros: file:` de `package.json`.
  - Evitar dependências UMD via CDN e `@babel/standalone` em produção.

- i18n e textos:
  - Mensagens de erro em `alert()` podem vazar detalhes; preferir componente de notificação padronizado.

### Recomendações de Implementação (passo a passo)

1) Variáveis de ambiente
```
// .env
REACT_APP_API_URL=https://celeiro.sessoftware.com.br/api
REACT_APP_ENV=production
```
Edite `src/services/api.js` para ler `process.env.REACT_APP_API_URL`.

2) Interceptors Axios
```
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('authToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status;
    if (status === 401) { /* logout/refresh */ }
    return Promise.reject(sanitizeError(err));
  }
);
```

3) Auth e permissões
- Checar expiração do token em `AuthContext` na inicialização.
- Normalizar permissões e usar helper `hasPermission` no `PrivateRoute`.

4) CSP e remoção de CDNs
- Remover `<script>`s CDN e construir com CRA.
- Configurar CSP no servidor (default-src 'self'; connect-src 'self' API_URL; ...).

5) Logging seguro
- Substituir `console.error` com função que remove payloads sensíveis.

6) Documentação de endpoints
- Padronizar retorno em todas as funções de `api.js` para reduzir ifs e erros em telas.

---

Se quiser, posso aplicar essas alterações em PRs pequenos e progressivos (env/config, interceptors, PrivateRoute/permissions, remoção de CDNs e CSP, sanitização de erros).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
