'use client'

import { Profile, getUserInventory, getJobs, claimJobAction, Job } from '@/lib/gameActions'
import StatBar from './StatBar'
import CharacterPortrait from './CharacterPortrait'
import { getStatBonuses } from '@/lib/stats'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

function getPlayerClass(level: number): string {
    if (level < 5) return 'Novato'
    if (level < 10) return 'Pistoleiro'
    if (level < 20) return 'Cacador de Recompensa'
    if (level < 35) return 'Lenda da Fronteira'
    return 'Rei do Gatilho'
}

function xpForNextLevel(level: number): number {
    return level * 100
}

const CLASS_PORTRAITS: Record<string, string> = {
    'Xerife': '/images/xerife.jpeg',
    'Pistoleiro': '/images/pistoleiro.jpeg',
    'Forasteiro': '/images/forasteiro.jpeg',
    'Pregador': '/images/pregador.jpeg',
    'Nativo': '/images/nativo.jpeg',
    'Vendedor': '/images/mercador.jpeg',
    'CacadorDeRecompensas': '/images/cacador-de-recompensas.jpeg'
}

export default function Header({ profile, onRefresh }: { profile: Profile; onRefresh: () => void }) {
    const [invItems, setInvItems] = useState<any[]>([])
    const [jobs, setJobs] = useState<Job[]>([])
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const [isClaiming, setIsClaiming] = useState(false)
    const originalTitle = useRef('Far West')
    const originalFavicon = useRef<string | null>(null)

    const CHECKMARK_FAVICON = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">✅</text></svg>'

    useEffect(() => {
        getUserInventory(profile.id).then(items => setInvItems(items || []))
        getJobs().then(setJobs)
    }, [profile.id])

    // Job timer logic
    useEffect(() => {
        if (profile.job_finish_at) {
            const interval = setInterval(() => {
                const remaining = Math.max(
                    0,
                    Math.floor((new Date(profile.job_finish_at!).getTime() - Date.now()) / 1000)
                )
                setTimeLeft(remaining)

                // Browser Tab Notification
                if (remaining === 0) {
                    document.title = '✅ TRABALHO CONCLUÍDO!'

                    // Favicon Alert
                    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']")
                    if (link) {
                        if (!originalFavicon.current) originalFavicon.current = link.href
                        link.href = CHECKMARK_FAVICON
                    }

                    clearInterval(interval)
                }
            }, 1000)
            return () => clearInterval(interval)
        } else {
            setTimeLeft(0)
            document.title = originalTitle.current
        }
    }, [profile.job_finish_at])

    // Title reset logic
    useEffect(() => {
        const handleInteraction = () => {
            if (document.title !== originalTitle.current) {
                document.title = originalTitle.current

                // Reset Favicon
                if (originalFavicon.current) {
                    const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']")
                    if (link) link.href = originalFavicon.current
                }
            }
        }
        window.addEventListener('mousedown', handleInteraction)
        window.addEventListener('keydown', handleInteraction)
        return () => {
            window.removeEventListener('mousedown', handleInteraction)
            window.removeEventListener('keydown', handleInteraction)
        }
    }, [])

    const activeJob = jobs.find(j => j.id === profile.current_job_id)
    const bonuses = getStatBonuses(invItems)
    const playerClass = getPlayerClass(profile.level)
    const xpNeeded = xpForNextLevel(profile.level)
    const totalHpMax = profile.hp_max + (bonuses.vigor * 10)

    const handleClaim = async () => {
        if (!activeJob) return
        setIsClaiming(true)
        const success = await claimJobAction(profile, activeJob)
        setIsClaiming(false)
        if (success) {
            document.title = originalTitle.current
            // Reset Favicon
            if (originalFavicon.current) {
                const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']")
                if (link) link.href = originalFavicon.current
            }
            onRefresh()
        }
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#2b1f14] shadow-2xl"
            style={{
                background: 'linear-gradient(180deg, #2a1c11 0%, #170d07 100%)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)',
                borderBottom: '2px solid #382515'
            }}
        >
            {/* Stitching effect at bottom of header */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ borderBottom: '1px dashed rgba(212, 175, 55, 0.2)' }}></div>

            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4 px-4 py-2 md:py-3">
                <div className="flex flex-row items-center justify-between w-full md:w-auto gap-4 md:gap-6">
                    <div className="flex-shrink-0">
                        <img
                            src="/logo.png"
                            alt="Far West Logo"
                            className="h-10 md:h-16 w-auto drop-shadow-[0_0_10px_rgba(242,185,13,0.2)]"
                        />
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="relative group">
                            <CharacterPortrait
                                src={CLASS_PORTRAITS[profile.class] || null}
                                fallbackEmoji="🤠"
                                borderColor="gold"
                                size="xs"
                                name={profile.username}
                                className="md:w-12 md:h-12"
                            />
                            <button
                                onClick={() => supabase.auth.signOut()}
                                className="absolute -top-1 -right-1 bg-black/80 border border-white/20 text-white/40 hover:text-white hover:border-red-500/50 w-5 h-5 flex items-center justify-center rounded-sm transition-all z-20 group-hover:opacity-100 opacity-0"
                                title="Deslogar"
                            >
                                <span className="text-[10px]">✕</span>
                            </button>
                        </div>

                        <div className="min-w-0">
                            <h1 className="text-sm md:text-base font-bold text-[#d9c5b2] leading-tight tracking-wide font-serif truncate">
                                {profile.username}
                            </h1>
                            <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#d4af37] whitespace-nowrap">
                                    Nvl {profile.level}
                                </span>
                                <span className="text-[10px] text-[#423020]">•</span>
                                <span className="text-[10px] md:text-[12px] uppercase tracking-widest text-[#a52a2a] font-bold truncate">
                                    {playerClass}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 bg-[#140d07] px-2 py-0.5 rounded-sm border border-[#2b1f14] w-fit ml-auto md:ml-0">
                            <span className="text-[10px] text-[#d4af37]">💰</span>
                            <span className="text-[10px] text-[#d4af37] font-bold font-mono">{profile.gold}</span>
                        </div>

                        {/* Persistent Job Tracker (Enhanced Vertical) */}
                        {activeJob && (
                            <div className="ml-2 hidden lg:flex flex-col justify-center items-center bg-[rgba(242,185,13,0.04)] border border-[#d4af37]/30 px-3 py-2 min-h-[48px] rounded-sm shadow-2xl animate-in slide-in-from-right duration-500 relative overflow-hidden group">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d4af37]/60 mb-0.5 self-start">Em Missão:</span>
                                <div className="flex items-center gap-3 w-full">
                                    <span className="text-[10px] font-bold text-[#d9c5b2] font-serif uppercase tracking-tight whitespace-nowrap">{activeJob.title}</span>
                                    <div className="w-px h-3 bg-[#d4af37]/20" />
                                    {timeLeft > 0 ? (
                                        <span className="text-xs font-mono font-black text-gold flex items-center gap-1.5">
                                            <span className="animate-pulse text-[10px]">⌛</span> {Math.floor(timeLeft / 60)}m
                                        </span>
                                    ) : (
                                        <button
                                            onClick={handleClaim}
                                            disabled={isClaiming}
                                            className="text-[10px] font-black uppercase tracking-widest bg-gold text-black px-3 py-1 hover:brightness-125 active:scale-95 transition-all shadow-[0_0_10px_rgba(242,185,13,0.3)] animate-bounce"
                                        >
                                            {isClaiming ? '...' : 'COLETAR'}
                                        </button>
                                    )}
                                </div>
                                <div className="absolute bottom-0 left-0 h-[1px] bg-gold/20 w-full" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1 md:gap-2 w-full md:w-96 pb-2 md:pb-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] md:text-[12px] font-bold text-red-500 w-10 md:w-12 text-right uppercase tracking-tight flex-shrink-0">Vida</span>
                        <div className="flex-1">
                            <StatBar
                                value={profile.hp_current}
                                max={totalHpMax}
                                type="hp"
                                label="HP"
                                showValues
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] md:text-[12px] font-bold text-blue-500 w-10 md:w-12 text-right uppercase tracking-tight flex-shrink-0">Fôlego</span>
                        <div className="flex-1">
                            <StatBar
                                value={profile.energy}
                                max={100}
                                type="energy"
                                label="Energia"
                                showValues
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] md:text-[12px] font-bold text-purple-400 w-10 md:w-12 text-right uppercase tracking-tight flex-shrink-0 text-[8px] md:text-[12px]">XP</span>
                        <div className="flex-1">
                            <StatBar
                                value={profile.xp % xpNeeded}
                                max={xpNeeded}
                                type="xp"
                                label="Experiência"
                                showValues={false}
                            />
                        </div>
                        <span className="text-[10px] md:text-[12px] text-gray-500 flex-shrink-0 font-mono hidden md:inline">{profile.xp % xpNeeded}/{xpNeeded}</span>
                    </div>
                </div>
            </div>

            <div className="h-[1px]"
                style={{ background: 'linear-gradient(to right, transparent, rgba(242,185,13,0.3), transparent)' }}
            />
        </header>
    )
}
