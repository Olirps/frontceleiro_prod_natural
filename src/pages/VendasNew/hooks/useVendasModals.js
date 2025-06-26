import { useState } from 'react';
import {
  getEmpresaById,
  getVendaById,
  registravenda,
  updateVenda,
  cancelaVenda,
  geraNFC,
  cancelaNf,
  statusNfe,
} from '../../../services/api';
import { hasPermission } from '../../../utils/hasPermission';
import { converterData } from '../../../utils/functions';
import imprimeVenda from '../../../utils/impressaovenda';

export function useVendasModals(fetchVendas, permissions) {
  const [modals, setModals] = useState({
    cadastro: false,
    cancelamento: false,
    confirmacaoNFe: false,
    comunicacaoSEFAZ: false
  });
  const [toast, setToast] = useState({ message: '', type: '' });
  const [selectedVenda, setSelectedVenda] = useState(null);
  const [idVenda, setIdVenda] = useState('');
  const [status, setStatus] = useState(null);
  const [isEdit, setIsEdit] = useState(false);

  const handleOpenModal = async (modalType, vendaId = null) => {
    // Verificação de permissões
    const permissionMap = {
      cadastro: { feature: 'vendas', action: 'insert' },
      edicao: { feature: 'vendas', action: 'update' },
      cancelamento: { feature: 'vendas', action: 'delete' },
      confirmacaoNFe: { feature: 'emitir-nf', action: 'insert' }
    };

    if (permissionMap[modalType] && !hasPermission(permissions, permissionMap[modalType].feature, permissionMap[modalType].action)) {
      setToast({
        message: `Você não tem permissão para ${modalType === 'confirmacaoNFe' ? 'Emitir Nota Fiscal' : 'esta ação'}.`,
        type: "error"
      });
      return;
    }

    // Lógica específica para cada modal
    if (modalType === 'edicao' && vendaId) {
      try {
        const venda = await getVendaById(vendaId);
        setSelectedVenda(venda);
        setIsEdit(true);
      } catch (error) {
        setToast({ message: "Erro ao carregar venda", type: "error" });
        return;
      }
    } else if (modalType === 'cancelamento' && vendaId) {
      try {
        const statusResponse = await statusNfe(vendaId);
        setStatus(statusResponse);
        setIdVenda(vendaId);
      } catch (error) {
        setToast({ message: "Erro ao verificar status da venda", type: "error" });
        return;
      }
    } else if (modalType === 'confirmacaoNFe' && vendaId) {
      setIdVenda(vendaId);
    }

    setModals(prev => ({ ...prev, [modalType]: true }));
  };

  const handleCloseModal = (modalType) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
    if (modalType === 'cadastro') {
      setSelectedVenda(null);
      setIsEdit(false);
    }
  };

  const handleSubmitActions = async (actionType, data) => {
    try {
      const username = localStorage.getItem('username');

      switch (actionType) {
        case 'cadastro':
          const empresa = await getEmpresaById(1);
          const pagamentos = data.pagamentos.map(p => ({
            formaId: p.forma,
            formaPagamentoNome: p.formaPgtoNome,
            vlrPago: p.vlrPago,
          }));

          await registravenda({
            ...data,
            login: username,
            empresa: empresa.data,
            pagamentos
          });
          setToast({ message: "Venda cadastrada com sucesso!", type: "success" });
          break;

        case 'edicao':
          await updateVenda(selectedVenda.id, { ...data, login: username });
          setToast({ message: "Venda atualizada com sucesso!", type: "success" });
          break;

        case 'cancelamento':
          const cancelData = {
            motivo_cancelamento: data.motivo,
            dataCancelamento: converterData(new Date().toLocaleString().replace(',', ''))
          };

          if (status.response === 'ANDAMENTO') {
            await cancelaVenda(idVenda, cancelData);
          } else {
            await cancelaNf(idVenda, cancelData);
          }
          setToast({ message: 'Venda cancelada com sucesso!', type: 'success' });
          break;

        case 'emitirNFe':
          setModals(prev => ({ ...prev, confirmacaoNFe: false, comunicacaoSEFAZ: true }));
          const response = await geraNFC(idVenda.vendaId);

          if (response.status === 200) {
            setToast({ message: "NFC-e autorizada com sucesso!", type: "success" });
          } else if (response.status === 412) {
            const errorData = await response.data;
            setToast({
              message: `NFC-e rejeitada: ${errorData.motivo || errorData.erro || "Motivo não informado"}`,
              type: "error"
            });
          }
          break;

        case 'print':
          await imprimeVenda(data.vendaId);
          break;

        default:
          break;
      }

      fetchVendas();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Erro ao executar ação.";
      setToast({ message: errorMessage, type: "error" });
    } finally {
      if (actionType !== 'emitirNFe') {
        handleCloseModal(Object.keys(modals).find(key => modals[key]));
      } else {
        handleCloseModal('comunicacaoSEFAZ');
      }
    }
  };

  return {
    modals,
    toast,
    selectedVenda,
    idVenda,
    status,
    isEdit,
    handleOpenModal,
    handleCloseModal,
    handleSubmitActions,
    setToast
  };
}