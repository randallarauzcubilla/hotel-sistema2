'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const verificar = async () => {
    setLoading(true)
    
    // 1. Login con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert('Credenciales incorrectas ❌')
      setLoading(false)
      return
    }

    // 2. Obtener rol del usuario
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('*, roles(nombre)')
      .eq('id', data.user.id)
      .single()

    const rol = (usuario?.roles as {nombre: string})?.nombre

    // 3. Redirigir según rol
    if (rol === 'cocina') router.push('/cocina')
    else if (rol === 'caja') router.push('/caja')
    else if (rol === 'mesero') router.push('/')
    else if (rol === 'admin') router.push('/admin')
    else alert('Rol no reconocido ❌')

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-center">Panel de Control</h2>

        <input
          type="email"
          placeholder="Correo"
          className="w-full p-4 rounded-2xl bg-slate-900 mb-4 outline-none border-2 border-transparent focus:border-orange-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-4 rounded-2xl bg-slate-900 mb-6 outline-none border-2 border-transparent focus:border-orange-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={verificar}
          disabled={loading}
          className="w-full bg-orange-600 p-4 rounded-xl font-bold hover:bg-orange-500 transition-all disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'ENTRAR'}
        </button>
      </div>
    </div>
  )
}