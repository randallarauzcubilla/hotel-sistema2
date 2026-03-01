'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const router = useRouter()

  const verificar = () => {
    if (pin === '1234') { // <--- AQUÍ pones tu contraseña
      localStorage.setItem('auth_hotel', 'true')
      router.push('/cocina')
    } else {
      alert('PIN Incorrecto ❌')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-auto max-w-sm border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Acceso Personal</h2>
        <input 
          type="password" 
          placeholder="Ingresa el PIN"
          className="w-full p-4 rounded-xl bg-slate-900 text-white text-center text-2xl tracking-widest mb-4 outline-none border-2 border-transparent focus:border-orange-500"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <button 
          onClick={verificar}
          className="w-full bg-orange-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-orange-500 transition-all"
        >
          ENTRAR
        </button>
      </div>
    </div>
  )
}