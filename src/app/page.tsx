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
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeTab, setActiveTab] = useState<'camp' | 'arena' | 'shop' | 'inventory' | 'status'>('camp')
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const refreshProfile = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized. Check your environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY).')
      }
      const { data: { session: s } } = await supabase.auth.getSession()
      setSession(s)
      const data = await ensureProfile()
      setProfile(data)
    } catch (err: any) {
      console.error('Erro ao carregar perfil:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [])

  // ===== TELA DE ERRO =====
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-center px-4"
        style={{ background: 'radial-gradient(ellipse at center, #1a0808 0%, #0d0d0d 70%)' }}
      >
        <div className="max-w-md p-8 bg-black/60 border border-red-900/50 backdrop-blur-sm space-y-6">
          <div className="text-6xl animate-pulse">⚠️</div>
          <h2 className="text-xl font-bold text-red-500 uppercase tracking-widest title-medieval">Erro de Conexão</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Não foi possível conectar ao Reino de Supabase. Isso geralmente ocorre por falta de configuração no Vercel.
          </p>
          <div className="p-4 bg-red-950/20 border border-red-900/30 text-red-400 text-[10px] font-mono break-all text-left">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 border border-red-500/50 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-black transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  // ===== TELA DE LOADING =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen"
        style={{ background: 'radial-gradient(ellipse at center, #1a1208 0%, #0d0d0d 70%)' }}
      >
        <ParticleBackground count={20} />
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Brasão animado */}
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
              style={{
                background: 'radial-gradient(circle, #1a1208, #0d0d0d)',
                border: '2px solid #f2b90d',
                animation: 'glow-pulse-gold 2s ease-in-out infinite',
              }}
            >
              👑
            </div>
            {/* Anel giratório */}
            <div
              className="absolute -inset-3 rounded-full border-t-2 border-r-2 border-transparent"
              style={{
                borderTopColor: '#f2b90d44',
                borderRightColor: '#f2b90d22',
                animation: 'spin-slow 3s linear infinite',
              }}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-black text-gold title-medieval tracking-widest">
              Cinzas e Coroas
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-gray-600">Forjando o destino...</span>
          </div>
        </div>
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
    { id: 'camp', label: 'Acampamento', icon: '🏕️' },
    { id: 'arena', label: 'Arena', icon: '⚔️' },
    { id: 'shop', label: 'Loja', icon: '💰' },
    { id: 'inventory', label: 'Inventário', icon: '🎒' },
    { id: 'status', label: 'Status', icon: '📊' },
  ]

  return (
    <main className="relative min-h-screen">
      {/* Fundo de partículas sutil */}
      <ParticleBackground count={18} />

      {/* Conteúdo principal */}
      <div className="relative z-10 pt-44 pb-20 px-4 md:px-8">
        <Header profile={profile} />

        <div className="max-w-6xl mx-auto space-y-0">
          {/* ====== ABAS DE NAVEGAÇÃO ====== */}
          <nav className="flex items-end justify-center gap-1" aria-label="Navegação principal">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="relative px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200"
                  style={{
                    background: isActive
                      ? 'linear-gradient(180deg, #1e1e1e, #111)'
                      : 'linear-gradient(180deg, #141414, #0d0d0d)',
                    border: `1px solid ${isActive ? '#f2b90d' : '#2a2a2a'}`,
                    borderBottom: isActive ? '1px solid #111' : '1px solid #2a2a2a',
                    color: isActive ? '#f2b90d' : '#555',
                    marginBottom: isActive ? '-1px' : '0',
                    boxShadow: isActive ? '0 0 12px rgba(242,185,13,0.15)' : 'none',
                    zIndex: isActive ? 2 : 1,
                  }}
                >
                  <span className="mr-1.5">{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'status' && profile.stat_points_available > 0 && (
                    <span className="ml-2 bg-yellow-500 text-black text-[9px] font-black rounded-full w-4 h-4 inline-flex items-center justify-center animate-bounce">
                      {profile.stat_points_available}
                    </span>
                  )}
                  {/* Linha de destaque no fundo da aba ativa */}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{ background: '#111' }}
                    />
                  )}
                </button>
              )
            })}
          </nav>

          {/* ====== CONTEÚDO DA ABA ====== */}
          <div
            className="relative"
            style={{
              background: 'linear-gradient(160deg, #161616, #0e0e0e)',
              border: '1px solid #3a3a3a',
              borderTop: '1px solid #f2b90d33',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 0 30px rgba(0,0,0,0.3)',
              padding: '2rem',
              minHeight: '520px',
            }}
          >
            {activeTab === 'camp' && <CampTab profile={profile} onRefresh={refreshProfile} />}
            {activeTab === 'arena' && <ArenaTab profile={profile} />}
            {activeTab === 'shop' && <ShopTab profile={profile} onRefresh={refreshProfile} />}
            {activeTab === 'inventory' && <InventoryTab profile={profile} onRefresh={refreshProfile} />}
            {activeTab === 'status' && <StatusTab profile={profile} onRefresh={refreshProfile} />}
          </div>
        </div>
      </div>

      {/* Footer fixo */}
      <footer className="fixed bottom-0 left-0 right-0 py-3 text-center text-[9px] uppercase tracking-[0.4em] text-gray-700 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}
      >
        Cinzas e Coroas © 2026 • Forjado nas Sombras
      </footer>
    </main>
  )
}
