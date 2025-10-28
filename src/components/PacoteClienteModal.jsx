import React, { useEffect, useState } from 'react';
import { addPacoteCliente, updatePacoteCliente } from '../services/ApiPacoteCliente/ApiPacoteCliente';
import { getPacotes } from '../services/ApiPacotes/ApiPacotes';
import { useClientesBusca } from '../hooks/useClientesBusca';
import Toast from '../components/Toast';



const PacoteClienteModal = ({ show, onClose, pacoteEditando, renovacao, onSaved }) => {
    const [toast, setToast] = useState({ message: '', type: '' })
    const [pacotesSelecionados, setPacotesSelecionados] = useState([]);

    const [formData, setFormData] = useState({
        cliente_id: '',
        pacote_id: '',
        data_inicio: '',
        observacao: ''
    });

    const [pacotes, setPacotes] = useState([]);

    // 🧩 Hook personalizado de busca de clientes
    const {
        clienteBusca,
        setClienteBusca,
        clientesFiltrados,
        setClientesFiltrados,
        setClienteSelected,
        setClienteId,
        setClienteNome,
    } = useClientesBusca(!!pacoteEditando, setToast);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);


    useEffect(() => {
        if (!show) return;
        carregarPacotes();

        if (pacoteEditando) {
            setFormData({
                cliente_id: pacoteEditando.cliente_id || '',
                pacote_id: pacoteEditando.pacote_id || '',
                data_inicio: pacoteEditando.data_inicio || '',
                observacao: pacoteEditando.observacao || ''
            });

            // 🧩 Preenche o campo de cliente no hook
            setClienteBusca(pacoteEditando.cliente?.nome || '');
            setClienteId(pacoteEditando.cliente_id);
            setClienteNome(pacoteEditando.cliente?.nome || '');
        } else {
            setFormData({ cliente_id: '', pacote_id: '', data_inicio: '', observacao: '' });
            setClienteBusca('');
        }
    }, [show, pacoteEditando]);

    const carregarPacotes = async () => {
        try {
            const pacotesData = await getPacotes();
            setPacotes(pacotesData.data || pacotesData || []);
        } catch (err) {
            console.error('Erro ao carregar pacotes:', err);
        }
    };

    const adicionarPacote = () => {
        setPacotesSelecionados([
            ...pacotesSelecionados,
            { pacote_id: '', data_inicio: '', observacao: '' },
        ]);
    };
    const removerPacote = (index) => {
        setPacotesSelecionados(pacotesSelecionados.filter((_, i) => i !== index));
    };

    const atualizarPacote = (index, campo, valor) => {
        const novo = [...pacotesSelecionados];
        novo[index][campo] = valor;
        setPacotesSelecionados(novo);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.cliente_id) {
                setToast({ message: 'Selecione um cliente.', type: 'warning' });
                return;
            }
            if (pacoteEditando && !renovacao) {
                await updatePacoteCliente(pacoteEditando.id, formData);
            } else {
                formData.pacotes = pacotesSelecionados;
                await addPacoteCliente(formData);

                //   await addPacoteCliente(formData);
            }
            onSaved();
            onClose();
        } catch (error) {
            console.error(error);
            setToast({ message: `Erro ao salvar pacote: ${error.response.data.error}`, type: 'error' });
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 sm:p-6">
            <div className="bg-white rounded-2xl w-full max-w-md sm:max-w-lg shadow-xl overflow-hidden">
                <div className="px-6 py-4 sm:px-8 sm:py-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        {pacoteEditando ? renovacao ? 'Renovar' : 'Editar' : 'Novo'} Pacote do Cliente
                    </h2>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* 🔎 Busca de Cliente */}
                        <div className="relative">
                            <input
                                type="text"
                                value={clienteBusca}
                                onChange={(e) => {
                                    setClienteBusca(e.target.value);
                                    setClienteSelected(false);
                                }}
                                placeholder="Buscar cliente..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            />
                            {clientesFiltrados.length > 0 && (
                                <ul className="absolute z-20 w-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                                    {clientesFiltrados.map((c) => (
                                        <li
                                            key={c.id}
                                            onClick={() => {
                                                setClienteId(c.id);
                                                setClienteNome(c.nome);
                                                setClienteBusca(c.nome);
                                                setClienteSelected(true);
                                                setFormData({ ...formData, cliente_id: c.id });
                                                setClientesFiltrados([]);
                                            }}
                                            className="px-3 py-2 cursor-pointer hover:bg-blue-100 transition"
                                        >
                                            {c.nome}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {pacotesSelecionados.map((p, index) => (
                            <div key={index} className="border rounded-lg p-3 mb-3 bg-gray-50 relative">
                                <select
                                    value={p.pacote_id}
                                    onChange={(e) => atualizarPacote(index, 'pacote_id', e.target.value)}
                                    className="border p-2 rounded w-full mb-2"
                                    required
                                >
                                    <option value="">Selecione o Pacote</option>
                                    {pacotes.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.nome} — R$ {parseFloat(opt.preco_total).toFixed(2)}
                                        </option>
                                    ))}
                                </select>

                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        value={p.data_inicio}
                                        onChange={(e) => atualizarPacote(index, 'data_inicio', e.target.value)}
                                        className="border p-2 rounded w-full"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Observação"
                                        value={p.observacao}
                                        onChange={(e) => atualizarPacote(index, 'observacao', e.target.value)}
                                        className="border p-2 rounded w-full"
                                    />
                                </div>

                                {pacotesSelecionados.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removerPacote(index)}
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                    >
                                        <i className="fas fa-trash" />
                                    </button>
                                )}
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={adicionarPacote}
                            className="w-full py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        >
                            + Adicionar outro pacote
                        </button>

                        {/* Data de Início */}
                        <input
                            type="date"
                            name="data_inicio"
                            value={formData.data_inicio}
                            onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            required
                        />

                        {/* Observações */}
                        <textarea
                            name="observacao"
                            value={formData.observacao}
                            onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                            placeholder="Observações"
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        />

                        {/* Botões */}
                        <div className="flex justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                            >
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>

                {toast.message && <Toast type={toast.type} message={toast.message} />}
            </div>
        </div>

    );
};

export default PacoteClienteModal;
