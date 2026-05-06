export function createCoreTextureGenerators({
    THREE,
    MOBILE_MODE,
    RENDER_PROFILE,
    clampTextureSize,
    scaleCount
}) {
    function createSpaceBackdropTexture(size = 2048) {
        size = clampTextureSize(size, MOBILE_MODE ? 384 : 512);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
    
        const base = ctx.createRadialGradient(size * 0.5, size * 0.42, size * 0.06, size * 0.5, size * 0.5, size * 0.92);
        base.addColorStop(0, '#081130');
        base.addColorStop(0.42, '#040a1d');
        base.addColorStop(1, '#01030a');
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, size, size);
    
        const tintA = ctx.createRadialGradient(size * 0.34, size * 0.32, size * 0.06, size * 0.34, size * 0.32, size * 0.48);
        tintA.addColorStop(0, 'rgba(96, 126, 255, 0.1)');
        tintA.addColorStop(1, 'rgba(96, 126, 255, 0)');
        ctx.fillStyle = tintA;
        ctx.fillRect(0, 0, size, size);
    
        const tintB = ctx.createRadialGradient(size * 0.66, size * 0.62, size * 0.08, size * 0.66, size * 0.62, size * 0.52);
        tintB.addColorStop(0, 'rgba(188, 112, 255, 0.082)');
        tintB.addColorStop(1, 'rgba(188, 112, 255, 0)');
        ctx.fillStyle = tintB;
        ctx.fillRect(0, 0, size, size);
    
        const nebulaPalette = ['112,140,255', '181,102,255', '255,136,183', '138,202,255', '141,182,255'];
        for (let i = 0; i < scaleCount(28, 12); i += 1) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = size * (0.16 + Math.random() * 0.3);
            const a = 0.03 + Math.random() * 0.07;
            const hue = nebulaPalette[Math.floor(Math.random() * nebulaPalette.length)];
            const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
            glow.addColorStop(0, `rgba(${hue},${a})`);
            glow.addColorStop(0.44, `rgba(${hue},${(a * 0.48).toFixed(3)})`);
            glow.addColorStop(0.76, `rgba(${hue},${(a * 0.12).toFixed(3)})`);
            glow.addColorStop(1, `rgba(${hue},0)`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    
        const hazeCount = Math.floor(size * 2.8);
        for (let i = 0; i < hazeCount; i += 1) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = 0.12 + Math.random() * 0.62;
            const alpha = 0.004 + Math.random() * 0.014;
            ctx.fillStyle = `rgba(152, 177, 255, ${alpha.toFixed(4)})`;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    
        const starPalette = ['255,255,255', '222,232,255', '255,236,221', '188,216,255', '255,228,242'];
        const starCount = Math.floor(size * size * 0.00135);
    
        for (let i = 0; i < starCount; i += 1) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = 0.08 + Math.pow(Math.random(), 3.1) * 1.24;
            const alpha = 0.3 + Math.random() * 0.68;
            const color = starPalette[Math.floor(Math.random() * starPalette.length)];
    
            ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
    
            if (Math.random() < 0.045) {
                const glowRadius = radius * (10 + Math.random() * 18);
                const glow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
                glow.addColorStop(0, `rgba(${color}, ${(alpha * 0.32).toFixed(3)})`);
                glow.addColorStop(0.42, `rgba(${color}, ${(alpha * 0.12).toFixed(3)})`);
                glow.addColorStop(1, `rgba(${color},0)`);
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
                ctx.fill();
            }
    
            if (Math.random() < 0.006) {
                const flareLength = radius * (9 + Math.random() * 20);
                ctx.strokeStyle = `rgba(${color}, ${(alpha * 0.22).toFixed(3)})`;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(x - flareLength, y);
                ctx.lineTo(x + flareLength, y);
                ctx.moveTo(x, y - flareLength);
                ctx.lineTo(x, y + flareLength);
                ctx.stroke();
            }
        }
    
        const ditherCount = Math.floor(size * size * 0.016);
        const ditherPalette = ['120,146,255', '162,120,255', '104,132,220'];
        for (let i = 0; i < ditherCount; i += 1) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const color = ditherPalette[Math.floor(Math.random() * ditherPalette.length)];
            const alpha = 0.004 + Math.random() * 0.01;
            const radius = 0.08 + Math.random() * 0.36;
            ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(4)})`;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    
        // Blend left/right strips so skydome UV seam is not visible.
        const seamWidth = 1;
        const seamData = ctx.getImageData(0, 0, size, size);
        const data = seamData.data;
        for (let y = 0; y < size; y += 1) {
            for (let x = 0; x < seamWidth; x += 1) {
                const left = (y * size + x) * 4;
                const right = (y * size + (size - seamWidth + x)) * 4;
                data[left] = (data[left] + data[right]) * 0.5;
                data[left + 1] = (data[left + 1] + data[right + 1]) * 0.5;
                data[left + 2] = (data[left + 2] + data[right + 2]) * 0.5;
                data[left + 3] = (data[left + 3] + data[right + 3]) * 0.5;
                data[right] = data[left];
                data[right + 1] = data[left + 1];
                data[right + 2] = data[left + 2];
                data[right + 3] = data[left + 3];
            }
        }
        ctx.putImageData(seamData, 0, 0);
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }
    
    function createNebulaSpriteTexture(palette = ['118,146,255', '193,118,255', '255,145,192'], size = 1536) {
        size = clampTextureSize(size, MOBILE_MODE ? 320 : 512);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const center = size * 0.5;
        const tau = Math.PI * 2;
    
        ctx.clearRect(0, 0, size, size);
        ctx.globalCompositeOperation = 'screen';
    
        const baseWash = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.04, size * 0.5, size * 0.5, size * 0.56);
        baseWash.addColorStop(0, 'rgba(154, 172, 255, 0.12)');
        baseWash.addColorStop(0.52, 'rgba(154, 172, 255, 0.055)');
        baseWash.addColorStop(1, 'rgba(154, 172, 255, 0)');
        ctx.fillStyle = baseWash;
        ctx.fillRect(0, 0, size, size);
    
        for (let i = 0; i < scaleCount(42, 16); i += 1) {
            const x = size * (0.08 + Math.random() * 0.84);
            const y = size * (0.08 + Math.random() * 0.84);
            const radius = size * (0.14 + Math.random() * 0.34);
            const alpha = 0.02 + Math.random() * 0.11;
            const color = palette[Math.floor(Math.random() * palette.length)];
    
            const cloud = ctx.createRadialGradient(x, y, 0, x, y, radius);
            cloud.addColorStop(0, `rgba(${color}, ${alpha.toFixed(3)})`);
            cloud.addColorStop(0.44, `rgba(${color}, ${(alpha * 0.62).toFixed(3)})`);
            cloud.addColorStop(0.76, `rgba(${color}, ${(alpha * 0.2).toFixed(3)})`);
            cloud.addColorStop(1, `rgba(${color}, 0)`);
            ctx.fillStyle = cloud;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    
        const centerGlow = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.1, size * 0.5, size * 0.5, size * 0.7);
        centerGlow.addColorStop(0, 'rgba(255,255,255,0.16)');
        centerGlow.addColorStop(0.5, 'rgba(214, 198, 255, 0.06)');
        centerGlow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = centerGlow;
        ctx.fillRect(0, 0, size, size);
    
        const mistCount = Math.floor(size * (0.36 * RENDER_PROFILE.pointCountScale));
        for (let i = 0; i < mistCount; i += 1) {
            const angle = Math.random() * tau;
            const distance = Math.pow(Math.random(), 0.72) * size * 0.48;
            const x = center + Math.cos(angle) * distance;
            const y = center + Math.sin(angle) * distance;
            const radius = 0.2 + Math.random() * 1.2;
            const alpha = 0.004 + Math.random() * 0.018;
            const color = palette[Math.floor(Math.random() * palette.length)];
            ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(4)})`;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    
        const edgeMask = ctx.createRadialGradient(center, center, size * 0.14, center, center, size * 0.5);
        edgeMask.addColorStop(0, 'rgba(255,255,255,1)');
        edgeMask.addColorStop(0.72, 'rgba(255,255,255,0.98)');
        edgeMask.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = edgeMask;
        ctx.fillRect(0, 0, size, size);
    
        ctx.globalCompositeOperation = 'source-over';
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }
    
    function createPlanetTexture(type, size = 1024, style = {}) {
        size = clampTextureSize(size, MOBILE_MODE ? 256 : 512);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
    
        const seed = (style.seed ?? 0) + type.length * 37.13;
        let randomIndex = 0;
        const randomValue = () => {
            randomIndex += 1;
            const x = Math.sin(randomIndex * 12.9898 + seed * 78.233) * 43758.5453;
            return x - Math.floor(x);
        };
    
        const gradients = {
            rocky: ['#4a2f27', '#b56f44', '#d99766', '#7a4c35'],
            dry: ['#5a3322', '#c06f3f', '#eb9a5e', '#8f5232'],
            earthy: ['#1f4f7a', '#2f90a3', '#54b677', '#2f6e9a'],
            gasWarm: ['#8f4e2f', '#d18952', '#f0bb7a', '#b96f4d'],
            gasCold: ['#365e86', '#4f89b7', '#75b8dd', '#4e6f9e'],
            ice: ['#6a93bb', '#95c6e6', '#c8e6f9', '#7fb1d8'],
            volcanic: ['#452019', '#8f3a22', '#cf6032', '#5a271a']
        };
    
        const palette = style.palette || gradients[type] || gradients.rocky;
        const stripeStep = Math.max(2, Math.floor(style.stripeStep ?? ((type === 'gasWarm' || type === 'gasCold') ? 4 : 7)));
        const stripeStrength = style.stripeStrength ?? ((type === 'gasWarm' || type === 'gasCold') ? 0.29 : 0.14);
        const bandFrequency = style.bandFrequency ?? ((type === 'gasWarm' || type === 'gasCold') ? 28 : 14);
    
        const base = ctx.createLinearGradient(0, 0, size, size);
        base.addColorStop(0, palette[0]);
        base.addColorStop(0.35, palette[1]);
        base.addColorStop(0.65, palette[2]);
        base.addColorStop(1, palette[3]);
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, size, size);
    
        for (let y = 0; y < size; y += stripeStep) {
            const t = y / size;
            const wave = Math.sin(t * Math.PI * bandFrequency + seed * 0.4 + Math.sin(t * 11 + seed * 0.12) * 2.4);
            const alpha = (0.03 + Math.abs(wave) * stripeStrength) * (0.82 + randomValue() * 0.34);
            const stripeTint = type === 'gasWarm' || type === 'dry'
                ? '255,228,192'
                : type === 'gasCold' || type === 'ice'
                    ? '214,238,255'
                    : type === 'volcanic'
                        ? '255,190,124'
                    : '240,255,234';
            ctx.fillStyle = `rgba(${stripeTint},${alpha})`;
            ctx.fillRect(0, y, size, 2 + randomValue() * 5);
        }
    
        if (type === 'rocky' || type === 'dry' || type === 'volcanic') {
            const craterCountBase = style.craterCount ?? (type === 'rocky' ? 96 : type === 'dry' ? 70 : 54);
            const craterCount = scaleCount(craterCountBase, 20);
            for (let i = 0; i < craterCount; i += 1) {
                const x = randomValue() * size;
                const y = randomValue() * size;
                const r = 2 + randomValue() * size * 0.016;
                const darkAlpha = 0.05 + randomValue() * 0.13;
                const rimAlpha = 0.04 + randomValue() * 0.09;
                ctx.fillStyle = `rgba(0,0,0,${darkAlpha.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
    
                ctx.strokeStyle = `rgba(255,222,188,${rimAlpha.toFixed(3)})`;
                ctx.lineWidth = 0.6 + randomValue() * 1.4;
                ctx.beginPath();
                ctx.arc(x, y, r * (0.62 + randomValue() * 0.26), 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    
        if (type === 'earthy') {
            const continentCount = scaleCount(style.continentCount ?? 26, 8);
            for (let i = 0; i < continentCount; i += 1) {
                const x = randomValue() * size;
                const y = randomValue() * size;
                const rx = size * (0.02 + randomValue() * 0.07);
                const ry = size * (0.015 + randomValue() * 0.05);
                ctx.fillStyle = `rgba(78, 164, 113, ${(0.22 + randomValue() * 0.26).toFixed(3)})`;
                ctx.beginPath();
                ctx.ellipse(x, y, rx, ry, randomValue() * Math.PI, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    
        if (type === 'gasWarm' || type === 'gasCold') {
            const stormCount = scaleCount(style.stormCount ?? 2, 1);
            for (let i = 0; i < stormCount; i += 1) {
                const x = size * (0.12 + randomValue() * 0.76);
                const y = size * (0.18 + randomValue() * 0.64);
                const rx = size * (0.05 + randomValue() * 0.08);
                const ry = rx * (0.46 + randomValue() * 0.36);
                const storm = ctx.createRadialGradient(x, y, 0, x, y, rx * 1.4);
                const warmStorm = type === 'gasWarm';
                storm.addColorStop(0, warmStorm ? 'rgba(255, 230, 188, 0.4)' : 'rgba(214, 232, 255, 0.42)');
                storm.addColorStop(0.45, warmStorm ? 'rgba(255, 182, 132, 0.2)' : 'rgba(150, 190, 255, 0.22)');
                storm.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = storm;
                ctx.beginPath();
                ctx.ellipse(x, y, rx, ry, randomValue() * Math.PI, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    
        if (type === 'ice') {
            const crackCount = scaleCount(style.crackCount ?? 36, 10);
            for (let i = 0; i < crackCount; i += 1) {
                const startX = randomValue() * size;
                const startY = randomValue() * size;
                const segments = 4 + Math.floor(randomValue() * 4);
                let x = startX;
                let y = startY;
    
                ctx.strokeStyle = `rgba(224,245,255,${(0.12 + randomValue() * 0.18).toFixed(3)})`;
                ctx.lineWidth = 0.5 + randomValue();
                ctx.beginPath();
                ctx.moveTo(x, y);
                for (let s = 0; s < segments; s += 1) {
                    x += (randomValue() - 0.5) * size * 0.09;
                    y += (randomValue() - 0.5) * size * 0.09;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        }
    
        if (type === 'volcanic') {
            const fissureCount = scaleCount(style.fissureCount ?? 24, 8);
            for (let i = 0; i < fissureCount; i += 1) {
                const x = randomValue() * size;
                const y = randomValue() * size;
                const len = size * (0.03 + randomValue() * 0.08);
                const angle = randomValue() * Math.PI * 2;
                ctx.strokeStyle = `rgba(255,166,92,${(0.14 + randomValue() * 0.2).toFixed(3)})`;
                ctx.lineWidth = 0.6 + randomValue() * 1.8;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
                ctx.stroke();
            }
        }
    
        for (let i = 0; i < scaleCount(1600, 420); i++) {
            const x = randomValue() * size;
            const y = randomValue() * size;
            const r = randomValue() * 5.5;
            const a = 0.02 + randomValue() * 0.08;
            ctx.fillStyle = `rgba(0,0,0,${a})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    
        const enrich = ctx.createRadialGradient(size * 0.45, size * 0.42, size * 0.08, size * 0.5, size * 0.5, size * 0.7);
        enrich.addColorStop(0, 'rgba(255,255,255,0.18)');
        enrich.addColorStop(0.48, 'rgba(255,255,255,0.06)');
        enrich.addColorStop(1, 'rgba(0,0,0,0.16)');
        ctx.fillStyle = enrich;
        ctx.fillRect(0, 0, size, size);
    
        // Soften horizontal UV seam to avoid a visible split line on the sphere.
        const seamWidth = 2;
        const seamData = ctx.getImageData(0, 0, size, size);
        const seamPixels = seamData.data;
        for (let y = 0; y < size; y += 1) {
            for (let x = 0; x < seamWidth; x += 1) {
                const left = (y * size + x) * 4;
                const right = (y * size + (size - seamWidth + x)) * 4;
                seamPixels[left] = (seamPixels[left] + seamPixels[right]) * 0.5;
                seamPixels[left + 1] = (seamPixels[left + 1] + seamPixels[right + 1]) * 0.5;
                seamPixels[left + 2] = (seamPixels[left + 2] + seamPixels[right + 2]) * 0.5;
                seamPixels[left + 3] = (seamPixels[left + 3] + seamPixels[right + 3]) * 0.5;
                seamPixels[right] = seamPixels[left];
                seamPixels[right + 1] = seamPixels[left + 1];
                seamPixels[right + 2] = seamPixels[left + 2];
                seamPixels[right + 3] = seamPixels[left + 3];
            }
        }
        ctx.putImageData(seamData, 0, 0);
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }
    
    function createPlanetCloudTexture(options = {}) {
        const size = clampTextureSize(options.size ?? 1024, MOBILE_MODE ? 256 : 512);
        const cloudCount = scaleCount(options.cloudCount ?? 170, 36);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
    
        const palette = options.palette ?? ['255,255,255', '214,230,255'];
        for (let i = 0; i < cloudCount; i += 1) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const radius = size * (0.04 + Math.random() * 0.11);
            const color = palette[Math.floor(Math.random() * palette.length)];
            const alpha = 0.03 + Math.random() * 0.13;
    
            const cloud = ctx.createRadialGradient(x, y, 0, x, y, radius);
            cloud.addColorStop(0, `rgba(${color}, ${alpha.toFixed(3)})`);
            cloud.addColorStop(0.5, `rgba(${color}, ${(alpha * 0.52).toFixed(3)})`);
            cloud.addColorStop(1, `rgba(${color}, 0)`);
            ctx.fillStyle = cloud;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }
    
    function createPlanetRingTexture(options = {}) {
        const size = clampTextureSize(options.size ?? 1024, MOBILE_MODE ? 256 : 512);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const center = size * 0.5;
        const tau = Math.PI * 2;
    
        const toRgbString = (color) => {
            const c = new THREE.Color(color);
            return `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
        };
    
        const inner = size * (options.innerRatio ?? 0.32);
        const outer = size * (options.outerRatio ?? 0.49);
        const colorA = toRgbString(options.colorA ?? 0xe5d5ab);
        const colorB = toRgbString(options.colorB ?? 0x8f7d67);
        const opacityScale = options.opacityScale ?? 1;
    
        for (let i = 0; i < scaleCount(2200, 520); i += 1) {
            const angle = Math.random() * tau;
            const radius = inner + Math.random() * (outer - inner);
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;
            const particleRadius = 0.3 + Math.random() * 1.3;
            const color = Math.random() > 0.52 ? colorA : colorB;
            const alpha = (0.04 + Math.random() * 0.26) * opacityScale;
            ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(x, y, particleRadius, 0, tau);
            ctx.fill();
        }
    
        const arcLineCount = scaleCount(160, 48);
        for (let i = 0; i < arcLineCount; i += 1) {
            const radius = inner + (i / Math.max(1, arcLineCount - 1)) * (outer - inner);
            const alpha = (0.03 + Math.random() * 0.06) * opacityScale;
            const color = Math.random() > 0.5 ? colorA : colorB;
            ctx.strokeStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.5 + Math.random() * 0.8;
            ctx.beginPath();
            ctx.arc(center, center, radius, 0, tau);
            ctx.stroke();
        }
    
        const edgeMask = ctx.createRadialGradient(center, center, inner * 0.86, center, center, outer * 1.06);
        edgeMask.addColorStop(0, 'rgba(255,255,255,0)');
        edgeMask.addColorStop(0.38, 'rgba(255,255,255,1)');
        edgeMask.addColorStop(0.76, 'rgba(255,255,255,1)');
        edgeMask.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = edgeMask;
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = 'source-over';
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }
    
    function createPlanetRoughnessTexture(size = 1024) {
        size = clampTextureSize(size, MOBILE_MODE ? 256 : 512);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
    
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const v = 105 + Math.random() * 120;
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
            data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        return texture;
    }
    
    function createParticleSpriteTexture(size = 128) {
        size = clampTextureSize(size, 64);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
    
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.25, 'rgba(245,225,255,0.95)');
        gradient.addColorStop(0.55, 'rgba(170,200,255,0.45)');
        gradient.addColorStop(1, 'rgba(170,200,255,0)');
    
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }
    
    function createCometTrailTexture(width = 256, height = 64) {
        width = clampTextureSize(width, 128);
        height = Math.max(32, Math.round((height * RENDER_PROFILE.textureScale) / 8) * 8);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
    
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
        gradient.addColorStop(0.16, 'rgba(232,232,255,0.82)');
        gradient.addColorStop(0.48, 'rgba(176,162,255,0.35)');
        gradient.addColorStop(1, 'rgba(176,162,255,0)');
    
        const centerY = height * 0.5;
        const flare = ctx.createRadialGradient(width * 0.08, centerY, 1, width * 0.08, centerY, height * 0.45);
        flare.addColorStop(0, 'rgba(255,255,255,1)');
        flare.addColorStop(0.45, 'rgba(255,238,210,0.85)');
        flare.addColorStop(1, 'rgba(255,238,210,0)');
    
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = flare;
        ctx.fillRect(0, 0, width * 0.34, height);
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }
    
    function createCrystalMicroTexture(size = 512) {
        size = clampTextureSize(size, 256);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
    
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const grain = 94 + Math.random() * 42;
            data[i] = grain;
            data[i + 1] = grain;
            data[i + 2] = grain;
            data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2.1, 5.8);
        return texture;
    }
    
    function createSunSurfaceTexture(size = 1024) {
        size = clampTextureSize(size, MOBILE_MODE ? 384 : 640);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
    
        const base = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.08, size * 0.5, size * 0.5, size * 0.58);
        base.addColorStop(0, '#fff8cb');
        base.addColorStop(0.5, '#ffd46c');
        base.addColorStop(1, '#ff9f30');
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, size, size);
    
        for (let i = 0; i < scaleCount(8200, 1800); i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = 0.6 + Math.random() * 3.2;
            const a = 0.025 + Math.random() * 0.1;
            const tint = Math.random() > 0.5 ? '255,214,114' : '255,156,62';
            ctx.fillStyle = `rgba(${tint},${a})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1.3, 1.12);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }
    
    function createSunCoronaTexture(size = 768) {
        size = clampTextureSize(size, MOBILE_MODE ? 320 : 512);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
    
        const c = size * 0.5;
        const g = ctx.createRadialGradient(c, c, size * 0.2, c, c, size * 0.5);
        g.addColorStop(0, 'rgba(255,244,190,0.95)');
        g.addColorStop(0.35, 'rgba(255,194,105,0.6)');
        g.addColorStop(0.7, 'rgba(255,135,42,0.22)');
        g.addColorStop(1, 'rgba(255,120,32,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
    
        const rayCount = scaleCount(210, 72);
        for (let i = 0; i < rayCount; i++) {
            const a = (i / rayCount) * Math.PI * 2;
            const len = size * (0.05 + Math.random() * 0.13);
            const inner = size * (0.35 + Math.random() * 0.05);
            const x1 = c + Math.cos(a) * inner;
            const y1 = c + Math.sin(a) * inner;
            const x2 = c + Math.cos(a) * (inner + len);
            const y2 = c + Math.sin(a) * (inner + len);
            ctx.strokeStyle = `rgba(255,174,84,${0.05 + Math.random() * 0.16})`;
            ctx.lineWidth = 1 + Math.random() * 2.1;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }
    

    return {
        createSpaceBackdropTexture,
        createNebulaSpriteTexture,
        createPlanetTexture,
        createPlanetCloudTexture,
        createPlanetRingTexture,
        createPlanetRoughnessTexture,
        createParticleSpriteTexture,
        createCometTrailTexture,
        createCrystalMicroTexture,
        createSunSurfaceTexture,
        createSunCoronaTexture
    };
}

