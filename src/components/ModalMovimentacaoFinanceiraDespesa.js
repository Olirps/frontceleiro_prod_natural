import React, { useState, useEffect } from 'react';
import '../styles/ModalMovimentacaoFinanceiraDespesa.css';
import Toast from '../components/Toast';
import { formatarMoedaBRL, converterMoedaParaNumero } from '../utils/functions';
import ConfirmarLancarParcelas from '../components/ConfirmarLancarParcelas'; // Importando o novo modal
import ModalPesquisaCredor from '../components/ModalPesquisaCredor'; // Importando o modal de pesquisa
import ModalLancamentoParcelas from '../components/ModalLancamentoParcelas'; // Importe o novo modal
import { calcularParcelas, atualizarValorParcela, atualizarDataVencimentoParcela } from '../utils/parcelasUtils'; // Importando a função de cálculo de parcelas

const ModalMovimentacaoFinanceiraDespesa = ({ isOpen, onConfirmar, onSubmit, edit, onClose, movimentacao, onSuccess }) => {
    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [tipoCredor, setTipoCredor] = useState('');
    const [credor, setCredor] = useState('');
    const [dataVencimento, setDataVencimento] = useState('');
    const [tipo, setTipo] = useState('debito');  // Tipo de movimentação (crédito ou débito)
    const [despesaAdicionada, setDespesaAdicionada] = useState('');  // Tipo de movimentação (crédito ou débito)
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [tipoParcelamento, setTipoParcelamento] = useState('mensal');
    const [mensagem, setMensagem] = useState('');
    const [isModalPesquisaOpen, setIsModalPesquisaOpen] = useState(false);  // Controle do Modal de Pesquisa
    const [credorSelecionado, setCredorSelecionado] = useState(null);  // Crédito selecionado do Modal de Pesquisa
    const [lancarParcelas, setLancarParcelas] = useState(''); // Estado para controlar a opção de parcelamento
    const [isModalParcelasOpen, setIsModalParcelasOpen] = useState(false); // Estado para controlar o modal de parcelas
    const [disabledSalvar, setDisabledSalvar] = useState(false); // Estado para controlar o modal de parcelas
    const [cancelarLancto, setCancelarLancto] = useState(false); // Estado para controlar o modal de parcelas
    const [despesaRecorrente, setDespesaRecorrente] = useState('cotaunica'); // Estado para controlar o modal de parcelas
    const [valorEntradaDespesa, setValorEntradaDespesa] = useState(0); // Estado para controlar o modal de parcelas
    const [parcelas, setParcelas] = useState([]); // Estado para armazenar as parcelas
    const [parcelas_old, setParcelas_old] = useState([]); // Estado para armazenar as parcelas
    const [boleto, setBoleto] = useState(''); // Estado para controlar o modal de parcelas



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
    // Gerar parcelas iniciais quando os dados mudarem
    useEffect(() => {
        if (despesaRecorrente === 'parcelada' && lancarParcelas && dataVencimento) {
            const novasParcelas = calcularParcelas(valor, valorEntradaDespesa, lancarParcelas, dataVencimento, tipoParcelamento);
            setParcelas(novasParcelas);
            setParcelas_old(novasParcelas); // Atualiza o estado das parcelas originais

        }
    }, [valor, valorEntradaDespesa, lancarParcelas, dataVencimento, tipoParcelamento, despesaRecorrente]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
        if (isOpen) {
            // Reseta os estados quando o modal é aberto
            if (movimentacao?.id && edit) {
                setDescricao(movimentacao.descricao || '');
                setValor(String(movimentacao.valor || '')); // Convertendo para string
                setDataVencimento(movimentacao.data_vencimento || '');
                setTipo(movimentacao.tipo || 'debito'); // Garante que o tipo esteja correto

                // Verifica o tipo de credor e define o estado adequado
                if (movimentacao.funcionario_id) {
                    setCredorSelecionado(movimentacao.funcionario.cliente);
                } else if (movimentacao.fornecedor_id) {
                    setCredorSelecionado(movimentacao.fornecedor);
                } else if (movimentacao.cliente_id) {
                    setCredorSelecionado(movimentacao.cliente);
                }
                setLoading(false);

            } else {
                setDescricao('');
                setValor('');
                setDataVencimento('');
                setTipo('debito');
                setCredorSelecionado(null); // Reseta o crédito selecionado
                setLoading(false);
            }
        }
    }, [isOpen, movimentacao]);

    const handleTipoCredor = (tipo) => {
        setTipoCredor(tipo); // Aqui, o tipo de credor é atualizado no estado do componente pai
    };

    const handleLancaParcelas = () => {
        setIsModalParcelasOpen(true)
    }

    const handleCancelar = () => {
        if (!movimentacao) return;
        setCancelarLancto(true)
        setMensagem('Deseja realmente excluir esta despesa?')
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmCancelamento = async () => {
        onConfirmar(movimentacao);
    }

    const handleSaveParcelas = (parcelas) => {
        // Aqui você pode enviar as parcelas para o backend ou processá-las conforme necessário
        setToast({ message: "Parcelas salvas com sucesso!", type: "success" });
        onSuccess();
        onClose();
    };


    const handleOpenPesquisaCredito = () => {
        setIsModalPesquisaOpen(true);
    };

    const handleSelectCredor = (credor) => {
        setCredorSelecionado(credor);  // Atualiza o crédito selecionado
        setIsModalPesquisaOpen(false);  // Fecha o modal de pesquisa
    };
    const handleCredor = (e) => {
        const { value } = e.target;
        setCredor(value);
    };
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>{movimentacao ? "Editar Despesa" : "Cadastrar Despesa"}</h2>
                <div>
                    <button className='button-geral' onClick={handleOpenPesquisaCredito}>Pesquisar Credor</button>
                </div>
                {loading ? (
                    <div className="spinner-container">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <>
                        <form onSubmit={onSubmit}>
                            <div id='cadastro-padrao'>
                                <div>
                                    <label>Credor</label>
                                    <input type="hidden" name="tipoCredor" value={tipoCredor} />
                                    <input type="hidden" name="credorSelecionado" value={credorSelecionado?.id || credor} />
                                    <input
                                        type="text"
                                        className="input-geral"
                                        name='credorSelecionado'
                                        value={credorSelecionado ? (credorSelecionado.nome || credorSelecionado.cliente?.nome) : credor}
                                        onChange={handleCredor}
                                        placeholder="Selecionar ou Informe o Credor"
                                        disabled={credorSelecionado} // Desabilita apenas se cliente_id estiver definido
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="descricao">Descrição</label>
                                    <input
                                        className='input-geral'
                                        type="text"
                                        name='descricao'
                                        value={descricao.toUpperCase()}
                                        onChange={(e) => setDescricao(e.target.value.toUpperCase())}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="boleto">Boleto</label>
                                    <input
                                        className='input-geral'
                                        type="text"
                                        name='boleto'
                                        value={boleto}
                                        onChange={(e) => setBoleto(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="valor">Valor</label>
                                    <input
                                        className='input-geral'
                                        type="text"
                                        value={valor} // Isso funcionará, pois `valor` é uma string
                                        name='valor' // Isso funcionará, pois `valor` é uma string
                                        onChange={(e) => { setValor(formatarMoedaBRL(e.target.value)) }} //forma resumida de atualizar o input
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Data de Vencimento</label>
                                    <input
                                        className='input-geral'
                                        type="date"
                                        value={dataVencimento}
                                        name='dataVencimento'
                                        onChange={(e) => setDataVencimento(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Tipo</label>
                                    <select
                                        className='input-geral'
                                        value={tipo}
                                        name='tipo'
                                        onChange={(e) => setTipo(e.target.value)}
                                        required>
                                        <option value="debito">Débito</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <div>
                                    <h2> Tipo de Despesa</h2>
                                    <div className='radio-group'>
                                        <label>
                                            <input
                                                type="radio"
                                                value="cotaunica"
                                                name='despesaRecorrente'
                                                checked={despesaRecorrente === 'cotaunica'}
                                                onChange={() => setDespesaRecorrente('cotaunica')}
                                            />
                                            Cota Única
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                value="recorrente"
                                                name='despesaRecorrente'
                                                checked={despesaRecorrente === 'recorrente'}
                                                onChange={() => setDespesaRecorrente('recorrente')}
                                            />
                                            Recorrente
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                value="parcelada"
                                                name='despesaRecorrente'
                                                checked={despesaRecorrente === 'parcelada'}
                                                onChange={() => {
                                                    setDespesaRecorrente('parcelada')
                                                    setLancarParcelas('')
                                                }
                                                }
                                            />
                                            Parcelada
                                        </label>
                                    </div>
                                </div>

                                {/* Exibe campos de despesa parcelada */}
                                {despesaRecorrente === 'parcelada' && (
                                    <>
                                        <div id='form-parcelas'>
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
                                                    <label>Quantidade de Parcelas</label>
                                                    <input
                                                        className='input-geral'
                                                        type="number"
                                                        name='lancarParcelas'
                                                        value={lancarParcelas}
                                                        onChange={(e) => {
                                                            // Remove qualquer caractere que não seja um número inteiro
                                                            const value = e.target.value.replace(/[^0-9]/g, '');
                                                            // Converte o valor para número inteiro
                                                            const intValue = parseInt(value, 10);
                                                            // Define o valor mínimo como 1
                                                            setLancarParcelas(Math.max(1, intValue || 0));
                                                        }}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label>Vencimento da Primeira Parcela</label>
                                                    <input
                                                        className='input-geral'
                                                        type="date"
                                                        name='dataVencimento'
                                                        value={dataVencimento}
                                                        onChange={(e) => setDataVencimento(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label>Valor de Entrada</label>
                                                    <input
                                                        className='input-geral'
                                                        type="text"
                                                        name='valorEntradaDespesa'
                                                        value={valorEntradaDespesa}
                                                        onChange={(e) => setValorEntradaDespesa(formatarMoedaBRL(e.target.value))}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                        </div>
                                    </>
                                )}
                                {/* Exibir parcelas em tela após inserção */}
                                {despesaRecorrente === 'parcelada' && lancarParcelas && dataVencimento && (
                                    <div>
                                        <h3>Parcelas</h3>
                                        <input type="hidden" name="parcelas" value={parcelas} />
                                        <div className="parcelas-container">
                                            {parcelas.map((parcela, index) => (
                                                <div key={index} className="parcela">
                                                    <span>{`Parcela ${parcela.numeroParcela}`}</span>
                                                    <span>
                                                        <label>Vencimento</label>
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
                                                        <label>Valor</label>
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
                                    <button type="submit"
                                        className="button"
                                        disabled={disabledSalvar}
                                    >
                                        Salvar
                                    </button>
                                    {movimentacao &&
                                        <button className="button-excluir" onClick={handleCancelar}>
                                            Excluir
                                        </button>}
                                </div>
                            </div>
                        </form>
                    </>
                )}
            </div>
            {toast.message && <Toast message={toast.message} type={toast.type} />}
            {isConfirmDialogOpen && (
                <ConfirmarLancarParcelas
                    isOpen={isConfirmDialogOpen}
                    message={mensagem}
                    cancelarLancto={cancelarLancto}
                    onConfirmar={handleConfirmCancelamento}
                    onConfirm={cancelarLancto ? handleConfirmCancelamento : handleLancaParcelas}  // Abre o modal de lançamento de parcelas
                    onCancel={() => setIsConfirmDialogOpen(false)}
                />
            )
            }
            <ModalPesquisaCredor
                isOpen={isModalPesquisaOpen}
                onClose={() => setIsModalPesquisaOpen(false)}
                onSelectCredor={handleSelectCredor}
                onTipoCredor={handleTipoCredor}  // Passando a função para o modal
            />

            <ModalLancamentoParcelas
                isOpen={isModalParcelasOpen}
                onClose={() => setIsModalParcelasOpen(false)}
                valorTotal={valor}
                despesa={despesaAdicionada}
                onSave={handleSaveParcelas}
            />
        </div>
    );
};

export default ModalMovimentacaoFinanceiraDespesa;