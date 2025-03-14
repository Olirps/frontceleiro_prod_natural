import React, { useState, useEffect } from 'react';
import '../styles/ModalMovimentacaoFinanceiraDespesa.css';
import Toast from '../components/Toast';
import { getLancamentoUnificar } from '../services/api';
import { formatarMoedaBRL, formatarData, converterMoedaParaNumero } from '../utils/functions';
import ConfirmarLancarParcelas from '../components/ConfirmarLancarParcelas'; // Importando o novo modal
import ModalPesquisaCredor from '../components/ModalPesquisaCredor'; // Importando o modal de pesquisa
import ModalLancamentoParcelas from '../components/ModalLancamentoParcelas'; // Importe o novo modal
import { calcularParcelas, atualizarValorParcela, atualizarDataVencimentoParcela } from '../utils/parcelasUtils'; // Importando a função de cálculo de parcelas

const ModalUnificaLancamentos = ({ isOpen, onConfirmar, onSubmit, edit, onClose, onSuccess }) => {
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
    const [lancamentos, setLancamentos] = useState([]); // Estado para controlar a opção de parcelamento
    const [isModalParcelasOpen, setIsModalParcelasOpen] = useState(false); // Estado para controlar o modal de parcelas
    const [disabledSalvar, setDisabledSalvar] = useState(false); // Estado para controlar o modal de parcelas
    const [cancelarLancto, setCancelarLancto] = useState(false); // Estado para controlar o modal de parcelas
    const [despesaRecorrente, setDespesaRecorrente] = useState('cotaunica'); // Estado para controlar o modal de parcelas
    const [valorEntradaDespesa, setValorEntradaDespesa] = useState(0); // Estado para controlar o modal de parcelas
    const [parcelas, setParcelas] = useState([]); // Estado para armazenar as parcelas
    const [parcelas_old, setParcelas_old] = useState([]); // Estado para armazenar as parcelas
    const [boleto, setBoleto] = useState(''); // Estado para controlar o modal de parcelas
    const [selectedLancamentos, setSelectedLancamentos] = useState([]);



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
            setDescricao('');
            setValor('');
            setDataVencimento('');
            setTipo('debito');
            setCredorSelecionado(null); // Reseta o crédito selecionado
            setLoading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchLancamento = async () => {
            if (credorSelecionado) {
                try {
                    let filtro = {}
                    if (credorSelecionado.cpfCnpj) {
                        filtro.cpfCnpj = credorSelecionado.cpfCnpj;
                    }
                    else if (credorSelecionado.nome) {
                        filtro.credor_nome = credorSelecionado.nome;
                    }
                    else {
                        filtro.credor_nome = credorSelecionado.nomeFantasia;
                    };
                    // Supondo que `getLancamentosUnificar` seja uma função que retorna os dados da API
                    const response = await getLancamentoUnificar(filtro);
                    setLancamentos(response.data);  // Atualize o estado com os dados retornados
                } catch (error) {
                    console.error('Erro ao buscar lançamentos:', error);
                }
            }
        };

        fetchLancamento();
    }, [credorSelecionado]);  // O useEffect será acionado sempre que `credorSelecionado mudar`

    const handleTipoCredor = (tipo) => {
        setTipoCredor(tipo); // Aqui, o tipo de credor é atualizado no estado do componente pai
    };

    const handleLancaParcelas = () => {
        setIsModalParcelasOpen(true)
    }

    const handleCancelar = () => {
        setCancelarLancto(true)
        setMensagem('Deseja realmente excluir esta despesa?')
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmCancelamento = async () => {
        onConfirmar();
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


    // Função para lidar com a seleção de lançamentos
    const handleSelectLancamento = (id, valor) => {
        setSelectedLancamentos((prevSelected) => {
            let newSelected;
            if (prevSelected.includes(id)) {
                // Remove o lançamento se já estiver selecionado
                newSelected = prevSelected.filter((item) => item !== id);
            } else {
                // Adiciona o lançamento se não estiver selecionado
                newSelected = [...prevSelected, id];
            }

            // Calcula a soma dos valores dos lançamentos selecionados
            const total = lancamentos
                .filter((lancamento) => newSelected.includes(lancamento.id))
                .reduce((sum, lancamento) => sum + lancamento.valor, 0).toFixed(2);


            // Atualiza o estado com o valor total formatado
            setValor(formatarMoedaBRL(total));

            return newSelected;
        });
    };


    // Função para unificar os lançamentos selecionados
    const handleUnificarLancamentos = () => {
        // Aqui você pode chamar sua API para unificar os lançamentos selecionados
        console.log('Unificando lançamentos: ', selectedLancamentos);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>X</button>
                <h2>Unificar Lançamentos</h2>
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
                                    <label>Tipo de Despesa</label>
                                    <div>
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
                                <div id="results-container">
                                    <div id="grid-padrao-container">
                                        <input type="hidden" name="selectedLancamentos" value={selectedLancamentos} />
                                        <table id='grid-padrao'>
                                            <thead>
                                                <tr>
                                                    <th>Select</th>
                                                    <th>ID</th>
                                                    <th>Descrição</th>
                                                    <th>Valor</th>
                                                    <th>Data de Lançamento</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lancamentos.map(lancamento => (
                                                    <tr key={lancamento.id}>
                                                        <td>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedLancamentos.includes(lancamento.id)}
                                                                onChange={() => handleSelectLancamento(lancamento.id)}
                                                            />
                                                        </td>
                                                        <td>{lancamento.id}</td>
                                                        <td>{lancamento.descricao}</td>
                                                        <td>{formatarMoedaBRL(lancamento.valor)}</td>
                                                        <td>{formatarData(lancamento.data_lancamento)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {/* Exibe campos de despesa parcelada */}
                                {despesaRecorrente === 'parcelada' && (
                                    <>
                                        <div id='form-parcelas'>
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
                                <div id="button-group">
                                    <button
                                        className="button-geral"
                                        type="submit"
                                        disabled={selectedLancamentos.length <= 1}  // Desabilita se nenhum lançamento for selecionado
                                        onClick={handleUnificarLancamentos}
                                    >
                                        Unificar Lançamentos
                                    </button>
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

export default ModalUnificaLancamentos;