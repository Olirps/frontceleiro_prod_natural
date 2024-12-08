import axios from 'axios';

// Crie uma instância do axios com a URL base
const api = axios.create({
  baseURL: 'http://3.143.233.203:3001/api',
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
export const login = (username, password) => {
  return api.post('/auth/login', { username, password });
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

// Funções para gerenciar carros
export const getCarros = async (filters = {}) => {
  const response = await api.get('/carros', { params: filters });
  return response;
};

export const addCarro = async (carro) => {
  return api.post('/carros', carro);
};

export const updateCarro = async (id, carro) => {
  return api.put(`/carros/${id}`, carro);
};

export const getCarroById = async (id) => {
  return api.get(`/carros/${id}`);
};

// Funções para gerenciar marcas
export const getMarcas = async () => {
  return api.get('/marcas');
};

// Funções para gerenciar marcas
export const getMarcasById = async () => {
  return api.get('/marcas');
};

// Locação
export const getLocacoes = async () => {
  return api.get('/locacao');
};

export const addLocacao = async (carro) => {
  return api.post('/carros', carro);
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

export const vinculaProdutoNF = async (id, produto) => {
  return api.put(`/produtosnf/vincular/${id}`, produto);
};

export const desvinculaProdutoNF = async (id, produto) => {
  return api.put(`/produtosnf/desvincular/${id}`, produto);
};



// Funções para gerenciar produtos
export const getProdutos = async (filters = {}) => {
  const response = await api.get('/produtos', { params: filters });
  return response;
};

export const addProdutos = async(produto) => {
  return api.post('/produtos', produto);
};

export const updateProduto = (id, produto) => {
  return api.put(`/produtos/${id}`, produto);
};

export const getProdutoById = async(id) => {
  return api.get(`/produtos/${id}`);
};

// UFs e Municípios
export const getUfs =async () => {
  return api.get('/uf');
};

export const getMunicipios = async(id) => {
  return api.get(`/municipios/${id}`);
};

export const getMunicipiosIBGE = async (id, codMunIBGE) => {
  return api.get(`/municipios/mun/${id}`, codMunIBGE);
};

export const getUFIBGE = async (id, codIBGE) => {
  return api.get(`/uf/uf/${id}`, codIBGE);
};
