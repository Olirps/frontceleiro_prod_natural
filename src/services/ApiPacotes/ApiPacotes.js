import api from '../../services/api';

// 🔹 Listar todos os pacotes da empresa
export const getPacotes = async (filtroNome = '') => {
  try {
    let nome = '';
    if (!filtroNome) {
      filtroNome = ''
    } else {
      nome = filtroNome.pacoteDescricao
    }
    const response = await api.get('/pacotesApi/pacotes', {
      params: { nome } // envia o nome como query param
    })
    return response.data
  } catch (error) {
    console.error('Erro ao buscar pacotes:', error)
    throw error
  }
}


// 🔹 Buscar um pacote específico por ID
export const getPacoteById = async (id) => {
  try {
    const response = await api.get(`/pacotesApi/pacotes/${id}`)
    return response.data
  } catch (error) {
    console.error('Erro ao buscar pacote:', error)
    throw error
  }
}

// 🔹 Adicionar novo pacote
export const addPacote = async (dados) => {
  try {
    const response = await api.post('/pacotesApi/pacotes', dados)
    return response.data
  } catch (error) {
    console.error('Erro ao adicionar pacote:', error)
    throw error
  }
}

// 🔹 Atualizar pacote existente
export const updatePacote = async (id, dados) => {
  try {
    const response = await api.put(`/pacotesApi/pacotes/${id}`, dados)
    return response.data
  } catch (error) {
    console.error('Erro ao atualizar pacote:', error)
    throw error
  }
}

// 🔹 Excluir pacote
export const deletePacote = async (id) => {
  try {
    const response = await api.delete(`/pacotesApi/pacotes/${id}`)
    return response.data
  } catch (error) {
    console.error('Erro ao excluir pacote:', error)
    throw error
  }
}
