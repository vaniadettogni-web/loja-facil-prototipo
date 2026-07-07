import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useAuth } from './AuthContext'

export function useLoja() {
  const { session } = useAuth()
  const [loja, setLoja] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    if (!session) {
      setCarregando(false)
      return
    }

    supabase
      .from('lojas')
      .select('*')
      .eq('dono_user_id', session.user.id)
      .single()
      .then(({ data }) => {
        setLoja(data)
        setCarregando(false)
      })
  }, [session])

  return { loja, carregando }
}
