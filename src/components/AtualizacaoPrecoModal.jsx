import React, { useState, useEffect, useRef } from "react";
import { useProduto } from "../hooks/useProduto";
import ConfirmDialog from "../components/ConfirmDialog";
import { createAtualizacaoPreco, updatePrecoId, approveAtualizacao } from "../services/ApiPreco/ApiPreco";
import { getGrupoProdutos, getSubGrupoProdutos } from '../services/GrupoSubGrupoProdutos';
import { getProdutosUpdate as getProdutos } from "../services/ApiProdutos/ApiProdutos";
import { formatarMoedaBRL } from '../utils/functions';
import { handleImprimir } from '../relatorios/gerarRelAtualizaPreco';
import { PrecoProdutoInput } from './PrecoProdutoInput';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { usePermissionModal } from "../hooks/usePermissionModal";

export default function AtualizacaoPrecoModal({ onClose, onSuccess, atualizacao, produtosAtualizados, modo = "cadastrar" }) {
    const { loading: loadingProduto, error: errorProduto, fetchProduto } = useProduto();
    const [permissaoAutorizar, setPermissaoAutorizar] = useState(false);
    const [justificativaCancel, setJustificativaCancel] = useState('');

    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [toast, setToast] = useState({ message: '', type: '' });
    const [expandidoIds, setExpandidoIds] = useState(new Set());

    const [step, setStep] = useState(modo === "edit" ? 2 : 1);
    const [filtros, setFiltros] = useState({ grupo: "", subgrupo: "", produto: "" });
    const [grupos, setGrupos] = useState([]);
    const [subgrupos, setSubgrupos] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [produtosSelecionados, setProdutosSelecionados] = useState([]);
    const [percentual, setPercentual] = useState("");
    const [aprovved, setAprovved] = useState(false);
    const [justificativa, setJustificativa] = useState("");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const limit = 50;
    const [loading, setLoading] = useState({ grupos: false, subgrupos: false, produtos: false, confirmacao: false });
    const { permissions } = useAuth();
    const { checkPermission, PermissionModalUI } = usePermissionModal(permissions);

    const observer = useRef();

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const toggleExpandido = (id) => {
        setExpandidoIds(prev => {
            const novo = new Set(prev);
            if (novo.has(id)) novo.delete(id);
            else novo.add(id);
            return novo;
        });
    };

    const username = localStorage.getItem('username');
    if (!username) throw new Error('Usuário não autenticado');

    useEffect(() => {
        checkPermission("aprova-alteracao-preco", "insert", async () => {
            setPermissaoAutorizar(true); // ✅ agora o estado muda
        });
        fetchGrupos();
    }, []);

    useEffect(() => { filtros.grupo ? fetchSubgrupos(filtros.grupo) : setSubgrupos([]); setProdutos([]); }, [filtros.grupo]);
    useEffect(() => {
        if (produtosAtualizados.length > 0) {
            setJustificativa(atualizacao?.observacao || '');
            setAprovved(atualizacao?.status === 'aprovado');
            setProdutosSelecionados(produtosAtualizados.map(produto => ({
                ...produto,
                novoPreco: produto.preco_venda ?? produto.vlrVenda ?? 0,
                novoPrecoFracionado: produto.preco_venda_fracionado ?? produto.vlrVendaFracionado ?? 0,
                novoPrecoAtacado: produto.preco_atacado ?? produto.vlrVendaAtacado ?? 0
            })));
        } else {
            setProdutosSelecionados([]);
        }

    }, [produtosAtualizados]);

    async function fetchGrupos() {
        setLoading(prev => ({ ...prev, grupos: true }));
        try {
            const data = await getGrupoProdutos();
            setGrupos(data.data || []);
        }
        catch (e) { console.error(e); }
        finally { setLoading(prev => ({ ...prev, grupos: false })); }
    }

    async function fetchSubgrupos(grupoId) {
        setLoading(prev => ({ ...prev, subgrupos: true }));
        try {
            const data = await getSubGrupoProdutos(grupoId);
            setSubgrupos(data.data || []);
        }
        catch (e) { console.error(e); }
        finally { setLoading(prev => ({ ...prev, subgrupos: false })); }
    }

    async function fetchProdutos(pagina = 1) {
        setLoading(prev => ({ ...prev, produtos: true }));
        try {
            // Se quiser usar o hook para buscar produtos por ID, adapte aqui. Caso contrário, mantenha a busca por filtro.
            const data = await getProdutos({ ...filtros, page: pagina, limit });
            if (pagina === 1) {
                setProdutos(data.produtos || []);
            } else {
                setProdutos(prev => [...prev, ...(data.produtos || [])]);
            }
            setHasMore((data.produtos || []).length === limit);
            setPage(pagina);
        } catch (e) { console.error(e); }
        finally {
            setLoading(prev => ({ ...prev, produtos: false }));
        }
    }

    function handleFiltroChange(e) {
        setFiltros({ ...filtros, [e.target.name]: e.target.value });
    }


    function toggleSelecionado(produto) {
        setProdutosSelecionados(prev =>
            prev.some(p => p.id === produto.id)
                ? prev.filter(p => p.id !== produto.id)
                : [...prev, {
                    ...produto,
                    // initialize novoPreco fields with current values
                    novoPreco: produto.vlrVenda || 0,
                    novoPrecoFracionado: produto.vlrVendaFracionado || 0,
                    novoPrecoAtacado: produto.vlrVendaAtacado || 0
                }]
        );
    }

    function selecionarTodos() {
        setProdutosSelecionados(produtos.map(produto => ({
            ...produto,
            novoPreco: produto.vlrVenda || 0,
            novoPrecoFracionado: produto.vlrVendaFracionado || 0,
            novoPrecoAtacado: produto.vlrVendaAtacado || 0
        })));
    }

    function deselecionarTodos() {
        setProdutosSelecionados([]);
    }

    function removerProduto(id) {
        setProdutosSelecionados(prev => prev.filter(p => p.id !== id));
    }

    function handlePrecoIndividual(id, valor, tipo = 'normal') {
        const num = parseFloat(valor);
        if (isNaN(num)) {
            return;
        }
        if (num < 0) {
            alert('Preço não pode ser negativo');
            return;
        }

        setProdutosSelecionados(prev => prev.map(produto => {
            if (String(produto.id) !== String(id).split('_')[0]) return produto;
            const updated = { ...produto };
            if (tipo === 'fracionado') updated.novoPrecoFracionado = num;
            else if (tipo === 'atacado') updated.novoPrecoAtacado = num;
            else updated.novoPreco = num;
            return updated;
        }));
    }

    function aplicarPercentual(produtosParaAplicar, percentualValor) {
        const valor = parseFloat(percentualValor);
        if (isNaN(valor)) return;

        setProdutosSelecionados(prev => prev.map(produto => {
            // apply only to selected products (produtosParaAplicar) if provided
            const isSelected = produtosParaAplicar ? produtosParaAplicar.some(p => p.id === produto.id) : true;
            if (!isSelected) return produto;
            const updated = { ...produto };
            updated.novoPreco = Math.round((produto.vlrVenda || 0) * (1 + valor / 100) * 100) / 100;
            if (produto.fracionado) {
                const fr = produto.vlrVendaFracionado || (produto.vlrVenda / 10) || 0;
                updated.novoPrecoFracionado = Math.round(fr * (1 + valor / 100) * 100) / 100;
            }
            if (produto.atacado) {
                const at = produto.vlrVendaAtacado || produto.vlrVenda || 0;
                updated.novoPrecoAtacado = Math.round(at * (1 + valor / 100) * 100) / 100;
            }
            return updated;
        }));
    }

    function handlePercentualChange(e) {
        const valor = e.target.value;
        setPercentual(valor);
        aplicarPercentual(produtosSelecionados, valor);
    }

    async function handleCancelar({ aprovador = false } = {}) {
        if (!aprovador) {
            try {
                const cancelamento = await updatePrecoId(atualizacao.id, {
                    justificativa: justificativaCancel,
                    status: 'cancelado',
                    usuario: username
                });
                return cancelamento;
            } catch (error) {
                console.error("Erro ao cancelar atualização:", error);
                // Aqui você pode exibir uma notificação ou tratar o erro de outra forma
            }
        }
    }

    async function handleSalvar() {
        setLoading(prev => ({ ...prev, confirmacao: true }));
        try {
            let atualizacoes = produtosSelecionados.flatMap(produto => {
                const updates = [{
                    produto_id: produto.id,
                    precoAntigo: produto.vlrVenda,
                    preco_venda: produto.novoPreco,
                    justificativa,
                    dataAtualizacao: new Date(),
                    usuario: username
                }];
                if (produto.fracionado) {
                    updates.push({
                        produto_id: `${produto.id}_fracionado`,
                        precoAntigo: produto.vlrVendaFracionado || null,
                        preco_venda: produto.novoPrecoFracionado,
                        justificativa,
                        dataAtualizacao: new Date(),
                        usuario: username
                    });
                }
                if (produto.atacado) {
                    updates.push({
                        produto_id: `${produto.id}_atacado`,
                        precoAntigo: produto.vlrVendaAtacado ? produto.vlrVendaAtacado : produto.vlrVendaAtacado || 0,
                        preco_venda: produto.novoPrecoAtacado,
                        justificativa,
                        dataAtualizacao: new Date(),
                        usuario: username
                    });
                }
                return updates;
            });

            const payload = {
                justificativa,
                percentual,
                username,
                dataAtualizacao: new Date(),
                produtos: [...atualizacoes]
            };

            if (modo === 'edit') {
                await updatePrecoId(atualizacao.id, payload);
            } else {
                await createAtualizacaoPreco(atualizacoes);
            }

            setToast({ message: 'Atualização salva com sucesso!', type: 'success' });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            setToast({ message: 'Erro ao salvar atualização.', type: 'error' });
        } finally {
            setLoading(prev => ({ ...prev, confirmacao: false }));
        }
    }

    async function handleAprovar() {
        if (!justificativa) {
            alert('Justificativa é obrigatória para aprovação');
            return;
        }

        setLoading(prev => ({ ...prev, confirmacao: true }));
        try {
            const atualizacoes = produtosSelecionados.flatMap(produto => {
                const updates = [{
                    produto_id: modo === 'edit' ? produto.produto_id : produto.id,
                    precoAntigo: produto.vlrVenda,
                    preco_venda: produto.novoPreco,
                    justificativa,
                    dataAtualizacao: new Date(),
                    usuario: username
                }];
                if (produto.fracionado) {
                    updates.push({
                        produto_id: `${modo === 'edit' ? produto.produto_id : produto.id}_fracionado`,
                        precoAntigo: produto.vlrVendaFracionado || null,
                        preco_venda: produto.novoPrecoFracionado,
                        justificativa,
                        dataAtualizacao: new Date(),
                        usuario: username
                    });
                }
                if (produto.atacado) {
                    updates.push({
                        produto_id: `${modo === 'edit' ? produto.produto_id : produto.id}_atacado`,
                        precoAntigo: produto.vlrVendaAtacado || null,
                        preco_venda: produto.novoPrecoAtacado,
                        justificativa,
                        dataAtualizacao: new Date(),
                        usuario: username
                    });
                }
                return updates;
            });

            const payload = {
                justificativa,
                percentual,
                username,
                dataAtualizacao: new Date(),
                produtos: [...atualizacoes]
            };

            await approveAtualizacao(atualizacao.id, payload);
            setToast({ message: 'Atualização aprovada com sucesso!', type: 'success' });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            setToast({ message: 'Erro ao aprovar atualização.', type: 'error' });
        } finally {
            setLoading(prev => ({ ...prev, confirmacao: false }));
        }
    }


    async function handleConfirmar({ aprovador = false } = {}) {
        setLoading(prev => ({ ...prev, confirmacao: true }));
        try {
            let atualizacoes = produtosSelecionados.flatMap(produto => {
                const updates = [{
                    produto_id: produto.id,
                    precoAntigo: produto.vlrVenda,
                    preco_venda: produto.novoPreco,
                    justificativa,
                    dataAtualizacao: new Date(),
                    usuario: username
                }];
                if (produto.fracionado) {
                    updates.push({
                        produto_id: `${produto.id}_fracionado`,
                        precoAntigo: produto.vlrVendaFracionado || null,
                        preco_venda: produto.novoPrecoFracionado,
                        justificativa,
                        dataAtualizacao: new Date(),
                        usuario: username
                    });
                }
                if (produto.atacado) {
                    updates.push({
                        produto_id: `${produto.id}_atacado`,
                        precoAntigo: produto.vlrVendaAtacado || null,
                        preco_venda: produto.novoPrecoAtacado,
                        justificativa,
                        dataAtualizacao: new Date(),
                        usuario: username
                    });
                }
                return updates;
            });
            if (!aprovador) {
                try {
                    if (modo === 'edit') {
                        atualizacoes = {
                            justificativa,
                            percentual,
                            username,
                            dataAtualizacao: new Date(),
                            produtos: [...atualizacoes]
                        };

                        await updatePrecoId(atualizacao.id, atualizacoes);
                    } else {
                        await createAtualizacaoPreco(atualizacoes);
                    }
                    console.log("Atualização realizada com sucesso!");
                } catch (error) {
                    console.error("Erro ao atualizar preço:", error);
                    // Aqui você pode disparar um toast, alert, ou setar estado de erro
                }
            } else {
                checkPermission("aprova-alteracao-preco", "insert", async () => {
                    if (!justificativa) {
                        alert('Justificativa é obrigatória para aprovação');
                        return;
                    }
                    try {

                        atualizacoes = {
                            justificativa,
                            percentual,
                            username,
                            dataAtualizacao: new Date(),
                            produtos: [...atualizacoes]
                        };
                        await approveAtualizacao(atualizacao.id, atualizacoes);
                        setToast({ message: 'Atualização aprovada com sucesso!', type: 'success' });
                        onSuccess();
                        onClose();
                    } catch (error) {
                        setToast({ message: 'Erro ao aprovar atualização.', type: 'error' });
                    }
                });
            }
        } catch (e) { console.error(e); alert('Erro ao atualizar preços'); }
        finally {
            setLoading(prev => ({ ...prev, confirmacao: false }));
        }
    }

    function geraRelatorio() {
        // report generator expects produto antigo/novo; pass produtosSelecionados
        handleImprimir(produtosSelecionados);
    }

    // Scroll infinito (último item visível)
    const lastProdutoRef = node => {
        if (loading.produtos) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchProdutos(page + 1);
            }
        });
        if (node) observer.current.observe(node);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-start sm:items-center p-4 z-50 overflow-auto">
            <div className="relative bg-white rounded-lg shadow-xl w-full sm:w-[95%] lg:w-[85%] max-h-[95vh] overflow-y-auto p-6">
                {/* Botão Fechar */}
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-600 font-bold text-xl leading-none"
                    aria-label="Fechar"
                >
                    ×
                </button>
                <h2 className="text-2xl font-bold mb-6">
                    {modo === "aprovar" ? "Aprovar Atualizações" : step === 1 ? "Pesquisa de Produtos" : "Lançamento de Preços"}
                </h2>

                {/* ETAPA 1 */}
                {step === 1 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                            <select name="grupo" value={filtros.grupo} onChange={handleFiltroChange} className="border rounded-md p-1">
                                <option value="">Todos os Grupos</option>
                                {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                            </select>
                            <select name="subgrupo" value={filtros.subgrupo} onChange={handleFiltroChange} className="border rounded-md p-1">
                                <option value="">Todos os Subgrupos</option>
                                {subgrupos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                            </select>
                            <input
                                type="text"
                                name="produto"
                                value={filtros.produto}
                                onChange={handleFiltroChange}
                                placeholder="Nome do produto"
                                className="border rounded-md p-1"
                            />
                            <button onClick={() => fetchProdutos(1)} className="px-4 py-1 bg-blue-600 text-white rounded">Pesquisar</button>
                        </div>

                        <div className="mb-4 flex gap-1">
                            <button onClick={selecionarTodos} className="px-2 py-1 border rounded">Selecionar Todos</button>
                            <button onClick={deselecionarTodos} className="px-2 py-1 border rounded">Deselecionar Todos</button>
                        </div>


                        <div className="space-y-4 space-x-0 max-h-[60vh] overflow-y-auto">
                            {loading.produtos && <div className="p-4 text-center">Carregando...</div>}
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="p-2"></th>
                                        <th className="p-2 text-left">Produto</th>
                                        <th className="p-2 text-left">Preço Atual</th>
                                        <th className="p-2 text-left">Fracionado</th>
                                        <th className="p-2 text-left">Atacado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {produtos.map((p, idx) => (
                                        <tr
                                            key={p.id}
                                            ref={idx === produtos.length - 1 ? lastProdutoRef : null}
                                            className={produtosSelecionados.some(s => s.id === p.id) ? "bg-blue-50" : ""}
                                        >
                                            <td className="p-2">
                                                <input
                                                    type="checkbox"
                                                    checked={produtosSelecionados.some(s => s.id === p.id)}
                                                    onChange={() => toggleSelecionado(p)}
                                                />
                                            </td>
                                            <td className="p-2">{p.xProd}</td>
                                            <td className="p-2">{formatarMoedaBRL(p.vlrVenda)}</td>
                                            <td className="p-2">{p.fracionado ? formatarMoedaBRL(p.vlrVendaFracionado) : "-"}</td>
                                            <td className="p-2">{p.atacado ? formatarMoedaBRL(p.vlrVendaAtacado) : "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button disabled={produtosSelecionados.length === 0} onClick={() => setStep(2)} className="px-4 py-2 bg-blue-600 text-white rounded">Avançar</button>
                        </div>
                    </>
                )}

                {/* ETAPA 2 */}
                {step === 2 && (
                    <>
                        {/* Inputs de Percentual e Justificativa */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Percentual (%)"
                                value={percentual}
                                onChange={handlePercentualChange}
                                className="border rounded-md p-2"
                            />
                            <input
                                type="text"
                                placeholder="Justificativa"
                                value={justificativa}
                                onChange={e => setJustificativa(e.target.value)}
                                className="border rounded-md p-2"
                            />
                        </div>

                        {/* Tabela de produtos */}
                        <div className="mb-4 overflow-x-auto max-h-[60vh] rounded-md">
                            <div className="space-y-4 space-x-0 max-h-[60vh] overflow-y-auto">
                                {produtosSelecionados.map(p => {
                                    const expandido = expandidoIds.has(p.id);

                                    const novoPreco = p.novoPreco || 0;
                                    const difValor = novoPreco - (p.vlrVenda || 0);
                                    const difPercent = p.vlrVenda ? (difValor / p.vlrVenda) * 100 : 0;

                                    const novoFracionado = p.novoPrecoFracionado || 0;
                                    const difFracionadoValor = p.fracionado ? novoFracionado - (p.vlrVendaFracionado || 0) : 0;
                                    const difFracionadoPercent = p.fracionado && p.vlrVendaFracionado
                                        ? (difFracionadoValor / p.vlrVendaFracionado) * 100
                                        : 0;

                                    const novoAtacado = p.novoPrecoAtacado || 0;
                                    const difAtacadoValor = p.atacado ? novoAtacado - (p.vlrVendaAtacado || 0) : 0;
                                    const difAtacadoPercent = p.atacado && p.vlrVendaAtacado
                                        ? (difAtacadoValor / p.vlrVendaAtacado) * 100
                                        : 0;

                                    return (
                                        <div key={p.id} className="border rounded-md shadow-sm bg-white">
                                            {/* Cabeçalho */}
                                            <div
                                                className="flex justify-between items-center p-4 cursor-pointer"
                                                onClick={() => toggleExpandido(p.id)}
                                            >
                                                <h3 className="font-semibold">{p.xProd}</h3>
                                                <span
                                                    className={`inline-block transition-transform duration-200 text-gray-600 ${expandido ? 'rotate-90' : 'rotate-0'
                                                        }`}
                                                >
                                                    ➤
                                                </span>
                                            </div>

                                            {/* Conteúdo expandido */}
                                            {expandido && (
                                                <div className="p-4 border-t space-y-4 bg-gray-50">
                                                    {/* Preço normal */}
                                                    <PrecoProdutoInput
                                                        id={p.id}
                                                        tipo="normal"
                                                        valorAtual={modo === 'edit' ? p.preco_venda : p.novoPreco}
                                                        valorAntigo={p.vlrVenda}
                                                        modo={modo}
                                                        onChange={handlePrecoIndividual}
                                                        label="Preço"
                                                    />

                                                    {/* Fracionado */}
                                                    {p.fracionado && (
                                                        <PrecoProdutoInput
                                                            id={`${p.id}_fracionado`}
                                                            tipo="fracionado"
                                                            valorAtual={modo === 'edit' ? p.preco_venda_fracionado : p.novoPrecoFracionado}
                                                            valorAntigo={p.preco_venda_fracionado_antigo || 0}
                                                            modo={modo}
                                                            onChange={handlePrecoIndividual}
                                                            label="Fracionado"
                                                        />
                                                    )}

                                                    {/* Atacado */}
                                                    {p.atacado && (
                                                        <PrecoProdutoInput
                                                            id={`${p.id}_atacado`}
                                                            tipo="atacado"
                                                            valorAtual={modo === 'edit' ? p.preco_atacado : p.novoPrecoAtacado}
                                                            valorAntigo={p.preco_atacado_anterior || 0}
                                                            modo={modo}
                                                            onChange={handlePrecoIndividual}
                                                            label="Atacado"
                                                        />
                                                    )}

                                                    {/* Botão Remover */}
                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={() => removerProduto(p.id)}
                                                            className="px-3 py-1 border rounded text-red-600"
                                                        >
                                                            Remover
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Botões */}
                        <div className="flex justify-between items-center w-full">
                            {/* Botão à esquerda */}
                            <button
                                onClick={() => setStep(1)}
                                className="px-4 py-2 bg-gray-500 text-white rounded"
                            >
                                Voltar
                            </button>

                            {/* Botões à direita */}
                            <div className="flex gap-2">
                                <button
                                    onClick={geraRelatorio}
                                    className="px-4 py-2 bg-blue-600 text-white rounded"
                                >
                                    Imprimir
                                </button>

                                {permissaoAutorizar && (
                                    <>
                                        {modo == 'edit' && !aprovved && (
                                            <button
                                                disabled={!justificativa || produtosSelecionados.length === 0}
                                                onClick={handleAprovar}
                                                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                                            >
                                                Confirmar
                                            </button>)}
                                        <button
                                            onClick={() => setIsConfirmDialogOpen(true)}
                                            className="px-4 py-2 bg-red-600 text-white rounded"
                                        >
                                            Cancelar
                                        </button>
                                    </>
                                )}

                                {!aprovved && (<button
                                    disabled={!justificativa || produtosSelecionados.length === 0}
                                    onClick={handleSalvar}
                                    className="px-4 py-2 bg-yellow-600 text-white rounded disabled:opacity-50"
                                >
                                    Salvar
                                </button>)}
                            </div>
                        </div>
                    </>
                )}

            </div>
            {toast.message && <Toast type={toast.type} message={toast.message} />}
            <ConfirmDialog
                isOpen={isConfirmDialogOpen}
                message="Tem certeza que deseja cancelar a atualização de preços??"
                onCancel={() => setIsConfirmDialogOpen(false)}
                onJustificar={(justificativa) => {
                    setJustificativaCancel(justificativa);
                    handleCancelar({ aprovador: true });
                    setIsConfirmDialogOpen(false);
                }}
            />
        </div>
    );
}
