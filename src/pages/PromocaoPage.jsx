import React, { useEffect, useState } from 'react';
import { getPromocoes, getByIdPromocao, getItensPromocao } from '../services/ApiPromocao/ApiPromocao';
import Pagination from '../utils/Pagination';
import Toast from '../components/Toast';
import ModalCadastroPromocao from '../components/ModalCadastroPromocao';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";
import { formatarMoedaBRL, converterData } from '../utils/functions';

const PromocaoPage = () => {
  const [promocoes, setPromocoes] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [linhasPorPagina, setLinhasPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPromocao, setEditPromocao] = useState(null);
  const [isEdit, setIsEdit] = useState(false);



  const [filtroTermo, setFiltroTermo] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  //Permissoes
  const { permissions } = useAuth();
  const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    checkPermission("promocoes", "view")
  }, [])

  useEffect(() => {
    carregarPromocoes();
  }, [paginaAtual, linhasPorPagina]);

  const carregarPromocoes = async () => {
    setLoading(true);
    try {
      const response = await getPromocoes({
        page: paginaAtual,
        limit: linhasPorPagina,
        termo: filtroTermo,
        dataInicio: filtroDataInicio,
        dataFim: filtroDataFim
      });

      setPromocoes(response.promocoes || []);
      setTotalPaginas(response.totalPages || 1);
    } catch (err) {
      console.error('Erro ao carregar promoções:', err);
      setToast({ message: 'Erro ao carregar promoções', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRowsPerPage = (newRowsPerPage) => {
    setLinhasPorPagina(newRowsPerPage);
    setPaginaAtual(1);
  };

  const handleCadastraPromocao = () => {
    checkPermission("promocoes", "insert", () => {
      setEditPromocao(false);
      setIsModalOpen(true);
      setIsEdit(false)
    });
  }

  const handleEditPromocao = async (promocao) => {
    try {
      setLoading(true);
      checkPermission("promocoes", "edit", async () => {
        const response = await getByIdPromocao(promocao.id);
        setEditPromocao(response);
        setIsModalOpen(true);
        setIsEdit(true)
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do cliente', error);
      setToast({ message: "Erro ao buscar detalhes do cliente.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setEditPromocao(null);
    setIsModalOpen(false);
    carregarPromocoes();
  };
  const handlePrint = async (promocaoId) => {

    try {
      await getItensPromocao(promocaoId);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setToast({ message: 'Erro ao gerar relatório', type: 'error' });
    }

  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Promoções</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => handleCadastraPromocao()}
        >
          Nova Promoção
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Pesquisar por nome"
          value={filtroTermo}
          onChange={(e) => setFiltroTermo(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
        <input
          type="date"
          placeholder="Data Início"
          value={filtroDataInicio}
          onChange={(e) => setFiltroDataInicio(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
        <input
          type="date"
          placeholder="Data Fim"
          value={filtroDataFim}
          onChange={(e) => setFiltroDataFim(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
        <button
          onClick={() => { setPaginaAtual(1); carregarPromocoes(); }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2 sm:mt-0"
        >
          Filtrar
        </button>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="spinner-container"><div className="spinner"></div></div>
      ) : (
        <div className="overflow-x-auto shadow rounded">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="py-2 px-4">Nome</th>
                <th className="py-2 px-4">Data Início</th>
                <th className="py-2 px-4">Data Fim</th>
                <th className="py-2 px-4">Desconto (%)</th>
                <th className="py-2 px-4">Ação</th>
              </tr>
            </thead>
            <tbody>
              {promocoes.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="py-2 px-4">{p.descricao}</td>
                  <td className="py-2 px-4">{(p.data_inicio)}</td>
                  <td className="py-2 px-4">{p.data_final ? (p.data_final) : 'Indefinido'}</td>
                  <td className="py-2 px-4">{p.desconto_percentual}%</td>
                  <td className="py-2 px-4">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => handleEditPromocao(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="text-green-600 hover:underline ml-2"
                      onClick={() => handlePrint(p.id)}
                    >
                      Imprimir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      <Pagination
        currentPage={paginaAtual}
        totalPages={totalPaginas}
        onPageChange={setPaginaAtual}
        onRowsChange={handleChangeRowsPerPage}
        rowsPerPage={linhasPorPagina}
        rowsPerPageOptions={[10, 20, 50]}
      />

      {isModalOpen && (
        <ModalCadastroPromocao
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          edit={isEdit}
          promocao={editPromocao}
          onPromocaoSuccess={() => {
            setToast({})
            setToast({ message: 'Promoção Criada com Sucesso.', type: 'success' });
          }}
        />
      )}

      {toast.message && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

export default PromocaoPage;
