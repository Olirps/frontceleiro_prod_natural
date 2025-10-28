import api from '../../services/api';


export const createPet = async (pet) => {
    try {
        const response = await api.post('/petsApi/pets/', pet);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar pet:', error);
        throw error;
    }
};

export const getPetById = async (id) => {
    if (!id) throw new Error('ID do pet é obrigatório');
    try {
        const response = await api.get(`/petsApi/pets/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar pet:', error);
        throw error;
    }
};

export const getPetByIdTutor = async (id) => {
    if (!id) throw new Error('ID do pet é obrigatório');
    try {
        const response = await api.get(`/petsApi/petsTutor/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar pet pelo ID do Tutor:', error);
        throw error;
    }
};

export const updatePet = async (id, data) => {
    if (!id) throw new Error('ID do pet é obrigatório');
    try {
        const response = await api.put(`/petsApi/pets/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar pet:', error);
        throw error;
    }
};


export const deletePet = async (petId) => {
  if (!petId) throw new Error('ID do pet é obrigatório para exclusão');

  try {
    const response = await api.delete(`/petsApi/pets/${petId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar pet:', error);
    throw error;
  }
};
