import React, { useState, useEffect } from 'react';
import '../styles/ModalProdutosNF.css';
import ModalTratarProdutosNF from '../components/ModalTratarProdutosNF';
import ModalDetalhesProdutosNF from '../components/ModalDetalhesProdutosNF';
import Toast from '../components/Toast';
import { getNFeById, getProdutoNFById, getQuantidadeRestanteProdutoNF, updateNFe, vinculaProdutoNF, desvinculaProdutoNF, obterVinculoPorProdutoId, produtosSimilares, efetivarProduto } from '../services/api';
import ModalCadastraProduto from '../components/ModalCadastraProduto';
import { formatarMoedaBRL, converterMoedaParaNumero } from '../utils/functions';
import lixeiraIcon from '../img/lixeira.png';
import ConfirmDialog from '../components/ConfirmDialog'; // Importe o ConfirmDialog
import ModalPesquisaGN from '../components/ModalPesquisaGN';
import ModalVinculaProdVeiculo from '../components/ModalVinculaProdVeiculo'; // Importe o modal de vinculação de veículos



const ModalProdutosNF = ({ isOpen, onClose, prod, onNFOpen, onVinculoSuccess }) => {
  const [produtos, setProdutos] = useState([]);
  const [quantidade, setQuantidade] = useState('');
  const [quantidadeVinculada, setQuantidadeVinculada] = useState('');
  const [valor_unit, setValorUnitario] = useState('');
  const [formError, setFormError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isTratarModalOpen, setIsTratarModalOpen] = useState(false);
  const [isDetalhesModalOpen, setIsDetalhesModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [vinculoSuccess, setVinculoSuccess] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [isCadastraProdutoModalOpen, setIsCadastraProdutoModalOpen] = useState(false);
  const [selectedNFe, setSelectedNFe] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false); // Estado para a modal de confirmação
  const [confirmAction, setConfirmAction] = useState(null); // 'delete' | 'efetivar'
  const [produtoToDelete, setProdutoToDelete] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [produto, setProduto] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const [isPesquisaGNModalOpen, setIsPesquisaGNModalOpen] = useState(false);

  const [isNFClosed, setIsNFClosed] = useState(false);

  const [isVinculaVeiculoModalOpen, setIsVinculaVeiculoModalOpen] = useState(false);
  const [produtoParaVincular, setProdutoParaVincular] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const [produtosSimilaresFound, setProdutosSimilaresFound] = useState(null);
  const [sugestaoValorVenda, setSugestaoValorVenda] = useState({});





  const handleQuantidadeChange = (e) => {
    //setQuantidade(e.target.value); // Atualiza o estado do nome
    const value = e.target.value;
    setQuantidade(value);
    if (!value || value <= 0) {
      setFormError(true);
    } else {
      setFormError(false);
    }
  };

  const handleSugestaoValorChange = (produtoId, index, valor) => {
    const key = `${produtoId}-${index}`;

    // Atualiza sugestão de valor (controle de inputs)
    setSugestaoValorVenda(prev => ({
      ...prev,
      [key]: valor
    }));

    // Atualiza também no array de produtos (valor real)
    setProdutos(prevProdutos => {
      const novos = [...prevProdutos];
      novos[index] = {
        ...novos[index],
        sugestao_valor_venda: valor // ou outro campo que você estiver usando
      };
      return novos;
    });
  };



  // Função para buscar produtos da nota fiscal
  const handleValorUnitChange = (e) => {
    //setQuantidade(e.target.value); // Atualiza o estado do nome
    const value = formatarMoedaBRL(e.target.value);
    setValorUnitario(value);
    if (!converterMoedaParaNumero(value) || isNaN(converterMoedaParaNumero(value)) || converterMoedaParaNumero(value) <= 0) {
      setFormError(true);
    } else {
      setFormError(false);
    }
  };
  // Função para buscar produtos da nota fiscal
  const fetchProdutosNF = async (notaId) => {
    try {
      onNFOpen = true;
      const response = await getProdutoNFById(notaId);
      setProdutos(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar produtos da nota fiscal', err);
      setToast({ message: "Erro ao buscar produtos da nota fiscal.", type: "error" });
      setProdutos([]);
      setLoading(false);
    }
  };
  const fetchQuantidadeRestanteProdutoNF = async (produtoId) => {
    try {
      const response = await getQuantidadeRestanteProdutoNF(produtoId);
      setQuantidadeVinculada(response.data.quantidadeVinculada);
      return response.data.quantidadeRestante;
    } catch (err) {
      console.error('Erro ao buscar quantidade restante do produto na nota fiscal', err);
      setToast({ message: "Erro ao buscar quantidade restante do produto na nota fiscal.", type: "error" });
      return null;
    }
  };
  const fetchNFeStatus = async (notaId) => {
    try {
      const response = await getNFeById(notaId); // Supondo que essa função retorne os detalhes atualizados da NF
      setIsNFClosed(response.data.status === 'fechada'); // Atualiza o estado com o status atualizado
    } catch (err) {
      console.error('Erro ao buscar status da NF', err);
      setToast({ message: "Erro ao buscar status da nota fiscal.", type: "error" });
    }
  };


  useEffect(() => {
    if (isOpen && prod) {
      setLoading(true);
      fetchProdutosNF(prod.id);
      fetchNFeStatus(prod.id); // Busca o status atualizado da NF sempre que o modal abrir
    }
  }, [isOpen, prod, vinculoSuccess]);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleVinculoSuccess = (e) => {

    const newProduto = {
      xProd: e.xProd,
      cEAN: e.cEAN,
      qtdMinima: e.qtdMinima,
      qCom: e.qCom,
      valor_unit: converterMoedaParaNumero(e.valor_unit),
      tipoProduto: e.tipo
    };

    //setToast({ message, type: "success" });
    setToast({ message: 'Produto Adicionada na Nota Fiscal', type: "success" });

    setVinculoSuccess(prev => !prev);
    setModalKey(prev => prev + 1);
    setProduto('');
    setQuantidade('');
    setValorUnitario('');
  };

  const handleFechadoSuccess = (message) => {
    //setToast({ message, type: "success" });
    setToast({ message: `Nota Fiscal ${message.nNF} foi fechada com sucesso!`, type: 'success' });
    setVinculoSuccess(prev => !prev);
    setModalKey(prev => prev + 1);
  };

  if (!isOpen) return null;

  const indexOfLastProduct = currentPage * itemsPerPage;
  const currentProducts = produtos.slice(indexOfLastProduct - itemsPerPage, indexOfLastProduct);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handleActionClick = async (produto) => {
    setLoading(true);
    setSelectedProduct(produto);

    try {
      if (produto.identificador == 1) {
        setConfirmAction('efetivar');
        setIsConfirmDialogOpen(true);
        setMensagem("Deseja efetivar o produto?");
      } else {
        const produtosSimilaresRetorno = await produtosSimilares(produto.id);
        setProdutosSimilaresFound(produtosSimilaresRetorno);
        console.log('produtosSimilaresRetorno', produtosSimilaresRetorno);
        setIsTratarModalOpen(true);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos similares:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCadastraProdClick = async (nfe) => {
    try {
      if (nfe.lancto === 'manual' || nfe.lancto === 'andamento') {
        setSelectedNFe(nfe);
        setIsCadastraProdutoModalOpen(true);
      } else if (nfe.lancto === 'automatico') {
        setSelectedNFe(nfe);
      }
    } catch (err) {
      console.error('Erro ao abrir modal de produto', err);
      setToast({ message: "Erro ao abrir modal de produto.", type: "error" });
    }
  };

  const totalPages = Math.ceil(produtos.length / itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const additionalFields = [
    { name: 'qCom', type: 'text', placeholder: 'Quantidade' },
    { name: 'valor_unit', type: 'text', placeholder: 'Valor do Unitário' },
  ];

  const handleFecharNF = async (nfe) => {
    try {
      const status = { status: 'fechada' }
      if (window.confirm('Deseja realmente fechar a nota fiscal?')) {
        await updateNFe(nfe.id, status);
        handleFechadoSuccess(nfe);
        await fetchNFeStatus(nfe.id); // Atualiza o status da NF no estado local
      } else {
        setToast({ message: "Nota Fiscal não foi fechada", type: "error" });
      }
    } catch (err) {
      console.error('Erro ao fechar a nota fiscal', err);
      setToast({ message: "Erro ao fechar a nota fiscal.", type: "error" });
    }
  };

  const handleExcluirProdNf = (produto) => {
    setProdutoToDelete(produto);
    setConfirmAction('delete');
    setMensagem("Deseja excluir o Produto da Nota Fiscal?");
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDialog = async () => {
    if (confirmAction === 'delete') {
      // lógica de exclusão
      await handleDeleteProduto();
    } else if (confirmAction === 'efetivar') {
      // lógica de efetivação
      await handleEfetivarProduto();
    }

    setIsConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  const handleDeleteProduto = async () => {
    try {
      if (produtoToDelete) {
        const vinculo = await obterVinculoPorProdutoId(produtoToDelete.id, produtoToDelete.nota_id);
        if (vinculo.data.length > 0) {
          setToast({ message: 'Não é possível excluir o produto pois ele possui vínculos.', type: 'error' });
          return;
        }
        const updateData = { nota_id: prod.id, status: 1, id: produtoToDelete.idx };
        await desvinculaProdutoNF(produtoToDelete.id, updateData);

        setToast({ message: 'Produto desabilitado com sucesso!', type: 'success' });
        fetchProdutosNF(produtoToDelete.nota_id);
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      setToast({ message: "Erro ao desabilitar o produto.", type: "error" });
    }
  };


  const handleEfetivarProduto = async () => {
    setLoading(true);
    try {
      const usuario = localStorage.getItem('username');
      selectedProduct.usuario = usuario;
      await efetivarProduto(selectedProduct);
      setToast({ message: 'Produto efetivado com sucesso!', type: 'success' });
      fetchProdutosNF(selectedProduct.nota_id)
    } catch (error) {
      console.error('Erro ao efetivar produto:', error);
      setToast({ message: "Erro ao efetivar o produto.", type: "error" });
    } finally {
      setLoading(false);
    }
  };


  const cancelDelete = () => {
    setIsConfirmDialogOpen(false);
    setProdutoToDelete(null);
  };

  // Atualiza o produto selecionado
  const handleSelectProduto = (selectedProduto) => {
    setProduto(selectedProduto.xProd);
    setProdutoId(selectedProduto.id);
  };
  const handleVincularVeiculo = (produto) => {
    fetchQuantidadeRestanteProdutoNF(produto.id);
    setProdutoParaVincular(produto); // Define o produto selecionado
    setIsVinculaVeiculoModalOpen(true); // Abre o modal
  };

  const closeVinculaVeiculoModal = () => {
    setIsVinculaVeiculoModalOpen(false);
    setProdutoParaVincular(null);
  };
  // Função para abrir o modal de pesquisa
  const openPesquisaGNModal = () => setIsPesquisaGNModalOpen(true);
  const closePesquisaGNModal = () => setIsPesquisaGNModalOpen(false);

  // Função para vincular produto
  const handleVincular = async () => {
    if (!produtoId) {
      setToast({ message: "Selecione um produto antes de vincular.", type: "error" });
      return;
    }

    const produto_ori_id = produto.id;
    const tipo_movimentacao = "entrada";
    const produtoVinculado = {
      produto_ori_id,
      nota_id: prod.id,
      produto,
      produto_id: produtoId,
      tipo_movimentacao,
      quantidade: quantidade,
      valor_unit: converterMoedaParaNumero(valor_unit)
    };
    try {
      const vinculado = await vinculaProdutoNF(produtoId, produtoVinculado);
      handleVinculoSuccess('Produto Adicionado na Nota Fiscal');
      await updateNFe(prod.id, { status: 'andamento' });

    } catch (err) {
      console.error('Erro ao vincular produto à nota fiscal', err.response.data.error);
      setToast({ message: `Error: ${err.response.data.error}`, type: "error" });
    }
  };

  const handleProdutoVinculado = (produtoVinculado) => {
    console.log('Produto vinculado retornado:', produtoVinculado);


    setProdutos((prevProdutos) =>
      prevProdutos.map((produto) =>
        produto.id === produtoVinculado.id
          ? { ...produto, sugestao_valor_venda: produtoVinculado.valor_venda || produtoVinculado.vlrVenda }
          : produto
      )
    );
  };


  const canDisplayTable = prod?.status === 'andamento';
  const canCadastrarProdutos = prod?.status === 'aberta' || prod?.status === 'andamento';
  const canFecharNF = prod?.status === 'andamento';
  const hasProdutos = produtos.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh]">

        {/* Cabeçalho */}
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h2 className="text-lg md:text-xl font-semibold">
            Produtos da Nota Fiscal {prod?.nNF ? `- Nº ${prod.nNF}` : ''}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl font-bold">×</button>
        </div>

        {/* Conteúdo do modal */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

          {/* Spinner */}
          {loading && (
            <div className="flex justify-center items-center py-10">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {!loading && (
            <>
              {/* Ações iniciais */}
              {canCadastrarProdutos && !isNFClosed && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex flex-col md:flex-row items-center gap-2">
                    <label className="text-sm font-medium">Não achou o produto?</label>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      onClick={() => handleCadastraProdClick(prod)}>
                      Cadastrar Produtos
                    </button>
                  </div>
                  {hasProdutos && !isNFClosed && (
                    <button
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      onClick={() => handleFecharNF(prod)}
                      disabled={isNFClosed}>
                      Fechar NF
                    </button>
                  )}
                </div>
              )}

              {/* Formulário de inclusão */}
              {canCadastrarProdutos && !isNFClosed && (
                <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Produto</label>
                      <input type="text"
                        value={produto || 'Produto a Ser Adicionado'}
                        disabled
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Quantidade</label>
                      <input type="text"
                        value={quantidade.replace(',', '.')}
                        onChange={handleQuantidadeChange}
                        placeholder="Quantidade"
                        required
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Valor Unitário</label>
                      <input type="text"
                        value={valor_unit}
                        onChange={handleValorUnitChange}
                        placeholder="Valor Unitário"
                        required
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>

                  {formError && <div className="text-red-500 text-sm">O campo quantidade é obrigatório.</div>}

                  <div className="flex gap-2 mt-2">
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      onClick={openPesquisaGNModal}>
                      Pesquisar Produto
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      onClick={handleVincular}>
                      Inserir
                    </button>
                  </div>
                </div>
              )}

              {/* Tabela de produtos */}
              {hasProdutos && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                        <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Descrição</th>
                        <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">Qtd</th>
                        <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">Valor Unit.</th>
                        <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">Sugestão Valor</th>
                        <th className="px-3 py-2 text-center text-sm font-medium text-gray-700">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {produtos
                        .slice(indexOfLastProduct - itemsPerPage, indexOfLastProduct)
                        .map((produto, index) => (
                          <tr key={`${produto.id}-${index}`}
                            className={`${produto.efetivado ? 'bg-green-50' : produto.identificador == 0 ? 'bg-red-50' : ''}`}>
                            <td className="px-3 py-2 text-sm">{produto.id}</td>
                            <td className="px-3 py-2 text-sm">{produto.descricao}</td>
                            <td className="px-3 py-2 text-sm text-right">{parseFloat(produto.quantidade).toFixed(3)}</td>
                            <td className="px-3 py-2 text-sm text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.valor_unit)}</td>
                            <td className="px-3 py-2 text-sm text-right">
                              <input type="text"
                                value={
                                  sugestaoValorVenda[`${produto.id}-${index}`] ||
                                  (produto.efetivado ?
                                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.vlrVenda) :
                                    produto.vlrVenda ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.vlrVenda) : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.sugestao_valor_venda))
                                } onChange={(e) => handleSugestaoValorChange(produto.id, index, e.target.value)}
                                className="w-full border rounded-lg px-2 py-1 text-sm"
                                disabled={produto.efetivado} />
                            </td>
                            <td className="px-3 py-2 flex justify-center gap-2">
                              {!produto.efetivado && (<button
                                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                onClick={() => handleActionClick(produto)}
                                disabled={produto.status == 1}>
                                {(produto.identificador == 0 ? 'Tratar' : 'Efetivar')}
                              </button>)}
                              {produto.identificador == 1 && !isNFClosed && (
                                <img src={lixeiraIcon} alt="Excluir" className="w-5 h-5 cursor-pointer" onClick={() => handleExcluirProdNf(produto)} />
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paginação */}
              {hasProdutos && (
                <div className="flex justify-center mt-4 gap-2">
                  {pageNumbers.map(number => (
                    <button key={number}
                      onClick={() => handlePageChange(number)}
                      className={`px-3 py-1 rounded ${number === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                      {number}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Toasts e outros modais continuam normalmente */}
        {toast.message && <Toast type={toast.type} message={toast.message} />}

        {
          isTratarModalOpen && (
            <ModalTratarProdutosNF
              key={modalKey}
              isOpen={isTratarModalOpen}
              onClose={() => setIsTratarModalOpen(false)}
              product={selectedProduct}
              similares={produtosSimilaresFound}
              onVinculoSuccess={handleVinculoSuccess}
              onProdutoVinculado={handleProdutoVinculado}
            />
          )
        }

        {
          isDetalhesModalOpen && (
            <ModalDetalhesProdutosNF
              isOpen={isDetalhesModalOpen}
              onClose={() => setIsDetalhesModalOpen(false)}
              product={selectedProduct}
            />
          )
        }

        {
          isCadastraProdutoModalOpen && (
            <ModalCadastraProduto
              isOpen={isCadastraProdutoModalOpen}
              onClose={() => setIsCadastraProdutoModalOpen(false)}
              onSubmit={() => handleVinculoSuccess('Produto cadastrado com sucesso!')}
              prod={selectedNFe}
              additionalFields={additionalFields}
            />
          )
        }
        {/* Modal de confirmação */}
        {
          isConfirmDialogOpen && (
            <ConfirmDialog
              isOpen={isConfirmDialogOpen}
              message={mensagem}
              onConfirm={handleConfirmDialog}
              onCancel={cancelDelete}
            />
          )
        }
        {/* Modal de pesquisa de produtos */}
        <ModalPesquisaGN
          isOpen={isPesquisaGNModalOpen}
          onClose={closePesquisaGNModal}
          onSelectProduto={handleSelectProduto}
        />
        {/* Modal de Vinculação de Veículos */}
        {
          isVinculaVeiculoModalOpen && (
            <ModalVinculaProdVeiculo
              isOpen={isVinculaVeiculoModalOpen}
              onClose={closeVinculaVeiculoModal}
              onNFOpen={true}
              produto={produtoParaVincular}
              quantidadeRestante={quantidadeVinculada}
              onVinculoSuccess={handleVinculoSuccess} // Atualiza lista de produtos ao sucesso
            />
          )
        }
      </div>
    </div>

  );

};

export default ModalProdutosNF;
