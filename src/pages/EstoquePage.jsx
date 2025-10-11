import { useEffect, useState } from 'react';
import { listaEstoque } from '../services/ApiEstoque/ApiEstoque';

export default function EstoquePage() {
  const [estoque, setEstoque] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [tipoVisao, setTipoVisao] = useState('atual');
  const [termoBusca, setTermoBusca] = useState('');

  const fetchEstoque = async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await listaEstoque({
        tipoVisao,
        termoBusca: termoBusca.trim() || undefined
      });
      setEstoque(data);
    } catch (err) {
      setErro('Erro ao carregar estoque.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstoque();
  }, [tipoVisao]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Estoque</h1>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={tipoVisao}
          onChange={(e) => setTipoVisao(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="atual">Atual</option>
          <option value="detalhada">Detalhada</option>
          <option value="fiscal">Fiscal</option>
          <option value="critico">Crítico</option>
          <option value="periodo">Período</option>
        </select>

        <input
          type="text"
          placeholder="Buscar produto..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />

        <button
          onClick={fetchEstoque}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Filtrar
        </button>
      </div>

      {/* Mensagens */}
      {loading && <p>Carregando estoque...</p>}
      {erro && <p className="text-red-500">{erro}</p>}
      {!loading && estoque.length === 0 && <p>Nenhum registro encontrado.</p>}

      {/* Tabela de estoque */}
      {estoque.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Produto</th>
                <th className="p-2 border">Código</th>
                <th className="p-2 border">Código de Barras</th>
                <th className="p-2 border">Estoque Atual</th>
                <th className="p-2 border">Estoque Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {estoque.map((item) => {
                const produto = item.produto || item; // suporte para service que retorna diretamente produtos ou movimentações
                return (
                  <tr key={produto.id}>
                    <td className="p-2 border">{produto.nome}</td>
                    <td className="p-2 border">{produto.codigo}</td>
                    <td className="p-2 border">{produto.codigo_barras}</td>
                    <td className="p-2 border">{produto.estoque_atual ?? '-'}</td>
                    <td className="p-2 border">{produto.estoque_minimo ?? '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
