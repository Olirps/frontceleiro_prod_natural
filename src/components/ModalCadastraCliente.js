import React, { useEffect, useState } from 'react';
import { cpfCnpjMask } from './utils';
import { formatarCEP, formatarCelular } from '../utils/functions';
import { getUfs, getMunicipiosUfId } from '../services/api';
import { addCliente, updateCliente } from '../services/ApiClientes/ApiClientes';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission';
import Toast from './Toast';

const TABS = ['Dados Básicos', 'Dados Jurídicos', 'Contato', 'Endereço'];

const ModalCadastraCliente = ({ isOpen, onClose, onSubmit, cliente, edit }) => {
    const [activeTab, setActiveTab] = useState(TABS[0]);
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
    const [permiteEditar, setPermiteEditar] = useState(true);
    const { permissions } = useAuth();

    useEffect(() => {
        if (isOpen && edit) {
            setPermiteEditar(hasPermission(permissions, 'clientes', edit ? 'edit' : 'insert'));
        }
    }, [isOpen, edit, permissions]);

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

            if (onSubmit) {
                onSubmit({ cliente: response.data }); // callback para página, se quiser usar
            }

            setTimeout(() => {
                setLoading(false);
                onClose(); // só fecha depois de salvar e exibir o toast
            }, 300);
        } catch (error) {
            setToast({
                message: 'Erro ao salvar cliente.',
                type: 'error'
            });
            setLoading(false);
        }
    };


    if (!isOpen) return null;

    const renderTabContent = () => {
        const input = "input input-bordered w-full";

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

                <div className="flex border-b mb-6">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 px-4 font-semibold ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 mb-6">{renderTabContent()}</div>

                    {permiteEditar && (
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
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

                {toast.message && (
                    <Toast
                        type={toast.type}
                        message={toast.message}
                        onClose={() => setToast({ message: '', type: '' })}
                    />
                )}
            </div>
        </div>
    );
};

export default ModalCadastraCliente;