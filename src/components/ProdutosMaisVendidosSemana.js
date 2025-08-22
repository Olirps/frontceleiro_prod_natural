import React, { useState } from "react";

const ProdutosMaisVendidosSemana = ({ produtosVendidos }) => {
  // Limita os produtos antes de qualquer hook
  const produtosLimitados = produtosVendidos.slice(0, 1000); // apenas para garantir

  // Accordion fechado por padrão
  const [abertos, setAbertos] = useState({}); // inicia vazio, depois definimos dinamicamente

  const toggleGrupo = (unidade) => {
    setAbertos((prev) => ({ ...prev, [unidade]: !prev[unidade] }));
  };

  if (produtosLimitados.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 text-lg">
        Nenhum Produto Vendido nesta semana.
      </div>
    );
  }

  // Agrupa por unidade de medida e limita 20 produtos por grupo
  const grupos = produtosLimitados.reduce((acc, produto) => {
    if (!acc[produto.uCom]) acc[produto.uCom] = [];
    if (acc[produto.uCom].length < 20) acc[produto.uCom].push(produto);
    return acc;
  }, {});

  return (
    <div className="p-4 space-y-4">
      {Object.keys(grupos).map((unidade) => {
        const produtos = grupos[unidade].sort(
          (a, b) => b.total_quantity - a.total_quantity
        );

        // Define aberto se ainda não tiver valor
        if (!(unidade in abertos)) abertos[unidade] = false;

        return (
          <div key={unidade} className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Cabeçalho clicável */}
            <div
              onClick={() => toggleGrupo(unidade)}
              className="flex justify-between items-center cursor-pointer px-4 py-3 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <h2 className="text-lg font-semibold text-gray-700">{unidade}</h2>
              <span className="text-gray-500">{abertos[unidade] ? "−" : "+"}</span>
            </div>

            {/* Tabela retrátil */}
            {abertos[unidade] && (
              <table className="w-full table-auto text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-gray-600">Produto</th>
                    <th className="px-4 py-2 text-gray-600">Qtd</th>
                    <th className="px-4 py-2 text-gray-600">Ranking</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((produto, index) => {
                    let badge;
                    if (index === 0) badge = "🥇";
                    else if (index === 1) badge = "🥈";
                    else if (index === 2) badge = "🥉";
                    else badge = "🔹";

                    return (
                      <tr
                        key={produto.id}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-1 text-sm">{produto.xProd}</td>
                        <td className="px-4 py-1 text-sm font-semibold">{produto.total_quantity}</td>
                        <td className="px-4 py-1 text-sm">{badge}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProdutosMaisVendidosSemana;
