import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function EditarProduto({ produto, onSalvo, onCancelar }) {
  const [nome, setNome] = useState(produto.nome)
  const [descricao, setDescricao] = useState(produto.descricao || '')
  const [preco, setPreco] = useState(String(produto.preco))
  const [categoria, setCategoria] = useState(produto.categoria || '')
  const [codigoBarras, setCodigoBarras] = useState(produto.codigo_barras || '')
  const [variacoes, setVariacoes] = useState(
    (produto.produto_variacoes || []).length > 0
      ? produto.produto_variacoes.map((v) => ({ id: v.id, tamanho: v.tamanho, quantidade: String(v.quantidade) }))
      : [{ tamanho: '', quantidade: '' }]
  )
  const [foto, setFoto] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

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
      let fotoUrl = produto.foto_url

      if (foto) {
        const extensao = foto.name.split('.').pop()
        const caminho = `${produto.loja_id}/${crypto.randomUUID()}.${extensao}`
        const { error: erroUpload } = await supabase.storage.from('produtos-fotos').upload(caminho, foto)
        if (erroUpload) throw erroUpload
        const { data } = supabase.storage.from('produtos-fotos').getPublicUrl(caminho)
        fotoUrl = data.publicUrl
      }

      const variacoesValidas = variacoes.filter((v) => v.tamanho.trim() !== '')
      const estoqueTotal = variacoesValidas.reduce((soma, v) => soma + (parseInt(v.quantidade, 10) || 0), 0)

      const { error: erroUpdate } = await supabase
        .from('produtos')
        .update({
          nome,
          descricao,
          preco: parseFloat(String(preco).replace(',', '.')),
          categoria,
          codigo_barras: codigoBarras || null,
          estoque: estoqueTotal,
          foto_url: fotoUrl,
        })
        .eq('id', produto.id)

      if (erroUpdate) throw erroUpdate

      // Substitui as variacoes: remove as antigas e insere as atuais
      await supabase.from('produto_variacoes').delete().eq('produto_id', produto.id)

      if (variacoesValidas.length > 0) {
        const linhas = variacoesValidas.map((v) => ({
          produto_id: produto.id,
          tamanho: v.tamanho.trim(),
          quantidade: parseInt(v.quantidade, 10) || 0,
        }))
        const { error: erroVariacoes } = await supabase.from('produto_variacoes').insert(linhas)
        if (erroVariacoes) throw erroVariacoes
      }

      onSalvo?.()
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420, width: '100%' }}>
      <h3 style={{ color: 'var(--cor-dourado)' }}>Editar produto</h3>

      <input style={estiloInput} value={nome} onChange={(e) => setNome(e.target.value)} required />
      <textarea style={{ ...estiloInput, resize: 'vertical', minHeight: 60 }} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      <input style={estiloInput} value={preco} onChange={(e) => setPreco(e.target.value)} required />
      <input style={estiloInput} value={categoria} onChange={(e) => setCategoria(e.target.value)} />
      <input style={estiloInput} value={codigoBarras} onChange={(e) => setCodigoBarras(e.target.value)} placeholder="Código de barras" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>Tamanhos e quantidades</label>
        {variacoes.map((v, index) => (
          <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input style={{ ...estiloInput, flex: 1 }} placeholder="Tamanho" value={v.tamanho} onChange={(e) => atualizarVariacao(index, 'tamanho', e.target.value)} />
            <input style={{ ...estiloInput, width: 90 }} placeholder="Qtd" type="number" min="0" value={v.quantidade} onChange={(e) => atualizarVariacao(index, 'quantidade', e.target.value)} />
            {variacoes.length > 1 && (
              <button type="button" onClick={() => removerVariacao(index)} style={{ background: 'transparent', border: 'none', color: 'var(--cor-erro)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
            )}
          </div>
        ))}
        <button type="button" onClick={adicionarVariacao} style={{ background: 'transparent', border: '1px dashed var(--cor-borda)', color: 'var(--cor-dourado)', borderRadius: 'var(--raio)', padding: '8px', cursor: 'pointer' }}>
          + Adicionar tamanho
        </button>
      </div>

      <label style={{ color: 'var(--cor-texto-suave)', fontSize: '0.9rem' }}>
        Trocar foto (opcional)
        <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files[0])} style={{ display: 'block', marginTop: 6 }} />
      </label>

      {erro && <p style={{ color: 'var(--cor-erro)', fontSize: '0.9rem' }}>{erro}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="botao" type="submit" disabled={enviando} style={{ flex: 1 }}>
          {enviando ? 'Salvando...' : 'Salvar alterações'}
        </button>
        <button type="button" onClick={onCancelar} style={{ flex: 1, background: 'transparent', border: '1px solid var(--cor-borda)', color: 'var(--cor-texto)', borderRadius: 'var(--raio)', cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
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
