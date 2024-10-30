import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Fornecedores from './pages/Fornecedores';
import Produtos from './pages/Produtos';
import Carros from './pages/Carros';
import LancaNFe from './pages/LancaNFe';
import Locacoes from './pages/Locacoes';
import Layout from './components/Layout'; // Importar o novo componente Layout
import { useAuth } from './context/AuthContext'; // Importe o hook useAuth

function App() {
  const { isAuthenticated } = useAuth(); // Use o contexto de autenticação

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
          <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
          <Route path="/fornecedores" element={isAuthenticated ? <Fornecedores /> : <Navigate to="/login" />} />
          <Route path="/produtos" element={isAuthenticated ? <Produtos /> : <Navigate to="/login" />} />
          <Route path="/carros" element={isAuthenticated ? <Carros /> : <Navigate to="/login" />} />
          <Route path="/notafiscal" element={isAuthenticated ? <LancaNFe /> : <Navigate to="/login" />} />
          <Route path="/locacao" element={isAuthenticated ? <Locacoes /> : <Navigate to="/login" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
