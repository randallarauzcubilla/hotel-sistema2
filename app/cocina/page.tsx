'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// 1. Definimos la estructura del objeto Pedido
interface Pedido {
  id: string;
  created_at: string;
  cliente: string;
  items: { nombre: string; precio: number }[]; 
  total: number;
  estado: string;
}

export default function PantallaCocina() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])

  useEffect(() => {
    // 2. Función para traer los datos de la DB
    const cargarPedidos = async () => {
      const { data } = await supabase
        .from('pedidos')
        .select('*')
        .eq('estado', 'pendiente_pago') // Solo mostramos lo que falta por cocinar
        .order('created_at', { ascending: true }) // FIFO: El primero que llega es el primero en salir
      
      if (data) setPedidos(data as Pedido[])
    }

    // 3. Ejecutamos la carga inicial
    cargarPedidos()

    // 4. SUSCRIPCIÓN EN TIEMPO REAL
    const canal = supabase
      .channel('cambios-cocina')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'pedidos' }, 
          () => {
            // Cada vez que pase algo en la tabla, refrescamos la lista
            cargarPedidos()
          }
      )
      .subscribe()

    // 5. Limpieza al cerrar la página
    return () => {
      supabase.removeChannel(canal)
    }
  }, [])

  // 6. Función para cuando el Chef termina un pedido
  const terminarPedido = async (id: string) => {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'listo' })
      .eq('id', id)
    
    if (error) console.error("Error al actualizar:", error.message)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <header className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold flex gap-3 items-center">
          👨‍🍳 Panel de Cocina
        </h1>
        <span className="bg-slate-800 px-4 py-2 rounded-full text-sm font-mono text-orange-400 border border-orange-500/30">
          En línea — Tiempo Real
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pedidos.map((p) => (
          <div key={p.id} className="bg-slate-800 border-t-4 border-orange-500 p-6 rounded-xl shadow-2xl transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs text-slate-400 font-mono">ID: {p.id.slice(0, 8)}</p>
                <h2 className="text-xl font-black text-orange-100 uppercase">{p.cliente}</h2>
              </div>
              <span className="text-xs text-slate-400 italic">
                {new Date(p.created_at).toLocaleTimeString()}
              </span>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6 border border-slate-700/50">
              <ul className="space-y-3">
                {p.items?.map((item, index) => (
                  <li key={index} className="flex justify-between items-center text-lg">
                    <span>{item.nombre}</span>
                    <span className="bg-slate-700 text-orange-400 text-xs px-2 py-1 rounded font-bold">x1</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => terminarPedido(p.id)}
              className="w-full bg-orange-600 hover:bg-orange-500 active:scale-95 text-white p-4 rounded-xl font-black text-lg transition-all shadow-lg shadow-orange-900/20"
            >
              MARCAR COMO LISTO ✅
            </button>
          </div>
        ))}
      </div>
      
      {pedidos.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-32 opacity-40">
          <div className="text-6xl mb-4">😴</div>
          <p className="text-2xl font-medium">Bandeja de entrada vacía</p>
          <p className="text-sm italic">Esperando que un cliente haga un pedido...</p>
        </div>
      )}
    </div>
  )
}