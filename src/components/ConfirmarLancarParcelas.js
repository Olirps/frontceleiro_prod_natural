import React from 'react';
import '../styles/ConfirmDialog.css';

const ConfirmarLancarParcelas = ({ isOpen, message, onConfirm,onConfirmar , onCancel, confirmText = "Lançar Parcelas", cancelText = "Cancelar", cancelarLancto }) => {
  if (!isOpen) return null;
  if (cancelarLancto) {
    confirmText = "Cancelar Lançamento"
  }
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <p>{message}</p>
        <div className="button-group">
          <button className="button-geral" onClick={onConfirmar}>{confirmText}</button>
          <button className="button-excluir" onClick={onCancel}>{cancelText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmarLancarParcelas;
