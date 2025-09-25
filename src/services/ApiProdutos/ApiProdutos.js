import api from '../../services/api';


// Funções para gerenciar Clientes
export const getProdutosSold = async ({ page = 1, limit = 10, ...filters } = {}) => {
    try {
        const response = await api.get('/produtos/sold', {
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


export const getProdutosUpdate = async ({ page = 1, limit = 10, ...filters } = {}) => {
    try {
        const response = await api.get('/produtosRouter/produtos-update', {
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
}