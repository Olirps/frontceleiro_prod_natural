import React from 'react';

function VendaActions({ venda, onSearchClick, onPrintClick, onCancelClick, onEmitNFeClick }) {
  return (
    <div id="button-group">
      {venda.tipo === "Venda" && (
        <>
          <button 
            onClick={() => onCancelClick(venda.vendaId)} 
            className="button" 
            title="Cancelar"
          >
            🚫
          </button>
          <button
            onClick={() => onSearchClick(venda.vendaId)}
            className="button"
            title="Pesquisar"
          >
            🔍
          </button>
        </>
      )}
      <button
        onClick={() => onPrintClick(venda)}
        className="button"
        title="Impressão"
      >
        🖨️
      </button>
      <button
        onClick={() => onEmitNFeClick(venda)}
        className="button"
        title="Emitir NFC-e"
      >
        📤
      </button>
    </div>
  );
}

export default VendaActions;