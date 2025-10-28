import React, { useState, useEffect, useRef } from 'react'
import { addPacote, updatePacote } from '../services/ApiPacotes/ApiPacotes'
import { getProdutos } from '../services/ApiProdutos/ApiProdutos'
import Toast from '../components/Toast';
import PropTypes from 'prop-types'

const PacotesModal = ({ show, onClose, pacoteEditando, onSaved }) => {
    const [aba, setAba] = useState('detalhes')
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        preco_total: '',
        validade_dias: '',
        ativo: true,
        servicos: [], // array de objetos {id, nome, preco_venda, quantidade}
    })

    const [produtosDisponiveis, setProdutosDisponiveis] = useState([])
    const [page, setPage] = useState(1)
    const [loadingMais, setLoadingMais] = useState(false)
    const containerRef = useRef(null)
    const [toast, setToast] = useState({ message: '', type: '' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Inicializa o modal
    useEffect(() => {
        if (!show) return

        if (pacoteEditando) {
            const servicosSelecionados = pacoteEditando.itens.map(item => ({
                id: item.servico.id,
                nome: item.servico.xProd,
                preco_venda: parseFloat(item.servico.Precos?.[0]?.preco_venda || 0),
                quantidade: item.quantidade || 1,
            }))

            setFormData({
                id: pacoteEditando.id,
                nome: pacoteEditando.nome || '',
                descricao: pacoteEditando.descricao || '',
                preco_total: pacoteEditando.preco_total || '',
                validade_dias: pacoteEditando.validade_dias || '',
                ativo: pacoteEditando.ativo ?? true,
                servicos: servicosSelecionados,
            })

            // Zera a lista de produtos disponíveis para recarregar depois
            setProdutosDisponiveis([])
            setPage(1)
        } else {
            setFormData({
                nome: '',
                descricao: '',
                preco_total: '',
                validade_dias: '',
                ativo: true,
                servicos: [],
            })
            setProdutosDisponiveis([])
            setPage(1)
        }

    }, [show, pacoteEditando])

    // Carrega produtos (scroll infinito)
    const carregarProdutos = async (pagina = 1) => {
        if (loadingMais) return
        setLoadingMais(true)
        try {
            const response = await getProdutos({ page: pagina })
            const novos = response.data.map(prod => {
                const preco =
                    prod.Precos.length > 0 ? prod.Precos[prod.Precos.length - 1].preco_venda : 0
                return {
                    id: prod.id,
                    nome: prod.xProd,
                    preco_venda: parseFloat(preco),
                }
            })
            // Remove produtos que já estão selecionados
            const filtrados = novos.filter(
                np => !formData.servicos.some(s => s.id === np.id)
            )
            setProdutosDisponiveis(prev => [...prev, ...filtrados])
            setPage(pagina + 1)
        } catch (error) {
            console.error('Erro ao carregar produtos:', error.response.data.error)
        } finally {
            setLoadingMais(false)
        }
    }

    // Evento de scroll para carregar mais produtos
    const handleScroll = e => {
        const bottom =
            e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 20
        if (bottom) carregarProdutos(page)
    }

    const handleInputChange = e => {
        const { name, value, type, checked } = e.target
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value })
    }

    const adicionarProduto = prod => {
        setFormData(prev => ({
            ...prev,
            servicos: [...prev.servicos, { ...prod, quantidade: 1 }],
        }))
        setProdutosDisponiveis(prev => prev.filter(p => p.id !== prod.id))
    }

    const removerProduto = prod => {
        setFormData(prev => ({
            ...prev,
            servicos: prev.servicos.filter(p => p.id !== prod.id),
        }))
        setProdutosDisponiveis(prev => [...prev, prod])
    }

    const handleAbrirAbaServicos = () => {
        setAba('servicos')
        if (produtosDisponiveis.length === 0) {
            carregarProdutos(1)
        }
    }

    const handleSubmit = async e => {
        e.preventDefault()
        try {
            setLoading(true)
            if (pacoteEditando) {
                await updatePacote(pacoteEditando.id, formData)
            } else {
                await addPacote(formData)
            }
            onSaved()
            onClose()

            setToast({ message: 'Pacote salvo com sucesso!', type: 'success' })
        } catch (error) {
            console.error('Erro ao salvar pacote:', error)
            console.error('Erro ao salvar pacote:', error.response.data.error)

            setToast({ message: `Erro ao salvar pacote: ${error.response.data.error}`, type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    if (!show) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="relative bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                {/* Botão X para fechar */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold"
                >
                    ×
                </button>
                <h2 className="text-xl font-semibold mb-4">
                    {pacoteEditando ? 'Editar Pacote' : 'Novo Pacote'}
                </h2>

                {/* Abas */}
                <div className="flex mb-4 border-b gap-2">
                    <button
                        className={`px-4 py-2 ${aba === 'detalhes' ? 'border-b-2 border-blue-600 font-semibold' : ''
                            }`}
                        onClick={() => setAba('detalhes')}
                    >
                        Detalhes
                    </button>
                    <button
                        className={`px-4 py-2 ${aba === 'servicos' ? 'border-b-2 border-blue-600 font-semibold' : ''
                            }`}
                        onClick={handleAbrirAbaServicos}
                    >
                        Serviços
                    </button>
                    <button
                        className={`px-4 py-2 ${aba === 'quantidade' ? 'border-b-2 border-blue-600 font-semibold' : ''
                            }`}
                        onClick={() => setAba('quantidade')}
                    >
                        Quantidade
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* ABA DETALHES */}
                    {aba === 'detalhes' && (
                        <>
                            <input
                                type="text"
                                name="nome"
                                placeholder="Nome do pacote"
                                value={formData.nome}
                                onChange={handleInputChange}
                                className="border p-2 rounded"
                                required
                            />
                            <textarea
                                name="descricao"
                                placeholder="Descrição"
                                value={formData.descricao}
                                onChange={handleInputChange}
                                className="border p-2 rounded"
                            />
                            <input
                                type="number"
                                name="preco_total"
                                placeholder="Preço total"
                                value={formData.preco_total}
                                onChange={handleInputChange}
                                className="border p-2 rounded"
                                required
                            />
                            <input
                                type="number"
                                name="validade_dias"
                                placeholder="Validade em dias"
                                value={formData.validade_dias}
                                onChange={handleInputChange}
                                className="border p-2 rounded"
                            />
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="ativo"
                                    checked={formData.ativo}
                                    onChange={handleInputChange}
                                />
                                Ativo
                            </label>
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={handleAbrirAbaServicos}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Próximo
                                </button>
                            </div>
                        </>
                    )}

                    {/* ABA SERVIÇOS */}
                    {aba === 'servicos' && (
                        <div className="flex gap-4">
                            {/* Disponíveis */}
                            <div
                                className="flex-1 border p-2 rounded max-h-64 overflow-y-auto"
                                onScroll={handleScroll}
                                ref={containerRef}
                            >
                                <h3 className="font-semibold mb-2">Disponíveis</h3>
                                {produtosDisponiveis.map(prod => (
                                    <div key={prod.id} className="flex justify-between items-center mb-1">
                                        <span>
                                            {prod.nome} - R$ {prod.preco_venda.toFixed(2)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => adicionarProduto(prod)}
                                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            ➤
                                        </button>
                                    </div>
                                ))}
                                {loadingMais && <p className="text-center py-2">Carregando...</p>}
                                {produtosDisponiveis.length === 0 && !loadingMais && (
                                    <p className="text-center text-gray-500">Nenhum produto disponível</p>
                                )}
                            </div>

                            {/* Selecionados */}
                            <div className="flex-1 border p-2 rounded max-h-64 overflow-y-auto">
                                <h3 className="font-semibold mb-2">Selecionados</h3>
                                {formData.servicos.map(prod => (
                                    <div key={prod.id} className="flex justify-between items-center mb-1">
                                        <span>
                                            {prod.nome} - R$ {prod.preco_venda.toFixed(2)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removerProduto(prod)}
                                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                        >
                                            ←
                                        </button>
                                    </div>
                                ))}
                                {formData.servicos.length === 0 && (
                                    <p className="text-center text-gray-500">Nenhum produto selecionado</p>
                                )}
                            </div>
                            <div className="flex flex-col justify-between gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setAba('detalhes')}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    Voltar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAba('quantidade')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    disabled={formData.servicos.length === 0}
                                >
                                    Próximo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ABA QUANTIDADE */}
                    {aba === 'quantidade' && (
                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto border p-2 rounded">
                            {formData.servicos.length === 0 ? (
                                <p className="text-center text-gray-500">Nenhum produto selecionado</p>
                            ) : (
                                formData.servicos.map((prod, idx) => (
                                    <div key={prod.id} className="flex justify-between items-center gap-2">
                                        <span>{prod.nome} - R$ {prod.preco_venda.toFixed(2)}</span>
                                        <input
                                            type="number"
                                            min={1}
                                            value={prod.quantidade || 1}
                                            onChange={(e) => {
                                                const quantidade = parseInt(e.target.value) || 1
                                                setFormData(prev => {
                                                    const novos = [...prev.servicos]
                                                    novos[idx] = { ...novos[idx], quantidade }
                                                    return { ...prev, servicos: novos }
                                                })
                                            }}
                                            className="w-20 border p-1 rounded"
                                        />
                                    </div>
                                ))
                            )}
                            <div className="flex justify-between gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setAba('servicos')}
                                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    Voltar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    disabled={loading}
                                >
                                    {loading ? 'Salvando...' : 'Salvar Pacote'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
            {toast.message && <Toast type={toast.type} message={toast.message} />}
        </div>
    )
}

PacotesModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    pacoteEditando: PropTypes.object,
    onSaved: PropTypes.func.isRequired,
}

export default PacotesModal
