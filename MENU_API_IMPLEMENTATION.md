# Implementação da API de Menus

Este documento descreve a implementação completa da funcionalidade de gerenciamento de menus dinâmicos.

## Arquivos Criados

### 1. API Service (`src/services/ApiMenus.js`)
- **getMenus()** - Buscar todos os menus
- **getMenuById(id)** - Buscar menu por ID
- **createMenu(menuData)** - Criar novo menu
- **updateMenu(id, menuData)** - Atualizar menu existente
- **deleteMenu(id)** - Deletar menu
- **getMenusByPermission(permission)** - Buscar menus por permissão
- **reorderMenus(menuOrder)** - Reordenar menus

### 2. Página de Gerenciamento (`src/pages/MenusPage.js`)
- Listagem hierárquica de menus
- Filtros por busca e permissão
- Paginação
- Ações de editar e deletar
- Integração com sistema de permissões

### 3. Modal de Cadastro (`src/components/ModalCadastroMenu.js`)
- Formulário para criar/editar menus
- Validação de campos
- Suporte a submenus
- Controle de permissões
- Integração com sistema de permissões

### 4. Estilos (`src/styles/Menus.css`)
- Design responsivo
- Hierarquia visual para submenus
- Componentes estilizados
- Animações e transições

### 5. Integração (`src/config/menuIntegration.js`)
- Hook para carregar menus dinamicamente
- Filtros baseados em permissões
- Exemplos de integração
- Fallback para menu estático

## Estrutura de Dados do Menu

```javascript
{
  id: string,           // ID único do menu
  label: string,        // Texto exibido no menu
  path?: string,        // Rota (opcional)
  permission?: string | string[], // Permissão(ões) necessárias
  visible?: boolean,    // Se o menu está visível
  parentId?: string,    // ID do menu pai (para submenus)
  order?: number,       // Ordem de exibição
  icon?: string,        // Ícone do menu
  submenu?: MenuItem[]  // Submenus (gerado automaticamente)
}
```

## Como Integrar

### 1. Adicionar Rota no App.js

```javascript
import MenusPage from './pages/MenusPage';

// Adicionar na lista de rotas
{
  path: '/menus',
  element: <MenusPage />,
  permission: 'menus'
}
```

### 2. Adicionar ao Menu Principal

```javascript
// Em src/config/menus.jsx ou onde o menu é definido
{
  label: "Cadastros",
  children: [
    // ... outros itens
    { label: "Menus", path: "/menus" }
  ]
}
```

### 3. Configurar Permissões

Adicione as seguintes permissões no sistema:

```javascript
// Para o grupo de acesso apropriado
{
  pagename: 'menus',
  view: true,
  insert: true,
  edit: true,
  delete: true
}
```

### 4. Usar Menus Dinâmicos (Opcional)

Para substituir o menu estático por um dinâmico:

```javascript
import { useDynamicMenus, filterMenusByPermissions } from './config/menuIntegration';

const Layout = () => {
  const { menus, loading } = useDynamicMenus();
  const { permissions } = useAuth();
  
  const filteredMenus = filterMenusByPermissions(menus, permissions);
  
  // Renderizar menus filtrados
};
```

## Endpoints da API Backend

A implementação espera os seguintes endpoints no backend:

### GET /menus
Retorna todos os menus
```json
[
  {
    "id": "1",
    "label": "Home",
    "path": "/home",
    "permission": "home",
    "visible": true,
    "order": 1
  }
]
```

### GET /menus/:id
Retorna um menu específico

### POST /menus
Cria um novo menu
```json
{
  "label": "Novo Menu",
  "path": "/novo-menu",
  "permission": "view",
  "visible": true,
  "order": 1
}
```

### PUT /menus/:id
Atualiza um menu existente

### DELETE /menus/:id
Remove um menu

### GET /menus/permission/:permission
Retorna menus filtrados por permissão

### PUT /menus/reorder
Reordena os menus
```json
{
  "menuOrder": [
    { "id": "1", "order": 1 },
    { "id": "2", "order": 2 }
  ]
}
```

## Funcionalidades Implementadas

### ✅ CRUD Completo
- Criar, ler, atualizar e deletar menus
- Validação de dados
- Tratamento de erros

### ✅ Hierarquia de Menus
- Suporte a submenus
- Visualização hierárquica
- Controle de menu pai

### ✅ Sistema de Permissões
- Integração com sistema existente
- Filtros baseados em permissões
- Controle de acesso

### ✅ Interface Responsiva
- Design moderno e limpo
- Funciona em dispositivos móveis
- Animações suaves

### ✅ Filtros e Busca
- Busca por texto
- Filtro por permissão
- Paginação

### ✅ Validações
- Campos obrigatórios
- Validação de permissões
- Prevenção de loops hierárquicos

## Próximos Passos

1. **Implementar Backend**: Criar os endpoints da API no backend
2. **Testes**: Adicionar testes unitários e de integração
3. **Drag & Drop**: Implementar reordenação por arrastar e soltar
4. **Cache**: Implementar cache para melhor performance
5. **Auditoria**: Adicionar logs de alterações nos menus

## Considerações de Segurança

- Todas as operações são protegidas por permissões
- Validação de dados no frontend e backend
- Sanitização de inputs
- Controle de acesso baseado em roles

## Suporte

Para dúvidas ou problemas, consulte:
- Documentação da API
- Logs do console do navegador
- Sistema de permissões existente
