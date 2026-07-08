import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import SeletorCliente from './SeletorCliente'

export default function ContasReceber({ lojaId }) {
  const [contas, setContas] = useState([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState(new Date().toISOString().slice(0, 10))
  const [clienteSelecionado, setClienteSelecionado] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('contas_receber_unificado')
      .select('*')
      .eq('loja_id', lojaId)
      .order('vencimento', { ascending: true })
    setContas(data || [])
  }, [lojaId])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)

    try {
      const { error } = await supabase.from('contas_receber').insert({
        loja_id: lojaId,
        cliente_id: clienteSelecionado?.id || null,
        descricao,
        valor: parseFloat(valor.replace(',', '.')),
        vencimento,
        origem: 'avulsa',
      })
      if (error) throw error

      setDescricao('')
      setValor('')
      setClienteSelecionado(null)
      carregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  async function darBaixaAvulsa(id) {
    await supabase.from('contas_receber').update({ status: 'pago' }).eq('id', id)
    carregar()
  }

  const pendentes = contas.filter((c) => c.status !== 'pago')
  const pagas = contas.filter((c) => c.status === 'pago')
  const totalPendente = pendentes.reduce((s, c) => s + (Number(c.valor) - Number(c.valor_pago)), 0)

  return (
    <div style={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="card">
        <span style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>Total a receber</span>
        <h2 style={{ color: 'var(--cor-sucesso)', marginTop: 4 }}>R$ {totalPendente.toFixed(2)}</h2>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ color: 'var(--cor-dourado)' }}>Nova conta a receber avulsa</h3>
        <p style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem', marginTop: -6 }}>
          Use isso para valores fora de venda (ex: reembolso a receber). Parcelas de crediário aparecem aqui automaticamente.
        </p>
        <SeletorCliente lojaId={lojaId} clienteSelecionado={clienteSelecionado} onSelecionar={setClienteSelecionado} />
        <input style={estiloInput} placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={estiloInput} placeholder="Valor (ex: 100,00)" value={valor} onChange={(e) => setValor(e.target.value)} required />
          <input style={estiloInput} type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} required />
        </div>
        {erro && <p style={{ color: 'var(--cor-erro)', fontSize: '0.85rem' }}>{erro}</p>}
        <button className="botao" type="submit" disabled={enviando}>{enviando ? 'Salvando...' : 'Salvar'}</button>
      </form>

      <div>
        <h3 style={{ color: 'var(--cor-texto-suave)', marginBottom: 12 }}>Pendentes</h3>
        {pendentes.length === 0 && <p style={{ color: 'var(--cor-texto-suave)' }}>Nada em aberto.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pendentes.map((c) => {
            const vencimentoDate = new Date(c.vencimento)
            const hoje = new Date()
            const em3dias = new Date()
            em3dias.setDate(hoje.getDate() + 3)
            const atrasada = vencimentoDate < hoje
            const venceLogo = !atrasada && vencimentoDate <= em3dias
            const restante = Number(c.valor) - Number(c.valor_pago)

            return (
              <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{c.cliente_nome || 'Sem cliente'}</strong>
                  <span style={{ color: 'var(--cor-texto-suave)' }}> — {c.descricao}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-suave)' }}> ({c.origem === 'crediario' ? 'crediário' : 'avulsa'})</span>
                  <br />
                  <span style={{ fontSize: '0.85rem', color: atrasada ? 'var(--cor-erro)' : venceLogo ? 'var(--cor-alerta)' : 'var(--cor-texto-suave)' }}>
                    R$ {restante.toFixed(2)} · vence {vencimentoDate.toLocaleDateString('pt-BR')}
                    {atrasada && ' · Atrasada'}
                    {venceLogo && ' · Vence em breve'}
                  </span>
                </div>
                {c.origem === 'avulsa' ? (
                  <button onClick={() => darBaixaAvulsa(c.id)} style={{ background: 'transparent', border: '1px solid var(--cor-sucesso)', color: 'var(--cor-sucesso)', borderRadius: 'var(--raio)', padding: '6px 10px', cursor: 'pointer' }}>
                    Marcar como recebida
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}>Gerencie na ficha do cliente</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {pagas.length > 0 && (
        <div>
          <h3 style={{ color: 'var(--cor-texto-suave)', marginBottom: 12 }}>Recebidas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pagas.map((c) => (
              <span key={c.id} style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)' }}>
                {c.cliente_nome || 'Sem cliente'} — {c.descricao} — R$ {Number(c.valor).toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      )}
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
