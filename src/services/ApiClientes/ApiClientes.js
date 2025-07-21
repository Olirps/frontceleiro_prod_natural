import api from '../../services/api';

// Funções para gerenciar Clientes
export const getClientes = async ({ page = 1, limit = 10, ...filters } = {}) => {
    try {
        const response = await api.get('/find-clientes', {
            params: {
                page,
                limit,
                ...filters
            }
        });
        return response;
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        throw error;
    }
};


export const addCliente = async (cliente) => {
    return api.post('/clientes', cliente);
};

export const updateCliente = async (id, cliente) => {
    return api.put(`/clientes/${id}`, cliente);
};

export const getClienteById = async (id) => {
    return api.get(`/clientes/${id}`);
};

export const getClientesByFiltro = async (filtro) => {
    try {
        const response = await api.get('/clientes/filtro/credor', { params: filtro });
        return response;
    } catch (error) {
        console.error('Erro ao buscar clientes com filtro:', error);
        throw error;
    }
};
