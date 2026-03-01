'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const router = useRouter()

  const verificar = (destino: string) => {
    if (pin === '1234') {
      localStorage.setItem('auth_hotel', 'true')
      router.push(destino) // <--- Ahora viaja a donde tú le des clic
    } else {
      alert('PIN Incorrecto ❌')
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
      <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-center">Panel de Control</h2>
        
        <input 
          type="password" 
          placeholder="PIN de acceso"
          className="w-full p-4 rounded-2xl bg-slate-900 text-center text-3xl mb-6 outline-none border-2 border-transparent focus:border-orange-500"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        <div className="grid gap-3">
          <button 
            onClick={() => verificar('/caja')}
            className="w-full bg-emerald-600 p-4 rounded-xl font-bold hover:bg-emerald-500 transition-all"
          >
            💰 ENTRAR A CAJA
          </button>
          
          <button 
            onClick={() => verificar('/cocina')}
            className="w-full bg-orange-600 p-4 rounded-xl font-bold hover:bg-orange-500 transition-all"
          >
            👨‍🍳 ENTRAR A COCINA
          </button>
        </div>
      </div>
    </div>
  )
}