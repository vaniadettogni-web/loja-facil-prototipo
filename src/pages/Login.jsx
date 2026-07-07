import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { gerarSlug } from '../lib/slug'
import RodapeMarca from '../components/RodapeMarca'

export default function Login() {
  const [modo, setModo] = useState('login') // 'login' | 'cadastro'
  const [nomeLoja, setNomeLoja] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setMensagem('')
    setCarregando(true)

    try {
      if (modo === 'cadastro') {
        const { data, error } = await supabase.auth.signUp({ email, password: senha })
        if (error) throw error

        const usuario = data.user
        if (usuario) {
          const { error: erroLoja } = await supabase.from('lojas').insert({
            nome: nomeLoja,
            slug: gerarSlug(nomeLoja),
            dono_user_id: usuario.id,
          })
          if (erroLoja) throw erroLoja
        }

        if (!data.session) {
          setMensagem('Conta criada! Verifique seu email para confirmar antes de entrar.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
        if (error) throw error
      }
    } catch (err) {
      setErro(err.message)
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--cor-dourado)', textAlign: 'center' }}>Loja Fácil</h1>

          {modo === 'cadastro' && (
            <input
              type="text"
              placeholder="Nome da loja"
              value={nomeLoja}
              onChange={(e) => setNomeLoja(e.target.value)}
              required
              style={estiloInput}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={estiloInput}
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
            style={estiloInput}
          />

          {erro && <p style={{ color: 'var(--cor-erro)', fontSize: '0.9rem' }}>{erro}</p>}
          {mensagem && <p style={{ color: 'var(--cor-sucesso)', fontSize: '0.9rem' }}>{mensagem}</p>}

          <button className="botao" type="submit" disabled={carregando}>
            {carregando ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--cor-texto-suave)' }}>
            {modo === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setModo(modo === 'login' ? 'cadastro' : 'login'); setErro(''); setMensagem('') }}>
              {modo === 'login' ? 'Criar agora' : 'Entrar'}
            </a>
          </p>
        </form>
      </div>
      <RodapeMarca />
    </div>
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
}
