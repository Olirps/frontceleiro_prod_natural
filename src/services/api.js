import axios from 'axios';
import { dataAtual } from '../utils/functions';

// Crie uma instância do axios com a URL base
const api = axios.create({
  baseURL: 'http://3.13.205.247:3001/api',
});

// Função para definir o token de autenticação no header
const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};


// Recuperar o token do localStorage e definir no Axios
const token = localStorage.getItem('authToken');
setAuthToken(token);

export { api, setAuthToken };

// Funções de autenticação
export const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Funções para gerenciar Permissões de acesso
export const addEmpresa = async (empresa) => {
  return api.post('/empresa', empresa);
};

export const getAllEmpresas = async () => {
  return api.get('/empresa');
};

export const getEmpresaById = async (id) => {
  return api.get(`/empresa/${id}`);
};


export const updateEmpresa = async (id, dados) => {
  return api.put(`/empresa/${id}`, dados);
};




// Funções para gerenciar Permissões de acesso
export const addGrupoAcesso = async (grupoacesso) => {
  return api.post('/grupoacesso', grupoacesso);
};

export const getAllGrupoAcesso = async (filters = {}) => {
  const response = await api.get('/grupoacesso', { params: filters });
  return response;
};

export const getGrupoAcessoById = async (id) => {
  return api.get(`/grupoacesso/${id}`);
};


export const addPermissoes = async (permissoes) => {
  return api.post('/permissoes', permissoes);
};

export const getPermissoes = async (filters = {}) => {
  const response = await api.get('/permissoes', { params: filters });
  return response;
};

export const updatePermissoes = async (id, permissoes) => {
  return api.put(`/permissoes/${id}`, permissoes);
};


// Bancos

export const addContabancaria = async (contabancaria) => {
  return api.post('/contasbancarias', contabancaria);
};

export const getAllContas = async () => {
  return api.get('/contasbancarias');
};

export const getContasBancariaById = async (id) => {
  return api.get(`/contasbancarias/${id}`);
};

export const updateContaBancaria = async (id, conta) => {
  return api.put(`/contasbancarias/${id}`, conta);
};

export const getAllBancos = async () => {
  return api.get('/bancos');
};

// Funções para gerenciar pessoas
/*export const getPessoas = () => {
  return api.get('/pessoas');
};*/

export const getFornecedores = async (filters = {}) => {
  try {
    const response = await api.get('/fornecedores', { params: filters });
    return response;
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    throw error; // Repassa o erro para tratamento
  }
};

