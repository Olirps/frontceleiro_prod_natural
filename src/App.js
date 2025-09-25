// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Fornecedores from './pages/Fornecedores';
import SubgrupoPage from './pages/SubgrupoPage';
import GrupoPage from './pages/GrupoPage';
import TipoContratoLayout from './pages/TipoContratoLayout';
import ContratosLayout from './pages/ContratosLayout';
import Produtos from './pages/Produtos';
import LancaNFe from './pages/LancaNFe';
import RelatorioVendasClientePage from './pages/RelatorioVendasClientePage';
import MovimentacaoProdutos from './pages/MovimentacaoProdutos';
import Layout from './components/Layout';
import { useAuth } from './context/AuthContext';
import Veiculos from './pages/Veiculos';
import TipoContainer from './pages/TipoContainer';
import Container from './pages/Container';
import MovimentaContainerPage from './pages/MovimentaContainerPage';
import MapaContainersPage from './pages/MapaContainersPage';
import Clientes from './pages/Clientes';
import Funcionarios from './pages/Funcionarios';
import MovimentacaoFinanceiraDespesa from './pages/MovimentacaoFinanceiraDespesa';
import MovimentacaoFinanceiraReceitas from './pages/MovimentacaoFinanceiraReceitas';
import ContasBancarias from './pages/ContasBancarias';
import Vendas from './pages/Vendas';
import VendasNew from './pages/VendasNew/Vendas';
import ComandasAbertasPage from './pages/ComandasAbertasPage';
import Permissoes from './pages/Permissoes';
import ContasPagas from './pages/ContasPagas';
import ProdutosVendidos from './pages/ProdutosVendidos';
import Empresa from './pages/Empresa';
import ContasPendentes from './pages/ContasPendentes';
import OSStatus from './pages/OSStatus';
import OSPage from './pages/OSPage';
import RelatorioSaldoEstoquePage from './pages/RelatorioSaldoEstoquePage';
import FluxoCaixaPage from './pages/FluxoCaixaPage';
import TefTransacoesPage from './pages/TefTransacoesPage';
import UsuariosPage from './pages/UsuariosPage';
import MenusPage from './pages/MenusPage';
import PromocaoPage from './pages/PromocaoPage';
import AtualizacaoPrecoPage from './pages/AtualizacaoPrecoPage';

function App() {
  const { isAuthenticated, permissions } = useAuth(); // Pega o estado de autenticação e as permissões do usuário

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route
            path="/home"
            element={isAuthenticated ? <Home /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/permissoes"
            element={isAuthenticated ? <Permissoes /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/clientes"
            element={isAuthenticated ? <Clientes /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/funcionarios"
            element={isAuthenticated ? <Funcionarios /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/fornecedores"
            element={isAuthenticated ? <Fornecedores /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/osstatus"
            element={isAuthenticated ? <OSStatus /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/grupoproduto"
            element={isAuthenticated ? <GrupoPage /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/subgrupoproduto"
            element={isAuthenticated ? <SubgrupoPage /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/produtos"
            element={isAuthenticated ? <Produtos /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/veiculos"
            element={isAuthenticated ? <Veiculos /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/notafiscal"
            element={isAuthenticated ? <LancaNFe /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/movimentacaoprodutos"
            element={isAuthenticated ? <MovimentacaoProdutos /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/movimentacaofinanceiradespesas"
            element={isAuthenticated ? <MovimentacaoFinanceiraDespesa /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/movimentacaofinanceirareceitas"
            element={isAuthenticated ? <MovimentacaoFinanceiraReceitas /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/contasbancarias"
            element={isAuthenticated ? <ContasBancarias /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/vendas"
            element={isAuthenticated ? <Vendas /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/vendas-abertas"
            element={isAuthenticated ? <ComandasAbertasPage /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/os"
            element={isAuthenticated ? <OSPage /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/contasliquidadas"
            element={isAuthenticated ? <ContasPagas /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/produtosvendidos"
            element={isAuthenticated ? <ProdutosVendidos /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/empresas"
            element={isAuthenticated ? <Empresa /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/contaspendentes"
            element={isAuthenticated ? <ContasPendentes /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/estoque"
            element={isAuthenticated ? <RelatorioSaldoEstoquePage /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/tipolayout"
            element={isAuthenticated ? <TipoContratoLayout /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/contratolayout"
            element={isAuthenticated ? <ContratosLayout /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/tipocontainer"
            element={isAuthenticated ? <TipoContainer /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/container"
            element={isAuthenticated ? <Container /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/container-movimentacao"
            element={isAuthenticated ? <MovimentaContainerPage /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/container-localiza"
            element={isAuthenticated ? <MapaContainersPage /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/clientes_periodo"
            element={isAuthenticated ? <RelatorioVendasClientePage /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/fluxo-caixa"
            element={isAuthenticated ? <FluxoCaixaPage /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/movimentacaotef"
            element={isAuthenticated ? <TefTransacoesPage /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/usuarios"
            element={isAuthenticated ? <UsuariosPage /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/menus"
            element={isAuthenticated ? <MenusPage /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/promocoes"
            element={isAuthenticated ? <PromocaoPage /> : null} // Condicionalmente não renderiza
          />
          <Route
            path="/atualiza-preco"
            element={isAuthenticated ? <AtualizacaoPrecoPage /> : null} // Condicionalmente não renderiza
          />
        </Route>
      </Routes>
    </Router>
  );
}
export default App;
