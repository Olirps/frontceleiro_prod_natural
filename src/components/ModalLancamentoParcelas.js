import React, { useState, useEffect } from 'react';
import '../styles/ModalLancamentoParcelas.css';
import Toast from '../components/Toast';
import { formatarMoedaBRL, converterMoedaParaNumero } from '../utils/functions';
import { calcularParcelas, atualizarValorParcela, atualizarDataVencimentoParcela } from '../utils/parcelasUtils'; // Importando a função de cálculo de parcelas


const ModalLancamentoParcelas = ({ isOpen, onSubmit, onClose, valorTotal, despesa, onSave }) => {
    const [quantidadeParcelas, setQuantidadeParcelas] = useState(1);
    const [vencimento, setVencimento] = useState(new Date().toISOString().split('T')[0]);
    const [valorEntrada, setValorEntrada] = useState(0);
    const [parcelas, setParcelas] = useState([]);
    const [tipoParcelamento, setTipoParcelamento] = useState('mensal');
    const [parcelas_old, setParcelas_old] = useState([]); // Estado para armazenar as parcelas
    const [disabledSalvar, setDisabledSalvar] = useState(false); // Estado para controlar o modal de parcelas
    const [boleto, setBoleto] = useState([]); // Estado para controlar o modal de parcelas
    const [toast, setToast] = useState({ message: '', type: '' });

    useEffect(() => {
        const novasParcelas = calcularParcelas(valorTotal, valorEntrada, quantidadeParcelas, vencimento, tipoParcelamento)
        setParcelas(novasParcelas);
        setParcelas_old(novasParcelas); // Atualiza o estado das parcelas originais

    }, [quantidadeParcelas, vencimento, valorEntrada, tipoParcelamento, valorTotal]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleAlterarParcela = (index, e) => {
        const parcelasOldCopia = JSON.parse(JSON.stringify(parcelas_old));

        const novasParcelas = atualizarValorParcela(index, parcelas, e);

        // Função para lidar com a resposta de erro e retorno das parcelas antigas
        const handleError = (message) => {
            setParcelas(parcelasOldCopia);
            setDisabledSalvar(true);
            setToast({ message, type: "error" });
        };

        // Verificações de erro
        if (novasParcelas === 'Valor das Parcelas não pode ser Maior que o Valor do Lançamento.') {
            handleError("A Somatória das Parcelas não pode ser maior que o valor do lançamento");
        } else if (novasParcelas === 'Valor da Parcelas não pode ser Maior/Menor ou Igual ao Valor do Lançamento.') {
            setParcelas(parcelasOldCopia);
            setToast({ message: "Valor da Parcelas não pode ser Maior ou Igual ao Valor do Lançamento.", type: "error" });
            setDisabledSalvar(false);
        } else if (novasParcelas === 'A parcela não pode ser editada.') {
            setParcelas(parcelasOldCopia);
            setDisabledSalvar(false);
        } else {
            setParcelas(novasParcelas);
            setParcelas_old(novasParcelas);
            setDisabledSalvar(false);
        }
    };

    const handleAlterarVencimentoParcela = (index, e) => {
        const novasParcelas = atualizarDataVencimentoParcela(index, parcelas, e)
        setParcelas(novasParcelas)
    }
    const handleAlterarBoletoParcela = (index, value) => {
        setParcelas((prevParcelas) =>
            prevParcelas.map((parcela, i) =>
                i === index ? { ...parcela, boleto: value } : parcela
            )
        );
    };


    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>Lançamento de Parcelas - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}</h2>
                <form onSubmit={onSubmit}>
                    <div>
                        <div>
                            <div className='radio-group'>
                                <label>
                                    <input
                                        type="radio"
                                        value="mensal"
                                        name='tipoParcelamento'
                                        checked={tipoParcelamento === 'mensal'}
                                        onChange={() => {
                                            setTipoParcelamento('mensal')
                                        }
                                        }
                                    />
                                    Mensal
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        value="anual"
                                        name='tipoParcelamento'
                                        checked={tipoParcelamento === 'anual'}
                                        onChange={() => {
                                            setTipoParcelamento('anual')
                                        }
                                        }
                                    />
                                    Anual
                                </label>
                            </div>
                            <div id='cadastro-padrao'>
                                <div>
                                    <label>Quantidade de Parcelas:</label>
                                    <input
                                        className='input-geral'
                                        type="text"
                                        value={quantidadeParcelas}
                                        name='quantidadeParcelas'
                                        onChange={(e) => setQuantidadeParcelas(Math.max(1, Number(e.target.value.replace(',', ''))))}
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label>Data de Vencimento:</label>
                                    <input
                                        className='input-geral'
                                        type="date"
                                        name='vencimento'
                                        value={vencimento}
                                        onChange={(e) => setVencimento(e.target.value)}
                                    />
                                </div>
                                <div >
                                    <label>Boleto:</label>
                                    <input
                                        className='input-geral'
                                        type="text"
                                        name='boleto'
                                        value={boleto}
                                        onChange={(e) => setBoleto(e.target.value)}
                                    />
                                </div>
                                <div >
                                    <label>Valor de Entrada:</label>
                                    <input
                                        className='input-geral'
                                        type="text"
                                        value={valorEntrada}
                                        name='valorEntrada'
                                        onChange={(e) => setValorEntrada(formatarMoedaBRL(e.target.value))}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    {parcelas.length > 0 && (
                        <div>
                            <h3>Parcelas</h3>
                            <input type="hidden" name="parcelas" value={parcelas} />
                            <div className="parcelas-container">
                                {parcelas.map((parcela, index) => (
                                    <div key={index} className="parcela">
                                        <span>{`Parcela ${parcela.numeroParcela}`}</span>
                                        <span>
                                            <label>Vencimento: </label>
                                            <input
                                                type="date"
                                                name={`parcelas[${index}].dataVencimento`}  // Aqui estamos usando um nome único para cada parcela
                                                value={parcela.dataVencimento}
                                                onChange={(e) => handleAlterarVencimentoParcela(index, e.target.value)}
                                            />
                                        </span>
                                        <span>
                                            <label>Boleto: </label>
                                            <input
                                                type="text"
                                                name={`parcelas[${index}].boleto`} // Garante que cada parcela tenha seu campo único
                                                value={parcela.boleto || ''} // Evita erro caso `boleto` esteja undefined
                                                onChange={(e) => handleAlterarBoletoParcela(index, e.target.value)}
                                            />
                                        </span>
                                        <span>
                                            <label>Valor: </label>
                                            <input
                                                type="text"
                                                name={`parcelas[${index}].valor`}  // Aqui também estamos fazendo a mesma coisa para o valor
                                                value={formatarMoedaBRL(parcela.valor)}
                                                onChange={(e) => handleAlterarParcela(index, e.target.value)}
                                            />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div id='button-group'>
                        <button type='submit' className="button">Salvar Parcelas</button>
                    </div>

                </form>
            </div>
            {toast.message && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
};

export default ModalLancamentoParcelas;