import api from '../../services/api';

// Funções para gerenciar Clientes
export const getFluxoCaixa = async ({ page = 1, limit = 10, ...filters } = {}) => {
    try {
        const response = await api.get('/fluxo-caixa', {
            params: {
                page,
                limit,
                ...filters
            }
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        throw error;
    }
};
