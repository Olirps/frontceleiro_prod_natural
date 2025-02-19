import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredPermission }) => {
    const { isAuthenticated, user } = useAuth(); // Pega o estado de autenticação e as permissões do usuário

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }
    // Se a permissão necessária for 'view', verifica se o usuário tem a permissão de 'view'
    const hasPermission = user?.permissoes[requiredPermission];


    if (requiredPermission && !hasPermission) {
        return <Navigate to="/login" />;  // Se o usuário não tiver permissão, redireciona
    }

    return children; // Se autenticado e com permissão, renderiza a página
};

export default PrivateRoute;
