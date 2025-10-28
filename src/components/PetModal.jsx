import { useState, useEffect } from 'react';
import { createPet } from '../services/ApiPets/ApiPets.js';
import Toast from './Toast';


const tiposDisponiveis = ['Cachorro', 'Gato', 'Pássaro', 'Roedor', 'Outro'];

const racasPorTipo = {
  Cachorro: ["Beagle", "Border Collie", "Bulldog Francês", "Cocker Spaniel", "Chihuahua", "Dachshund (Teckel)", "Golden Retriever", "Husky Siberiano", "Labrador Retriever", "Lhasa Apso", "Maltês", "Pastor Alemão", "Pinscher", "Poodle", "Pug", "Rottweiler", "Schnauzer", "Shih Tzu", "SRD (Sem Raça Definida)", "Yorkshire Terrier"],
  Gato: ["Abissínio", "American Shorthair", "Angorá", "Bengal", "Birmanês", "British Shorthair", "Exótico de Pelo Curto", "Himalaio", "Maine Coon", "Norueguês da Floresta", "Oriental", "Persa", "Ragdoll", "Savannah", "Scottish Fold", "Siamês", "Somali", "Sphynx", "SRD (Sem Raça Definida)", "Tonquinês"],
  Pássaro: ["Agapornis (Inseparável)", "Arara", "Bicudo", "Cacatua", "Calopsita", "Canário", "Coleiro", "Curió", "Diamante de Gould", "Jandaia", "Manon", "Maritaca", "Mandarim", "Papagaio", "Periquitão-Maracanã", "Periquito Australiano", "Ring Neck", "Sabiá", "Trinca-Ferro", "Tucano"],
  Roedor: ["Camundongo", "Capivara", "Chinchila", "Coelho Angorá", "Coelho Belier", "Coelho Califórnia", "Coelho Holandês", "Coelho Lionhead", "Coelho Mini Lop", "Coelho Mini Rex", "Coelho Nova Zelândia", "Coelho Rex", "Degus", "Esquilo-da-Mongólia", "Gerbil", "Hamster Anão Russo", "Hamster Chinês", "Hamster Sírio", "Porquinho-da-Índia", "Rato Doméstico"],
  Outro: ["Outro"]
};

export default function PetModal({ clienteId, pet, onClose, onSuccess, historico = [] }) {
  const [activeTab, setActiveTab] = useState('geral');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [raca, setRaca] = useState('');
  const [peso, setPeso] = useState('');
  const [sexo, setSexo] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pet) {
      setNome(pet.nome || '');
      setTipo(pet.tipo || '');
      setRaca(pet.raca || '');
      setPeso(pet.peso || '');
      setSexo(pet.sexo || '');
      setNascimento(pet.nascimento || '');
      setObservacoes(pet.observacoes || '');
    } else {
      setNome('');
      setTipo('');
      setRaca('');
      setPeso('');
      setSexo('');
      setNascimento('');
      setObservacoes('');
    }
  }, [pet]);

  useEffect(() => {
    if (!racasPorTipo[tipo]?.includes(raca)) setRaca('');
  }, [tipo]);

  const handleSubmit = async () => {
    if (!nome || !tipo || !raca || !peso || !sexo) {
      return alert('Preencha todos os campos obrigatórios');
    }

    try {
      setLoading(true);
      const petData = {
        nome,
        tipo,
        raca,
        peso,
        sexo,
        nascimento,
        observacoes,
        clienteId,
      };

      const response = await createPet(petData);

      setToast({ message: `Pet ${response.nome} salvo com sucesso!`, type: 'success' });
      setLoading(false);

      // Chama o callback onSuccess para atualizar o modal pai
      if (onSuccess) onSuccess(response);

      onClose();
    } catch (err) {
      console.error(err);
      setToast({ message: 'Erro ao salvar pet.', type: 'error' });
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-lg relative overflow-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">{pet ? 'Editar Pet' : 'Novo Pet'}</h2>

        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${activeTab === 'geral' ? 'border-b-2 border-blue-600' : ''}`}
            onClick={() => setActiveTab('geral')}
          >
            Dados Gerais
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'historico' ? 'border-b-2 border-blue-600' : ''}`}
            onClick={() => setActiveTab('historico')}
          >
            Histórico
          </button>
        </div>

        {/* Conteúdo */}
        {activeTab === 'geral' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="border p-2 rounded w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo *</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} className="border p-2 rounded w-full">
                <option value="">Selecione</option>
                {tiposDisponiveis.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Raça *</label>
              <select value={raca} onChange={e => setRaca(e.target.value)} className="border p-2 rounded w-full" disabled={!tipo}>
                <option value="">Selecione</option>
                {tipo && racasPorTipo[tipo].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sexo *</label>
              <select value={sexo} onChange={e => setSexo(e.target.value)} className="border p-2 rounded w-full">
                <option value="">Selecione</option>
                <option value="M">Macho</option>
                <option value="F">Fêmea</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Peso (kg) *</label>
              <input type="number" value={peso} onChange={e => setPeso(e.target.value)} className="border p-2 rounded w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data de nascimento</label>
              <input type="date" value={nascimento} onChange={e => setNascimento(e.target.value)} className="border p-2 rounded w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} className="border p-2 rounded w-full" rows={3} />
            </div>
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="overflow-auto max-h-[60vh]">
            {historico.length === 0 ? (
              <p className="text-gray-500">Nenhum registro histórico.</p>
            ) : (
              <table className="w-full text-left border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Data</th>
                    <th className="p-2 border">Tipo</th>
                    <th className="p-2 border">Descrição</th>
                    <th className="p-2 border">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-2 border">{item.data}</td>
                      <td className="p-2 border">{item.tipo}</td>
                      <td className="p-2 border">{item.descricao}</td>
                      <td className="p-2 border">{item.observacoes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition w-full md:w-auto">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition w-full md:w-auto">
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
      {toast.message && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast({ message: '', type: '' })} />
      )}
    </div>

  );
}
