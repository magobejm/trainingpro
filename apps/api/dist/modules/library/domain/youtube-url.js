"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isYouTubeUrl = isYouTubeUrl;
function isYouTubeUrl(value) {
    try {
        const url = new URL(value);
        const host = normalizeHost(url.hostname);
        if (host === 'youtu.be') {
            return url.pathname.length > 1;
        }
        if (host !== 'youtube.com') {
            return false;
        }
        if (url.pathname.startsWith('/watch')) {
            return Boolean(url.searchParams.get('v'));
        }
        if (url.pathname.startsWith('/embed/')) {
            return url.pathname.split('/').filter(Boolean).length >= 2;
        }
        if (url.pathname.startsWith('/shorts/')) {
            return url.pathname.split('/').filter(Boolean).length >= 2;
        }
        return false;
    }
    catch {
        return false;
    }
}
function normalizeHost(hostname) {
    return hostname.trim().toLowerCase().replace(/^www\./, '');
}
