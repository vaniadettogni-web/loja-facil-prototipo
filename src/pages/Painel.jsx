import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useLoja } from '../lib/useLoja'
import RodapeMarca from '../components/RodapeMarca'
import FormularioProduto from '../components/FormularioProduto'
import EditarProduto from '../components/EditarProduto'
import ListaProdutos from '../components/ListaProdutos'
import NovaVenda from '../components/NovaVenda'
import ListaClientes from '../components/ListaClientes'
import VendasRecentes from '../components/VendasRecentes'
import PainelFinanceiro from '../components/PainelFinanceiro'
import ContasPagar from '../components/ContasPagar'
import ContasReceber from '../components/ContasReceber'
import RelatorioFinanceiro from '../components/RelatorioFinanceiro'

export default function Painel() {
  const { loja, carregando: carregandoLoja } = useLoja()
  const [produtos, setProdutos] = useState([])
  const [busca, setBusca] = useState('')
  const [produtoEditando, setProdutoEditando] = useState(null)
  const [mostrarVenda, setMostrarVenda] = useState(false)
  const [aba, setAba] = useState('produtos')
  const [subAbaFinanceiro, setSubAbaFinanceiro] = useState('resumo')

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
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setAba('produtos')}
            style={{ padding: '8px 20px', borderRadius: 'var(--raio)', cursor: 'pointer', border: aba === 'produtos' ? '1px solid var(--cor-dourado)' : '1px solid var(--cor-borda)', background: aba === 'produtos' ? 'var(--cor-dourado-suave)' : 'transparent', color: 'var(--cor-texto)' }}
          >
            Produtos
          </button>
          <button
            onClick={() => setAba('clientes')}
            style={{ padding: '8px 20px', borderRadius: 'var(--raio)', cursor: 'pointer', border: aba === 'clientes' ? '1px solid var(--cor-dourado)' : '1px solid var(--cor-borda)', background: aba === 'clientes' ? 'var(--cor-dourado-suave)' : 'transparent', color: 'var(--cor-texto)' }}
          >
            Clientes
          </button>
          <button
            onClick={() => setAba('vendas')}
            style={{ padding: '8px 20px', borderRadius: 'var(--raio)', cursor: 'pointer', border: aba === 'vendas' ? '1px solid var(--cor-dourado)' : '1px solid var(--cor-borda)', background: aba === 'vendas' ? 'var(--cor-dourado-suave)' : 'transparent', color: 'var(--cor-texto)' }}
          >
            Vendas
          </button>
          <button
            onClick={() => setAba('financeiro')}
            style={{ padding: '8px 20px', borderRadius: 'var(--raio)', cursor: 'pointer', border: aba === 'financeiro' ? '1px solid var(--cor-dourado)' : '1px solid var(--cor-borda)', background: aba === 'financeiro' ? 'var(--cor-dourado-suave)' : 'transparent', color: 'var(--cor-texto)' }}
          >
            Financeiro
          </button>
        </div>

        {mostrarVenda && (
          <NovaVenda
            lojaId={loja.id}
            produtos={produtos}
            onVendaFinalizada={carregarProdutos}
            onFechar={() => setMostrarVenda(false)}
          />
        )}

        {aba === 'clientes' ? (
          <ListaClientes lojaId={loja.id} />
        ) : aba === 'vendas' ? (
          <VendasRecentes lojaId={loja.id} onAtualizado={carregarProdutos} />
        ) : aba === 'financeiro' ? (
          <>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                ['resumo', 'Resumo'],
                ['pagar', 'Contas a pagar'],
                ['receber', 'Contas a receber'],
                ['relatorio', 'Relatório'],
              ].map(([valor, rotulo]) => (
                <button
                  key={valor}
                  onClick={() => setSubAbaFinanceiro(valor)}
                  style={{ padding: '6px 14px', borderRadius: 'var(--raio)', cursor: 'pointer', fontSize: '0.9rem', border: subAbaFinanceiro === valor ? '1px solid var(--cor-dourado)' : '1px solid var(--cor-borda)', background: subAbaFinanceiro === valor ? 'var(--cor-dourado-suave)' : 'transparent', color: 'var(--cor-texto)' }}
                >
                  {rotulo}
                </button>
              ))}
            </div>

            {subAbaFinanceiro === 'resumo' && <PainelFinanceiro lojaId={loja.id} />}
            {subAbaFinanceiro === 'pagar' && <ContasPagar lojaId={loja.id} />}
            {subAbaFinanceiro === 'receber' && <ContasReceber lojaId={loja.id} />}
            {subAbaFinanceiro === 'relatorio' && <RelatorioFinanceiro lojaId={loja.id} />}
          </>
        ) : (
          <>
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
          </>
        )}
      </main>

      <RodapeMarca />
    </div>
  )
}
