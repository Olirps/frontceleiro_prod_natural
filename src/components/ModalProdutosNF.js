import React, { useState, useEffect } from 'react';
import '../styles/ModalProdutosNF.css';
import ModalTratarProdutosNF from '../components/ModalTratarProdutosNF';
import ModalDetalhesProdutosNF from '../components/ModalDetalhesProdutosNF';
import Toast from '../components/Toast';
import { getNFeById, getProdutoNFById, updateNFe, vinculaProdutoNF, desvinculaProdutoNF } from '../services/api';
import ModalCadastraProduto from '../components/ModalCadastraProduto';
import lixeiraIcon from '../img/lixeira.png';
import ConfirmDialog from '../components/ConfirmDialog'; // Importe o ConfirmDialog
import ModalPesquisaGN from '../components/ModalPesquisaGN';


const ModalProdutosNF = ({ isOpen, onClose, prod, onVinculoSuccess }) => {
  const [produtos, setProdutos] = useState([]);
  const [quantidade, setQuantidade] = useState([]);
  const [valor_unit, setValorUnitario] = useState([]);
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


  const handleQuantidadeChange = (e) => {
    //setQuantidade(e.target.value); // Atualiza o estado do nome
    const value = e.target.value;
    setQuantidade(value);
    if (!value || isNaN(value) || value <= 0) {
      setFormError(true);
    } else {
      setFormError(false);
    }
  };
  // Função para buscar produtos da nota fiscal
  const handleValorUnitChange = (e) => {
    //setQuantidade(e.target.value); // Atualiza o estado do nome
    const value = e.target.value;
    setValorUnitario(value);
    if (!value || isNaN(value) || value <= 0) {
      setFormError(true);
    } else {
      setFormError(false);
    }
  };
  // Função para buscar produtos da nota fiscal
  const fetchProdutosNF = async (notaId) => {
    try {
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

  const handleVinculoSuccess = (message) => {
    //setToast({ message, type: "success" });
    setToast({ message: 'Produto Adicionada na Nota Fiscal', type: "success" });

    setVinculoSuccess(prev => !prev);
    setModalKey(prev => prev + 1);
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
    { name: 'valor_unit', type: 'text', placeholder: 'Valor do Unitário' },
  ];

  const handleFecharNF = async (nfe) => {
    try {
      const status = { status: 'fechada' }
      await updateNFe(nfe.id, status);
      handleFechadoSuccess(nfe)
      await fetchNFeStatus(nfe.id); // Atualiza o status da NF no estado local
    } catch (err) {
      console.error('Erro ao fechar a nota fiscal', err);
      setToast({ message: "Erro ao fechar a nota fiscal.", type: "error" });
    }
  };

  const handleExcluirProdNf = (produto) => {
    setProdutoToDelete(produto);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (produtoToDelete) {
        // Atualize o status do produto para 'desabilitado' ou 'inativo' (exemplo: status: false)
        const updateData = { nota_id: prod.id, status: 1, id: produtoToDelete.idx }; // ou 'false', dependendo de como está modelado no backend
        await desvinculaProdutoNF(produtoToDelete.id, updateData);

        setToast({ message: 'Produto desabilitado com sucesso!', type: 'success' });

        // Atualize a lista de produtos para refletir a mudança
        const updatedProducts = produtos.map(prod =>
          prod.id === produtoToDelete.id ? { ...prod, status: 1 } : prod
        );
        setProdutos(updatedProducts);
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

  // Função para abrir o modal de pesquisa
  const openPesquisaGNModal = () => setIsPesquisaGNModalOpen(true);
  const closePesquisaGNModal = () => setIsPesquisaGNModalOpen(false);

  // Função para vincular produto
  const handleVincular = async () => {
    if (!produtoId ) {
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
      valor_unit: valor_unit
    };
    try {
      const vinculado = await vinculaProdutoNF(produtoId, produtoVinculado);
      handleVinculoSuccess('Produto Adicionado na Nota Fiscal');
      await updateNFe(prod.id, { status: 'andamento' });

    } catch (err) {
      if(!quantidade == false){
        let errorMessage = err.response.data;
        errorMessage = errorMessage.toString() + ': quantidade vazia'
        setToast({ message: errorMessage, type: "error" });
  
      }else{
        const errorMessage = err.response.data;
        setToast({ message: errorMessage, type: "error" });
  
      }
      
      /*const errorMessage = err.response?.data?.error || err.message || "Erro ao atualizar produto.";
      setToast({ message: errorMessage, type: "error" });*/
    }
  };


  const canDisplayTable = prod?.status === 'andamento';
  const canCadastrarProdutos = prod?.status === 'aberta' || prod?.status === 'andamento';
  const canFecharNF = prod?.status === 'andamento';
  const hasProdutos = produtos.length > 0;

  return (
    <div id='results-container-nf' className="modal-overlay">
      <div className="modal-content-nf">
        <button className="modal-close" onClick={onClose}>X</button>
        <h2>Produtos da Nota Fiscal {prod?.nNF ? ` - Nº ${prod.nNF}` : ''}</h2>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {canCadastrarProdutos && !isNFClosed && (
              <div id='lancto-prod-nf'>
                <div id='vincula-prod'>
                  <label className='label-prod'>{produto ? produto : 'Produto a Ser Adicionado'}</label>
                  <input
                    id='quantidade'
                    type="text"
                    value={quantidade}
                    onChange={handleQuantidadeChange}
                    placeholder='Quantidade'
                    required
                    aria-required="true" // Para acessibilidade
                  />
                  <input
                    id='valor_unit'
                    type="text"
                    value={valor_unit}
                    onChange={handleValorUnitChange}
                    placeholder='Valor Unitário'
                    required
                    aria-required="true" // Para acessibilidade
                  />
                  {formError && <div className='error-message'>O campo quantidade é obrigatório.</div>}

                  <div className='button-lancto-prod'>
                    <button className="button" onClick={openPesquisaGNModal}>Pesquisar Produto</button>
                    <button className="button" onClick={handleVincular}>Vincular</button>
                  </div>
                </div>

                <div>
                  <button className="button-cad" onClick={() => handleCadastraProdClick(prod)}>Cadastrar Produtos</button>
                  {hasProdutos && !isNFClosed && (
                    <button className="button-fec close-nf-button" onClick={() => handleFecharNF(prod)} disabled={isNFClosed}>
                      Fechar NF
                    </button>
                  )}
                </div>
              </div>
            )}

            {!hasProdutos && (
              <p className="no-products-message">Não existem produtos lançados para esta nota fiscal.</p>
            )}

            {hasProdutos && (
              <>
                <table id='produtos-grid'>
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
                        <td>{produto.quantidade}</td>
                        <td>{produto.valor_unit}</td>
                        <td>
                          <div id="acao_prod" className="acao-prod-container">
                            <button
                              className="edit-button-prod-nf acao_prod"
                              onClick={() => handleActionClick(produto)}
                              disabled={produto.status == 1} // Desabilitar botão se o produto estiver inativo
                            >
                              {produto.identificador == 0 ? 'Tratar' : 'Detalhes'}
                            </button>

                            {produto.identificador == 1 && produto.status !== 1 && prod.lancto !== 'automatico' && !isNFClosed && (
                              <img
                                src={lixeiraIcon}
                                alt="Excluir"
                                className="lixeira-icon acao_prod"
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
          message="Você tem certeza que deseja excluir este produto?"
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
    </div>
  );

};

export default ModalProdutosNF;
