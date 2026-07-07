import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useLoja } from '../lib/useLoja'
import RodapeMarca from '../components/RodapeMarca'
import FormularioProduto from '../components/FormularioProduto'
import EditarProduto from '../components/EditarProduto'
import ListaProdutos from '../components/ListaProdutos'
import NovaVenda from '../components/NovaVenda'

export default function Painel() {
  const { loja, carregando: carregandoLoja } = useLoja()
  const [produtos, setProdutos] = useState([])
  const [busca, setBusca] = useState('')
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [mostrarVenda, setMostrarVenda] = useState(false)

  const carregarProdutos = useCallback(async () => {
    if (!loja) return
    const { data } = await supabase
      .from('produtos')
      .select('*, produto_variacoes(*)')
      .eq('loja_id', loja.id)
      .order('criado_em', { ascending: false })
    setProdutos(data || [])
  }, [loja])

  useEffect(() => {
    carregarProdutos()
  }, [carregarProdutos])

  const produtosFiltrados = useMemo(() => {
    if (!busca.trim()) return produtos
    const termo = busca.toLowerCase()
    return produtos.filter(
      (p) => p.nome.toLowerCase().includes(termo) || (p.categoria || '').toLowerCase().includes(termo)
    )
  }, [produtos, busca])

  async function excluirProduto(id) {
    await supabase.from('produtos').delete().eq('id', id)
    carregarProdutos()
  }

  async function sair() {
    await supabase.auth.signOut()
  }

  if (carregandoLoja) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--cor-texto-suave)' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: '1px solid var(--cor-borda)' }}>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--cor-dourado)' }}>{loja?.nome || 'Loja Fácil'}</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="botao" onClick={() => setMostrarVenda(true)}>+ Nova venda</button>
          <button onClick={sair} style={{ background: 'transparent', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: 'var(--raio)', padding: '10px 20px', cursor: 'pointer' }}>Sair</button>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '32px 16px' }}>
        {mostrarVenda && (
          <NovaVenda
            lojaId={loja.id}
            produtos={produtos}
            onVendaFinalizada={carregarProdutos}
            onFechar={() => setMostrarVenda(false)}
          />
        )}

        {produtoEditando ? (
          <EditarProduto
            produto={produtoEditando}
            onSalvo={() => { setProdutoEditando(null); carregarProdutos() }}
            onCancelar={() => setProdutoEditando(null)}
          />
        ) : (
          <FormularioProduto lojaId={loja?.id} onProdutoCriado={carregarProdutos} />
        )}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--cor-texto-suave)' }}>Produtos cadastrados</h2>

          <input
            placeholder="Buscar por nome ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ width: '100%', maxWidth: 400, background: 'var(--cor-fundo-elevado)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio)', padding: '10px 14px', color: 'var(--cor-texto)' }}
          />

          <ListaProdutos produtos={produtosFiltrados} onExcluir={excluirProduto} onEditar={setProdutoEditando} />
        </div>
      </main>

      <RodapeMarca />
    </div>
  )
}
