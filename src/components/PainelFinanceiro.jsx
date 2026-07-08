import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function PainelFinanceiro({ lojaId }) {
  const [resumo, setResumo] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    async function carregar() {
      setCarregando(true)
      const hoje = new Date()
      const em30dias = new Date()
      em30dias.setDate(hoje.getDate() + 30)
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

      const [
        { data: aReceber },
        { data: aPagar },
        { data: vendasMes },
        { data: pagamentosMes },
        { data: contasPagasMes },
      ] = await Promise.all([
        supabase.from('contas_receber_unificado').select('valor, valor_pago, status, vencimento').eq('loja_id', lojaId).neq('status', 'pago').lte('vencimento', em30dias.toISOString().slice(0, 10)),
        supabase.from('contas_pagar').select('valor, status, vencimento').eq('loja_id', lojaId).neq('status', 'pago').lte('vencimento', em30dias.toISOString().slice(0, 10)),
        supabase.from('vendas').select('valor_total').eq('loja_id', lojaId).eq('forma_pagamento', 'a_vista').eq('status', 'concluida').gte('criado_em', inicioMes.toISOString()),
        supabase.from('pagamentos_crediario').select('valor').eq('loja_id', lojaId).eq('estornado', false).gte('criado_em', inicioMes.toISOString()),
        supabase.from('contas_pagar').select('valor').eq('loja_id', lojaId).eq('status', 'pago').gte('data_pagamento', inicioMes.toISOString().slice(0, 10)),
      ])

      const totalReceber = (aReceber || []).reduce((s, p) => s + (Number(p.valor) - Number(p.valor_pago)), 0)
      const totalPagar = (aPagar || []).reduce((s, p) => s + Number(p.valor), 0)
      const recebidoMes = (vendasMes || []).reduce((s, v) => s + Number(v.valor_total), 0) + (pagamentosMes || []).reduce((s, p) => s + Number(p.valor), 0)
      const pagoMes = (contasPagasMes || []).reduce((s, c) => s + Number(c.valor), 0)

      setResumo({
        totalReceber,
        totalPagar,
        recebidoMes,
        pagoMes,
        saldoMes: recebidoMes - pagoMes,
      })
      setCarregando(false)
    }
    carregar()
  }, [lojaId])

  if (carregando || !resumo) {
    return <p style={{ color: 'var(--cor-texto-suave)' }}>Carregando resumo financeiro...</p>
  }

  return (
    <div style={{ width: '100%', maxWidth: 700, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      <div className="card">
        <span style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>A receber (30 dias)</span>
        <h3 style={{ color: 'var(--cor-sucesso)', marginTop: 4 }}>R$ {resumo.totalReceber.toFixed(2)}</h3>
      </div>
      <div className="card">
        <span style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>A pagar (30 dias)</span>
        <h3 style={{ color: 'var(--cor-alerta)', marginTop: 4 }}>R$ {resumo.totalPagar.toFixed(2)}</h3>
      </div>
      <div className="card">
        <span style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>Recebido este mês</span>
        <h3 style={{ color: 'var(--cor-dourado)', marginTop: 4 }}>R$ {resumo.recebidoMes.toFixed(2)}</h3>
      </div>
      <div className="card">
        <span style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>Pago este mês</span>
        <h3 style={{ color: 'var(--cor-dourado)', marginTop: 4 }}>R$ {resumo.pagoMes.toFixed(2)}</h3>
      </div>
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <span style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>Saldo do mês (recebido − pago)</span>
        <h2 style={{ color: resumo.saldoMes >= 0 ? 'var(--cor-sucesso)' : 'var(--cor-erro)', marginTop: 4 }}>
          R$ {resumo.saldoMes.toFixed(2)}
        </h2>
      </div>
    </div>
  )
}
