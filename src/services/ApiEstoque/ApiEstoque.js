import api from '../../services/api';


export const addEstoque = async (payload) => {
  try {
    const response = await api.post('estoqueApi/estoque/movimentar', payload);
    return response;
  } catch (error) {
    console.error('Erro ao buscar produtos em estoque:', error);
    throw error;
  } finally {
    // Pode adicionar lógica de limpeza aqui, se necessário
  }
};


export const listaEstoque = async (params) => {
  try {
    // Agora chamamos diretamente o endpoint /estoque
    const response = await api.get('estoqueApi/estoqueNovo/listar', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar lista de produtos em estoque:', error);
    throw error;
  }
};