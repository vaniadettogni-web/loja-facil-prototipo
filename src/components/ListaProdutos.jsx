export default function ListaProdutos({ produtos, onExcluir }) {
  if (produtos.length === 0) {
    return <p style={{ color: 'var(--cor-texto-suave)' }}>Nenhum produto cadastrado ainda.</p>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, width: '100%', maxWidth: 900 }}>
      {produtos.map((produto) => (
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
          <span style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}>Estoque: {produto.estoque}</span>
          <button
            onClick={() => onExcluir(produto.id)}
            style={{ background: 'transparent', border: '1px solid var(--cor-erro)', color: 'var(--cor-erro)', borderRadius: 'var(--raio)', padding: '6px 10px', cursor: 'pointer' }}
          >
            Excluir
          </button>
        </div>
      ))}
    </div>
  )
}
