import React, { useEffect, useState } from 'react';
import '../styles/ModalCadastroNFe.css';
import ModalPesquisaFornecedor from './ModalPesquisaFornecedor';
import { getUfs, getMunicipios, getUFIBGE } from '../services/api';
import {formatarMoedaBRL } from '../utils/functions';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função


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
    const [permiteEditar, setPermiteEditar] = useState(true);
    const { permissions } = useAuth();

    useEffect(() => {
        if (isOpen && isEdit) {
            const canEdit = hasPermission(permissions, 'notafiscal', isEdit ? 'edit' : 'insert');
            setPermiteEditar(canEdit)
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const valorNF = formData.get('vNF'); 
        const today = new Date(); // Data atual
        const dataEmissaoDate = new Date(dataEmissao); // Converter string para objeto Date
        const dataSaidaDate = new Date(dataSaida);

        // Validação 1: Verificar se a data de emissão não é maior que a data atual
        if (dataEmissaoDate > today) {
            alert("A data de emissão não pode ser maior que a data atual.");
            return; // Parar a submissão se a validação falhar
        }

        // Validação 2: Verificar se a data de saída não é menor que a data de emissão
        if (dataSaidaDate < dataEmissaoDate) {
            alert("A data de saída não pode ser menor que a data de emissão.");
            return; // Parar a submissão se a validação falhar
        }
        // Se as validações passarem, continue com a submissão
        onSubmit({
            fornecedorId,
            nNF,
            serie,
            selectedUfCodIBGE,
            selectedMunicipioCodIBGE,
            municipio,
            vNF: valorNF,
            dataEmissao,
            dataSaida
        });
    };

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa em 0, então adicionamos 1
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <>{!isEdit ? <h2>Cadastro de Nota Fiscal</h2> : <h2>Cadastro de Nota Fiscal - Edição</h2>}
                </>
                <form onSubmit={handleSubmit}>
                    <div id='cadastro-padrão'>
                        <input type="hidden" name="fornecedorId" value={fornecedorId} />
                        <input type="hidden" name="ufId" value={ufId} />
                        <div className="input-group">
                            <div id='pesquisa_fornecedor'>
                                <label htmlFor="fornecedor">Fornecedor</label>
                                <input
                                    className='input-geral'
                                    type="text"
                                    id="fornecedor"
                                    name="fornecedor"
                                    value={fornecedor}
                                    readOnly
                                    required
                                    disabled={isReadOnly || !permiteEditar}
                                />
                                <div id='button-group'>
                                    <button className="button" type="button" onClick={openPesquisaModal} disabled={isReadOnly || !permiteEditar}>
                                        Pesquisar Fornecedor
                                    </button>
                                </div>

                            </div>
                        </div>
                        <div >
                            {[
                                { label: 'Número', id: 'nNF', value: nNF, setter: setNNF },
                                { label: 'Série', id: 'serie', value: serie, setter: setSerie },
                                { label: 'Valor Nota Fiscal', id: 'vNF', value: formatarMoedaBRL(vNF), setter: setvNF },
                            ].map(({ label, id, value, setter }) => (
                                <div key={id}>
                                    <label htmlFor={id}>{label}</label>
                                    <input
                                        className='input-geral'
                                        type="text"
                                        id={id}
                                        name={id}
                                        value={value}
                                        onChange={(e) => setter(e.target.value)}
                                        required
                                        disabled={isReadOnly || !permiteEditar}
                                    />
                                </div>
                            ))}
                            <div>
                                <label htmlFor="uf">Estado/UF</label>
                                <select
                                    className='input-geral'
                                    id="uf"
                                    name="uf"
                                    value={uf}
                                    onChange={handleUfChange}
                                    required
                                    disabled={isReadOnly || !permiteEditar}
                                >
                                    <option value="">Selecione uma UF</option>
                                    {ufs.length > '0' && (
                                        ufs.map((uf) => (
                                            <option key={uf.codIBGE} value={uf.sigla}>
                                                {uf.nome}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="municipio">Município</label>
                                <select
                                    className='input-geral'
                                    id="municipio"
                                    name="municipio"
                                    value={municipio}
                                    onChange={handleMunicipioChange}
                                    required
                                    disabled={!municipios.length || isReadOnly || !permiteEditar}
                                >
                                    <option key="default-municipio" value="">Selecione um município</option>
                                    {municipios.map((mun) => (
                                        <option key={mun.codMunIBGE} value={mun.nome}>
                                            {mun.nome}
                                        </option>
                                    ))}
                                </select>

                            </div>
                            {[
                                { label: 'Data de Emissão', id: 'dataEmissao', value: dataEmissao, setter: setDataEmissao, type: 'date' },
                                { label: 'Data de Saída', id: 'dataSaida', value: dataSaida, setter: setDataSaida, type: 'date' }

                            ].map(({ label, id, value, setter, type }) => (
                                <div key={id}>
                                    <label htmlFor={id}>{label}</label>
                                    <input
                                        className='input-geral'
                                        type={type}
                                        id={id}
                                        name={id}
                                        value={value}
                                        onChange={(e) => setter(e.target.value)}
                                        required
                                        disabled={isReadOnly || !permiteEditar}
                                    />
                                </div>
                            ))}
                        </div>
                        <div id='botao-salva'>
                            {permiteEditar && !isReadOnly? (
                                <button
                                    type="submit"
                                    id="btnsalvar"
                                    className="button"
                                >
                                    Salvar
                                </button>
                            ) : ''}
                        </div>

                    </div>
                </form>
            </div>
            {isPesquisaModalOpen && (
                <ModalPesquisaFornecedor
                    isOpen={isPesquisaModalOpen}
                    onClose={closePesquisaModal}
                    onSelectFornecedor={handleSelectFornecedor}
                />
            )}
        </div>
    );
};

export default ModalCadastroNFe;
