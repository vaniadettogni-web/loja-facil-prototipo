import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import FichaCliente from './FichaCliente'

export default function ListaClientes({ lojaId }) {
  const [clientes, setClientes] = useState([])
  const [busca, setBusca] = useState('')
  const [clienteAberto, setClienteAberto] = useState(null)

  async function carregarClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('*, crediario_parcelas(valor, valor_pago, status)')
      .eq('loja_id', lojaId)
      .order('nome', { ascending: true })
    setClientes(data || [])
  }

  useEffect(() => {
    carregarClientes()
  }, [lojaId])

  const clientesFiltrados = useMemo(() => {
    if (!busca.trim()) return clientes
    const termo = busca.toLowerCase()
    return clientes.filter(
      (c) => c.nome.toLowerCase().includes(termo) || (c.telefone || '').includes(termo)
    )
  }, [clientes, busca])

  function devendoDoCliente(cliente) {
    return (cliente.crediario_parcelas || [])
      .filter((p) => p.status !== 'pago')
      .reduce((soma, p) => soma + (Number(p.valor) - Number(p.valor_pago)), 0)
  }

  return (
    <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        placeholder="Buscar cliente por nome ou telefone..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ width: '100%', maxWidth: 400, background: 'var(--cor-fundo-elevado)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio)', padding: '10px 14px', color: 'var(--cor-texto)' }}
      />

      {clienteAberto && (
        <FichaCliente
          cliente={clienteAberto}
          lojaId={lojaId}
          onFechar={() => setClienteAberto(null)}
          onAtualizado={carregarClientes}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {clientesFiltrados.length === 0 && <p style={{ color: 'var(--cor-texto-suave)' }}>Nenhum cliente cadastrado ainda.</p>}
        {clientesFiltrados.map((c) => {
          const devendo = devendoDoCliente(c)
          return (
            <button
              key={c.id}
              onClick={() => setClienteAberto(c)}
              className="card"
              style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4, color: 'var(--cor-texto)' }}
            >
              <strong>{c.nome}</strong>
              {c.telefone && <span style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>{c.telefone}</span>}
              <span style={{ fontSize: '0.85rem', color: devendo > 0 ? 'var(--cor-alerta)' : 'var(--cor-sucesso)' }}>
                {devendo > 0 ? `Deve R$ ${devendo.toFixed(2)}` : 'Em dia'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
