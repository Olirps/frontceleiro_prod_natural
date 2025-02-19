// src/pages/Login.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { login as loginService } from '../services/api';
import '../styles/Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await loginService(username, password);


      // Verificando a estrutura correta da resposta
      if (!response.user || !response.token) {
        throw new Error('Resposta da API mal formatada.');
      }

      const { token, user } = response;  // Desestruturando diretamente a resposta

      // Garantir que as permissões estão presentes
      const permissoes = user.permissoes || [];

      // Armazenar o token no localStorage
      localStorage.setItem('authToken', token);

      // Usar a função de login do contexto para configurar o estado de autenticação
      login(token, user, permissoes);

      // Redirecionar para a página inicial após o login
      window.location.href = '/home';
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Usuário ou senha inválido. Por favor tente novamente.');
    }
  };


  return (
    <div id="login-container">
      <div id="form-container">
        <h1 id="login-title">Login</h1>
        <form onSubmit={handleLogin} id="login-form">
          <div id="username-group" className="input-group">
            <label htmlFor="username" id="username-label">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input"
            />
          </div>
          <div id="password-group" className="input-group password-group">
            <label htmlFor="password" id="password-label">Password</label>
            <div id="password-container" className="password-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input password-input"
              />
              <span
                id="password-toggle"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>
          {error && <p id="error-message" className="error">{error}</p>}
          <button type="submit" id="login-button" className="button">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
