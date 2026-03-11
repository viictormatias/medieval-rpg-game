'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { getOptimizedAssetSrc } from '@/lib/assets'

interface LightboxProps {
    src: string | null
    isOpen: boolean
    onClose: () => void
    alt?: string
    stats?: Record<string, number>
    requirements?: Record<string, number>
}

export default function Lightbox({ src, isOpen, onClose, alt, stats, requirements }: LightboxProps) {
    const [mounted, setMounted] = useState(false)
    const formatSigned = (value: number) => (value >= 0 ? `+${value}` : `${value}`)
    const optimizedSrc = getOptimizedAssetSrc(src)

    // Garante que o portal só é renderizado no cliente
    useEffect(() => {
        setMounted(true)
    }, [])

    // Bloqueia o scroll do body enquanto o lightbox estiver aberto
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    if (!isOpen || !optimizedSrc || !mounted) return null

    const content = (
        <div
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md transition-all duration-300 animate-in fade-in"
            onClick={onClose}
        >
            <button
                className="absolute top-6 right-6 text-white/50 hover:text-white text-4xl font-light transition-all z-10"
                onClick={onClose}
            >
                &times;
            </button>

            <div
                className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Imagem Principal */}
                    <div className="relative western-border p-1 bg-black shadow-2xl overflow-hidden group">
                        <img
                            src={optimizedSrc}
                            alt={alt || "View Image"}
                            className="max-w-[80vw] md:max-w-md max-h-[60vh] md:max-h-[80vh] object-contain rounded-sm select-none animate-in zoom-in-95 duration-300"
                        />
                        {/* Decorative corner accents */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold/40 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold/40 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold/40 pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold/40 pointer-events-none" />
                    </div>

                    {/* Painel Lateral de Stats (Condicional) */}
                    {((stats && Object.keys(stats).length > 0) || (requirements && Object.keys(requirements).length > 0)) && (
                        <div className="w-full md:w-72 western-border bg-black/90 p-5 flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                            {requirements && Object.keys(requirements).length > 0 && (
                                <>
                                    <h4 className="text-[10px] text-red-500/80 font-black uppercase tracking-widest text-center border-b border-red-900/20 pb-1">
                                        Requisitos de Uso
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(requirements).map(([attr, needed]) => (
                                            <div key={attr} className="flex flex-col items-center bg-red-950/10 border border-red-900/20 p-2 rounded-sm">
                                                <span className="text-[9px] text-gray-500 uppercase font-bold">
                                                    {attr === 'strength' ? '⚔️ FOR' : attr === 'agility' ? '💨 AGI' : attr === 'accuracy' ? '🎯 PON' : '💪 VIG'}
                                                </span>
                                                <span className="text-red-400 font-black text-sm">{needed}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {stats && Object.keys(stats).length > 0 && (
                                <>
                                    <h3 className="title-western text-gold text-center text-lg border-b border-gold/20 pb-2 mt-2 tracking-widest">
                                        Atributos
                                    </h3>
                                    <div className="space-y-2">
                                        {Object.entries(stats).map(([stat, val]) => (
                                            <div key={stat} className="flex justify-between items-center bg-gold/5 border border-gold/10 p-2 rounded-sm">
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                                                    {stat === 'strength' ? 'Força' :
                                                        stat === 'agility' ? 'Agilidade' :
                                                            stat === 'accuracy' ? 'Pontaria' :
                                                                stat === 'vigor' ? 'Vigor' :
                                                                    stat === 'defense' ? 'Defesa' :
                                                                        stat === 'hp_current' ? 'Vida' :
                                                                            stat === 'energy' ? 'Energia' : stat}
                                                </span>
                                                <span className="text-gold font-bold text-sm">{formatSigned(Number(val))}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-center gap-2">
                    {alt && (
                        <div className="title-western text-gold text-2xl md:text-3xl uppercase tracking-[0.2em] drop-shadow-lg text-center px-4">
                            {alt}
                        </div>
                    )}

                    <div className="text-[10px] text-white/30 uppercase tracking-[0.5em] font-bold">
                        Clique fora para fechar
                    </div>
                </div>
            </div>
        </div>
    )

    return createPortal(content, document.body)
}
