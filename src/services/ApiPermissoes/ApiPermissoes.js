// src/services/authorization.js
import api from '../../services/api';

/**
 * Solicita autorização de uma ação no backend
 * @param {Object} payload
 * @param {string} payload.username - Usuário que vai autorizar
 * @param {string} payload.password - Senha do usuário que vai autorizar
 * @param {string} payload.page - Nome da página / recurso
 * @param {string} payload.action - Ação a ser autorizada (ex: view, insert, delete)
 * @param {string} [payload.requestedBy] - Usuário que solicitou a ação
 */
export const requestAuthorization = async (payload) => {
    try {
        const response = await api.post('/auth/authorize', payload);
        return response.data; // Retorna dados do usuário que autorizou
    } catch (error) {
        console.error('Erro ao solicitar autorização:', error);
        throw error.response?.data || error;
    }
};
