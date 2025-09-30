import React, { useEffect, useState } from 'react';
import '../styles/ModalCadastroNFe.css';
import ModalPesquisaFornecedor from './ModalPesquisaFornecedor';
import { getUfs, getMunicipios, getUFIBGE } from '../services/api';
import { converterMoedaParaNumero, formatarMoedaBRL } from '../utils/functions';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";


const ModalCadastroNFe = ({ isOpen, onClose, onSubmit, notaFiscal, isEdit, onUfChange, isReadOnly }) => {
    const [isPesquisaModalOpen, setIsPesquisaModalOpen] = useState(false);
    const [fornecedor, setFornecedor] = useState('');
    const [fornecedorId, setFornecedorId] = useState('');
    const [nNF, setNNF] = useState('');
    const [serie, setSerie] = useState('');
    const [vNF, setvNF] = useState('');
    const [uf, setUF] = useState('');
    const [ufId, setUfId] = useState(notaFiscal ? notaFiscal.cUF : '');
    const [municipio, setMunicipio] = useState('');
    const [dataEmissao, setDataEmissao] = useState('');
    const [dataSaida, setDataSaida] = useState('');
    const [cNF, setCNF] = useState('');
    const [tpNF, setTPNF] = useState('');

    const [ufs, setUfs] = useState([]);
    const [estados, setEstados] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [selectedUfCodIBGE, setSelectedUfCodIBGE] = useState(null);
    const [selectedMunicipioCodIBGE, setSelectedMunicipioCodIBGE] = useState(null);
    const [permiteEditar, setPermiteEditar] = useState(false);
    //Permissoes
    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

    useEffect(() => {
        if (isOpen) {
            checkPermission('notafiscal', isEdit ? 'edit' : 'insert', () => {
                setPermiteEditar(true);
            });
        }
    }, [isOpen, isEdit, permissions]);


    useEffect(() => {
        const fetchUfs = async () => {
            try {
                const response = await getUfs();
                setUfs(response.data || []);
            } catch (error) {
                console.error('Erro ao buscar UFs:', error);
                setUfs([]);
            }
        };

        fetchUfs();
    }, []);

    useEffect(() => {
        const loadNotaFiscalData = async () => {
            if (notaFiscal && (isEdit || isReadOnly)) {
                try {
                    const ufResponse = await getUFIBGE(notaFiscal.cUF);
                    const ufData = ufResponse?.data;

                    if (ufData) {
                        setUF(ufData.sigla);
                        setUfId(ufData.id);
                        setSelectedUfCodIBGE(ufData.codIBGE);

                        try {
                            const municipiosResponse = await getMunicipios(ufData.codIBGE);
                            setMunicipios(municipiosResponse.data || []);
                            // Buscar o nome do município correspondente ao código
                            const municipioEncontrado = municipiosResponse.data?.find(m => m.codMunIBGE === notaFiscal.cMunFG);
                            setMunicipio(municipioEncontrado?.nome || '');
                        } catch (error) {
                            console.error('Erro ao buscar municípios:', error);
                            setMunicipios([]);
                        }
                    }

                } catch (error) {
                    console.error('Erro ao buscar dados da nota fiscal:', error);
                }

                setFornecedorId(notaFiscal.codFornecedor || '');
                setFornecedor(notaFiscal.nomeFornecedor || '');
                setNNF(notaFiscal.nNF || '');
                setSerie(notaFiscal.serie || '');
                setvNF(notaFiscal.vNF || '');
                setDataEmissao(formatDate(notaFiscal.dhEmi) || '');
                setDataSaida(formatDate(notaFiscal.dhSaiEnt) || '');
                setCNF(notaFiscal.cNF || '');
                setTPNF(notaFiscal.tpNF || '');
            } else if (!isEdit) {
                // Limpar os campos quando for cadastro
                setFornecedor('');
                setFornecedorId('');
                setNNF('');
                setSerie('');
                setvNF('');
                setUF('');
                setUfId('');
                setMunicipio('');
                setDataEmissao('');
                setDataSaida('');
                setCNF('');
                setTPNF('');
                setSelectedUfCodIBGE(null);
                setMunicipios([]);
            }
        };

        loadNotaFiscalData();
    }, [notaFiscal, isEdit]);

    useEffect(() => {
        const fetchMunicipios = async () => {
            if (selectedUfCodIBGE) {
                try {
                    const response = await getMunicipios(selectedUfCodIBGE);
                    setMunicipios(response.data || []);
                } catch (error) {
                    console.error('Erro ao buscar municípios:', error);
                    setMunicipios([]);
                }
            } else {
                setMunicipios([]); // Limpa os municípios se nenhuma UF estiver selecionada
            }
        };

        fetchMunicipios();
    }, [selectedUfCodIBGE]);

    const handleUfChange = async (e) => {
        const selectedUf = ufs.find((uf) => uf.sigla === e.target.value);
        if (selectedUf) {
            setUF(selectedUf.sigla);
            setUfId(selectedUf.id);
            setSelectedUfCodIBGE(selectedUf.codIBGE); // Esta linha é importante!

            // Força a atualização dos municípios imediatamente após setar o selectedUfCodIBGE
            try {
                const response = await getMunicipios(selectedUf.codIBGE);
                setMunicipios(response.data || []);
            } catch (error) {
                console.error('Erro ao buscar municípios:', error);
                setMunicipios([]);
            }
        } else {
            setMunicipios([]); // Limpa os municipios caso nenhuma UF seja selecionada
            setSelectedUfCodIBGE(null);
            setUF('');
            setUfId('');
        }
    };

    const handleMunicipioChange = (e) => {
        const selectedMunicipio = municipios.find(mun => mun.nome === e.target.value);
        if (selectedMunicipio) {
            setMunicipio(selectedMunicipio.nome);
            setSelectedMunicipioCodIBGE(selectedMunicipio.codMunIBGE);
        }
    };

    const openPesquisaModal = () => setIsPesquisaModalOpen(true);
    const closePesquisaModal = () => setIsPesquisaModalOpen(false);

    const handleSelectFornecedor = (selectedFornecedor) => {
        setFornecedor(selectedFornecedor.nome);
        setFornecedorId(selectedFornecedor.id);
        closePesquisaModal(); // Fecha o modal de pesquisa
    };

    if (!isOpen) return null;

    const handleSubmit = () => {
        const today = new Date();
        const dataEmissaoDate = new Date(dataEmissao);
        const dataSaidaDate = new Date(dataSaida);

        if (dataEmissaoDate > today) {
            alert("A data de emissão não pode ser maior que a data atual.");
            return;
        }

        if (dataSaidaDate < dataEmissaoDate) {
            alert("A data de saída não pode ser menor que a data de emissão.");
            return;
        }

        onSubmit({
            fornecedorId,
            nNF,
            serie,
            selectedUfCodIBGE,
            selectedMunicipioCodIBGE,
            municipio,
            vNF,
            dataEmissao,
            dataSaida
        });
    };

    // Função utilitária para remover máscara e salvar número puro
    const handleChangeVNF = (e) => {
        let somenteNumeros = e.target.value; // remove tudo que não for dígito
        if (somenteNumeros.startsWith('R$')) {
            somenteNumeros = converterMoedaParaNumero(somenteNumeros);
        }
        const valorNumerico = somenteNumeros ? parseFloat(somenteNumeros) / 100 : 0; // divide por 100 para ter 2 casas decimais
        setvNF(valorNumerico);
    };


    const formatDate = (isoString) => {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa em 0, então adicionamos 1
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">

                {/* Cabeçalho */}
                <div className="flex justify-between items-center border-b px-6 py-4">
                    <h2 className="text-lg md:text-xl font-semibold">
                        {!isEdit ? "Cadastro de Nota Fiscal" : "Cadastro de Nota Fiscal - Edição"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-red-500 text-xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {/* Conteúdo com scroll */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

                    {/* Dados principais */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                        <h3 className="text-sm font-medium text-gray-600">Dados principais</h3>

                        {/* Fornecedor */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1">Fornecedor</label>
                                <input
                                    type="text"
                                    value={fornecedor}
                                    readOnly
                                    disabled={isReadOnly || !permiteEditar}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={openPesquisaModal}
                                disabled={isReadOnly || !permiteEditar}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                            >
                                Pesquisar
                            </button>
                        </div>

                        {/* Número, Série, Valor */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Número */}
                            <div>
                                <label htmlFor="nNF" className="block text-sm font-medium mb-1">
                                    Número
                                </label>
                                <input
                                    type="text"
                                    id="nNF"
                                    value={nNF}
                                    onChange={(e) => setNNF(e.target.value)}
                                    disabled={isReadOnly || !permiteEditar}
                                    required
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                />
                            </div>

                            {/* Série */}
                            <div>
                                <label htmlFor="serie" className="block text-sm font-medium mb-1">
                                    Série
                                </label>
                                <input
                                    type="text"
                                    id="serie"
                                    value={serie}
                                    onChange={(e) => setSerie(e.target.value)}
                                    disabled={isReadOnly || !permiteEditar}
                                    required
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                />
                            </div>

                            {/* Valor Nota Fiscal */}
                            <div>
                                <label htmlFor="vNF" className="block text-sm font-medium mb-1">
                                    Valor Nota Fiscal
                                </label>
                                <input
                                    type="text"
                                    id="vNF"
                                    value={formatarMoedaBRL(vNF)} // sempre exibe formatado
                                    onChange={(e) => {
                                        const valorNumerico = e.target.value.replace(/\D/g, "");
                                        setvNF(Number(valorNumerico) / 100);
                                    }}
                                    disabled={isReadOnly || !permiteEditar}
                                    required
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                />

                            </div>
                        </div>

                    </div>

                    {/* Localização */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                        <h3 className="text-sm font-medium text-gray-600">Localização</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Estado/UF</label>
                                <select
                                    value={uf}
                                    onChange={handleUfChange}
                                    disabled={isReadOnly || !permiteEditar}
                                    required
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                >
                                    <option value="">Selecione</option>
                                    {ufs.map((uf) => (
                                        <option key={uf.codIBGE} value={uf.sigla}>
                                            {uf.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Município</label>
                                <select
                                    value={municipio}
                                    onChange={handleMunicipioChange}
                                    disabled={!municipios.length || isReadOnly || !permiteEditar}
                                    required
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                >
                                    <option value="">Selecione</option>
                                    {municipios.map((mun) => (
                                        <option key={mun.codMunIBGE} value={mun.nome}>
                                            {mun.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Datas */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                        <h3 className="text-sm font-medium text-gray-600">Datas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: "Data de Emissão", id: "dataEmissao", value: dataEmissao, setter: setDataEmissao },
                                { label: "Data de Saída", id: "dataSaida", value: dataSaida, setter: setDataSaida },
                            ].map(({ label, id, value, setter }) => (
                                <div key={id}>
                                    <label className="block text-sm font-medium mb-1">{label}</label>
                                    <input
                                        type="date"
                                        id={id}
                                        value={value}
                                        onChange={(e) => setter(e.target.value)}
                                        disabled={isReadOnly || !permiteEditar}
                                        required
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rodapé com botão */}
                {permiteEditar && !isReadOnly && (
                    <div className="border-t px-6 py-4 flex justify-end">
                        <button
                            type="button" // importante! não submit, senão ele tenta enviar form
                            onClick={handleSubmit}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm"
                        >
                            Salvar
                        </button>
                    </div>
                )}
            </div>

            {/* Modais extras */}
            {isPesquisaModalOpen && (
                <ModalPesquisaFornecedor
                    isOpen={isPesquisaModalOpen}
                    onClose={closePesquisaModal}
                    onSelectFornecedor={handleSelectFornecedor}
                />
            )}
            <PermissionModalUI />
        </div>

    );
};

export default ModalCadastroNFe;
