import React, { useState, useEffect } from 'react';
import '../styles/ModalLancamentoCompleto.css';
import ConfirmarLancarParcelas from '../components/ConfirmarLancarParcelas'; // Importando o novo modal
import { cpfCnpjMask } from './utils';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../utils/hasPermission'; // Certifique-se de importar corretamente a função
import { formatarMoedaBRL } from '../utils/functions';
import Toast from '../components/Toast';



const ModalLancamentoCompleto = ({ isOpen, onClose, onConfirmar, lancamento }) => {
    const [lancamentoCompleto, setLancamentoCompleto] = useState(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [cancelarLancto, setCancelarLancto] = useState(false); // Estado para controlar o modal de parcelas
    const [mensagem, setMensagem] = useState('');
    const [toast, setToast] = useState({ message: '', type: '' });

    const { permissions } = useAuth();




    useEffect(() => {
        if (lancamento) {
            setLancamentoCompleto(lancamento.data);
        }
    }, [lancamento]);


    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleCancelar = () => {
        if (!hasPermission(permissions, 'lancamento-completo', 'delete')) {
            setToast({ message: "Você não tem permissão para cancelar despesas.", type: "error" });
            return; // Impede a abertura do modal
        }
        if (!lancamento.data) return;
        setCancelarLancto(true)
        setMensagem('Deseja realmente excluir esta despesa?')
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmCancelamento = async () => {
        const dadosLancto = lancamento.data
        onConfirmar(dadosLancto);
    }

    if (!isOpen || !lancamentoCompleto) return null;

    // Função para formatar a data no formato brasileiro
    const formatarData = (data) => {
        if (!data) return '-';
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>Lançamento Completo</h2>

                {/* Detalhes do Lançamento */}
                <div className="lancamento-detalhes">
                    <h3>Detalhes do Lançamento</h3>
                    <p><strong>Descrição:</strong> {lancamentoCompleto.descricao}</p>
                    <p><strong>Valor:</strong> {formatarMoedaBRL(lancamentoCompleto.valor)}</p>
                    <p><strong>Data de Vencimento:</strong> {formatarData(lancamentoCompleto.data_vencimento)}</p>
                    <p><strong>Data de Lançamento:</strong> {formatarData(lancamentoCompleto.data_lancamento)}</p>
                    <p><strong>Tipo:</strong> {lancamentoCompleto.tipo}</p>
                    <p><strong>Status:</strong> {lancamentoCompleto.status}</p>
                </div>

                {/* Detalhes da Entidade (Fornecedor, Funcionário ou Cliente) */}
                {lancamentoCompleto.fornecedor && (
                    <div className="entidade-detalhes">
                        <h3>Fornecedor</h3>
                        <p><strong>Nome:</strong> {lancamentoCompleto.fornecedor.nome}</p>
                        <p><strong>CNPJ:</strong> {cpfCnpjMask(lancamentoCompleto.fornecedor.cpfCnpj)}</p>
                        <p><strong>Endereço:</strong> {lancamentoCompleto.fornecedor.logradouro}, {lancamentoCompleto.fornecedor.numero}</p>
                        <p><strong>Município:</strong> {lancamentoCompleto.fornecedor.municipio} - {lancamentoCompleto.fornecedor.uf}</p>
                    </div>
                )}

                {lancamentoCompleto.funcionario && (
                    <div className="entidade-detalhes">
                        <h3>Funcionário</h3>
                        <p><strong>Nome:</strong> {lancamentoCompleto.funcionario.cliente.nome}</p>
                        <p><strong>CPF:</strong> {cpfCnpjMask(lancamentoCompleto.funcionario.cliente.cpfCnpj)}</p>
                        <p><strong>Cargo:</strong> {lancamentoCompleto.funcionario.cargo}</p>
                        <p><strong>Salário:</strong> {formatarMoedaBRL(lancamentoCompleto.funcionario.salario)}</p>
                    </div>
                )}

                {lancamentoCompleto.cliente && (
                    <div className="entidade-detalhes">
                        <h3>Cliente</h3>
                        <p><strong>Nome:</strong> {lancamentoCompleto.cliente.nome}</p>
                        <p><strong>CPF/CNPJ:</strong> {cpfCnpjMask(lancamentoCompleto.cliente.cpfCnpj)}</p>
                        <p><strong>Endereço:</strong> {lancamentoCompleto.cliente.logradouro}, {lancamentoCompleto.cliente.numero}</p>
                        <p><strong>Município:</strong> {lancamentoCompleto.cliente.municipio_id} - {lancamentoCompleto.cliente.uf_id}</p>
                    </div>
                )}

                {/* Detalhes das Parcelas */}
                {/* Detalhes das Parcelas */}
                <div className="parcelas-detalhes">
                    <h3>Parcelas</h3>
                    {lancamentoCompleto.parcelas.length > 0 ? (
                        <table id='grid-padrao'>
                            <thead>
                                <tr>
                                    <th>Descrição</th>
                                    <th>Valor</th>
                                    <th>Vencimento</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lancamentoCompleto.parcelas.map((parcela) => (
                                    <tr key={parcela.id}>
                                        <td>{parcela.descricao}</td>
                                        <td>{formatarMoedaBRL(parcela.valor_parcela)}</td>
                                        <td>{formatarData(parcela.vencimento)}</td>
                                        <td>{parcela.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Nenhuma parcela encontrada.</p>
                    )}
                </div>
                {/* Detalhes da Nota Fiscal */}
                {lancamentoCompleto.notaFiscal && lancamentoCompleto.notaFiscal.length > 0 && (
                    <div className="nota-fiscal-detalhes">
                        <h3>Notas Fiscais</h3>
                        <table id='grid-padrao'>
                            <thead>
                                <tr>
                                    <th>Número</th>
                                    <th>Valor Total</th>
                                    <th>Data de Emissão</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lancamentoCompleto.notaFiscal.map((notaFiscal, index) => (
                                    <tr key={index}>
                                        <td>{notaFiscal.nNF}</td>
                                        <td>{formatarMoedaBRL(notaFiscal.vNF)}</td>
                                        <td>{formatarData(notaFiscal.dhEmi)}</td>
                                        <td>{notaFiscal.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <div id='button-group'>
                    <button className="button-excluir" onClick={handleCancelar}>
                        Excluir
                    </button>
                </div>
            </div>
            {toast.message && <Toast type={toast.type} message={toast.message} />}

            {isConfirmDialogOpen && (
                <ConfirmarLancarParcelas
                    isOpen={isConfirmDialogOpen}
                    message={mensagem}
                    cancelarLancto={cancelarLancto}
                    onConfirmar={handleConfirmCancelamento}
                    onConfirm={handleConfirmCancelamento}  // Abre o modal de lançamento de parcelas
                    onCancel={() => setIsConfirmDialogOpen(false)}
                />
            )
            }
        </div>
    );
};

export default ModalLancamentoCompleto;