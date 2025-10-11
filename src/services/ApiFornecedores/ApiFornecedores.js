import api from '../../services/api';

export const getFornecedores = async (filters = {}) => {
    try {
        const response = await api.get('/fornecedores', { params: filters });
        return response;
    } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
        throw error; // Repassa o erro para tratamento
    }
};

export const getFornecedoresFiltro = async (filters = {}) => {
    try {
        const response = await api.get('/fornecedores/filtro/credor', { params: filters });
        return response;
    } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
        throw error; // Repassa o erro para tratamento
    }
};

export const addFornecedor = async (pessoa) => {
    try {
        const response = await api.post('/fornecedores', pessoa);
        return response.data;
    } catch (error) {
        console.error('Erro ao adicionar fornecedor:', error);
        throw error;
    }
};


export const updateFornecedor = async (id, pessoa) => {
    return api.put(`/fornecedores/${id}`, pessoa);
};

export const getFornecedorById = async (id) => {
    return api.get(`/fornecedores/${id}`);
};

export const getFornecedoresByFiltro = async (filtro) => {
    try {
        const response = await api.get('/fornecedores/filtro/credor', { params: filtro });
        return response;
    } catch (error) {
        console.error('Erro ao buscar fornecedores com filtro:', error);
        throw error;
    }
};
