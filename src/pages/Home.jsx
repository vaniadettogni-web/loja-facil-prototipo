import RodapeMarca from '../components/RodapeMarca'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--cor-dourado)' }}>Loja Fácil</h1>
        <p style={{ color: 'var(--cor-texto-suave)' }}>Fase 0 — estrutura pronta. Próxima fase: cadastro de produto e painel da lojista.</p>
      </div>
      <RodapeMarca />
    </div>
  )
}
