import api from '../services/api';

// Estrutura esperada do backend para cada item de menu:
// {
//   id: string,
//   label: string,
//   path?: string,
//   permission?: string | string[],
//   visible?: boolean, // opcional: controle de exibição pelo backend
//   submenu?: MenuItem[],
//   parentId?: string, // para submenus
//   order?: number, // ordem de exibição
//   icon?: string // ícone do menu
// }

// Buscar todos os menus
export const getMenus = async () => {
  try {
    const response = await api.get('/menus');
    // Espera response.data como array de menus
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Erro ao buscar menus:', error.response?.data || error.message);
    throw error;
  }
};

// Buscar menu por ID
export const getMenuById = async (id) => {
  try {
    const response = await api.get(`/menus/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar menu por ID:', error.response?.data || error.message);
    throw error;
  }
};

// Criar novo menu
export const createMenu = async (menuData) => {
  try {
    const response = await api.post('/menus', menuData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar menu:', error.response?.data || error.message);
    throw error;
  }
};

// Atualizar menu existente
export const updateMenu = async (id, menuData) => {
  try {
    const response = await api.put(`/menus/${id}`, menuData);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar menu:', error.response?.data || error.message);
    throw error;
  }
};

// Deletar menu
export const deleteMenu = async (id) => {
  try {
    const response = await api.delete(`/menus/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar menu:', error.response?.data || error.message);
    throw error;
  }
};

// Buscar menus por permissão
export const getMenusByPermission = async (permission) => {
  try {
    const response = await api.get(`/menus/permission/${permission}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Erro ao buscar menus por permissão:', error.response?.data || error.message);
    throw error;
  }
};

// Reordenar menus
export const reorderMenus = async (menuOrder) => {
  try {
    const response = await api.put('/menus/reorder', { menuOrder });
    return response.data;
  } catch (error) {
    console.error('Erro ao reordenar menus:', error.response?.data || error.message);
    throw error;
  }
};


