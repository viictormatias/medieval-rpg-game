'use client'

import { useEffect, useState } from 'react'
import { Profile, Job, getJobs, startJobAction, claimJobAction } from '@/lib/gameActions'

const JOB_ICONS: Record<string, string> = {
    default: '⚔️',
    patrol: '🗡️',
    mine: '⛏️',
    farm: '🌾',
    guard: '🛡️',
    hunt: '🏹',
    craft: '🔨',
    scout: '👁️',
    gather: '🌿',
    trade: '💼',
}

function getJobIcon(title: string): string {
    const lower = title.toLowerCase()
    for (const [key, icon] of Object.entries(JOB_ICONS)) {
        if (lower.includes(key)) return icon
    }
    return JOB_ICONS.default
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    if (h > 0) {
        return m > 0 ? `${h}h ${m}m` : `${h}h`
    }
    return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export default function CampTab({ profile, onRefresh }: { profile: Profile; onRefresh: () => void }) {
    const [jobs, setJobs] = useState<Job[]>([])
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const [isClaiming, setIsClaiming] = useState(false)

    useEffect(() => {
        getJobs().then(setJobs)
    }, [])

    useEffect(() => {
        if (profile.job_finish_at) {
            const calculateRemaining = () => {
                return Math.max(
                    0,
                    Math.floor((new Date(profile.job_finish_at!).getTime() - Date.now()) / 1000)
                )
            }

            // Inicializa imediatamente para evitar flicker de 1s
            const initialRemaining = calculateRemaining()
            setTimeLeft(initialRemaining)

            const interval = setInterval(() => {
                const remaining = calculateRemaining()
                setTimeLeft(remaining)
                if (remaining === 0) clearInterval(interval)
            }, 1000)
            return () => clearInterval(interval)
        } else {
            setTimeLeft(0)
        }
    }, [profile.job_finish_at])

    const handleStart = async (job: Job) => {
        if (profile.energy < job.energy_cost) {
            alert('Energia insuficiente!')
            return
        }
        const success = await startJobAction(profile.id, job)
        if (success) {
            onRefresh()
        } else {
            alert('Falha ao iniciar missão. Verifique sua conexão ou se já está em uma missão.')
        }
    }

    const handleClaim = async () => {
        const job = jobs.find(j => j.id === profile.current_job_id)
        if (!job) return
        setIsClaiming(true)
        const success = await claimJobAction(profile, job)
        setIsClaiming(false)
        if (success) onRefresh()
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="ornament-divider text-[10px] md:text-xs">Missões Disponíveis</div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {jobs.map((job, idx) => {
                    const isActive = profile.current_job_id === job.id
                    const isOtherBusy = profile.current_job_id && !isActive
                    const canStart = !profile.current_job_id && profile.energy >= job.energy_cost && profile.level >= job.min_level
                    const jobIcon = getJobIcon(job.title)
                    const progressPct = isActive
                        ? Math.min(100, ((job.duration_seconds - timeLeft) / job.duration_seconds) * 100)
                        : 0

                    return (
                        <div
                            key={job.id}
                            className={`western-border p-4 md:p-5 flex flex-col gap-3 md:gap-4 fade-in-up transition-all duration-300 relative
                ${isActive ? 'border-gold' : ''}
                ${isOtherBusy ? 'opacity-40 grayscale pointer-events-none' : ''}
                ${profile.level < job.min_level ? 'opacity-60 grayscale' : ''}
              `}
                            style={{
                                animationDelay: `${idx * 60}ms`,
                                boxShadow: isActive ? '0 0 20px rgba(242,185,13,0.15), inset 0 0 15px rgba(0,0,0,0.4)' : undefined,
                                background: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.05\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23noise)\' opacity=\'0.08\'/%3E%3C/svg%3E"), #1a120c'
                            }}
                        >
                            {/* WANTED POSTER HEADER */}
                            <div className="absolute top-2 left-0 right-0 flex justify-center opacity-30 pointer-events-none">
                                <span className="font-serif text-2xl md:text-3xl tracking-[0.2em] text-red-900 font-bold mix-blend-color-burn" style={{ WebkitTextStroke: '1px #b22222' }}>
                                    WANTED
                                </span>
                            </div>

                            <div className="flex items-start justify-between relative mt-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-[#2b1f14] border-2 border-[#423020] rounded-sm flex items-center justify-center text-xl md:text-2xl shadow-inner">
                                        {jobIcon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-[#d9c5b2] text-xl md:text-2xl font-serif tracking-wide mb-1 leading-tight">{job.title}</h3>
                                        <span className="text-[10px] md:text-sm uppercase tracking-[0.2em] text-[#a52a2a] font-black bg-black/30 px-2 py-0.5 rounded-sm">
                                            {formatDuration(job.duration_seconds)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs md:text-sm text-[#a3907c] leading-relaxed italic flex-1 border-y border-dashed border-[#423020] py-2 md:py-3 my-1 md:my-2 bg-[rgba(255,255,255,0.02)] pl-2">
                                "{job.description}"
                            </p>

                            {/* Separador dourado */}
                            <div className="h-px" style={{ background: 'linear-gradient(to right, transparent, #3a3a3a, transparent)' }} />

                            {/* Recompensas */}
                            <div className="flex items-center gap-2 md:gap-4 bg-[#110b07] p-2 md:p-4 rounded-sm border border-[#2b1f14] shadow-inner">
                                <div className="flex-1 flex flex-col items-center">
                                    <span className="text-[9px] md:text-xs uppercase tracking-widest text-gray-500 mb-1 font-black">Energia</span>
                                    <span className="text-sm md:text-base font-black font-mono text-blue-400">-{job.energy_cost}</span>
                                </div>
                                <div className="w-px h-8 md:h-10 bg-[#2b1f14]" />
                                <div className="flex-1 flex flex-col items-center">
                                    <span className="text-[9px] md:text-xs uppercase tracking-widest text-gray-500 mb-1 font-black">XP</span>
                                    <span className="text-sm md:text-base font-black font-mono text-purple-400">+{job.reward_xp}</span>
                                </div>
                                <div className="w-px h-8 md:h-10 bg-[#2b1f14]" />
                                <div className="flex-1 flex flex-col items-center">
                                    <span className="text-[9px] md:text-xs uppercase tracking-widest text-gray-500 mb-1 font-black">Gold</span>
                                    <span className="text-sm md:text-base font-black font-mono text-yellow-400">+{job.reward_gold}</span>
                                </div>
                            </div>

                            {/* Ação / Progresso */}
                            {isActive ? (
                                <div className="space-y-2 mt-2">
                                    <div className="progress-bar-container h-[0.65rem] md:h-[0.75rem]">
                                        <div
                                            className="progress-bar-fill progress-bar-shimmer"
                                            style={{ width: `${progressPct}%` }}
                                        />
                                    </div>

                                    <div className="text-center text-[10px] md:text-xs font-bold">
                                        {timeLeft > 0 ? (
                                            <span className="text-gold font-mono">⏳ {formatDuration(timeLeft)} restante</span>
                                        ) : (
                                            <span className="text-green-400 animate-pulse">✅ Missão concluída!</span>
                                        )}
                                    </div>
                                    {timeLeft === 0 && (
                                        <button
                                            onClick={handleClaim}
                                            disabled={isClaiming}
                                            className="btn-western w-full text-xs md:text-sm py-2 md:py-3"
                                            style={{ boxShadow: '0 0 16px rgba(242,185,13,0.3)' }}
                                        >
                                            {isClaiming ? '⏳ Coletando...' : '🎁 Coletar Recompensa'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleStart(job)}
                                    disabled={!!isOtherBusy || !canStart}
                                    className="btn-western w-full py-3 md:py-4 text-sm md:text-base font-black tracking-widest mt-2"
                                >
                                    {isOtherBusy
                                        ? '🔒 OCUPADO'
                                        : profile.level < job.min_level
                                            ? `🔒 LVL ${job.min_level}`
                                            : !canStart
                                                ? '⚡ SEM ENERGIA'
                                                : '▶ INICIAR MISSÃO'}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>

    )
}

