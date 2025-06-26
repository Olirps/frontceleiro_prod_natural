import React from 'react';
import { cpfCnpjMask } from '../../../components/utils';

function SearchFormVendas({
  filters,
  setFilters, // ✅ adicionar isso aqui
  tiposPagamento,
  somarLancamentosManuais,
  onSearch,
  onClear,
  onCpfChange,
  onPrint,
  onSetSomarLancamentos,
  onCadastrarModal
}) {
  return (
    <div id="search-vendas">
      <div id="search-fields-vendas">
        <div className="field-group">
          <div className="field-line">
            <label htmlFor="cliente">Cliente</label>
            <input
              className="input-consulta-vendas"
              type="text"
              id="cliente"
              value={filters.nome}
              onChange={(e) => setFilters(prev => ({ ...prev, nome: e.target.value }))}
              maxLength="150"
            />
            <label htmlFor="cpf">CPF/CNPJ</label>
            <input
              className="input-consulta-vendas"
              type="text"
              id="cpf"
              value={filters.cpfCnpj}
              onChange={onCpfChange}
            />
          </div>
          <div className="field-line">
            <label htmlFor="dataVendaInicial">Data Inicial</label>
            <input
              className="input-consulta-vendas"
              type="date"
              id="dataVendaInicial"
              value={filters.dataVendaInicial}
              onChange={(e) => setFilters(prev => ({ ...prev, dataVendaInicial: e.target.value }))}
            />
            <label htmlFor="dataVendaFinal">Data Final</label>
            <input
              className="input-consulta-vendas"
              type="date"
              id="dataVendaFinal"
              value={filters.dataVendaFinal}
              onChange={(e) => setFilters(prev => ({ ...prev, dataVendaFinal: e.target.value }))}
            />
          </div>
          <div className="field-line">
            <label htmlFor="tipoVenda">Tipo de Venda</label>
            <select
              className="input-consulta-vendas"
              id="tipoVenda"
              value={filters.tipoVenda}
              onChange={(e) => setFilters(prev => ({ ...prev, tipoVenda: e.target.value }))}
            >
              <option value="">Todos</option>
              {tiposPagamento.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={somarLancamentosManuais}
                onChange={() => onSetSomarLancamentos(!somarLancamentosManuais)}
              />
              Deseja Somar os Lançamentos Manuais?
            </label>
          </div>
        </div>
      </div>
      <div id="button-vendas-group">
        <button onClick={onSearch} className="button-vendas">Pesquisar</button>
        <button onClick={onClear} className="button-vendas">Limpar</button>
        <button onClick={onPrint} className="button-vendas">Imprimir</button>
        <button onClick={onCadastrarModal} className="button-vendas">Lançar Venda</button>
      </div>
    </div>
  );
}

export default SearchFormVendas;