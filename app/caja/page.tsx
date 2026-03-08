'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut, Banknote, Clock } from 'lucide-react'

// 1. Definimos la estructura del Pedido
interface Pedido {
  id: string;
  cliente: string;
  total: number;
  items: { nombre: string }[];
  estado: string;
  created_at: string;
}

export default function PantallaCaja() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const router = useRouter()

  useEffect(() => {
    // 🔒 SEGURIDAD: Si no hay login, rebota al login
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
    }
    checkAuth()

    // 2. Cargar pedidos que esperan pago
    const cargarCaja = async () => {
      const { data } = await supabase
        .from('pedidos')
        .select('*')
        .eq('estado', 'pendiente_pago')
        .order('created_at', { ascending: true })
      
      if (data) setPedidos(data as Pedido[])
    }

    cargarCaja()

    // 3. Suscripción en Tiempo Real
    const canal = supabase
      .channel('cambios-caja')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        cargarCaja()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [router])

  // 4. Confirmar pago (Esto habilita que el pedido aparezca en COCINA)
  const confirmarPago = async (id: string) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'pagado' })
      .eq('id', id)
    
    if (error) {
      alert("Error al procesar el pago")
    }
  }

  // 5. Cerrar Sesión
  const cerrarSesion = () => {
    localStorage.removeItem('auth_hotel')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-emerald-950 text-white p-6">
      {/* HEADER CON LOGOUT */}
      <header className="flex justify-between items-center mb-8 border-b border-emerald-800 pb-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-4xl font-black flex items-center gap-3">
            <Banknote className="text-emerald-400" size={40} /> 
            CAJA
          </h1>
          <p className="text-emerald-400/60 text-sm font-bold uppercase tracking-widest">Control de Cobros</p>
        </div>

        <button 
          onClick={cerrarSesion}
          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-5 py-3 rounded-2xl transition-all border border-red-500/20 font-bold"
        >
          <LogOut size={20} /> Salir
        </button>
      </header>

      {/* LISTA DE PEDIDOS */}
      <div className="grid gap-6 max-w-2xl mx-auto">
        {pedidos.map(p => (
          <div key={p.id} className="bg-white text-slate-900 p-6 rounded-3xl flex justify-between items-center shadow-2xl border-b-8 border-emerald-600">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
                <Clock size={12} />
                {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <h2 className="font-black text-2xl uppercase text-slate-800">{p.cliente}</h2>
              <p className="text-3xl font-black text-emerald-600 tracking-tighter">
                ${p.total.toFixed(2)}
              </p>
            </div>

            <button 
              onClick={() => confirmarPago(p.id)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-5 rounded-2xl font-black text-lg shadow-lg shadow-emerald-200 transition-all active:scale-90 flex flex-col items-center"
            >
              <span>COBRAR</span>
              <span className="text-xs opacity-80 font-normal italic leading-none">Confirmar ✅</span>
            </button>
          </div>
        ))}

        {/* MENSAJE CUANDO NO HAY NADA */}
        {pedidos.length === 0 && (
          <div className="text-center py-20 bg-emerald-900/30 rounded-3xl border-2 border-dashed border-emerald-800">
            <p className="text-6xl mb-4">💳</p>
            <p className="text-xl font-bold opacity-40">No hay cobros pendientes</p>
            <p className="text-sm opacity-30 italic">Los nuevos pedidos aparecerán aquí automáticamente</p>
          </div>
        )}
      </div>

      {/* BOTÓN RÁPIDO PARA IR A COCINA (Opcional) */}
      <div className="fixed bottom-6 right-6">
         <button 
           onClick={() => router.push('/cocina')}
           className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-full text-xs font-bold border border-slate-700 shadow-xl"
         >
           Ver Cocina 👨‍🍳
         </button>
      </div>
    </div>
  )
}