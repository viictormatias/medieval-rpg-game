'use client'

import { useEffect, useRef, useState } from 'react'
import { getOptimizedAssetSrc } from '@/lib/assets'
import { ensureProfile, Profile } from '@/lib/gameActions'
import Header from '@/components/Header'
import CampTab from '@/components/CampTab'
import ArenaTab from '@/components/ArenaTab'
import ShopTab from '@/components/ShopTab'
import InventoryTab from '@/components/InventoryTab'
import StatusTab from '@/components/StatusTab'
import LoginScreen from '@/components/LoginScreen'
import ClassSelectionScreen from '@/components/ClassSelectionScreen'
import ParticleBackground from '@/components/ParticleBackground'
import { supabase, isConfigValid } from '@/lib/supabase'

type TabId = 'camp' | 'arena' | 'shop' | 'inventory' | 'status'

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('camp')
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [inventory, setInventory] = useState<any[]>([])
  const isRefreshing = useRef(false)
  const isRefreshingInv = useRef(false)

  const refreshInventory = async (pId: string) => {
    if (isRefreshingInv.current) return
    isRefreshingInv.current = true
    try {
      const { getUserInventory } = await import('@/lib/gameActions')
      const items = await getUserInventory(pId)
      setInventory(items || [])
    } finally {
      isRefreshingInv.current = false
    }
  }

  const refreshProfile = async (manualProfile?: Profile, manualInventory?: any[]) => {
    if (manualProfile) {
      setProfile(manualProfile)
      if (manualInventory) setInventory(manualInventory)
      return
    }

    if (isRefreshing.current) return
    isRefreshing.current = true

    if (!supabase || !isConfigValid) {
      setError('Configuração do Supabase incompleta ou inválida no .env.local')
      setLoading(false)
      isRefreshing.current = false
      return
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        reject(new Error('Servidor lento. Verifique sua internet e tente novamente.'))
      }, 30000)
    )

    try {
      await Promise.race([
        (async () => {
          const {
            data: { session: s },
            error: authErr,
          } = await supabase.auth.getSession()

          if (authErr) throw authErr

          setSession(s)
          if (s) {
            const data = await ensureProfile()
            setProfile(data)
            if (data) refreshInventory(data.id)
          } else {
            setProfile(null)
            setInventory([])
          }
        })(),
        timeoutPromise,
      ])
    } catch (err: any) {
      if (!profile) {
        console.error('[CRITICAL] Initial load failed:', err)
        setError(err.message || 'Erro de rede desconhecido.')
      }
    } finally {
      setLoading(false)
      isRefreshing.current = false
    }
  }

  useEffect(() => {
    if (!supabase) return

    const handleError = (e: ErrorEvent) => console.error('[CRASH]', e.error)
    window.addEventListener('error', handleError)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, nextSession: any) => {
      if (
        nextSession &&
        typeof window !== 'undefined' &&
        window.location.hash.includes('access_token')
      ) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }

      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'INITIAL_SESSION') {
        refreshProfile()
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
        setSession(null)
      }
    })

    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }

    return () => {
      window.removeEventListener('error', handleError)
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => refreshProfile(), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
    if (activeTab === 'inventory' && profile) {
      refreshInventory(profile.id)
    }
  }, [activeTab])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center px-4 bg-black text-white relative z-[9999]">
        <div className="max-w-md p-8 bg-black border border-red-500/50 space-y-6">
          <h2 className="text-xl font-bold text-red-500 title-western">PROBLEMA NO SALOON</h2>
          <p className="text-gray-400 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-western px-6 py-2 text-red-500">
            RECARREGAR PÁGINA
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gold font-serif pb-20 relative overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
          style={{ backgroundImage: `url("${getOptimizedAssetSrc('/images/loading2.jpeg')}")`, filter: 'grayscale(0.3) brightness(0.5)' }}
        />
        <div
          className="absolute inset-0 z-1 pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.9) 100%)' }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-8 md:mb-10">
            <img
              src={getOptimizedAssetSrc('/images/logo-pequena-semfundo.png') || '/images/logo-pequena-semfundo.png'}
              alt="Loading"
              className="w-40 h-40 md:w-52 md:h-52 object-contain opacity-95 animate-pulse"
            />
          </div>
          <h1 className="text-xs md:text-sm tracking-[0.6em] animate-pulse uppercase font-black text-gold">
            Fronteira Oeste
          </h1>
          <p className="text-[9px] md:text-[10px] mt-2 md:mt-3 text-[#d9c5b2]/60 uppercase tracking-widest italic font-bold">
            Sincronizando dados vitais...
          </p>
        </div>
      </div>
    )
  }

  if (!profile) {
    if (session) return <ClassSelectionScreen userId={session.user.id} onCreated={refreshProfile} />
    return <LoginScreen onLoginSuccess={refreshProfile} />
  }

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'camp', label: 'Quadro', icon: '📜' },
    { id: 'arena', label: 'Duelo', icon: '🎯' },
    { id: 'shop', label: 'Loja', icon: '⚖️' },
    { id: 'inventory', label: 'Mochila', icon: '👜' },
    { id: 'status', label: 'Status', icon: '👤' },
  ]

  const tabBackgrounds: Record<TabId, string> = {
    camp: '/images/loading1.jpeg',
    arena: '/images/duelo1.jpeg',
    shop: '/images/mercador.jpeg',
    inventory: '/images/arma2.jpeg',
    status: '/images/cacador-de-recompensas.jpeg',
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: `url("${getOptimizedAssetSrc(tabBackgrounds[activeTab])}")`,
          filter: 'grayscale(0.12) brightness(0.65) contrast(1.08)',
          opacity: 1,
        }}
      />

      <div
        className="fixed inset-0 z-1 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(0,0,0,0.05) 0%, rgba(20,13,7,0.18) 100%), linear-gradient(180deg, rgba(20,13,7,0.08) 0%, rgba(20,13,7,0.35) 100%)',
        }}
      />

      <ParticleBackground count={18} />

      <div
        className="relative z-10 pb-10 md:pb-20 px-3 md:px-8"
        style={{ paddingTop: 'calc(var(--header-height, 8rem) + 0.9rem)' }}
      >
        <Header profile={profile} onRefresh={refreshProfile} />

        <div className="max-w-6xl mx-auto space-y-0">
          <nav
            className="flex items-end gap-1 md:gap-2 px-1 md:px-2 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1 snap-x"
            aria-label="Navegação principal"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-selected={isActive}
                  className={`relative shrink-0 snap-start touch-target px-3 md:px-6 py-2.5 md:py-3 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-all duration-200 rounded-t-md border-b-0 ${isActive ? 'font-serif' : 'font-sans'}`}
                  style={{
                    background: isActive
                      ? 'linear-gradient(180deg, #382515 0%, #22160d 100%)'
                      : 'linear-gradient(180deg, #1f140c 0%, #140d07 100%)',
                    borderWidth: '2px 2px 0 2px',
                    borderStyle: 'solid',
                    borderColor: isActive ? '#d4af37' : '#2b1f14',
                    color: isActive ? '#fff' : '#8b6508',
                    marginBottom: isActive ? '-2px' : '0',
                    boxShadow: isActive
                      ? '0 -4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.2)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.02)',
                    zIndex: isActive ? 10 : 1,
                    textShadow: isActive ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
                  }}
                >
                  <span className={`mr-1 md:mr-2 ${isActive ? 'text-[#d4af37]' : 'text-[#423020]'}`}>{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'status' && profile.stat_points_available > 0 && (
                    <span className="ml-1 md:ml-2 bg-[#a52a2a] text-[#d9c5b2] text-[8px] md:text-[10px] font-black rounded-full px-1.5 md:px-2 py-0.5 inline-flex items-center justify-center animate-pulse border border-[#423020] shadow-sm">
                      {profile.stat_points_available}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-[2px] left-0 right-0 h-[4px]" style={{ background: '#22160d' }} />
                  )}
                </button>
              )
            })}
          </nav>

          <div
            className={`relative rounded-b-lg rounded-tr-lg ${activeTab === 'inventory' ? 'overflow-visible' : 'overflow-hidden'}`}
            style={{
              background: 'rgba(20, 13, 7, 0.35)',
              border: '2px solid #d4af37',
              boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.6)',
              minHeight: '400px',
            }}
          >
            <div className="absolute inset-1 border border-dashed border-[#d4af37] opacity-20 pointer-events-none rounded-b-md rounded-tr-md z-2"></div>

            <div className="relative z-10 p-4 md:p-8">
              <div className={activeTab === 'camp' ? 'block' : 'hidden'}>
                <CampTab profile={profile} onRefresh={refreshProfile} />
              </div>
              <div className={activeTab === 'arena' ? 'block' : 'hidden'}>
                <ArenaTab profile={profile} onRefresh={refreshProfile} />
              </div>
              <div className={activeTab === 'shop' ? 'block' : 'hidden'}>
                <ShopTab profile={profile} onRefresh={refreshProfile} />
              </div>
              <div className={activeTab === 'inventory' ? 'block' : 'hidden'}>
                <InventoryTab profile={profile} onRefresh={refreshProfile} inventory={inventory} isActive={activeTab === 'inventory'} />
              </div>
              <div className={activeTab === 'status' ? 'block' : 'hidden'}>
                <StatusTab profile={profile} onRefresh={refreshProfile} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative w-full py-6 md:py-8 text-center text-[8px] md:text-[9px] uppercase tracking-[0.2em] md:tracking-[0.4em] text-gray-700 z-20 px-4">
        Far West (c) 2026 - Poeira, chumbo e glória - Victor Matias
      </footer>
    </main>
  )
}
