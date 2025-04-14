import axios from 'axios';

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

export const getProdutoNFById = async (id) => {
  return api.get(`/produtosnf/${id}`);
};
export const getQuantidadeRestanteProdutoNF = async (id) => {
  return api.get(`/produtosnf/quantidadeRestante/${id}`);
};

export const vinculaProdutoNF = async (id, produto) => {
  return api.put(`/produtosnf/vincular/${id}`, produto);
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
export const getProdutos = async (filters = {}) => {
  const response = await api.get('/produtos', { params: filters });
  return response;
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

export const removerProdutoOS = async (id,os) => {
  if (!id) {
    throw new Error('ID');
  }
  try {
    const response = await api.put(`/osremove_item/${id}`,os);
    return response;
  } catch (error) {
    console.error('Erro ao aprovar O.S. :', error);
    throw error;
  }
};