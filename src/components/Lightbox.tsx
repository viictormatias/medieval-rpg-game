'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface LightboxProps {
    src: string | null
    isOpen: boolean
    onClose: () => void
    alt?: string
    stats?: Record<string, number>
}

export default function Lightbox({ src, isOpen, onClose, alt, stats }: LightboxProps) {
    const [mounted, setMounted] = useState(false)
    const formatSigned = (value: number) => (value >= 0 ? `+${value}` : `${value}`)

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

    if (!isOpen || !src || !mounted) return null

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
                            src={src}
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
                    {stats && Object.keys(stats).length > 0 && (
                        <div className="w-full md:w-64 western-border bg-black/80 p-5 flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500">
                            <h3 className="title-western text-gold text-center text-lg border-b border-gold/20 pb-2 tracking-widest">
                                Atributos
                            </h3>
                            <div className="space-y-3">
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
