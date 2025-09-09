import api from '../services/api';

// Estrutura esperada do backend para cada item de menu:
// {
//   id: string,
//   label: string,
//   path?: string,
//   permission?: string | string[],
//   visible?: boolean, // opcional: controle de exibição pelo backend
//   submenu?: MenuItem[]
// }

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


