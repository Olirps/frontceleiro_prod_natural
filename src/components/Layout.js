// src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import AlteraSenhaUsuario from '../components/AlteraSenhaUsuario';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission';
import { menuData } from '../config/MenuItem'

function Layout() {
  const { permissions } = useAuth();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [username, setUser] = useState('');
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [hoverTimeout, setHoverTimeout] = useState(null);
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
    // Fecha todos os submenus quando o menu principal é fechado
    if (isMenuOpen) {
      setOpenSubmenus({});
    }
  };

  const openSubmenu = (menuId) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menuId]: true
    }));
  };

  const closeSubmenu = (menuId) => {
    // Usamos um timeout para evitar que o submenu feche muito rápido
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    const timeout = setTimeout(() => {
      setOpenSubmenus(prev => ({
        ...prev,
        [menuId]: false
      }));
    }, 10); // Pequeno delay para permitir movimento entre menu e submenu

    setHoverTimeout(timeout);
  };

  // Função que retorna true se o usuário tem permissão para visualizar o item de menu
  const canViewMenuItem = (pageName) => {
    const permite = hasPermission(permissions, pageName, 'view');
    return permite;
  };

  // Estrutura de dados para os menus - FÁCIL DE MODIFICAR


  // Componente recursivo para renderizar menus
  const renderMenuItems = (items, level = 0) => {
    return items.map(item => {
      // Verifica se o usuário tem permissão para ver este item
      const hasPermission = Array.isArray(item.permission)
        ? item.permission.some(p => canViewMenuItem(p))
        : canViewMenuItem(item.permission);

      if (!hasPermission) return null;

      // Se for um link simples sem submenu
      if (!item.submenu) {
        return (
          <Link
            key={item.id}
            to={item.path}
            className="block px-4 py-2 text-white hover:bg-blue-600 transition-colors duration-200"
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        );
      }

      // Se for um item com submenu
      return (
        <div
          key={item.id}
          className="relative"
          onMouseEnter={() => openSubmenu(item.id)}
          onMouseLeave={() => closeSubmenu(item.id)}
        >
          <button
            className="w-full text-left px-4 py-2 text-white hover:bg-blue-600 transition-colors duration-200 flex justify-between items-center"
          >
            <span>{item.label}</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openSubmenus[item.id] && (
            <div
              className={`
      ${level === 0
                  ? 'md:absolute md:left-0 md:top-full bg-blue-700 md:shadow-lg md:rounded-md z-10 md:min-w-[200px] border border-blue-600'
                  : 'md:absolute md:left-full md:top-0 bg-blue-700 md:shadow-lg md:rounded-md z-10 md:min-w-[200px] border border-blue-600'}
      block md:block
    `}
            >
              {renderMenuItems(item.submenu, level + 1)}
            </div>
          )}

        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-20">
      <header className="bg-[#007bff] shadow-sm fixed top-0 left-0 right-0 z-30">
        <div className="container mx-auto px-4 py-0 flex justify-between items-center">
          {/* Botão para mobile */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-4 text-white hover:bg-blue-600 focus:outline-none"
          >
            {isMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Menu de navegação */}
          <nav className={`${isMenuOpen ? 'block' : 'hidden'} md:block absolute md:relative top-full md:top-0 left-0 w-full md:w-auto bg-blue-700 md:bg-[#007bff] shadow-md md:shadow-none z-20`}>
            <div className="md:flex">
              {renderMenuItems(menuData)}
            </div>
          </nav>

          {/* Área do usuário */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white p-2"
            >
              <span className="sr-only">Abrir menu do usuário</span>
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-[#007bff] font-medium">
                {username.charAt(0).toUpperCase()}
              </div>
              <span className="ml-2 text-white hidden md:inline">
                {`Bem vindo ${username.toUpperCase()}`}
              </span>
              <svg className="ml-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown do usuário */}
            {open && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-30">
                <div className="py-1">
                  <button
                    onClick={() => { setModalOpen(true); setOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Alterar Senha
                  </button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-red-600"
                  >
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Modal de alteração de senha */}
      <AlteraSenhaUsuario
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(dados) => {
          console.log("Alterar senha:", dados);
          setModalOpen(false);
        }}
      />
    </div>
  );
}

export default Layout;