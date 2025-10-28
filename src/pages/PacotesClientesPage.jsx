import React, { useState, useEffect } from 'react'
import { getPacotesClientes, deletePacoteCliente } from '../services/ApiPacoteCliente/ApiPacoteCliente'
import PacoteClienteModal from '../components/PacoteClienteModal'
import UsoPacoteModal from '../components/UsoPacoteModal'
import LancamentoPacoteModal from '../components/LancamentoPacoteModal'
import Toast from '../components/Toast';
import Pagination from '../utils/Pagination';
import ConfirmDialog from "../components/ConfirmDialog";



const PacotesClientesPage = () => {
  const [loading, setLoading] = useState(false)
  const [clienteBusca, setClienteBusca] = useState('');
  const [renovaPacote, setRenovaPacote] = useState(null);
  const [renova, setRenova] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [linhasPorPagina, setLinhasPorPagina] = useState(50);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pacotes, setPacotes] = useState([])
  const [confirmDialog, setConfirmDialog] = useState({ open: false, item: null });

  const [filtro, setFiltro] = useState({
    cliente: '',
    pacote: '',
    situacao: '',
    dataInicio: '',
    dataFim: '',
  });
  const [showModal, setShowModal] = useState(false)
  const [showUsoModal, setShowUsoModal] = useState(false)
  const [showLancamentoModal, setShowLancamentoModal] = useState(false)
  const [mensagem, setMensagem] = useState('');
  const [selected, setSelected] = useState(null)
  const [stats, setStats] = useState({ ativos: 0, vencidos: 0, esgotados: 0, pendente: 0 })
  const [toast, setToast] = useState({ message: '', type: '' })


  // ✅ 2 - busca agora via endpoint
  const carregar = async () => {
    try {
      const params = {
        page: paginaAtual,
        limit: linhasPorPagina,
        cliente: filtro.cliente || undefined,
        pacote: filtro.pacote || undefined,
        situacao: filtro.situacao || undefined,
        dataInicio: filtro.dataInicio || undefined,
        dataFim: filtro.dataFim || undefined,
      }
      const res = await getPacotesClientes(params)
      setPacotes(res.data || [])
      setTotalPaginas(res.totalPages || 1)
      atualizarStats(res.stats || [])
    } catch (err) {
      console.error('Erro ao carregar pacotes do cliente:', err)
      setToast({ message: 'Erro ao carregar pacotes do cliente', type: 'error' })
    }
  }

  const handleChangeRowsPerPage = (newRowsPerPage) => {
    setLinhasPorPagina(newRowsPerPage);
    setPaginaAtual(1);  // Reseta para a primeira página
  };

  const atualizarStats = (data) => {
    const hoje = new Date()
    const vencidos = data.vencidos
    const esgotados = data.esgotados
    const ativos = data.ativos
    const pendentes = data.pendentes
    setStats({ ativos, vencidos, esgotados, pendentes })
  }
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    carregar()
  }, [linhasPorPagina, paginaAtual, filtro])

  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltro((prev) => ({ ...prev, cliente: clienteBusca }));
    }, 500); // ⏱️ 500ms de atraso

    return () => clearTimeout(timer);
  }, [clienteBusca]);


  const handleAdd = () => {
    setSelected(null)
    setShowModal(true)
  }

  const handleEdit = (item) => {
    setSelected(item)
    setShowModal(true)
  }
  const handleDelete = (item) => {
    setSelected(item)
    setMensagem(`Deseja realmente excluir este pacote ${item.pacote?.nome} do cliente ${item.cliente?.nome} ?`);
    setConfirmDialog({ open: true, item })
  }
  const handleConfirmDelete = async () => {
    await deletePacoteCliente(selected.id)
    carregar()

  }

  const handleOpenUso = (item) => {
    setSelected(item)
    setShowUsoModal(true)
  }

  const handleRenovacao = (item) => {
    // Abre o diálogo de confirmação
    setMensagem(`Deseja renovar o pacote ${item.pacote?.nome} do cliente ${item.cliente?.nome} ?`);
    setRenovaPacote(item);
    setRenova(true);
    setConfirmDialog({ open: true });
  };

  const handleConfirmaRenovacao = () => {
    setShowModal(true);
    setSelected(renovaPacote);
    setConfirmDialog({ open: false, item: null });
  }
  const pacotesFiltrados = pacotes.filter(p => {
    const clienteBusca = filtro.cliente?.toLowerCase() || '';
    const pacoteBusca = filtro.pacote?.toLowerCase() || '';

    const clienteOk = !clienteBusca || p.cliente?.nome?.toLowerCase().includes(clienteBusca);
    const pacoteOk = !pacoteBusca || p.pacote?.nome?.toLowerCase().includes(pacoteBusca);
    const situacao =
      filtro.situacao === 'ativo'
        ? new Date(p.data_validade) >= new Date() && p.saldo_restante > 0
        : filtro.situacao === 'vencido'
          ? new Date(p.data_validade) < new Date()
          : filtro.situacao === 'esgotado'
            ? p.saldo_restante <= 0
            : true
    const dataInicioOk =
      !filtro.dataInicio || new Date(p.data_inicio) >= new Date(filtro.dataInicio)
    const dataFimOk =
      !filtro.dataFim || new Date(p.data_validade) <= new Date(filtro.dataFim)
    return (clienteOk || pacoteOk) && situacao && dataInicioOk && dataFimOk
  })

  // ✅ 3 - nova ação: lançar consumo diretamente
  const handleLancamento = (item) => {
    // Aqui você pode abrir um modal para registrar o uso direto (sem OS)
    if (!item || item.saldo_restante <= 0) {
      handleRenovacao(item);
    } else {
      setSelected(item)
      setShowLancamentoModal(true)
    }

  }

  return (
    <div className="p-0">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Pacotes de Clientes</h1>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Novo Pacote
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={clienteBusca}
          onChange={(e) => setClienteBusca(e.target.value)}
          className="border p-2 rounded col-span-2"
        />


        <input
          type="text"
          placeholder="Buscar pacote..."
          value={filtro.pacote}
          onChange={(e) => setFiltro({ ...filtro, pacote: e.target.value })}
          className="border p-2 rounded col-span-2"
        />

        <select
          value={filtro.situacao}
          onChange={(e) => setFiltro({ ...filtro, situacao: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">Todos</option>
          <option value="ativo">Ativo</option>
          <option value="vencido">Vencido</option>
          <option value="esgotado">Esgotado</option>
        </select>

        <div className="flex gap-2">
          <input
            type="date"
            value={filtro.dataInicio}
            onChange={(e) => setFiltro({ ...filtro, dataInicio: e.target.value })}
            className="border p-2 rounded w-full"
          />
          <input
            type="date"
            value={filtro.dataFim}
            onChange={(e) => setFiltro({ ...filtro, dataFim: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      {/* Indicadores */}
      <div className="flex gap-4 mb-3">
        <div className="bg-blue-100 border border-blue-300 rounded p-2 text-blue-800 text-sm">
          Pendentes: <strong>{stats.pendentes}</strong>
        </div>
        <div className="bg-green-100 border border-green-300 rounded p-2 text-green-800 text-sm">
          Ativos: <strong>{stats.ativos}</strong>
        </div>
        <div className="bg-red-100 border border-red-300 rounded p-2 text-red-800 text-sm">
          Vencidos: <strong>{stats.vencidos}</strong>
        </div>
        <div className="bg-yellow-100 border border-yellow-300 rounded p-2 text-yellow-800 text-sm">
          Esgotados: <strong>{stats.esgotados}</strong>
        </div>
      </div>

      {/* Tabela */}
      <div className="grid gap-2">
        {pacotesFiltrados.map((p) => {
          const vencido = new Date(p.data_validade) < new Date();
          const esgotado = p.saldo_restante <= 0;
          const proximo =
            !vencido &&
            (new Date(p.data_validade) - new Date()) / (1000 * 60 * 60 * 24) <= 5;

          let statusLabel = "Ativo";
          let statusColor = "bg-green-100 text-green-800";
          if (vencido) {
            statusLabel = "Vencido";
            statusColor = "bg-red-100 text-red-700";
          } else if (esgotado) {
            statusLabel = "Esgotado";
            statusColor = "bg-yellow-100 text-yellow-800";
          } else if (p.status === 'pendente') {
            statusLabel = "Pendente";
            statusColor = "bg-blue-100 text-blue-800";
          } else if (proximo) {
            statusLabel = "Vencendo";
            statusColor = "bg-orange-100 text-orange-800";
          }

          return (
            <div
              key={p.id}
              className="bg-white shadow rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-gray-50 transition"
            >
              <div className="flex flex-col sm:flex-row sm:gap-4 flex-1">
                <span className="font-semibold">{p.cliente?.nome || '-'}</span>
                <span>{p.pacote?.nome || '-'}</span>
                <span className="text-gray-600 text-sm">
                  Início: {p.data_compra ? new Date(p.data_compra).toLocaleDateString() : '-'}
                </span>
                <span className="text-gray-600 text-sm">
                  Validade: {p.data_validade ? new Date(p.data_validade).toLocaleDateString() : '-'}
                </span>
                <span className="text-center">
                  Usado: {p.total_usado} | Saldo: {p.saldo_restante}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>

              <div className="flex gap-2 mt-2 sm:mt-0">
                {p.total_usado === 0 && (
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-blue-500 hover:text-blue-700 px-2 py-1 rounded border"
                    title="Editar"
                  >
                    <i className="fas fa-edit" />
                  </button>
                )}
                <button
                  onClick={() => handleOpenUso(p)}
                  className="text-green-500 hover:text-green-700 px-2 py-1 rounded border"
                  title="Histórico de Uso"
                >
                  <i className="fas fa-clock" />
                </button>
                <button
                  onClick={() => handleLancamento(p)}
                  className="text-orange-500 hover:text-orange-700 px-2 py-1 rounded border"
                  disabled={p.status === 'pendente'}
                  title="Lançar Consumo"
                >
                  <i className="fas fa-plus-circle" />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-500 hover:text-red-700 px-2 py-1 rounded border"
                  title="Excluir"
                >
                  <i className="fas fa-trash" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginação */}
      <Pagination
        currentPage={paginaAtual}
        totalPages={totalPaginas}
        onPageChange={setPaginaAtual}
        onRowsChange={handleChangeRowsPerPage}  // Alterado para usar função personalizada
        rowsPerPage={linhasPorPagina}
        rowsPerPageOptions={[50, 100, 150]}
      />
      {/*Confirma Renovação*/}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        message={mensagem}
        onCancel={() => setConfirmDialog({ open: false, petId: null })}
        onConfirm={() => renova ? handleConfirmaRenovacao() : handleConfirmDelete()}
      />
      {/* Modais */}
      {showModal && (
        <PacoteClienteModal
          show={showModal}
          onClose={() => setShowModal(false)}
          pacoteEditando={selected}
          renovacao={renova}
          onSaved={() => {
            carregar();
            setToast({ message: 'Pacote salvo com sucesso!', type: 'success' });
          }}
        />
      )}
      {showLancamentoModal && (
        <LancamentoPacoteModal
          show={showLancamentoModal}
          onClose={() => setShowLancamentoModal(false)}
          pacoteCliente={selected}
          onSaved={carregar}
        />
      )}
      {showUsoModal && (
        <UsoPacoteModal
          show={showUsoModal}
          onClose={() => setShowUsoModal(false)}
          pacoteCliente={selected}
        />
      )}
      {toast.message && <Toast type={toast.type} message={toast.message} />}

    </div>
  )
}

export default PacotesClientesPage
