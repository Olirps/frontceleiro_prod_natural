import React, { useState, useEffect } from 'react';
import { getProdutos as getProdutosVenda, getEmpresaById } from '../services/api';
import { addPromocao, updatePromocao } from '../services/ApiPromocao/ApiPromocao';
import {
  getGrupoProdutos,
  getSubGrupoProdutos,
  getGrupoProdutoById,
  getSubGrupoProdutoById
} from '../services/GrupoSubGrupoProdutos';

import { formatarMoedaBRL, converterDataISO } from '../utils/functions';
import Toast from './Toast';

const ModalCadastroPromocao = ({ isOpen, onClose, edit, promocao, onPromocaoSuccess }) => {
  const [buscaProduto, setBuscaProduto] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [nomePromocao, setNomePromocao] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [dataInicio, setDataInicio] = useState('');
  const [status, setStatus] = useState(false);
  const [dataFim, setDataFim] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);


  useEffect(() => {
    if (edit && promocao) {
      setNomePromocao(promocao.descricao || '');
      setDesconto(promocao.desconto_percentual || 0);
      setDataInicio(converterDataISO(promocao.data_inicio) || '');
      setDataFim(converterDataISO(promocao.data_final) || '');
      setProdutosSelecionados(promocao.produtos || []);
      setStatus(promocao.ativo || false);
    }
  }, [edit, promocao]);

  const buscarProdutos = async (termo) => {
    if (termo.length < 3) return;
    try {
      const res = await getProdutosVenda({ termo });
      setSugestoes(res.data);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setToast({ message: 'Erro ao buscar produtos', type: 'error' });
    }
  };

  const adicionarProduto = (produto) => {
    // Evitar duplicados
    if (produtosSelecionados.some(p => p.id === produto.id)) return;

    setProdutosSelecionados(prev => [
      ...prev,
      {
        ...produto,
        valor_unitario: Number(produto.vlrVenda), // força número
      }
    ]);
    setProdutoSelecionado(null);
    setBuscaProduto('');
    setSugestoes([]);
  };

  const removerProduto = (index) => {
    const novaLista = [...produtosSelecionados];
    novaLista.splice(index, 1);
    setProdutosSelecionados(novaLista);
  };

  const calcularValorComDesconto = (valor) => {
    const resultado = Number(valor) * (1 - desconto / 100);
    return Number(resultado.toFixed(2));
  };

  const calcularDiferenca = (valor) => {
    const resultado = Number(valor) - calcularValorComDesconto(valor);
    return Number(resultado.toFixed(2));
  }
  const totalDesconto = produtosSelecionados
    .reduce((acc, p) => acc + calcularDiferenca(p.precoBase ? p.precoBase : p.vlrVenda), 0)
    .toFixed(2);

  const handleAddPromocao = async () => {
    if (!nomePromocao || produtosSelecionados.length === 0) {
      setToast({ message: 'Informe nome da promoção e pelo menos um produto', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const username = localStorage.getItem('username');
      if (!username) throw new Error('Usuário não autenticado');

      const empresaResponse = await getEmpresaById(1);
      if (!empresaResponse?.data) throw new Error('Dados da empresa não encontrados');

      const promocaoData = {
        descricao: nomePromocao,
        desconto_percentual: desconto,
        data_inicio: dataInicio,
        data_final: dataFim,
        ativo: status,
        produtos: produtosSelecionados.map(p => ({
          ...p,
          valor_promocao: calcularValorComDesconto(p.precoBase ? p.precoBase : p.vlrVenda),
        })),
        usuario: username,
        empresa: empresaResponse.data
      };

      if (edit) {
        await updatePromocao(promocao.id, promocaoData);
      } else {
        await addPromocao(promocaoData);
      }

      setToast({ message: "Promoção cadastrada com sucesso!", type: "success" });
      onClose();
      if (typeof onPromocaoSuccess === 'function') onPromocaoSuccess();

    } catch (err) {
      console.error('Erro ao cadastrar promoção:', err);
      const msg = err.response?.data?.erro || err.message || "Erro ao cadastrar promoção.";
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-red-600 font-bold text-lg">×</button>
        <h2 className="text-2xl font-semibold mb-4">{edit ? 'Editar Promoção' : 'Nova Promoção'}</h2>

        {/* Nome da promoção */}
        <div className="mb-4">
          <label className="block text-sm font-medium">Nome da Promoção</label>
          <input
            type="text"
            value={nomePromocao}
            onChange={e => setNomePromocao(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
          />
        </div>

        {/* Desconto */}
        <div className="mb-4">
          <label className="block text-sm font-medium">Desconto (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={desconto}
            onChange={e => setDesconto(Number(e.target.value))}
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
          />
        </div>

        {/* Período */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={e => setDataInicio(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={e => setDataFim(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
            />
          </div>
        </div>
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Status:</label>
          <button
            type="button"
            onClick={() => setStatus(!status)} // alterna true/false
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${status ? "bg-blue-500" : "bg-gray-300"
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${status ? "translate-x-6" : "translate-x-1"
                }`}
            />
          </button>
          <span className="text-sm text-gray-700">{status ? "Ativo" : "Inativo"}</span>
        </div>


        {/* Produtos */}
        <div className="mb-4">
          <label className="block text-sm font-medium">Produtos</label>
          <input
            type="text"
            value={buscaProduto}
            onChange={e => {
              setBuscaProduto(e.target.value);
              buscarProdutos(e.target.value);
            }}
            className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
            placeholder="Buscar produto"
          />
          {sugestoes.length > 0 && (
            <ul className="border border-gray-200 rounded max-h-40 overflow-y-auto mt-1">
              {sugestoes.map(prod => (
                <li
                  key={prod.id}
                  onClick={() => adicionarProduto(prod)}
                  className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                >
                  <span>{prod.xProd}</span>
                  <span className="font-medium">{prod.Precos.length > 0 ? formatarMoedaBRL(prod.Precos[0].preco_venda) : formatarMoedaBRL(prod.vlrVenda)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tabela de produtos selecionados */}
        <div className="overflow-x-auto mb-4">
          <div className="max-h-64 overflow-y-auto border rounded">
            <table className="w-full table-auto text-sm">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Produto</th>
                  <th className="p-2">Unitário</th>
                  <th className="p-2">Valor com Desconto</th>
                  <th className="p-2">Diferença</th>
                  <th className="p-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {produtosSelecionados.map((p, i) => {
                  const valorComDesconto = calcularValorComDesconto(p.Precos.length > 0 ? (p.Precos[0].preco_venda) : (p.vlrVenda));
                  const diferenca = calcularDiferenca(p.Precos.length > 0 ? (p.Precos[0].preco_venda) : (p.vlrVenda));
                  return (
                    <tr key={i}>
                      <td className="p-2">{p.id}</td>
                      <td className="p-2">{p.xProd}</td>
                      <td className="p-2 text-center">{formatarMoedaBRL(p.Precos.length > 0 ? formatarMoedaBRL(p.Precos[0].preco_venda) : formatarMoedaBRL(p.vlrVenda))}</td>
                      <td className="p-2 text-center">{formatarMoedaBRL(valorComDesconto)}</td>
                      <td className="p-2 text-center">{formatarMoedaBRL(diferenca)}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => removerProduto(i)}
                          className="text-red-600 hover:underline"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-gray-50">
                  <td colSpan="3" className="text-right p-2">Total Desconto:</td>
                  <td className="p-2">{formatarMoedaBRL(totalDesconto)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={handleAddPromocao}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={loading || produtosSelecionados.length === 0}
          >
            {loading ? 'Salvando...' : 'Salvar Promoção'}
          </button>
        </div>
      </div>

      {toast.message && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

export default ModalCadastroPromocao;
