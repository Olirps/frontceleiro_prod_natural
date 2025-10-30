import api from '../../services/api';

// Observação: no backend a rota foi informada como `/promocao:id`,
// aqui assumimos a forma padrão REST com `/promocao/:id`.

export const addPromocao = async (promocao) => {
	try {
		const response = await api.post('/promocaoRouter/promocao', promocao);
		return response.data;
	} catch (error) {
		console.error('Erro ao criar promoção:', error);
		throw error;
	}
};

export const getPromocoes = async (filters = {}) => {
	try {
		const { page, limit, termo } = filters;
		const response = await api.get('/promocaoRouter/promocao', { params: { page, limit, termo } });
		return response.data;
	} catch (error) {
		console.error('Erro ao listar promoções:', error);
		throw error;
	}
};

export const updatePromocao = async (id, promocao) => {
	if (!id) throw new Error('ID da promoção é obrigatório');
	try {
		const response = await api.put(`/promocaoRouter/promocao/${id}`, promocao);
		return response.data;
	} catch (error) {
		console.error('Erro ao atualizar promoção:', error);
		throw error;
	}
};

export const getByIdPromocao = async (id, promocao) => {
	if (!id) throw new Error('ID da promoção é obrigatório');
	try {
		const response = await api.get(`/promocaoRouter/promocao/${id}`);
		return response.data;
	} catch (error) {
		console.error('Erro ao atualizar promoção:', error);
		throw error;
	}
};

export const deletePromocao = async (id) => {
	if (!id) throw new Error('ID da promoção é obrigatório');
	try {
		const response = await api.delete(`/ promocaoRouter / promocao / ${id}`);
		return response.data;
	} catch (error) {
		console.error('Erro ao excluir promoção:', error);
		throw error;
	}
};

export const getProdutosVendidosNaPromocao = async (params = {}) => {
	const { page, limit, data_de, data_ate, promocao_id, produto_id, termo, sintetico, porProduto } = params;
	try {
		const response = await api.get(`/promocaoRouter/promocao/itensvendidos`, {
			params: {
				page,
				limit,
				data_de,
				data_ate,
				promocao_id,
				produto_id,
				termo,
				sintetico,
				porProduto
			}
		});
		return response.data;
	} catch (error) {
		console.error('Erro ao listar produtos vendidos na promoção:', error);
		throw error;
	}
};

export const getItensPromocao = async (promocaoId, params = {}) => {
	if (!promocaoId) throw new Error('ID da promoção é obrigatório');
	const { data_de, data_ate, produto_id, termo, sintetico } = params;

	try {
		const response = await api.get(`/promocaoRouter/promocao/${promocaoId}/imprimir`, {
			params: {
				data_de,
				data_ate,
				produto_id,
				termo,
				sintetico
			},
			responseType: 'blob', // 👈 importante!
		});

		// Cria um link temporário para baixar/abrir o PDF
		const blob = new Blob([response.data], { type: 'application/pdf' });
		const url = window.URL.createObjectURL(blob);
		window.open(url); // abre no navegador

		// Se preferir forçar download:
		// const link = document.createElement('a');
		// link.href = url;
		// link.setAttribute('download', `produtos_promocao_${promocaoId}.pdf`);
		// document.body.appendChild(link);
		// link.click();
		// link.remove();
	} catch (error) {
		console.error('Erro ao gerar PDF:', error);
		throw error;
	}
};
