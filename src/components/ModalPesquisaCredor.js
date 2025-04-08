import React, { useState, useEffect } from 'react';
import '../styles/ModalPesquisaCredor.css';
import Toast from '../components/Toast';
import { getFornecedoresByFiltro, getFuncionariosByFiltro, getClientesByFiltro } from '../services/api';  // Funções de consulta

const ModalPesquisaCredor = ({ isOpen, onTipoCredor, onClose, onSelectCredor, tipoLancto }) => {
    const [tipoCredito, setTipoCredito] = useState(
        tipoLancto == 'credito' ? 'cliente' : 'fornecedor'
    ); // Estado para o tipo de crédito selecionado
    const [funcionarioInputs, setFuncionarioInputs] = useState({ nome: '', cpf: '' });
    const [fornecedorInputs, setFornecedorInputs] = useState({ razaoSocial: '', nomeFantasia: '', cnpj: '' });
    const [clienteInputs, setClienteInputs] = useState({ razaoSocial: '', nomeFantasia: '', cpfCnpj: '' });
    const [resultados, setResultados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [toast, setToast] = useState({ message: '', type: '' });

    useEffect(() => {
        if (isOpen) {
            setFuncionarioInputs({ nome: '', cpf: '' });
            setFornecedorInputs({ razaoSocial: '', nomeFantasia: '', cnpj: '' });
            setClienteInputs({ razaoSocial: '', nomeFantasia: '', cpfCnpj: '' });
            setResultados([]);
        }
    }, [isOpen]);

    const handleSearch = async () => {
        setLoading(true); // Ativa o loading

        try {
            let response;
            switch (tipoCredito) {
                case 'fornecedor':
                    response = await getFornecedoresByFiltro(fornecedorInputs); // Pesquisa fornecedores
                    break;
                case 'funcionario':
                    response = await getFuncionariosByFiltro(funcionarioInputs); // Pesquisa funcionários
                    break;
                case 'cliente':
                    response = await getClientesByFiltro(clienteInputs); // Pesquisa clientes
                    break;
                default:
                    break;
            }
            setResultados(response.data);
            if (response.data.length === 0) {
                setToast({ message: "Nenhum resultado encontrado.", type: "error" });
                setTimeout(() => {
                    setToast({ message: '', type: '' });
                }, 3000);
            }
        } catch (err) {
            console.error('Erro na pesquisa', err);
            setToast({ message: "Erro ao buscar credores.", type: "error" });
            setTimeout(() => {
                setToast({ message: '', type: '' });
            }, 3000);
        } finally {
            setLoading(false); // Desativa o loading, independentemente do resultado
        }
    };

    const handleSelect = (credor) => {
        onTipoCredor(tipoCredito);
        onSelectCredor(credor);  // Envia o item selecionado para o pai
        onClose();  // Fecha o modal
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                {tipoLancto == 'credito' ? <h2> Pesquisar Pagador</h2> : <h2>Pesquisar Credor</h2>}
                <div className="radio-group">
                    <div className="radio-option">
                        <input
                            type="radio"
                            id="fornecedor"
                            name="tipoCredito"
                            value="fornecedor"
                            checked={tipoCredito === 'fornecedor'}
                            onClick={() => setResultados([])}
                            onChange={() => setTipoCredito('fornecedor')}
                        />
                        <label htmlFor="fornecedor">Fornecedor</label>
                    </div>
                    <div className="radio-option">
                        <input
                            type="radio"
                            id="funcionario"
                            name="tipoCredito"
                            value="funcionario"
                            checked={tipoCredito === 'funcionario'}
                            onClick={() => setResultados([])}
                            onChange={() => setTipoCredito('funcionario')}
                        />
                        <label htmlFor="funcionario">Funcionário</label>
                    </div>
                    <div className="radio-option">
                        <input
                            type="radio"
                            id="cliente"
                            name="tipoCredito"
                            value="cliente"
                            checked={tipoCredito === 'cliente'}
                            onClick={() => setResultados([])}
                            onChange={() => setTipoCredito('cliente')}
                        />
                        <label htmlFor="cliente">Cliente</label>
                    </div>
                </div>

                {tipoCredito === 'funcionario' && (
                    <div id='cadastro-padrao'>
                        <label>Nome</label>
                        <input
                            className='input-geral'
                            type="text"
                            value={funcionarioInputs.nome}
                            onChange={(e) => setFuncionarioInputs({ ...funcionarioInputs, nome: e.target.value })}
                            placeholder="Digite o nome"
                        />
                        <label>CPF</label>
                        <input
                            className='input-geral'
                            type="text"
                            value={funcionarioInputs.cpf}
                            onChange={(e) => setFuncionarioInputs({ ...funcionarioInputs, cpf: e.target.value })}
                            placeholder="Digite o CPF"
                        />
                    </div>
                )}

                {tipoCredito === 'fornecedor' && (
                    <div id='cadastro-padrao'>
                        <label>Razão Social</label>
                        <input
                            className='input-geral'
                            type="text"
                            value={fornecedorInputs.razaoSocial}
                            onChange={(e) => setFornecedorInputs({ ...fornecedorInputs, razaoSocial: e.target.value })}
                            placeholder="Digite a Razão Social"
                        />
                        <label>Nome Fantasia</label>
                        <input
                            className='input-geral'
                            type="text"
                            value={fornecedorInputs.nomeFantasia}
                            onChange={(e) => setFornecedorInputs({ ...fornecedorInputs, nomeFantasia: e.target.value })}
                            placeholder="Digite o Nome Fantasia"
                        />
                        <label>CNPJ</label>
                        <input
                            className='input-geral'
                            type="text"
                            value={fornecedorInputs.cnpj}
                            onChange={(e) => setFornecedorInputs({ ...fornecedorInputs, cnpj: e.target.value })}
                            placeholder="Digite o CNPJ"
                        />
                    </div>
                )}

                {tipoCredito === 'cliente' && (
                    <div id='cadastro-padrao'>
                        <label>Nome/Razão Social</label>
                        <input
                            className='input-geral'
                            type="text"
                            value={clienteInputs.razaoSocial}
                            onChange={(e) => setClienteInputs({ ...clienteInputs, razaoSocial: e.target.value })}
                            placeholder="Digite o Nome ou Razão Social"
                        />
                        <label>Nome Fantasia</label>
                        <input
                            className='input-geral'
                            type="text"
                            value={clienteInputs.nomeFantasia}
                            onChange={(e) => setClienteInputs({ ...clienteInputs, nomeFantasia: e.target.value })}
                            placeholder="Digite o Nome Fantasia"
                        />
                        <label>CPF/CNPJ</label>
                        <input
                            className='input-geral'
                            type="text"
                            value={clienteInputs.cpfCnpj}
                            onChange={(e) => setClienteInputs({ ...clienteInputs, cpfCnpj: e.target.value })}
                            placeholder="Digite o CPF ou CNPJ"
                        />
                    </div>
                )}

                <button className='button-geral' onClick={handleSearch} disabled={loading}>
                    {loading ? 'Pesquisando...' : 'Pesquisar'}
                </button>

                {loading && (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>)}

                <div id="results-container">
                    <div id="grid-padrao-container">
                        <table id="grid-padrao">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>CPF/CNPJ</th>
                                    <th>Selecionar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resultados.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td>{item.nome || item.cliente?.nome}</td>
                                        <td>{item?.cpfCnpj || item.cliente?.cpfCnpj}</td>
                                        <td>
                                            <button className='button-geral' onClick={() => handleSelect(item)}>
                                                Selecionar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {toast.message && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
};

export default ModalPesquisaCredor;