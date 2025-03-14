import React, { useState, useEffect } from "react";
import ContasPagarSemana from "../components/ContasPagarSemana";
import ProdutosMaisVendidosSemana from "../components/ProdutosMaisVendidosSemana";
import "../styles/Home.css";
import { getContaPagarSemana, getProdutosVendidosSemana } from "../services/api";

function Home() {
  const [contas, setContas] = useState([]);
  const [produtosVendidos, setProdutosVendidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContasPagar = async () => {
      try {
        const contas = await getContaPagarSemana();
        const produtosVendidosSemana = await getProdutosVendidosSemana();
        setContas(contas.data);
        setProdutosVendidos(produtosVendidosSemana.data);
      } catch (error) {
        console.error("Erro ao buscar contas a pagar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContasPagar();
  }, []);

  return (
    <div id="home-container">
      <div className="watermark"></div>

      <div className="home-content">
        {/* Quadro de Contas a Pagar */}
        <div className="quadro-wrapper">
          <h2 className="quadro-titulo">Contas a Pagar (Semana)</h2>
          {loading ? <div className="spinner"></div> : contas.length > 0 ? (
            <ContasPagarSemana contas={contas} />
          ) : (
            <p className="sem-dados">Nenhuma conta a pagar nesta semana.</p>
          )}
        </div>

        {/* Quadro de Produtos Mais Vendidos */}
        <div className="quadro-wrapper">
          <h2 className="quadro-titulo">Produtos Mais Vendidos (Semana)</h2>
          {loading ? <div className="spinner"></div> : produtosVendidos.length > 0 ? (
            <ProdutosMaisVendidosSemana produtosVendidos={produtosVendidos} />
          ) : (
            <p className="sem-dados">Nenhum produto vendido nesta semana.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