export const addFornecedor = async (pessoa) => {
  return api.post('/fornecedores', pessoa);
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

// Funções para gerenciar carros
export const getVeiculos = async (filters = {}) => {
  const response = await api.get('/veiculos', { params: filters });
  return response;
};

export const addVeiculos = async (carro) => {
  return api.post('/veiculos', carro);
};

export const updateVeiculos = async (id, carro) => {
  return api.put(`/veiculos/${id}`, carro);
};

export const getVeiculosById = async (id) => {
  return api.get(`/veiculos/${id}`);
};

// Funções para gerenciar tipo veiculo
export const getTipoVeiculo = async () => {
  return api.get('/tipoveiculo');
};

// Funções para gerenciar vinculo de produtos com veiculos
export const vinculoProdVeiculo = async (carro) => {
  return api.post('/vinculoprodveiculo', carro);
};

export const vinculoByProdutoId = async (veiculo_id) => {
  return api.post(`/vinculoprodveiculo/produto/${veiculo_id}`);
};

export const getVinculosProdutoVeiculo = async () => {
  return api.get('/vinculoprodveiculo-lista');
};

export const obterVinculoPorProdutoId = async (produtoId, notaFiscalId) => {
  return api.get(`/vinculoprodveiculo/produto/${produtoId}/nota/${notaFiscalId}`);
};


// Funções para gerenciar marcas
export const getMarcas = async () => {
  return api.get('/marcas');
};

// Funções para gerenciar marcas
export const getMarcasById = async () => {
  return api.get('/marcas');
};

// Funções para gerenciar Clientes
export const getClientes = async (filters = {}) => {
  try {
    const response = await api.get('/clientes', { params: filters });
    return response;
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    throw error; // Repassa o erro para tratamento
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


// Funções para gerenciar Funcionarios
export const getFuncionarios = async (filters = {}) => {
  try {
    const response = await api.get('/funcionarios', { params: filters });
    return response;
  } catch (error) {
    console.error('Erro ao buscar funcionarios:', error);
    throw error; // Repassa o erro para tratamento
  }
};

export const addFuncionario = async (cliente) => {
  return api.post('/funcionarios', cliente);
};

export const updateFuncionario = async (id, cliente) => {
  return api.put(`/funcionarios/${id}`, cliente);
};

export const getFuncionarioById = async (id) => {
  return api.get(`/funcionarios/${id}`);
};

export const getFuncionariosByFiltro = async (filtro) => {
  try {
    const response = await api.get('/funcionarios/filtro/credor', { params: filtro });
    return response;
  } catch (error) {
    console.error('Erro ao buscar funcionarios com filtro:', error);
    throw error;
  }
};

//movimentacao-despesa
export const getMovimentacaofinanceiraDespesa = async (filters = {}) => {
  return await api.get('/movimentacao-despesa', { params: filters });
};

//Movimentacao Financeira
export const getAllMovimentacaofinanceiraDespesa = async (filters = {}) => {
  try {
    const response = await api.get('/movimentacaofinanceiradespesa', { params: filters });
    return response;
  } catch (error) {
    console.error('Erro ao buscar Movimentação Financeira:', error);
    throw error;
  }
};

export const getContaPagarSemana = async () => {
  return api.get('/contaspagar/semana');
};

export const getLancamentoDespesaById = async (id) => {
  return api.get(`/movimentacaofinanceiradespesa/${id}`);
};

export const getLancamentoCompletoById = async (id) => {
  return api.get(`/despesa/${id}`);
};

export const getLancamentosAReceber = async (filters = {}) => {
  try {
    const response = await api.get('/contas-a-receber', { params: filters });
    return response;
  } catch (error) {
    console.error('Erro ao buscar Movimentação Financeira:', error);
    throw error;
  }
};

export const getParcelasDespesa = async (id) => {
  return api.get(`/parcelasmovimentacao/${id}`);
};

export const getParcelaByID = async (id) => {
  return api.get(`/parcelas/${id}`);
};

export const pagamentoParcela = async (id, pagamento) => {
  return api.put(`/parcelas/${id}`, pagamento);
};

export const addMovimentacaofinanceiraDespesa = async (lancamento) => {
  return api.post('/movimentacaofinanceiradespesa', lancamento);
};

export const addParcelasDespesa = async (parcelas) => {
  return api.post('/lancamentoparcelas', parcelas);
};

export const updateMovimentacaofinanceiraDespesa = async (id) => {
  return api.put(`/movimentacaofinanceiradespesa/${id}`);
};

export const updateLancamentoDespesa = async (id, dados) => {
  return api.put(`/lancamentos/${id}`, dados);
};

export const cancelarMovimentacaofinanceiraDespesa = async (id) => {
  return api.put(`/movimentacaofinanceiradespesa/${id}`);
};

export const getContasPagas = async () => {
  return api.get('/contaspagas/');
};

export const getLancamentoUnificar = async (filtro) => {
  try {
    const response = await api.get('/lancamentos-unificar/', { params: filtro });
    return response;
  } catch (error) {
    console.error('Erro ao buscar lancamentos com filtro:', error);
    throw error;
  }
};


// Nota Fiscal Eletronica
export const getNotafiscal = async () => {
  return api.get('/notafiscal');
};

export const addNotafiscal = async (nfe) => {
  return api.post('/notafiscal', nfe);
};

export const importNotafiscal = async (formData) => {
  return api.post('/notafiscalimport', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const getNFeById = async (id) => {
  return api.get(`/notafiscal/${id}`);
};

export const updateNFe = async (id, notafiscal) => {
  return api.put(`/notafiscal/${id}`, notafiscal);
};

export const produtosSimilares = async (id) => {
  try {
    const response = await api.get(`produtos-similares/${id}`,);
    return response.data; // Retorna os dados
  } catch (error) {
    console.error('Erro ao buscar produtos similares:', error);
    throw error; // Lança o erro para tratamento em outro lugar
  }
}


export const getProdutosEstoque = async (filters = {}, page = 1, limit = 20) => {
  try {
    const response = await api.get('/produtosestoque', {
      params: {
        filters,
        page,
        limit
      }
    });
    return response;
  } catch (error) {
    console.error('Erro ao buscar produtos em estoque:', error);
    throw error;
  } finally {
    // Pode adicionar lógica de limpeza aqui, se necessário
  }
};

export const getSaldoPorProduto = async (data, nome, page = 1, limit = 20) => {
  try {
    if (!data) {
      const dataAtualFormatada = dataAtual();
      data = dataAtualFormatada;
    }


    const response = await api.get(`/saldo-por-produto/${data}`, {
      params: {
        ...(nome && { nome }),   // Só inclui nome se estiver definido
        page,
        limit
      }
    });

    return response;
  } catch (error) {
    console.error('Erro ao buscar saldo por produto:', error);
    throw error;
  }
};


export const efetivarProduto = async (produto) => {
  try {
    const response = await api.post('/efetivar-produto-nf/', produto);
    return response;
  } catch (error) {
    console.error('Erro ao efetivar produto:', error);
    throw error;
  }
};


export const getResumoAteData = async (data) => {
  try {
    const response = await api.get(`/resumo-ate-data/${data}`);
    return response;
  } catch (error) {
    console.error('Erro ao buscar resumo até data:', error);
    throw error;
  } finally {
    // Pode adicionar lógica de limpeza aqui, se necessário
  }
};

export const getProdutoNFById = async (id) => {
  return api.get(`/produtosnf/${id}`);
};
export const getQuantidadeRestanteProdutoNF = async (id) => {
  return api.get(`/produtosnf/quantidadeRestante/${id}`);
};

export const vinculaProdutoNF = async (id, produto) => {
  try {
    const response = await api.put(`/produtosnf/vincular/${id}`, produto);
    return response.data; // Retorna os dados da resposta
  } catch (error) {
    console.error("Erro ao vincular produto à NF:", error);
    throw error; // Propaga o erro para o chamador tratar
  } finally {
    // Caso queira adicionar algum comportamento de finalização no futuro
    // console.log('Requisição de vínculo finalizada.');
  }
};


export const desvinculaProdutoNF = async (id, produto) => {
  return api.put(`/produtosnf/desvincular/${id}`, produto);
};

// Funções para gerenciar grupoprodutos
export const getGrupoProdutos = async () => {
  return api.get('/grupoproduto');
};

export const addGrupoProdutos = async (produto) => {
  return api.post('/grupoproduto', produto);
};

export const updateGrupoProduto = (id, produto) => {
  return api.put(`/grupoproduto/${id}`, produto);
};

export const getGrupoProdutoById = async (id) => {
  return api.get(`/grupoproduto/${id}`);
};

export const deleteGrupoProduto = async (id) => {
  return api.delete(`/grupoproduto/${id}`);
};

// Funções para gerenciar subgrupoprodutos
export const getSubGrupoProdutos = async () => {
  return api.get('/subgrupoproduto');
};

export const addSubGrupoProdutos = async (produto) => {
  return api.post('/subgrupoproduto', produto);
};

export const updateSubGrupoProduto = (id, produto) => {
  return api.put(`/subgrupoproduto/${id}`, produto);
};


export const getSubGrupoProdutoById = async (id) => {
  return api.get(`/subgrupoproduto/${id}`);
};

export const deleteSubGrupoProduto = async (id) => {
  return api.delete(`/subgrupoproduto/${id}`);
};



// Funções para gerenciar produtos
export const getProdutosVenda = async (filters = {}, page = 1) => {
  try {
    const response = await api.get('/produtos-venda', {
      params: { ...filters, page },
    });
    return response.data; // Retorna só os dados
  } catch (error) {
    console.error('Erro ao buscar produtos da venda:', error);
    throw error; // Deixa o erro "subir" para quem chamou tratar
  }
};


export const getProdutos = async (filters = {}) => {
  try {
    // Valores padrão para paginação
    const params = {
      page: 1,
      pageSize: 10,
      ...filters
    };

    // Validação básica dos parâmetros
    if (params.page && (isNaN(params.page) || params.page < 1)) {
      throw new Error('O parâmetro "page" deve ser um número maior que 0');
    }

    if (params.pageSize && (isNaN(params.pageSize) || params.pageSize < 1)) {
      throw new Error('O parâmetro "pageSize" deve ser um número maior que 0');
    }

    const response = await api.get('/produtos', { params });

    // Retorna tanto os dados quanto os metadados de paginação
    return {
      data: response.data.data, // Array de produtos
      pagination: response.data.pagination // Metadados de paginação
    };
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);

    // Para erros de resposta da API, retornamos o erro completo
    if (error.response) {
      throw {
        status: error.response.status,
        message: error.response.data.erro || 'Erro ao buscar produtos',
        details: error.response.data.detalhes
      };
    }

    // Para outros tipos de erros (como os de validação acima)
    throw {
      status: 400,
      message: error.message
    };
  }
};

export const addProdutos = async (produto) => {
  return api.post('/produtos', produto);
};

export const updateProduto = (id, produto) => {
  return api.put(`/produtos/${id}`, produto);
};

export const inativarProduto = (id) => {
  return api.put(`/produtos-inativar/${id}`);
};

export const getProdutoById = async (id) => {
  return api.get(`/produtos/${id}`);
};

export const getProdutosVendidos = async (id) => {
  return api.get('produtos/vendidos');
};

export const getProdutosVendidosSemana = async (id) => {
  return api.get('produtos/vendidos-semana');
};


// ENDPOINT - CONTRATO LAYOUT
export const getTipoContratosLayout = async (dados, page = 1, limit = 20) => {
  try {
    // Valores padrão para paginação
    const { descricao, status } = dados;
    const params = {
      page,
      limit,
      status
    };
    const response = await api.get('/tipos-contrato-layout', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);
    throw error; // Repassa o erro para tratamento
  }
};

export const addTipoContratosLayout = async (tipoContrato) => {
  try {
    const response = await api.post('/tipos-contrato-layout', tipoContrato);
    return response.data; // Retorna os dados da venda iniciada
  } catch (error) {
    console.error('Erro ao criar novo tipo layout contrato:', error);
    throw error; // Lança o erro para tratamento em outro lugar
  }
}

export const alterarTipoContratosLayout = async (id, tipoContrato) => {
  try {
    const response = await api.put(`/tipos-contrato-layout/${id}`, tipoContrato);
    return response.data; // Retorna os dados da venda iniciada
  } catch (error) {
    console.error('Erro ao alterar o  tipo contrato layout:', error);
    throw error; // Lança o erro para tratamento em outro lugar
  }
}

export const getContratosLayout = async (dados = {}, page = 1, limit = 20) => {
  try {
    const { titulo_contrato, status, IdtituloLayout } = dados;

    const params = {
      page,
      limit
    };

    if (titulo_contrato) {
      params.titulo_contrato = titulo_contrato;
    }

    if (status !== undefined) {
      params.status = status;
    }

    if (IdtituloLayout) {
      params.id_tipo_contrato = IdtituloLayout;
    }

    const response = await api.get('/contratos-layout', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);
    throw error;
  }
};

export const addContratosLayout = async (Contrato) => {
  try {
    const response = await api.post('/contratos-layout', Contrato);
    return response.data; // Retorna os dados da venda iniciada
  } catch (error) {
    console.error('Erro ao criar novo contrato layout:', error);
    throw error; // Lança o erro para tratamento em outro lugar
  }
}

export const alterarContratosLayout = async (id, Contrato) => {
  try {
    const response = await api.put(`/contratos-layout/${id}`, Contrato);
    return response.data; // Retorna os dados da venda iniciada
  } catch (error) {
    console.error('Erro ao alterar o contrato layout:', error);
    throw error; // Lança o erro para tratamento em outro lugar
  }
}

// ENDPOINT - CONTAINER
export const listarContainers = async (filters = {}) => {
  try {
    // Valores padrão para paginação
    const params = {
      page: 1,
      pageSize: 10,
      ...filters
    };

    // Validação básica dos parâmetros
    if (params.page && (isNaN(params.page) || params.page < 1)) {
      throw new Error('O parâmetro "page" deve ser um número maior que 0');
    }

    if (params.pageSize && (isNaN(params.pageSize) || params.pageSize < 1)) {
      throw new Error('O parâmetro "pageSize" deve ser um número maior que 0');
    }

    const response = await api.get('/containers', { params });

    // Retorna tanto os dados quanto os metadados de paginação
    return {
      data: response.data.data, // Array de produtos
      pagination: response.data.pagination // Metadados de paginação
    };
  } catch (error) {
    console.error('Erro ao buscar Containers:', error);

    // Para erros de resposta da API, retornamos o erro completo
    if (error.response) {
      throw {
        status: error.response.status,
        message: error.response.data.erro || 'Erro ao buscar Containers',
        details: error.response.data.detalhes
      };
    }

    // Para outros tipos de erros (como os de validação acima)
    throw {
      status: 400,
      message: error.message
    };
  }
};


// UFs e Municípios
export const getUfs = async () => {
  return api.get('/uf');
};

export const getMunicipiosUfId = async (id) => {
  return api.get(`/municipios/${id}`);
};

export const getMunicipios = async (id) => {
  return api.get(`/municipios/${id}`);
};

export const getMunicipiosIBGE = async (id, codMunIBGE) => {
  return api.get(`/municipios/mun/${id}`, codMunIBGE);
};

export const getMunicipioById = async (id) => {
  return api.get(`/municipios/id/${id}`);
};

export const getUFIBGE = async (codIBGE) => {
  return api.get(`/uf/uf/${codIBGE}`);
};

// Formas de Pagamentos

export const getFormasPagamento = async (filtro = {}) => {
  try {
    const response = await api.get('/formas-pagamento', { params: filtro });
    return response
  } catch (error) {
    console.error('Erro ao buscar formas de pagamento:', error);
    throw error;
  }
};



// Vendas
export const iniciarVenda = async (venda) => {
  try {
    const response = await api.post('/vendas-iniciar', venda);
    return response.data; // Retorna os dados da venda iniciada
  } catch (error) {
    console.error('Erro ao iniciar venda:', error);
    throw error; // Lança o erro para tratamento em outro lugar
  }
}

export const retornaXMLAssinado = async (id, xmlEnviado, xmlRespostaSefaz) => {
  return api.put(`/returnoxmlassinado/${id}`, {
    xmlEnviado,
    xmlRespostaSefaz
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

export const registravenda = async (venda) => {
  return api.post('/vendas', venda);
};

export const getVendas = async (filtro = {}) => {
  try {
    const response = await api.get('/vendasdetalhes', { params: filtro });
    return response
  } catch (error) {
    console.error('Erro ao buscar status com filtro:', error);
    throw error;
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

export const statusNfe = async (id) => {
  try {
    const response = await api.get(`/nfe-status/${id}`);
    return response.data; // Retorna os dados do status
  } catch (error) {
    console.error('Erro ao buscar status NFe por ID:', error);
    throw error; // Lança o erro para tratamento em outro lugar
  }
}

export const findByIdXml = async (id) => {
  try {
    const response = await api.get(`/xml/${id}`);
    const xml = typeof response.data === 'string' ? response.data.trim() : '';

    if (!xml.startsWith('<NFe') || !xml.endsWith('</NFe>')) {
      console.warn('⚠️ XML com estrutura inesperada:', JSON.stringify(xml.slice(0, 200)));
    }

    return xml;
  } catch (error) {
    console.error('Erro ao buscar XML por ID:', error);
    throw error;
  }
};

export const cancelaNf = async (id, motivo) => {
  try {
    const response = await api.put(`/cancela-nf/${id}`, { motivo });

    return response;
  } catch (error) {
    console.error('Erro ao buscar XML por ID:', error);
    throw error;
  }
};

export const registraCancelamento = async (id, retorno) => {
  try {
    const response = await api.post(`/cancela-xml/${id}`, { retorno });

    return response;
  } catch (error) {
    console.error('Erro ao buscar XML por ID:', error);
    throw error;
  }
};

export const geraNF = async (id) => {
  try {
    const response = await api.get(`/geranf/${id}`, {
      validateStatus: function (status) {
        return true; // Aceita qualquer status e permite você tratar no .status depois
      }
    });
    return response;
  } catch (error) {
    console.error('Erro ao buscar XML por ID:', error);
    throw error;
  }
};

export const geraNFC = async (id) => {
  try {
    const response = await api.get(`/geranfc/${id}`, {
      validateStatus: function (status) {
        return true; // Aceita qualquer status e permite você tratar no .status depois
      }
    });
    return response;
  } catch (error) {
    console.error('Erro ao buscar XML por ID:', error);
    throw error;
  }
};

export const updateVenda = async (id) => {
  try {
    const response = await api.get(`/atualizar-venda/${id}`);
    return response.data; // Retorna os dados do status
  } catch (error) {
    console.error('Erro ao atualizar Venda:', error);
    throw error; // Lança o erro para tratamento em outro lugar
  }
};

export const cancelaVenda = (id, venda) => {
  return api.put(`/cancelavenda/${id}`, venda);
};

export const consultaVendaPorId = async (id) => {
  return api.get(`/vendasid/${id}`);
};

export const consultaItensVenda = async (id) => {
  return api.get(`/vendas/${id}`);
};

// Consulta de Pagamentos Por Id da Venda
export const consultaPagamentosById = async (id) => {
  return api.get(`/pagamentos/${id}`);
};



// Funções para gerenciar Status das OS
export const addOSStatus = async (status) => {
  try {
    const response = await api.post('/osstatus', status);
    return response;
  } catch (error) {
    console.error('Erro ao adicionar status:', error);
    throw error;
  }
};

export const getAllOSStatus = async (filtro = {}) => {
  try {
    const response = await api.get('/osstatus/', { params: filtro });
    return response;
  } catch (error) {
    console.error('Erro ao buscar status com filtro:', error);
    throw error;
  }
};

export const getByIdOSStatus = async (id) => {
  try {
    const response = await api.get(`/osstatus/${id}`);
    return response.data; // Retorna os dados do status
  } catch (error) {
    console.error('Erro ao buscar status por ID:', error);
    throw error; // Lança o erro para tratamento em outro lugar
  }
};


export const updateOSStatus = async (id, status) => {
  if (!id || !status) {
    throw new Error('ID e Status são obrigatórios');
  }
  try {
    const response = await api.put(`/osstatus/${id}`, status);
    return response;
  } catch (error) {
    console.error('Erro ao atualizar status da OS:', error);
    throw error;
  }
};

// Funções para gerenciar Status das OS

export const addOS = async (status) => {
  try {
    const response = await api.post('/osservice', status);
    return response;
  } catch (error) {
    console.error('Erro ao adicionar O.S.:', error);
    throw error;
  }
};

// Funções para gerenciar Status das OS
export const registraPagamento = async (ptgo) => {
  try {
    const response = await api.post('/pagamentos', ptgo);
    return response;
  } catch (error) {
    console.error('Erro ao adicionar Pagamento:', error);
    throw error;
  }
};

export const getAllOS = async (filtro = {}) => {
  try {
    const response = await api.get('/osservice/', { params: filtro });
    return response;
  } catch (error) {
    console.error('Erro ao buscar status com filtro:', error);
    throw error;
  }
};

export const getByIdOS = async (id) => {
  try {
    const response = await api.get(`/osservice/${id}`);
    return response.data; // Retorna os dados do status
  } catch (error) {
    console.error('Erro ao buscar O.S. por ID:', error);
    throw error; // Lança o erro para tratamento em outro lugar
  }
};

export const getWorkFlowIdOS = async (id) => {
  try {
    const response = await api.get(`/osservice-workflow/${id}`);
    return response.data; // Retorna os dados do status
  } catch (error) {
    console.error('Erro ao buscar WorkFlow da O.S.:', error);
    throw error; // Lança o erro para tratamento em outro lugar
  }
};

export const updateOS = async (id, os) => {
  if (!id || !os) {
    throw new Error('ID e Status são obrigatórios');
  }
  try {
    const response = await api.put(`/osservice/${id}`, os);
    return response;
  } catch (error) {
    console.error('Erro ao atualizar O.S. :', error);
    throw error;
  }
};

export const aprovarOS = async (id, os) => {
  if (!id || !os) {
    throw new Error('ID e Status são obrigatórios');
  }
  try {
    const response = await api.put(`/osservice-aprovar/${id}`, os);
    return response;
  } catch (error) {
    console.error('Erro ao aprovar O.S. :', error);
    throw error;
  }
};

export const removerProdutoOS = async (id, os) => {
  if (!id) {
    throw new Error('ID');
  }
  try {
    const response = await api.put(`/osremove_item/${id}`, os);
    return response;
  } catch (error) {
    console.error('Erro ao aprovar O.S. :', error);
    throw error;
  }
};