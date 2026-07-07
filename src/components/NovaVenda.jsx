import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../lib/supabaseClient'

export default function NovaVenda({ lojaId, produtos, onVendaFinalizada, onFechar }) {
  const [escaneando, setEscaneando] = useState(false)
  const [carrinho, setCarrinho] = useState([])
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [finalizando, setFinalizando] = useState(false)
  const [codigoManual, setCodigoManual] = useState('')
  const leitorRef = useRef(null)
  const containerId = 'leitor-camera'

  useEffect(() => {
    return () => {
      if (leitorRef.current) {
        leitorRef.current.stop().catch(() => {})
      }
    }
  }, [])

  function buscarProdutoPorCodigo(codigo) {
    return produtos.find((p) => p.codigo_barras && p.codigo_barras === codigo)
  }

  function adicionarAoCarrinho(produto, variacao) {
    const itemExistente = carrinho.find(
      (i) => i.produto.id === produto.id && i.variacao?.id === variacao?.id
    )

    if (itemExistente) {
      setCarrinho(
        carrinho.map((i) =>
          i === itemExistente ? { ...i, quantidade: i.quantidade + 1 } : i
        )
      )
    } else {
      setCarrinho([...carrinho, { produto, variacao, quantidade: 1 }])
    }
    setMensagem(`${produto.nome} adicionado`)
  }

  function processarCodigoLido(codigo) {
    const produto = buscarProdutoPorCodigo(codigo)
    if (!produto) {
      setErro(`Nenhum produto encontrado com o código ${codigo}`)
      return
    }
    setErro('')

    const variacoes = produto.produto_variacoes || []
    if (variacoes.length === 1) {
      adicionarAoCarrinho(produto, variacoes[0])
    } else if (variacoes.length === 0) {
      adicionarAoCarrinho(produto, null)
    } else {
      adicionarAoCarrinho(produto, variacoes[0])
    }
  }

  async function iniciarCamera() {
    setErro('')
    setEscaneando(true)
    setTimeout(async () => {
      try {
        const leitor = new Html5Qrcode(containerId)
        leitorRef.current = leitor
        await leitor.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (textoLido) => {
            processarCodigoLido(textoLido)
          },
          () => {}
        )
      } catch (err) {
        setErro('Não foi possível acessar a câmera: ' + err.message)
        setEscaneando(false)
      }
    }, 100)
  }

  async function pararCamera() {
    if (leitorRef.current) {
      try {
        await leitorRef.current.stop()
      } catch {}
    }
    setEscaneando(false)
  }

  function adicionarPorCodigoManual(e) {
    e.preventDefault()
    if (!codigoManual.trim()) return
    processarCodigoLido(codigoManual.trim())
    setCodigoManual('')
  }

  function alterarQuantidade(index, delta) {
    setCarrinho(
      carrinho.map((item, i) =>
        i === index ? { ...item, quantidade: Math.max(1, item.quantidade + delta) } : item
      )
    )
  }

  function removerDoCarrinho(index) {
    setCarrinho(carrinho.filter((_, i) => i !== index))
  }

  const total = carrinho.reduce((soma, item) => soma + item.produto.preco * item.quantidade, 0)

  async function finalizarVenda() {
    if (carrinho.length === 0) return
    setFinalizando(true)
    setErro('')

    try {
      const itens = carrinho.map((item) => ({
        produto_id: item.produto.id,
        variacao_id: item.variacao?.id || null,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco,
      }))

      const { error } = await supabase.rpc('finalizar_venda', {
        p_loja_id: lojaId,
        p_forma_pagamento: 'a_vista',
        p_itens: itens,
      })

      if (error) throw error

      setCarrinho([])
      onVendaFinalizada?.()
      onFechar?.()
    } catch (err) {
      setErro(err.message)
    } finally {
      setFinalizando(false)
    }
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--cor-dourado)' }}>Nova venda</h3>
        <button onClick={onFechar} style={{ background: 'transparent', border: 'none', color: 'var(--cor-texto-suave)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
      </div>

      {!escaneando ? (
        <button className="botao" onClick={iniciarCamera}>📷 Ler código de barras</button>
      ) : (
        <div>
          <div id={containerId} style={{ width: '100%', borderRadius: 8, overflow: 'hidden' }} />
          <button onClick={pararCamera} style={{ marginTop: 8, background: 'transparent', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: 'var(--raio)', padding: '6px 10px', cursor: 'pointer', width: '100%' }}>
            Parar câmera
          </button>
        </div>
      )}

      <form onSubmit={adicionarPorCodigoManual} style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="Ou digite o código de barras"
          value={codigoManual}
          onChange={(e) => setCodigoManual(e.target.value)}
          style={{ flex: 1, background: 'var(--cor-fundo)', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio)', padding: '10px 14px', color: 'var(--cor-texto)' }}
        />
        <button type="submit" className="botao">Add</button>
      </form>

      {mensagem && <p style={{ color: 'var(--cor-sucesso)', fontSize: '0.85rem' }}>{mensagem}</p>}
      {erro && <p style={{ color: 'var(--cor-erro)', fontSize: '0.85rem' }}>{erro}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {carrinho.length === 0 && <p style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>Carrinho vazio.</p>}
        {carrinho.map((item, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--cor-borda)', paddingBottom: 8 }}>
            <div>
              <strong>{item.produto.nome}</strong>
              {item.variacao && <span style={{ color: 'var(--cor-texto-suave)', fontSize: '0.85rem' }}> ({item.variacao.tamanho})</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => alterarQuantidade(index, -1)} style={estiloBotaoQtd}>−</button>
              <span>{item.quantidade}</span>
              <button onClick={() => alterarQuantidade(index, 1)} style={estiloBotaoQtd}>+</button>
              <span style={{ color: 'var(--cor-dourado)', minWidth: 70, textAlign: 'right' }}>
                R$ {(item.produto.preco * item.quantidade).toFixed(2)}
              </span>
              <button onClick={() => removerDoCarrinho(index)} style={{ background: 'transparent', border: 'none', color: 'var(--cor-erro)', cursor: 'pointer' }}>×</button>
            </div>
          </div>
        ))}
      </div>

      {carrinho.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
            <strong>Total</strong>
            <strong style={{ color: 'var(--cor-dourado)' }}>R$ {total.toFixed(2)}</strong>
          </div>
          <button className="botao" onClick={finalizarVenda} disabled={finalizando}>
            {finalizando ? 'Registrando...' : 'Finalizar venda (à vista)'}
          </button>
          <p style={{ color: 'var(--cor-texto-suave)', fontSize: '0.8rem', textAlign: 'center' }}>
            Venda parcelada/crediário chega na próxima fase.
          </p>
        </>
      )}
    </div>
  )
}

const estiloBotaoQtd = {
  background: 'var(--cor-fundo)',
  border: '1px solid var(--cor-borda)',
  color: 'var(--cor-texto)',
  borderRadius: 6,
  width: 26,
  height: 26,
  cursor: 'pointer',
}
