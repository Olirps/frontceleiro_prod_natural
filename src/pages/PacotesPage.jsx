import React, { useEffect, useState } from 'react'
import { getPacotes, deletePacote } from '../services/ApiPacotes/ApiPacotes'
import PacotesModal from '../components/PacotesModal'
import Toast from '../components/Toast';


const PacotesPage = () => {
  const [pacotes, setPacotes] = useState([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ message: '', type: '' })
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [filtroNome, setFiltroNome] = useState('')
  const [filtroAtivo, setFiltroAtivo] = useState('todos') // 'todos', 'ativo', 'inativo'


  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const carregarPacotes = async () => {
    try {
      setLoading(true)
      const data = await getPacotes()
      setPacotes(data)
    } catch (error) {
      console.error('Erro ao carregar pacotes', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (pacote) => {
    setEditando(pacote)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este pacote?')) {
      await deletePacote(id)
      carregarPacotes()
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditando(null)
  }

  useEffect(() => {
    carregarPacotes()
  }, [])

  // Filtra pacotes por nome e ativo
  const pacotesFiltrados = pacotes.filter(p => {
    const matchesNome = p.nome.toLowerCase().includes(filtroNome.toLowerCase())
    const matchesAtivo =
      filtroAtivo === 'todos'
        ? true
        : filtroAtivo === 'ativo'
          ? p.ativo
          : !p.ativo
    return matchesNome && matchesAtivo
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Pacotes</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Pacote
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Filtrar por nome"
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          className="border p-2 rounded flex-1"
        />
        <select
          value={filtroAtivo}
          onChange={(e) => setFiltroAtivo(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="todos">Todos</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : pacotesFiltrados.length === 0 ? (
        <p className="text-center text-gray-500 mt-4">Nenhum pacote encontrado.</p>
      ) : (
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">Descrição</th>
              <th className="p-2 text-left">Preço</th>
              <th className="p-2 text-left">Validade (dias)</th>
              <th className="p-2 text-left">Ativo</th>
              <th className="p-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pacotesFiltrados.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{p.nome}</td>
                <td className="p-2">{p.descricao}</td>
                <td className="p-2">R$ {parseFloat(p.preco_total).toFixed(2)}</td>
                <td className="p-2">{p.validade_dias || '-'}</td>
                <td className="p-2">{p.ativo ? 'Sim' : 'Não'}</td>
                <td className="p-2 flex justify-center gap-2">
                  {/* Botão Editar */}
                  <button
                    onClick={() => handleEdit(p)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536M9 11l6-6L9 11zm-3 8h12v-2H6v2z"
                      />
                    </svg>
                  </button>

                  {/* Botão Excluir */}
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Excluir"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22m-5-4H8m0 0V3h8v0z"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {toast.message && <Toast type={toast.type} message={toast.message} />}

      <PacotesModal
        show={showModal}
        onClose={handleModalClose}
        pacoteEditando={editando}
        onSaved={() => {
          carregarPacotes()
          setToast({ message: 'Pacote salvo com sucesso!', type: 'success' })
        }}
      />
    </div>
  )
}

export default PacotesPage
