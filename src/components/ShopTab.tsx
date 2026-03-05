'use client'

import { useState } from 'react'
import { Profile, buyItem } from '@/lib/gameActions'
import { ITEMS, Item } from '@/lib/items'

interface ShopTabProps {
    profile: Profile
    onRefresh: () => void
}

export default function ShopTab({ profile, onRefresh }: ShopTabProps) {
    const [buyingId, setBuyingId] = useState<string | null>(null)
    const [filter, setFilter] = useState<'all' | 'weapon' | 'armor'>('all')

    const handleBuy = async (item: Item) => {
        if (profile.gold < item.price) return
        setBuyingId(item.id)

        const success = await buyItem(profile.id, item.id, item.price)
        if (success) {
            onRefresh()
        } else {
            alert('Falha na compra. Tente novamente.')
        }
        setBuyingId(null)
    }

    const filteredItems = ITEMS.filter(it => filter === 'all' || it.type === filter)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gold title-medieval uppercase tracking-widest">
                    💰 Mercador da Cidadela
                </h2>
                <div className="flex gap-2">
                    {['all', 'weapon', 'armor'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1 text-[10px] uppercase font-bold border transition-all ${filter === f ? 'border-gold text-gold bg-gold/5' : 'border-[#2a2a2a] text-gray-500'
                                }`}
                        >
                            {f === 'all' ? 'Tudo' : f === 'weapon' ? 'Armas' : 'Armaduras'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item) => {
                    const canAfford = profile.gold >= item.price
                    return (
                        <div key={item.id} className="medieval-border p-4 bg-[#0d0d0d] flex gap-4 items-start group">
                            <div className="w-16 h-16 bg-[#111] border border-[#2a2a2a] flex items-center justify-center text-3xl rounded-sm">
                                {item.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-white group-hover:text-gold transition-colors">{item.name}</h3>
                                    <span className="text-gold font-mono font-bold text-xs">{item.price} G</span>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-tight mb-3 italic">"{item.description}"</p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {Object.entries(item.stats).map(([stat, val]) => (
                                        <span key={stat} className="text-[9px] px-1.5 py-0.5 bg-black border border-[#222] text-gray-400">
                                            <span className="opacity-50 uppercase mr-1">{stat}</span>
                                            <span className={Number(val) > 0 ? 'text-green-500' : 'text-red-500'}>
                                                {Number(val) > 0 ? `+${val}` : val}
                                            </span>
                                        </span>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleBuy(item)}
                                    disabled={!canAfford || buyingId === item.id}
                                    className={`w-full py-2 text-[10px] uppercase font-bold transition-all ${canAfford
                                            ? 'bg-gold/10 border border-gold text-gold hover:bg-gold hover:text-black'
                                            : 'bg-gray-900 border border-gray-800 text-gray-600 grayscale cursor-not-allowed'
                                        }`}
                                >
                                    {buyingId === item.id ? 'Processando...' : canAfford ? 'Comprar Item' : 'Ouro Insuficiente'}
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
