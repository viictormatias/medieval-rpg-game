'use client'

import { useState } from 'react'
import { loginWithEmail, signUpWithEmail } from '@/lib/gameActions'
import ParticleBackground from './ParticleBackground'

export default function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const handleAuth = async (isLogin: boolean) => {
        setLoading(true)
        setErrorMsg('')
        try {
            const { error } = isLogin
                ? await loginWithEmail(email, password)
                : await signUpWithEmail(email, password)

            if (error) {
                setErrorMsg(error.message)
            } else {
                onLoginSuccess()
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden"
            style={{ background: '#0d0d0d' }}
        >
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

            <ParticleBackground count={30} />

            {/* Card de Login Glassificado */}
            <div
                className="relative z-10 medieval-border p-8 max-w-sm w-full mx-4 flex flex-col items-center text-center backdrop-blur-md"
                style={{
                    background: 'linear-gradient(160deg, rgba(20,16,8,0.7), rgba(10,10,10,0.8))',
                    boxShadow: '0 0 60px rgba(0,0,0,0.9), 0 0 30px rgba(242,185,13,0.1)',
                    border: '1px solid rgba(242,185,13,0.2)',
                }}
            >
                {/* Linha superior dourada */}
                <div className="absolute top-0 left-4 right-4 h-[1px]"
                    style={{ background: 'linear-gradient(to right, transparent, #f2b90d80, transparent)' }}
                />



                <div className="relative mb-4 w-full flex justify-center">
                    <img
                        src="/logo.png"
                        alt="Velmora Logo"
                        className="w-48 h-auto drop-shadow-[0_0_15px_rgba(242,185,13,0.3)] animate-fade-in"
                        style={{ filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' }}
                    />
                </div>
                <p className="text-[11px] text-gray-500 italic mb-1 uppercase tracking-[0.2em]">
                    Forje seu destino nas sombras
                </p>

                {/* Ornamento divisor */}
                <div className="w-full ornament-divider text-[9px] my-5">◆ ◆ ◆</div>

                {/* Erro */}
                {errorMsg && (
                    <div className="w-full p-3 mb-4 rounded-sm text-xs font-bold uppercase tracking-wider"
                        style={{
                            border: '1px solid rgba(220,38,38,0.4)',
                            background: 'rgba(220,38,38,0.08)',
                            color: '#f87171',
                        }}
                    >
                        ⚠️ {errorMsg}
                    </div>
                )}

                {/* Formulário */}
                <div className="w-full space-y-3">
                    <input
                        type="email"
                        placeholder="Email do Herói"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth(true)}
                        className="w-full text-sm px-4 py-3 font-mono outline-none transition-all"
                        style={{
                            background: 'rgba(0,0,0,0.6)',
                            border: '1px solid #3a3a3a',
                            color: '#e0e0e0',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#f2b90d')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
                    />
                    <input
                        type="password"
                        placeholder="Senha Secreta"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAuth(true)}
                        className="w-full text-sm px-4 py-3 font-mono outline-none transition-all"
                        style={{
                            background: 'rgba(0,0,0,0.6)',
                            border: '1px solid #3a3a3a',
                            color: '#e0e0e0',
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = '#f2b90d')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#3a3a3a')}
                    />

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => handleAuth(true)}
                            disabled={loading || !email || !password}
                            className="btn-medieval flex-1 text-sm"
                        >
                            {loading ? <span className="animate-pulse">Aguarde...</span> : '⚔️ Entrar'}
                        </button>
                        <button
                            onClick={() => handleAuth(false)}
                            disabled={loading || !email || !password}
                            className="btn-medieval flex-1 text-sm"
                            style={{
                                background: 'linear-gradient(180deg, #1a1a1a, #111)',
                                borderColor: '#444',
                                color: '#9ca3af',
                            }}
                        >
                            📜 Registrar
                        </button>
                    </div>
                </div>

                {/* Linha inferior dourada */}
                <div className="absolute bottom-0 left-4 right-4 h-[1px]"
                    style={{ background: 'linear-gradient(to right, transparent, #f2b90d40, transparent)' }}
                />
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 left-0 right-0 text-center text-[9px] uppercase tracking-[0.4em] text-gray-700 pointer-events-none z-10">
                Velmora © 2026 • Forjado nas Sombras
            </div>
        </div>
    )
}
