// Exemplo de integração da API de menus com o sistema existente
// Este arquivo mostra como integrar a nova funcionalidade de menus dinâmicos

import { getMenus } from '../services/ApiMenus';

/**
 * Hook personalizado para carregar menus dinamicamente da API
 * Substitui o menu estático por um dinâmico baseado na API
 */
export const useDynamicMenus = () => {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadMenus = async () => {
            try {
                setLoading(true);
                const apiMenus = await getMenus();
                setMenus(apiMenus);
            } catch (err) {
                console.error('Erro ao carregar menus:', err);
                setError(err);
                // Fallback para menu estático em caso de erro
                setMenus(getStaticMenus());
            } finally {
                setLoading(false);
            }
        };

        loadMenus();
    }, []);

    return { menus, loading, error };
};

/**
 * Menu estático como fallback
 * Pode ser removido quando a API estiver totalmente implementada
 */
const getStaticMenus = () => [
    {
        id: 'home',
        label: 'Home',
        path: '/home',
        permission: 'home',
        visible: true,
        order: 1
    },
    {
        id: 'cadastros',
        label: 'Cadastros',
        permission: ['permissoes', 'clientes', 'funcionarios', 'fornecedores', 'produtos'],
        visible: true,
        order: 2,
        submenu: [
            {
                id: 'permissoes',
                label: 'Permissões',
                path: '/permissoes',
                permission: 'permissoes',
                visible: true,
                order: 1
            },
            {
                id: 'menus',
                label: 'Menus',
                path: '/menus',
                permission: 'menus',
                visible: true,
                order: 2
            },
            {
                id: 'empresas',
                label: 'Empresas',
                path: '/empresas',
                permission: 'empresas',
                visible: true,
                order: 3
            }
        ]
    }
];

/**
 * Função para filtrar menus baseado nas permissões do usuário
 */
export const filterMenusByPermissions = (menus, userPermissions) => {
    return menus.filter(menu => {
        // Se o menu não tem permissão definida, mostrar
        if (!menu.permission) return true;
        
        // Se tem permissão única
        if (typeof menu.permission === 'string') {
            return userPermissions.includes(menu.permission);
        }
        
        // Se tem múltiplas permissões, verificar se tem pelo menos uma
        if (Array.isArray(menu.permission)) {
            return menu.permission.some(perm => userPermissions.includes(perm));
        }
        
        return false;
    }).map(menu => {
        // Recursivamente filtrar submenus
        if (menu.submenu && menu.submenu.length > 0) {
            return {
                ...menu,
                submenu: filterMenusByPermissions(menu.submenu, userPermissions)
            };
        }
        return menu;
    });
};

/**
 * Exemplo de como integrar no componente Layout.js
 * Substitua a importação estática por esta implementação dinâmica
 */
export const MenuIntegrationExample = () => {
    const { menus, loading, error } = useDynamicMenus();
    const { permissions } = useAuth();

    if (loading) {
        return <div>Carregando menus...</div>;
    }

    if (error) {
        console.warn('Usando menu estático devido a erro na API');
    }

    // Filtrar menus baseado nas permissões do usuário
    const filteredMenus = filterMenusByPermissions(menus, permissions);

    return (
        <nav>
            {filteredMenus.map(menu => (
                <MenuItem key={menu.id} menu={menu} />
            ))}
        </nav>
    );
};

/**
 * Exemplo de como adicionar a rota da página de menus no App.js
 */
export const menuRoutes = [
    {
        path: '/menus',
        element: <MenusPage />,
        permission: 'menus'
    }
];

/**
 * Exemplo de como adicionar permissões de menu no sistema de permissões
 */
export const menuPermissions = [
    {
        pagename: 'menus',
        view: true,
        insert: true,
        edit: true,
        delete: true
    }
];
