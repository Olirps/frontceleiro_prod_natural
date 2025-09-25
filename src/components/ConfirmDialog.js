import React, { useState } from "react";
import '../styles/ConfirmDialog.css';

const ConfirmDialog = ({ isOpen, message, onJustificar, onCancel, onConfirm }) => {
  const [justificativa, setJustificativa] = useState('');

  if (!isOpen) return null;

  const handleJustificar = () => {
    if (onJustificar) onJustificar(justificativa); // retorna a justificativa somente se existir
    setJustificativa(''); // limpa o input
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    setJustificativa('');
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    setJustificativa('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <p className="text-gray-800 text-center mb-6">{message}</p>

        {onJustificar && (
          <input
            type='text'
            placeholder='Digite sua justificativa'
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 w-full mb-4"
          />
        )}

        <div className="flex justify-center gap-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            onClick={onJustificar ? handleJustificar : handleConfirm}
          >
            Sim
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            onClick={handleCancel}
          >
            Não
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
