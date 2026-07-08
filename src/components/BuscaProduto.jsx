import { useMemo, useState } from 'react'

export default function BuscaProduto({ produtos, onAdicionar }) {
  const [busca, setBusca] = useState('')
  const [produtoEscolhendoTamanho, setProdutoEscolhendoTamanho] = useState(null)

  const resultados = useMemo(() => {
    if (!busca.trim()) return []
    const termo = busca.toLowerCase()
    return produtos.filter((p) => p.nome.toLowerCase().includes(termo)).slice(0, 8)
  }, [busca, produtos])

  function estoqueDisponivel(produto, variacao) {
    return variacao ? variacao.quantidade : produto.estoque
  }

  function clicarProduto(produto) {
    const variacoes = produto.produto_variacoes || []
    if (variacoes.length > 1) {
      setProdutoEscolhendoTamanho(produto)
    } else {
      onAdicionar(produto, variacoes[0] || null)
      setBusca('')
      setProdutoEscolhendoTamanho(null)
    }
  }

  function escolherTamanho(variacao) {
    onAdicionar(produtoEscolhendoTamanho, variacao)
    setProdutoEscolhendoTamanho(null)
    setBusca('')
  }

  if (produtoEscolhendoTamanho) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--cor-fundo)', padding: 12, borderRadius: 'var(--raio)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <strong>{produtoEscolhendoTamanho.nome} — escolha o tamanho</strong>
          <button onClick={() => setProdutoEscolhendoTamanho(null)} style={{ background: 'transparent', border: 'none', color: 'var(--cor-texto-suave)', cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {produtoEscolhendoTamanho.produto_variacoes.map((v) => (
            <button
              key={v.id}
              onClick={() => escolherTamanho(v)}
              disabled={v.quantidade <= 0}
              style={{
                padding: '8px 14px', borderRadius: 'var(--raio)', cursor: v.quantidade > 0 ? 'pointer' : 'not-allowed',
                border: '1px solid var(--cor-borda)', background: 'var(--cor-fundo-elevado)',
                color: v.quantidade > 0 ? 'var(--cor-texto)' : 'var(--cor-erro)', opacity: v.quantidade > 0 ? 1 : 0.5,
              }}
            >
              {v.tamanho} {v.quantidade <= 0 ? '(sem estoque)' : `(${v.quantidade})`}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        placeholder="Buscar produto por nome"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ width: '100%', background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio)', padding: '10px 14px', color: 'var(--cor-texto)' }}
      />
      {resultados.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {resultados.map((p) => {
            const semVariacao = !(p.produto_variacoes || []).length
            const disponivel = semVariacao ? p.estoque : p.produto_variacoes.reduce((s, v) => s + v.quantidade, 0)
            return (
              <button
                key={p.id}
                onClick={() => clicarProduto(p)}
                disabled={disponivel <= 0}
                style={{
                  textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                  background: 'var(--cor-fundo-elevado)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio)',
                  padding: '8px 12px', color: disponivel > 0 ? 'var(--cor-texto)' : 'var(--cor-erro)',
                  cursor: disponivel > 0 ? 'pointer' : 'not-allowed', opacity: disponivel > 0 ? 1 : 0.6,
                }}
              >
                <span>{p.nome}</span>
                <span style={{ fontSize: '0.85rem' }}>{disponivel > 0 ? `R$ ${Number(p.preco).toFixed(2)}` : 'Sem estoque'}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
