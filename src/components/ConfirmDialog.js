import React from 'react';
import '../styles/ConfirmDialog.css'; // Adicione um CSS para a modal, se necessário

const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <p>{message}</p>
        <div className="confirm-dialog-buttons">
          <button onClick={onConfirm}>Sim</button>
          <button onClick={onCancel}>Não</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
