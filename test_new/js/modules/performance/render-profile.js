export function detectMobileMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const forceMobileMode = urlParams.get('mobile') === '1' || urlParams.get('mobile') === 'true';
    const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    const looksLikeMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Silk/i.test(navigator.userAgent);
    const compactViewport = Math.min(window.innerWidth, window.innerHeight) <= 900;
    const touchOnlyCompactViewport = coarsePointer && !finePointer && compactViewport;
    return forceMobileMode || looksLikeMobileUA || touchOnlyCompactViewport;
}

export function createRenderProfile(mobileMode) {
    return mobileMode
        ? {
            textureScale: 0.54,
            textureMin: 192,
            pointCountScale: 0.36,
            instanceCountScale: 0.4,
            segmentScale: 0.62,
            pixelRatioHigh: 0.88,
            pixelRatioLow: 0.72,
            speedParticlesHigh: 26,
            speedParticlesLow: 14,
            starColorStrideHigh: 5,
            starColorStrideLow: 12,
            backgroundFrameStride: 4,
            ambientShipPool: 3,
            cometPool: 2,
            anisotropy: 2,
            allowSmaa: false,
            allowBloomIdle: false,
            forceLowQuality: true,
            preferDirectRenderInLow: true,
            labelUpdateStrideLow: 4,
            skipHdrEnvironment: true,
            composerScaleHigh: 0.74,
            composerScaleLow: 0.64,
            composerScaleUltra: 0.56,
            allowUltraLow: true,
            ultraLowPixelRatio: 0.58,
            ultraLowStarColorStride: 16,
            ultraLowBackgroundStride: 5,
            disableLensPassInLow: true,
            dustSimStrideLow: 4,
            dustColorStrideLow: 10
        }
        : {
            textureScale: 1,
            textureMin: 256,
            pointCountScale: 1,
            instanceCountScale: 1,
            segmentScale: 1,
            pixelRatioHigh: 1.35,
            pixelRatioLow: 1.0,
            speedParticlesHigh: 96,
            speedParticlesLow: 58,
            starColorStrideHigh: 3,
            starColorStrideLow: 4,
            backgroundFrameStride: 1,
            ambientShipPool: 9,
            cometPool: 4,
            anisotropy: 8,
            allowSmaa: true,
            allowBloomIdle: true,
            forceLowQuality: false,
            preferDirectRenderInLow: false,
            labelUpdateStrideLow: 2,
            skipHdrEnvironment: false,
            composerScaleHigh: 1,
            composerScaleLow: 1,
            composerScaleUltra: 1,
            allowUltraLow: false,
            ultraLowPixelRatio: 1,
            ultraLowStarColorStride: 4,
            ultraLowBackgroundStride: 1,
            disableLensPassInLow: false,
            dustSimStrideLow: 2,
            dustColorStrideLow: 4
        };
}

export function createRuntimePerfState() {
    return {
        ultraLow: false,
        slowFrames: 0,
        fastFrames: 0
    };
}

export function createRenderScalingHelpers({ RENDER_PROFILE, runtimePerfState }) {
    function clampTextureSize(size, minSize = RENDER_PROFILE.textureMin) {
        const scaled = Math.round((size * RENDER_PROFILE.textureScale) / 32) * 32;
        return Math.max(minSize, Math.min(size, scaled));
    }

    function scaleCount(count, min = 1, type = 'point') {
        const factor = type === 'instance' ? RENDER_PROFILE.instanceCountScale : RENDER_PROFILE.pointCountScale;
        return Math.max(min, Math.round(count * factor));
    }

    function scaleSegments(segments, min = 6) {
        return Math.max(min, Math.round(segments * RENDER_PROFILE.segmentScale));
    }

    function getEffectivePixelRatio(lowQuality) {
        let ratio = lowQuality ? RENDER_PROFILE.pixelRatioLow : RENDER_PROFILE.pixelRatioHigh;
        if (runtimePerfState.ultraLow && lowQuality) {
            ratio = Math.min(ratio, RENDER_PROFILE.ultraLowPixelRatio);
        }
        return Math.min(window.devicePixelRatio || 1, ratio);
    }

    function getEffectiveStarStride(lowQuality) {
        let stride = lowQuality ? RENDER_PROFILE.starColorStrideLow : RENDER_PROFILE.starColorStrideHigh;
        if (runtimePerfState.ultraLow && lowQuality) {
            stride = Math.max(stride, RENDER_PROFILE.ultraLowStarColorStride);
        }
        return stride;
    }

    function getEffectiveComposerScale(lowQuality) {
        let scale = lowQuality ? RENDER_PROFILE.composerScaleLow : RENDER_PROFILE.composerScaleHigh;
        if (runtimePerfState.ultraLow && lowQuality) {
            scale = Math.min(scale, RENDER_PROFILE.composerScaleUltra);
        }
        return scale;
    }

    function getEffectiveBackgroundStride(lowQuality) {
        if (!lowQuality) return 1;
        if (runtimePerfState.ultraLow) {
            return Math.max(RENDER_PROFILE.backgroundFrameStride, RENDER_PROFILE.ultraLowBackgroundStride);
        }
        return RENDER_PROFILE.backgroundFrameStride;
    }

    return {
        clampTextureSize,
        scaleCount,
        scaleSegments,
        getEffectivePixelRatio,
        getEffectiveStarStride,
        getEffectiveComposerScale,
        getEffectiveBackgroundStride
    };
}
