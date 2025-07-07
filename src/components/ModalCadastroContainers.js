import React, { useState, useEffect } from 'react';
import { addContainer, updateContainer, getAllTiposContainers, getAllContainersStatus, getEmpresaById } from '../services/api';
import Toast from './Toast';

// Ícone padrão do Leaflet (import necessário para marker funcionar corretamente)
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { use } from 'react';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ModalCadastroContainers = ({ isOpen, edit, onClose, container, onContainerAdicionado }) => {
    const [codigoIdentificacao, setCodigoIdentificacao] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tipoId, setTipoId] = useState('');
    const [statusId, setStatusId] = useState('');
    const [dataAquisicao, setDataAquisicao] = useState('');
    const [localizacaoEmpresa, setLocalizacaoEmpresa] = useState('');
    const [localizacaoAtual, setLocalizacaoAtual] = useState('');
    const [Longitude, setLongetude] = useState('');
    const [Latitude, setLatitude] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [tipos, setTipos] = useState([]);
    const [containerStatus, setContainerStatus] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [desativa, setDesativa] = useState(false);




    useEffect(() => {
        if (isOpen) {
            carregarTiposContainer();
            carregarContainerStatus();
            carregarEmpresa();
        }
    }, [isOpen]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    useEffect(() => {
        if (edit && container) {
            setCodigoIdentificacao(container.codigo_identificacao || '');
            setDescricao(container.descricao || '');
            setTipoId(container.tipo_id || '');
            setDataAquisicao(container.data_aquisicao || '');
            setLocalizacaoAtual(container.localizacao_atual || '');
            setObservacoes(container.observacoes || '');
            setStatusId(container.status_id || '');
            // Define o valor de desativa de forma reativa
            if (container.status_id === 3 || container.status_id === 4) {
                setDesativa(true);
            } else {
                setDesativa(false);
            }
        }

    }, [edit, container]); // <-- ESSENCIAL!


    const carregarTiposContainer = async () => {
        try {
            const response = await getAllTiposContainers();
            setTipos(response.data);
        } catch (error) {
            console.error('Erro ao buscar tipos de container:', error);
            setToast({ message: 'Erro ao carregar tipos de container', type: 'error' });
        }
    };

    const carregarEmpresa = async () => {
        try {
            const Empresa = await getEmpresaById(1);
            setLocalizacaoEmpresa(Empresa.data.localizacao);
            const local = Empresa.data.localizacao.split(',');
            setLatitude(parseFloat(local[0].trim()));
            setLongetude(parseFloat(local[1].trim()));
            console.log('Localização da empresa:', parseFloat(local[0].trim()) + ' ' + parseFloat(local[1].trim()));
        } catch (error) {
            console.error('Erro ao buscar empresa:', error);
        }
    }

    const carregarContainerStatus = async () => {
        try {
            const response = await getAllContainersStatus();
            setContainerStatus(response.data);
        } catch (error) {
            console.error('Erro ao buscar tipos de container:', error);
            setToast({ message: 'Erro ao carregar tipos de container', type: 'error' });
        }
    };

    // Componente que atualiza a posição ao clicar no mapa
    const LocationMarker = ({ setLocalizacaoAtual }) => {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                setLocalizacaoAtual(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            },
        });
        return null;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (edit) {
            // Se for edição, atualiza o container
            const updatedContainer = {
                codigo_identificacao: codigoIdentificacao,
                descricao,
                tipo_id: tipoId,
                data_aquisicao: dataAquisicao || null,
                localizacao_atual: localizacaoAtual,
                observacoes,
                status_id: statusId
            };
            try {
                const { data } = await updateContainer(container.id, updatedContainer);
                const responseData = { data, edit: true };
                onContainerAdicionado(responseData);
                // limpar campos
                setCodigoIdentificacao('');
                setDescricao('');
                setTipoId('');
                setDataAquisicao('');
                setLocalizacaoAtual('');
                setObservacoes('');
                onClose();
            } catch (error) {
                console.error('Erro ao atualizar container:', error);
                const errorMessage = error.response?.data?.erro || 'Erro ao atualizar container';
                setToast({ message: errorMessage, type: 'error' });
            } finally {
                setLoading(false);
            }
            return;
        }
        const novoContainer = {
            codigo_identificacao: codigoIdentificacao,
            descricao,
            tipo_id: tipoId,
            data_aquisicao: dataAquisicao || null,
            localizacao_atual: localizacaoAtual,
            observacoes,
            status_id: statusId
        };

        try {
            const response = await addContainer(novoContainer);
            onContainerAdicionado(response);
            // limpar campos
            setCodigoIdentificacao('');
            setDescricao('');
            setTipoId('');
            setDataAquisicao('');
            setLocalizacaoAtual('');
            setObservacoes('');
            onClose();
        } catch (error) {
            console.error('Erro ao cadastrar container:', error);
            const errorMessage = error.response?.data?.erro || 'Erro ao cadastrar container';
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>Cadastrar Container</h2>

                <form onSubmit={handleSave} onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}>
                    <label>
                        Código de Identificação:
                        <input
                            type="text"
                            className="input-geral"
                            value={codigoIdentificacao}
                            onChange={(e) => setCodigoIdentificacao(e.target.value.toUpperCase())}
                            required
                        />
                    </label>

                    <label>
                        Descrição:
                        <textarea
                            className="input-geral"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />
                    </label>

                    <label>
                        Tipo de Container:
                        <select
                            className="input-geral"
                            value={tipoId}
                            onChange={(e) => setTipoId(e.target.value)}
                            required
                        >
                            <option value="">Selecione</option>
                            {tipos.map((tipo) => (
                                <option key={tipo.id} value={tipo.id}>
                                    {tipo.nome}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Data de Aquisição:
                        <input
                            type="date"
                            className="input-geral"
                            value={dataAquisicao}
                            onChange={(e) => setDataAquisicao(e.target.value)}
                        />
                    </label>

                    <label>
                        Localização Atual:
                        <input
                            type="text"
                            className="input-geral mb-2"
                            value={localizacaoAtual}
                            onChange={(e) => setLocalizacaoAtual(e.target.value)}
                            placeholder="Latitude, Longitude"
                            disabled={true}
                        />
                        <MapContainer
                            center={[
                                parseFloat(Latitude) || -27.790087,
                                parseFloat(Longitude) || -50.265184

                            ]} // Primavera do Leste - MT
                            zoom={13}
                            style={{ height: '300px', width: '100%' }}
                            className={edit && desativa ? 'pointer-events-none opacity-70' : ''} // Tailwind (opcional)

                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                            />
                            {localizacaoAtual && (
                                <Marker
                                    position={localizacaoAtual.split(',').map(coord => parseFloat(coord.trim()))}
                                />
                            )}
                            {!(edit && desativa) && (
                                <LocationMarker setLocalizacaoAtual={setLocalizacaoAtual} />
                            )}
                        </MapContainer>
                    </label>
                    <label>
                        Observações:
                        <textarea
                            className="input-geral"
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                        />
                    </label>

                    <label>
                        Status do Container:
                        <select
                            className="input-geral"
                            value={statusId}
                            onChange={(e) => setStatusId(e.target.value)}
                            disabled={desativa} // Desabilita o campo se for edição
                            required
                        >
                            <option value="">Selecione</option>
                            {containerStatus.map((status) => (
                                <option key={status.id} value={status.id}>
                                    {status.descricao}
                                </option>

                            ))}
                        </select>
                    </label>

                    <div id="button-group">
                        <button className="button" type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>

                {toast.message && <Toast type={toast.type} message={toast.message} />}
            </div>
        </div>
    );
};

export default ModalCadastroContainers;
