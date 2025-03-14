import React, { useState, useEffect } from 'react';
import '../styles/ModalProdutosNF.css';
import ModalTratarProdutosNF from '../components/ModalTratarProdutosNF';
import ModalDetalhesProdutosNF from '../components/ModalDetalhesProdutosNF';
import Toast from '../components/Toast';
import { getNFeById, getProdutoNFById, getQuantidadeRestanteProdutoNF, updateNFe, vinculaProdutoNF, desvinculaProdutoNF, obterVinculoPorProdutoId } from '../services/api';
import ModalCadastraProduto from '../components/ModalCadastraProduto';
import {formatarMoedaBRL,converterMoedaParaNumero } from '../utils/functions';
import lixeiraIcon from '../img/lixeira.png';
import ConfirmDialog from '../components/ConfirmDialog'; // Importe o ConfirmDialog
import ModalPesquisaGN from '../components/ModalPesquisaGN';
import ModalVinculaProdVeiculo from '../components/ModalVinculaProdVeiculo'; // Importe o modal de vinculação de veículos



const ModalProdutosNF = ({ isOpen, onClose, prod, onNFOpen,onVinculoSuccess }) => {
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
  const [produtoToDelete, setProdutoToDelete] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [produto, setProduto] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const [isPesquisaGNModalOpen, setIsPesquisaGNModalOpen] = useState(false);

  const [isNFClosed, setIsNFClosed] = useState(false);

  const [isVinculaVeiculoModalOpen, setIsVinculaVeiculoModalOpen] = useState(false);
  const [produtoParaVincular, setProdutoParaVincular] = useState(null);
  const [mensagem, setMensagem] = useState('');



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
      onNFOpen=true;
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

  const handleActionClick = (produto) => {
    setSelectedProduct(produto);
    if (produto.identificador == 0) {
      setIsTratarModalOpen(true);
    } else if (produto.identificador == 1) {
      setIsDetalhesModalOpen(true);
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
    setMensagem("Deseja excluir o Produto da Nota Fiscal?");

    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (produtoToDelete) {
        // Atualize o status do produto para 'desabilitado' ou 'inativo' (exemplo: status: false)
        const retornaVinculo = await obterVinculoPorProdutoId(produtoToDelete.id, produtoToDelete.nota_id)
        if (retornaVinculo.data.length > 0) {
          setToast({ message: 'Não é possível excluir o produto pois ele possui vínculos.', type: 'error' });
          setIsConfirmDialogOpen(false);
          setProdutoToDelete(null);
          return;
        }
        const updateData = { nota_id: prod.id, status: 1, id: produtoToDelete.idx }; // ou 'false', dependendo de como está modelado no backend
        await desvinculaProdutoNF(produtoToDelete.id, updateData);

        setToast({ message: 'Produto desabilitado com sucesso!', type: 'success' });

        // Atualize a lista de produtos para refletir a mudança
        const updatedProducts = produtos.map(prod =>
          prod.id === produtoToDelete.id ? { ...prod, status: 1 } : prod
        );
        setProdutos(updatedProducts);
        fetchProdutosNF(produtoToDelete.nota_id)
      }
    } catch (error) {
      console.error('Erro ao desabilitar o produto', error);
      setToast({ message: "Erro ao desabilitar o produto.", type: "error" });
    }
    setIsConfirmDialogOpen(false);
    setProdutoToDelete(null);
  };

  const cancelDelete = () => {
    setIsConfirmDialogOpen(false);
    setProdutoToDelete(null);
  };

  const handleSearchChange = (event) => setSearchQuery(event.target.value);

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
      if (!quantidade == false) {
        let errorMessage = err.response.data;
        errorMessage = errorMessage.toString() + ': quantidade vazia'
        setToast({ message: errorMessage, type: "error" });

      } else {
        const errorMessage = err.response.data;
        setToast({ message: errorMessage, type: "error" });

      }
    }
  };


  const canDisplayTable = prod?.status === 'andamento';
  const canCadastrarProdutos = prod?.status === 'aberta' || prod?.status === 'andamento';
  const canFecharNF = prod?.status === 'andamento';
  const hasProdutos = produtos.length > 0;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>X</button>
        <h2>Produtos da Nota Fiscal {prod?.nNF ? ` - Nº ${prod.nNF}` : ''}</h2>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {canCadastrarProdutos && !isNFClosed && (
              <div id='cadastro-padrão'>
                <div id='button-group'>
                  <label>Não achou o produto?</label>
                  <button className='button' onClick={() => handleCadastraProdClick(prod)}>Cadastrar Produtos</button>
                  {hasProdutos && !isNFClosed && (
                    <button className='button-excluir' onClick={() => handleFecharNF(prod)} disabled={isNFClosed}>
                      Fechar NF
                    </button>
                  )}
                </div>
                <div>
                  <label htmlFor="produto">Produto</label>
                  <input
                    className='input-geral'
                    id='produto'
                    type="text"
                    value={produto ? produto : 'Produto a Ser Adicionado'} // Substitui vírgula por ponto
                    required
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="quantidade">Quantidade</label>
                  <input
                    className='input-geral'
                    id='quantidade'
                    type="text"
                    value={quantidade.replace(',', '.')} // Substitui vírgula por ponto
                    onChange={handleQuantidadeChange}
                    placeholder='Quantidade'
                    required
                    aria-required="true" // Para acessibilidade
                  />
                </div>
                <div>
                  <label htmlFor="valor_unit">Valor Unitário</label>
                  <input
                    className='input-geral'
                    id='valor_unit'
                    type="text"
                    value={valor_unit}
                    onChange={handleValorUnitChange}
                    placeholder='Valor Unitário'
                    required
                    aria-required="true" // Para acessibilidade
                  />
                </div>

                {formError && <div className='error-message'>O campo quantidade é obrigatório.</div>}

                <div id='button-group'>
                  <button className="button" onClick={openPesquisaGNModal}>Pesquisar Produto</button>
                  <button className="button" onClick={handleVincular}>Inserir</button>
                </div>
              </div>
            )}

            {!hasProdutos && (
              <p className="no-products-message">Não existem produtos lançados para esta nota fiscal.</p>
            )}

            {hasProdutos && (
              <>
                <div id="results-container">
                  <div id="grid-padrao-container">
                    <table id='grid-padrao'>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Descrição</th>
                          <th>Quantidade</th>
                          <th>Valor Unitário</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentProducts.map((produto, index) => (
                          <tr
                            key={`${produto.id}-${index}`}
                            className={produto.identificador == 0 ? 'highlight-red' : produto.status == 1 ? 'disabled-row' : ''}
                          >
                            <td>{produto.id}</td>
                            <td className="descricao-col">{produto.descricao}</td>
                            <td>{parseFloat(produto.quantidade).toFixed(3)}</td>
                            <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.valor_unit)}</td>
                            <td>
                              <div id="button-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button
                                  className="button-detalhes"
                                  onClick={() => handleActionClick(produto)}
                                  disabled={produto.status == 1} // Desabilitar botão se o produto estiver inativo
                                >
                                  {produto.identificador == 0 ? 'Tratar' : 'Detalhes'}
                                </button>
                                {/* Novo botão Vincular Veículo */}
                                {produto.identificador == 1 && (
                                  <div id='button-group'>
                                    <button
                                      className="button"
                                      onClick={() => handleVincularVeiculo(produto)}
                                      disabled={produto.status == 1} // Desabilitar botão se o produto estiver inativo
                                    >
                                      Vincular Veículo
                                    </button>
                                  </div>
                                )}
                                {produto.identificador == 1 && produto.status !== 1 && prod.lancto !== 'automatico' && !isNFClosed && (
                                  <img
                                    src={lixeiraIcon}
                                    alt="Excluir"
                                    className="lixeira-icon"
                                    onClick={() => handleExcluirProdNf(produto)}
                                    style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                                  />
                                )}
                              </div>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="pagination">
                  {pageNumbers.map((number) => (
                    <button
                      key={number}
                      onClick={() => handlePageChange(number)}
                      className={number === currentPage ? 'active' : ''}
                    >
                      {number}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Exibir Toast */}
      {toast.message && <Toast type={toast.type} message={toast.message} />}


      {isTratarModalOpen && (
        <ModalTratarProdutosNF
          key={modalKey}
          isOpen={isTratarModalOpen}
          onClose={() => setIsTratarModalOpen(false)}
          product={selectedProduct}
          onVinculoSuccess={handleVinculoSuccess}
        />
      )}

      {isDetalhesModalOpen && (
        <ModalDetalhesProdutosNF
          isOpen={isDetalhesModalOpen}
          onClose={() => setIsDetalhesModalOpen(false)}
          product={selectedProduct}
        />
      )}

      {isCadastraProdutoModalOpen && (
        <ModalCadastraProduto
          isOpen={isCadastraProdutoModalOpen}
          onClose={() => setIsCadastraProdutoModalOpen(false)}
          onSubmit={() => handleVinculoSuccess('Produto cadastrado com sucesso!')}
          prod={selectedNFe}
          additionalFields={additionalFields}
        />
      )}
      {/* Modal de confirmação */}
      {isConfirmDialogOpen && (
        <ConfirmDialog
          isOpen={isConfirmDialogOpen}
          message={mensagem}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
      {/* Modal de pesquisa de produtos */}
      <ModalPesquisaGN
        isOpen={isPesquisaGNModalOpen}
        onClose={closePesquisaGNModal}
        onSelectProduto={handleSelectProduto}
      />
      {/* Modal de Vinculação de Veículos */}
      {isVinculaVeiculoModalOpen && (
        <ModalVinculaProdVeiculo
          isOpen={isVinculaVeiculoModalOpen}
          onClose={closeVinculaVeiculoModal}
          onNFOpen={true}
          produto={produtoParaVincular}
          quantidadeRestante={quantidadeVinculada}
          onVinculoSuccess={handleVinculoSuccess} // Atualiza lista de produtos ao sucesso
        />
      )}
    </div>
  );

};

export default ModalProdutosNF;
