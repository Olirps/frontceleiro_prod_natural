import React, { useState, useEffect } from 'react';
import '../styles/ModalPesquisaCredor.css';
import Toast from '../components/Toast';
import { getFuncionariosByFiltro, getClientesByFiltro } from '../services/api';  // Funções de consulta
import { getFornecedoresByFiltro } from '../services/ApiFornecedores/ApiFornecedores';

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 relative overflow-y-auto max-h-[90vh]">

                {/* Botão Fechar */}
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-lg font-bold"
                    onClick={onClose}
                >
                    ✕
                </button>

                {/* Título */}
                <h2 className="text-2xl font-semibold mb-4">
                    {tipoLancto === "credito" ? "Pesquisar Pagador" : "Pesquisar Credor"}
                </h2>

                {/* Seleção Tipo Crédito */}
                <div className="flex gap-6 mb-4">
                    {[
                        { id: "fornecedor", label: "Fornecedor" },
                        { id: "funcionario", label: "Funcionário" },
                        { id: "cliente", label: "Cliente" },
                    ].map(({ id, label }) => (
                        <label key={id} className="flex items-center gap-2">
                            <input
                                type="radio"
                                id={id}
                                name="tipoCredito"
                                value={id}
                                checked={tipoCredito === id}
                                onClick={() => setResultados([])}
                                onChange={() => setTipoCredito(id)}
                                className="text-blue-600 focus:ring-blue-500"
                            />
                            {label}
                        </label>
                    ))}
                </div>

                {/* Campos por Tipo */}
                {tipoCredito === "funcionario" && (
                    <div className="space-y-3 mb-4">
                        <div>
                            <label className="block text-sm font-medium">Nome</label>
                            <input
                                type="text"
                                value={funcionarioInputs.nome}
                                onChange={(e) => setFuncionarioInputs({ ...funcionarioInputs, nome: e.target.value })}
                                placeholder="Digite o nome"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">CPF</label>
                            <input
                                type="text"
                                value={funcionarioInputs.cpf}
                                onChange={(e) => setFuncionarioInputs({ ...funcionarioInputs, cpf: e.target.value })}
                                placeholder="Digite o CPF"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}

                {tipoCredito === "fornecedor" && (
                    <div className="space-y-3 mb-4">
                        <div>
                            <label className="block text-sm font-medium">Razão Social</label>
                            <input
                                type="text"
                                value={fornecedorInputs.razaoSocial}
                                onChange={(e) => setFornecedorInputs({ ...fornecedorInputs, razaoSocial: e.target.value })}
                                placeholder="Digite a Razão Social"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Nome Fantasia</label>
                            <input
                                type="text"
                                value={fornecedorInputs.nomeFantasia}
                                onChange={(e) => setFornecedorInputs({ ...fornecedorInputs, nomeFantasia: e.target.value })}
                                placeholder="Digite o Nome Fantasia"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">CNPJ</label>
                            <input
                                type="text"
                                value={fornecedorInputs.cnpj}
                                onChange={(e) => setFornecedorInputs({ ...fornecedorInputs, cnpj: e.target.value })}
                                placeholder="Digite o CNPJ"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}

                {tipoCredito === "cliente" && (
                    <div className="space-y-3 mb-4">
                        <div>
                            <label className="block text-sm font-medium">Nome/Razão Social</label>
                            <input
                                type="text"
                                value={clienteInputs.razaoSocial}
                                onChange={(e) => setClienteInputs({ ...clienteInputs, razaoSocial: e.target.value })}
                                placeholder="Digite o Nome ou Razão Social"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Nome Fantasia</label>
                            <input
                                type="text"
                                value={clienteInputs.nomeFantasia}
                                onChange={(e) => setClienteInputs({ ...clienteInputs, nomeFantasia: e.target.value })}
                                placeholder="Digite o Nome Fantasia"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">CPF/CNPJ</label>
                            <input
                                type="text"
                                value={clienteInputs.cpfCnpj}
                                onChange={(e) => setClienteInputs({ ...clienteInputs, cpfCnpj: e.target.value })}
                                placeholder="Digite o CPF ou CNPJ"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}

                {/* Botão Pesquisar */}
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition mb-4 disabled:opacity-50"
                    onClick={handleSearch}
                    disabled={loading}
                >
                    {loading ? "Pesquisando..." : "Pesquisar"}
                </button>

                {/* Spinner */}
                {loading && (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                    </div>
                )}

                {/* Resultados */}
                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-300 rounded-lg">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-3 py-2 border-b text-left">ID</th>
                                <th className="px-3 py-2 border-b text-left">Nome</th>
                                <th className="px-3 py-2 border-b text-left">CPF/CNPJ</th>
                                <th className="px-3 py-2 border-b text-center">Selecionar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resultados.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 border-b">{item.id}</td>
                                    <td className="px-3 py-2 border-b">{item.nome || item.cliente?.nome}</td>
                                    <td className="px-3 py-2 border-b">{item?.cpfCnpj || item.cliente?.cpfCnpj}</td>
                                    <td className="px-3 py-2 border-b text-center">
                                        <button
                                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                            onClick={() => handleSelect(item)}
                                        >
                                            Selecionar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {resultados.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="4" className="px-3 py-4 text-center text-gray-500">
                                        Nenhum resultado encontrado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {toast.message && <Toast message={toast.message} type={toast.type} />}
        </div>
    );

};

export default ModalPesquisaCredor;