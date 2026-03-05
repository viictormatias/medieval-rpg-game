'use client'
import { useState, useEffect } from 'react'
import { Profile, getUserInventory, toggleEquip } from '@/lib/gameActions'
import { ITEMS as CATALOG_ITEMS, ItemType } from '@/lib/items'
import { checkItemRequirements, deriveSoulsStats } from '@/lib/soulslike'

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
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
    const [selectedItem, setSelectedItem] = useState<any | null>(null)

    const loadInventory = async () => {
        const items = await getUserInventory(profile.id)
        setInvItems(items || [])
        setLoading(false)
    }

    useEffect(() => { loadInventory() }, [profile.id])

    const handleToggleEquip = async (inventoryId: string) => {
        const success = await toggleEquip(profile.id, inventoryId)
        if (success) { loadInventory(); onRefresh() }
    }

    const handleDragStart = (e: React.DragEvent, inventoryId: string) => {
        setDraggedItemId(inventoryId)
        e.dataTransfer.setData('inventoryId', inventoryId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault() }

    const GRID_SIZE = 30
    const getRarity = (item: any) => {
        if (item.rarity && RARITY_COLORS[item.rarity]) return item.rarity
        if (item.price > 2000) return 'legendary'
        if (item.price > 1000) return 'epic'
        if (item.price > 500) return 'rare'
        if (item.price > 100) return 'uncommon'
        return 'common'
    }

    const itemsWithDetails = invItems.map(invEntry => {
        const spec = CATALOG_ITEMS.find(it => it.id === invEntry.item_id)
        if (!spec) return null
        return { ...spec, ...invEntry, catalogId: spec.id }
    }).filter(Boolean) as any[]

    const equippedItems = itemsWithDetails.filter(i => i.is_equipped)
    const equippedHelmet = equippedItems.find(i => i.type === 'helmet')
    const equippedChest = equippedItems.find(i => i.type === 'chest')
    const equippedGloves = equippedItems.find(i => i.type === 'gloves')
    const equippedLegs = equippedItems.find(i => i.type === 'legs')
    const equippedBoots = equippedItems.find(i => i.type === 'boots')
    const equippedWeapon = equippedItems.find(i => i.type === 'weapon')
    const equippedShield = equippedItems.find(i => i.type === 'shield')
    const soulsStats = deriveSoulsStats(profile, equippedItems)

    const totalBonuses: Record<string, number> = {}
    equippedItems.forEach(item => {
        Object.entries(item.stats || {}).forEach(([stat, val]) => {
            totalBonuses[stat] = (totalBonuses[stat] || 0) + (val as number)
        })
    })

    const unequippedItems = itemsWithDetails.filter(i => !i.is_equipped)
    const grid = Array(GRID_SIZE).fill(null).map((_, i) => unequippedItems[i] || null)

    const handleDropOnPaperdoll = async (e: React.DragEvent, slotType: ItemType) => {
        e.preventDefault()
        const inventoryId = e.dataTransfer.getData('inventoryId')
        if (!inventoryId) return
        const itemToEquip = itemsWithDetails.find(i => i.id === inventoryId)
        if (!itemToEquip || itemToEquip.type !== slotType) return
        const req = checkItemRequirements(profile, itemToEquip)
        if (!req.meets) return
        if (!itemToEquip.is_equipped) await handleToggleEquip(inventoryId)
        setDraggedItemId(null)
    }

    const handleDropOnGrid = async (e: React.DragEvent) => {
        e.preventDefault()
        const inventoryId = e.dataTransfer.getData('inventoryId')
        if (!inventoryId) return
        const itemToUnequip = itemsWithDetails.find(i => i.id === inventoryId)
        if (!itemToUnequip) return
        if (itemToUnequip.is_equipped) await handleToggleEquip(inventoryId)
        setDraggedItemId(null)
    }

    /* ────────────── Slot de paperdoll individual ────────────── */
    const PaperdollSlot = ({
        item, slotType, label, fallbackIcon, size = 'md'
    }: {
        item: any; slotType: ItemType; label: string; fallbackIcon: string; size?: 'sm' | 'md' | 'lg'
    }) => {
        const rarity = item ? getRarity(item) : 'common'
        const rc = RARITY_COLORS[rarity] || RARITY_COLORS.common
        const req = item ? checkItemRequirements(profile, item) : null
        const isSelected = selectedItem?.id === item?.id

        const sizeMap = { sm: '52px', md: '64px', lg: '76px' }
        const dim = sizeMap[size]

        return (
            <div className="flex flex-col items-center gap-1" style={{ userSelect: 'none' }}>
                <span style={{
                    fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.12em',
                    color: '#6b7280', fontFamily: 'serif', whiteSpace: 'nowrap'
                }}>{label}</span>
                <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnPaperdoll(e, slotType)}
                    onClick={() => {
                        if (item) {
                            setSelectedItem(isSelected ? null : item)
                            if (req?.meets) handleToggleEquip(item.id)
                        }
                    }}
                    draggable={!!item}
                    onDragStart={(e) => item && handleDragStart(e, item.id)}
                    className="group relative flex items-center justify-center transition-all duration-200"
                    style={{
                        width: dim, height: dim,
                        background: item
                            ? `linear-gradient(145deg, #1c1208, #0d0d0d)`
                            : 'rgba(0,0,0,0.25)',
                        border: item
                            ? `2px solid ${req?.meets ? rc.border : '#dc2626'}`
                            : '2px dashed #2a2a2a',
                        borderRadius: '6px',
                        boxShadow: item
                            ? `0 0 18px ${req?.meets ? rc.glow : 'rgba(220,38,38,0.25)'}, inset 0 0 8px rgba(0,0,0,0.5)`
                            : 'inset 0 0 8px rgba(0,0,0,0.5)',
                        cursor: item ? 'pointer' : 'default',
                        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    }}
                >
                    {item ? (
                        <>
                            <span style={{ fontSize: size === 'lg' ? '2rem' : size === 'md' ? '1.6rem' : '1.2rem', filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.25))' }}>
                                {item.icon}
                            </span>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
                                style={{
                                    background: 'linear-gradient(160deg,#140e04,#0d0d0d)',
                                    border: `1px solid ${req?.meets ? rc.border : '#dc2626'}`,
                                    borderRadius: '6px',
                                    boxShadow: `0 8px 32px rgba(0,0,0,0.9), 0 0 12px ${rc.glow}`,
                                }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#f2b90d', marginBottom: 4 }}>{item.name}</div>
                                <div style={{ fontSize: '9px', color: rc.textColor, marginBottom: 2 }}>{rc.label}</div>
                                <div style={{ fontSize: '9px', color: '#6b7280', marginBottom: 4 }}>Peso {Number(item.weight || 0).toFixed(1)}</div>
                                {item.stats && Object.keys(item.stats).length > 0 && (
                                    <div style={{ fontSize: '9px', marginBottom: 2 }}>
                                        {Object.entries(item.stats as Record<string, number>).map(([k, v]) => (
                                            <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: '#9ca3af', textTransform: 'uppercase' }}>{k}</span>
                                                <span style={{ color: v >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>{v > 0 ? '+' : ''}{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {item.requirements && (
                                    <div style={{ fontSize: '9px', color: req?.meets ? '#4ade80' : '#f87171', marginTop: 4 }}>
                                        Req: {Object.entries(item.requirements as Record<string, number>).map(([k, v]) => `${k.slice(0, 3).toUpperCase()} ${v}`).join(' | ')}
                                    </div>
                                )}
                                {!req?.meets && (
                                    <div style={{ fontSize: '9px', color: '#f87171', marginTop: 2 }}>
                                        Faltando: {req?.unmetLabels?.join(', ')}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <span style={{ opacity: 0.18, fontSize: size === 'lg' ? '1.8rem' : '1.3rem' }}>{fallbackIcon}</span>
                    )}
                </div>
            </div>
        )
    }

    if (loading) return <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', padding: '2rem' }}>Carregando inventário...</div>

    /* ─────────── Layout da carga de equip ─────────── */
    const loadPct = soulsStats.equipLoadPct
    const tierColor = loadPct < 30 ? '#4ade80' : loadPct < 70 ? '#f2b90d' : loadPct < 100 ? '#f97316' : '#dc2626'

    return (
        <div className="space-y-6">
            {/* ═══════════════ TÍTULO ═══════════════ */}
            <div className="ornament-divider text-[10px]">Equipamentos Ativos</div>

            {/* ═══════════════ PAPERDOLL + STATS ═══════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'start' }}>

                {/* ── Coluna Esquerda: Arma + Stats de carga ── */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <PaperdollSlot item={equippedWeapon} slotType="weapon" label="Arma" fallbackIcon="⚔️" size="lg" />
                    <PaperdollSlot item={equippedShield} slotType="shield" label="Escudo" fallbackIcon="🔰" size="lg" />

                    {/* Bônus Resumo */}
                    <div style={{
                        width: '100%', padding: '10px 12px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid #2a2a2a', borderRadius: '6px',
                        fontSize: '9px'
                    }}>
                        <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: 8, textAlign: 'center' }}>
                            Bônus Equipados
                        </div>
                        {Object.keys(totalBonuses).length > 0 ? (
                            Object.entries(totalBonuses).map(([stat, val]) => (
                                <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', paddingBottom: 4, marginBottom: 4 }}>
                                    <span style={{ color: '#9ca3af', textTransform: 'uppercase' }}>{stat}</span>
                                    <span style={{ color: val >= 0 ? '#4ade80' : '#f87171', fontWeight: 700, fontFamily: 'monospace' }}>
                                        {val > 0 ? '+' : ''}{val}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#4b5563', textAlign: 'center', fontStyle: 'italic' }}>Nenhum bônus ativo</div>
                        )}
                    </div>
                </div>

                {/* ── Centro: Silhueta Humana ── */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '140px' }}>

                    {/* Capacete */}
                    <PaperdollSlot item={equippedHelmet} slotType="helmet" label="Capacete" fallbackIcon="🪖" size="lg" />

                    {/* Silhueta do corpo + Peitoral */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* SVG silhueta */}
                        <svg width="80" height="110" viewBox="0 0 80 110" style={{ position: 'absolute', opacity: 0.12, pointerEvents: 'none' }}>
                            {/* Cabeça */}
                            <ellipse cx="40" cy="12" rx="9" ry="10" fill="#c9a84c" />
                            {/* Pescoço */}
                            <rect x="36" y="21" width="8" height="6" fill="#c9a84c" />
                            {/* Tronco */}
                            <path d="M20 27 Q40 24 60 27 L62 68 Q40 72 18 68 Z" fill="#c9a84c" />
                            {/* Braço esquerdo */}
                            <path d="M20 30 Q10 38 8 55 Q9 60 13 58 Q16 44 24 38 Z" fill="#c9a84c" />
                            {/* Braço direito */}
                            <path d="M60 30 Q70 38 72 55 Q71 60 67 58 Q64 44 56 38 Z" fill="#c9a84c" />
                            {/* Perna esquerda */}
                            <path d="M27 68 Q25 82 24 100 Q28 104 33 100 Q34 82 38 68 Z" fill="#c9a84c" />
                            {/* Perna direita */}
                            <path d="M53 68 Q55 82 56 100 Q52 104 47 100 Q46 82 42 68 Z" fill="#c9a84c" />
                        </svg>
                        {/* Peitoral centralizado */}
                        <PaperdollSlot item={equippedChest} slotType="chest" label="Peitoral" fallbackIcon="🛡️" size="lg" />
                    </div>

                    {/* Luvas */}
                    <PaperdollSlot item={equippedGloves} slotType="gloves" label="Luvas" fallbackIcon="🧤" size="md" />

                    {/* Calças */}
                    <PaperdollSlot item={equippedLegs} slotType="legs" label="Calças" fallbackIcon="👖" size="md" />

                    {/* Botas */}
                    <PaperdollSlot item={equippedBoots} slotType="boots" label="Botas" fallbackIcon="👢" size="md" />
                </div>

                {/* ── Coluna Direita: Resumo Souls-like ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                        width: '100%', padding: '12px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid #2a2a2a', borderRadius: '6px',
                    }}>
                        <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#c9a84c', textAlign: 'center', marginBottom: 10 }}>
                            Resumo Souls
                        </div>

                        {/* Barra de carga */}
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9ca3af', marginBottom: 4 }}>
                                <span style={{ textTransform: 'uppercase' }}>Carga</span>
                                <span style={{ color: '#c9a84c', fontFamily: 'monospace' }}>
                                    {soulsStats.equipLoadCurrent.toFixed(1)} / {soulsStats.equipLoadMax.toFixed(1)}
                                </span>
                            </div>
                            <div style={{ height: '6px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', width: `${Math.min(loadPct, 100)}%`,
                                    background: `linear-gradient(90deg, ${tierColor}88, ${tierColor})`,
                                    borderRadius: '3px', transition: 'width 0.4s ease',
                                }} />
                            </div>
                        </div>

                        {[
                            { label: 'Tier', value: `${soulsStats.equipTier} (${soulsStats.equipLoadPct.toFixed(0)}%)` },
                            { label: 'AR', value: String(soulsStats.attackRating) },
                        ].map(({ label, value }) => (
                            <div key={label} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderBottom: '1px solid #1a1a1a', paddingBottom: 6, marginBottom: 6, fontSize: '9px'
                            }}>
                                <span style={{ textTransform: 'uppercase', color: '#6b7280' }}>{label}</span>
                                <span style={{ color: '#c9a84c', fontFamily: 'monospace' }}>{value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Items equipados - resumo */}
                    <div style={{
                        width: '100%', padding: '10px 12px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid #2a2a2a', borderRadius: '6px',
                        fontSize: '9px'
                    }}>
                        <div style={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: 8, textAlign: 'center' }}>
                            Itens Equipados
                        </div>
                        {equippedItems.length === 0 ? (
                            <div style={{ color: '#4b5563', textAlign: 'center', fontStyle: 'italic' }}>Nenhum item equipado</div>
                        ) : (
                            equippedItems.map(item => {
                                const rarity = getRarity(item)
                                const rc = RARITY_COLORS[rarity] || RARITY_COLORS.common
                                const req = checkItemRequirements(profile, item)
                                return (
                                    <div key={item.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        borderBottom: '1px solid #1a1a1a', paddingBottom: 4, marginBottom: 4
                                    }}>
                                        <span style={{ fontSize: '12px' }}>{item.icon}</span>
                                        <span style={{ color: rc.textColor, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.name}
                                        </span>
                                        {!req.meets && <span style={{ color: '#f87171', fontSize: '8px' }}>!</span>}
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════ BOLSA GERAL ═══════════════ */}
            <div className="ornament-divider text-[10px]">Bolsa Geral ({unequippedItems.length}/{GRID_SIZE} slots)</div>

            <div
                onDragOver={handleDragOver}
                onDrop={handleDropOnGrid}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(10, 1fr)',
                    gap: '6px',
                    padding: '12px',
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid #2a2a2a',
                    borderRadius: '6px',
                    minHeight: '180px',
                }}
            >
                {grid.map((item, i) => {
                    const rarity = item ? getRarity(item) : 'common'
                    const rc = RARITY_COLORS[rarity] || RARITY_COLORS.common
                    const req = item ? checkItemRequirements(profile, item) : null
                    return (
                        <div
                            key={item ? item.id : `empty-${i}`}
                            onClick={() => item && req?.meets && handleToggleEquip(item.id)}
                            onDragStart={(e) => item && handleDragStart(e, item.id)}
                            draggable={!!item}
                            className="group relative flex items-center justify-center aspect-square transition-all duration-150"
                            style={{
                                background: item ? 'linear-gradient(135deg, #1a1208, #0d0d0d)' : 'rgba(0,0,0,0.3)',
                                border: item
                                    ? `1px solid ${req?.meets ? rc.border : '#dc2626'}`
                                    : '1px dashed #1e1e1e',
                                borderRadius: '4px',
                                cursor: item ? 'grab' : 'default',
                                boxShadow: item ? `0 0 8px ${rc.glow}` : 'none',
                                opacity: draggedItemId === item?.id ? 0.5 : 1,
                                transform: 'scale(1)',
                            }}
                            onMouseEnter={e => { if (item) (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                        >
                            {item ? (
                                <>
                                    <span style={{ fontSize: '1.25rem', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.15))' }}>
                                        {item.icon}
                                    </span>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-40 p-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50"
                                        style={{
                                            background: 'linear-gradient(160deg,#140e04,#0d0d0d)',
                                            border: `1px solid ${req?.meets ? rc.border : '#dc2626'}`,
                                            borderRadius: '5px',
                                            boxShadow: '0 6px 24px rgba(0,0,0,0.9)',
                                            fontSize: '8px',
                                        }}>
                                        <div style={{ fontWeight: 700, color: '#f2b90d', marginBottom: 2 }}>{item.name}</div>
                                        <div style={{ color: rc.textColor, marginBottom: 2 }}>{rc.label} · {item.type}</div>
                                        <div style={{ color: '#6b7280' }}>Peso {Number(item.weight || 0).toFixed(1)}</div>
                                        {item.stats && Object.keys(item.stats).length > 0 && (
                                            <div style={{ marginTop: 4 }}>
                                                {Object.entries(item.stats as Record<string, number>).map(([k, v]) => (
                                                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#9ca3af', textTransform: 'uppercase' }}>{k}</span>
                                                        <span style={{ color: v >= 0 ? '#4ade80' : '#f87171' }}>{v > 0 ? '+' : ''}{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {item.requirements && (
                                            <div style={{ marginTop: 4, color: req?.meets ? '#4ade80' : '#f87171' }}>
                                                Req: {Object.entries(item.requirements as Record<string, number>).map(([k, v]) => `${k.slice(0, 3).toUpperCase()} ${v}`).join(' | ')}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <span style={{ fontSize: '7px', color: '#374151', fontFamily: 'monospace' }}>{i + 1}</span>
                            )}
                        </div>
                    )
                })}
            </div>

            <div style={{ textAlign: 'center', fontSize: '9px', color: '#4b5563', fontStyle: 'italic', marginTop: 4 }}>
                Clique para equipar/desequipar · Arraste para o slot correto · Borda vermelha = requisito faltando
            </div>
        </div>
    )
}
