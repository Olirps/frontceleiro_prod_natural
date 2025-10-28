import api from '../../services/api';


// 🔹 Lista todos os usos de pacotes
export const getUsosPorPacoteCliente = async () => {
  try {
    const response = await api.get('/uso-pacote')
    return response.data
  } catch (error) {
    console.error('Erro ao listar usos de pacotes:', error)
    throw error
  }
}

// 🔹 Busca um uso específico
export const getUsoPacoteById = async (id) => {
  try {
    const response = await api.get(`/pacotesCliente/Clientes/saldo/${id}`)
    return response.data
  } catch (error) {
    console.error('Erro ao buscar uso de pacote:', error)
    throw error
  }
}

// 🔹 Registra um novo uso (quando o cliente utiliza um serviço do pacote)
export const registrarUsoPacote = async (data) => {
  try {
    const response = await api.post('/pacotesCliente/Clientes/uso', data)
    return response.data
  } catch (error) {
    console.error('Erro ao registrar uso de pacote:', error)
    throw error
  }
}

// 🔹 Atualiza informações de um uso (caso necessário)
export const updateUsoPacote = async (id, data) => {
  try {
    const response = await api.put(`/uso-pacote/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Erro ao atualizar uso de pacote:', error)
    throw error
  }
}

// 🔹 Exclui um registro de uso (somente se não vinculado à OS)
export const deleteUsoPacote = async (id) => {
  try {
    const response = await api.delete(`/uso-pacote/${id}`)
    return response.data
  } catch (error) {
    console.error('Erro ao excluir uso de pacote:', error)
    throw error
  }
}
