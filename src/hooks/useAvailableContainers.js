// src/hooks/useAvailableContainers.js
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { getAvailableContainers } from '../services/api';

export function useAvailableContainers(codigoBusca) {
    const [containersDisponiveis, setContainersDisponiveis] = useState([]);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState(null);

    const fetchContainers = debounce(async (codigo_identificacao) => {
        if (!codigo_identificacao || codigo_identificacao.length < 3) {
            setContainersDisponiveis([]);
            return;
        }

        setLoading(true);
        try {
            const res = await getAvailableContainers({ codigo_identificacao });
            if(res?.length === 0) {
                setContainersDisponiveis([]);
                setErro('Nenhum container encontrado');
                return;
            }
            setContainersDisponiveis(res || []);
            setErro(null);
        } catch (err) {
            console.error('Erro ao buscar containers disponíveis:', err);
            setErro('Erro ao buscar containers disponíveis');
            setContainersDisponiveis([]);
        } finally {
            setLoading(false);
        }
    }, 500);

    useEffect(() => {
        fetchContainers(codigoBusca);
        return () => fetchContainers.cancel();
    }, [codigoBusca]);

    return {
        containersDisponiveis,
        loading,
        erro
    };
}
