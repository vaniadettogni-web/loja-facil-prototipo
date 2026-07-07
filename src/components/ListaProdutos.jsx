import { useState } from 'react'

export default function ListaProdutos({ produtos, onExcluir }) {
  const [expandido, setExpandido] = useState(null)

  if (produtos.length === 0) {
    return <p style={{ color: 'var(--cor-texto-suave)' }}>Nenhum produto cadastrado ainda.</p>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, width: '100%', maxWidth: 900 }}>
      {produtos.map((produto) => {
        const variacoes = produto.produto_variacoes || []
        const aberto = expandido === produto.id

        return (
          <div key={produto.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {produto.foto_url ? (
              <img src={produto.foto_url} alt={produto.nome} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div style={{ width: '100%', height: 140, background: 'var(--cor-borda)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cor-texto-suave)' }}>
                Sem foto
              </div>
            )}
            <strong>{produto.nome}</strong>
            <span style={{ color: 'var(--cor-dourado)' }}>R$ {Number(produto.preco).toFixed(2)}</span>

            {variacoes.length > 0 ? (
              <button
                onClick={() => setExpandido(aberto ? null : produto.id)}
                style={{ background: 'transparent', border: 'none', color: 'var(--cor-texto-suave)', fontSize: '0.85rem', textAlign: 'left', cursor: 'pointer', padding: 0 }}
              >
                Estoque total: {produto.estoque} {aberto ? '▲' : '▼'}
              </button>
            ) : (
              <span style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>Estoque: {produto.estoque}</span>
            )}

            {aberto && variacoes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8, borderLeft: '2px solid var(--cor-borda)' }}>
                {variacoes.map((v) => (
                  <span key={v.id} style={{ fontSize: '0.85rem', color: 'var(--cor-texto-suave)' }}>
                    {v.tamanho}: {v.quantidade} un.
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => onExcluir(produto.id)}
              style={{ background: 'transparent', border: '1px solid var(--cor-erro)', color: 'var(--cor-erro)', borderRadius: 'var(--raio)', padding: '6px 10px', cursor: 'pointer' }}
            >
              Excluir
            </button>
          </div>
        )
      })}
    </div>
  )
}
