import { AuthProvider, useAuth } from './lib/AuthContext'
import Login from './pages/Login'
import Painel from './pages/Painel'

function Conteudo() {
  const { session, carregando } = useAuth()

  if (carregando) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--cor-texto-suave)' }}>Carregando...</p>
      </div>
    )
  }

  return session ? <Painel /> : <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <Conteudo />
    </AuthProvider>
  )
}
