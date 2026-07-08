import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function primeiroDiaDoMes(data) {
  return new Date(data.getFullYear(), data.getMonth(), 1).toISOString().slice(0, 10)
}
function ultimoDiaDoMes(data) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0).toISOString().slice(0, 10)
}

export default function RelatorioFinanceiro({ lojaId }) {
  const hoje = new Date()
  const [inicio, setInicio] = useState(primeiroDiaDoMes(hoje))
  const [fim, setFim] = useState(ultimoDiaDoMes(hoje))
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)

  async function carregar() {
    setCarregando(true)
    const inicioIso = `${inicio}T00:00:00`
    const fimIso = `${fim}T23:59:59`

    const [{ data: vendasAVista }, { data: pagamentosCrediario }, { data: contasPagas }] = await Promise.all([
      supabase.from('vendas').select('valor_total').eq('loja_id', lojaId).eq('forma_pagamento', 'a_vista').eq('status', 'concluida').gte('criado_em', inicioIso).lte('criado_em', fimIso),
      supabase.from('pagamentos_crediario').select('valor').eq('loja_id', lojaId).eq('estornado', false).gte('criado_em', inicioIso).lte('criado_em', fimIso),
      supabase.from('contas_pagar').select('valor, fornecedor, descricao').eq('loja_id', lojaId).eq('status', 'pago').gte('data_pagamento', inicio).lte('data_pagamento', fim),
    ])

    const receitaAVista = (vendasAVista || []).reduce((s, v) => s + Number(v.valor_total), 0)
    const receitaCrediario = (pagamentosCrediario || []).reduce((s, p) => s + Number(p.valor), 0)
    const despesas = (contasPagas || []).reduce((s, c) => s + Number(c.valor), 0)

    setDados({
      receitaAVista,
      receitaCrediario,
      receitaTotal: receitaAVista + receitaCrediario,
      despesas,
      lucro: receitaAVista + receitaCrediario - despesas,
      detalheDespesas: contasPagas || [],
    })
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [lojaId])

  return (
    <div style={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)' }}>
          De
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} style={estiloInput} />
        </label>
        <label style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)' }}>
          Até
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} style={estiloInput} />
        </label>
        <button className="botao" onClick={carregar}>Atualizar</button>
      </div>

      {carregando || !dados ? (
        <p style={{ color: 'var(--cor-texto-suave)' }}>Carregando...</p>
      ) : (
        <>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ color: 'var(--cor-dourado)' }}>Resultado do período</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Receita à vista</span>
              <span>R$ {dados.receitaAVista.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Receita crediário (recebido)</span>
              <span>R$ {dados.receitaCrediario.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--cor-borda)', paddingTop: 8 }}>
              <strong>Receita total</strong>
              <strong>R$ {dados.receitaTotal.toFixed(2)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cor-alerta)' }}>
              <span>Despesas pagas</span>
              <span>− R$ {dados.despesas.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--cor-borda)', paddingTop: 8 }}>
              <strong style={{ fontSize: '1.1rem' }}>Lucro líquido</strong>
              <strong style={{ fontSize: '1.1rem', color: dados.lucro >= 0 ? 'var(--cor-sucesso)' : 'var(--cor-erro)' }}>
                R$ {dados.lucro.toFixed(2)}
              </strong>
            </div>
          </div>

          {dados.detalheDespesas.length > 0 && (
            <div>
              <h3 style={{ color: 'var(--cor-texto-suave)', marginBottom: 8 }}>Despesas do período</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dados.detalheDespesas.map((c, i) => (
                  <span key={i} style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)' }}>
                    {c.fornecedor} {c.descricao && `— ${c.descricao}`} — R$ {Number(c.valor).toFixed(2)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.8rem', color: 'var(--cor-texto-suave)' }}>
            Nota: este relatório é por regime de caixa — conta o dinheiro que efetivamente entrou/saiu no período, não o valor total das vendas feitas no crediário (que só entra conforme o cliente paga).
          </p>
        </>
      )}
    </div>
  )
}

const estiloInput = {
  display: 'block',
  marginTop: 4,
  background: 'var(--cor-fundo)',
  border: '1px solid var(--cor-borda)',
  borderRadius: 'var(--raio)',
  padding: '8px 10px',
  color: 'var(--cor-texto)',
}
