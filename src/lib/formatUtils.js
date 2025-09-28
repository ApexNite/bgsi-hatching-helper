const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;
const DAYS_PER_YEAR = 365.25;
const SECONDS_PER_YEAR = SECONDS_PER_DAY * DAYS_PER_YEAR;

export function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
        return '∞';
    }
    
    if (seconds < 0) {
        seconds = 0;
    }
    
    if (seconds < SECONDS_PER_MINUTE) { 
        return `${seconds.toFixed(1)}s`;
    }
    
    const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
    const hours = Math.floor(seconds / SECONDS_PER_HOUR);
    const days = Math.floor(seconds / SECONDS_PER_DAY);
    const years = Math.floor(seconds / SECONDS_PER_YEAR);
    
    if (years >= 1) {
        const remainingDays = Math.round((seconds - years * SECONDS_PER_YEAR) / SECONDS_PER_DAY);
        return `${years}y ${remainingDays}d`;
    }
    
    if (days >= 1) {
        const remainingHours = Math.round((seconds - days * SECONDS_PER_DAY) / SECONDS_PER_HOUR);
        return `${days}d ${remainingHours}h`;
    }
    
    if (hours >= 1) {
        const remainingMinutes = Math.round((seconds - hours * SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
        return `${hours}h ${remainingMinutes}m`;
    }
    
    const remainingSeconds = Math.round(seconds - minutes * SECONDS_PER_MINUTE);
    return `${minutes}m ${remainingSeconds}s`;
}

export function formatChance(chance) {
    const clampedChance = Number.isFinite(chance) ? Math.max(0, Math.min(1, chance)) : 0;
    return clampedChance < 0.001 ? formatChanceFraction(clampedChance) : formatChancePercent(clampedChance);
}

export function formatChancePercent(chance) {
    const percentChance = chance * 100;

    if (percentChance >= 10) {
        return `${Math.round(percentChance)}%`;
    }
    
    const digits = percentChance >= 1 ? 2 : 3;
    return `${percentChance.toFixed(digits)}%`;
}

export function formatChanceFraction(chance) {
    if (!Number.isFinite(chance) || chance <= 0) {
        return '1/∞';
    }

    return `1/${Math.max(1, Math.round(1 / chance)).toLocaleString()}`;
}

export function formatMultiplier(multiplier) {
    if (!Number.isFinite(multiplier)) {
        return '∞x';
    }

    if (Number.isInteger(multiplier)) {
        return `${multiplier}x`;
    }

    return `${multiplier.toFixed(1)}x`;
}