import React, { useEffect, useState } from 'react'
import { getUsoPacoteById } from '../services/ApiUsoPacote/ApiUsoPacote'
import { registrarUsoPacote } from '../services/ApiUsoPacote/ApiUsoPacote'
import { getPetByIdTutor } from '../services/ApiPets/ApiPets'

const LancamentoPacoteModal = ({ show, onClose, pacoteCliente, onSaved }) => {
  const [itens, setItens] = useState([])
  const [pets, setPets] = useState([])
  const [form, setForm] = useState({
    servico_id: '',
    pet_id: '',
    data_uso: new Date().toISOString().substring(0, 10),
    quantidade_utilizada: 1,
    observacao: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!show || !pacoteCliente) return
    carregarDados()
  }, [show, pacoteCliente])

  const carregarDados = async () => {
    try {
      // busca os saldos do pacote
      const data = await getUsoPacoteById(pacoteCliente.id)
      setItens(data.filter(i => i.saldo_restante > 0))

      // busca os pets do cliente
      const petsData = await getPetByIdTutor(pacoteCliente.cliente_id)
      setPets(petsData)
    } catch (err) {
      console.error('Erro ao carregar dados do lançamento:', err)
    }
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSalvar = async () => {
    if (!form.servico_id) {
      alert('Selecione o serviço/produto utilizado.')
      return
    }
    setLoading(true)
    try {
      await registrarUsoPacote({
        ...form,
        pacote_cliente_id: pacoteCliente.id
      })
      onSaved?.()
      onClose()
    } catch (err) {
      console.error('Erro ao registrar uso do pacote:', err)
      alert('Erro ao registrar uso.')
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-2xl w-full max-w-md sm:max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 sm:px-8 sm:py-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Lançar Uso - {pacoteCliente?.pacote?.nome}
          </h2>

          <div className="flex flex-col gap-4">
            {/* Serviço / Produto */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Serviço/Produto</label>
              <select
                value={form.servico_id}
                onChange={e => handleChange('servico_id', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              >
                <option value="">Selecione...</option>
                {itens.map(item => (
                  <option key={item.servico_id} value={item.servico_id}>
                    {item.xProd} — saldo: {item.saldo_restante}
                  </option>
                ))}
              </select>
            </div>

            {/* Pet */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Pet</label>
              <select
                value={form.pet_id}
                onChange={e => handleChange('pet_id', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              >
                <option value="">Selecione...</option>
                {pets.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            {/* Data e Quantidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Data de Uso</label>
                <input
                  type="date"
                  value={form.data_uso}
                  onChange={e => handleChange('data_uso', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 w-full"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={form.quantidade_utilizada}
                  onChange={e => handleChange('quantidade_utilizada', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 w-full"
                />
              </div>
            </div>

            {/* Observação */}
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Observação</label>
              <textarea
                value={form.observacao}
                onChange={e => handleChange('observacao', e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 w-full"
                rows="2"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

  )
}

export default LancamentoPacoteModal
