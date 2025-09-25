import api from '../services/api';

// ─── Grupo de Produtos ──────────────────────────────

export const getGrupoProdutos = async (filters = {}) => {
  try {
    const { nome = "", status = "", currentPage = 1, rowsPerPage = 10 } = filters;
    const response = await api.get('/grupoprodutos/', {
      params: {
        nome,
        status,
        page: currentPage || 1,
        pageSize: rowsPerPage || 10,
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar grupos de produtos:', error);
    throw error;
  }
};

export const getGrupoProdutoById = async (id) => {
  try {
    const response = await api.get(`/grupoprodutos/${id}`);
    return response;
  } catch (error) {
    console.error(`Erro ao buscar grupo de produto ID ${id}:`, error);
    throw error;
  }
};

export const addGrupoProdutos = async (dados) => {
  try {
    const response = await api.post('/grupoprodutos', dados);
    return response;
  } catch (error) {
    console.error('Erro ao adicionar grupo de produto:', error);
    throw error;
  }
};

export const updateGrupoProduto = async (id, dados) => {
  try {
    const response = await api.put(`/grupoprodutos/${id}`, dados);
    return response;
  } catch (error) {
    console.error(`Erro ao atualizar grupo de produto ID ${id}:`, error);
    throw error;
  }
};

export const deleteGrupoProduto = async (id) => {
  try {
    const response = await api.delete(`/grupoprodutos/${id}`);
    return response;
  } catch (error) {
    console.error(`Erro ao deletar grupo de produto ID ${id}:`, error);
    throw error;
  }
};

// ─── Subgrupo de Produtos ────────────────────────────

export const getSubGrupoProdutos = async (filters) => {
  try {
    const { nome, status, grupoId, currentPage, rowsPerPage } = filters;

    const response = await api.get('/subgrupoprodutos/', {
      params: {
        nome,
        status,
        grupoId,
        page: currentPage || 1,
        pageSize: rowsPerPage || 10,
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar subgrupos de produtos:', error);
    throw error;
  }
};

export const getSubGrupoProdutoById = async (id) => {
  try {
    const response = await api.get(`/subgrupoprodutos/${id}`);
    return response;
  } catch (error) {
    console.error(`Erro ao buscar subgrupo de produto ID ${id}:`, error);
    throw error;
  }
};

export const addSubGrupoProdutos = async (dados) => {
  try {
    const response = await api.post('/subgrupoprodutos', dados);
    return response;
  } catch (error) {
    console.error('Erro ao adicionar subgrupo de produto:', error);
    throw error;
  }
};

export const updateSubGrupoProduto = async (id, dados) => {
  try {
    const response = await api.put(`/subgrupoprodutos/${id}`, dados);
    return response;
  } catch (error) {
    console.error(`Erro ao atualizar subgrupo de produto ID ${id}:`, error);
    throw error;
  }
};

export const deleteSubGrupoProduto = async (id) => {
  try {
    const response = await api.delete(`/subgrupoprodutos/${id}`);
    return response;
  } catch (error) {
    console.error(`Erro ao deletar subgrupo de produto ID ${id}:`, error);
    throw error;
  }
};