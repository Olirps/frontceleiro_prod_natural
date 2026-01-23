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
  const [highlightedIndex, setHighlightedIndex] = useState(-1);




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
      setHighlightedIndex(-1);
      if (!res.data.length) {
        setToast({ message: 'Nenhum produto encontrado.', type: 'warning' });
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Erro ao buscar produtos.';
      setToast({ message: msg, type: 'error' });
    }
  }, 500);

  const selecionarProduto = (produto) => {
    setProdutoSelected(true);
    setProdutoDescricao(produto.xProd);
    setProdutoBusca(produto.xProd);
    setTermoBusca(produto.xProd);
    setProdutoID(produto.id);
    setProdutosFiltrados([]);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (produtosFiltrados.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < produtosFiltrados.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < produtosFiltrados.length) {
          selecionarProduto(produtosFiltrados[highlightedIndex]);
        }
        break;
      case 'Escape':
        setProdutosFiltrados([]);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <header className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">Estoque</h1>
      </header>

      {/* TOAST */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "" })}
        />
      )}

      {/* FILTROS */}
      <section className="bg-white rounded-xl border p-4 space-y-4">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* TIPO VISÃO */}
          <div>
            <label className="block text-sm font-medium mb-1">Visão</label>
            <select
              value={tipoVisao}
              onChange={(e) => {
                setTipoVisao(e.target.value);
                setPaginaAtual(1);
              }}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="atual">Atual</option>
              <option value="detalhada">Detalhada</option>
              <option value="fiscal">Fiscal</option>
              <option value="fiscal_resumido">Fiscal Sintética</option>
            </select>
          </div>

          {/* AUTOCOMPLETE PRODUTO */}
          <div className="relative md:col-span-2">
            <label className="block text-sm font-medium mb-1">Produto</label>

            <input
              type="text"
              value={produtoBusca}
              onChange={(e) => {
                const valor = e.target.value;
                setProdutoBusca(valor);
                // Se limpar o campo, resetar seleção para permitir nova busca
                if (valor.trim() === '') {
                  setProdutoSelected(false);
                  setProdutoID('');
                  setTermoBusca('');
                  setProdutoDescricao('');
                  setProdutosFiltrados([]);
                  setHighlightedIndex(-1);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Digite o nome do produto"
              className="w-full border rounded-lg px-3 py-2"
            />

            {produtosFiltrados.length > 0 && (
              <ul className="absolute z-20 w-full bg-white border rounded-lg shadow-md max-h-56 overflow-auto mt-1">
                {produtosFiltrados.map((produto, index) => (
                  <li
                    key={produto.id}
                    onClick={() => selecionarProduto(produto)}
                    className={`px-4 py-2 cursor-pointer ${
                      index === highlightedIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    {produto.xProd}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* BOTÃO FILTRAR */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setPaginaAtual(1);
                fetchEstoque();
              }}
              className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700"
            >
              Filtrar
            </button>
          </div>

        </div>
      </section>

      {/* ESTADOS */}
      {loading && <p className="text-center">Carregando estoque...</p>}
      {erro && <p className="text-center text-red-500">{erro}</p>}
      {!loading && estoque.length === 0 && (
        <p className="text-center text-gray-500">Nenhum registro encontrado.</p>
      )}

      {/* TABELA */}
      {!loading && estoque.length > 0 && (
        <div className="overflow-x-auto bg-white border rounded-xl shadow">

          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                {tipoVisao === "atual" && (
                  <>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Produto</th>
                    <th className="p-3 text-left">Cód. Interno</th>
                    <th className="p-3 text-left">EAN</th>
                    <th className="p-3 text-right">Estoque</th>
                    <th className="p-3 text-right">Mínimo</th>
                  </>
                )}

                {tipoVisao === "detalhada" && (
                  <>
                    <th className="p-3">ID</th>
                    <th className="p-3">Produto</th>
                    <th className="p-3">Venda</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3 text-right">Qtd</th>
                    <th className="p-3">Data</th>
                  </>
                )}

                {tipoVisao === "fiscal" && (
                  <>
                    <th className="p-3">ID</th>
                    <th className="p-3">Produto</th>
                    <th className="p-3">NF</th>
                    <th className="p-3 text-right">Qtd</th>
                    <th className="p-3 text-right">Vlr Unit</th>
                    <th className="p-3 text-right">Vlr Venda</th>
                    <th className="p-3 text-right">Mov.</th>
                    <th className="p-3">Data</th>
                    <th className="p-3">Tipo</th>
                  </>
                )}

                {tipoVisao === "fiscal_resumido" && (
                  <>
                    <th className="p-3">ID</th>
                    <th className="p-3">Produto</th>
                    <th className="p-3 text-right">Entrada</th>
                    <th className="p-3 text-right">Saída</th>
                    <th className="p-3 text-right">Saldo</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {estoque.map((item, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">

                  {tipoVisao === "atual" && (
                    <>
                      <td className="p-3">{item.id}</td>
                      <td className="p-3">{item.xProd}</td>
                      <td className="p-3">{item.cod_interno ?? "-"}</td>
                      <td className="p-3">{item.cEAN || "-"}</td>
                      <td className="p-3 text-right">{item.estoque_atual ?? "-"}</td>
                      <td className="p-3 text-right">{item.qtdMinima ?? "-"}</td>
                    </>
                  )}

                  {tipoVisao === "detalhada" && (
                    <>
                      <td className="p-3">{item.produto?.id ?? "-"}</td>
                      <td className="p-3">{item.produto?.xProd ?? "-"}</td>
                      <td className="p-3">{item.venda_id ?? "-"}</td>
                      <td className="p-3">{item.tipo_movimentacao}</td>
                      <td className="p-3 text-right">{item.quantidade}</td>
                      <td className="p-3">
                        {new Date(item.data_movimentacao).toLocaleDateString("pt-BR")}
                      </td>
                    </>
                  )}

                  {tipoVisao === "fiscal" && (
                    <>
                      <td className="p-3">{item.produto_id}</td>
                      <td className="p-3">{item.xProd}</td>
                      <td className="p-3">{item.numero_nf}</td>
                      <td className="p-3 text-right">{item.qtd_vendida}</td>
                      <td className="p-3 text-right">{item.valor_unitario}</td>
                      <td className="p-3 text-right">{item.valor_venda}</td>
                      <td className="p-3 text-right">{item.qtd_movimentada}</td>
                      <td className="p-3">
                        {new Date(item.data_movimentacao).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3">{item.tipo_movimentacao}</td>
                    </>
                  )}

                  {tipoVisao === "fiscal_resumido" && (
                    <>
                      <td className="p-3">{item.produto_id}</td>
                      <td className="p-3">{item.xProd}</td>
                      <td className="p-3 text-right">{item.qtd_entrada}</td>
                      <td className="p-3 text-right">{item.qtd_saida}</td>
                      <td className="p-3 text-right">{item.saldo}</td>
                    </>
                  )}

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINAÇÃO */}
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
