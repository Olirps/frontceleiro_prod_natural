import React, { useState, useEffect } from 'react';
import '../styles/ModalVinculaProdVeiculo.css';
import { converterData } from '../utils/functions';
import { getVeiculos, vinculoProdVeiculo, obterVinculoPorProdutoId } from '../services/api';
import Toast from '../components/Toast';

const ModalVinculaProdVeiculo = ({ isOpen, onClose, produto, produtoquantidadeRestante, onVincular }) => {
    const [veiculos, setVeiculos] = useState([]);
    const [filteredVeiculos, setFilteredVeiculos] = useState([]);
    const [selectedVeiculo, setSelectedVeiculo] = useState('');
    const [quantidade, setQuantidade] = useState(produtoquantidadeRestante || 1);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchVeiculos();
        }
    }, [isOpen]);

    useEffect(() => {
        const filtered = veiculos.filter((veiculo) =>
            `${veiculo.modelo} ${veiculo.placa}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );
        setFilteredVeiculos(filtered);
    }, [searchTerm, veiculos]);

    const fetchVerificaQuantidadeProduto = async () => {
        try {
            const response = await obterVinculoPorProdutoId(produto.id);
            const vinculos = response.data || [];
            const quantidadeVinculada = vinculos.reduce((acc, vinculo) => acc + parseFloat(vinculo.quantidade), 0);
            const quantidadeDisponivel = produto.quantidade - quantidadeVinculada;
            setQuantidade(quantidadeDisponivel > 0 ? quantidadeDisponivel : 0);
        } catch (error) {
            console.error('Erro ao verificar quantidade do produto:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchVerificaQuantidadeProduto();
        }
    }, [isOpen]);

    const fetchVeiculos = async () => {
        try {
            setLoading(true);
            const response = await getVeiculos();
            setVeiculos(response.data || []);
            setFilteredVeiculos(response.data || []);
        } catch (error) {
            console.error('Erro ao buscar veículos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVincular = async () => {
        if (!selectedVeiculo) {
            alert('Por favor, selecione um veículo.');
            return;
        }

        if (quantidade < 1) {
            alert('A quantidade deve ser pelo menos 1.');
            return;
        }

        setIsSubmitting(true);
        const dataVinculo = converterData(new Date().toLocaleString().replace(',', ''));
        const dadosVinculo = {
            produto_id: produto.id,
            movimentacao_id: produto.idx,
            veiculo_id: selectedVeiculo,
            nota_id: produto.nota_id,
            quantidade,
            dataVinculo,
            status: 'fechado'
        };

        try {
            await vinculoProdVeiculo(dadosVinculo);

            // Exibir Toast de sucesso
            setToastMessage('Produto vinculado com sucesso!');

            // Fechar o modal
            onClose();
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Erro ao vincular produto.";
            setToastMessage(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>×</button>
                <h2 className='h2-veiculo'>Vincular Produto a Veículo</h2>
                {loading ? (
                    <p>Carregando veículos...</p>
                ) : (
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <input
                                type="text"
                                placeholder="Filtrar por modelo ou placa"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-geral"
                            />
                        </div>
                        <div>
                            <select
                                className='input-geral'
                                value={selectedVeiculo}
                                onChange={(e) => setSelectedVeiculo(e.target.value)}
                            >
                                <option value="">Selecione um veículo</option>
                                {filteredVeiculos.map((veiculo) => (
                                    <option key={veiculo.id} value={veiculo.id}>
                                        {`${veiculo.modelo} - ${veiculo.placa}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            {/* Input para quantidade */}
                            <input
                                type="number"
                                min="0.001"  // Permite valores pequenos
                                step="any"   // Aceita qualquer número decimal
                                value={quantidade}
                                onChange={(e) => setQuantidade(parseFloat(e.target.value) || '')}
                                className="input-geral"
                                placeholder="Quantidade"
                            />
                        </div>
                        <div id='button-group'>
                            <button
                                className="button"
                                onClick={handleVincular}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Vinculando...' : 'Vincular'}
                            </button>

                        </div>
                    </form>
                )}
            </div>

            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
        </div>
    );
};

export default ModalVinculaProdVeiculo;