import { useEffect, useState } from 'react';
import ModalContainerMovimentacao from '../components/ModalContainerMovimentacao';
import { getAllContainersMovimentacoes, getMovimentacaoById, generateContractoPDF } from '../services/api';
import Pagination from '../utils/Pagination';
import ModalGeraContrato from '../components/ModalGeraContrato';

export default function MovimentaContainerPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [executarBusca, setExecutarBusca] = useState(true);
  const [gerandoContrato, setGerandoContrato] = useState(false);

  const [filters, setFilters] = useState({
    codigo: '',
    tipoContainer: '',
    contrato: '',
    cliente: '',
    status: '4'
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMovimentacao, setSelectedMovimentacao] = useState(null);
  const [containersMovimentacoes, setContainersMovimentacoes] = useState([]);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(false);


  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (executarBusca) {
      fetchMovimentacoes();
    }
  }, [executarBusca, currentPage, rowsPerPage]);


  const fetchMovimentacoes = async () => {
    setLoading(true);
    try {
      const filtroCliente = filters.cliente?.trim() || '';
      const filtroContrato = filters.contrato?.trim() || '';

      // Verifica se cliente está preenchido mas com menos de 3 caracteres
      if (filtroCliente && filtroCliente.length < 3) {
        setToast({ message: 'Digite pelo menos 3 caracteres para buscar pelo cliente.', type: 'warning' });
        setLoading(false);
        setExecutarBusca(false);
        return;
      }

      // Verifica se contrato está preenchido mas com menos de 3 caracteres
      if (filtroContrato && filtroContrato.length < 3) {
        setToast({ message: 'Digite pelo menos 3 caracteres para buscar pelo contrato.', type: 'warning' });
        setLoading(false);
        setExecutarBusca(false);
        return;
      }

      // Define filtros ajustados
      const filtrosAjustados = {
        ...filters,
        cliente: filtroCliente,
        contrato: filtroContrato,
      };

      const res = await getAllContainersMovimentacoes({
        ...filtrosAjustados,
        page: currentPage,
        pageSize: rowsPerPage
      });

      if (res?.data?.length === 0) {
        setToast({ message: 'Nenhum Registro Encontrado.', type: 'error' });
        setContainersMovimentacoes([]);
      } else {
        setContainersMovimentacoes(res.data);
        setTotalPages(res.pagination || 1);
      }
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      setToast({ message: 'Erro ao carregar movimentações.', type: 'error' });
    } finally {
      setLoading(false);
      setExecutarBusca(false);
    }
  };


  const handleOpenModal = () => {
    setSelectedMovimentacao(null);
    setEdit(false);
    setModalOpen(true);
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
    setExecutarBusca(true);
  };

  const handleImprimirContrato = async (id) => {
    try {
      setGerandoContrato(true);
      const res = await generateContractoPDF(id);
    } catch (error) {
      console.error('Erro ao buscar movimentação:', error);
      setToast({ message: 'Erro ao carregar movimentação.', type: 'error' });
    } finally {
      setGerandoContrato(false);
    }
  }
  const handleEdit = async (id) => {
    try {
      const res = await getMovimentacaoById(id);
      setSelectedMovimentacao(res);
      setLoading(true);
      setEdit(true);
      setModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar movimentação:', error);
      setToast({ message: 'Erro ao carregar movimentação.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Containers Locados</h1>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              type="text"
              name="codigo"
              value={filters.codigo}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Código"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Container</label>
            <input
              type="text"
              name="tipoContainer"
              value={filters.tipoContainer}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Tipo Container"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contrato</label>
            <input
              type="text"
              name="contrato"
              value={filters.contrato}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Contrato"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <input
              type="text"
              name="cliente"
              value={filters.cliente}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded"
            >
              <option value="5">Proposta</option>
              <option value="4">Locado</option>
              <option value="1">Disponível</option>
              <option value="2">Em Manutenção</option>
              <option value="3">Vendido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botão Nova Movimentação */}
      <div className="mb-4">
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
        >
          <span className="mr-2">+</span> Nova Movimentação
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrato</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Início</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Fim</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-blue-500">
                  Carregando movimentações...
                </td>
              </tr>
            ) : containersMovimentacoes && containersMovimentacoes.length > 0 ? (
              containersMovimentacoes.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.numero_contrato}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cliente.nome || item.cliente.nomeFantasia}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.data_inicio ? item.data_inicio.split('T')[0].split('-').reverse().join('/') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.data_fim ? item.data_fim.split('T')[0].split('-').reverse().join('/') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div id="button-group">

                      <button
                        onClick={() => {
                          handleEdit(item.id);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <div>
                        <button
                          onClick={() => handleImprimirContrato(item.id)} // You'll need to implement this handler
                          className="button"
                          title="Contrato"
                        >
                          🖨️
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  Nenhuma movimentação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {containersMovimentacoes && containersMovimentacoes.length > 0 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                setExecutarBusca(true);
              }}
              onRowsChange={(rows) => {
                setRowsPerPage(rows);
                setCurrentPage(1);
                setExecutarBusca(true);
              }}
              rowsPerPage={rowsPerPage}
            />
          </div>
        )}

      </div>

      {/* Modal */}
      <ModalContainerMovimentacao
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedMovimentacao(null);
          setExecutarBusca(true);
        }}
        edit={edit}
        data={selectedMovimentacao}
      />
      <ModalGeraContrato isOpen={gerandoContrato} />
    </div>
  );
}
