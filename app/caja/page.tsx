'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation' // 🔒 Importante: next/navigation

interface Pedido {
  id: string;
  cliente: string;
  total: number;
  items: { nombre: string }[];
  estado: string;
}

export default function PantallaCaja() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const router = useRouter() // 🔒 Inicializamos el router

  useEffect(() => {
    // 🔒 CHEQUEO DE SEGURIDAD
    const auth = localStorage.getItem('auth_hotel')
    if (auth !== 'true') {
      router.push('/login')
      return 
    }

    const cargarCaja = async () => {
      const { data } = await supabase
        .from('pedidos')
        .select('*')
        .eq('estado', 'pendiente_pago')
        .order('created_at', { ascending: true })
      if (data) setPedidos(data as Pedido[])
    }

    cargarCaja()

    const canal = supabase
      .channel('cambios-caja')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        cargarCaja()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [router]) // 🔒 Añadimos router aquí

  const confirmarPago = async (id: string) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'pagado' })
      .eq('id', id)
    
    if (error) alert("Error al cobrar")
  }

  return (
    <div className="min-h-screen bg-emerald-900 text-white p-6">
      <h1 className="text-3xl font-black mb-8 border-b border-emerald-700 pb-4">
        💰 CAJA - COBROS
      </h1>
      <div className="grid gap-4 max-w-2xl mx-auto">
        {pedidos.map(p => (
          <div key={p.id} className="bg-white text-slate-900 p-5 rounded-2xl flex justify-between items-center shadow-xl">
            <div>
              <p className="text-xs text-slate-400 font-mono leading-none mb-1">ID: {p.id.slice(0,5)}</p>
              <h2 className="font-bold text-xl uppercase">{p.cliente}</h2>
              <p className="text-2xl font-black text-emerald-600">${p.total.toFixed(2)}</p>
            </div>
            <button 
              onClick={() => confirmarPago(p.id)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-transform active:scale-95"
            >
              PAGADO ✅
            </button>
          </div>
        ))}
      </div>
      {pedidos.length === 0 && <p className="text-center mt-20 opacity-50 text-xl">No hay cobros pendientes.</p>}
    </div>
  )
}