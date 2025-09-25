import api from '../../services/api';

export const getAtualizacoesPreco = async ({ page = 1, limit = 10, ...atualizacoes } = {}) => {
    try {
        const response = await api.get('/atualizacoes/atualizacoes-preco', {
            params: {
                page,
                limit,
                ...atualizacoes
            }
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao listar atualizacoes:', error);
        throw error;
    }
}

export const approveAtualizacao = async (id, data) => {
    if (!id) throw new Error('ID da atualização é obrigatório');
    try {
        const response = await api.post(`/atualizacoes/atualizacoes-preco/${id}/approve`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao aprovar atualização:', error);
        throw error;
    }
}

export const createAtualizacaoPreco = async (promocao) => {
    try {
        const response = await api.post('/precosApi/precos', promocao);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar Atualizacao:', error);
        throw error;
    }
};

export const getByAtualizacaoId = async (id) => {
    if (!id) throw new Error('ID da atualização é obrigatório');
    try {
        const response = await api.get(`/precosApi/precos/atualizacao/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar preços atualizados:', error);
        throw error;
    }
};

export const updatePrecoId = async (id, data) => {
    if (!id) throw new Error('ID da atualização é obrigatório');
    try {
        const response = await api.put(`/precosApi/precos/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar preços:', error);
        throw error;
    }
};
