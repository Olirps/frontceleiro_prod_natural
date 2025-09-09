import React, { useState, useEffect } from 'react';

import "../styles/ContasPagarSemana.css"; // Arquivo de estilos
import { formatarData, formatarMoedaBRL } from '../utils/functions';
import { getParcelaByID, pagamentoParcela, getContaPagarSemana } from '../services/api';
import ModalPagarLancamentos from '../components/ModalPagarLancamentos'; // Importe o novo modal
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";
import PermissionModal from '../components/PermissionModal';
import { converterMoedaParaNumero } from '../utils/functions';


const ContasPagarSemana = ({ contas }) => {
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [isModalPagarLancamentosOpen, setIsModalPagarLancamentosOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  //Permissoes
  const { permissions } = useAuth();
  const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handlePagarParcelas = async (parcela) => {
    checkPermission('pagamentosparcelas', 'insert', async () => {
      const response = await getParcelaByID(parcela.id);
      setSelectedParcela(response.data);
      setIsModalPagarLancamentosOpen(true);
    });
  };

  const handleSavePagamento = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const valorPago = formData.get('valorPago');
    const pagamento = {
      data_pagamento: formData.get('datapagamento'),
      valor_pago: converterMoedaParaNumero(valorPago),
      conta_id: formData.get('contabancaria'),
      metodo_pagamento: formData.get('formaPagamento'),
      data_efetiva_pg: new Date().toISOString().split('T')[0],
      status: 'liquidado'
    };

    try {
      const parcelaPaga = await pagamentoParcela(selectedParcela.id, pagamento);
      window.location.reload(); // Recarrega a página

      // Aqui você pode enviar as parcelas para o backend ou processá-las conforme necessário
      setToast({ message: "Parcelas Liquidada com sucesso!", type: "success" });
      setIsModalPagarLancamentosOpen(false);
    } catch (error) {

    }
  };

  return (
    <div className="contas-container">
      {contas.length === 0 ? (
        <p>Nenhuma conta a pagar nesta semana.</p>
      ) : (
        <table className="contas-tabela">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Vencimento</th>
              <th>Valor (R$)</th>
              <th>Pagar</th>
            </tr>
          </thead>
          <tbody>
            {contas.map((conta) => (
              <tr key={conta.id} className={conta.status}>
                <td>{conta.descricao}</td>
                <td>{formatarData(conta.vencimento)}</td>
                <td>{formatarMoedaBRL(conta.valor_parcela)}</td>
                <td>
                  <button
                    className="edit-button"
                    onClick={() => {
                      handlePagarParcelas(conta);
                    }}
                  >
                    Pagar
                  </button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {toast.message && <Toast type={toast.type} message={toast.message} />}
      {isModalPagarLancamentosOpen && (
        <ModalPagarLancamentos
          isOpen={isModalPagarLancamentosOpen}
          onClose={() => setIsModalPagarLancamentosOpen(false)}
          onSubmit={handleSavePagamento}
          parcela={selectedParcela}
        />
      )}
      {/* Renderização do modal de autorização */}
      <PermissionModalUI />
    </div>
  );
};

export default ContasPagarSemana;
