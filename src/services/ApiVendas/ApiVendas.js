import api from '../../services/api';

export const registravenda = async (venda) => {
    return api.post('/vendas', venda);
};

export const getVendas = async ({ page = 1, limit = 10, ...filtro } = {}) => {
    try {
        // Faz a requisição enviando page e limit como params
        const response = await api.get('/vendasdetalhes', {
            params: { page, limit, ...filtro },
        });

        const { data, somaTotalPrice, totalDescontos, totalPages, currentPage } = response.data; // Supondo que a API retorne esses campos

        return {
            data,
            somaTotalPrice,
            totalDescontos,
            currentPage,
            totalPages,
            perPage: limit,
        };
    } catch (error) {
        console.error(error.response?.data?.erro || 'Erro ao buscar vendas:', error);
        throw error.response?.data?.erro || 'Erro desconhecido';
    }
};



export const getVendaById = async (id) => {
    try {
        const response = await api.get(`/vendasid/${id}`);
        return response.data; // Retorna os dados do status
    } catch (error) {
        console.error('Erro ao buscar Venda por ID:', error);
        throw error; // Lança o erro para tratamento em outro lugar
    }
};

export const atualizaVenda = async (id, venda) => {
    try {
        const response = await api.put(`/update-venda/${id}`, venda);
        return response.data; // Retorna os dados atualizados da venda
    } catch (error) {
        console.error('Erro ao atualizar Venda:', error);
        throw error; // Lança o erro para tratamento em outro lugar
    }
}
