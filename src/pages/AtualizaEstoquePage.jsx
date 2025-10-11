import { useState } from 'react';
import EstoqueModal from '../components/EstoqueModal';

export default function AtualizaEstoquePage() {
  const [modalOpen, setModalOpen] = useState(false);

  const handleSubmit = (data) => {
    console.log('Dados enviados:', data);
    // Aqui você faz POST para seu backend
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Atualização de Estoque</h1>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={() => setModalOpen(true)}
      >
        Lançar Produto
      </button>

      <EstoqueModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onSuccess={() => setModalOpen(false)}
      />
    </div>
  );
}
