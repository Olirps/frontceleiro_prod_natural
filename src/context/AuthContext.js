// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { decodeJWT } from '../utils/functions';


// Contexto para armazenar o estado de autenticação
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    // Verificar se há um token armazenado no localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      // Aqui você pode decodificar o token e atualizar o estado com as permissões e o usuário
      const decodedUser = decodeJWT(token); // Use jwt.decode se estiver usando JWT
      setUser(decodedUser);
      setPermissions(decodedUser.permissoes || []);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (token, user, permissions) => {
    localStorage.setItem('authToken', token); // Armazena o token no localStorage
    localStorage.setItem('username', user.username);
    setIsAuthenticated(true);
    setUser(user);
    setPermissions(permissions);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
    setPermissions([]);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, permissions, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};