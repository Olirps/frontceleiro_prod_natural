// components/ClienteSelector.jsx
import React from "react";

export default function ClienteSelector({
  clienteBusca,
  setClienteBusca,
  clientesFiltrados,
  setClienteSelected,
  setClienteId,
  setClienteNome,
  setClientesFiltrados,
  onNovoCliente,
  disabled
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">Cliente</label>
      <div className="flex gap-2 relative">
        <input
          type="text"
          className="w-full border rounded-xl p-2 focus:ring-2 focus:ring-blue-400"
          placeholder="Digite o nome ou CPF/CNPJ..."
          value={clienteBusca}
          onChange={(e) => setClienteBusca(e.target.value)}
          disabled={disabled}
        />

        {!disabled && (
          <button
            type="button"
            onClick={onNovoCliente}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3 flex items-center gap-1"
          >
            ➕ Novo
          </button>
        )}

        {clientesFiltrados.length > 0 && clienteBusca.length >= 3 && (
          <ul className="absolute top-11 left-0 bg-white border rounded-lg shadow-lg w-full max-h-56 overflow-y-auto z-10">
            {clientesFiltrados.map((cliente) => (
              <li
                key={cliente.id}
                onClick={() => {
                  setClienteId(cliente.id);
                  setClienteNome(cliente.nome);
                  setClienteSelected(true);
                  setClienteBusca(cliente.nome);
                  setClientesFiltrados([]);
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              >
                {cliente.nome} — {cliente.cpfCnpj}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
