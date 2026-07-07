import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function FichaCliente({ cliente, onFechar, onAtualizado }) {
  const [vendas, setVendas] = useState([])
  const [parcelas, setParcelas] = useState([])
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const [{ data: vendasData }, { data: parcelasData }] = await Promise.all([
      supabase.from('vendas').select('*').eq('cliente_id', cliente.id).order('criado_em', { ascending: false }),
      supabase.from('crediario_parcelas').select('*').eq('cliente_id', cliente.id).order('vencimento', { ascending: true }),
    ])
    setVendas(vendasData || [])
    setParcelas(parcelasData || [])
    setCarregando(false)
  }, [cliente.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function darBaixa(parcelaId) {
    await supabase
      .from('crediario_parcelas')
      .update({ status: 'pago', data_pagamento: new Date().toISOString().slice(0, 10) })
      .eq('id', parcelaId)
    carregar()
    onAtualizado?.()
  }

  const parcelasPendentes = parcelas.filter((p) => p.status !== 'pago')
  const parcelasPagas = parcelas.filter((p) => p.status === 'pago')
  const totalDevendo = parcelasPendentes.reduce((soma, p) => soma + Number(p.valor), 0)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: 'var(--cor-dourado)' }}>{cliente.nome}</h3>
          {cliente.telefone && <p style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>{cliente.telefone}</p>}
        </div>
        <button onClick={onFechar} style={{ background: 'transparent', border: 'none', color: 'var(--cor-texto-suave)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
      </div>

      {carregando ? (
        <p style={{ color: 'var(--cor-texto-suave)' }}>Carregando...</p>
      ) : (
        <>
          <div style={{ background: 'var(--cor-fundo)', padding: 12, borderRadius: 'var(--raio)' }}>
            <strong style={{ color: totalDevendo > 0 ? 'var(--cor-alerta)' : 'var(--cor-sucesso)' }}>
              {totalDevendo > 0 ? `Em aberto: R$ ${totalDevendo.toFixed(2)}` : 'Sem pendências'}
            </strong>
          </div>

          <div>
            <h4 style={{ color: 'var(--cor-texto-suave)', fontSize: '1rem', marginBottom: 8 }}>Parcelas pendentes</h4>
            {parcelasPendentes.length === 0 && <p style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>Nenhuma parcela em aberto.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {parcelasPendentes.map((p) => {
                const atrasada = new Date(p.vencimento) < new Date() && p.status !== 'pago'
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio)', padding: '8px 12px' }}>
                    <div>
                      <span>Parcela {p.numero_parcela} — R$ {Number(p.valor).toFixed(2)}</span>
                      <br />
                      <span style={{ fontSize: '0.8rem', color: atrasada ? 'var(--cor-erro)' : 'var(--cor-texto-suave)' }}>
                        Vence {new Date(p.vencimento).toLocaleDateString('pt-BR')} {atrasada && '· Atrasada'}
                      </span>
                    </div>
                    <button
                      onClick={() => darBaixa(p.id)}
                      style={{ background: 'transparent', border: '1px solid var(--cor-sucesso)', color: 'var(--cor-sucesso)', borderRadius: 'var(--raio)', padding: '6px 10px', cursor: 'pointer' }}
                    >
                      Dar baixa
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {parcelasPagas.length > 0 && (
            <div>
              <h4 style={{ color: 'var(--cor-texto-suave)', fontSize: '1rem', marginBottom: 8 }}>Parcelas pagas</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {parcelasPagas.map((p) => (
                  <span key={p.id} style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)' }}>
                    Parcela {p.numero_parcela} — R$ {Number(p.valor).toFixed(2)} · pago em {new Date(p.data_pagamento).toLocaleDateString('pt-BR')}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 style={{ color: 'var(--cor-texto-suave)', fontSize: '1rem', marginBottom: 8 }}>Histórico de compras</h4>
            {vendas.length === 0 && <p style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>Nenhuma compra registrada ainda.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {vendas.map((v) => (
                <span key={v.id} style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)' }}>
                  {new Date(v.criado_em).toLocaleDateString('pt-BR')} — R$ {Number(v.valor_total).toFixed(2)} ({v.forma_pagamento === 'a_vista' ? 'à vista' : 'crediário'})
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
