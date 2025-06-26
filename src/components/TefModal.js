import React, { useState, useEffect } from 'react';
import { formatarMoedaBRL } from '../utils/functions';
import Toast from './Toast'; // Se não usa, pode remover
import '../styles/TefModal.css';

const TefModal = ({
  isOpen,
  onClose,
  onSuccess,
  paymentData,
  processTefPayment,
  isPartialPayment
}) => {
  const [status, setStatus] = useState('waiting');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [countdown, setCountdown] = useState(isPartialPayment ? 30 : 15);
  const [progresso, setProgresso] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    setStatus('waiting');
    setCountdown(isPartialPayment ? 30 : 15);
    setProgresso(0);
  }, [isOpen, isPartialPayment]);

  useEffect(() => {
    if (status !== 'processing') return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });

      setProgresso(prev => {
        const incremento = 100 / (isPartialPayment ? 30 : 15);
        return Math.min(prev + incremento, 100);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const startPayment = async () => {
    setStatus('processing');
    try {
      const success = await processTefPayment(paymentData);
      if (success) {
        setStatus('success');
        setTimeout(() => {
          onSuccess(paymentData);
          onClose();
        }, 1000);
      } else {
        setStatus('error');
        setToast({ message: 'Pagamento não aprovado', type: 'error' });
      }
    } catch (error) {
      console.error('Erro no TEF:', error);
      setStatus('error');
      setToast({ message: 'Erro ao processar pagamento', type: 'error' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="tef-modal-overlay fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center">
      <div className={`tef-modal-content bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative`}>
        {/* Header */}
        <div className="tef-modal-header flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Pagamento via TEF</h3>
          <button
            className="text-xl text-gray-500 hover:text-red-500"
            onClick={onClose}
            disabled={status === 'processing'}
          >
            &times;
          </button>
        </div>

        {/* Corpo */}
        <div className="tef-modal-body">
          {isPartialPayment && (
            <div className="tef-payment-info mb-4">
              <div className="flex justify-between">
                <span>Valor:</span>
                <strong>{formatarMoedaBRL(paymentData?.valor || 0)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Tipo:</span>
                <strong>{paymentData?.formaPgtoNome}</strong>
              </div>
            </div>
          )}

          {/* Status e Ações */}
          <div className="tef-status-area text-center">
            {status === 'waiting' && (
              <>
                <p className="mb-2">
                  {isPartialPayment ? 'Insira o cartão no terminal' : 'Aproxime ou insira o cartão'}
                </p>
                <p className="text-sm text-gray-500">Tempo restante: {countdown}s</p>
                {isPartialPayment && (
                  <button
                    onClick={startPayment}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Iniciar Pagamento
                  </button>
                )}
              </>
            )}

            {status === 'processing' && (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-600 border-opacity-70"></div>
                <p className="text-sm">Processando transação...</p>

                {/* Barra de progresso */}
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-blue-600 transition-all duration-200"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
              </div>
            )}

            {status === 'success' && (
              <p className="text-green-600 font-semibold mt-4">Pagamento aprovado!</p>
            )}

            {status === 'error' && (
              <p className="text-red-600 font-semibold mt-4">Falha no pagamento.</p>
            )}
          </div>
        </div>

        {/* Toast (opcional) */}
        {toast.message && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
        )}
      </div>
    </div>
  );
};

export default TefModal;
