import { useState, useEffect, useMemo } from 'react';
import { useAvailableContainers } from '../hooks/useAvailableContainers';
import { useClientesBusca } from '../hooks/useClientesBusca';
import Toast from './Toast';
import { set, uniqBy } from 'lodash';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import {
    createMovimentacao,
    updateMovimentacao,
    getContratosLayout,
    getTipoContratosLayout,
    removerItemMovimentacao,
    efetivarMovimentacao
} from '../services/api';

export default function ModalContainerMovimentacao({ open, onClose, edit, data }) {
    const [formData, setFormData] = useState({
        cliente: '',
        containers: [],
        dataInicio: '',
        dataFim: '',
        tipoLancamento: 'locacao',
        tipoContrato: '',
        valor: '',
        localizacao: '' // <-- novo campo
    });
    const [coordenadas, setCoordenadas] = useState({
        lat: -15.531219,
        lng: -54.325987
    });

    const [toast, setToast] = useState({ message: '', type: '' });
    const [contrato, setContrato] = useState('');
    const [contratos, setContratos] = useState([]);
    const [codigoBusca, setCodigoBusca] = useState('');

    const { containersDisponiveis, loading, erro } = useAvailableContainers(codigoBusca);
    const [containersSelecionados, setContainersSelecionados] = useState([]);
    const [containersRetornados, setContainersRetornados] = useState([]);


    const containersParaExibir = useMemo(() => {
        return uniqBy([...containersDisponiveis, ...containersSelecionados], 'id');
    }, [containersDisponiveis, containersSelecionados]);

    const {
        clienteBusca,
        setClienteBusca,
        clientesFiltrados,
        clienteSelected,
        setClienteSelected,
        clienteId,
        setClienteId,
        clienteNome,
        setClienteNome,
        setClientesFiltrados,
        buscarClientes
    } = useClientesBusca(edit, setToast);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        if (erro) {
            setToast({ message: erro, type: 'error' });
        }
    }, [erro]);

    useEffect(() => {
        if (data?.containers?.length) {
            const ids = data.containers.map(c => c.container_id);
            setContainersRetornados(ids);
        }
    }, [data]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const contratosRes = await getContratosLayout();
                const TipocontratosRes = await getTipoContratosLayout();
                setContratos(TipocontratosRes.data || []);
            } catch (error) {
                console.error('Erro ao carregar dados do modal:', error);
            }
        };

        fetchData();

        if (data) {

            let localizacao = '';
            if (data.containers?.length > 0 && data.containers[0].container?.localizacao_atual) {
                localizacao = data.containers[0].container.localizacao_atual;
            }
            const locSplit = localizacao.split(',');
            const lat = parseFloat(locSplit[0]);
            const lng = parseFloat(locSplit[1]);

            setFormData({
                cliente: data.cliente_id || '',
                containers: data.containers.map(c => c.container_id) || [],
                dataInicio: data.data_inicio ? new Date(data.data_inicio).toISOString().slice(0, 10) : '',
                dataFim: data.data_fim ? new Date(data.data_fim).toISOString().slice(0, 10) : '',
                tipoLancamento: data.tipo_lancamento || 'locacao',
                tipoContrato: data.contratoTipo?.descricao || '',
                valor: Number(data.valor).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }) || '',
                localizacao: localizacao || '',
            });
            if (!isNaN(lat) && !isNaN(lng)) {
                setCoordenadas({ lat, lng });
            }

            setContrato(data.contrato_layout_id || '');
            setClienteId(data.cliente.id || '');
            setClienteNome(data.cliente.nome || data.cliente.nomeFantasia || '');
            setClienteBusca(data.cliente.nome || data.cliente.nomeFantasia || '');
            setClienteSelected(true);
            setClientesFiltrados([]);
            setContainersSelecionados(
                data.containers.map(c => ({
                    id: c.container_id,
                    codigo_identificacao: c.container?.codigo_identificacao || '',
                    status_id: c.container?.status_id || '',
                    ...c.container
                }))
            );
        }
        else {
            setFormData({
                cliente: '',
                containers: [],
                dataInicio: '',
                dataFim: '',
                tipoLancamento: 'locacao',
                tipoContrato: '',
                valor: ''
            });

            setClienteId('');
            setClienteNome('');
            setClienteBusca('');
            setClienteSelected(false);
            setClientesFiltrados([]);
            setContainersSelecionados([]);
            setCodigoBusca('');
            setContrato('');
        }
    }, [data, open]);

    useEffect(() => {
        if (!clienteSelected) {
            buscarClientes(clienteBusca);
            return () => buscarClientes.cancel?.();
        }
        setClienteSelected(false);
    }, [clienteBusca]);

    // Componente que atualiza a posição ao clicar no mapa
    function LocationMarker({ setFormData, setCoordenadas }) {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                const local = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                setFormData(prev => ({ ...prev, localizacao: local }));
                setCoordenadas({ lat, lng });
            }
        });
        return null;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContainerSelect = (containerId) => {
        const isSelecionado = formData.containers.includes(containerId);

        setFormData(prev => ({
            ...prev,
            containers: isSelecionado
                ? prev.containers.filter(id => id !== containerId)
                : [...prev.containers, containerId]
        }));

        // Atualizar dados completos dos containers selecionados
        if (!isSelecionado) {
            const containerCompleto = containersDisponiveis.find(c => c.id === containerId);
            if (containerCompleto) {
                setContainersSelecionados(prev =>
                    uniqBy([...prev, containerCompleto], 'id')
                );
            }
        } else {
            setContainersSelecionados(prev =>
                prev.filter(c => c.id !== containerId)
            );
        }
    };

    const handleContainerRemove = async (containerItemId) => {
        const veioDoBackend = containersRetornados.includes(containerItemId);

        try {
            if (veioDoBackend) {
                await removerItemMovimentacao(data.id, containerItemId);
                // Remove da lista auxiliar
                setContainersRetornados(prev => prev.filter(id => id !== containerItemId));
            }

            setFormData(prev => ({
                ...prev,
                containers: prev.containers.filter(id => id !== containerItemId)
            }));

            setContainersSelecionados(prev =>
                prev.filter(c => c.id !== containerItemId)
            );

            setToast({
                message: veioDoBackend
                    ? 'Container removido com sucesso.'
                    : 'Container removido localmente.',
                type: 'success'
            });
        } catch (error) {
            console.error('Erro ao remover item do container:', error);
            setToast({ message: 'Erro ao remover container.', type: 'error' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dadosParaEnviar = {
            cliente_id: clienteId,
            containers: formData.containers,
            data_inicio: formData.dataInicio,
            data_fim: formData.dataFim,
            tipo_lancamento: formData.tipoLancamento,
            contrato_layout_id: contrato,
            valor: parseFloat(formData.valor.replace(/\D/g, '')) / 100,
            coordenadas: formData.localizacao,
        };

        try {
            if (edit && data?.id) {
                await updateMovimentacao(data.id, dadosParaEnviar);
                setToast({ message: 'Movimentação atualizada com sucesso!', type: 'success' });
            } else {
                await createMovimentacao(dadosParaEnviar);
                setToast({ message: 'Movimentação criada com sucesso!', type: 'success' });
            }
            onClose(); // só fecha aqui, após sucesso
        } catch (error) {
            console.error('Erro ao salvar movimentação:', error);

            // Se o erro for uma resposta da API com JSON, tente extrair a mensagem
            let mensagemErro = 'Erro ao salvar movimentação.';
            if (error.response && error.response.data && error.response.data.error) {
                mensagemErro = error.response.data.error;
            } else if (typeof error === 'string') {
                mensagemErro = error;
            } else if (error.message) {
                mensagemErro = !edit ? error.message.error : error.message;
            }

            setToast({ message: mensagemErro, type: 'error' });
            // modal fica aberto
        }

    };

    const handleEfetivar = async () => {
        if (!data?.id) return;

        const dadosAtualizados = {
            cliente_id: clienteId,
            containers: formData.containers,
            data_inicio: formData.dataInicio,
            data_fim: formData.dataFim,
            tipo_lancamento: formData.tipoLancamento,
            contrato_layout_id: contrato,
            valor: parseFloat(formData.valor.replace(/\D/g, '')) / 100,
            coordenadas: formData.localizacao,
        };

        try {
            await efetivarMovimentacao(data.id, dadosAtualizados);
            setToast({ message: 'Movimentação efetivada com sucesso!', type: 'success' });
            onClose();
        } catch (error) {
            console.error('Erro ao efetivar movimentação:', error);

            let mensagemErro = 'Erro ao efetivar movimentação.';
            if (error.response?.data?.error) {
                mensagemErro = error.response.data.error;
            }

            setToast({ message: mensagemErro, type: 'error' });
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">
                            {data ? 'Editar Movimentação' : 'Nova Movimentação'}
                        </h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Cliente */}
                        <div className="mb-4 relative">
                            <label className="block text-sm font-medium">Cliente</label>
                            <input
                                type="text"
                                value={clienteBusca}
                                onChange={e => setClienteBusca(e.target.value)}
                                placeholder="Nome ou CPF/CNPJ"
                                disabled={edit}
                                className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                            />

                            {clientesFiltrados.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-200 max-h-48 overflow-y-auto shadow-lg mt-1 rounded">
                                    {clientesFiltrados.map(cliente => (
                                        <li
                                            key={cliente.id}
                                            onClick={() => {
                                                setClienteSelected(true);
                                                setClienteId(cliente.id);
                                                setClienteNome(cliente.nome);
                                                setClienteBusca(cliente.nome);
                                                setClientesFiltrados([]);
                                            }}
                                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                        >
                                            {cliente.nome} - {cliente.cpfCnpj}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {clienteId && !edit && (
                            <button
                                type="button"
                                className="mb-4 bg-red-500 text-white px-4 py-2 rounded"
                                onClick={() => {
                                    setClienteSelected(false);
                                    setClienteId('');
                                    setClienteNome('');
                                    setClienteBusca('');
                                    setClientesFiltrados([]);
                                }}
                            >
                                Remover Cliente
                            </button>
                        )}

                        {/* Containers */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-3">Containers Disponíveis</h3>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Buscar Container (Código)</label>
                                <input
                                    type="text"
                                    value={codigoBusca}
                                    onChange={e => setCodigoBusca(e.target.value)}
                                    placeholder="Digite parte do código"
                                    className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-72 overflow-y-auto p-1">
                                {containersParaExibir.length === 0 ? (
                                    <div className="col-span-full text-center text-gray-500">
                                        Nenhum container disponível encontrado.
                                    </div>
                                ) : (
                                    containersParaExibir.map(container => (
                                        <div
                                            key={container.id}
                                            className={`relative pt-5 p-4 border-2 rounded-md shadow-md font-mono tracking-wider transition duration-150 text-sm
                                                        ${formData.containers.includes(container.id)
                                                    ? 'border-blue-600 bg-gradient-to-br from-blue-100 to-blue-50 ring-2 ring-blue-400'
                                                    : 'border-gray-300 bg-gray-100 hover:border-blue-400 hover:shadow-lg'
                                                }`}
                                        >
                                            {/* BOTÃO "X" */}
                                            {edit && formData.containers.includes(container.id) && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleContainerRemove(container.id)}
                                                    className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-sm font-bold"
                                                    title="Remover container"
                                                >
                                                    ✕
                                                </button>
                                            )}

                                            <div
                                                onClick={() => {
                                                    const isSelecionado = formData.containers.includes(container.id);
                                                    if (isSelecionado) {
                                                        handleContainerRemove(container.id);
                                                    } else {
                                                        handleContainerSelect(container.id);
                                                    }
                                                }}
                                                className="cursor-pointer"
                                            >

                                                <div className="absolute top-0 left-4 -translate-y-1/2 bg-white px-2 text-xs font-bold text-gray-700 border border-gray-300 rounded"
                                                    onClick={edit ? () => handleContainerRemove(container.id) : undefined}
                                                >
                                                    CONTAINER

                                                </div>

                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-blue-900 font-semibold text-base">
                                                        {container.codigo_identificacao}
                                                    </span>
                                                    <span className="text-gray-500 text-xs">ID: {container.id}</span>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-700">Status:</span>
                                                    <span className="text-gray-800 font-semibold">
                                                        {container.status_id || 'Desconhecido'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Datas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                                <input
                                    type="date"
                                    name="dataInicio"
                                    value={formData.dataInicio}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim (Opcional)</label>
                                <input
                                    type="date"
                                    name="dataFim"
                                    value={formData.dataFim}
                                    onChange={handleChange}
                                    className="w-full p-2 border border-gray-300 rounded"
                                />
                            </div>
                        </div>

                        {/* Tipo de Lançamento */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Lançamento</label>
                            <select
                                name="tipoLancamento"
                                value={formData.tipoLancamento}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded"
                            >
                                <option value="locacao">Locação</option>
                                <option value="venda">Venda</option>
                                <option value="manutencao">Manutenção</option>
                            </select>
                        </div>

                        {/* Tipo de Contrato */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                            <select
                                name="tipoContrato"
                                value={contrato}
                                onChange={(e) => setContrato(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded"
                                required
                            >
                                <option value="">Selecione o tipo de contrato</option>
                                {contratos.map(contrato => (
                                    <option key={contrato.id} value={contrato.id}>
                                        {contrato.descricao}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {/* Valor do Lançamento */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Lançamento (R$)</label>
                            <input
                                type="text"
                                name="valor"
                                value={formData.valor}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, ''); // apenas dígitos
                                    const centavos = parseFloat(rawValue) / 100;

                                    const formatted = centavos.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    });

                                    setFormData(prev => ({
                                        ...prev,
                                        valor: formatted
                                    }));
                                }}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                        {/* Localização com Mapa */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Localização do Container</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                                value={formData.localizacao}
                                onChange={(e) => setFormData(prev => ({ ...prev, localizacao: e.target.value }))}
                                placeholder="Latitude, Longitude"
                                required
                                readOnly
                            />

                            <MapContainer
                                center={coordenadas}
                                zoom={13}
                                style={{ height: '300px', width: '100%' }}
                                className="rounded overflow-hidden border border-gray-300"
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; OpenStreetMap contributors'
                                />

                                {formData.localizacao && (
                                    <Marker
                                        position={formData.localizacao.split(',').map(coord => parseFloat(coord.trim()))}
                                    />
                                )}

                                <LocationMarker
                                    setFormData={setFormData}
                                    setCoordenadas={setCoordenadas}
                                />
                            </MapContainer>

                            <p className="text-xs text-gray-600 mt-2">
                                Clique no mapa para definir a localização. Valor: {formData.localizacao || 'não definido'}
                            </p>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Salvar Movimentação
                            </button>
                            {edit && data?.id && (
                                <button
                                    type="button"
                                    onClick={handleEfetivar}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Efetivar
                                </button>
                            )}
                        </div>

                    </form>
                </div>
                {toast.message && <Toast message={toast.message} type={toast.type} />}
            </div>
        </div>
    );
}
