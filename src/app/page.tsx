'use client'

import { useEffect, useState } from 'react'
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
import { supabase, isConfigValid, hasUrl, hasKey } from '@/lib/supabase'

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<'camp' | 'arena' | 'shop' | 'inventory' | 'status'>('camp')
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Guard against concurrent refreshes
  const isRefreshing = { current: false }

  const refreshProfile = async () => {
    if (isRefreshing.current) return
    isRefreshing.current = true

    if (!supabase || !isConfigValid) {
      setError('Configuração do Supabase incompleta ou inválida no .env.local');
      setLoading(false);
      isRefreshing.current = false
      return;
    }

    // Safety timeout to prevent infinite loading loop (30 seconds)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => {
        reject(new Error('O SERVIDOR ESTÁ LEVANDO MAIS TEMPO QUE O ESPERADO. VERIFIQUE SUA INTERNET OU TENTE NOVAMENTE EM ALGUNS INSTANTES.'));
      }, 30000)
    )

    try {
      await Promise.race([
        (async () => {
          const { data: { session: s }, error: authErr } = await supabase.auth.getSession();
          if (authErr) throw authErr;

          setSession(s)
          if (s) {
            const data = await ensureProfile()
            setProfile(data)
          } else {
            setProfile(null)
          }
        })(),
        timeoutPromise
      ]);
    } catch (err: any) {
      if (!profile) {
        console.error('[CRITICAL] Initial load failed:', err)
        setError(err.message || 'Erro desconhecido na rede.')
      }
    } finally {
      setLoading(false)
      isRefreshing.current = false
    }
  }

  // Monitor for crashes
  useEffect(() => {
    const handleError = (e: ErrorEvent) => console.error('[CRASH]', e.error);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Single consolidated auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      // Clean access_token from URL hash for security
      if (session && typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
      }
      if (event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'INITIAL_SESSION') {
        refreshProfile()
      } else if (event === 'SIGNED_OUT') {
        setProfile(null)
        setSession(null)
      }
    })

    // Clean URL hash on initial load
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }

    return () => subscription.unsubscribe()
  }, [])

  // Periodic background sync (every 60s)
  useEffect(() => {
    const interval = setInterval(() => refreshProfile(), 60_000)
    return () => clearInterval(interval)
  }, [])

  // Limpa o access_token da URL após o Supabase processar
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      if (window.location.hash.includes('access_token=')) {
        // Pequeno delay para garantir que o listener de auth rodou
        setTimeout(() => {
          window.history.replaceState(null, '', window.location.pathname);
          console.log('[DEBUG-AUTH] URL limpa para segurança.');
        }, 500);
      }
    }
  }, [session]);

  // Garante que a tela suba ao trocar de abas
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [activeTab])

  // ===== TELA DE ERRO =====
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center px-4 bg-black text-white relative z-[9999]">
        <div className="max-w-md p-8 bg-black border border-red-500/50 space-y-6">
          <h2 className="text-xl font-bold text-red-500 title-western">PROBLEMA NO SALOON</h2>
          <p className="text-gray-400 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-western px-6 py-2 text-red-500">RECARREGAR PÁGINA</button>
        </div>
      </div>
    )
  }

  // ===== TELA DE LOADING SIMPLIFICADA =====
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-gold font-serif pb-20">
        <div className="relative mb-10 group">
          <div className="w-20 h-20 border-2 border-gold/20 border-t-gold rounded-full animate-spin"></div>
          <img
            src="/logo.png"
            alt="Loading"
            className="absolute inset-0 m-auto w-10 h-auto opacity-80 animate-pulse"
          />
        </div>
        <h1 className="text-sm tracking-[0.6em] animate-pulse uppercase font-black text-gold/80">Fronteira Oeste</h1>
        <p className="text-[10px] mt-2 text-gray-600 uppercase tracking-widest italic">Sincronizando dados vitais...</p>
      </div>
    )
  }
  if (!profile) {
    if (session) {
      return <ClassSelectionScreen userId={session.user.id} onCreated={refreshProfile} />
    }
    return <LoginScreen onLoginSuccess={refreshProfile} />
  }

  const tabs = [
    { id: 'camp', label: 'Quadro', icon: '📜' },
    { id: 'arena', label: 'Duelo', icon: '🎯' },
    { id: 'shop', label: 'Loja', icon: '⚖️' },
    { id: 'inventory', label: 'Mochila', icon: '👜' },
    { id: 'status', label: 'Status', icon: '👤' },
  ]

  const tabBackgrounds: Record<string, string> = {
    camp: '/images/loading1.jpeg',
    arena: '/images/duelo1.jpeg',
    shop: '/images/mercador.jpeg',
    inventory: '/images/arma2.jpeg',
    status: '/images/cacador-de-recompensas.jpeg',
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      {/* Global Dynamic Background */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
        style={{
          backgroundImage: `url("${tabBackgrounds[activeTab]}")`,
          filter: 'grayscale(0.12) brightness(0.65) contrast(1.08)',
          opacity: 1
        }}
      />

      {/* Noir Overlay Gradients (Global) */}
      <div
        className="fixed inset-0 z-1 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.05) 0%, rgba(20,13,7,0.18) 100%), linear-gradient(180deg, rgba(20,13,7,0.08) 0%, rgba(20,13,7,0.35) 100%)'
        }}
      />

      {/* Fundo de partículas sutil */}
      <ParticleBackground count={18} />

      {/* Conteúdo principal */}
      <div className="relative z-10 pt-32 md:pt-44 pb-10 md:pb-20 px-4 md:px-8">
        <Header profile={profile} onRefresh={refreshProfile} />
        <div className="max-w-6xl mx-auto space-y-0">
          {/* ====== ABAS DE NAVEGAÇÃO ====== */}
          <nav className="flex flex-wrap items-end justify-center gap-1 md:gap-2 px-1 md:px-2" aria-label="Navegação principal">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-3 md:px-6 py-2.5 md:py-3 text-[9px] md:text-sm font-bold uppercase tracking-widest transition-all duration-200 rounded-t-md border-b-0 ${isActive ? 'font-serif' : 'font-sans'}`}
                  style={{
                    background: isActive
                      ? 'linear-gradient(180deg, #382515 0%, #22160d 100%)' // Dark wood active
                      : 'linear-gradient(180deg, #1f140c 0%, #140d07 100%)', // Darker wood inactive
                    borderWidth: '2px 2px 0 2px', // Top, Right, Bottom, Left
                    borderStyle: 'solid',
                    borderColor: isActive ? '#d4af37' : '#2b1f14', // Gold border if active
                    color: isActive ? '#fff' : '#8b6508', // White text if active, dark gold if not
                    marginBottom: isActive ? '-2px' : '0',
                    boxShadow: isActive ? '0 -4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(212,175,55,0.2)' : 'inset 0 1px 0 rgba(255,255,255,0.02)',
                    zIndex: isActive ? 10 : 1,
                    textShadow: isActive ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
                  }}
                >
                  <span className={`mr-1 md:mr-2 ${isActive ? 'text-[#d4af37]' : 'text-[#423020]'}`}>{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'status' && profile.stat_points_available > 0 && (
                    <span className="ml-1 md:ml-2 bg-[#a52a2a] text-[#d9c5b2] text-[8px] md:text-[10px] font-black rounded-full px-1.5 md:px-2 py-0.5 inline-flex items-center justify-center animate-pulse border border-[#423020] shadow-sm">
                      {profile.stat_points_available}
                    </span>
                  )}
                  {/* Linha de destaque no fundo da aba ativa para cobrir a borda do container */}
                  {isActive && (
                    <span
                      className="absolute -bottom-[2px] left-0 right-0 h-[4px]"
                      style={{ background: '#22160d' }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          {/* ====== CONTEÚDO DA ABA ====== */}
          <div
            className={`relative rounded-b-lg rounded-tr-lg ${activeTab === 'inventory' ? 'overflow-visible' : 'overflow-hidden'}`}
            style={{
              background: 'rgba(20, 13, 7, 0.35)', // Light veil so background remains visible
              border: '2px solid #d4af37', // Gold border
              boxShadow: '0 8px 32px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.6)',
              minHeight: '400px', // Reduced from 520px for better mobile fit
            }}
          >
            {/* Inner stitching detail */}
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
                <InventoryTab profile={profile} onRefresh={refreshProfile} />
              </div>
              <div className={activeTab === 'status' ? 'block' : 'hidden'}>
                <StatusTab profile={profile} onRefresh={refreshProfile} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer no fim da página */}
      <footer className="w-full py-6 md:py-8 text-center text-[8px] md:text-[9px] uppercase tracking-[0.2em] md:tracking-[0.4em] text-gray-700 z-20 px-4">
        Far West © 2026 • Poeira, chumbo e glória • Victor Matias
      </footer>
    </main>

  )
}
