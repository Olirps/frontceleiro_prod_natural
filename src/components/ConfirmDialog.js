import React from 'react';
import '../styles/ConfirmDialog.css'; // Adicione um CSS para a modal, se necessário

const ConfirmDialog = ({ isOpen,message, onConfirm, onCancel }) => {
  if (!isOpen) return null; // Verifica se a modal deve ser exibida

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        <div id='button-group'>
          <button className='button' onClick={onConfirm}>Sim</button>
          <button className='button' style={{ backgroundColor: "red", color: "white" }} onClick={onCancel}>
            Não
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
