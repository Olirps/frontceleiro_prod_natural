import { useState } from 'react';
import {
  addProdutos,
  updateProduto,
  inativarProduto,
  getProdutoById
} from '../services/api';

export const useProduto = () => {
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

  return {
    loading,
    error,
    createProduto,
    updateProdutoData,
    toggleProdutoStatus,
    fetchProduto,
  };
};