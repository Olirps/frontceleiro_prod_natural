import React from 'react';

const ModalGeraContrato = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-lg">
        <div className="mb-4">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-800">Gerando contrato...</h2>
        <p className="text-sm text-gray-500 mt-2">Aguarde, estamos processando o Contrato.</p>
      </div>
    </div>
  );
};

export default ModalGeraContrato;
