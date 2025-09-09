// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { decodeJWT } from '../utils/functions';


// Contexto para armazenar o estado de autenticação
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const logoutTimerRef = useRef(null);

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const scheduleAutoLogout = (expSeconds) => {
    clearLogoutTimer();
    if (!expSeconds) return;
    const nowSeconds = Math.floor(Date.now() / 1000);
    const secondsToExpiry = expSeconds - nowSeconds;
    if (secondsToExpiry <= 0) {
      logout();
      return;
    }
    logoutTimerRef.current = setTimeout(() => {
      logout();
    }, secondsToExpiry * 1000);
  };

  useEffect(() => {
    // Verificar se há um token armazenado no localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      const decodedUser = decodeJWT(token);
      const exp = decodedUser?.exp; // exp em segundos

      if (!decodedUser || (exp && exp * 1000 <= Date.now())) {
        // token inválido ou expirado
        logout();
      } else {
        setUser(decodedUser);
        setPermissions(decodedUser.permissoes || []);
        setIsAuthenticated(true);
        if (exp) scheduleAutoLogout(exp);
      }
    }
    return () => {
      clearLogoutTimer();
    };
  }, []);

  const login = (token, user, permissions) => {
    localStorage.setItem('authToken', token); // Armazena o token no localStorage
    localStorage.setItem('username', user.username);
    setIsAuthenticated(true);
    // Se vier um payload mais confiável do token, priorize-o
    const decoded = decodeJWT(token);
    setUser(decoded || user);
    setPermissions((decoded && decoded.permissoes) || permissions || []);
    if (decoded?.exp) scheduleAutoLogout(decoded.exp);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
    setPermissions([]);
    clearLogoutTimer();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, permissions, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};