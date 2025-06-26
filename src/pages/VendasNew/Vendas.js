import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useVendasData } from './hooks/useVendasData';
import { useVendasFilters } from './hooks/useVendasFilters';
import { useVendasModals } from './hooks/useVendasModals';
import SearchFormVendas from './components/SearchFormVendas';
import VendasTable from './components/VendasTable';
import VendasFooter from './components/VendasFooter';
import ModalCadastroVenda from '../../components/ModalCadastroVenda';
import ModalCancelaVenda from '../../components/ModalCancelaVenda';
import ConfirmDialog from '../../components/ConfirmDialog';
import ComunicacaoSEFAZ from '../../components/ComunicacaoSEFAZ';
import Toast from '../../components/Toast';
import '../../styles/Vendas.css';

function Vendas() {
  const { permissions } = useAuth();

  // Hooks customizados
  const {
    filters,
    setFilters,
    handleSearch,
    handleClear,
    handleRowsChange,
    handleCpfChange,
    handlePreviousPage,
    handleNextPage
  } = useVendasFilters();

  const {
    vendasData,
    loading,
    fetchVendas,
    totalPreco,
    totalDescontos,
    somarLancamentosManuais,
    setSomarLancamentosManuais
  } = useVendasData(filters);

  const {
    modals,
    toast,
    handleOpenModal,
    handleCloseModal,
    handleSubmitActions,
    setToast
  } = useVendasModals(fetchVendas, permissions);

  return (
    <div id="vendas-container">
      <h1 className="title-page">Vendas Realizadas</h1>

      <SearchFormVendas
        filters={filters}
        setFilters={setFilters}
        tiposPagamento={vendasData.tiposPagamento}
        somarLancamentosManuais={somarLancamentosManuais}
        onSearch={handleSearch}
        onClear={handleClear}
        onCpfChange={handleCpfChange}
        onSetSomarLancamentos={setSomarLancamentosManuais}
        onCadastrarModal={() => handleOpenModal('cadastro')}
      />

      <div id="separator-bar"></div>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <VendasTable
            vendas={vendasData.pagamentosPaginaAtual}
            onSearchClick={(id) => handleOpenModal('edicao', id)}
            onPrintClick={(venda) => handleSubmitActions('print', venda)}
            onCancelClick={(id) => handleOpenModal('cancelamento', id)}
            onEmitNFeClick={(venda) => handleOpenModal('confirmacaoNFe', venda)}
          />

          <VendasFooter
            currentPage={filters.currentPage}
            totalPages={vendasData.totalPages}
            rowsPerPage={filters.rowsPerPage}
            totalPreco={totalPreco}
            totalDescontos={totalDescontos}
            onPreviousPage={handlePreviousPage}
            onNextPage={handleNextPage}
            onRowsChange={handleRowsChange}
            showTotals={filters.currentPage === vendasData.totalPages}
          />
        </>
      )}

      {/* Modais */}
      {modals.cadastro && (
        <ModalCadastroVenda
          isOpen={modals.cadastro}
          onSubmit={modals.isEdit ? handleSubmitActions.bind(null, 'edicao') : handleSubmitActions.bind(null, 'cadastro')}
          venda={modals.selectedVenda}
          onClose={() => handleCloseModal('cadastro')}
          edit={modals.isEdit}
          tipo={'venda'}
        />
      )}

      {modals.cancelamento && (
        <ModalCancelaVenda
          isOpen={modals.cancelamento}
          onClose={() => handleCloseModal('cancelamento')}
          onSubmit={handleSubmitActions.bind(null, 'cancelamento')}
          idVenda={modals.idVenda}
          status={modals.status}
        />
      )}

      {modals.confirmacaoNFe && (
        <ConfirmDialog
          isOpen={modals.confirmacaoNFe}
          onClose={() => handleCloseModal('confirmacaoNFe')}
          onConfirm={handleSubmitActions.bind(null, 'emitirNFe')}
          message="Você tem certeza que deseja Emitir a NFe desta venda?"
        />
      )}

      {modals.comunicacaoSEFAZ && (
        <ComunicacaoSEFAZ
          isOpen={modals.comunicacaoSEFAZ}
          onClose={() => handleCloseModal('comunicacaoSEFAZ')}
        />
      )}

      {toast.message && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
}

export default Vendas;