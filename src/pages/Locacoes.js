import React, { useState, useEffect } from 'react';
import { getLocacoes } from '../services/api';
import ModalCadastroLocacao from '../components/ModalCadastroLocacao';
import '../styles/Locacoes.css';

function Locacoes() {
    const [locacoes, setLocacoes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchLocacoes();
    }, []);

    const fetchLocacoes = async () => {
        try {
            const response = await getLocacoes();
            setLocacoes(response.data);
        } catch (error) {
            console.error('Erro ao buscar locações:', error);
        }
    };

    const handleSearch = async () => {
        try {
            const response = await getLocacoes({ searchTerm });
            setLocacoes(response.data);
        } catch (error) {
            console.error('Erro ao buscar locações:', error);
        }
    };

    return (
        <div className="locacoes-container">
            <h1>Locações</h1>
            <div className="locacoes-actions">
                <input 
                    type="text" 
                    placeholder="Buscar por cliente ou veículo"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button onClick={handleSearch}>Buscar</button>
                <button onClick={() => setShowModal(true)}>Cadastrar Locação</button>
            </div>
            <table className="locacoes-table">
                <thead>
                    <tr>
                        <th>Cliente</th>
                        <th>Veículo</th>
                        <th>Data de Início</th>
                        <th>Data de Fim</th>
                    </tr>
                </thead>
                <tbody>
                    {locacoes.map((locacao) => (
                        <tr key={locacao.id}>
                            <td>{locacao.clienteNome}</td>
                            <td>{locacao.veiculoModelo}</td>
                            <td>{new Date(locacao.dataInicio).toLocaleDateString('pt-BR')}</td>
                            <td>{new Date(locacao.dataFim).toLocaleDateString('pt-BR')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {showModal && (
                <ModalCadastroLocacao 
                    closeModal={() => setShowModal(false)}
                    refreshLocacoes={fetchLocacoes}
                />
            )}
        </div>
    );
}

export default Locacoes;
