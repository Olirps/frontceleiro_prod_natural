import React, { useState, useEffect } from 'react';
import '../styles/ModalLancamentoParcelas.css';
import Toast from '../components/Toast';
import { formatarMoedaBRL } from '../utils/functions';
import { getAllContas, getFormasPagamento } from '../services/api';

const ModalPagarLancamentos = ({ isOpen, onSubmit, onClose, parcela }) => {
    const [quantidadeParcelas, setQuantidadeParcelas] = useState(1);
    const [contas, setContas] = useState([]);
    const [contabancaria, setContaBancaria] = useState('');
    const [datapagamento, setDataPagamento] = useState(new Date().toISOString().split('T')[0]);
    const [valorPago, setValorPago] = useState(parcela.valor_parcela);
    const [formasPagamento, setFormasPagamento] = useState([]);
    const [novaForma, setNovaForma] = useState('');
    const [formaPgtoNome, setFormaPgtoNome] = useState('');
    const [toast, setToast] = useState({ message: '', type: '' });

    useEffect(() => {
        const fetchContas = async () => {
            try {
                const response = await getAllContas();
                setContas(response.data);
            } catch (err) {
                console.error('Erro ao buscar contas bancárias', err);
            }
        };

        const fetchFormasPagamento = async () => {
            try {
                const responseFormas = await getFormasPagamento();
                setFormasPagamento(responseFormas.data);
            } catch (err) {
                console.error('Erro ao buscar formas de pagamento', err);
            }

        }
        fetchContas();
        fetchFormasPagamento();
    }, []);


    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>Pagamento de Parcelas</h2>
                <form onSubmit={onSubmit}>
                    <div>
                        <label htmlFor="contabancaria">Origem Pagamento</label>
                        <select
                            className='input-geral'
                            id="contabancaria"
                            name="contabancaria"
                            value={contabancaria}
                            onChange={(e) => setContaBancaria(e.target.value)}
                            required
                        >
                            <option value="">Selecione a Conta Bancária</option>
                            {contas.map((conta) => (
                                <option key={conta.id} value={conta.id}>
                                    {conta.nome + ' ' + conta.agencia + ' ' + conta.conta}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Data do Pagamento</label>
                        <input
                            className='input-geral'
                            type='date'
                            value={datapagamento}
                            name='datapagamento'
                            onChange={(e) => setDataPagamento(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Valor Pago</label>
                        <input
                            className='input-geral'
                            type="text"
                            name='valorPago'
                            value={formatarMoedaBRL(valorPago)}
                            onChange={(e) => setValorPago(formatarMoedaBRL(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Forma de Pagamento
                        </label>
                        <select
                            value={novaForma}
                            onChange={(e) => {
                                const selectedId = e.target.value;
                                const selectedText = e.target.options[e.target.selectedIndex].text;

                                setNovaForma(selectedId);
                                setFormaPgtoNome(selectedText);
                            }}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Selecione</option>
                            {formasPagamento.map((forma) => (
                                <option key={forma.id} value={forma.id}>
                                    {forma.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type='submit' className="button-geral">Efetuar Pagamento</button>

                </form>
                {toast.message && <Toast message={toast.message} type={toast.type} />}
            </div>
        </div>
    );
};

export default ModalPagarLancamentos;
