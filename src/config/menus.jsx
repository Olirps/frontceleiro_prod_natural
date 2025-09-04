export const menus = [
  {
    label: "Home",
    path: "/home"
  },
  {
    label: "Cadastros",
    children: [
      { label: "Permissões", path: "/permissoes" },
      { label: "Empresas", path: "/empresas" },
      {
        label: "Pessoas",
        children: [
          { label: "Clientes", path: "/clientes" },
          { label: "Funcionários", path: "/funcionarios" },
          { label: "Fornecedores", path: "/fornecedores" }
        ]
      },
      {
        label: "Produtos",
        children: [
          { label: "Grupos", path: "/grupoproduto" },
          { label: "Sub Grupos", path: "/subgrupoproduto" },
          { label: "Produtos/Serviços", path: "/produtos" }
        ]
      },
      { label: "Status O.S.", path: "/osstatus" },
      { label: "Veículos", path: "/veiculos" },
      { label: "Contas Bancárias", path: "/contasbancarias" },
      {
        label: "Contrato",
        children: [
          { label: "Tipo Layout", path: "/tipolayout" },
          { label: "Contrato Layout", path: "/contratolayout" }
        ]
      },
      { label: "Containers", path: "/container" }
    ]
  },
  {
    label: "Movimentação",
    children: [
      { label: "Lançar NF-e", path: "/notafiscal" },
      { label: "Vendas", path: "/vendas" },
      {
        label: "Containers",
        children: [
          { label: "Movimentação", path: "/container-movimentacao" },
          { label: "Localização", path: "/container-localiza" }
        ]
      },
      { label: "Ordem de Serviço", path: "/os" },
      { label: "Movimentação de Produtos", path: "/movimentacaoprodutos" }
    ]
  },
  {
    label: "Gestão Financeira",
    children: [
      { label: "Contas a Pagar", path: "/movimentacaofinanceiradespesas" },
      { label: "Contas a Receber", path: "/movimentacaofinanceirareceitas" }
    ]
  },
  {
    label: "Relatórios",
    children: [
      { label: "Produtos Vendidos", path: "/produtosvendidos" },
      { label: "Contas Pendentes", path: "/contaspendentes" },
      { label: "Contas/Parcelas Liquidadas", path: "/contasliquidadas" },
      { label: "Estoque", path: "/estoque" }
    ]
  }
];
