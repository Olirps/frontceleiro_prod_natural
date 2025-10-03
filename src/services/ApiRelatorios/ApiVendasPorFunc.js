import api from '../../services/api';

export const getVendasPorFuncionarioPeriodo = async (filters = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      dataInicio,
      dataFim,
      funcionarioId,
      funcionarioNome,
      modoExibicao,
    } = filters;

    // Validação dos parâmetros
    if (isNaN(page) || page < 1) {
      throw new Error('O parâmetro "page" deve ser um número maior que 0');
    }

    if (isNaN(limit) || limit < 1) {
      throw new Error('O parâmetro "limit" deve ser um número maior que 0');
    }

    const params = {
      page,
      limit,
    };

    if (dataInicio) params.dataInicio = dataInicio;
    if (dataFim) params.dataFim = dataFim;
    if (funcionarioId) params.funcionarioId = funcionarioId;
    if (funcionarioNome) params.funcionarioNome = funcionarioNome;
    if (modoExibicao) params.agrupamento = modoExibicao;

    const response = await api.get('/vendasPorFuncionario/vendas-por-funcionario', { params });

    // Calcular soma total das vendas
    const somaTotal = response.data.items?.reduce((acc, item) => acc + (parseFloat(item.total_vendido) || 0), 0) || 0;

    return {
      data: response.data.items || [], // array de vendas
      somaTotal: somaTotal, // soma total das vendas
      pagination: {
        total: response.data.total,
        totalPages: response.data.totalPages,
        currentPage: response.data.page
      }
    };
  } catch (error) {
    console.error('Erro ao buscar vendas por funcionário/período:', error);

    if (error.response) {
      throw {
        status: error.response.status,
        message: error.response.data.erro || 'Erro ao buscar vendas por funcionário',
        details: error.response.data.detalhes
      };
    }

    throw {
      status: 400,
      message: error.message
    };
  }
};