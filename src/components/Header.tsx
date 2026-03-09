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
    if (level < 20) return 'Caçador de Recompensa'
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
    const headerRef = useRef<HTMLElement>(null)
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

    useEffect(() => {
        if (!headerRef.current || typeof window === 'undefined') return

        const setHeaderHeight = () => {
            const h = headerRef.current?.offsetHeight || 0
            document.documentElement.style.setProperty('--header-height', `${h}px`)
        }

        setHeaderHeight()

        const ro = new ResizeObserver(setHeaderHeight)
        ro.observe(headerRef.current)
        window.addEventListener('resize', setHeaderHeight)

        return () => {
            ro.disconnect()
            window.removeEventListener('resize', setHeaderHeight)
        }
    }, [])

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
    const gearHpBonus = bonuses.vigor
    const totalHpMax = profile.hp_max + gearHpBonus
    const totalHpCurrent = Math.min(totalHpMax, profile.hp_current + gearHpBonus)

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
        <header
            ref={headerRef}
            className="fixed top-0 left-0 right-0 z-50 border-b border-[#2b1f14] shadow-2xl"
            style={{
                background: 'linear-gradient(180deg, #2a1c11 0%, #170d07 100%)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)',
                borderBottom: '2px solid #382515'
            }}
        >
            {/* Stitching effect at bottom of header */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ borderBottom: '1px dashed rgba(212, 175, 55, 0.2)' }}></div>

            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-2 md:gap-4 px-4 py-2 md:py-3">
                <div className="flex flex-row items-center justify-between w-full md:flex-1 md:min-w-0 gap-4 md:gap-6">
                    <div className="flex-shrink-0">
                        <img
                            src="/logo.png"
                            alt="Far West Logo"
                            className="h-10 md:h-16 w-auto drop-shadow-[0_0_10px_rgba(242,185,13,0.2)]"
                        />
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 flex-wrap lg:flex-nowrap min-w-0">
                        <div className="relative group shrink-0 md:scale-110 md:origin-left">
                            <CharacterPortrait
                                src={CLASS_PORTRAITS[profile.class] || null}
                                fallbackEmoji="🤠"
                                borderColor="gold"
                                size="sm"
                                name={profile.username}
                                className="scale-90 md:scale-100 origin-left"
                            />
                            <button
                                onClick={() => supabase.auth.signOut()}
                                className="absolute -top-1 -right-1 bg-black/60 hover:bg-red-900/40 border border-[#d4af37]/30 text-[#d4af37] hover:text-red-500 hover:border-red-500/50 w-6 h-6 flex items-center justify-center rounded-full transition-all z-20 shadow-lg"
                                title="Deslogar"
                            >
                                <span className="text-[10px] leading-none">✕</span>
                            </button>
                        </div>

                        <div className="min-w-0 pr-1 flex-1">
                            <h1 className="text-sm md:text-base font-bold text-[#d9c5b2] leading-tight tracking-wide font-serif truncate">
                                {profile.username}
                            </h1>
                            <div className="flex items-center gap-1.5 md:gap-2 mt-0.5">
                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#d4af37] whitespace-nowrap">
                                    Nvl {profile.level}
                                </span>
                                {profile.stat_points_available > 0 && (
                                    <span className="bg-gold text-black text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce shadow-[0_0_8px_rgba(212,175,55,0.6)]">
                                        UP!
                                    </span>
                                )}
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
                            <div className="hidden lg:flex flex-col justify-center items-center bg-[rgba(242,185,13,0.04)] border border-[#d4af37]/30 px-3 py-2 min-h-[48px] rounded-sm shadow-2xl animate-in slide-in-from-right duration-500 relative overflow-hidden group shrink max-w-[180px] xl:max-w-[240px] ml-0 xl:ml-2">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d4af37]/60 mb-0.5 self-start">Em Missão:</span>
                                <div className="flex items-center gap-3 w-full">
                                    <span className="text-[10px] font-bold text-[#d9c5b2] font-serif uppercase tracking-tight truncate min-w-0">{activeJob.title}</span>
                                    <div className="w-px h-3 bg-[#d4af37]/20" />
                                    {timeLeft > 0 ? (
                                        <span className="text-xs font-mono font-black text-gold flex items-center gap-1.5 shrink-0">
                                            <span className="animate-pulse text-[10px]">⌛</span> {Math.floor(timeLeft / 60)}m
                                        </span>
                                    ) : profile.job_finish_at && new Date(profile.job_finish_at).getTime() <= Date.now() ? (
                                        <button
                                            onClick={handleClaim}
                                            disabled={isClaiming}
                                            className="text-[10px] font-black uppercase tracking-widest bg-gold text-black px-3 py-1 hover:brightness-125 active:scale-95 transition-all shadow-[0_0_10px_rgba(242,185,13,0.3)] animate-bounce"
                                        >
                                            {isClaiming ? '...' : 'COLETAR'}
                                        </button>
                                    ) : null}
                                </div>
                                <div className="absolute bottom-0 left-0 h-[1px] bg-gold/20 w-full" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1 md:gap-2 w-full md:w-96 md:flex-shrink-0 pb-2 md:pb-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] md:text-[12px] font-bold text-red-500 w-10 md:w-12 text-right uppercase tracking-tight flex-shrink-0">Vida</span>
                        <div className="flex-1">
                            <StatBar
                                value={totalHpCurrent}
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
