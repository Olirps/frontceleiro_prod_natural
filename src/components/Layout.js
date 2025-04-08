// src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import '../styles/Layout.css';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Importar a função para checar permissões

function Layout() {
  const { permissions } = useAuth(); // Pega as permissões do usuário

  const [username, setUser] = useState('');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCadastrosOpen, setCadastrosOpen] = useState(false);
  const [isMovimentacaoOpen, setMovimentacaoOpen] = useState(false);
  const [isGestaoFinanceiraOpen, setGestaoFinanceiraOpen] = useState(false); // Novo estado para "Gestão Financeira"
  const [isRelatoriosOpen, setRelatoriosOpen] = useState(false); // Novo estado para "Gestão Financeira"
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
    setGestaoFinanceiraOpen(false); // Fecha o submenu de gestão financeira
    setRelatoriosOpen(false); // Fecha o submenu de relatorios
  };

  const toggleMovimentacao = () => {
    setMovimentacaoOpen(!isMovimentacaoOpen);
    setCadastrosOpen(false); // Fecha o submenu de cadastros
    setGestaoFinanceiraOpen(false); // Fecha o submenu de gestão financeira
    setRelatoriosOpen(false); // Fecha o submenu de relatorios

  };

  const toggleGestaoFinanceira = () => {
    setGestaoFinanceiraOpen(!isGestaoFinanceiraOpen);
    setCadastrosOpen(false); // Fecha o submenu de cadastros
    setMovimentacaoOpen(false); // Fecha o submenu de movimentação
    setRelatoriosOpen(false); // Fecha o submenu de relatorios

  };

  const toggleRelatorios = () => {
    setRelatoriosOpen(!isRelatoriosOpen); // Fecha o submenu de relatorios
    setGestaoFinanceiraOpen(false);
    setCadastrosOpen(false); // Fecha o submenu de cadastros
    setMovimentacaoOpen(false); // Fecha o submenu de movimentação
  };

  // Função que retorna true se o usuário tem permissão para visualizar o item de menu
  const canViewMenuItem = (pageName) => {
    return hasPermission(permissions, pageName, 'view');
  };

  return (
    <div>
      <header id="header">
        <div id="header-content">
          {/* Button to toggle the main menu */}
          <button id="menu-button" onClick={toggleMenu}>
            {isMenuOpen ? 'Fechar Menu' : 'Abrir Menu'}
          </button>
          {/* Main navigation menu */}
          <nav id="menu" className={isMenuOpen ? 'show' : ''}>
            {canViewMenuItem('home') && <Link to="/home" className="menu-item">Home</Link>}

            {/* Cadastros menu item with a submenu */}
            {canViewMenuItem('permissoes') || canViewMenuItem('clientes') || canViewMenuItem('funcionarios') || canViewMenuItem('fornecedores') || canViewMenuItem('produtos') || canViewMenuItem('veiculos')
              || canViewMenuItem('contasbancarias') || canViewMenuItem('osstatus') ? (
              <div id="cadastros" className="menu-item" onClick={toggleCadastros}>
                <span>Cadastros</span>
                <div id="cadastros-submenu" className={isCadastrosOpen ? 'submenu' : ''}>
                  {canViewMenuItem('permissoes') && <Link to="/permissoes" className="submenu-item">Permissões</Link>}
                  {canViewMenuItem('empresas') && <Link to="/empresas" className="submenu-item">Empresas</Link>}
                  {canViewMenuItem('clientes') && <Link to="/clientes" className="submenu-item">Clientes</Link>}
                  {canViewMenuItem('funcionarios') && <Link to="/funcionarios" className="submenu-item">Funcionários</Link>}
                  {canViewMenuItem('fornecedores') && <Link to="/fornecedores" className="submenu-item">Fornecedores</Link>}
                  {canViewMenuItem('produtos') && <Link to="/produtos" className="submenu-item">Produtos/Serviços</Link>}
                  {canViewMenuItem('osstatus') && <Link to="/osstatus" className="submenu-item">Status O.S.</Link>}
                  {canViewMenuItem('veiculos') && <Link to="/veiculos" className="submenu-item">Veículos</Link>}
                  {canViewMenuItem('contasbancarias') && <Link to="/contasbancarias" className="submenu-item">Contas Bancárias</Link>}
                </div>
              </div>
            ) : null}

            {/* Movimentação menu item with a submenu */}
            {canViewMenuItem('notafiscal') || canViewMenuItem('movimentacaoprodutos') || canViewMenuItem('vendas') || canViewMenuItem('os')?
            (
              <div id="movimentacao" className="menu-item" onClick={toggleMovimentacao}>
                <span>Movimentação</span>
                <div id="movimentacao-submenu" className={isMovimentacaoOpen ? 'submenu' : ''}>
                  {canViewMenuItem('notafiscal') && <Link to="/notafiscal" className="submenu-item">Lançar NF-e</Link>}
                  {canViewMenuItem('vendas') && <Link to="/vendas" className="submenu-item">Vendas</Link>}
                  {canViewMenuItem('os') && <Link to="/os" className="submenu-item">Ordem de Serviço</Link>}
                  {canViewMenuItem('movimentacaoprodutos') && <Link to="/movimentacaoprodutos" className="submenu-item">Movimentação de Produtos</Link>}
                </div>
              </div>
            ) : null}

            {/* Gestão Financeira menu item with a submenu */}
            {canViewMenuItem('contaspagar') || canViewMenuItem('movimentacaofinanceiradespesas')|| canViewMenuItem('movimentacaofinanceirareceitas')? 
            (
              <div id="gestao-financeira" className="menu-item" onClick={toggleGestaoFinanceira}>
                <span>Gestão Financeira</span>
                <div id="gestao-financeira-submenu" className={isGestaoFinanceiraOpen ? 'submenu' : ''}>
                  {canViewMenuItem('movimentacaofinanceiradespesas') && <Link to="/movimentacaofinanceiradespesas" className="submenu-item">Contas a Pagar</Link>}
                  {canViewMenuItem('movimentacaofinanceirareceitas') && <Link to="/movimentacaofinanceirareceitas" className="submenu-item">Contas a Receber</Link>}
                </div>
              </div>
            ) : null}
            {/* Relatórios */}
            {canViewMenuItem('relatorios') || canViewMenuItem('produtosvendidos') || canViewMenuItem('contaspendentes')? (
              <div id="relatorios" className="menu-item" onClick={toggleRelatorios}>
                <span>Relatórios</span>
                <div id="relatorios-submenu" className={isRelatoriosOpen ? 'submenu' : ''}>
                  {canViewMenuItem('produtosvendidos') && <Link to="/produtosvendidos" className="submenu-item">Produtos Vendidos</Link>}
                  {canViewMenuItem('contaspendentes') && <Link to="/contaspendentes" className="submenu-item">Contas Pendentes</Link>}
                  {canViewMenuItem('contasliquidadas') && <Link to="/contasliquidadas" className="submenu-item">Contas/Parcelas Liquidadas</Link>}

                </div>
              </div>
            ) : null}

          </nav>
        </div>
        {/* User information and logout button */}
        <div>
          <span id="usuario">{`Bem vindo ${username.toUpperCase()}`}</span>
        </div>
        <div>
          <button onClick={handleLogout} id="logout-button">Sair</button>
        </div>
      </header>
      {/* Main content area */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
