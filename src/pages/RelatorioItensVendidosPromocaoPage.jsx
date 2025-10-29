import { useState } from 'react';
import Pagination from '../utils/Pagination';
import { getProdutosVendidosNaPromocao } from '../services/ApiPromocao/ApiPromocao';


export default function RelatorioItensVendidosPromocaoPage() {
  const [filtros, setFiltros] = useState({
    promocao_id: '',
    produto_id: '',
    data_de: '',
    data_ate: '',
    termo: '',
    sintetico: false,
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState([]);
  const [error, setError] = useState('');
  const [totalPaginas, setTotalPaginas] = useState(1);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFiltros(f => ({
      ...f,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const buscarItens = async (page = filtros.page, limit = filtros.limit) => {
    setLoading(true);
    setError('');
    try {
      const data = await getProdutosVendidosNaPromocao({ ...filtros, page, limit });
      setItens(data?.items || []);
      setTotalPaginas(data?.totalPages || 1);
    } catch (err) {
      setError('Erro ao buscar itens vendidos.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setFiltros(f => ({ ...f, page }));
    buscarItens(page, filtros.limit);
  };

  const handleRowsChange = (limit) => {
    setFiltros(f => ({ ...f, limit, page: 1 }));
    buscarItens(1, limit);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Relatório de Itens Vendidos na Promoção</h1>
      <div className="bg-white rounded shadow p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm">Promoção ID</label>
          <input name="promocao_id" value={filtros.promocao_id} onChange={handleChange} className="border p-2 rounded w-32" />
        </div>
        <div>
          <label className="block text-sm">Produto ID</label>
          <input name="produto_id" value={filtros.produto_id} onChange={handleChange} className="border p-2 rounded w-32" />
        </div>
        <div>
          <label className="block text-sm">Data De</label>
          <input type="date" name="data_de" value={filtros.data_de} onChange={handleChange} className="border p-2 rounded w-32" />
        </div>
        <div>
          <label className="block text-sm">Data Até</label>
          <input type="date" name="data_ate" value={filtros.data_ate} onChange={handleChange} className="border p-2 rounded w-32" />
        </div>
        <div>
          <label className="block text-sm">Termo</label>
          <input name="termo" value={filtros.termo} onChange={handleChange} className="border p-2 rounded w-32" />
        </div>
        <div>
          <label className="block text-sm">Sintético</label>
          <input type="checkbox" name="sintetico" checked={filtros.sintetico} onChange={handleChange} />
        </div>
        <button onClick={() => buscarItens()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Buscar</button>
      </div>
      {loading && <div className="mb-4">Carregando...</div>}
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <table className="w-full text-left border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Promoção</th>
            <th className="p-2 border">Produto</th>
            <th className="p-2 border">Quantidade</th>
            <th className="p-2 border">Valor Unitário</th>
            <th className="p-2 border">Valor Total</th>
            <th className="p-2 border">Data Venda</th>
          </tr>
        </thead>
        <tbody>
          {itens.length === 0 && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-400">Nenhum item encontrado</td>
            </tr>
          )}
          {itens.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="p-2 border">{item.promocao_nome || item.promocao_id}</td>
              <td className="p-2 border">{item.produto_nome || item.produto_id}</td>
              <td className="p-2 border">{item.quantidade}</td>
              <td className="p-2 border">R$ {item.valor_unitario?.toFixed(2)}</td>
              <td className="p-2 border">R$ {item.valor_total?.toFixed(2)}</td>
              <td className="p-2 border">{item.data_venda}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        currentPage={filtros.page}
        totalPages={totalPaginas}
        onPageChange={handlePageChange}
        onRowsChange={handleRowsChange}
        rowsPerPage={filtros.limit}
        rowsPerPageOptions={[10, 20, 50, 100]}
      />
    </div>
  );
}
