import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function FormularioProduto({ lojaId, onProdutoCriado }) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [categoria, setCategoria] = useState('')
  const [codigoBarras, setCodigoBarras] = useState('')
  const [variacoes, setVariacoes] = useState([{ tamanho: '', quantidade: '' }])
  const [foto, setFoto] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  function limparFormulario() {
    setNome('')
    setDescricao('')
    setPreco('')
    setCategoria('')
    setCodigoBarras('')
    setVariacoes([{ tamanho: '', quantidade: '' }])
    setFoto(null)
  }

  function atualizarVariacao(index, campo, valor) {
    const novas = [...variacoes]
    novas[index][campo] = valor
    setVariacoes(novas)
  }

  function adicionarVariacao() {
    setVariacoes([...variacoes, { tamanho: '', quantidade: '' }])
  }

  function removerVariacao(index) {
    setVariacoes(variacoes.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setEnviando(true)

    try {
      let fotoUrl = null

      if (foto) {
        const extensao = foto.name.split('.').pop()
        const caminho = `${lojaId}/${crypto.randomUUID()}.${extensao}`

        const { error: erroUpload } = await supabase.storage
          .from('produtos-fotos')
          .upload(caminho, foto)

        if (erroUpload) throw erroUpload

        const { data } = supabase.storage.from('produtos-fotos').getPublicUrl(caminho)
        fotoUrl = data.publicUrl
      }

      const variacoesValidas = variacoes.filter((v) => v.tamanho.trim() !== '')
      const estoqueTotal = variacoesValidas.reduce((soma, v) => soma + (parseInt(v.quantidade, 10) || 0), 0)

      const { data: produtoCriado, error: erroInsert } = await supabase
        .from('produtos')
        .insert({
          loja_id: lojaId,
          nome,
          descricao,
          preco: parseFloat(preco.replace(',', '.')),
          categoria,
          codigo_barras: codigoBarras || null,
          estoque: estoqueTotal,
          foto_url: fotoUrl,
        })
        .select()
        .single()

      if (erroInsert) throw erroInsert

      if (variacoesValidas.length > 0) {
        const linhasVariacoes = variacoesValidas.map((v) => ({
          produto_id: produtoCriado.id,
          tamanho: v.tamanho.trim(),
          quantidade: parseInt(v.quantidade, 10) || 0,
        }))

        const { error: erroVariacoes } = await supabase.from('produto_variacoes').insert(linhasVariacoes)
        if (erroVariacoes) throw erroVariacoes
      }

      limparFormulario()
      onProdutoCriado?.()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420, width: '100%' }}>
      <h3 style={{ color: 'var(--cor-dourado)' }}>Novo produto</h3>

      <input style={estiloInput} placeholder="Nome do produto" value={nome} onChange={(e) => setNome(e.target.value)} required />
      <textarea style={{ ...estiloInput, resize: 'vertical', minHeight: 60 }} placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />

      <input style={estiloInput} placeholder="Preço (ex: 79,90)" value={preco} onChange={(e) => setPreco(e.target.value)} required />
      <input style={estiloInput} placeholder="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
      <input style={estiloInput} placeholder="Código de barras (opcional)" value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>Tamanhos e quantidades</label>

        {variacoes.map((v, index) => (
          <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={{ ...estiloInput, flex: 1 }}
              placeholder="Tamanho (P, M, G, 38, 40...)"
              value={v.tamanho}
              onChange={(e) => atualizarVariacao(index, 'tamanho', e.target.value)}
            />
            <input
              style={{ ...estiloInput, width: 90 }}
              placeholder="Qtd"
              type="number"
              min="0"
              value={v.quantidade}
              onChange={(e) => atualizarVariacao(index, 'quantidade', e.target.value)}
            />
            {variacoes.length > 1 && (
              <button
                type="button"
                onClick={() => removerVariacao(index)}
                style={{ background: 'transparent', border: 'none', color: 'var(--cor-erro)', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ×
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={adicionarVariacao}
          style={{ background: 'transparent', border: '1px dashed var(--cor-borda)', color: 'var(--cor-dourado)', borderRadius: 'var(--raio)', padding: '8px', cursor: 'pointer' }}
        >
          + Adicionar tamanho
        </button>
      </div>

      <label style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>
        Foto do produto
        <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files[0])} style={{ display: 'block', marginTop: 6 }} />
      </label>

      {erro && <p style={{ color: 'var(--cor-erro)', fontSize: '0.9rem' }}>{erro}</p>}

      <button className="botao" type="submit" disabled={enviando}>
        {enviando ? 'Salvando...' : 'Salvar produto'}
      </button>
    </form>
  )
}

const estiloInput = {
  background: 'var(--cor-fundo)',
  border: '1px solid var(--cor-borda)',
  borderRadius: 'var(--raio)',
  padding: '10px 14px',
  color: 'var(--cor-texto)',
  fontFamily: 'var(--fonte-texto)',
  fontSize: '1rem',
  width: '100%',
}
