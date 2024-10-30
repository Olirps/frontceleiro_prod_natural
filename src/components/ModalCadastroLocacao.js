import { getFornecedores,getCarros } from '../services/api';
import React, { useState, useEffect } from 'react';
import '../styles/ModalCadastroLocacao.css';

function ModalCadastroLocacao({ closeModal, refreshLocacoes }) {
    const [clientes, setClientes] = useState([]);
    const [veiculos, setVeiculos] = useState([]);
    const [cpf, setClienteSearchTerm] = useState('');
    const [placa, setVeiculoSearchTerm] = useState('');
    const [locacao, setLocacao] = useState({
        clienteId: '',
        carroId: '',
        dataInicio: '',
        dataFim: ''
    });

    useEffect(() => {
    }, []);

    const fetchVeiculos = async () => {
        try {
            const response = await getCarros({ placa });
            setVeiculos(response.data);
        } catch (error) {
            console.error('Erro ao buscar veículos:', error);
        }
    };

    const fetchClientes = async () => {
        try {
            const response = await getFornecedores({ cpf });
            setClientes(response.data);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        }
    };
    

    const handleSearchClientes = () => {
        fetchClientes();
    };
    const handleSearchVeiculos = () => {
        fetchVeiculos();
    };

    const handleChange = (e) => {
        setLocacao({ ...locacao, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            refreshLocacoes();
            closeModal();
        } catch (error) {
            console.error('Erro ao cadastrar locação:', error);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Cadastrar Locação</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Pesquisar Cliente (Nome ou CPF):
                        <input
                            type="text"
                            placeholder="Digite o CPF"
                            value={cpf}
                            onChange={(e) => setClienteSearchTerm(e.target.value)}
                        />
                        <button type="button" onClick={handleSearchClientes}>Buscar</button>
                    </label>
                    <label>
                        Cliente:
                        <select 
                            name="clienteId" 
                            value={locacao.clienteId}
                            onChange={handleChange}
                        >
                            <option value="">Selecione um cliente</option>
                            {clientes.map((cliente) => (
                                <option key={cliente.id} value={cliente.id}>
                                    {cliente.nome} - {cliente.cpf}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Pesquisar Veículo (Placa):
                        <input
                            type="text"
                            placeholder="Digite a Placa do Veículo"
                            value={placa}
                            onChange={(e) => setVeiculoSearchTerm(e.target.value)}
                        />
                        <button type="button" onClick={handleSearchVeiculos}>Buscar</button>
                    </label>
                    <label>
                        Veículo:
                        <select 
                            name="carroId" 
                            value={locacao.carroId}
                            onChange={handleChange}
                        >
                            <option value="">Selecione um veículo</option>
                            {veiculos.map((veiculo) => (
                                <option key={veiculo.id} value={veiculo.id}>
                                    {veiculo.modelo}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Data de Início:
                        <input 
                            type="date" 
                            name="dataInicio" 
                            value={locacao.dataInicio}
                            onChange={handleChange}
                        />
                    </label>
                    <label>
                        Data de Fim:
                        <input 
                            type="date" 
                            name="dataFim" 
                            value={locacao.dataFim}
                            onChange={handleChange}
                        />
                    </label>
                    <button type="submit">Salvar</button>
                    <button type="button" onClick={closeModal}>Cancelar</button>
                </form>
            </div>
        </div>
    );
}

export default ModalCadastroLocacao;
