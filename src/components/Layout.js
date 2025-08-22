// src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import '../styles/Layout.css';
import AlteraSenhaUsuario from '../components/AlteraSenhaUsuario';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Importar a função para checar permissões

function Layout() {
  const { permissions } = useAuth(); // Pega as permissões do usuário
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
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
    const permite = hasPermission(permissions, pageName, 'view');
    return permite;
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
                  {(canViewMenuItem('clientes') || canViewMenuItem('funcionarios') || canViewMenuItem('fornecedores')) && (
                    <div id="clientes" className="submenu-item submenu-parent">
                      <span>Pessoas</span>
                      <div id="clientes-submenu" className="submenu">
                        {canViewMenuItem('clientes') && <Link to="/clientes" className="submenu-item">Clientes</Link>}
                        {canViewMenuItem('funcionarios') && <Link to="/funcionarios" className="submenu-item">Funcionários</Link>}
                        {canViewMenuItem('fornecedores') && <Link to="/fornecedores" className="submenu-item">Fornecedores</Link>}
                      </div>
                    </div>
                  )}
                  {(canViewMenuItem('produtos') || canViewMenuItem('grupoproduto') || canViewMenuItem('subgrupoproduto')) && (
                    <div id="produtos" className="submenu-item submenu-parent">
                      <span>Produtos</span>
                      <div id="produtos-submenu" className="submenu">
                        {canViewMenuItem('grupoproduto') && <Link to="/grupoproduto" className="submenu-item">Grupos</Link>}
                        {canViewMenuItem('subgrupoproduto') && <Link to="/subgrupoproduto" className="submenu-item">Sub Grupos</Link>}
                        {canViewMenuItem('produtos') && <Link to="/produtos" className="submenu-item">Produtos/Serviços</Link>}
                      </div>
                    </div>
                  )}
                  {canViewMenuItem('osstatus') && <Link to="/osstatus" className="submenu-item">Status O.S.</Link>}
                  {canViewMenuItem('veiculos') && <Link to="/veiculos" className="submenu-item">Veículos</Link>}
                  {canViewMenuItem('contasbancarias') && <Link to="/contasbancarias" className="submenu-item">Contas Bancárias</Link>}
                  {/* Novo submenu Contrato */}
                  {(canViewMenuItem('tipolayout') || canViewMenuItem('contratolayout')) && (
                    <div id="contrato" className="submenu-item submenu-parent">
                      <span>Contrato</span>
                      <div id="contrato-submenu" className="submenu">
                        {canViewMenuItem('tipolayout') && <Link to="/tipolayout" className="submenu-item">Tipo Layout</Link>}
                        {canViewMenuItem('contratolayout') && <Link to="/contratolayout" className="submenu-item">Contrato Layout</Link>}
                      </div>
                    </div>
                  )}
                  {canViewMenuItem('container') && <Link to="/container" className="submenu-item">Containers</Link>}
                </div>
              </div>
            ) : null}

            {/* Movimentação menu item with a submenu */}
            {canViewMenuItem('notafiscal') || canViewMenuItem('movimentacaoprodutos') || canViewMenuItem('vendas') || canViewMenuItem('os') ?
              (
                <div id="movimentacao" className="menu-item" onClick={toggleMovimentacao}>
                  <span>Movimentação</span>
                  <div id="movimentacao-submenu" className={isMovimentacaoOpen ? 'submenu' : ''}>
                    {canViewMenuItem('notafiscal') && <Link to="/notafiscal" className="submenu-item">Lançar NF-e</Link>}
                    {canViewMenuItem('vendas') && <Link to="/vendas" className="submenu-item">Vendas</Link>}
                    {(canViewMenuItem('container-movimentacao') || canViewMenuItem('containers-localiza')) && (
                      <div id="container-movimentacao" className="submenu-item submenu-parent">
                        <span>Containers</span>
                        <div id="container-submenu" className="submenu">
                          {canViewMenuItem('container-movimentacao') && <Link to="/container-movimentacao" className="submenu-item">Movimentação</Link>}
                          {canViewMenuItem('container-localiza') && <Link to="/container-localiza" className="submenu-item">Localização</Link>}
                        </div>
                      </div>
                    )}
                    {canViewMenuItem('os') && <Link to="/os" className="submenu-item">Ordem de Serviço</Link>}
                    {canViewMenuItem('movimentacaoprodutos') && <Link to="/movimentacaoprodutos" className="submenu-item">Movimentação de Produtos</Link>}
                  </div>
                </div>
              ) : null}

            {/* Gestão Financeira menu item with a submenu */}
            {canViewMenuItem('contaspagar') || canViewMenuItem('movimentacaofinanceiradespesas') || canViewMenuItem('movimentacaofinanceirareceitas') ?
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
            {canViewMenuItem('relatorios') || canViewMenuItem('produtosvendidos') || canViewMenuItem('contaspendentes') || canViewMenuItem('estoque') ? (
              <div id="relatorios" className="menu-item" onClick={toggleRelatorios}>
                <span>Relatórios</span>
                <div id="relatorios-submenu" className={isRelatoriosOpen ? 'submenu' : ''}>
                  {canViewMenuItem('produtosvendidos') && <Link to="/produtosvendidos" className="submenu-item">Produtos Vendidos</Link>}
                  {canViewMenuItem('contaspendentes') && <Link to="/contaspendentes" className="submenu-item">Contas Pendentes</Link>}
                  {canViewMenuItem('contasliquidadas') && <Link to="/contasliquidadas" className="submenu-item">Contas/Parcelas Liquidadas</Link>}
                  {canViewMenuItem('estoque') && <Link to="/estoque" className="submenu-item">Estoque</Link>}
                  {(canViewMenuItem('vendas-relatorios') || canViewMenuItem('vendas_por_cliente_periodo')) && (
                    <div id="vendas-relatorios" className="submenu-item submenu-parent">
                      <span>Relatórios de Vendas</span>
                      <div id="vendas-relatorios-submenu" className="submenu">
                        {canViewMenuItem('vendas_por_cliente_periodo') && <Link to="/clientes_periodo" className="submenu-item">Clientes/Período</Link>}
                      </div>
                    </div>
                  )}
                  {(canViewMenuItem('financeiro')) && (
                    <div id="finaceiro-relatorios" className="submenu-item submenu-parent">
                      <span>Financeiro</span>
                      <div id="financeiro-relatorios-submenu" className="submenu">
                        {canViewMenuItem('fluxo-caixa') && <Link to="/fluxo-caixa" className="submenu-item">Fluxo de Caixa</Link>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

          </nav>
        </div>
        {/* User information and logout button */}
        <div className="relative inline-block text-left">
          {/* Botão principal */}
          <button
            onClick={() => setOpen(!open)}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-300 rounded-lg text-sm font-medium"
          >
            {`Bem vindo ${username.toUpperCase()}`}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[9999]">
              <ul className="py-1 text-sm text-gray-700">
                <li>
                  <button
                    onClick={() => { setModalOpen(true); setOpen(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    Alterar Senha
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
                  >
                    Sair
                  </button>
                </li>
              </ul>
            </div>
          )}
          <AlteraSenhaUsuario
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={(dados) => {
              console.log("Alterar senha:", dados);
              setModalOpen(false);
            }}
          />
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
