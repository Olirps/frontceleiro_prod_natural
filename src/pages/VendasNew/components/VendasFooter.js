import React from 'react';

function VendasFooter({
  currentPage,
  totalPages,
  rowsPerPage,
  totalPreco,
  totalDescontos,
  onPreviousPage,
  onNextPage,
  onRowsChange,
  showTotals
}) {
  return (
    <>
      <div id="pagination-container">
        <button onClick={onPreviousPage} disabled={currentPage === 1}>
          Anterior
        </button>
        <span>Página {currentPage} de {totalPages}</span>
        <button onClick={onNextPage} disabled={currentPage === totalPages}>
          Próxima
        </button>
      </div>

      <div id="show-more-container">
        <label htmlFor="rows-select">Mostrar</label>
        <select 
          id="rows-select" 
          value={rowsPerPage} 
          onChange={onRowsChange}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <label htmlFor="rows-select">por página</label>
      </div>

      {showTotals && (
        <div id="totals-container">
          <div className="total-item">
            <span>Total Recebido:</span>
            <strong>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalPreco)}
            </strong>
          </div>
          <div className="total-item">
            <span>Total Descontos:</span>
            <strong>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalDescontos)}
            </strong>
          </div>
        </div>
      )}
    </>
  );
}

export default VendasFooter;