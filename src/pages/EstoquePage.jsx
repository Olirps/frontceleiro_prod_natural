import React, { useEffect, useState } from 'react';
import { listaEstoque } from '../services/ApiEstoque/ApiEstoque';
import {
  getProdutos
} from '../services/api';
import Pagination from '../utils/Pagination';
import Toast from '../components/Toast';
import { debounce } from 'lodash';


const EstoquePage = () => {
  const [estoque, setEstoque] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [tipoVisao, setTipoVisao] = useState('atual');
  const [termoBusca, setTermoBusca] = useState('');
  const [produtoBusca, setProdutoBusca] = useState('');
  const [produtosFiltrados, setProdutosFiltrados] = useState([]);
  const [produtoSelected, setProdutoSelected] = useState(false);
  const [produtoDescricao, setProdutoDescricao] = useState('');
  const [produtoID, setProdutoID] = useState('');




  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [linhasPorPagina, setLinhasPorPagina] = useState(50);
  const [totalPaginas, setTotalPaginas] = useState(1);


  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    if (!produtoSelected) buscarProdutos(produtoBusca);
    return () => buscarProdutos.cancel();
  }, [produtoBusca]);


  const buscarProdutos = debounce(async (termo) => {
    if (termo.length < 2) return setProdutosFiltrados([]);
    try {
      const res = await getProdutos({ nome: termo });
      setProdutosFiltrados(res.data || []);
      if (!res.data.length) {
        setToast({ message: 'Nenhum produto encontrado.', type: 'warning' });
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Erro ao buscar produtos.';
      setToast({ message: msg, type: 'error' });
    }
  }, 500);

  const fetchEstoque = async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await listaEstoque({
        tipoVisao,
        produtoID: produtoID || undefined,
        termoBusca: termoBusca.trim() || undefined,
        page: paginaAtual,
        limit: linhasPorPagina
      });

      // Ajuste para formato esperado (caso o backend envie data + total)
      setEstoque(data.dados || []);
      setTotalPaginas(data.totalPaginas || 1);
    } catch (err) {
      console.error(err);
      setErro('Erro ao carregar estoque.');
      setToast({ message: 'Erro ao carregar estoque.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstoque();
  }, [tipoVisao, paginaAtual, linhasPorPagina]);

  const handleChangeRowsPerPage = (newRowsPerPage) => {
    setLinhasPorPagina(newRowsPerPage);
    setPaginaAtual(1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Estoque</h1>

      {/* Toast */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: '' })}
        />
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={tipoVisao}
          onChange={(e) => {
            setTipoVisao(e.target.value);
            setPaginaAtual(1);
          }}
          className="border rounded px-3 py-2"
        >
          <option value="atual">Atual</option>
          <option value="detalhada">Detalhada</option>
          <option value="fiscal">Fiscal</option>
          <option value="fiscal_resumido">Fiscal Sintética</option>
        </select>

        <div>
          <label className="block text-sm font-medium">Produto</label>
          <input type="text" value={produtoBusca} onChange={e => setProdutoBusca(e.target.value)} placeholder="Descrição do produto"
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1" />
          {produtosFiltrados.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 max-h-48 overflow-y-auto shadow-lg mt-1 rounded">
              {produtosFiltrados.map(produto => (
                <li key={produto.id} onClick={() => {
                  setProdutoSelected(true);
                  setProdutoDescricao(produto.xProd);
                  setProdutoBusca(produto.xProd);
                  setTermoBusca(produto.xProd);
                  setProdutoID(produto.id);
                  setProdutosFiltrados([]);
                }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  {produto.xProd}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={() => {
            setPaginaAtual(1);
            fetchEstoque();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Filtrar
        </button>
      </div>

      {/* Mensagens */}
      {loading && <p>Carregando estoque...</p>}
      {erro && <p className="text-red-500">{erro}</p>}
      {!loading && estoque.length === 0 && <p>Nenhum registro encontrado.</p>}

      {/* Tabela */}
      {!loading && estoque.length > 0 && (
        <div className="overflow-x-auto shadow rounded mt-4">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              {tipoVisao === 'atual' && (
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Produto</th>
                  <th className="p-2 border">Código Interno</th>
                  <th className="p-2 border">Código de Barras</th>
                  <th className="p-2 border">Estoque Atual</th>
                  <th className="p-2 border">Estoque Mínimo</th>
                </tr>
              )}
              {tipoVisao === 'detalhada' && (
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Produto</th>
                  <th className="p-2 border">Venda</th>
                  <th className="p-2 border">Tipo Movimentação</th>
                  <th className="p-2 border">Quantidade</th>
                  <th className="p-2 border">Data Movimentação</th>
                </tr>
              )}
              {tipoVisao === 'fiscal' && (
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Produto</th>
                  <th className="p-2 border">Nota Fiscal (Saida)</th>
                  <th className="p-2 border">Qtd Venda</th>
                  <th className="p-2 border">Vlr Unitário</th>
                  <th className="p-2 border">Vlr Venda</th>
                  <th className="p-2 border">Qtd Movimentada</th>
                  <th className="p-2 border">Data Movimentacao</th>
                  <th className="p-2 border">Tipo Movimentacao</th>
                </tr>
              )}
              {tipoVisao === 'fiscal_resumido' && (
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Produto</th>
                  <th className="p-2 border">Qtd Entrada</th>
                  <th className="p-2 border">Qtd Saida</th>
                  <th className="p-2 border">Saldo Atual</th>
                </tr>
              )}
            </thead>
            <tbody>
              {estoque.map((item, index) => {
                const produto = tipoVisao === 'atual' ? item : item;
                if (tipoVisao === 'atual') {
                  return (
                    <tr key={`${produto.id}-${index}`} className="border-b hover:bg-gray-50">
                      <td className="p-2 border">{produto.id || '-'}</td>
                      <td className="p-2 border">{produto.xProd}</td>
                      <td className="p-2 border">{produto.cod_interno}</td>
                      <td className="p-2 border">{produto.cEAN || '-'}</td>
                      <td className="p-2 border text-right">{produto.estoque_atual ?? '-'}</td>
                      <td className="p-2 border text-right">{produto.qtdMinima ?? '-'}</td>
                    </tr>
                  );
                } else if (tipoVisao === 'detalhada') {
                  return (
                    <tr key={`${produto.id}-${index}`} className="border-b hover:bg-gray-50">
                      <td className="p-2 border">{produto.produto?.id || '-'}</td>
                      <td className="p-2 border">{produto.produto?.xProd || '-'}</td>
                      <td className="p-2 border">{produto.venda_id ?? '-'}</td>
                      <td className="p-2 border">{produto.tipo_movimentacao ?? '-'}</td>
                      <td className="p-2 border text-right">{produto.quantidade ?? '-'}</td>
                      <td className="p-2 border">
                        {new Date(produto.data_movimentacao).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  );
                } else if (tipoVisao === 'fiscal') {
                  return (
                    <tr key={`${produto.id}-${index}`} className="border-b hover:bg-gray-50">
                      <td className="p-2 border">{produto.produto_id || '-'}</td>
                      <td className="p-2 border">{produto.xProd || '-'}</td>
                      <td className="p-2 border">{produto.numero_nf ?? '-'}</td>
                      <td className="p-2 border">{produto.qtd_vendida ?? '-'}</td>
                      <td className="p-2 border text-right">{produto.valor_unitario ?? '0,00'}</td>
                      <td className="p-2 border text-right">{produto.valor_venda ?? '0,00'}</td>
                      <td className="p-2 border text-right">{produto.qtd_movimentada ?? '0'}</td>
                      <td className="p-2 border">
                        {new Date(produto.data_movimentacao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-2 border text-right">{produto.tipo_movimentacao ?? '-'}</td>

                    </tr>
                  );
                }
                else if (tipoVisao === 'fiscal_resumido') {
                  return (
                    <tr key={`${produto.id}-${index}`} className="border-b hover:bg-gray-50">
                      <td className="p-2 border">{produto.produto_id || '-'}</td>
                      <td className="p-2 border">{produto.xProd || '-'}</td>
                      <td className="p-2 border">{produto.qtd_entrada ?? '0'}</td>
                      <td className="p-2 border">{produto.qtd_saida ?? '-'}</td>
                      <td className="p-2 border text-right">{produto.saldo ?? '0'}</td>
                    </tr>
                  );
                }
                return null;
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      <Pagination
        currentPage={paginaAtual}
        totalPages={totalPaginas}
        onPageChange={setPaginaAtual}
        onRowsChange={handleChangeRowsPerPage}
        rowsPerPage={linhasPorPagina}
        rowsPerPageOptions={[50, 100, 200]}
      />
    </div>
  );
};

export default EstoquePage;
