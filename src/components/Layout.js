import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import '../styles/Layout.css';

function Layout() {
  const [username, setUser] = useState('');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCadastrosOpen, setCadastrosOpen] = useState(false);
  const [isMovimentacaoOpen, setMovimentacaoOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('username');
    if (loggedInUser) {
      setUser(loggedInUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  const toggleCadastros = () => {
    setCadastrosOpen(!isCadastrosOpen);
    setMovimentacaoOpen(false); // Fecha o submenu de movimentação
  };

  const toggleMovimentacao = () => {
    setMovimentacaoOpen(!isMovimentacaoOpen);
    setCadastrosOpen(false); // Fecha o submenu de cadastros
  };

  return (
    <div>
      <header id="header">
        <div id="header-content">
          <button id="menu-button" onClick={toggleMenu}>
            {isMenuOpen ? 'Fechar Menu' : 'Abrir Menu'}
          </button>
          <nav id="menu" className={isMenuOpen ? 'show' : ''}>
            <a href="/home" className="menu-item">Home</a>
            <div id="cadastros" className="menu-item" onClick={toggleCadastros}>
              <span>Cadastros</span>
              <div id="cadastros-submenu" className={isCadastrosOpen ? 'submenu' : ''}>
                <a href="/fornecedores" className="submenu-item">Fornecedores</a>
                <a href="/clientes" className="submenu-item">Clientes</a>
                <a href="/produtos" className="submenu-item">Produtos</a>
              </div>
            </div>
            <div id="movimentacao" className="menu-item" onClick={toggleMovimentacao}>
              <span>Movimentação</span>
              <div id="movimentacao-submenu" className={isMovimentacaoOpen ? 'submenu' : ''}>
                <a href="/notafiscal" className="submenu-item">Lançar NF-e</a>
                <a href="/vendas" className="submenu-item">Gestão de Vendas</a>
              </div>
            </div>
          </nav>
          <div id="user-info">
            <span id="user-text">Bem-vindo, </span>
            <span id="username">{username}</span>
            <button onClick={handleLogout} id="logout-button">Sair</button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
