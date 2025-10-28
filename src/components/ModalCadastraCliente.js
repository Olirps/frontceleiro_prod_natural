import React, { useEffect, useState } from 'react';
import { cpfCnpjMask } from './utils';
import { formatarCEP, formatarCelular } from '../utils/functions';
import { getUfs, getMunicipiosUfId } from '../services/api';
import { addCliente, updateCliente } from '../services/ApiClientes/ApiClientes';
import { getEmpresaById } from '../services/api';
import { getPetByIdTutor, getPetById, deletePet } from '../services/ApiPets/ApiPets.js';
import PetModal from '../components/PetModal.jsx';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from './Toast';

const TABS = ['Dados Básicos', 'Dados Jurídicos', 'Contato', 'Endereço'];

const ModalCadastraCliente = ({ isOpen, onClose, onSubmit, cliente, edit }) => {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [isPetShop, setIsPetShop] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, petId: null });
    const [selectedPet, setSelectedPet] = useState(null);
    const [pets, setPets] = useState([]);
    const [form, setForm] = useState({
        nome: '',
        nomeFantasia: '',
        cpfCnpj: '',
        inscricao_estadual: '',
        email: '',
        celular: '',
        logradouro: '',
        numero: '',
        bairro: '',
        municipio: '',
        uf: '',
        cep: ''
    });

    const [ufs, setUfs] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [petsModalOpen, setPetsModalOpen] = useState(false);
    const [permiteEditar, setPermiteEditar] = useState(false);

    // Permissões
    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

    const buscaEmpresa = async () => {
        const empresa = await getEmpresaById(1);
        setIsPetShop(empresa.data?.isPetshop || false);
    };

    useEffect(() => {
        const fetchPets = async () => {
            if (cliente?.id && isPetShop) {
                const petsData = await getPetByIdTutor(cliente.id);
                setPets(petsData || []);
            }
        };

        // dispara apenas se isPetShop for true
        if (isPetShop) {
            fetchPets();
        }
    }, [cliente?.id, isPetShop]);


    useEffect(() => {
        const fetchOpening = async () => {
            if (isOpen && edit) {
                checkPermission('clientes', edit ? 'edit' : 'insert', () => setPermiteEditar(true));
                buscaEmpresa();
            } else {
                setPermiteEditar(true);
                buscaEmpresa();
            }
        };
        fetchOpening();
    }, [isOpen, edit, permissions]);

    // Aba ativa dependendo se é PetShop
    const tabsAtivas = isPetShop ? [...TABS, 'Pets'] : TABS;

    useEffect(() => {
        const fetchUfs = async () => {
            try {
                const ufsData = await getUfs();
                setUfs(ufsData.data || []);
                if (edit && cliente?.uf_id) {
                    const muns = await getMunicipiosUfId(cliente.uf_id);
                    setMunicipios(muns.data || []);
                }
            } catch (error) {
                setToast({ message: 'Erro ao buscar UFs', type: 'error' });
            }
        };
        fetchUfs();
    }, [cliente?.uf_id]);

    useEffect(() => {
        if (cliente) {
            setForm({
                nome: cliente.nome || '',
                nomeFantasia: cliente.nomeFantasia || '',
                cpfCnpj: cliente.cpfCnpj || '',
                inscricao_estadual: cliente.inscricao_estadual || '',
                email: cliente.email || '',
                celular: cliente.celular || '',
                logradouro: cliente.logradouro || '',
                numero: cliente.numero || '',
                bairro: cliente.bairro || '',
                municipio: cliente.municipio_id || '',
                uf: cliente.uf_id || '',
                cep: cliente.cep ? formatarCEP(cliente.cep) : ''
            });
        } else {
            setForm({
                nome: '',
                nomeFantasia: '',
                cpfCnpj: '',
                inscricao_estadual: '',
                email: '',
                celular: '',
                logradouro: '',
                numero: '',
                bairro: '',
                municipio: '',
                uf: '',
                cep: ''
            });
        }
    }, [cliente]);

    const handleUfChange = async (e) => {
        const selectedUf = e.target.value;
        setForm(prev => ({ ...prev, uf: selectedUf }));
        try {
            const municipiosData = await getMunicipiosUfId(selectedUf);
            setMunicipios(municipiosData.data || []);
        } catch {
            setToast({ message: 'Erro ao buscar municípios', type: 'error' });
            setMunicipios([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...form,
                celular: form.celular.replace(/\D/g, ''),
                cep: form.cep.replace(/\D/g, '')
            };

            const response = edit
                ? await updateCliente(cliente.id, payload)
                : await addCliente(payload);

            setToast({
                message: `Cliente ${response.data.nomeFantasia || response.data.nome} ${edit ? 'atualizado' : 'cadastrado'} com sucesso!`,
                type: 'success'
            });

            if (onSubmit) onSubmit({ cliente: response.data });

            setTimeout(() => {
                setLoading(false);
                onClose();
            }, 300);
        } catch (error) {
            const mensagemErro = error?.response?.data?.error || 'Erro ao salvar cliente.';
            setToast({ message: mensagemErro, type: 'error' });
            setLoading(false);
        }
    };

    const handleDeletePet = (petId) => {
        // Abre o diálogo de confirmação
        setConfirmDialog({ open: true, petId });
    };

    // Função que será chamada se o usuário confirmar a exclusão
    const confirmDeletePet = async () => {
        try {
            await deletePet(confirmDialog.petId); // chama a API para deletar
            setPets(prevPets => prevPets.filter(p => p.id !== confirmDialog.petId)); // atualiza lista
            setToast({ message: "Pet excluído com sucesso!", type: "success" });
        } catch (err) {
            console.error(err);
            setToast({ message: "Erro ao excluir pet.", type: "error" });
        } finally {
            setConfirmDialog({ open: false, petId: null }); // fecha o diálogo
        }
    };

    if (!isOpen) return null;

    const renderTabContent = () => {
        const input = "input input-bordered w-full";

        if (activeTab === 'Pets') {
            return (
                <div>
                    <button
                        type="button"
                        onClick={() => setPetsModalOpen(true)}
                        className="btn btn-secondary mb-4"
                    >
                        Cadastrar Pet
                    </button>

                    <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-left border border-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 border">Nome</th>
                                    <th className="p-2 border">Tipo</th>
                                    <th className="p-2 border">Raça</th>
                                    <th className="p-2 border">Peso</th>
                                    <th className="p-2 border">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pets?.length > 0 ? pets.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="p-2 border">{p.nome}</td>
                                        <td className="p-2 border">{p.tipo}</td>
                                        <td className="p-2 border">{p.raca}</td>
                                        <td className="p-2 border">{p.peso} kg</td>
                                        <td className="p-2 border flex gap-2">
                                            <button
                                                type='button'
                                                onClick={() => {
                                                    setSelectedPet(p);
                                                    setPetsModalOpen(true);
                                                }}
                                                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Visualizar
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() => handleDeletePet(p.id)}
                                                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-gray-400">
                                            Nenhum pet cadastrado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        switch (activeTab) {
            case 'Dados Básicos':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Nome</label>
                            <input
                                className={input}
                                type="text"
                                value={form.nome}
                                onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))}
                                disabled={!permiteEditar}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Nome Fantasia</label>
                            <input
                                className={input}
                                type="text"
                                value={form.nomeFantasia}
                                onChange={(e) => setForm(prev => ({ ...prev, nomeFantasia: e.target.value.toUpperCase() }))}
                                disabled={!permiteEditar}
                            />
                        </div>
                    </div>
                );

            case 'Dados Jurídicos':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">CPF/CNPJ</label>
                            <input
                                className={input}
                                type="text"
                                value={cpfCnpjMask(form.cpfCnpj)}
                                onChange={(e) => setForm(prev => ({ ...prev, cpfCnpj: cpfCnpjMask(e.target.value) }))}
                                disabled={!permiteEditar}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Inscrição Estadual</label>
                            <input
                                className={input}
                                type="text"
                                value={form.inscricao_estadual}
                                onChange={(e) => setForm(prev => ({ ...prev, inscricao_estadual: e.target.value }))}
                                disabled={!permiteEditar}
                            />
                        </div>
                    </div>
                );

            case 'Contato':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Email</label>
                            <input
                                className={input}
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value.toLowerCase() }))}
                                disabled={!permiteEditar}
                            />
                        </div>
                        <div>
                            <label className="label">Celular</label>
                            <input
                                className={input}
                                type="text"
                                value={formatarCelular(form.celular)}
                                onChange={(e) => setForm(prev => ({ ...prev, celular: e.target.value }))}
                                disabled={!permiteEditar}
                            />
                        </div>
                    </div>
                );

            case 'Endereço':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Logradouro</label>
                            <input
                                className={input}
                                type="text"
                                value={form.logradouro}
                                onChange={(e) => setForm(prev => ({ ...prev, logradouro: e.target.value.toUpperCase() }))}
                                disabled={!permiteEditar}
                            />
                        </div>
                        <div>
                            <label className="label">Número</label>
                            <input
                                className={input}
                                type="text"
                                value={form.numero}
                                onChange={(e) => setForm(prev => ({ ...prev, numero: e.target.value }))}
                                disabled={!permiteEditar}
                            />
                        </div>
                        <div>
                            <label className="label">Bairro</label>
                            <input
                                className={input}
                                type="text"
                                value={form.bairro}
                                onChange={(e) => setForm(prev => ({ ...prev, bairro: e.target.value.toUpperCase() }))}
                                disabled={!permiteEditar}
                            />
                        </div>
                        <div>
                            <label className="label">CEP</label>
                            <input
                                className={input}
                                type="text"
                                value={form.cep}
                                onChange={(e) => setForm(prev => ({ ...prev, cep: formatarCEP(e.target.value) }))}
                                disabled={!permiteEditar}
                            />
                        </div>
                        <div>
                            <label className="label">UF</label>
                            <select
                                className={input}
                                value={form.uf}
                                onChange={handleUfChange}
                                disabled={!permiteEditar}
                            >
                                <option value="">Selecione um estado</option>
                                {ufs.map((u) => (
                                    <option key={u.codIBGE} value={u.codIBGE}>{u.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Município</label>
                            <select
                                className={input}
                                value={form.municipio}
                                onChange={(e) => setForm(prev => ({ ...prev, municipio: e.target.value }))}
                                disabled={!permiteEditar}
                            >
                                <option value="">Selecione um município</option>
                                {municipios.map((m) => (
                                    <option key={m.id} value={m.id}>{m.nome}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );

            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {edit ? `Editar Cliente - ${form.nomeFantasia || form.nome}` : 'Cadastrar Cliente'}
                    </h2>
                    <button className="text-gray-500 hover:text-red-600" onClick={onClose}>✕</button>
                </div>

                {/* Abas */}
                <div className="flex border-b mb-6">
                    {tabsAtivas.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 px-4 font-semibold ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Conteúdo da aba */}
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 mb-6">{renderTabContent()}</div>

                    {permiteEditar && (
                        <div className="flex justify-end">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="loading loading-spinner"></span>
                                        Salvando...
                                    </>
                                ) : 'Salvar'}
                            </button>
                        </div>
                    )}
                </form>

                {/* Modal de Pet */}
                {petsModalOpen && (
                    <PetModal
                        clienteId={cliente?.id}
                        onClose={() => setPetsModalOpen(false)}
                        onSuccess={(novoPet) => {
                            // Aqui você atualiza a lista de pets no modal pai
                            setPets((prevPets) => [...prevPets, novoPet]);
                            setPetsModalOpen(false); // Fecha o modal após sucesso
                        }}
                    />
                )}


                <PermissionModalUI />
                <ConfirmDialog
                    isOpen={confirmDialog.open}
                    message="Tem certeza que deseja excluir o pet?"
                    onCancel={() => setConfirmDialog({ open: false, petId: null })}
                    onConfirm={confirmDeletePet}
                />

                {toast.message && (
                    <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: '' })} />
                )}
            </div>
        </div>
    );
};

export default ModalCadastraCliente;
