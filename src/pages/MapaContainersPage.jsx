import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { getAllContainers } from '../services/api';

// Corrigir ícones do Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function FixMapSize() {
    const map = useMap();

    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize(); // força o mapa a ajustar a si mesmo
        }, 300); // delay pra garantir que layout terminou de montar
    }, [map]);

    return null;
}


export default function MapaContainersPage() {
    const [containers, setContainers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContainers();
    }, []);

    const fetchContainers = async () => {
        try {
            // Exemplo: se sua API aceita paginação, use um pageSize grande
            const res = await getAllContainers({ page: 1, pageSize: 1000 });
            const data = res?.data || [];

            const containersComCoords = data.filter(c => {
                const coords = c.localizacao_atual?.split(',');
                return coords?.length === 2 && !isNaN(parseFloat(coords[0])) && !isNaN(parseFloat(coords[1]));
            });

            setContainers(containersComCoords);
        } catch (error) {
            console.error('Erro ao carregar containers:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div id="containers-container">
            <h1 className="title-page">Containers Localizações</h1>
            <div id="results-container">

                <div className="w-full h-[calc(100vh-64px)] overflow-hidden relative z-0">
                    <MapContainer
                        center={[-15.55, -54.30]}
                        zoom={13}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <FixMapSize /> {/* <-- aqui */}

                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {!loading && containers.map(container => {
                            const [lat, lng] = container.localizacao_atual.split(',').map(coord => parseFloat(coord.trim()));

                            return (
                                <Marker key={container.id} position={[lat, lng]}>
                                    <Popup autoPan={false}>
                                        <strong>{container.codigo_identificacao}</strong><br />
                                        {container.descricao}<br />
                                        Status: {container.status_nome}<br />
                                        {container.observacoes && <em>{container.observacoes}</em>}
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}
