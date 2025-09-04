import api from '../../services/api';


export const processTefPayment = async (transaction) => {
  try {
    const response = await api.post('/tef/transacao', transaction);
    return response.data; // Retorna os dados da venda iniciada
  } catch (error) {
    console.error('Erro ao iniciar transação:', error);
    throw error; // Lança o erro para tratamento em outro lugar
  }
}

export const cancelaTefPayment = async (transaction) => {
  try {
    const response = await api.post('/tef/cancelar', transaction);
    return response.data; // Retorna os dados da venda iniciada
  } catch (error) {
    console.error('Erro ao iniciar transação:', error);
    throw error; // Lança o erro para tratamento em outro lugar
  }
}

// Novo método para buscar transações TEF
export const _getTefTransacoes = async (params) => {
  try {
    const response = await api.get('/tef/transacoes', { params });
    return response.data; // Retorna a lista de transações
  } catch (error) {
    console.error('Erro ao buscar transações TEF:', error);
    throw error;
  }
}

// Funções para gerenciar Clientes
export const getTefTransacoes = async ({ page = 1, limit = 10, ...filters } = {}) => {
  try {
    const response = await api.get('/tef/transacoes', {
      params: {
        page,
        limit,
        ...filters
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar TEF Transações:', error);
    throw error;
  }
};


export const imprimirComprovante = async (transacaoId) => {
  try {
    const response = await api.get(`/imprimir-comprovante/${transacaoId}`, {
      responseType: 'blob' // garante que venha como arquivo binário
    });

    // cria uma URL temporária para abrir o PDF
    const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

    // abre o PDF em uma nova aba
    window.open(fileURL);

    return true;
  } catch (error) {
    console.error('Erro ao imprimir comprovante:', error);
    throw error;
  }
};


