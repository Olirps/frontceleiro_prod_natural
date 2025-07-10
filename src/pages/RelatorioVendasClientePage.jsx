import { useState } from 'react';
import { getVendasPorClientePeriodo } from '../services/api'; // ajuste se o caminho for diferente
import Pagination from '../utils/Pagination';


const RelatorioVendasClientePage = () => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [vendas, setVendas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const limit = 10;

  const buscarRelatorio = async (page = 1) => {
    setLoading(true);
    try {
      const { data, pagination } = await getVendasPorClientePeriodo({
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        page,
        limit,
      });

      setVendas(data);
      setTotalPages(pagination.totalPages);
      setCurrentPage(pagination.currentPage);
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Relatório de Vendas por Período</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium">Data Início</label>
          <input
            type="date"
            className="w-full border rounded px-2 py-1"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Data Fim</label>
          <input
            type="date"
            className="w-full border rounded px-2 py-1"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => buscarRelatorio(1)}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
          >
            Buscar
          </button>
        </div>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-2 py-1 border">Data</th>
                  <th className="px-2 py-1 border">Cliente</th>
                  <th className="px-2 py-1 border">Produto</th>
                  <th className="px-2 py-1 border">Qtd</th>
                  <th className="px-2 py-1 border">V. Unit.</th>
                  <th className="px-2 py-1 border">V. Total</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((venda, index) => (
                  <tr key={index}>
                    <td className="px-2 py-1 border">{(new Date(venda.data_venda), 'dd/MM/yyyy')}</td>
                    <td className="px-2 py-1 border">{venda.cliente_nome}</td>
                    <td className="px-2 py-1 border">{venda.produto_descricao}</td>
                    <td className="px-2 py-1 border">{venda.quantidade}</td>
                    <td className="px-2 py-1 border">R$ {Number(venda.valor_unitario).toFixed(2)}</td>
                    <td className="px-2 py-1 border">R$ {Number(venda.valor_total_item).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => buscarRelatorio(page)}
              rowsPerPage={limit}
              onRowsChange={() => {}}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default RelatorioVendasClientePage;
