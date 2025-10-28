import React, { useEffect, useState, useRef } from "react";
import { formatarMoedaBRL } from "../utils/functions";
import { getEmpresaById } from '../services/api';
import { getProdutos } from "../services/ApiProdutos/ApiProdutos";
import { getPacotes } from "../services/ApiPacotes/ApiPacotes";
import { getFuncionarios } from '../services/api';
import { useClientesBusca } from "../hooks/useClientesBusca";
import { registravenda, atualizaVenda } from '../services/ApiVendas/ApiVendas';
import Toast from './Toast';



export default function ModalLancarVenda({ open, onClose, onSave }) {
    const [cEAN, setCEAN] = useState("");
    const [produtoSelecionadoIndex, setProdutoSelecionadoIndex] = useState(-1);
    const [toast, setToast] = useState({ message: '', type: '' });
    const listaRef = useRef(null);
    const itemRefs = useRef([]);
    const [descricao, setDescricao] = useState("");
    const [quantidade, setQuantidade] = useState(1);
    const [itens, setItens] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [desconto, setDesconto] = useState(0);
    const [frete, setFrete] = useState(0);

    const [produtosFiltrados, setProdutosFiltrados] = useState([]);
    const [pacotesFiltrados, setPacotesFiltrados] = useState([]); // novos pacotes
    const [pacoteDescricao, setPacoteDescricao] = useState("");
    const [pacoteSelecionadoIndex, setPacoteSelecionadoIndex] = useState(-1);
    const pacoteRefs = useRef([]);

    const [valorTotalproduto, setValorTotalproduto] = useState(0);
    const [funcionarios, setFuncionarios] = useState([]);
    const [funcionarioId, setFuncionarioId] = useState("");
    const [isPetShop, setIsPetShop] = useState(false);

    // 🧠 Hooks e Refs
    const inputCodigoRef = useRef();
    const inputDescricaoRef = useRef();
    const inputQuantidadeRef = useRef();
    const inputPacoteRef = useRef();



    // 🔎 Hook de busca de cliente (já usado em outros módulos)
    const {
        clienteBusca,
        setClienteBusca,
        clientesFiltrados,
        setClientesFiltrados,
        setClienteSelected,
        clienteId,
        setClienteId,
        clienteNome,
        setClienteNome,
    } = useClientesBusca(false, setToast);

    // busca empresa (seta isPetShop)
    const buscaEmpresa = async () => {
        try {
            const empresa = await getEmpresaById(1);
            setIsPetShop(!!empresa.data?.isPetshop);
        } catch (err) {
            console.error("Erro ao buscar empresa:", err);
            setIsPetShop(false);
        }
    };

    useEffect(() => {
        const total = itens.reduce((sum, item) => sum + item.valorTotal, 0);
        setSubtotal(total);
    }, [itens]);
    useEffect(() => {
        if (toast.message) {
            const timer = setTimeout(() => setToast({ message: '', type: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // 🕐 Debounce busca de descrição
    useEffect(() => {
        if (!descricao || descricao.length < 2) {
            setProdutosFiltrados([]);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const resp = await getProdutos({ descricao: descricao.trim() });
                setProdutosFiltrados(resp.data || []);
            } catch (e) {
                console.error("Erro ao buscar produtos:", e);
            }
        }, 500);

        return () => clearTimeout(timeout);
    }, [descricao]);

    useEffect(() => {
        if (produtoSelecionadoIndex >= 0 && itemRefs.current[produtoSelecionadoIndex]) {
            itemRefs.current[produtoSelecionadoIndex].scrollIntoView({
                block: "nearest",
                behavior: "smooth",
            });
        }
    }, [produtoSelecionadoIndex]);

    useEffect(() => {
        if (!open) return;
        carregarFuncionarios();
        setItens([]);
        setProdutosFiltrados([]);
        setPacotesFiltrados([]);
        setDescricao("");
        setPacoteDescricao("");
        setCEAN("");
        setQuantidade(1);
        inputCodigoRef.current?.focus();
        buscaEmpresa(); // chama aqui
    }, [open]);

    const carregarFuncionarios = async () => {
        try {
            const data = await getFuncionarios();
            setFuncionarios(data.data || []);
        } catch (err) {
            console.error("Erro ao carregar funcionários:", err);
        }
    };


    // 🧾 Atualiza subtotal automaticamente
    useEffect(() => {
        const total = itens.reduce(
            (sum, item) => sum + item.valorUnitario * item.quantidade,
            0
        );
        setSubtotal(Math.round(total * 100) / 100); // Arredonda para 2 casas decimais
    }, [itens]);

    const buscarProdutoPorCodigo = async () => {
        if (!cEAN) return;
        try {
            const resp = await getProdutos({ cEAN: cEAN.trim() });
            if (resp.data?.length > 0) {
                const produto = resp.data[0];
                adicionarItem(produto);
            }
        } catch (err) {
            console.error("Erro ao buscar produto:", err);
        }
    };

    const valorFinal = (produto, quantidade) => {
        let valor;
        if (produto.Precos?.length > 0) {
            valor = Math.round(produto.Precos[0].preco_venda * quantidade * 100) / 100;
        } else {
            valor = Math.round(produto.valorUnitario * quantidade * 100) / 100;
        }

        setValorTotalproduto(valor);
        return valor;
    }
    // Debounce busca de pacotes (só quando isPetShop)
    useEffect(() => {
        if (!isPetShop) return;
        if (!pacoteDescricao || pacoteDescricao.length < 2) {
            setPacotesFiltrados([]);
            return;
        }
        const timeout = setTimeout(async () => {
            try {
                const resp = await getPacotes({ pacoteDescricao: pacoteDescricao.trim() });
                // assumo resp.data como array de pacotes
                setPacotesFiltrados(resp || []);
            } catch (e) {
                console.error("Erro ao buscar pacotes:", e);
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [pacoteDescricao, isPetShop]);

    const adicionarItem = (produto) => {
        if (!produto) return;

        const valorUnitario = parseFloat(produto.Precos[0]?.preco_venda || 0);

        // Cria um novo objeto isolado para cada item
        const novoItem = {
            produto_id: produto.id || produto.codigo,
            descricao: produto.xProd,
            quantidade: 1,
            valorUnitario: valorUnitario,
            vlrVenda: valorUnitario,
            valorTotal: 0
        };

        // Calcula o valorTotal usando um clone para evitar alterações indesejadas
        const valorTotal = valorFinal({ ...novoItem }, novoItem.quantidade);
        novoItem.valorTotal = valorTotal;
        setItens((prev) => [...prev, novoItem]);
        setCEAN("");
        setDescricao("");
        setQuantidade(1);
        setProdutosFiltrados([]);
    };

    const adicionarPacote = (pacote) => {
        if (!pacote) return;

        // assumo pacote.preco_venda e pacote.nome / pacote.id — ajuste conforme seu backend
        const valorUnitario = parseFloat(pacote.preco_total || 0);

        const novoItem = {
            produto_id: `PAC-${pacote.id}`, // prefixo para diferenciar pacotes se quiser
            descricao: pacote.nome || pacote.descricao || `Pacote ${pacote.id}`,
            quantidade: 1,
            valorUnitario: valorUnitario,
            vlrVenda: valorUnitario,
            valorTotal: 0,
            isPacote: true,
            pacoteId: pacote.id
        };

        novoItem.valorTotal = valorFinal({ ...novoItem, preco_venda: valorUnitario }, novoItem.quantidade);

        setItens((prev) => [...prev, novoItem]);
        setPacoteDescricao("");
        setPacotesFiltrados([]);
    };



    const handleKeyDown = async (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setProdutoSelecionadoIndex((prev) =>
                prev < produtosFiltrados.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setProdutoSelecionadoIndex((prev) =>
                prev > 0 ? prev - 1 : produtosFiltrados.length - 1
            );
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (produtoSelecionadoIndex >= 0 && produtosFiltrados.length > 0) {
                adicionarItem(produtosFiltrados[produtoSelecionadoIndex]);
                setProdutoSelecionadoIndex(-1);
            } else if (cEAN) {
                await buscarProdutoPorCodigo();
            }
        }
    };
    const handleKeyDownPacote = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setPacoteSelecionadoIndex((prev) =>
                prev < pacotesFiltrados.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setPacoteSelecionadoIndex((prev) =>
                prev > 0 ? prev - 1 : pacotesFiltrados.length - 1
            );
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (pacoteSelecionadoIndex >= 0 && pacotesFiltrados.length > 0) {
                adicionarPacote(pacotesFiltrados[pacoteSelecionadoIndex]);
                setPacoteSelecionadoIndex(-1);
            }
        }
    };


    const handleRemoveItem = (index) => {
        setItens(itens.filter((_, i) => i !== index));
    };
    const handleQuantidadeChange = (index, valor) => {
        // Substitui vírgula por ponto
        const novaQtd = parseFloat(valor.replace(',', '.')) || 0;

        setItens((prev) =>
            prev.map((it, idx) =>
                idx === index
                    ? {
                        ...it,
                        quantidade: novaQtd,
                        valorTotal: valorFinal(it, novaQtd)
                    }
                    : it
            )
        );
    };

    const handleQuantidadeBlur = (index) => {
        setItens((prev) =>
            prev.map((it, idx) =>
                idx === index
                    ? {
                        ...it,
                        quantidade: it.quantidade > 0 ? it.quantidade : 1,
                        valorTotal: valorFinal(it, it.quantidade > 0 ? it.quantidade : 1)
                    }
                    : it
            )
        );
    };

    const handleSalvar = async () => {
        try {
            const total = subtotal - desconto + frete;

            const venda = {
                cliente_id: clienteId || null,
                cliente: clienteNome || null,
                funcionario_id: funcionarioId || null,
                products: itens,
                subtotal,
                desconto,
                frete,
                total,
                status_id: 1, // Status "Pendente"
                tipoVenda: "Venda",
                data: new Date(),
            };

            if (!itens.length) {
                alert("Adicione ao menos um item antes de salvar a venda.");
                return;
            }

            const resposta = await registravenda(venda);

            if (resposta?.status === 201 || resposta?.ok) {
                setToast({ message: "Venda registrada com sucesso!", type: "success" });
                onSave?.(resposta.data);
                onClose?.();
            } else {
                setToast({ message: "Erro ao salvar a venda.", type: "error" });
            }
        } catch (error) {
            console.error("Erro ao registrar venda:", error);
            setToast({ message: `${error.response.data.erro}`, type: "error" });
        }
    };

    if (!open) return null;
    const total = subtotal - desconto + frete;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[90vw] max-w-5xl rounded-lg shadow-lg flex flex-col h-[90vh] overflow-hidden">
                {/* Cabeçalho */}
                <div className="flex justify-between items-center border-b px-6 py-3 bg-gray-100">
                    <h2 className="text-lg font-semibold text-gray-700">
                        Lançamento de Venda
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-red-500 text-lg font-bold"
                    >
                        ✖
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 overflow-auto p-6 flex flex-col gap-4">
                    {/* Cliente e Funcionário */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Cliente */}
                        <div className="relative">
                            <label className="text-sm font-medium">Cliente</label>
                            <input
                                type="text"
                                placeholder="Buscar cliente..."
                                value={clienteBusca}
                                onChange={(e) => {
                                    setClienteBusca(e.target.value);
                                    setClienteSelected(false);
                                }}
                                className="w-full border px-3 py-2 rounded"
                            />
                            {clientesFiltrados.length > 0 && (
                                <ul className="absolute z-20 w-full mt-1 max-h-40 overflow-y-auto bg-white border border-gray-200 rounded shadow-lg">
                                    {clientesFiltrados.map((c) => (
                                        <li
                                            key={c.id}
                                            onClick={() => {
                                                setClienteId(c.id);
                                                setClienteNome(c.nome);
                                                setClienteBusca(c.nome);
                                                setClienteSelected(true);
                                                setClientesFiltrados([]);
                                            }}
                                            className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
                                        >
                                            {c.nome}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Funcionário */}
                        <div>
                            <label className="text-sm font-medium">Funcionário</label>
                            <select
                                className="w-full border px-3 py-2 rounded"
                                value={funcionarioId}
                                onChange={(e) => setFuncionarioId(e.target.value)}
                            >
                                <option value="">Selecione o Funcionário</option>
                                {funcionarios.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.cliente.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Busca de produto */}
                    <div className="grid grid-cols-6 gap-2">
                        <input
                            ref={inputCodigoRef}
                            type="text"
                            placeholder="Código/Barras"
                            value={cEAN}
                            onChange={(e) => setCEAN(e.target.value)}
                            onBlur={buscarProdutoPorCodigo}
                            onKeyDown={(e) =>
                                e.key === "Enter" && inputDescricaoRef.current?.focus()
                            }
                            className="col-span-2 border px-2 py-1 rounded"
                        />

                        <div className="relative col-span-3">
                            <input
                                ref={inputDescricaoRef}
                                type="text"
                                placeholder="Descrição do Produto/Serviço"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full border px-2 py-1 rounded"
                            />

                            {produtosFiltrados.length > 0 && (
                                <ul
                                    className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto"
                                    ref={listaRef}
                                >
                                    {produtosFiltrados.map((p, i) => (
                                        <li
                                            key={p.id}
                                            ref={(el) => (itemRefs.current[i] = el)}
                                            onClick={() => adicionarItem(p)}
                                            className={`px-3 py-2 cursor-pointer ${i === produtoSelecionadoIndex ? "bg-blue-100" : "hover:bg-blue-50"
                                                }`}
                                        >
                                            {p.xProd} — R$ {parseFloat(p.Precos[0].preco_venda).toFixed(2)} Estoque: {p.estoque_atual}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <input
                            ref={inputQuantidadeRef}
                            type="number"
                            placeholder="Qtd"
                            min="1"
                            value={quantidade}
                            onChange={(e) => setQuantidade(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="border px-2 py-1 rounded"
                        />
                    </div>
                    {/* Se for petshop: campo de busca de pacotes */}
                    {isPetShop && (
                        <div className="grid grid-cols-6 gap-2">
                            <div className="col-span-2">
                                <label className="text-sm font-medium">Pacote</label>
                                <input
                                    ref={inputPacoteRef}
                                    type="text"
                                    placeholder="Buscar pacote..."
                                    value={pacoteDescricao}
                                    onChange={(e) => setPacoteDescricao(e.target.value)}
                                    onKeyDown={handleKeyDownPacote}
                                    className="w-full border px-2 py-1 rounded"
                                />
                                {pacotesFiltrados.length > 0 && (
                                    <ul className="absolute z-40 w-[32rem] mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                                        {pacotesFiltrados.map((p, idx) => (
                                            <li
                                                key={p.id}
                                                ref={(el) => (pacoteRefs.current[idx] = el)}
                                                onClick={() => adicionarPacote(p)}
                                                className={`px-3 py-2 cursor-pointer ${idx === pacoteSelecionadoIndex ? "bg-blue-100" : "hover:bg-blue-50"}`}
                                            >
                                                {p.nome || p.descricao} — R$ {parseFloat(p.preco_total || 0).toFixed(2)}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tabela */}
                    <div className="overflow-auto border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 border">Código</th>
                                    <th className="p-2 border text-left">Descrição</th>
                                    <th className="p-2 border text-center">Qtd</th>
                                    <th className="p-2 border text-right">Valor Unit.</th>
                                    <th className="p-2 border text-right">Subtotal</th>
                                    <th className="p-2 border text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itens.map((item, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="p-2 border text-center">{item.produto_id}</td>
                                        <td className="p-2 border">{item.descricao}</td>
                                        <td className="p-2 border text-center">
                                            <input
                                                type="number"
                                                step="any" // permite decimais
                                                value={item.quantidade}
                                                onChange={(e) => handleQuantidadeChange(i, e.target.value)}
                                                onBlur={() => handleQuantidadeBlur(i)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        inputCodigoRef.current?.focus();
                                                    }
                                                }}
                                                disabled={item.isPacote}
                                                className="w-16 text-center border rounded px-1 py-0.5"
                                                autoFocus={i === itens.length - 1} // foco no último item adicionado
                                            />
                                        </td>
                                        <td className="p-2 border text-right">
                                            {formatarMoedaBRL(item.valorUnitario)}
                                        </td>
                                        <td className="p-2 border text-right">
                                            {/* {formatarMoedaBRL(Math.round(item.valorUnitario * item.quantidade * 100) / 100)} */}
                                            {formatarMoedaBRL(item.valorTotal)}
                                        </td>

                                        <td className="p-2 border text-center">
                                            <button
                                                onClick={() => handleRemoveItem(i)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                ✖
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {itens.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="text-center text-gray-500 p-4 border"
                                        >
                                            Nenhum item adicionado
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Totais */}
                    <div className="flex justify-end gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                            <label>Subtotal (R$):</label>
                            <input
                                value={formatarMoedaBRL(subtotal)}
                                readOnly
                                className="border px-2 py-1 rounded bg-gray-100 w-24 text-right"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label>Desconto (R$):</label>
                            <input
                                type="number"
                                value={desconto}
                                onChange={(e) =>
                                    setDesconto(parseFloat(e.target.value || 0))
                                }
                                className="border px-2 py-1 rounded w-20 text-right"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label>Frete (R$):</label>
                            <input
                                type="number"
                                value={frete}
                                onChange={(e) => setFrete(parseFloat(e.target.value || 0))}
                                className="border px-2 py-1 rounded w-20 text-right"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="font-semibold">Total (R$):</label>
                            <input
                                value={formatarMoedaBRL(total)}
                                readOnly
                                className="border px-2 py-1 rounded bg-gray-100 w-28 text-right font-semibold"
                            />
                        </div>
                    </div>
                </div>

                {/* Rodapé */}
                <div className="flex justify-end gap-2 border-t px-6 py-3 bg-gray-50">
                    <button
                        onClick={handleSalvar}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                        💾 Salvar
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
            {toast.message && <Toast message={toast.message} type={toast.type} />}
        </div>
    );
}
