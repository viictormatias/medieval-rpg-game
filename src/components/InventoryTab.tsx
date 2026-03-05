import { useState, useEffect } from 'react'
import { Profile, getUserInventory, toggleEquip } from '@/lib/gameActions'
import { ITEMS as CATALOG_ITEMS } from '@/lib/items'

const RARITY_COLORS: Record<string, { border: string; glow: string; label: string; textColor: string }> = {
    common: { border: '#3a3a3a', glow: 'transparent', label: 'Comum', textColor: '#9ca3af' },
    uncommon: { border: '#22c55e', glow: 'rgba(34,197,94,0.3)', label: 'Incomum', textColor: '#4ade80' },
    rare: { border: '#3b82f6', glow: 'rgba(59,130,246,0.3)', label: 'Raro', textColor: '#60a5fa' },
    epic: { border: '#a855f7', glow: 'rgba(168,85,247,0.4)', label: 'Épico', textColor: '#c084fc' },
    legendary: { border: '#f2b90d', glow: 'rgba(242,185,13,0.4)', label: 'Lendário', textColor: '#f2b90d' },
}

interface InventoryTabProps {
    profile: Profile
    onRefresh: () => void
}

export default function InventoryTab({ profile, onRefresh }: InventoryTabProps) {
    const [invItems, setInvItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const loadInventory = async () => {
        const items = await getUserInventory(profile.id)
        setInvItems(items || [])
        setLoading(false)
    }

    useEffect(() => {
        loadInventory()
    }, [profile.id])

    const handleToggleEquip = async (inventoryId: string) => {
        const success = await toggleEquip(profile.id, inventoryId)
        if (success) {
            loadInventory()
            onRefresh()
        }
    }

    const GRID_SIZE = 30
    const itemsWithDetails = invItems.map(invEntry => {
        const spec = CATALOG_ITEMS.find(it => it.id === invEntry.item_id)
        return { ...invEntry, ...spec }
    })

    const grid = Array(GRID_SIZE).fill(null).map((_, i) => itemsWithDetails[i] || null)
    const equipped = itemsWithDetails.filter(i => i.is_equipped)

    return (
        <div className="space-y-6">
            <div className="ornament-divider text-[10px]">Equipamentos Ativos</div>

            {/* Zona de Equipados */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {equipped.map(item => {
                    const rarity = item.price > 2000 ? 'legendary' : item.price > 1000 ? 'epic' : item.price > 500 ? 'rare' : item.price > 100 ? 'uncommon' : 'common'
                    const rc = RARITY_COLORS[rarity]
                    return (
                        <div
                            key={item.id}
                            onClick={() => handleToggleEquip(item.id)}
                            className="medieval-border p-3 flex flex-col items-center gap-2 text-center group relative cursor-pointer transition-all hover:scale-105"
                            style={{ border: `2px solid ${rc.border}`, boxShadow: `0 0 12px ${rc.glow}` }}
                        >
                            <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.2))' }}>
                                {item.icon}
                            </span>
                            <div className="text-[10px] font-bold text-gold leading-tight">{item.name}</div>
                            <div className="text-[8px] uppercase tracking-widest text-gray-600">{item.type}</div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 p-3 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none"
                                style={{
                                    background: 'linear-gradient(135deg, #1a1208, #0d0d0d)',
                                    border: `1px solid ${rc.border}`,
                                    boxShadow: `0 0 20px rgba(0,0,0,0.8), 0 0 10px ${rc.glow}`,
                                }}
                            >
                                <div className="text-[10px] font-bold text-gold mb-1">{item.name}</div>
                                <div className="text-[9px] mb-1" style={{ color: rc.textColor }}>{rc.label}</div>
                                <div className="h-px mb-1" style={{ background: `linear-gradient(to right, transparent, ${rc.border}, transparent)` }} />
                                <div className="text-[9px] text-gray-400 capitalize">
                                    {Object.entries(item.stats || {}).map(([s, v]) => `${s}: +${v}`).join(', ')}
                                </div>
                                <div className="text-[9px] text-blue-400 mt-1 font-bold uppercase">✓ Equipado (Clique p/ Tirar)</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="ornament-divider text-[10px]">Inventário ({invItems.length}/{GRID_SIZE} slots)</div>

            {/* Grade de Inventário */}
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {grid.map((item, i) => {
                    const rc = item ? RARITY_COLORS[item.rarity] : RARITY_COLORS.common
                    return (
                        <div
                            key={i}
                            onClick={() => item && handleToggleEquip(item.id)}
                            className={`aspect-square flex items-center justify-center text-xl group relative cursor-pointer transition-all
                ${item ? 'hover:scale-110' : 'opacity-20'}
              `}
                            style={{
                                background: item ? 'linear-gradient(135deg, #1a1a1a, #0d0d0d)' : 'rgba(0,0,0,0.3)',
                                border: item ? `1px solid ${rc.border}` : '1px dashed #2a2a2a',
                                borderRadius: '3px',
                                boxShadow: item?.is_equipped ? `0 0 8px ${rc.glow}` : undefined,
                            }}
                        >
                            {item ? (
                                <>
                                    <span style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))' }}>
                                        {item.icon}
                                    </span>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-32 p-2 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none"
                                        style={{
                                            background: '#0d0d0d',
                                            border: `1px solid ${rc.border}`,
                                            boxShadow: '0 0 16px rgba(0,0,0,0.9)',
                                        }}
                                    >
                                        <div className="text-[9px] font-bold text-gold">{item.name}</div>
                                        <div className="text-[8px] mt-0.5 text-gray-400">
                                            {Object.entries(item.stats || {}).map(([s, v]) => `${s}: +${v}`).join(', ')}
                                        </div>
                                        {item.is_equipped && <div className="text-[8px] text-blue-400 font-bold mt-0.5 uppercase">Equipado</div>}
                                        {!item.is_equipped && <div className="text-[8px] text-gold font-bold mt-0.5 uppercase">Clique p/ Equipar</div>}
                                    </div>
                                </>
                            ) : (
                                <span className="text-[8px] text-gray-700 font-mono">{i + i}</span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
