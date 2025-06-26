import { useState } from 'react';
import { cpfCnpjMask, removeMaks } from '../../../components/utils';

export function useVendasFilters(fetchVendas) {
  const [filters, setFilters] = useState({
    nome: '',
    cpfCnpj: '',
    dataVendaInicial: '',
    dataVendaFinal: '',
    tipoVenda: '',
    rowsPerPage: 10,
    currentPage: 1
  });

  const handleCpfChange = (e) => {
    const { value } = e.target;
    const maskedValue = cpfCnpjMask(value);
    setFilters(prev => ({ ...prev, cpfCnpj: maskedValue }));
  };

  const handleSearch = async () => {
    try {
      await fetchVendas({
        clienteNome: filters.nome || undefined,
        cpfCnpj: removeMaks(filters.cpfCnpj) || undefined,
        dataInicio: filters.dataVendaInicial || undefined,
        dataFim: filters.dataVendaFinal || undefined,
        tipoVenda: filters.tipoVenda || undefined
      });
      setFilters(prev => ({ ...prev, currentPage: 1 }));
    } catch (error) {
      console.error('Erro na busca:', error);
    }
  };

  const handleClear = () => {
    setFilters({
      nome: '',
      cpfCnpj: '',
      dataVendaInicial: '',
      dataVendaFinal: '',
      tipoVenda: '',
      rowsPerPage: 10,
      currentPage: 1
    });
    fetchVendas();
  };

  const handleRowsChange = (e) => {
    setFilters(prev => ({ ...prev, rowsPerPage: Number(e.target.value), currentPage: 1 }));
  };

  const handlePreviousPage = () => {
    if (filters.currentPage > 1) {
      setFilters(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  };

  const handleNextPage = () => {
    // ⚠️ Removido totalPages porque não pertence a este hook
    setFilters(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
  };

  return {
    filters,
    setFilters,
    handleSearch,
    handleClear,
    handleRowsChange,
    handleCpfChange,
    handlePreviousPage,
    handleNextPage,
    setFilters
  };
}
