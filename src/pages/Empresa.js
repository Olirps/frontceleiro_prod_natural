import React, { useState, useEffect } from 'react';
import { addEmpresa, getAllEmpresas, getEmpresaById, updateEmpresa } from '../services/api';
import ModalCadastraEmpresa from '../components/ModalCadastraEmpresa';
import Toast from '../components/Toast';
import { cpfCnpjMask, removeMaks } from '../components/utils';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função



function Empresa() {
    const [empresas, setEmpresas] = useState([]);
    const [filteredEmpresas, setFilteredEmpresas] = useState([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const [nome, setNome] = useState('');
    const [razaosocial, setRazaoSocial] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [logradouro, setLogradouro] = useState('');
    const [numero, setNumero] = useState('');
    const [bairro, setBairro] = useState('');
    const [toast, setToast] = useState({ message: '', type: '' });
    const [isEdit, setIsEdit] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const { permissions } = useAuth();



    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const response = await getAllEmpresas();
                setEmpresas(response.data);
                setFilteredEmpresas(response.data);
            } catch (err) {
                console.error('Erro ao buscar empresas', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEmpresas();
    }, []);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleSearch = () => {
        const lowerNome = nome.toLowerCase();
        const lowerRazaoSocial = razaosocial.toLowerCase();
        let clearCnpj = removeMaks(cnpj.toLowerCase());
        const results = empresas.filter(empresa =>
            (lowerNome ? empresa.nome.toLowerCase().includes(lowerNome) : true) &&
            (lowerRazaoSocial ? empresa.razaosocial?.toLowerCase().includes(lowerRazaoSocial) : true) &&
            (clearCnpj ? empresa.cnpj.toLowerCase().includes(clearCnpj) : true)
        );

        setFilteredEmpresas(results);
    };

    const handleClear = () => {
        setNome('');
        setRazaoSocial('');
        setCnpj('');
        setFilteredEmpresas(empresas);
    };


    const handleCadastrarModal = () => {
        if (!hasPermission(permissions, 'empresas', 'insert')) {
            setToast({ message: "Você não tem permissão para cadastrar empresas.", type: "error" });
            return; // Impede a abertura do modal
        }
        setIsModalOpen(true);
        setIsEdit(false);
        setSelectedEmpresa(null);
    };

    const handleAddEmpresa = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newEmpresa = {
            nome: formData.get('nome'),
            razaosocial: formData.get('razaosocial'),
            cnpj: formData.get('cnpj'),
            logradouro: formData.get('logradouro'),
            numero: formData.get('numero'),
            bairro: formData.get('bairro'),
            municipio_id: formData.get('municipio'),
            status :1,
            uf_id: formData.get('uf'),
            cep: formData.get('cep').replace(/\D/g, ''),
        };

        try {
            await addEmpresa(newEmpresa);
            setToast({ message: "Empresa cadastrado com sucesso!", type: "success" });
            setIsModalOpen(false);
            const response = await getAllEmpresas();
            setEmpresas(response.data);
            setFilteredEmpresas(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao cadastrar empresa.";
            setToast({ message: errorMessage, type: "error" });
        }
    };

    const handleEditClick = async (empresa) => {
        try {
            if (!hasPermission(permissions, 'empresas', 'viewcadastro')) {
                setToast({ message: "Você não tem permissão para visualizar o cadastro de empresas.", type: "error" });
                return; // Impede a abertura do modal
            }
            const response = await getEmpresaById(empresa.id);
            setSelectedEmpresa(response.data);
            setIsEdit(true);
            setIsModalOpen(true);
        } catch (err) {
            console.error('Erro ao buscar detalhes do empresa', err);
            setToast({ message: "Erro ao buscar detalhes do empresa.", type: "error" });
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updatedEmpresa = {
            nome: formData.get('nome'),
            razaosocial: formData.get('razaosocial'),
            cnpj: formData.get('cnpj'),
            logradouro: formData.get('logradouro'),
            numero: formData.get('numero'),
            bairro: formData.get('bairro'),
            municipio_id: formData.get('municipio'),
            uf_id: formData.get('uf'),
            cep: formData.get('cep').replace(/\D/g, '')
        };

        try {
            await updateEmpresa(selectedEmpresa.id, updatedEmpresa);
            setToast({ message: "Empresa atualizado com sucesso!", type: "success" });
            setIsModalOpen(false);
            setSelectedEmpresa(null);
            setIsEdit(false);
            const response = await getAllEmpresas();
            setEmpresas(response.data);
            setFilteredEmpresas(response.data);
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao atualizar empresa.";
            setToast({ message: errorMessage, type: "error" });
        }
    };

    if (loading) {
        return <div className="spinner-container"><div className="spinner"></div></div>;
    }
    return (
        <div id="clientes-container">
            <div id="search-container">
                <div id="search-fields">
                    <div>
                        <label htmlFor="nome">Nome</label>
                        <input className="input-geral"
                            type="text"
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            maxLength="150"
                        />
                        <label htmlFor="razaosocial">Nome Fantasia</label>
                        <input className="input-geral"
                            type="text"
                            id="razaosocial"
                            value={razaosocial}
                            onChange={(e) => setRazaoSocial(e.target.value)}
                            maxLength="150"
                        />
                    </div>
                    <div>
                        <label htmlFor="cnpj">CNPJ</label>
                        <input className="input-geral"
                            type="text"
                            id="cnpj"
                            value={cpfCnpjMask(cnpj)}
                            onChange={(e) => setCnpj(e.target.value)}
                            maxLength="28"
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

                {toast.message && <Toast type={toast.type} message={toast.message} />}
                {
                    isModalOpen && (
                        <ModalCadastraEmpresa
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            onSubmit={isEdit ? handleEditSubmit : handleAddEmpresa}
                            empresa={selectedEmpresa}
                            edit={isEdit}
                        />
                    )
                }
            </div>
            <div id="separator-bar"></div>
            <div id="results-container">
                <div id="grid-padrao-container">
                    <table id="grid-padrao">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome</th>
                                <th>CNPJ</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmpresas.map((empresa) => (
                                <tr key={empresa.id}>
                                    <td>{empresa.id}</td>
                                    <td>{empresa.nome}</td>
                                    <td>{cpfCnpjMask(empresa.cnpj)}</td>
                                    <td>
                                        <button
                                            onClick={() => handleEditClick(empresa)}
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
            </div>
        </div>

    );
}

export default Empresa;
