import React, { useState, useEffect, useRef } from 'react';
import { getProdutos } from '../services/api';
import Toast from '../components/Toast';

const ModalPesquisaGN = ({ isOpen, onClose, onSelectProduto }) => {
  const [produtos, setProdutos] = useState([]);
  const [cEAN, setcEAN] = useState('');
  const [id, setId] = useState('');
  const [nome, setNome] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) handleClear();
  }, [isOpen]);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchProdutos = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await getProdutos({ cEAN, nome, id, page });
      const data = response.data || [];
      if (reset) {
        setProdutos(data);
      } else {
        setProdutos(prev => [...prev, ...data]);
      }
      setHasMore(data.length > 0); // Se não retornou nada, não há mais
      if (data.length === 0 && page === 1) {
        setToast({ message: 'Produto não localizado!', type: 'error' });
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setToast({ message: 'Erro ao buscar produtos.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduto = (produto) => {
    onSelectProduto(produto);
    onClose();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProdutos(true); // reset da lista
  };

  const handleClear = () => {
    setProdutos([]);
    setcEAN('');
    setNome('');
    setId('');
    setPage(1);
    setHasMore(true);
  };

  const handleScroll = () => {
    const container = listRef.current;
    if (!container || loading || !hasMore) return;
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 50) {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (page > 1) fetchProdutos();
  }, [page]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Pesquisar Produtos</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Filtros de pesquisa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="cEAN" className="block text-sm font-medium mb-1">Código de Barras</label>
            <input
              type="text"
              id="cEAN"
              value={cEAN}
              onChange={(e) => setcEAN(e.target.value)}
              placeholder="Digite o Código de Barras"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="nome" className="block text-sm font-medium mb-1">Nome do Produto</label>
            <input
              type="text"
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome do produto"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="id" className="block text-sm font-medium mb-1">Código Produto</label>
            <input
              type="text"
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Digite código do produto"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Botão de busca */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Buscar
          </button>
        </div>

        {/* Lista de resultados com scroll infinito */}
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="overflow-y-auto flex-1 space-y-2"
        >
          {produtos.length > 0 ? (
            produtos.map(produto => (
              <div
                key={produto.id}
                onClick={() => handleSelectProduto(produto)}
                className="p-3 bg-gray-50 rounded-lg shadow hover:bg-blue-50 cursor-pointer flex justify-between items-center"
              >
                <span className="text-sm text-gray-700">{produto.id} - {produto.cEAN} - {produto.xProd}</span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">{loading ? 'Carregando...' : 'Nenhum produto encontrado.'}</p>
          )}
          {loading && <p className="text-center text-gray-500">Carregando mais produtos...</p>}
        </div>

        {/* Toast */}
        {toast.message && <Toast type={toast.type} message={toast.message} />}
      </div>
    </div>
  );
};

export default ModalPesquisaGN;
