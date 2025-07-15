import React, { useState, useEffect } from 'react';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission';

const ModalCadastroTipoContainer = ({ isOpen, onClose, edit, onSubmit, tipoContainer }) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true); // novo estado
  const [toast, setToast] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [permiteEditar, setPermiteEditar] = useState(true);
  const { permissions } = useAuth();

  useEffect(() => {
    if (isOpen) {
      const canEdit = hasPermission(permissions, 'tipocontainer', edit ? 'edit' : 'insert');
      setPermiteEditar(canEdit);
    }
  }, [isOpen, edit, permissions]);

  useEffect(() => {
    if (tipoContainer) {
      setNome(tipoContainer.nome || '');
      setDescricao(tipoContainer.descricao || '');
      setAtivo(tipoContainer.status?.toLowerCase() === 'ativo'); // ou tipoContainer.ativo === true
    } else {
      setNome('');
      setDescricao('');
      setAtivo(true);
    }
  }, [tipoContainer]);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ nome, descricao, status: ativo ? 'ativo' : 'inativo' });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6 relative">
        <button
          className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-lg"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4">
          {edit ? 'Editar Tipo de Container' : 'Cadastrar Tipo de Container'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={100}
              disabled={!permiteEditar}
              required
              className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              maxLength={254}
              disabled={!permiteEditar}
              className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              disabled={!permiteEditar}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="ativo" className="text-sm text-gray-700">Ativo</label>
          </div>

          {permiteEditar && (
            <div className="text-right">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          )}
        </form>
      </div>

      {toast.message && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
};

export default ModalCadastroTipoContainer;
