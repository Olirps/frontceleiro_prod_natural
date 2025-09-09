import api from '../../services/api';


export const getUsuarios = async ({ page = 1, limit = 10, ...filtro } = {}) => {
    try {
        // Faz a requisição enviando page e limit como params
        const response = await api.get('userRouter/usuarios', {
            params: { page, limit, ...filtro },
        });
        return {
            data: response.data.data || [],
            totalPages: response.data.totalPages || 1,
            currentPage: response.data.currentPage || 1,
            perPage: limit,
        };
    } catch (error) {
        console.error(error.response?.data?.erro || 'Erro ao buscar usuários:', error);
        throw error.response?.data?.erro || 'Erro desconhecido';
    }
};

export const getUsuarioById = async (id) => {
    try {
        const response = await api.get(`/usuarios/${id}`);
        return response.data; // Retorna os dados do usuário
    } catch (error) {
        console.error('Erro ao buscar usuário por ID:', error);
        throw error; // Lança o erro para tratamento em outro lugar
    }
};

export const saveUsuario = async (usuario) => {
    try {
        if (usuario.id) {
            // Atualiza usuário existente
            const response = await api.put(`/userRouter/usuarios/${usuario.id}`, usuario);
            return response.data; // Retorna os dados atualizados do usuário
        } else {
            // Cria novo usuário
            const response = await api.post('/auth/register', usuario);
            return response.data; // Retorna os dados do novo usuário
        }
    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        throw error; // Lança o erro para tratamento em outro lugar
    }
};

// Altera a senha do usuário logado
export const updateUsuarioSenha = async (id, { oldPassword, newPassword }) => {
    try {
        const response = await api.put(`userRouter/usuarios/${id}/senha`, { oldPassword, newPassword });
        return response.data;
    } catch (error) {
        console.error(error.response?.data?.erro || 'Erro ao alterar senha:', error);
        throw error.response?.data?.erro || 'Erro desconhecido ao alterar senha';
    }
};