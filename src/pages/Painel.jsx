import { supabase } from '../lib/supabaseClient'
import RodapeMarca from '../components/RodapeMarca'

export default function Painel() {
  async function sair() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: '1px solid var(--cor-borda)' }}>
        <h1 style={{ fontSize: '1.5rem', color: 'var(--cor-dourado)' }}>Loja Fácil</h1>
        <button className="botao" onClick={sair}>Sair</button>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--cor-texto-suave)' }}>
          Painel da lojista — próximas fases: cadastro de produto, estoque e vendas.
        </p>
      </div>

      <RodapeMarca />
    </div>
  )
}
