'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    createCharacter,
    ClassType,
    InitialStatAllocation,
    InitialStatKey,
    ONBOARDING_MAX_PER_STAT,
    ONBOARDING_STAT_POINTS,
    logout
} from '@/lib/gameActions'
import { getOptimizedAssetSrc } from '@/lib/assets'
import CharacterPortrait from './CharacterPortrait'

interface ClassSelectionScreenProps {
    userId: string
    onCreated: () => void
}

const STAT_KEYS: InitialStatKey[] = ['strength', 'defense', 'agility', 'accuracy', 'vigor']

const PRESETS: Array<{ id: string; label: string; points: InitialStatAllocation }> = [
    { id: 'balanced', label: 'Balanceada', points: { strength: 1, defense: 1, agility: 1, accuracy: 1, vigor: 1 } },
    { id: 'gatilho', label: 'Gatilho Rapido', points: { strength: 0, defense: 0, agility: 2, accuracy: 3, vigor: 0 } },
    { id: 'bruto', label: 'Bruto', points: { strength: 3, defense: 1, agility: 0, accuracy: 0, vigor: 1 } },
    { id: 'duravel', label: 'Durável', points: { strength: 0, defense: 2, agility: 0, accuracy: 0, vigor: 3 } },
]

const CLASS_DEFAULT_PRESET: Record<ClassType, InitialStatAllocation> = {
    Xerife: { strength: 0, defense: 2, agility: 0, accuracy: 0, vigor: 3 },
    Pistoleiro: { strength: 0, defense: 0, agility: 2, accuracy: 3, vigor: 0 },
    Forasteiro: { strength: 1, defense: 1, agility: 1, accuracy: 1, vigor: 1 },
    Pregador: { strength: 0, defense: 2, agility: 0, accuracy: 1, vigor: 2 },
    Nativo: { strength: 2, defense: 0, agility: 2, accuracy: 1, vigor: 0 },
    Vendedor: { strength: 0, defense: 1, agility: 1, accuracy: 2, vigor: 1 },
    CacadorDeRecompensas: { strength: 2, defense: 0, agility: 1, accuracy: 2, vigor: 0 },
}

const CLASSES = [
    {
        id: 'Xerife' as ClassType,
        name: 'Xerife',
        suggestedName: 'Silas Miller',
        age: 58,
        emoji: '👮',
        imageSrc: '/images/xerife.jpeg',
        description: 'Linha de frente resistente. Segura o duelo sob pressão.',
        flavor: 'A estrela no peito pesa tanto quanto o ferro no coldre. A lei é a única coisa que separa este mundo do abismo.',
        base: { hp: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0 },
        color: '#3b82f6'
    },
    {
        id: 'Pistoleiro' as ClassType,
        name: 'Pistoleiro',
        suggestedName: '"Kid" Cassidy',
        age: 24,
        emoji: '🔫',
        imageSrc: '/images/pistoleiro.jpeg',
        description: 'Especialista em agilidade e precisão no saque.',
        flavor: 'Rapidez não é escolha, é sobrevivência. Antes que a poeira baixe, o Kid já terá guardado a arma.',
        base: { hp: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0 },
        color: '#f2b90d'
    },
    {
        id: 'Forasteiro' as ClassType,
        name: 'Forasteiro',
        suggestedName: 'Caleb Vento-Leste',
        age: 31,
        emoji: '🌵',
        imageSrc: '/images/forasteiro.jpeg',
        description: 'Versátil e perigoso, pronto para qualquer contrato.',
        flavor: 'Ninguém sabe de onde veio, e ninguém viverá para saber para onde vai. Ele é o rastro que o vento apaga.',
        base: { hp: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0 },
        color: '#ef4444'
    },
    {
        id: 'Pregador' as ClassType,
        name: 'Pregador',
        suggestedName: 'Jedidiah',
        age: 62,
        emoji: '📖',
        imageSrc: '/images/pregador.jpeg',
        description: 'Sanção divina e resistência espiritual.',
        flavor: 'Em uma mão a Bíblia, na outra o julgamento. Ele busca salvar almas, mas não se importa em enterrar corpos.',
        base: { hp: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0 },
        color: '#a855f7'
    },
    {
        id: 'Nativo' as ClassType,
        name: 'Nativo',
        suggestedName: 'Takaani',
        age: 35,
        emoji: '🏹',
        imageSrc: '/images/nativo.jpeg',
        description: 'Guerreiro das sombras, mestre em emboscadas.',
        flavor: 'As montanhas lembram de quem era esta terra. Ele não luta por glória, luta para que o passado não seja esquecido.',
        base: { hp: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0 },
        color: '#22c55e'
    },
    {
        id: 'Vendedor' as ClassType,
        name: 'Vendedor',
        suggestedName: 'Barnaby Jones',
        age: 42,
        emoji: '💰',
        imageSrc: '/images/mercador.jpeg',
        description: 'Negociante astuto com recursos extras.',
        flavor: 'O ouro brilha mais que a honra. Se ele não puder te vencer no saque, ele te vencerá no contrato.',
        base: { hp: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0 },
        color: '#eab308'
    },
    {
        id: 'CacadorDeRecompensas' as ClassType,
        name: 'Caçador de Recompensas',
        suggestedName: 'Elias Thorne',
        age: 45,
        emoji: '🎯',
        imageSrc: '/images/cacador-de-recompensas.jpeg',
        description: 'Rastreador implacável e precisão fatal.',
        flavor: 'Para ele, homens são apenas números em um papel de \'Procurado\'. Ele nunca erra o rastro, e nunca volta de mãos vazias.',
        base: { hp: 100, strength: 0, defense: 0, agility: 0, accuracy: 0, vigor: 0 },
        color: '#f97316'
    }
]

