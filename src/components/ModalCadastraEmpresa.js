import React, { useEffect, useState } from "react";

import { getUfs, getMunicipiosUfId } from '../services/api';
import Toast from '../components/Toast';
import { formatarCelular } from '../utils/functions';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";
const ModalCadastraEmpresa = ({ isOpen, onClose, empresa, onSubmit, edit }) => {
    const [activeTab, setActiveTab] = useState("dados");

    // ---------------- STATES DOS CAMPOS ----------------
    // Dados principais
    const [nome, setNome] = useState("");
    const [razaoSocial, setRazaoSocial] = useState("");
    const [cnpj, setCnpj] = useState("");
    const [inscricaoEstadual, setInscricaoEstadual] = useState("");

    // Endereço
    const [logradouro, setLogradouro] = useState("");
    const [numero, setNumero] = useState("");
    const [bairro, setBairro] = useState("");
    const [cidade, setCidade] = useState("");
    const [municipio, setMunicipio] = useState('');
    const [ufs, setUfs] = useState([]); // Estado para armazenar os UFs
    const [municipios, setMunicipios] = useState([]);
    const [uf, setUf] = useState("");
    const [cep, setCep] = useState("");
    const [status, setStatus] = useState("");

    // Fiscal/Tributário
    const [regimeTributario, setRegimeTributario] = useState("1");
    const [cfopPadrao, setCfopPadrao] = useState("");

    // Integrações
    const [nfceProducao, setNfceProducao] = useState("");
    const [nfeProducao, setNfeProducao] = useState("");

    // Financeiro
    const [descontoCliente, setDescontoCliente] = useState("");
    const [parcelas, setParcelas] = useState("");
    const [toast, setToast] = useState({ message: '', type: '' });
    //Permissoes
    const [permiteEditar, setPermiteEditar] = useState(true);

    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

    useEffect(() => {
        if (isOpen && edit) {
            checkPermission('empresas', edit ? 'edit' : 'insert', () => {
                setPermiteEditar(true);
            });
        } else {
            setPermiteEditar(true);
        }
    }, [isOpen, edit, permissions]);
    useEffect(() => {
        const preencherDadosEmpresa = async () => {
            if (empresa) {
                setNome(empresa.nome || '');
                setRazaoSocial(empresa.nomeFantasia || '');
                setCnpj(empresa.cnpj || '');
                setLogradouro(empresa.logradouro || '');
                setNumero(empresa.numero || '');
                setBairro(empresa.bairro || '');
                setStatus(empresa.status || '');

                // Preencher UF e Município com base nos IDs
                if (empresa.uf_id) {
                    const ufCorrespondente = ufs.find((uf) => parseInt(uf.codIBGE) === parseInt(empresa.uf_id));
                    setUf(ufCorrespondente ? ufCorrespondente.codIBGE : '');
                }

                // Preencher Município com base no ID
                if (empresa.municipio_id) {
                    const municipioCorrespondente = municipios.find((municipio) => parseInt(municipio.id) === parseInt(empresa.municipio_id));
                    setMunicipio(municipioCorrespondente ? municipioCorrespondente.id : '');
                }
            } else {
                // Limpar os campos
                setNome('');
                setRazaoSocial('');
                setCnpj('');
                setLogradouro('');
                setNumero('');
                setBairro('');
                setMunicipio('');
                setUf('');
                setCep('');
            }
        };
        preencherDadosEmpresa();
    }, [empresa, ufs]); // Adicione dependências relevantes


    useEffect(() => {
        const fetchUfs = async () => {
            try {
                let munsUf;
                const ufsData = await getUfs(); // Supõe-se que isso retorna o JSON fornecido

                if (edit) {
                    munsUf = await getMunicipiosUfId(empresa.uf_id);
                }

                if (Array.isArray(ufsData.data)) {
                    setUfs(ufsData.data);
                } else {
                    console.error("O retorno de getUfs não é um array:", JSON.stringify(ufsData.data));
                }

                if (edit) {
                    if (Array.isArray(munsUf.data)) {
                        setMunicipios(munsUf.data);
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar UFs:", error);
                setUfs([]); // Define como um array vazio em caso de erro

                // Adicionando o toast de erro
                setToast({
                    message: "Erro ao buscar as UFs. Tente novamente.",
                    type: "error", // Tipo de mensagem: pode ser "success", "error", etc.
                    duration: 3000, // Duração do toast em milissegundos
                });
            }
        };


        fetchUfs();
    }, [getUfs]);

    const handleUfChange = async (e) => {
        const selectedUf = e.target.value;
        setUf(selectedUf);
        if (selectedUf) {
            try {
                const municipiosData = await getMunicipiosUfId(selectedUf);
                if (Array.isArray(municipiosData.data)) {
                    setMunicipios(municipiosData.data);
                } else {
                    console.error('O retorno de getMunicipiosUfId não é um array:', JSON.stringify(municipiosData.data));
                    setMunicipios([]); // Resetar em caso de erro
                }
            } catch (error) {
                console.error('Erro ao buscar municípios:', error);
                setMunicipios([]);
            }
        } else {
            setMunicipios([]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const dados = {
            nome,
            razaoSocial,
            cnpj,
            inscricaoEstadual,
            endereco: { logradouro, numero, bairro, cidade, uf, cep },
            fiscal: { regimeTributario, cfopPadrao },
            integracoes: { nfceProducao, nfeProducao },
            financeiro: { descontoCliente, parcelas },
        };

        if (onSubmit) {
            onSubmit(dados);
        }
    };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[900px] max-h-[90vh] rounded-2xl shadow-xl overflow-y-auto">
                {/* Cabeçalho */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-xl font-semibold">Cadastro de Empresa</h2>
                    <button
                        className="text-gray-500 hover:text-red-500"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b px-6">
                    <div className="flex gap-4">
                        {[
                            { key: "dados", label: "Dados Principais" },
                            { key: "endereco", label: "Endereço" },
                            { key: "fiscal", label: "Fiscal/Tributário" },
                            { key: "config", label: "Integrações" },
                            { key: "financeiro", label: "Financeiro" },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                className={`py-2 ${activeTab === tab.key
                                    ? "border-b-2 border-blue-600 text-blue-600"
                                    : "text-gray-500"
                                    }`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conteúdo */}
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
                    {activeTab === "dados" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Nome</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Razão Social</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={razaoSocial}
                                    onChange={(e) => setRazaoSocial(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">CNPJ</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={cnpj}
                                    onChange={(e) => setCnpj(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Inscrição Estadual</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={inscricaoEstadual}
                                    onChange={(e) => setInscricaoEstadual(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "endereco" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Logradouro</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={logradouro}
                                    onChange={(e) => setLogradouro(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Número</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={numero}
                                    onChange={(e) => setNumero(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Bairro</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={bairro}
                                    onChange={(e) => setBairro(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">CEP</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={cep}
                                    onChange={(e) => setCep(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">UF</label>
                                <select
                                    className="w-full border rounded px-3 py-2"
                                    value={uf}
                                    onChange={handleUfChange}  // já chama sua função que carrega municípios
                                >
                                    <option value="">Selecione um estado</option>
                                    {ufs.map((uf) => (
                                        <option key={uf.id} value={uf.codIBGE}>
                                            {uf.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Município</label>
                                <select
                                    className="w-full border rounded px-3 py-2"
                                    value={municipio}
                                    onChange={(e) => setMunicipio(e.target.value)}
                                >
                                    <option value="">Selecione um município</option>
                                    {Array.isArray(municipios) &&
                                        municipios.map((mun) => (
                                            <option key={mun.id} value={mun.id}>
                                                {mun.nome}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    )}


                    {activeTab === "fiscal" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Regime Tributário</label>
                                <select
                                    className="w-full border rounded px-3 py-2"
                                    value={regimeTributario}
                                    onChange={(e) => setRegimeTributario(e.target.value)}
                                >
                                    <option value="1">Simples Nacional</option>
                                    <option value="2">Excesso Sublimite</option>
                                    <option value="3">Lucro Presumido/Real</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">CFOP Padrão</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={cfopPadrao}
                                    onChange={(e) => setCfopPadrao(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "config" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">NFC-e Produção</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={nfceProducao}
                                    onChange={(e) => setNfceProducao(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">NF-e Produção</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={nfeProducao}
                                    onChange={(e) => setNfeProducao(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "financeiro" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Desconto Cliente (%)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded px-3 py-2"
                                    value={descontoCliente}
                                    onChange={(e) => setDescontoCliente(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Parcelas</label>
                                <input
                                    type="number"
                                    className="w-full border rounded px-3 py-2"
                                    value={parcelas}
                                    onChange={(e) => setParcelas(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Rodapé */}
                    <div className="flex justify-end gap-2 border-t pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
                {toast.message && (
                    <Toast
                        type={toast.type}
                        message={toast.message}
                        onClose={() => setToast({ message: '', type: '' })}
                    />
                )}
                {/* Renderização do modal de autorização */}
                <PermissionModalUI />
            </div>
        </div>
    );
};

export default ModalCadastraEmpresa;
