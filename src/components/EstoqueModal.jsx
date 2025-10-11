import React, { useState, useEffect, useRef } from "react";
import { useProduto } from "../hooks/useProduto";
import { getGrupoProdutos, getSubGrupoProdutos } from '../services/GrupoSubGrupoProdutos';
import { getFornecedoresFiltro } from '../services/ApiFornecedores/ApiFornecedores';
import { addEstoque } from '../services/ApiEstoque/ApiEstoque';
import Toast from '../components/Toast';

export default function AtualizaEstoqueModal({ isOpen, onClose, onSuccess }) {
    const { searchProdutos } = useProduto();
    const [step, setStep] = useState(1);
    const [filtros, setFiltros] = useState({ grupo: "", subgrupo: "", produto: "" });
    const [tipoLancamento, setTipoLancamento] = useState('avulso'); // "avulso" ou "inventario"
    const [grupos, setGrupos] = useState([]);
    const [subgrupos, setSubgrupos] = useState([]);
    const [produtos, setProdutos] = useState([]);
    const [produtosSelecionados, setProdutosSelecionados] = useState([]);
    const [quantidade, setQuantidade] = useState('');
    const [unidade, setUnidade] = useState('');
    const [custo, setCusto] = useState('');
    const [tipo, setTipo] = useState('entrada'); // entrada | inventario
    const [fornecedor, setFornecedor] = useState('');
    const [fornecedorId, setFornecedorId] = useState('');
    const [listaFornecedores, setListaFornecedores] = useState([]);
    const [justificativa, setJustificativa] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [toast, setToast] = useState({ message: '', type: '' });
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const debounceRef = useRef();
    const delayRef = useRef(null);
    const observer = useRef();
    const [page, setPage] = useState(1);
    const limit = 50;
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchGrupos();
    }, []);

    useEffect(() => { filtros.grupo ? fetchSubgrupos(filtros.grupo) : setSubgrupos([]); setProdutos([]); }, [filtros.grupo]);

    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    async function fetchGrupos() {
        setLoading(true);
        try {
            const data = await getGrupoProdutos();
            setGrupos(data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function fetchSubgrupos(grupoId) {
        setLoading(true);
        try {
            const data = await getSubGrupoProdutos(grupoId);
            setSubgrupos(data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    async function fetchProdutos(pagina = 1) {
        if (!filtros.produto) return;
        setLoading(true);
        try {
            const data = await searchProdutos(filtros.produto, filtros.grupo, filtros.subgrupo, pagina, limit);
            if (pagina === 1) setProdutos(data || []);
            else setProdutos(prev => [...prev, ...(data || [])]);
            setHasMore((data || []).length === limit);
            setPage(pagina);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    const handleSearchFornecedor = (valor) => {
        setFornecedor(valor);

        // Limpa o timer anterior
        if (delayRef.current) {
            clearTimeout(delayRef.current);
        }

        // Só busca se tiver mais de 3 caracteres
        if (valor.length > 3) {
            delayRef.current = setTimeout(async () => {
                setLoading(true);
                try {
                    const response = await getFornecedoresFiltro({ nomeFantasia: valor });
                    setListaFornecedores(response.data || []);
                } catch (error) {
                    console.error("Erro ao buscar fornecedores:", error);
                } finally {
                    setLoading(false);
                }
            }, 500);
        } else {
            setListaFornecedores([]);
        }
    };

    const handleSelecionarFornecedor = (fornecedor) => {
        setFornecedorId(fornecedor.id);
        setFornecedor(fornecedor.nome);
        setListaFornecedores([]); // limpa a lista após seleção
    };



    const handleFiltroChange = (e) => setFiltros({ ...filtros, [e.target.name]: e.target.value });

    const handleSearchProduto = (value) => {
        setFiltros({ ...filtros, produto: value });
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (value.length < 3) return setSuggestions([]);
        debounceRef.current = setTimeout(async () => {
            try {
                const results = await searchProdutos(value);
                setSuggestions(results);
            } catch (err) { console.error(err); }
        }, 500);
    };

    const toggleSelecionado = (produto) => {
        setProdutosSelecionados(prev =>
            prev.some(p => p.id === produto.id)
                ? prev.filter(p => p.id !== produto.id)
                : [...prev, produto]
        );
    };

    const selecionarTodos = () => setProdutosSelecionados(produtos.map(p => p));
    const deselecionarTodos = () => setProdutosSelecionados([]);

    const lastProdutoRef = node => {
        if (loading.produtos) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) fetchProdutos(page + 1);
        });
        if (node) observer.current.observe(node);
    };

    const handleSubmit = async () => {
        if (!justificativa.trim()) return alert('Informe a justificativa da movimentação');

        // validação: cada produto precisa de quantidade válida
        for (const p of produtosSelecionados) {
            if (!p.qtdMov || Number(p.qtdMov) <= 0) {
                return alert(`Informe a quantidade para o produto: ${p.xProd}`);
            }
        }

        if (tipoLancamento === 'avulso' && !fornecedor.trim()) {
            return alert('Informe o fornecedor para lançamento avulso');
        }

        setLoading(prev => ({ ...prev, submit: true }));

        try {
            const payload = produtosSelecionados.map(p => ({
                produto_id: p.id,
                quantidade: Number(p.qtdMov),                 // ✅ agora usa o valor digitado no produto
                tipo: p.tipoMov || 'entrada',                 // ✅ tipo individual por produto
                unidade: p.unidade || unidade || null,
                custo: p.custo || custo || null,
                fornecedor: tipoLancamento === 'avulso' ? fornecedor : null,
                fornecedor_id: tipoLancamento === 'avulso' ? fornecedorId : null,
                justificativa,
                observacoes,
                tipo_lancamento: tipoLancamento,              // ✅ adiciona o tipo geral (avulso/inventário)
                data_movimentacao: new Date().toISOString()
            }));

            await addEstoque(payload);
            setToast({ message: 'Estoque atualizado com sucesso!', type: 'success' });
            onSuccess();
            onClose();
        } catch (e) {
            console.error(e);
            setToast({ message: 'Erro ao atualizar estoque.', type: 'error' });
        } finally {
            setLoading(prev => ({ ...prev, submit: false }));
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full sm:w-[90%] lg:w-[80%] max-h-[90vh] overflow-y-auto p-6 space-y-6">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl"
                >
                    ×
                </button>

                {/* Cabeçalho */}
                <div className="flex items-center justify-between border-b pb-3">
                    <h2 className="text-xl font-semibold text-gray-800">Atualização de Estoque</h2>
                    <div className="flex gap-1 text-sm text-gray-500">
                        <span className={step === 1 ? "font-bold text-blue-600" : ""}>Etapa 1</span>
                        <span>›</span>
                        <span className={step === 2 ? "font-bold text-blue-600" : ""}>Etapa 2</span>
                    </div>
                </div>

                {/* ETAPA 1 */}
                {step === 1 && (
                    <div className="space-y-6">
                        {/* Tipo de lançamento */}
                        <div className="bg-gray-50 p-4 rounded-xl border">
                            <p className="font-semibold mb-3 text-gray-700">Tipo de Lançamento</p>
                            <div className="flex flex-wrap gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipoLancamento"
                                        value="avulso"
                                        checked={tipoLancamento === "avulso"}
                                        onChange={(e) => setTipoLancamento(e.target.value)}
                                    />
                                    Entrada Avulsa (sem NF)
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="tipoLancamento"
                                        value="inventario"
                                        checked={tipoLancamento === "inventario"}
                                        onChange={(e) => setTipoLancamento(e.target.value)}
                                    />
                                    Inventário de Estoque
                                </label>
                            </div>
                        </div>

                        {/* Filtros */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <select
                                name="grupo"
                                value={filtros.grupo}
                                onChange={handleFiltroChange}
                                className="border rounded-lg p-2"
                            >
                                <option value="">Todos os Grupos</option>
                                {grupos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                            </select>
                            <select
                                name="subgrupo"
                                value={filtros.subgrupo}
                                onChange={handleFiltroChange}
                                className="border rounded-lg p-2"
                            >
                                <option value="">Todos os Subgrupos</option>
                                {subgrupos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                            </select>
                            <input
                                type="text"
                                placeholder="Nome do produto"
                                value={filtros.produto}
                                onChange={(e) => handleSearchProduto(e.target.value)}
                                className="border rounded-lg p-2"
                            />
                            <button
                                onClick={() => fetchProdutos(1)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Pesquisar
                            </button>
                        </div>

                        {/* Lista de produtos */}
                        <div className="border rounded-xl overflow-hidden max-h-[50vh]">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="p-2 w-10"></th>
                                        <th className="p-2 text-left">Produto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading.produtos && (
                                        <tr>
                                            <td colSpan={2} className="text-center p-4 text-gray-500">Carregando...</td>
                                        </tr>
                                    )}
                                    {produtos.map((p) => (
                                        <tr
                                            key={p.id}
                                            className={`hover:bg-blue-50 transition ${produtosSelecionados.some(s => s.id === p.id) ? "bg-blue-100" : ""
                                                }`}
                                        >
                                            <td className="p-2 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={produtosSelecionados.some(s => s.id === p.id)}
                                                    onChange={() => toggleSelecionado(p)}
                                                />
                                            </td>
                                            <td className="p-2">{p.xProd}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between mt-4">
                            <div className="flex gap-2">
                                <button onClick={selecionarTodos} className="px-3 py-1 border rounded-lg hover:bg-gray-100">
                                    Selecionar Todos
                                </button>
                                <button onClick={deselecionarTodos} className="px-3 py-1 border rounded-lg hover:bg-gray-100">
                                    Deselecionar Todos
                                </button>
                            </div>
                            <button
                                disabled={produtosSelecionados.length === 0 || !tipoLancamento}
                                onClick={() => setStep(2)}
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                            >
                                Avançar →
                            </button>
                        </div>
                    </div>
                )}

                {/* ETAPA 2 */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {tipoLancamento === "avulso" && (
                                <div className="relative col-span-2">
                                    <input
                                        type="text"
                                        placeholder="Fornecedor"
                                        value={fornecedor}
                                        onChange={(e) => handleSearchFornecedor(e.target.value)}
                                        className="border rounded-lg p-2 w-full"
                                    />
                                    {/* Lista de fornecedores */}
                                    {!loading && listaFornecedores.length > 0 && (
                                        <ul className="absolute left-0 top-full bg-white border rounded-b-lg shadow max-h-48 overflow-y-auto w-full z-10">
                                            {listaFornecedores.map((f) => (
                                                <li
                                                    key={f.id}
                                                    onClick={() => handleSelecionarFornecedor(f)}
                                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                                >
                                                    {f.nome}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                            <input
                                type="text"
                                placeholder="Justificativa da movimentação"
                                value={justificativa}
                                onChange={(e) => setJustificativa(e.target.value)}
                                className="border rounded-lg p-2 col-span-2"
                            />
                        </div>

                        <div className="border rounded-xl overflow-hidden max-h-[50vh]">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="p-2 text-left">Produto</th>
                                        <th className="p-2 text-center">Saldo Atual</th>
                                        <th className="p-2 text-center">Tipo</th>
                                        <th className="p-2 text-center">Quantidade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {produtosSelecionados.map((p, i) => (
                                        <tr key={p.id} className="border-b hover:bg-gray-50">
                                            <td className="p-2">{p.xProd}</td>
                                            <td className="p-2 text-center">{p.saldo_estoque ?? 0}</td>
                                            <td className="p-2 text-center">
                                                <select
                                                    value={p.tipoMov || "entrada"}
                                                    onChange={(e) => {
                                                        const novoTipo = e.target.value;
                                                        setProdutosSelecionados(prev =>
                                                            prev.map((item, idx) =>
                                                                idx === i ? { ...item, tipoMov: novoTipo } : item
                                                            )
                                                        );
                                                    }}
                                                    className="border rounded-lg p-1"
                                                >
                                                    <option value="entrada">Entrada</option>
                                                    <option value="saida">Saída</option>
                                                </select>
                                            </td>
                                            <td className="p-2 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={p.qtdMov || ""}
                                                    onChange={(e) => {
                                                        const qtd = e.target.value;
                                                        setProdutosSelecionados(prev =>
                                                            prev.map((item, idx) =>
                                                                idx === i ? { ...item, qtdMov: qtd } : item
                                                            )
                                                        );
                                                    }}
                                                    className="border rounded-lg p-1 w-20 text-center"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={() => setStep(1)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                            >
                                ← Voltar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading.submit || produtosSelecionados.length === 0}
                                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {loading ? "Salvando..." : "Salvar"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
