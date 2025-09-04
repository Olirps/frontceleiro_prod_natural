import React, { useEffect, useState } from 'react';

export default function TefTransactionModal({ isOpen,mensagem, tempoTotalSegundos = 90 }) {
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    setProgresso(0);
    const intervalo = 1000;
    let tempoDecorrido = 0;

    const timer = setInterval(() => {
      tempoDecorrido++;
      setProgresso((tempoDecorrido / tempoTotalSegundos) * 100);

      if (tempoDecorrido >= tempoTotalSegundos) {
        clearInterval(timer);
      }
    }, intervalo);

    return () => clearInterval(timer);
  }, [isOpen, tempoTotalSegundos]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md flex flex-col items-center relative">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-60 mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Aguardando {mensagem}...</h2>
        <p className="text-gray-600 text-center mb-4">
          Estamos processando a transação bancária.<br />
          Por favor, não feche esta janela.
        </p>

        {/* Barra de progresso */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${progresso}%` }}
          ></div>
        </div>

        <p className="text-sm text-gray-500 mt-2">
          Tempo restante: {Math.max(0, tempoTotalSegundos - Math.round((progresso / 100) * tempoTotalSegundos))}s
        </p>
      </div>
    </div>
  );
}