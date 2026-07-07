import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function FichaCliente({ cliente, lojaId, onFechar, onAtualizado }) {
  const [vendas, setVendas] = useState([])
  const [parcelas, setParcelas] = useState([])
  const [pagamentos, setPagamentos] = useState([])
  const [clienteAtual, setClienteAtual] = useState(cliente)
  const [carregando, setCarregando] = useState(true)
  const [valorPagamento, setValorPagamento] = useState('')
  const [registrando, setRegistrando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [confirmandoEstorno, setConfirmandoEstorno] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const [{ data: vendasData }, { data: parcelasData }, { data: clienteData }, { data: pagamentosData }] = await Promise.all([
      supabase.from('vendas').select('*').eq('cliente_id', cliente.id).order('criado_em', { ascending: false }),
      supabase.from('crediario_parcelas').select('*').eq('cliente_id', cliente.id).order('vencimento', { ascending: true }),
      supabase.from('clientes').select('*').eq('id', cliente.id).single(),
      supabase.from('pagamentos_crediario').select('*').eq('cliente_id', cliente.id).order('criado_em', { ascending: false }),
    ])
    setVendas(vendasData || [])
    setParcelas(parcelasData || [])
    setClienteAtual(clienteData || cliente)
    setPagamentos(pagamentosData || [])
    setCarregando(false)
  }, [cliente.id])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function quitarParcela(parcelaId) {
    setErro('')
    const { error } = await supabase.rpc('quitar_parcela', { p_loja_id: lojaId, p_parcela_id: parcelaId })
    if (error) {
      setErro(error.message)
      return
    }
    carregar()
    onAtualizado?.()
  }

  async function registrarPagamento(e) {
    e.preventDefault()
    setErro('')
    setMensagem('')
    const valor = parseFloat(String(valorPagamento).replace(',', '.'))
    if (!valor || valor <= 0) {
      setErro('Digite um valor válido.')
      return
    }

    setRegistrando(true)
    try {
      const { error } = await supabase.rpc('registrar_pagamento_cliente', {
        p_loja_id: lojaId,
        p_cliente_id: cliente.id,
        p_valor: valor,
      })
      if (error) throw error

      setMensagem(`Pagamento de R$ ${valor.toFixed(2)} registrado com sucesso.`)
      setValorPagamento('')
      carregar()
      onAtualizado?.()
    } catch (err) {
      setErro(err.message)
    } finally {
      setRegistrando(false)
    }
  }

  async function estornarPagamento(pagamentoId) {
    setErro('')
    const { error } = await supabase.rpc('estornar_pagamento', { p_loja_id: lojaId, p_pagamento_id: pagamentoId })
    setConfirmandoEstorno(null)
    if (error) {
      setErro(error.message)
      return
    }
    setMensagem('Pagamento estornado com sucesso.')
    carregar()
    onAtualizado?.()
  }

  const parcelasPendentes = parcelas.filter((p) => p.status !== 'pago')
  const parcelasPagas = parcelas.filter((p) => p.status === 'pago')
  const totalDevendo = parcelasPendentes.reduce((soma, p) => soma + (Number(p.valor) - Number(p.valor_pago)), 0)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: 'var(--cor-dourado)' }}>{clienteAtual.nome}</h3>
          {clienteAtual.telefone && <p style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>{clienteAtual.telefone}</p>}
        </div>
        <button onClick={onFechar} style={{ background: 'transparent', border: 'none', color: 'var(--cor-texto-suave)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
      </div>

      {carregando ? (
        <p style={{ color: 'var(--cor-texto-suave)' }}>Carregando...</p>
      ) : (
        <>
          <div style={{ background: 'var(--cor-fundo)', padding: 12, borderRadius: 'var(--raio)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <strong style={{ color: totalDevendo > 0 ? 'var(--cor-alerta)' : 'var(--cor-sucesso)' }}>
              {totalDevendo > 0 ? `Em aberto: R$ ${totalDevendo.toFixed(2)}` : 'Sem pendências'}
            </strong>
            {clienteAtual.credito_disponivel > 0 && (
              <span style={{ color: 'var(--cor-sucesso)', fontSize: '0.85rem' }}>
                Crédito disponível: R$ {Number(clienteAtual.credito_disponivel).toFixed(2)} (pago a mais em alguma parcela)
              </span>
            )}
          </div>

          {erro && <p style={{ color: 'var(--cor-erro)', fontSize: '0.85rem' }}>{erro}</p>}
          {mensagem && <p style={{ color: 'var(--cor-sucesso)', fontSize: '0.85rem' }}>{mensagem}</p>}

          {parcelasPendentes.length > 0 && (
            <form onSubmit={registrarPagamento} style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--cor-fundo)', padding: 12, borderRadius: 'var(--raio)' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--cor-texto-suave)' }}>
                Registrar pagamento (qualquer valor — abate das parcelas mais antigas primeiro)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="Ex: 50,00"
                  value={valorPagamento}
                  onChange={(e) => setValorPagamento(e.target.value)}
                  style={{ flex: 1, background: 'var(--cor-fundo-elevado)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio)', padding: '8px 12px', color: 'var(--cor-texto)' }}
                />
                <button className="botao" type="submit" disabled={registrando}>
                  {registrando ? 'Aguarde...' : 'Registrar'}
                </button>
              </div>
            </form>
          )}

          <div>
            <h4 style={{ color: 'var(--cor-texto-suave)', fontSize: '1rem', marginBottom: 8 }}>Parcelas pendentes</h4>
            {parcelasPendentes.length === 0 && <p style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>Nenhuma parcela em aberto.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {parcelasPendentes.map((p) => {
                const atrasada = new Date(p.vencimento) < new Date()
                const restante = Number(p.valor) - Number(p.valor_pago)
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio)', padding: '8px 12px' }}>
                    <div>
                      <span>
                        Parcela {p.numero_parcela} — R$ {Number(p.valor).toFixed(2)}
                        {p.status === 'parcial' && (
                          <span style={{ color: 'var(--cor-alerta)' }}> (pago R$ {Number(p.valor_pago).toFixed(2)}, falta R$ {restante.toFixed(2)})</span>
                        )}
                      </span>
                      <br />
                      <span style={{ fontSize: '0.8rem', color: atrasada ? 'var(--cor-erro)' : 'var(--cor-texto-suave)' }}>
                        Vence {new Date(p.vencimento).toLocaleDateString('pt-BR')} {atrasada && '· Atrasada'}
                      </span>
                    </div>
                    <button
                      onClick={() => quitarParcela(p.id)}
                      style={{ background: 'transparent', border: '1px solid var(--cor-sucesso)', color: 'var(--cor-sucesso)', borderRadius: 'var(--raio)', padding: '6px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Quitar total
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {pagamentos.length > 0 && (
            <div>
              <h4 style={{ color: 'var(--cor-texto-suave)', fontSize: '1rem', marginBottom: 8 }}>Pagamentos registrados</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pagamentos.map((pg) => (
                  <div key={pg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio)', padding: '8px 12px', opacity: pg.estornado ? 0.5 : 1 }}>
                    <span style={{ fontSize: '0.85rem' }}>
                      R$ {Number(pg.valor).toFixed(2)} em {new Date(pg.criado_em).toLocaleDateString('pt-BR')}
                      {pg.estornado && <span style={{ color: 'var(--cor-erro)' }}> · estornado</span>}
                    </span>
                    {!pg.estornado && (
                      confirmandoEstorno === pg.id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => estornarPagamento(pg.id)} style={{ background: 'var(--cor-erro)', border: 'none', color: '#0A0A0A', borderRadius: 'var(--raio)', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>Confirmar</button>
                          <button onClick={() => setConfirmandoEstorno(null)} style={{ background: 'transparent', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: 'var(--raio)', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>Cancelar</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmandoEstorno(pg.id)} style={{ background: 'transparent', border: '1px solid var(--cor-erro)', color: 'var(--cor-erro)', borderRadius: 'var(--raio)', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>
                            Estornar
                          </button>
                        )
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
                <span key={v.id} style={{ fontSize: '0.85rem', color: v.status === 'cancelada' ? 'var(--cor-erro)' : 'var(--cor-texto-suave)' }}>
                  {new Date(v.criado_em).toLocaleDateString('pt-BR')} — R$ {Number(v.valor_total).toFixed(2)} ({v.forma_pagamento === 'a_vista' ? 'à vista' : 'crediário'}) {v.status === 'cancelada' && '· CANCELADA'}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
