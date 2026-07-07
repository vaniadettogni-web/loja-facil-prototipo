import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function VendasRecentes({ lojaId, onAtualizado }) {
  const [vendas, setVendas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function carregar() {
    setCarregando(true)
    const { data } = await supabase
      .from('vendas')
      .select('*, clientes(nome)')
      .eq('loja_id', lojaId)
      .order('criado_em', { ascending: false })
      .limit(30)
    setVendas(data || [])
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [lojaId])

  async function cancelarVenda(vendaId) {
    setErro('')
    setMensagem('')
    const { error } = await supabase.rpc('cancelar_venda', { p_loja_id: lojaId, p_venda_id: vendaId })
    setConfirmandoCancelar(null)
    if (error) {
      setErro(error.message)
      return
    }
    setMensagem('Venda cancelada e estoque devolvido.')
    carregar()
    onAtualizado?.()
  }

  if (carregando) {
    return <p style={{ color: 'var(--cor-texto-suave)' }}>Carregando vendas...</p>
  }

  return (
    <div style={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {erro && <p style={{ color: 'var(--cor-erro)', fontSize: '0.9rem' }}>{erro}</p>}
      {mensagem && <p style={{ color: 'var(--cor-sucesso)', fontSize: '0.9rem' }}>{mensagem}</p>}

      {vendas.length === 0 && <p style={{ color: 'var(--cor-texto-suave)' }}>Nenhuma venda registrada ainda.</p>}

      {vendas.map((v) => (
        <div
          key={v.id}
          className="card"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: v.status === 'cancelada' ? 0.5 : 1 }}
        >
          <div>
            <strong>R$ {Number(v.valor_total).toFixed(2)}</strong>
            <span style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>
              {' '}— {v.forma_pagamento === 'a_vista' ? 'à vista' : 'crediário'}
              {v.clientes?.nome && ` · ${v.clientes.nome}`}
            </span>
            <br />
            <span style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}>
              {new Date(v.criado_em).toLocaleString('pt-BR')}
              {v.status === 'cancelada' && <span style={{ color: 'var(--cor-erro)' }}> · CANCELADA</span>}
            </span>
          </div>

          {v.status !== 'cancelada' && (
            confirmandoCancelar === v.id ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => cancelarVenda(v.id)} style={{ background: 'var(--cor-erro)', border: 'none', color: '#0A0A0A', borderRadius: 'var(--raio)', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Confirmar cancelamento
                </button>
                <button onClick={() => setConfirmandoCancelar(null)} style={{ background: 'transparent', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: 'var(--raio)', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  Voltar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmandoCancelar(v.id)}
                style={{ background: 'transparent', border: '1px solid var(--cor-erro)', color: 'var(--cor-erro)', borderRadius: 'var(--raio)', padding: '6px 10px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Cancelar venda
              </button>
            )
          )}
        </div>
      ))}
    </div>
  )
}
