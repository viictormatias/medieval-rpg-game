export const MAX_LEVEL = 60

// Curva progressiva para tornar a jornada até o nível 60 significativamente mais longa.
export function xpForNextLevel(level: number): number {
    const safeLevel = Math.max(1, Math.floor(level || 1))
    if (safeLevel >= MAX_LEVEL) return 0
    return Math.floor(140 + safeLevel * 45 + safeLevel * safeLevel * 4.5)
}

export function isMaxLevel(level: number): boolean {
    return Math.max(1, Math.floor(level || 1)) >= MAX_LEVEL
}
