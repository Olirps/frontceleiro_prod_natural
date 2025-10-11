import { useState } from 'react';
import {
  addProdutos,
  updateProduto,
  inativarProduto,
  getProdutoById,
  getProdutos
} from '../services/api';

export const useProduto = (nome = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createProduto = async (produtoData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await addProdutos(produtoData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao cadastrar produto');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProdutoData = async (id, produtoData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await updateProduto(id, produtoData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao atualizar produto');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleProdutoStatus = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await inativarProduto(id);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao alterar status do produto');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchProduto = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProdutoById(id);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.erro || 'Erro ao buscar produto');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // NOVO: buscar produtos por nome
  const searchProdutos = async (nome) => {
    setLoading(true);
    setError(null);
    try {
      const params = nome ? { nome } : {};
      await getProdutos(params); // Chama a função para registrar a busca
      const response = await getProdutos(params);
      if (!response) throw new Error('Erro ao buscar produtos');
      const data = response.data;
      return data; // espera um array de produtos
    } catch (err) {
      setError(err.message || 'Erro ao buscar produtos');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createProduto,
    updateProdutoData,
    toggleProdutoStatus,
    fetchProduto,
    searchProdutos, // retorna a nova função
  };
};
