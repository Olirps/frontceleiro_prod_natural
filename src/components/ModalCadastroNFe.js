import React, { useEffect, useState } from 'react';
import '../styles/ModalCadastroNFe.css';
import ModalPesquisaFornecedor from './ModalPesquisaFornecedor';
import { getUfs, getMunicipios } from '../services/api';

const ModalCadastroNFe = ({ isOpen, onClose, onSubmit, notaFiscal,isEdit, onUfChange, isReadOnly }) => {
    const [isPesquisaModalOpen, setIsPesquisaModalOpen] = useState(false);
    const [fornecedor, setFornecedor] = useState('');
    const [fornecedorId, setFornecedorId] = useState('');
    const [nNF, setNNF] = useState('');
    const [serie, setSerie] = useState('');
    const [vNF, setvNF] = useState('');
    const [uf, setUF] = useState('');
    const [ufId, setUfId] = useState('');
    const [municipio, setMunicipio] = useState('');
    const [dataEmissao, setDataEmissao] = useState('');
    const [dataSaida, setDataSaida] = useState('');
    const [cNF, setCNF] = useState('');
    const [tpNF, setTPNF] = useState('');

    const [ufs, setUfs] = useState([]);
    const [municipios, setMunicipios] = useState([]);
    const [selectedUfCodIBGE, setSelectedUfCodIBGE] = useState(null);
    const [selectedMunicipioCodIBGE, setSelectedMunicipioCodIBGE] = useState(null);

    useEffect(() => {
        if (notaFiscal) {
            console.log('Dados NF Modal Cadastro: ' + JSON.stringify(notaFiscal));
            console.log('mun. nome: ' + notaFiscal.municipio)
            console.log('uf. nome: ' + notaFiscal.sigla)
            setFornecedorId(notaFiscal.fornecedorId || '');
            setFornecedor(notaFiscal.fornecedor || '');
            setNNF(notaFiscal.nNF || '');
            setSerie(notaFiscal.serie || '');
            setvNF(notaFiscal.vNF || '');
            setUF(notaFiscal.sigla || '');
            setUfId(notaFiscal.ufId || '');
            setSelectedUfCodIBGE(notaFiscal.cUF || '');
            setMunicipio(notaFiscal.municipio || '');
            setDataEmissao(formatDate(notaFiscal.dhEmi) || '');
            setDataSaida(formatDate(notaFiscal.dhSaiEnt) || '');
            setCNF(notaFiscal.cNF || '');
            setTPNF(notaFiscal.tpNF || '');
            //setSelectedMunicipioCodIBGE(notaFiscal.cMunFG || ''); // Código IBGE do município
        }
    }, [notaFiscal]);

    useEffect(() => {
        const fetchUfs = async () => {
            try {
                if (notaFiscal) {
                    handleUfChange(notaFiscal)
                    const response = await getUfs();
                    setUfs(response.data || []);
                } else {
                    console.log('entrou aqui fetchUfs Else')
                    const response = await getUfs();
                    setUfs(response.data || []);
                }

            } catch (error) {
                console.error('Erro ao buscar UFs:', error);
                setUfs([]);
            }
        };
        fetchUfs();
    }, []);

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
            }
        };

        fetchMunicipios();
    }, [selectedUfCodIBGE]);

    const handleUfChange = (e) => {
        console.log('entrou no change')
        //console.log('entrou handleUfChange: '+JSON.stringify(e))
        if (notaFiscal && isReadOnly) {
            const selectedUf = e;
            //console.log('UFs: ' + JSON.stringify(selectedUf))
           // console.log('entrou handleUfChange: ' + JSON.stringify(e))
            setUF(e.sigla);
            setSelectedUfCodIBGE(e.cUF)
            setUfId(e.ufId);

        } else {
            const selectedUf = ufs.find(uf => uf.sigla === e.target.value);

            if (selectedUf) {
                console.log('UF IBGE: ' + JSON.stringify(selectedUf));
                setUF(selectedUf.sigla);
                setSelectedUfCodIBGE(selectedUf.codIBGE);
                setUfId(selectedUf.id);
            }
        }
    };

    const handleMunicipioChange = (e) => {
        //setMunicipio(e.target.value);
        const selectedMunicipio = municipios.find(mun => mun.nome == e.target.value);
        if (selectedMunicipio) {
            setMunicipio(selectedMunicipio.nome);
            setSelectedMunicipioCodIBGE(selectedMunicipio.codMunIBGE); // Armazena o codIBGE do município
            console.log('Código IBGE do município: ' + selectedMunicipio.codMunIBGE);
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
        console.log('Select mun. ibge: ' + selectedMunicipioCodIBGE);
        onSubmit({
            fornecedorId,
            nNF,
            serie,
            cNF,
            tpNF,
            selectedUfCodIBGE,
            selectedMunicipioCodIBGE,
            municipio,
            vNF,
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
            <div className="modal-cadastra-nf">
                <button className="modal-close" onClick={onClose}>X</button>
                <>{!isEdit ? <h2>Cadastro de Nota Fiscal</h2>:<h2>Cadastro de Nota Fiscal - Edição</h2>}
                </>
                <form onSubmit={handleSubmit}>
                    <div id='cadastro-nf'>
                        <input type="hidden" name="fornecedorId" value={fornecedorId} />
                        <input type="hidden" name="ufId" value={ufId} />
                        <div className="input-group">
                            <div id='pesquisa_fornecedor'>
                                <label htmlFor="fornecedor">Fornecedor</label>
                                <input
                                    className='input-cadastra-nf'
                                    type="text"
                                    id="fornecedor"
                                    name="fornecedor"
                                    value={fornecedor}
                                    readOnly
                                    required
                                    disabled={isReadOnly}
                                />
                                <button className="button" type="button" onClick={openPesquisaModal} disabled={isReadOnly}
                                >
                                    Pesquisar Fornecedor
                                </button>
                            </div>
                        </div>
                        <div id='itens-nota-fiscal'>
                            {[
                                { label: 'Número', id: 'nNF', value: nNF, setter: setNNF },
                                { label: 'Série', id: 'serie', value: serie, setter: setSerie },
                                { label: 'Valor Nota Fiscal', id: 'vNF', value: vNF, setter: setvNF },
                                { label: 'cNF', id: 'cNF', value: cNF, setter: setCNF },
                                { label: 'tpNF', id: 'tpNF', value: tpNF, setter: setTPNF },
                            ].map(({ label, id, value, setter }) => (
                                <div key={id}>
                                    <label htmlFor={id}>{label}</label>
                                    <input
                                        className='input-cadastra-nf'
                                        type="text"
                                        id={id}
                                        name={id}
                                        value={value}
                                        onChange={(e) => setter(e.target.value)}
                                        required
                                        disabled={isReadOnly}
                                    />
                                </div>
                            ))}
                            <div>
                                <label htmlFor="uf">Estado/UF</label>
                                <select
                                    className='input-cadastra-nf'
                                    id="uf"
                                    name="uf"
                                    value={uf}
                                    onChange={handleUfChange}
                                    required
                                    disabled={isReadOnly}
                                >
                                    <option value="">Selecione uma UF</option>
                                    disabled={isReadOnly}
                                    {ufs.length > 0 && !isReadOnly? (
                                        ufs.map((uf) => (
                                            <option key={uf.codIBGE} value={uf.sigla}>
                                                {uf.nome}
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            {notaFiscal && isReadOnly == true ? (
                                                <option disabled key="readonly-uf" value={notaFiscal.sigla}>{notaFiscal.sigla}</option>
                                            )
                                            : (
                                                <option disabled key="loading-ufs">Carregando UFs...</option>
                                            )}
                                        </>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="municipio">Município</label>
                                <select
                                    className='input-cadastra-nf'
                                    id="municipio"
                                    name="municipio"
                                    value={municipio}
                                    onChange={handleMunicipioChange}
                                    required
                                    disabled={!municipios.length || isReadOnly}
                                >
                                    <option value="">Selecione um município</option>
                                    {municipios.map((mun) => (
                                        <option key={mun.codIBGE} value={mun.nome}>
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
                                        className='input-cadastra-nf'
                                        type={type}
                                        id={id}
                                        name={id}
                                        value={value}
                                        onChange={(e) => setter(e.target.value)}
                                        required
                                        disabled={isReadOnly}
                                    />
                                </div>
                            ))}
                        </div>
                        <button className='button' type="submit" disabled={isReadOnly}
                        >Salvar</button>
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
