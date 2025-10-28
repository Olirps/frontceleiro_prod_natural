import React, { useEffect, useState } from 'react';
import { getUsoPacoteById } from '../services/ApiUsoPacote/ApiUsoPacote';

const UsoPacoteModal = ({ show, onClose, pacoteCliente }) => {
  const [usos, setUsos] = useState([]);

  useEffect(() => {
    if (!show || !pacoteCliente) return;
    carregar();
  }, [show, pacoteCliente]);

  const carregar = async () => {
    try {
      const data = await getUsoPacoteById(pacoteCliente.id);
      setUsos(data || []);
    } catch (error) {
      console.error('Erro ao carregar usos do pacote:', error);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-4 md:p-6 rounded-xl w-full max-w-3xl shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-center md:text-left">
          Histórico de Uso - {pacoteCliente?.pacote?.nome}
        </h2>
        <div className="flex flex-col gap-3">
          {usos.length > 0 ? (
            usos.map((u, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{u.xProd}</span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${u.saldo_restante <= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'
                      }`}
                  >
                    {u.saldo_restante <= 0 ? 'Esgotado' : 'Disponível'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600">
                  <div>Tipo: <span className="capitalize">{u.tipo || '-'}</span></div>
                  <div>Total: {u.quantidade_total}</div>
                  <div>Usada: {u.quantidade_usada}</div>
                  <div>Saldo: {u.saldo_restante}</div>
                </div>
                <div className="mt-2">
                  <span className="text-gray-500 text-sm">Datas de Uso:</span>
                  {u.datas_uso.length > 0 ? (
                    <ul className="list-disc ml-4 text-gray-700 text-sm">
                      {u.datas_uso.map((d, i) => (
                        <li key={i}>{new Date(d).toLocaleDateString('pt-BR')}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 text-sm">Nenhum uso registrado</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">Nenhum registro encontrado</div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>

  );
};

export default UsoPacoteModal;
