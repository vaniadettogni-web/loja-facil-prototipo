import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function SeletorCliente({ lojaId, clienteSelecionado, onSelecionar }) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [mostrandoNovo, setMostrandoNovo] = useState(false)
  const [nomeNovo, setNomeNovo] = useState('')
  const [telefoneNovo, setTelefoneNovo] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!busca.trim()) {
      setResultados([])
      return
    }
    const termo = busca.trim()
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .eq('loja_id', lojaId)
        .or(`nome.ilike.%${termo}%,telefone.ilike.%${termo}%`)
        .limit(5)
      setResultados(data || [])
    }, 300)
    return () => clearTimeout(timeout)
  }, [busca, lojaId])

  async function criarCliente(e) {
    e.preventDefault()
    setSalvando(true)
    const { data, error } = await supabase
      .from('clientes')
      .insert({ loja_id: lojaId, nome: nomeNovo, telefone: telefoneNovo })
      .select()
      .single()
    setSalvando(false)
    if (!error) {
      onSelecionar(data)
      setMostrandoNovo(false)
      setNomeNovo('')
      setTelefoneNovo('')
      setBusca('')
    }
  }

  if (clienteSelecionado) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio)', padding: '10px 14px' }}>
        <span>{clienteSelecionado.nome} {clienteSelecionado.telefone && `· ${clienteSelecionado.telefone}`}</span>
        <button onClick={() => onSelecionar(null)} style={{ background: 'transparent', border: 'none', color: 'var(--cor-texto-suave)', cursor: 'pointer' }}>Trocar</button>
      </div>
    )
  }

  if (mostrandoNovo) {
    return (
      <form onSubmit={criarCliente} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input placeholder="Nome do cliente" value={nomeNovo} onChange={(e) => setNomeNovo(e.target.value)} required style={estiloInput} />
        <input placeholder="Telefone" value={telefoneNovo} onChange={(e) => setTelefoneNovo(e.target.value)} style={estiloInput} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="botao" type="submit" disabled={salvando} style={{ flex: 1 }}>{salvando ? 'Salvando...' : 'Criar cliente'}</button>
          <button type="button" onClick={() => setMostrandoNovo(false)} style={{ flex: 1, background: 'transparent', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: 'var(--raio)', cursor: 'pointer' }}>Cancelar</button>
        </div>
      </form>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        placeholder="Buscar cliente por nome ou telefone"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={estiloInput}
      />
      {resultados.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {resultados.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelecionar(c)}
              style={{ textAlign: 'left', background: 'var(--cor-fundo-elevado)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio)', padding: '8px 12px', color: 'var(--cor-texto)', cursor: 'pointer' }}
            >
              {c.nome} {c.telefone && `· ${c.telefone}`}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setMostrandoNovo(true)}
        style={{ background: 'transparent', border: '1px dashed var(--cor-borda)', color: 'var(--cor-dourado)', borderRadius: 'var(--raio)', padding: '8px', cursor: 'pointer' }}
      >
        + Cadastrar novo cliente
      </button>
    </div>
  )
}

const estiloInput = {
  background: 'var(--cor-fundo)',
  border: '1px solid var(--cor-borda)',
  borderRadius: 'var(--raio)',
  padding: '10px 14px',
  color: 'var(--cor-texto)',
  width: '100%',
}
