'use client'

import { useState } from 'react'
import { createCharacter, ClassType } from '@/lib/gameActions'
import CharacterPortrait from './CharacterPortrait'

interface ClassSelectionScreenProps {
    userId: string
    onCreated: () => void
}

const CLASSES = [
    {
        id: 'Cavaleiro' as ClassType,
        name: 'Cavaleiro',
        emoji: '🛡️',
        description: 'Um guerreiro robusto com foco em defesa e sobrevivência. Começa com mais HP.',
        stats: { HP: 120, FOR: 10, DEF: 10, AGI: 5, PRE: 5 },
        color: 'border-blue-500'
    },
    {
        id: 'Nobre' as ClassType,
        name: 'Nobre',
        emoji: '👑',
        description: 'Elite instruída com foco em agilidade, precisão e recursos iniciais elevados.',
        stats: { HP: 100, FOR: 5, DEF: 5, AGI: 10, PRE: 10 },
        color: 'border-gold'
    },
    {
        id: 'Errante' as ClassType,
        name: 'Errante',
        emoji: '🗡️',
        description: 'Sobrevivente versátil, balanceado em todos os aspectos. Começa com uma adaga rusty.',
        stats: { HP: 100, FOR: 7, DEF: 7, AGI: 7, PRE: 7 },
        color: 'border-gray-400'
    }
]

export default function ClassSelectionScreen({ userId, onCreated }: ClassSelectionScreenProps) {
    const [selectedClass, setSelectedClass] = useState<ClassType>('Errante')
    const [username, setUsername] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const handleCreate = async () => {
        if (!username.trim()) return
        setIsCreating(true)
        const success = await createCharacter(userId, username, selectedClass)
        if (success) {
            onCreated()
        } else {
            setIsCreating(false)
            alert('Erro ao criar personagem. Tente outro nome.')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d0d0d] z-50 relative overflow-hidden">
            {/* Imagem de fundo persistente */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
                style={{
                    backgroundImage: 'url("/loadingscreen.jpeg")',
                    filter: 'grayscale(0.2) contrast(1.1)'
                }}
            />

            {/* Overlay Noir Gradiente */}
            <div
                className="absolute inset-0 z-1"
                style={{
                    background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)'
                }}
            />

            <div className="max-w-4xl w-full medieval-border p-8 bg-black/60 relative z-10 backdrop-blur-md"
                style={{
                    border: '1px solid rgba(242,185,13,0.2)',
                    boxShadow: '0 0 60px rgba(0,0,0,0.9), 0 0 30px rgba(242,185,13,0.1)',
                }}
            >
                <h1 className="text-3xl font-black text-gold title-medieval text-center mb-8 uppercase tracking-widest">
                    Forje sua Lenda
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {CLASSES.map((cls) => (
                        <div
                            key={cls.id}
                            onClick={() => setSelectedClass(cls.id)}
                            className={`cursor-pointer transition-all duration-300 p-4 border-2 rounded-sm text-center flex flex-col items-center gap-4 ${selectedClass === cls.id
                                ? 'bg-gold/10 border-gold scale-105 shadow-[0_0_20px_rgba(242,185,13,0.3)]'
                                : 'bg-[#111] border-[#3a3a3a] opacity-60 hover:opacity-100'
                                }`}
                        >
                            <CharacterPortrait
                                fallbackEmoji={cls.emoji}
                                size="md"
                                borderColor={cls.id === 'Cavaleiro' ? 'blue' : cls.id === 'Nobre' ? 'gold' : 'red'}
                            />
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">{cls.name}</h3>
                                <p className="text-[10px] text-gray-400 leading-relaxed mb-4">{cls.description}</p>
                            </div>
                            <div className="w-full grid grid-cols-2 gap-1 text-[9px] uppercase font-mono">
                                {Object.entries(cls.stats).map(([stat, val]) => (
                                    <div key={stat} className="flex justify-between border-b border-[#2a2a2a] py-1">
                                        <span className="text-gray-600">{stat}</span>
                                        <span className="text-gold font-bold">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                    <input
                        type="text"
                        placeholder="Nome do Personagem"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-[#111] border border-[#3a3a3a] text-white p-3 text-center outline-none focus:border-gold transition-all"
                        maxLength={20}
                    />
                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !username.trim()}
                        className="btn-medieval w-full py-4 text-xl flex items-center justify-center gap-2"
                    >
                        {isCreating ? 'Criando...' : '🔥 INICIAR JORNADA'}
                    </button>
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest text-center">
                        Seu destino aguarda além das névoas...
                    </p>
                </div>
            </div>
        </div>
    )
}
