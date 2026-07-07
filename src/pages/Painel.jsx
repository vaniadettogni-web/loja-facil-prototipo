import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useLoja } from '../lib/useLoja'
import RodapeMarca from '../components/RodapeMarca'
import FormularioProduto from '../components/FormularioProduto'
import ListaProdutos from '../components/ListaProdutos'

export default function Painel() {
  const { loja, carregando: carregandoLoja } = useLoja()
  const [produtos, setProdutos] = useState([])

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
        <button className="botao" onClick={sair}>Sair</button>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, padding: '32px 16px' }}>
        <FormularioProduto lojaId={loja?.id} onProdutoCriado={carregarProdutos} />

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <h2 style={{ fontSize: '1.3rem', color: 'var(--cor-texto-suave)' }}>Produtos cadastrados</h2>
          <ListaProdutos produtos={produtos} onExcluir={excluirProduto} />
        </div>
      </main>

      <RodapeMarca />
    </div>
  )
}
