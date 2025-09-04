export const menuData = [
  {
    id: 'home',
    label: 'Home',
    path: '/home',
    permission: 'home'
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    permission: ['permissoes', 'clientes', 'funcionarios', 'fornecedores', 'produtos', 'veiculos', 'contasbancarias', 'osstatus'],
    submenu: [
      {
        id: 'permissoes',
        label: 'Permissões',
        path: '/permissoes',
        permission: 'permissoes'
      },
      {
        id: 'empresas',
        label: 'Empresas',
        path: '/empresas',
        permission: 'empresas'
      },
      {
        id: 'pessoas',
        label: 'Pessoas',
        permission: ['clientes', 'funcionarios', 'fornecedores'],
        submenu: [
          {
            id: 'clientes',
            label: 'Clientes',
            path: '/clientes',
            permission: 'clientes'
          },
          {
            id: 'funcionarios',
            label: 'Funcionários',
            path: '/funcionarios',
            permission: 'funcionarios'
          },
          {
            id: 'fornecedores',
            label: 'Fornecedores',
            path: '/fornecedores',
            permission: 'fornecedores'
          }
        ]
      },
      {
        id: 'produtos',
        label: 'Produtos',
        permission: ['produtos', 'grupoproduto', 'subgrupoproduto'],
        submenu: [
          {
            id: 'grupoproduto',
            label: 'Grupos',
            path: '/grupoproduto',
            permission: 'grupoproduto'
          },
          {
            id: 'subgrupoproduto',
            label: 'Sub Grupos',
            path: '/subgrupoproduto',
            permission: 'subgrupoproduto'
          },
          {
            id: 'produtos',
            label: 'Produtos/Serviços',
            path: '/produtos',
            permission: 'produtos'
          }
        ]
      },
      {
        id: 'osstatus',
        label: 'Status O.S.',
        path: '/osstatus',
        permission: 'osstatus'
      },
      {
        id: 'veiculos',
        label: 'Veículos',
        path: '/veiculos',
        permission: 'veiculos'
      },
      {
        id: 'contasbancarias',
        label: 'Contas Bancárias',
        path: '/contasbancarias',
        permission: 'contasbancarias'
      },
      {
        id: 'contrato',
        label: 'Contrato',
        permission: ['tipolayout', 'contratolayout'],
        submenu: [
          {
            id: 'tipolayout',
            label: 'Tipo Layout',
            path: '/tipolayout',
            permission: 'tipolayout'
          },
          {
            id: 'contratolayout',
            label: 'Contrato Layout',
            path: '/contratolayout',
            permission: 'contratolayout'
          }
        ]
      },
      {
        id: 'container',
        label: 'Containers',
        path: '/container',
        permission: 'container'
      }
    ]
  },
  {
    id: 'movimentacao',
    label: 'Movimentação',
    permission: ['notafiscal', 'movimentacaoprodutos', 'vendas', 'os'],
    submenu: [
      {
        id: 'notafiscal',
        label: 'Lançar NF-e',
        path: '/notafiscal',
        permission: 'notafiscal'
      },
      {
        id: 'vendas',
        label: 'Vendas',
        path: '/vendas',
        permission: 'vendas'
      },
      {
        id: 'container-movimentacao',
        label: 'Containers',
        permission: ['container-movimentacao', 'container-localiza'],
        submenu: [
          {
            id: 'container-movimentacao',
            label: 'Movimentação',
            path: '/container-movimentacao',
            permission: 'container-movimentacao'
          },
          {
            id: 'container-localiza',
            label: 'Localização',
            path: '/container-localiza',
            permission: 'container-localiza'
          }
        ]
      },
      {
        id: 'os',
        label: 'Ordem de Serviço',
        path: '/os',
        permission: 'os'
      },
      {
        id: 'movimentacaoprodutos',
        label: 'Movimentação de Produtos',
        path: '/movimentacaoprodutos',
        permission: 'movimentacaoprodutos'
      }
    ]
  },
  {
    id: 'gestao-financeira',
    label: 'Gestão Financeira',
    permission: ['contaspagar', 'movimentacaofinanceiradespesas', 'movimentacaofinanceirareceitas'],
    submenu: [
      {
        id: 'movimentacaofinanceiradespesas',
        label: 'Contas a Pagar',
        path: '/movimentacaofinanceiradespesas',
        permission: 'movimentacaofinanceiradespesas'
      },
      {
        id: 'movimentacaofinanceirareceitas',
        label: 'Contas a Receber',
        path: '/movimentacaofinanceirareceitas',
        permission: 'movimentacaofinanceirareceitas'
      },
      {
        id: 'movimentacaotef',
        label: 'Recebimento TEF',
        path: '/movimentacaotef',
        permission: 'movimentacaotef'
      },
    ]
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    permission: ['relatorios', 'produtosvendidos', 'contaspendentes', 'estoque'],
    submenu: [
      {
        id: 'produtosvendidos',
        label: 'Produtos Vendidos',
        path: '/produtosvendidos',
        permission: 'produtosvendidos'
      },
      {
        id: 'contaspendentes',
        label: 'Contas Pendentes',
        path: '/contaspendentes',
        permission: 'contaspendentes'
      },
      {
        id: 'contasliquidadas',
        label: 'Contas/Parcelas Liquidadas',
        path: '/contasliquidadas',
        permission: 'contasliquidadas'
      },
      {
        id: 'estoque',
        label: 'Estoque',
        path: '/estoque',
        permission: 'estoque'
      },
      {
        id: 'vendas-relatorios',
        label: 'Relatórios de Vendas',
        permission: ['vendas-relatorios', 'vendas_por_cliente_periodo'],
        submenu: [
          {
            id: 'vendas_por_cliente_periodo',
            label: 'Clientes/Período',
            path: '/clientes_periodo',
            permission: 'vendas_por_cliente_periodo'
          }
        ]
      },
      {
        id: 'financeiro-relatorios',
        label: 'Financeiro',
        permission: ['financeiro', 'fluxo-caixa'],
        submenu: [
          {
            id: 'fluxo-caixa',
            label: 'Fluxo de Caixa',
            path: '/fluxo-caixa',
            permission: 'fluxo-caixa'
          }
        ]
      }
    ]
  }
];