// src/hooks/useClientesBusca.js

import { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { getClientes } from '../services/api';

export function useClientesBusca(edit, setToast) {
    const [clienteBusca, setClienteBusca] = useState('');
    const [clientesFiltrados, setClientesFiltrados] = useState([]);
    const [clienteSelected, setClienteSelected] = useState(false);
    const [clienteId, setClienteId] = useState(null);
    const [clienteNome, setClienteNome] = useState('');

    const buscarClientes = debounce(async (termo) => {
        if (termo.length < 3) {
            setClientesFiltrados([]);
            return;
        }

        try {
            if (!edit) {
                const res = await getClientes({ nome: termo });

                if (res.data.length === 0) {
                    setToast({ message: 'Nenhum cliente encontrado.', type: 'warning' });
                    setClientesFiltrados([]);
                } else {
                    setClientesFiltrados(res.data);
                }
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                'Erro ao buscar clientes.';

            setToast({ message: errorMessage, type: 'error' });
            setClientesFiltrados([]);
        }
    }, 500);

    useEffect(() => {
        if (!clienteSelected) {
            buscarClientes(clienteBusca);
            return () => buscarClientes.cancel();
        }
        setClienteSelected(false);
    }, [clienteBusca]);

    return {
        clienteBusca,
        setClienteBusca,
        clientesFiltrados,
        clienteSelected,
        setClienteSelected,
        clienteId,
        setClienteId,
        clienteNome,
        setClienteNome,
        setClientesFiltrados,
        buscarClientes // <-- ADICIONE ISTO

    };
}