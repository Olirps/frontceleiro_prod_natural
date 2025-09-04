import React from 'react';
import '../styles/ConfirmDialog.css'; // Adicione um CSS para a modal, se necessário

const ConfirmDialog = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null; // Verifica se a modal deve ser exibida

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <p className="text-gray-800 text-center mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            onClick={onConfirm}
          >
            Sim
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            onClick={onCancel}
          >
            Não
          </button>
        </div>
      </div>
    </div>

  );
};

export default ConfirmDialog;
