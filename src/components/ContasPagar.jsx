import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ContasPagar({ lojaId }) {
  const [contas, setContas] = useState([])
  const [fornecedor, setFornecedor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState(new Date().toISOString().slice(0, 10))
  const [recorrente, setRecorrente] = useState(false)
  const [meses, setMeses] = useState(12)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const carregar = useCallback(async () => {
    const { data } = await supabase
      .from('contas_pagar')
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
      const valorNumerico = parseFloat(valor.replace(',', '.'))

      if (recorrente) {
        const { error } = await supabase.rpc('criar_conta_pagar_recorrente', {
          p_loja_id: lojaId,
          p_fornecedor: fornecedor,
          p_categoria_id: null,
          p_descricao: descricao,
          p_valor: valorNumerico,
          p_vencimento: vencimento,
          p_meses: meses,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.from('contas_pagar').insert({
          loja_id: lojaId,
          fornecedor,
          descricao,
          valor: valorNumerico,
          vencimento,
        })
        if (error) throw error
      }

      setFornecedor('')
      setDescricao('')
      setValor('')
      setRecorrente(false)
      carregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  async function darBaixa(id) {
    await supabase.from('contas_pagar').update({ status: 'pago', data_pagamento: new Date().toISOString().slice(0, 10) }).eq('id', id)
    carregar()
  }

  const pendentes = contas.filter((c) => c.status !== 'pago')
  const pagas = contas.filter((c) => c.status === 'pago')

  return (
    <div style={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ color: 'var(--cor-dourado)' }}>Nova conta a pagar</h3>
        <input style={estiloInput} placeholder="Fornecedor" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} required />
        <input style={estiloInput} placeholder="Descrição (ex: aluguel, energia...)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={estiloInput} placeholder="Valor (ex: 250,00)" value={valor} onChange={(e) => setValor(e.target.value)} required />
          <input style={estiloInput} type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} required />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>
          <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} />
          Despesa recorrente (repete todo mês)
        </label>

        {recorrente && (
          <label style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)' }}>
            Gerar quantos meses de uma vez?
            <input
              type="number" min="2" max="36" value={meses}
              onChange={(e) => setMeses(parseInt(e.target.value, 10) || 12)}
              style={{ ...estiloInput, marginTop: 4 }}
            />
          </label>
        )}

        {erro && <p style={{ color: 'var(--cor-erro)', fontSize: '0.85rem' }}>{erro}</p>}

        <button className="botao" type="submit" disabled={enviando}>
          {enviando ? 'Salvando...' : 'Salvar'}
        </button>
      </form>

      <div>
        <h3 style={{ color: 'var(--cor-texto-suave)', marginBottom: 12 }}>Pendentes</h3>
        {pendentes.length === 0 && <p style={{ color: 'var(--cor-texto-suave)' }}>Nenhuma conta pendente.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pendentes.map((c) => {
            const vencimentoDate = new Date(c.vencimento)
            const hoje = new Date()
            const em3dias = new Date()
            em3dias.setDate(hoje.getDate() + 3)
            const atrasada = vencimentoDate < hoje
            const venceLogo = !atrasada && vencimentoDate <= em3dias

            return (
              <div key={c.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{c.fornecedor}</strong>
                  {c.descricao && <span style={{ color: 'var(--cor-texto-suave)' }}> — {c.descricao}</span>}
                  {c.recorrente && <span style={{ color: 'var(--cor-dourado)', fontSize: '0.8rem' }}> · recorrente</span>}
                  <br />
                  <span style={{ fontSize: '0.85rem', color: atrasada ? 'var(--cor-erro)' : venceLogo ? 'var(--cor-alerta)' : 'var(--cor-texto-suave)' }}>
                    R$ {Number(c.valor).toFixed(2)} · vence {vencimentoDate.toLocaleDateString('pt-BR')}
                    {atrasada && ' · Atrasada'}
                    {venceLogo && ' · Vence em breve'}
                  </span>
                </div>
                <button onClick={() => darBaixa(c.id)} style={{ background: 'transparent', border: '1px solid var(--cor-sucesso)', color: 'var(--cor-sucesso)', borderRadius: 'var(--raio)', padding: '6px 10px', cursor: 'pointer' }}>
                  Marcar como paga
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {pagas.length > 0 && (
        <div>
          <h3 style={{ color: 'var(--cor-texto-suave)', marginBottom: 12 }}>Pagas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pagas.map((c) => (
              <span key={c.id} style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)' }}>
                {c.fornecedor} — R$ {Number(c.valor).toFixed(2)} · pago em {new Date(c.data_pagamento).toLocaleDateString('pt-BR')}
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
