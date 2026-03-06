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

            if (error) setErrorMsg(error.message)
            else onLoginSuccess()
        } catch (err: any) {
            setErrorMsg(err.message || 'Erro inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden" style={{ background: '#0d0d0d' }}>
            <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
                style={{ backgroundImage: 'url("/images/loading1.jpeg")', filter: 'grayscale(0.2) contrast(1.1)' }}
            />
            <div className="absolute inset-0 z-1" style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%)' }} />

            <ParticleBackground count={30} />

            <div className="relative z-10 western-border p-8 max-w-sm w-full mx-4 flex flex-col items-center text-center backdrop-blur-md"
                style={{
                    background: 'linear-gradient(160deg, rgba(20,16,8,0.7), rgba(10,10,10,0.8))',
                    boxShadow: '0 0 60px rgba(0,0,0,0.9), 0 0 30px rgba(242,185,13,0.1)',
                    border: '1px solid rgba(242,185,13,0.2)',
                }}
            >
                <div className="relative mb-4 w-full flex justify-center">
                    <img src="/images/logo-grande.jpeg" alt="Far West Logo" className="w-48 h-auto drop-shadow-[0_0_15px_rgba(242,185,13,0.3)] animate-fade-in rounded-sm" />
                </div>
                <p className="text-base text-gray-500 italic mb-1 uppercase tracking-[0.2em] font-black">Viva rápido, mire melhor</p>
                <div className="w-full ornament-divider text-xs my-6 tracking-[0.4em]">⚔️ ⚔️ ⚔️</div>

                {errorMsg && (
                    <div className="w-full p-3 mb-4 rounded-sm text-xs font-bold uppercase tracking-wider"
                        style={{ border: '1px solid rgba(220,38,38,0.4)', background: 'rgba(220,38,38,0.08)', color: '#f87171' }}
                    >
                        ? {errorMsg}
                    </div>
                )}

                <div className="w-full space-y-4">
                    <input type="email" placeholder="Email do Pistoleiro" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuth(true)} className="w-full text-base px-5 py-4 font-black outline-none transition-all placeholder:text-gray-600 rounded-sm" style={{ background: 'rgba(0,0,0,0.8)', border: '2px solid #3a3a3a', color: '#fff' }} />
                    <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuth(true)} className="w-full text-base px-5 py-4 font-black outline-none transition-all placeholder:text-gray-600 rounded-sm" style={{ background: 'rgba(0,0,0,0.8)', border: '2px solid #3a3a3a', color: '#fff' }} />

                    <div className="flex flex-col gap-3 pt-4 w-full">
                        <button onClick={() => handleAuth(true)} disabled={loading || !email || !password} className="btn-western w-full py-4 text-base font-black shadow-xl">
                            {loading ? <span className="animate-pulse italic">Engatilhando...</span> : 'ENTRAR NO SALOON'}
                        </button>
                        <button onClick={() => handleAuth(false)} disabled={loading || !email || !password} className="btn-western w-full py-4 text-sm font-black border-2 border-white/10 text-gray-400 hover:text-white transition-all bg-black/40">
                            REGISTRAR NOVO PISTOLEIRO
                        </button>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 text-center text-xs uppercase tracking-[0.4em] text-gray-600 font-black pointer-events-none z-10 opacity-40">
                Far West © 2026 • Poeira, chumbo e glória
            </div>
        </div>
    )
}