const EMPTY_ALLOC: Record<InitialStatKey, number> = {
    strength: 0,
    defense: 0,
    agility: 0,
    accuracy: 0,
    vigor: 0,
}

export default function ClassSelectionScreen({ userId, onCreated }: ClassSelectionScreenProps) {
    const [selectedClass, setSelectedClass] = useState<ClassType>('Forasteiro')
    const [username, setUsername] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [alloc, setAlloc] = useState<Record<InitialStatKey, number>>(EMPTY_ALLOC)

    const classData = useMemo(
        () => CLASSES.find(c => c.id === selectedClass) || CLASSES[2],
        [selectedClass]
    )

    const applyClassDefaultPreset = (classType: ClassType) => {
        if (ONBOARDING_STAT_POINTS <= 0) {
            setAlloc({ ...EMPTY_ALLOC })
            return
        }
        const preset = CLASS_DEFAULT_PRESET[classType]
        setAlloc({
            strength: Number(preset.strength || 0),
            defense: Number(preset.defense || 0),
            agility: Number(preset.agility || 0),
            accuracy: Number(preset.accuracy || 0),
            vigor: Number(preset.vigor || 0),
        })
    }

    useEffect(() => {
        setAlloc({ ...EMPTY_ALLOC })
    }, [selectedClass])

    const pointsUsed = useMemo(
        () => STAT_KEYS.reduce((sum, key) => sum + alloc[key], 0),
        [alloc]
    )
    const pointsLeft = ONBOARDING_STAT_POINTS - pointsUsed

    const projected = useMemo(() => {
        const vigorBonus = alloc.vigor * 10
        return {
            hp: classData.base.hp + vigorBonus,
            strength: classData.base.strength + alloc.strength,
            defense: classData.base.defense + alloc.defense,
            agility: classData.base.agility + alloc.agility,
            accuracy: classData.base.accuracy + alloc.accuracy,
            vigor: classData.base.vigor + alloc.vigor,
        }
    }, [classData, alloc])

    const applyPreset = (presetId: string) => {
        if (ONBOARDING_STAT_POINTS <= 0) return
        const preset = PRESETS.find(p => p.id === presetId)
        if (!preset) return
        setAlloc({
            strength: Number(preset.points.strength || 0),
            defense: Number(preset.points.defense || 0),
            agility: Number(preset.points.agility || 0),
            accuracy: Number(preset.points.accuracy || 0),
            vigor: Number(preset.points.vigor || 0),
        })
    }

    const adjust = (key: InitialStatKey, delta: 1 | -1) => {
        if (ONBOARDING_STAT_POINTS <= 0) return
        setAlloc(prev => {
            const next = { ...prev }
            const current = next[key]
            const used = STAT_KEYS.reduce((sum, statKey) => sum + next[statKey], 0)
            if (delta > 0) {
                if (used >= ONBOARDING_STAT_POINTS) return prev
                if (current >= ONBOARDING_MAX_PER_STAT) return prev
                next[key] = current + 1
                return next
            }
            if (current <= 0) return prev
            next[key] = current - 1
            return next
        })
    }

    const handleCreate = async () => {
        if (!username.trim()) return
        if (ONBOARDING_STAT_POINTS > 0 && pointsLeft !== 0) {
            alert(`Distribua todos os ${ONBOARDING_STAT_POINTS} pontos iniciais.`)
            return
        }
        setIsCreating(true)
        const success = await createCharacter(userId, username.trim(), selectedClass, alloc)
        if (success) onCreated()
        else {
            setIsCreating(false)
            alert('Erro ao criar personagem. Verifique nome e distribuição.')
        }
    }

    const nextClass = () => {
        const currentIndex = CLASSES.findIndex(c => c.id === selectedClass)
        const nextIndex = (currentIndex + 1) % CLASSES.length
        setSelectedClass(CLASSES[nextIndex].id)
    }

    const prevClass = () => {
        const currentIndex = CLASSES.findIndex(c => c.id === selectedClass)
        const prevIndex = (currentIndex - 1 + CLASSES.length) % CLASSES.length
        setSelectedClass(CLASSES[prevIndex].id)
    }

    const borderColor = classData.color as 'gold' | 'red' | 'blue'

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0d0d0d] z-50 relative overflow-hidden">
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
                style={{ backgroundImage: `url("${getOptimizedAssetSrc('/loadingscreen.jpeg')}")`, filter: 'grayscale(0.2) contrast(1.1)' }}
            />
            <div className="absolute inset-0 z-1" style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)' }} />

            <div className="max-w-6xl w-full western-border p-4 md:p-6 bg-black/60 relative z-10 backdrop-blur-md"
                style={{ border: '1px solid rgba(242,185,13,0.2)', boxShadow: '0 0 60px rgba(0,0,0,0.9), 0 0 30px rgba(242,185,13,0.1)' }}
            >
                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <button 
                        onClick={() => logout().then(() => onCreated())}
                        className="text-red-500/70 hover:text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20 px-3 py-1 hover:bg-red-500/10 transition-all"
                    >
                        [ Sair do Login ]
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black text-gold title-western uppercase tracking-widest leading-tight">
                        Monte Seu Pistoleiro
                    </h1>
                    <div className="w-[100px] hidden md:block"></div> {/* Spacer for centering header */}
                </div>

                <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-stretch">
                    {/* Carousel Section */}
                    <div className="flex-1 flex flex-col items-center justify-start pt-4 relative min-h-[450px] md:min-h-[550px]">
                        {/* Navigation Arrows */}
                        <button
                            onClick={prevClass}
                            className="absolute left-0 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full border border-gold/30 bg-black/40 hover:bg-gold/20 flex items-center justify-center text-gold transition-all"
                        >
                            ←
                        </button>
                        <button
                            onClick={nextClass}
                            className="absolute right-0 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full border border-gold/30 bg-black/40 hover:bg-gold/20 flex items-center justify-center text-gold transition-all"
                        >
                            →
                        </button>

                        {/* Large Character Card */}
                        <div className="relative group transition-all duration-500 transform hover:scale-[1.02] w-full max-w-[280px] md:max-w-sm">
                            <div className={`absolute -inset-1 rounded-sm blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200`}
                                style={{ backgroundColor: classData.color }} />
                            <div className="relative western-border p-1 bg-black overflow-hidden aspect-[3/4]">
                                <img
                                    src={getOptimizedAssetSrc(classData.imageSrc) || classData.imageSrc}
                                    alt={classData.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                                <div className="absolute bottom-2 md:bottom-4 left-3 md:left-4 right-3 md:right-4 z-10">
                                    <div className="flex flex-col mb-1">
                                        <h2 className="text-2xl md:text-3xl font-black title-western uppercase tracking-tighter leading-tight" style={{ color: classData.color }}>
                                            {classData.name}
                                        </h2>
                                        <span className="text-white/80 text-[10px] md:text-xs uppercase font-bold tracking-wider">
                                            {classData.suggestedName}, {classData.age} anos
                                        </span>
                                    </div>
                                    <p className="text-xs md:text-sm text-gray-200 italic mt-1 leading-relaxed border-l-2 border-white/20 pl-3 font-medium line-clamp-2">
                                        "{classData.flavor}"
                                    </p>
                                </div>
                            </div>
                        </div>


                        {/* Breadcrumbs/Dots */}
                        <div className="flex gap-2 mt-4">
                            {CLASSES.map((c, i) => (
                                <div
                                    key={c.id}
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${selectedClass === c.id ? 'w-4 bg-gold' : 'bg-gray-700 hover:bg-gray-500'}`}
                                    onClick={() => setSelectedClass(c.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Stats & Customization Side */}
                    <div className="lg:w-[400px] flex flex-col gap-4">
                        <div className="western-border p-4 bg-black/40 space-y-4 flex-1">
                            <div>
                                <h3 className="text-gold uppercase text-[10px] tracking-[0.3em] font-black mb-4 border-b border-gold/20 pb-1">Atributos de Cartaz</h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                    <div className="flex justify-between border-b border-white/5 pb-1 text-xs">
                                        <span className="text-gray-500 uppercase font-black">Vida Max</span>
                                        <span className="text-red-400 font-black text-sm">{projected.hp}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-1 text-xs">
                                        <span className="text-gray-500 uppercase font-black">Força</span>
                                        <span className="text-gold font-black text-sm">{projected.strength}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-1 text-xs">
                                        <span className="text-gray-500 uppercase font-black">Defesa</span>
                                        <span className="text-gold font-black text-sm">{projected.defense}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-1 text-xs">
                                        <span className="text-gray-500 uppercase font-black">Agilidade</span>
                                        <span className="text-gold font-black text-sm">{projected.agility}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-1 text-xs">
                                        <span className="text-gray-500 uppercase font-black">Pontaria</span>
                                        <span className="text-gold font-black text-sm">{projected.accuracy}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 pb-1 text-xs">
                                        <span className="text-gray-500 uppercase font-black">Vigor</span>
                                        <span className="text-gold font-black text-sm">{projected.vigor}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-white/10">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-gold uppercase text-[10px] tracking-[0.3em] font-black">Recursos Iniciais</h3>
                                </div>
                                {ONBOARDING_STAT_POINTS > 0 ? (
                                    <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-3">
                                        Distribua exatamente {ONBOARDING_STAT_POINTS} pontos iniciais.
                                    </div>
                                ) : (
                                    <div className="text-[9px] text-gray-400 uppercase tracking-widest mb-3">
                                        Atributos iniciais definidos pela classe.
                                    </div>
                                )}

                                {ONBOARDING_STAT_POINTS > 0 && (
                                    <>
                                        <div className="grid grid-cols-1 gap-2">
                                            {STAT_KEYS.map((key) => (
                                                <div key={key} className="bg-white/5 px-3 py-2 flex items-center justify-between group hover:bg-white/10 transition-all">
                                                    <span className="text-xs text-gray-200 uppercase font-black tracking-widest">
                                                        {key === 'strength' ? 'Força' : key === 'defense' ? 'Defesa' : key === 'agility' ? 'Agilidade' : key === 'accuracy' ? 'Pontaria' : 'Vigor'}
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => adjust(key, -1)} className="w-8 h-8 flex items-center justify-center border border-white/20 text-gray-400 hover:text-white hover:border-white transition-all text-lg bg-white/5">-</button>
                                                        <span className="w-4 text-center text-sm font-black text-white">{alloc[key]}</span>
                                                        <button onClick={() => adjust(key, 1)} className="w-8 h-8 flex items-center justify-center border border-white/20 text-gray-400 hover:text-white hover:border-white transition-all text-lg bg-white/5">+</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            <button
                                                onClick={() => applyClassDefaultPreset(selectedClass)}
                                                className="px-2 py-1 text-[9px] border border-gold/30 text-gold hover:bg-gold/10 uppercase transition-all font-black"
                                            >
                                                Pre-Build da Classe
                                            </button>
                                            <button
                                                onClick={() => setAlloc({ ...EMPTY_ALLOC })}
                                                className="px-2 py-1 text-[9px] border border-white/10 text-gray-400 hover:text-white hover:border-white uppercase transition-all font-black"
                                            >
                                                Resetar Build
                                            </button>
                                            {PRESETS.map(p => (
                                                <button key={p.id} onClick={() => applyPreset(p.id)} className="px-2 py-1 text-[9px] border border-white/10 text-gray-400 hover:text-gold hover:border-gold uppercase transition-all font-black">
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-2 pt-2 border-t border-white/10">
                                <input
                                    type="text"
                                    placeholder="NOME DO PISTOLEIRO"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 text-white p-3 text-base text-center outline-none focus:border-gold transition-all font-black tracking-widest placeholder:text-gray-700"
                                    maxLength={20}
                                />
                                <button
                                    onClick={handleCreate}
                                    disabled={isCreating || !username.trim() || (ONBOARDING_STAT_POINTS > 0 && pointsLeft !== 0)}
                                    className="btn-western w-full py-4 text-base font-black tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-30 disabled:grayscale transition-all"
                                >
                                    {isCreating ? 'PROCESSANDO...' : 'INICIAR JORNADA'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

