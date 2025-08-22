import React, { useState, useEffect } from "react";
import ContasPagarSemana from "../components/ContasPagarSemana";
import ProdutosMaisVendidosSemana from "../components/ProdutosMaisVendidosSemana";
import { getContaPagarSemana, getProdutosVendidosSemana } from "../services/api";

function Home() {
  const [contas, setContas] = useState([]);
  const [produtosVendidos, setProdutosVendidos] = useState([]);
  const [loadingContas, setLoadingContas] = useState(true);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [erroContas, setErroContas] = useState(null);
  const [erroProdutos, setErroProdutos] = useState(null);

  useEffect(() => {
    const fetchContasPagar = async () => {
      try {
        const response = await getContaPagarSemana();
        setContas(response.data);
      } catch (error) {
        setErroContas("Erro ao carregar contas a pagar");
      } finally {
        setLoadingContas(false);
      }
    };

    const fetchProdutosVendidos = async () => {
      try {
        const response = await getProdutosVendidosSemana();
        setProdutosVendidos(response.data);
      } catch (error) {
        setErroProdutos("Erro ao carregar produtos vendidos");
      } finally {
        setLoadingProdutos(false);
      }
    };

    fetchContasPagar();
    fetchProdutosVendidos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quadro Contas a Pagar */}
        <div className="bg-white shadow rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Contas a Pagar (Semana)
          </h2>

          {loadingContas ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : erroContas ? (
            <p className="text-red-500 text-sm">{erroContas}</p>
          ) : contas.length > 0 ? (
            <ContasPagarSemana contas={contas} />
          ) : (
            <p className="text-gray-500 text-sm">Nenhuma conta a pagar nesta semana.</p>
          )}
        </div>

        {/* Quadro Produtos Mais Vendidos */}
        <div className="bg-white shadow rounded-2xl p-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Produtos Mais Vendidos (Semana)
          </h2>

          {loadingProdutos ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : erroProdutos ? (
            <p className="text-red-500 text-sm">{erroProdutos}</p>
          ) : produtosVendidos.length > 0 ? (
            <ProdutosMaisVendidosSemana produtosVendidos={produtosVendidos} />
          ) : (
            <p className="text-gray-500 text-sm">Nenhum produto vendido nesta semana.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
