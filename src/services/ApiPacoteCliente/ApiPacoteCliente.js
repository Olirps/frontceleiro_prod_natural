import api from '../../services/api';

// 🔹 Lista todos os pacotes de clientes
export const getPacotesClientes = async ({ page = 1, limit = 10, ...filters } = {}) => {
  try {
    const response = await api.get('/pacotesCliente/Clientes/', {
      params: {
        page,
        limit,
        ...filters
      }
    })
    return response.data
  } catch (error) {
    console.error('Erro ao listar pacotes de clientes:', error)
    throw error
  }
}

// 🔹 Busca um pacote específico
export const getPacoteClienteById = async (id) => {
  try {
    const response = await api.get(`/pacotesCliente/Cliente/${id}`)
    return response.data
  } catch (error) {
    console.error('Erro ao buscar pacote do cliente:', error)
    throw error
  }
}

// 🔹 Cadastra um novo pacote para o cliente
export const addPacoteCliente = async (data) => {
  try {
    const response = await api.post('/pacotesCliente/Clientes', data)
    return response.data
  } catch (error) {
    console.error('Erro ao adicionar pacote para cliente:', error)
    throw error
  }
}

// 🔹 Atualiza um pacote existente
export const updatePacoteCliente = async (id, data) => {
  try {
    const response = await api.put(`/pacotesCliente/Clientes/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Erro ao atualizar pacote do cliente:', error)
    throw error
  }
}

// 🔹 Exclui um pacote do cliente
export const deletePacoteCliente = async (id) => {
  try {
    const response = await api.delete(`/pacotesCliente/Clientes/${id}`)
    return response.data
  } catch (error) {
    console.error('Erro ao excluir pacote do cliente:', error)
    throw error
  }
}
