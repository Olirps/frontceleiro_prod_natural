import React, { useState, useEffect } from 'react';
import { addContabancaria, getAllContas, getAllBancos, getContasBancariaById, updateContaBancaria } from '../services/api';
import ModalCadastroContasBancarias from '../components/ModalCadastroContasBancarias';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função


const ContasBancarias = () => {
    const [contas, setContas] = useState([]);
    const [filteredContas, setFilteredContas] = useState([]);
    const [bancos, setBancos] = useState([]);
    const [nome, setNome] = useState('');
    const [bancoId, setBancoId] = useState('');
    const [agencia, setAgencia] = useState('');
    const [numero, setNumero] = useState('');
    const [tipoConta, setTipoConta] = useState('');
    const [selectedConta, setSelectedConta] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [isEdit, setIsEdit] = useState(false);
    const { permissions } = useAuth();
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);



    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);


    useEffect(() => {
        const fetchContas = async () => {
            try {
                const response = await getAllContas();
                setContas(response.data);
                setFilteredContas(response.data)
            } catch (error) {
                console.error('Erro ao buscar contas bancárias:', error);
                setContas([]);
            } finally {
                setLoading(false);
            }
        };
        fetchContas();
        fetchBancos();

    }, []);
    const fetchBancos = async () => {
        try {
            const response = await getAllBancos();
            setBancos(response.data);
        } catch (err) {
            console.error('Erro ao buscar marcas', err);
        }
    };

    const handleSearch = () => {
        const lowerNome = nome.toLowerCase();
        const lowerAgencia = agencia.toLowerCase();
        const lowerNumero = numero.toLowerCase();

        const results = contas.filter(conta =>
            (bancoId ? conta.banco_id.toString() === bancoId : true) &&
            (lowerNome ? conta.nome.toLowerCase().includes(lowerNome) : true) &&
            (lowerAgencia ? conta.agencia.toLowerCase().includes(lowerAgencia) : true) &&
            (lowerNumero ? conta.conta.toLowerCase().includes(lowerNumero) : true)
        );

        setFilteredContas(results);
        setCurrentPage(1); // Resetar para a primeira página após a busca
    };

    const handleClear = () => {
        setBancos(bancos)
        setNome('');
        setAgencia('');
        setNumero('');
        setFilteredContas(contas);
        setCurrentPage(1); // Resetar para a primeira página ao limpar a busca
    };

    const handleCadastrarModal = () => {
        if (!hasPermission(permissions, 'contasbancarias', 'insert')) {
            setToast({ message: "Você não tem permissão para cadastrar clientes.", type: "error" });
            return; // Impede a abertura do modal
        }
        setIsModalOpen(true);
        setIsEdit(false);
        setSelectedConta('')
    };



    const handleRowsChange = (e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1); // Resetar para a primeira página ao alterar o número de linhas
    };

    const handleAddContaBancaria = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newConta = {
            banco_id: formData.get('banco'),
            agencia: formData.get('agencia'),
            conta: formData.get('numero'),
            nome: formData.get('nome'),
            tipo_conta: formData.get('tipoconta'),
            documento: formData.get('documento')
        };

        try {
            await addContabancaria(newConta);
            setToast({ message: "Conta Bancária cadastrado com sucesso!", type: "success" });
            setIsModalOpen(false);
            setIsEdit(false);
            const response = await getAllContas();
            setContas(response.data);
            setFilteredContas(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao cadastrar veículo.";
            setToast({ message: errorMessage, type: "error" });
        }
    };


    const totalPages = Math.ceil(filteredContas.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentContas = filteredContas.slice(startIndex, startIndex + rowsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleEditClick = async (cliente) => {
        try {
            if (!hasPermission(permissions, 'contasbancarias', 'viewcadastro')) {
                setToast({ message: "Você não tem permissão para visualizar o cadastro de contas bancárias.", type: "error" });
                return; // Impede a abertura do modal
            }
            const response = await getContasBancariaById(cliente.id);
            setSelectedConta(response.data);
            setIsEdit(true);
            setIsModalOpen(true);
        } catch (err) {
            console.error('Erro ao buscar detalhes da conta bancária.', err);
            setToast({ message: "Erro ao buscar detalhes da conta bancária.", type: "error" });
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updatedContaBancaria = {
            nome: formData.get('nome'),
            agencia: formData.get('agencia'),
            conta: formData.get('numero'),
            tipo_conta: formData.get('tipoconta'),
            documento: formData.get('documento')

        };

        try {
            await updateContaBancaria(selectedConta.id, updatedContaBancaria);
            setToast({ message: "Conta Bancária atualizada com sucesso!", type: "success" });
            setIsModalOpen(false);
            setSelectedConta(null);
            setIsEdit(false);
            const response = await getAllContas();
            setContas(response.data);
            setFilteredContas(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao atualizar conta bancaria.";
            setToast({ message: errorMessage, type: "error" });
        }
    };
    return (
        <div id="contas-container">
            <h1 className='title-page'>Contas Bancárias</h1>
            <div id="search-container">
                <div id="search-fields">
                    <div>
                        <label htmlFor="bancoId">Bancos</label>
                        <select
                            className="select-veiculos-geral"
                            id="bancoId"
                            value={bancoId}
                            onChange={(e) => setBancoId(e.target.value)}
                        >
                            <option value="">Todas os Bancos</option>
                            {bancos.map((banco) => (
                                <option key={banco.id} value={banco.id}>
                                    {banco.codBancario + ' - ' + banco.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="nome">Nome</label>
                        <input
                            className='input-geral'
                            type="text"
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            maxLength="150"
                        />
                    </div>
                </div>
                <div>
                    <div id="button-group">
                        <button onClick={handleSearch} className="button">Pesquisar</button>
                        <button onClick={handleClear} className="button">Limpar</button>
                        <button onClick={() => {
                            handleCadastrarModal();
                        }} className="button">Cadastrar</button>
                    </div>
                </div>
            </div>
            <div id="separator-bar"></div>
            <div id="results-container">
                {loading ? (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>
                ) : contas.length === 0 ? (
                    <p className="empty-message">Nenhuma conta bancária cadastrada.</p>
                ) : (
                    <div id="grid-padrao-container">
                        <table id="grid-padrao">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Banco</th>
                                    <th>Agência</th>
                                    <th>Conta</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentContas.map((conta) => (
                                    <tr key={conta.id}>
                                        <td>{conta.id}</td>
                                        <td>{conta.nome}</td>
                                        <td>{conta.agencia}</td>
                                        <td>{conta.conta}</td>
                                        <td>
                                            <button
                                                onClick={() => handleEditClick(conta)}
                                                className="edit-button"
                                            >
                                                Visualizar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div id="pagination-container">
                    <button onClick={handlePreviousPage} disabled={currentPage === 1}>
                        Anterior
                    </button>
                    <span>Página {currentPage} de {totalPages}</span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages}>
                        Próxima
                    </button>
                </div>

                <div id="show-more-container">
                    <label htmlFor="rows-select">Mostrar</label>
                    <select id="rows-select" value={rowsPerPage} onChange={handleRowsChange}>
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                    <label htmlFor="rows-select">por página</label>
                </div>
            </div>
            {toast.message && <Toast type={toast.type} message={toast.message} />}

            {isModalOpen && (
                <ModalCadastroContasBancarias
                    isOpen={isModalOpen}
                    onSubmit={isEdit ? handleEditSubmit : handleAddContaBancaria}
                    conta={selectedConta}
                    onClose={() => setIsModalOpen(false)}
                    edit={isEdit}
                />
            )}
        </div>
    );
};

export default ContasBancarias;
