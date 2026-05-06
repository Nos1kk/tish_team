        import * as THREE from 'three';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
        import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
        import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
        import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
        import { createCoreTextureGenerators } from './modules/textures/core-textures.js';
        import { createServiceRotatorController } from './modules/ui/service-rotator.js';
        import { createFallbackShip } from './modules/models/fallback-ship.js';
        import { createCrystalFactories } from './modules/crystal/crystal-factories.js';
        import { createCrystalSectorsSystem } from './modules/crystal/crystal-sectors.js';
        import {
            detectMobileMode,
            createRenderProfile,
            createRuntimePerfState,
            createRenderScalingHelpers
        } from './modules/performance/render-profile.js';
        import {
            createCinematicSpeedParticle,
            resetCinematicSpeedParticle
        } from './modules/cinematic/speed-particles.js';

        const MOBILE_MODE = detectMobileMode();
        const reducedMotionMediaQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
        const REDUCED_MOTION_MODE = !!reducedMotionMediaQuery?.matches;
        const LOW_CPU_HINT = (
            (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4)
            || (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4)
        );
        function isCpuConstrainedViewport() {
            const viewport = window.visualViewport;
            const width = Math.max(1, Math.floor(viewport?.width ?? document.documentElement.clientWidth ?? window.innerWidth));
            const height = Math.max(1, Math.floor(viewport?.height ?? document.documentElement.clientHeight ?? window.innerHeight));

            return LOW_CPU_HINT && (width <= 900 || height <= 680);
        }

        function getViewportSize() {
            const viewport = window.visualViewport;
            const width = Math.max(1, Math.floor(viewport?.width ?? document.documentElement.clientWidth ?? window.innerWidth));
            const height = Math.max(1, Math.floor(viewport?.height ?? document.documentElement.clientHeight ?? window.innerHeight));

            return { width, height };
        }

        const initialViewportFlags = getViewportSize();
        let NARROW_SCREEN_MODE = initialViewportFlags.width <= 980 || initialViewportFlags.height <= 700;
        let ULTRA_COMPACT_SCREEN_MODE = initialViewportFlags.width <= 720 || initialViewportFlags.height <= 560;
        let LOW_END_MODE = MOBILE_MODE || REDUCED_MOTION_MODE || ULTRA_COMPACT_SCREEN_MODE || isCpuConstrainedViewport();

        function refreshViewportModeFlags() {
            const { width, height } = getViewportSize();
            NARROW_SCREEN_MODE = width <= 980 || height <= 700;
            ULTRA_COMPACT_SCREEN_MODE = width <= 720 || height <= 560;
            LOW_END_MODE = MOBILE_MODE || REDUCED_MOTION_MODE || ULTRA_COMPACT_SCREEN_MODE || isCpuConstrainedViewport();

            if (document.body) {
                document.body.classList.toggle('narrow-screen', NARROW_SCREEN_MODE);
                document.body.classList.toggle('reduced-motion', REDUCED_MOTION_MODE);
            }
        }

        refreshViewportModeFlags();

        const RENDER_PROFILE = createRenderProfile(MOBILE_MODE);
        let lowEndProfileApplied = false;

        function applyLowEndProfileOverrides() {
            if (lowEndProfileApplied || !LOW_END_MODE) return;

            RENDER_PROFILE.forceLowQuality = true;
            RENDER_PROFILE.preferDirectRenderInLow = MOBILE_MODE || ULTRA_COMPACT_SCREEN_MODE;
            RENDER_PROFILE.allowBloomIdle = false;
            RENDER_PROFILE.skipHdrEnvironment = MOBILE_MODE;
            RENDER_PROFILE.backgroundFrameStride = Math.max(RENDER_PROFILE.backgroundFrameStride, 3);
            RENDER_PROFILE.labelUpdateStrideLow = Math.max(RENDER_PROFILE.labelUpdateStrideLow, 3);
            RENDER_PROFILE.dustSimStrideLow = Math.max(RENDER_PROFILE.dustSimStrideLow, 3);
            RENDER_PROFILE.dustColorStrideLow = Math.max(RENDER_PROFILE.dustColorStrideLow, 8);
            lowEndProfileApplied = true;
        }

        applyLowEndProfileOverrides();
        const runtimePerfState = createRuntimePerfState();
        const {
            clampTextureSize,
            scaleCount,
            scaleSegments,
            getEffectivePixelRatio,
            getEffectiveStarStride,
            getEffectiveComposerScale,
            getEffectiveBackgroundStride
        } = createRenderScalingHelpers({ RENDER_PROFILE, runtimePerfState });

        const {
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
        } = createCoreTextureGenerators({
            THREE,
            MOBILE_MODE,
            RENDER_PROFILE,
            clampTextureSize,
            scaleCount
        });

        function disposeObject3D(object) {
            object.traverse((child) => {
                if (!child.isMesh) return;
                child.geometry?.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach((m) => m?.dispose && m.dispose());
                } else {
                    child.material?.dispose && child.material.dispose();
                }
            });
        }

        const scene = new THREE.Scene();
        const deepSpaceBackdrop = createSpaceBackdropTexture();
        deepSpaceBackdrop.wrapS = THREE.RepeatWrapping;
        deepSpaceBackdrop.wrapT = THREE.ClampToEdgeWrapping;
        deepSpaceBackdrop.minFilter = THREE.LinearMipmapLinearFilter;
        deepSpaceBackdrop.magFilter = THREE.LinearFilter;
        deepSpaceBackdrop.generateMipmaps = true;
        scene.background = new THREE.Color(0x02050e);

        const skyDome = new THREE.Mesh(
            new THREE.SphereGeometry(560, scaleSegments(192, 72), scaleSegments(128, 56)),
            new THREE.MeshBasicMaterial({
                map: deepSpaceBackdrop,
                side: THREE.BackSide,
                depthWrite: false,
                toneMapped: false,
                fog: false
            })
        );
        skyDome.renderOrder = -6;
        skyDome.frustumCulled = false;
        scene.add(skyDome);

        const initialViewportSize = getViewportSize();

        const camera = new THREE.PerspectiveCamera(44, initialViewportSize.width / initialViewportSize.height, 0.1, 1000);
        camera.position.set(0.34, 0.24, 8.9);

        const renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('#bg'),
            antialias: !MOBILE_MODE,
            powerPreference: 'high-performance'
        });
        renderer.setSize(initialViewportSize.width, initialViewportSize.height);
        renderer.setPixelRatio(getEffectivePixelRatio(RENDER_PROFILE.forceLowQuality));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = MOBILE_MODE ? 1.46 : 1.36;
        deepSpaceBackdrop.anisotropy = Math.min(RENDER_PROFILE.anisotropy, renderer.capabilities.getMaxAnisotropy());
        deepSpaceBackdrop.needsUpdate = true;

        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environmentIntensity = 1.32;

        if (!RENDER_PROFILE.skipHdrEnvironment) {
            const rgbeLoader = new RGBELoader();
            rgbeLoader.load(
                'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr',
                (hdrTexture) => {
                    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
                    scene.environment = hdrTexture;
                    scene.environmentIntensity = 1.46;
                    visualBaseState.environmentIntensity = scene.environmentIntensity;
                },
                undefined,
                () => {}
            );
        }

        const composer = new EffectComposer(renderer);
        const renderPass = new RenderPass(scene, camera);
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(initialViewportSize.width, initialViewportSize.height),
            MOBILE_MODE ? 0.34 : 0.42,
            MOBILE_MODE ? 0.68 : 0.76,
            MOBILE_MODE ? 0.71 : 0.68
        );
        bloomPass.threshold = MOBILE_MODE ? 0.71 : 0.67;
        bloomPass.strength = MOBILE_MODE ? 0.34 : 0.42;
        bloomPass.radius = MOBILE_MODE ? 0.68 : 0.76;
        const visualBaseState = {
            toneMappingExposure: renderer.toneMappingExposure,
            bloomStrength: bloomPass.strength,
            bloomRadius: bloomPass.radius,
            environmentIntensity: scene.environmentIntensity,
            chromaticAberration: MOBILE_MODE ? 0.00044 : 0.00055,
            vignetteStrength: MOBILE_MODE ? 0.14 : 0.16
        };
        const smaaPass = new SMAAPass(initialViewportSize.width * renderer.getPixelRatio(), initialViewportSize.height * renderer.getPixelRatio());

        const spaceLensPass = new ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                uAberration: { value: visualBaseState.chromaticAberration },
                uVignette: { value: visualBaseState.vignetteStrength },
                uAspect: { value: initialViewportSize.width / Math.max(initialViewportSize.height, 1) },
                uTime: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float uAberration;
                uniform float uVignette;
                uniform float uAspect;
                uniform float uTime;

                varying vec2 vUv;

                void main() {
                    vec2 centered = vUv - 0.5;
                    centered.x *= uAspect;

                    float radiusSq = dot(centered, centered);
                    float radius = sqrt(radiusSq);
                    vec2 direction = normalize(centered + vec2(0.00001));
                    vec2 aberrationOffset = direction * uAberration * (0.35 + radiusSq * 2.2);

                    vec4 cR = texture2D(tDiffuse, vUv + aberrationOffset);
                    vec4 cG = texture2D(tDiffuse, vUv);
                    vec4 cB = texture2D(tDiffuse, vUv - aberrationOffset);

                    vec3 color = vec3(cR.r, cG.g, cB.b);
                    float pulse = 0.97 + sin(uTime * 0.35) * 0.03;
                    float vignette = smoothstep(1.16, 0.24, radius);
                    float vignetteMix = clamp(uVignette, 0.0, 1.0);
                    color *= mix(1.0, vignette * pulse, vignetteMix);

                    gl_FragColor = vec4(color, cG.a);
                }
            `
        });

        composer.addPass(renderPass);
        composer.addPass(bloomPass);
        composer.addPass(smaaPass);
        composer.addPass(spaceLensPass);

        smaaPass.enabled = RENDER_PROFILE.allowSmaa && !RENDER_PROFILE.forceLowQuality;
        bloomPass.enabled = RENDER_PROFILE.allowBloomIdle;

        const particleSprite = createParticleSpriteTexture();
        const cometTrailTexture = createCometTrailTexture();
        const crystalMicroTexture = createCrystalMicroTexture();
        const sunSurfaceTexture = createSunSurfaceTexture();
        const sunCoronaTexture = createSunCoronaTexture();
        const earthFallbackTexture = createPlanetTexture('earthy', MOBILE_MODE ? 1024 : 2048);
        const earthFallbackRoughness = createPlanetRoughnessTexture(MOBILE_MODE ? 640 : 1024);
        const moonFallbackTexture = createPlanetTexture('dry', MOBILE_MODE ? 640 : 1024);
        const moonFallbackRoughness = createPlanetRoughnessTexture(MOBILE_MODE ? 512 : 768);
        const sceneTextureLoader = new THREE.TextureLoader();
        const maxSceneTextureAnisotropy = Math.max(1, Math.min(RENDER_PROFILE.anisotropy, renderer.capabilities.getMaxAnisotropy()));

        const tempVectorA = new THREE.Vector3();
        const tempVectorB = new THREE.Vector3();
        const tempVectorC = new THREE.Vector3();
        const tempVectorD = new THREE.Vector3();
        const tempVectorE = new THREE.Vector3();
        const tempQuaternion = new THREE.Quaternion();
        const coreScreenUv = new THREE.Vector2(0.5, 0.5);
        const silhouetteBodyColor = new THREE.Color(0x06070b);
        const silhouetteEmissiveColor = new THREE.Color(0x080311);
        const upAxis = new THREE.Vector3(0, 1, 0);
        const forwardAxis = new THREE.Vector3(1, 0, 0);

        const modelStatus = document.getElementById('model-status');
        const loadModelButton = document.getElementById('load-model-btn');
        const modelFileInput = document.getElementById('model-file');
        const sphereLabel = document.getElementById('sphere-label');
        const sphereLabelTitle = document.getElementById('sphere-label-title');
        const sphereLabelSubtitle = document.getElementById('sphere-label-subtitle');
        const sphereLabelRotator = document.getElementById('sphere-label-rotator');
        const cinematicOverlay = document.getElementById('cinematic-overlay');
        const cinematicVignette = document.getElementById('cinematic-vignette');
        const cinematicSpeedCanvas = document.getElementById('cinematic-speed-canvas');
        const cinematicRadialSpeed = document.getElementById('cinematic-radial-speed');
        const cinematicPortalDepth = document.getElementById('cinematic-portal-depth');
        const cinematicPortalMist = document.getElementById('cinematic-portal-mist');
        const cinematicPortalRings = document.getElementById('cinematic-portal-rings');
        const cinematicWarpLeft = document.getElementById('cinematic-warp-left');
        const cinematicWarpRight = document.getElementById('cinematic-warp-right');
        const cinematicLensFlare = document.getElementById('cinematic-lens-flare');
        const cinematicThrustGlow = document.getElementById('cinematic-thrust-glow');
        const cinematicEnergyRipple = document.getElementById('cinematic-energy-ripple');
        const cinematicFlash = document.getElementById('cinematic-flash');
        const cinematicLoadingVeil = document.getElementById('cinematic-loading-veil');
        const transitionLoading = document.getElementById('transition-loading');
        const loadingProgressFill = document.getElementById('loading-progress-fill');
        const loadingProgressText = document.getElementById('loading-progress-text');
        const returnMainButton = document.getElementById('return-main-btn');
        const startupPreloader = document.getElementById('startup-preloader');
        const startupPreloaderFill = document.getElementById('startup-preloader-fill');
        const startupPreloaderText = document.getElementById('startup-preloader-text');
        const crystalClickHint = document.getElementById('crystal-click-hint');
        const sphereLabelSmoothPosition = new THREE.Vector2();
        const crystalClickHintSmoothPosition = new THREE.Vector2();
        let sphereLabelSmoothInitialized = false;
        let sphereLabelWasVisible = false;
        let crystalClickHintInitialized = false;
        let subtitleRotatingController = null;
        const shatterEnabled = true;
        const servicesHash = 'services';
        const storeEntryPath = '/tish-store/';
        const mainSectionBySector = Object.freeze({
            home: 'hero',
            portfolio: 'team',
            works: 'works',
            contact: 'contact'
        });
        const sphereLabelCoreRevealDelay = 1;
        const crystalClickHintRevealDelay = 0.72;
        const cinematicLoadingMessages = [
            'Инициализация космического маршрута...',
            'Стабилизация квантового ядра...',
            'Синхронизация узлов TISH STORE...',
            'Подготовка интерфейса загрузки...'
        ];
        const startupLoadingMessages = [
            'Инициализация орбитальной сцены...',
            'Загрузка кристаллов и планет...',
            'Калибровка света и эффектов...',
            'Финальная синхронизация...'
        ];
        const mainSitePhotoAssets = Object.freeze({
            planetSurfaceMaps: [
                '/favicon.png',
                '/favicon.png',
                '/favicon.png',
                '/favicon.png'
            ],
            storeLabelPhoto: '/favicon.png'
        });
        const SIMPLE_CINEMATIC_MODE = true;

        if (sphereLabel) {
            sphereLabel.style.setProperty('--store-photo-url', `url('${mainSitePhotoAssets.storeLabelPhoto}')`);
        }

        if (SIMPLE_CINEMATIC_MODE) {
            [
                cinematicWarpLeft,
                cinematicWarpRight,
                cinematicSpeedCanvas,
                cinematicRadialSpeed,
                cinematicPortalDepth,
                cinematicPortalMist,
                cinematicPortalRings,
                cinematicLensFlare,
                cinematicThrustGlow,
                cinematicEnergyRipple,
                cinematicLoadingVeil
            ].forEach((element) => {
                if (element) {
                    element.style.display = 'none';
                }
            });

            if (transitionLoading) {
                transitionLoading.style.display = 'none';
                transitionLoading.setAttribute('aria-hidden', 'true');
            }

            cinematicWarpLeft?.remove();
            cinematicWarpRight?.remove();
        }

        const cinematicState = {
            active: false,
            phase: 'idle',
            phaseStart: 0,
            sceneDarken: 0,
            warp: 0,
            flash: 0,
            portalDepth: 0,
            loadingVeil: 0,
            loadingProgress: 0,
            energyPulse: 0,
            silhouette: 0,
            source: 'ядро',
            baseCoreScale: 0.82,
            cameraStartPosition: new THREE.Vector3(),
            cameraStartQuaternion: new THREE.Quaternion(),
            cameraStartFov: camera.fov,
            controlsTargetStart: new THREE.Vector3(),
            shipStart: new THREE.Vector3(),
            shipEnd: new THREE.Vector3(),
            returnStartPosition: new THREE.Vector3(),
            returnStartQuaternion: new THREE.Quaternion(),
            returnStartCoreScale: 1,
            focusLeft: 50,
            focusTop: 50,
            loadingReadyTimestamp: null,
            storeRedirectScheduled: false,
            coreMaterialBase: null,
            shellMaterialBase: null,
            transitionProfile: null
        };

        const startupPreloaderState = {
            active: false,
            startedAt: 0,
            minVisibleMs: 1200,
            maxVisibleMs: 9000,
            pendingTasks: 0,
            completedTasks: 0,
            progress: 0.04,
            firstFrameRendered: false,
            hideTimer: null,
            reason: 'initial'
        };

        function clamp01(value) {
            return THREE.MathUtils.clamp(value, 0, 1);
        }

        function easeOutCubic(t) {
            const x = clamp01(t);
            return 1 - Math.pow(1 - x, 3);
        }

        function easeInOutCubic(t) {
            const x = clamp01(t);
            return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) * 0.5;
        }

        function setStartupPreloaderProgress(progress, elapsedMs = 0) {
            const clamped = clamp01(progress);
            startupPreloaderState.progress = clamped;

            if (startupPreloaderFill) {
                startupPreloaderFill.style.transform = `scaleX(${Math.max(0.04, clamped).toFixed(3)})`;
            }

            if (startupPreloaderText) {
                const index = Math.min(
                    startupLoadingMessages.length - 1,
                    Math.floor(clamped * startupLoadingMessages.length)
                );
                const dotCount = 1 + Math.floor((elapsedMs / 420) % 3);
                startupPreloaderText.textContent = `${startupLoadingMessages[index]}${'.'.repeat(dotCount)}`;
            }
        }

        function hideStartupPreloader() {
            if (!startupPreloaderState.active) return;

            startupPreloaderState.active = false;
            if (startupPreloaderState.hideTimer) {
                window.clearTimeout(startupPreloaderState.hideTimer);
                startupPreloaderState.hideTimer = null;
            }

            if (startupPreloader) {
                startupPreloader.classList.remove('visible');
                startupPreloader.classList.add('hiding');
                startupPreloaderState.hideTimer = window.setTimeout(() => {
                    startupPreloader.classList.remove('hiding');
                    startupPreloader.setAttribute('aria-hidden', 'true');
                    startupPreloaderState.hideTimer = null;
                }, 520);
            }

            document.body.classList.remove('is-startup-loading');
            controls.enabled = true;
            pointerHoverState.dirty = false;
            setStatus('Орбитальная сцена готова.');
        }

        function showStartupPreloader(reason = 'initial', options = {}) {
            const quick = !!options.quick;
            startupPreloaderState.active = true;
            startupPreloaderState.reason = reason;
            startupPreloaderState.startedAt = performance.now();
            startupPreloaderState.minVisibleMs = quick ? 460 : 1200;
            startupPreloaderState.maxVisibleMs = quick ? 2400 : 9000;
            startupPreloaderState.pendingTasks = 0;
            startupPreloaderState.completedTasks = 0;
            startupPreloaderState.firstFrameRendered = false;
            setStartupPreloaderProgress(quick ? 0.08 : 0.04, 0);

            if (startupPreloaderState.hideTimer) {
                window.clearTimeout(startupPreloaderState.hideTimer);
                startupPreloaderState.hideTimer = null;
            }

            if (startupPreloader) {
                startupPreloader.classList.remove('hiding');
                startupPreloader.classList.add('visible');
                startupPreloader.setAttribute('aria-hidden', 'false');
            }

            document.body.classList.add('is-startup-loading');
            controls.enabled = false;
            pointerHoverState.dirty = false;
            setCanvasCursor('default');
            setStatus(reason === 'return' ? 'Возврат к планетам. Подготавливаем сцену...' : 'Инициализация орбитальной сцены...');
        }

        function registerStartupLoadTask() {
            if (!startupPreloaderState.active) {
                return () => {};
            }

            startupPreloaderState.pendingTasks += 1;
            const now = performance.now();
            const elapsed = now - startupPreloaderState.startedAt;
            const knownRatio = startupPreloaderState.pendingTasks > 0
                ? startupPreloaderState.completedTasks / startupPreloaderState.pendingTasks
                : 0;
            const target = 0.08 + knownRatio * 0.72;
            setStartupPreloaderProgress(Math.max(startupPreloaderState.progress, target), elapsed);

            let done = false;
            return () => {
                if (done) return;
                done = true;
                startupPreloaderState.completedTasks += 1;
            };
        }

        function updateStartupPreloader(nowMs) {
            if (!startupPreloaderState.active) return;

            const elapsed = nowMs - startupPreloaderState.startedAt;
            const tasksKnown = startupPreloaderState.pendingTasks > 0;
            const taskRatio = tasksKnown
                ? startupPreloaderState.completedTasks / startupPreloaderState.pendingTasks
                : 0.55;
            const frameRatio = startupPreloaderState.firstFrameRendered ? 1 : 0;
            const timeoutRatio = clamp01(elapsed / startupPreloaderState.maxVisibleMs);
            const target = clamp01(0.08 + taskRatio * 0.7 + frameRatio * 0.16 + timeoutRatio * 0.08);
            const nextProgress = startupPreloaderState.progress + (target - startupPreloaderState.progress) * 0.18;
            setStartupPreloaderProgress(nextProgress, elapsed);

            const tasksReady = !tasksKnown || startupPreloaderState.completedTasks >= startupPreloaderState.pendingTasks;
            const minDelayReady = elapsed >= startupPreloaderState.minVisibleMs;
            const timeoutReached = elapsed >= startupPreloaderState.maxVisibleMs;
            if ((tasksReady && startupPreloaderState.firstFrameRendered && minDelayReady) || timeoutReached) {
                setStartupPreloaderProgress(1, elapsed);
                hideStartupPreloader();
            }
        }

        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                showStartupPreloader('return', { quick: true });
            }
        });

        function createCinematicTransitionProfile(source = 'ядро') {
            const normalizedSource = String(source || '').toLowerCase();
            const launchedFromCta = normalizedSource.includes('кнопка') || normalizedSource.includes('cta');

            if (launchedFromCta) {
                return {
                    clickDuration: 0.52,
                    approachDuration: 2.08,
                    impactDuration: 0.9,
                    returnDuration: 0.84,
                    clickQuatSmoothing: 4.9,
                    approachQuatSmoothing: 5.4,
                    impactQuatSmoothing: 5.8,
                    approachCameraFollowBase: 3.3,
                    approachCameraFollowGain: 0.95,
                    impactCameraFollow: 4.1,
                    impactShipPushBase: 1.1,
                    impactShipPushGain: 2.4,
                    clickShipBobAmplitude: 0.003
                };
            }

            return {
                clickDuration: 0.22,
                approachDuration: 0.86,
                impactDuration: 0.32,
                returnDuration: 0.5,
                clickQuatSmoothing: 8.8,
                approachQuatSmoothing: 9.8,
                impactQuatSmoothing: 13.4,
                approachCameraFollowBase: 6.4,
                approachCameraFollowGain: 2.6,
                impactCameraFollow: 9.2,
                impactShipPushBase: 4.8,
                impactShipPushGain: 13.6,
                clickShipBobAmplitude: 0.018
            };
        }

        const performanceState = {
            frameIndex: 0,
            smoothDelta: 1 / 60,
            lowQuality: RENDER_PROFILE.forceLowQuality,
            pixelRatio: getEffectivePixelRatio(RENDER_PROFILE.forceLowQuality),
            starColorStride: getEffectiveStarStride(RENDER_PROFILE.forceLowQuality),
            slowFrameCounter: 0,
            fastFrameCounter: 0
        };

        const cinematicSpeedFx = {
            context: cinematicSpeedCanvas?.getContext('2d'),
            particles: [],
            width: 0,
            height: 0,
            dpr: 1,
            particleCount: RENDER_PROFILE.forceLowQuality ? RENDER_PROFILE.speedParticlesLow : RENDER_PROFILE.speedParticlesHigh
        };

        function resizeCinematicSpeedCanvas() {
            const context = cinematicSpeedFx.context;
            if (!cinematicSpeedCanvas || !context) return;

            const { width, height } = getViewportSize();
            const dpr = Math.min(performanceState.pixelRatio || 1, 1.5);
            const physicalWidth = Math.floor(width * dpr);
            const physicalHeight = Math.floor(height * dpr);

            if (cinematicSpeedCanvas.width !== physicalWidth || cinematicSpeedCanvas.height !== physicalHeight) {
                cinematicSpeedCanvas.width = physicalWidth;
                cinematicSpeedCanvas.height = physicalHeight;
                cinematicSpeedCanvas.style.width = `${width}px`;
                cinematicSpeedCanvas.style.height = `${height}px`;
            }

            context.setTransform(dpr, 0, 0, dpr, 0, 0);

            cinematicSpeedFx.width = width;
            cinematicSpeedFx.height = height;
            cinematicSpeedFx.dpr = dpr;

            const maxDistance = Math.hypot(width, height) * 0.72;
            if (!cinematicSpeedFx.particles.length) {
                for (let i = 0; i < cinematicSpeedFx.particleCount; i += 1) {
                    cinematicSpeedFx.particles.push(createCinematicSpeedParticle(THREE, maxDistance));
                }
            } else {
                while (cinematicSpeedFx.particles.length < cinematicSpeedFx.particleCount) {
                    cinematicSpeedFx.particles.push(createCinematicSpeedParticle(THREE, maxDistance));
                }
                cinematicSpeedFx.particles.length = cinematicSpeedFx.particleCount;
            }
        }

        function applyPerformanceTier(lowQuality) {
            const nextPixelRatio = getEffectivePixelRatio(lowQuality);
            const nextStarStride = getEffectiveStarStride(lowQuality);
            const nextParticleCount = lowQuality ? RENDER_PROFILE.speedParticlesLow : RENDER_PROFILE.speedParticlesHigh;

            if (
                performanceState.lowQuality === lowQuality
                && Math.abs(performanceState.pixelRatio - nextPixelRatio) < 0.0001
                && performanceState.starColorStride === nextStarStride
                && cinematicSpeedFx.particleCount === nextParticleCount
            ) {
                return;
            }

            performanceState.lowQuality = lowQuality;
            performanceState.pixelRatio = nextPixelRatio;
            performanceState.starColorStride = nextStarStride;
            cinematicSpeedFx.particleCount = nextParticleCount;

            const { width, height } = getViewportSize();
            renderer.setPixelRatio(performanceState.pixelRatio);
            renderer.setSize(width, height, false);
            const composerScale = getEffectiveComposerScale(lowQuality);
            composer.setSize(
                Math.max(1, Math.floor(width * composerScale)),
                Math.max(1, Math.floor(height * composerScale))
            );
            resizeCinematicSpeedCanvas();
        }

        function updatePerformanceTier(deltaTime) {
            if (LOW_END_MODE) {
                if (!performanceState.lowQuality) {
                    applyPerformanceTier(true);
                }
                performanceState.slowFrameCounter = 0;
                performanceState.fastFrameCounter = 0;
                return;
            }

            if (SIMPLE_CINEMATIC_MODE) {
                const staticLowQuality = RENDER_PROFILE.forceLowQuality;
                if (performanceState.lowQuality !== staticLowQuality) {
                    applyPerformanceTier(staticLowQuality);
                }
                performanceState.slowFrameCounter = 0;
                performanceState.fastFrameCounter = 0;
                return;
            }

            performanceState.smoothDelta += (deltaTime - performanceState.smoothDelta) * 0.08;
            const slowFrame = performanceState.smoothDelta > 1 / 49 || deltaTime > 0.03;
            const fastFrame = performanceState.smoothDelta < 1 / 60 && deltaTime < 0.019;

            if (slowFrame) {
                performanceState.slowFrameCounter += 1;
                performanceState.fastFrameCounter = Math.max(0, performanceState.fastFrameCounter - 3);
            } else if (fastFrame) {
                performanceState.fastFrameCounter += 1;
                performanceState.slowFrameCounter = Math.max(0, performanceState.slowFrameCounter - 1);
            } else {
                performanceState.slowFrameCounter = Math.max(0, performanceState.slowFrameCounter - 1);
                performanceState.fastFrameCounter = Math.max(0, performanceState.fastFrameCounter - 1);
            }

            if (!performanceState.lowQuality && performanceState.slowFrameCounter >= 18) {
                applyPerformanceTier(true);
                performanceState.slowFrameCounter = 0;
                performanceState.fastFrameCounter = 0;
            } else if (performanceState.lowQuality && performanceState.fastFrameCounter >= 60 && !RENDER_PROFILE.forceLowQuality) {
                applyPerformanceTier(false);
                performanceState.slowFrameCounter = 0;
                performanceState.fastFrameCounter = 0;
            }
        }

        function updateRuntimePerf(deltaTime) {
            if (!MOBILE_MODE || !RENDER_PROFILE.allowUltraLow || cinematicState.active) {
                return;
            }

            const slowFrame = deltaTime > 0.036;
            const fastFrame = deltaTime < 0.023;

            if (slowFrame) {
                runtimePerfState.slowFrames += 1;
                runtimePerfState.fastFrames = Math.max(0, runtimePerfState.fastFrames - 2);
            } else if (fastFrame) {
                runtimePerfState.fastFrames += 1;
                runtimePerfState.slowFrames = Math.max(0, runtimePerfState.slowFrames - 1);
            } else {
                runtimePerfState.slowFrames = Math.max(0, runtimePerfState.slowFrames - 1);
                runtimePerfState.fastFrames = Math.max(0, runtimePerfState.fastFrames - 1);
            }

            if (!runtimePerfState.ultraLow && runtimePerfState.slowFrames >= 10) {
                runtimePerfState.ultraLow = true;
                runtimePerfState.slowFrames = 0;
                runtimePerfState.fastFrames = 0;
                applyPerformanceTier(performanceState.lowQuality);
            } else if (runtimePerfState.ultraLow && runtimePerfState.fastFrames >= 90) {
                runtimePerfState.ultraLow = false;
                runtimePerfState.slowFrames = 0;
                runtimePerfState.fastFrames = 0;
                applyPerformanceTier(performanceState.lowQuality);
            }
        }

        function getCoreScreenUv(targetUv = coreScreenUv) {
            targetUv.set(0.5, 0.5);

            if (!shatterState.coreGroup) {
                return targetUv;
            }

            shatterState.coreGroup.getWorldPosition(tempVectorD);
            tempVectorD.project(camera);

            if (!Number.isFinite(tempVectorD.x) || !Number.isFinite(tempVectorD.y)) {
                return targetUv;
            }

            targetUv.set(
                THREE.MathUtils.clamp((tempVectorD.x + 1) * 0.5, 0.08, 0.92),
                THREE.MathUtils.clamp((1 - tempVectorD.y) * 0.5, 0.1, 0.9)
            );
            return targetUv;
        }

        function updateCinematicSpeedCanvas(elapsedTime, deltaTime, warp, flash) {
            const context = cinematicSpeedFx.context;
            if (!cinematicSpeedCanvas || !context) {
                return;
            }

            if (SIMPLE_CINEMATIC_MODE) {
                const { width, height } = getViewportSize();
                context.clearRect(0, 0, cinematicSpeedFx.width || width, cinematicSpeedFx.height || height);
                return;
            }

            if (performanceState.lowQuality && performanceState.frameIndex % 2 !== 0) {
                return;
            }

            const { width: viewportWidth, height: viewportHeight } = getViewportSize();
            if (
                cinematicSpeedFx.width !== viewportWidth
                || cinematicSpeedFx.height !== viewportHeight
                || !cinematicSpeedFx.particles.length
            ) {
                resizeCinematicSpeedCanvas();
            }

            const width = cinematicSpeedFx.width;
            const height = cinematicSpeedFx.height;
            context.clearRect(0, 0, width, height);

            const warpAmount = clamp01(warp);
            if (warpAmount < 0.02) {
                return;
            }

            const flashAmount = clamp01(flash);
            // Reuse already-cached UV — avoids project(camera) call every frame
            const uv = coreScreenUv;
            const centerX = uv.x * width;
            const centerY = uv.y * height;
            const maxDistance = Math.hypot(width, height) * 0.72;
            const speedFactor = 190 + warpAmount * 520;

            // Precompute per-frame sin values once outside the loop
            const hueShift = Math.sin(elapsedTime * 0.74) * 9 + flashAmount * 10;

            context.globalCompositeOperation = 'lighter';

            for (let index = 0; index < cinematicSpeedFx.particles.length; index += 1) {
                const particle = cinematicSpeedFx.particles[index];
                particle.distance += particle.speed * deltaTime * speedFactor;
                // No angle jitter — straight streaks are cheaper and look clean

                if (particle.distance > maxDistance) {
                    resetCinematicSpeedParticle(THREE, particle, maxDistance, true);
                }

                const distanceRatio = clamp01(particle.distance / maxDistance);
                const directionX = Math.cos(particle.angle);
                const directionY = Math.sin(particle.angle);
                const startDistance = particle.distance * (0.12 + warpAmount * 0.24);
                const streakLength = particle.length * (0.42 + warpAmount * 1.58) + distanceRatio * 62 * warpAmount;
                const x1 = centerX + directionX * startDistance;
                const y1 = centerY + directionY * startDistance;
                const x2 = centerX + directionX * (startDistance + streakLength);
                const y2 = centerY + directionY * (startDistance + streakLength);
                const alpha = clamp01((0.09 + distanceRatio * 0.95) * warpAmount * (0.64 + flashAmount * 0.46));

                if (alpha <= 0.01) continue;

                const hue = 210 + particle.tint * 48 + hueShift;
                const lightness = 70 + warpAmount * 17 + flashAmount * 10;

                context.strokeStyle = `hsla(${hue.toFixed(1)}, 100%, ${lightness.toFixed(1)}%, ${alpha.toFixed(3)})`;
                context.lineWidth = particle.width * (0.72 + warpAmount * 1.68);
                context.beginPath();
                context.moveTo(x1, y1);
                context.lineTo(x2, y2);
                context.stroke();
            }

            const glowRadius = 120 + warpAmount * 230;
            const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
            glow.addColorStop(0, `rgba(244, 235, 255, ${(0.18 + flashAmount * 0.2).toFixed(3)})`);
            glow.addColorStop(0.3, `rgba(188, 128, 255, ${(0.14 + warpAmount * 0.22).toFixed(3)})`);
            glow.addColorStop(1, 'rgba(113, 79, 208, 0)');
            context.fillStyle = glow;
            context.beginPath();
            context.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
            context.fill();

            context.globalCompositeOperation = 'source-over';
        }

        applyPerformanceTier(RENDER_PROFILE.forceLowQuality);

        function setLoadingProgress(progress, elapsedTime = 0) {
            const clamped = clamp01(progress);
            const visualProgress = Math.max(0.06, clamped);
            loadingProgressFill.style.transform = `scaleX(${visualProgress.toFixed(3)})`;

            const index = Math.min(
                cinematicLoadingMessages.length - 1,
                Math.floor(clamped * cinematicLoadingMessages.length)
            );
            const dotCount = 1 + Math.floor((elapsedTime * 2.7) % 3);
            const dots = '.'.repeat(dotCount);
            loadingProgressText.textContent = `${cinematicLoadingMessages[index]}${dots}`;
        }

        function setCinematicOverlayVisuals(sceneDarken, warp, flash) {
            const darken = clamp01(sceneDarken);
            const warpAmount = clamp01(warp);
            const flashAmount = clamp01(flash);
            const portalDepth = clamp01(cinematicState.portalDepth);
            const loadingVeil = clamp01(cinematicState.loadingVeil);
            const warpShift = 5 + warpAmount * 16;
            const warpStretch = 1 + warpAmount * 0.14;

            const focusUv = getCoreScreenUv(coreScreenUv);
            const targetFocusLeft = focusUv.x * 100;
            const targetFocusTop = focusUv.y * 100;
            cinematicState.focusLeft += (targetFocusLeft - cinematicState.focusLeft) * 0.22;
            cinematicState.focusTop += (targetFocusTop - cinematicState.focusTop) * 0.22;
            cinematicOverlay.style.setProperty('--core-focus-left', `${cinematicState.focusLeft.toFixed(2)}%`);
            cinematicOverlay.style.setProperty('--core-focus-top', `${cinematicState.focusTop.toFixed(2)}%`);

            if (SIMPLE_CINEMATIC_MODE) {
                cinematicVignette.style.opacity = (darken * 0.06).toFixed(3);
                cinematicFlash.style.opacity = (flashAmount * 0.36).toFixed(3);
                cinematicFlash.style.transform = `translate(-50%, -50%) scale(${(0.84 + flashAmount * 0.16).toFixed(3)})`;

                cinematicSpeedCanvas.style.opacity = '0';
                cinematicRadialSpeed.style.opacity = '0';
                cinematicPortalDepth.style.opacity = '0';
                cinematicPortalMist.style.opacity = '0';
                cinematicPortalRings.style.opacity = '0';
                cinematicWarpLeft.style.opacity = '0';
                cinematicWarpRight.style.opacity = '0';
                cinematicLensFlare.style.opacity = '0';
                cinematicThrustGlow.style.opacity = '0';
                cinematicEnergyRipple.style.opacity = '0';
                cinematicLoadingVeil.style.opacity = '0';
                return;
            }

            cinematicVignette.style.opacity = (0.05 + darken * 0.4).toFixed(3);
            cinematicSpeedCanvas.style.opacity = clamp01(warpAmount * 0.9 + flashAmount * 0.16).toFixed(3);
            cinematicRadialSpeed.style.opacity = '0';

            cinematicPortalDepth.style.opacity = clamp01(portalDepth * 0.82 + flashAmount * 0.18).toFixed(3);
            cinematicPortalMist.style.opacity = clamp01((portalDepth * 0.66 + warpAmount * 0.22) * 0.62).toFixed(3);
            cinematicPortalRings.style.opacity = clamp01((portalDepth * 0.84 + flashAmount * 0.2) * 0.72).toFixed(3);
            cinematicWarpLeft.style.opacity = (warpAmount * 0.56).toFixed(3);
            cinematicWarpRight.style.opacity = (warpAmount * 0.56).toFixed(3);
            cinematicLensFlare.style.opacity = (lensStrength * 0.68).toFixed(3);
            cinematicThrustGlow.style.opacity = (thrustStrength * 0.66).toFixed(3);
            cinematicEnergyRipple.style.opacity = (rippleOpacity * 0.56).toFixed(3);
            cinematicLoadingVeil.style.opacity = loadingVeil.toFixed(3);

            cinematicPortalDepth.style.transform = `translate(-50%, -50%) scale(${(0.68 + portalDepth * 0.84 + flashAmount * 0.12).toFixed(3)})`;
            cinematicPortalMist.style.transform = `translate(-50%, -50%) scale(${(0.74 + portalDepth * 0.76).toFixed(3)})`;
            cinematicPortalRings.style.transform = `translate(-50%, -50%) scale(${(0.78 + portalDepth * 0.78 + flashAmount * 0.1).toFixed(3)})`;
            cinematicWarpLeft.style.transform = `translateX(${-warpShift.toFixed(1)}px) scaleY(${warpStretch.toFixed(3)})`;
            cinematicWarpRight.style.transform = `translateX(${warpShift.toFixed(1)}px) scaleY(${warpStretch.toFixed(3)})`;
            cinematicLensFlare.style.transform = `translate(-50%, -50%) scale(${(0.86 + warpAmount * 0.34 + flashAmount * 0.2).toFixed(3)})`;
            cinematicThrustGlow.style.transform = `translateX(-50%) scale(${(0.76 + warpAmount * 0.5 + flashAmount * 0.1).toFixed(3)})`;
            cinematicEnergyRipple.style.transform = `translate(-50%, -50%) scale(${(0.28 + ripple * 2.4).toFixed(3)})`;
            cinematicLoadingVeil.style.transform = `translate(-50%, -50%) scale(${(0.94 + loadingVeil * 0.28).toFixed(3)})`;

            cinematicFlash.style.opacity = (flashAmount * 0.56).toFixed(3);
            cinematicFlash.style.transform = `translate(-50%, -50%) scale(${(0.72 + flashAmount * 0.34).toFixed(3)})`;
        }

        function applyCinematicTone(sceneDarken, warp) {
            const darken = clamp01(sceneDarken);
            const warpAmount = clamp01(warp);
            const portalDepth = clamp01(cinematicState.portalDepth);
            const flashAmount = clamp01(cinematicState.flash);

            if (SIMPLE_CINEMATIC_MODE) {
                const quickEnergy = clamp01(warpAmount * 0.58 + flashAmount * 0.42);
                renderer.toneMappingExposure = visualBaseState.toneMappingExposure + flashAmount * 0.04;
                bloomPass.strength = THREE.MathUtils.lerp(visualBaseState.bloomStrength, visualBaseState.bloomStrength * 1.04, quickEnergy);
                bloomPass.radius = THREE.MathUtils.lerp(visualBaseState.bloomRadius, 0.9, warpAmount * 0.55);
                spaceLensPass.uniforms.uAberration.value = THREE.MathUtils.lerp(
                    visualBaseState.chromaticAberration,
                    0.00125,
                    quickEnergy
                );
                spaceLensPass.uniforms.uVignette.value = THREE.MathUtils.lerp(
                    visualBaseState.vignetteStrength,
                    0.29,
                    darken * 0.42 + quickEnergy * 0.2
                );
                scene.environmentIntensity = visualBaseState.environmentIntensity;
                return;
            }

            const bloomFactor = Math.max(warpAmount * 0.82, darken * 0.72, portalDepth * 0.88);
            const flashLift = flashAmount * 0.1;

            renderer.toneMappingExposure =
                THREE.MathUtils.lerp(
                    visualBaseState.toneMappingExposure,
                    visualBaseState.toneMappingExposure * 0.88,
                    darken * 0.8
                ) + flashLift + warpAmount * 0.025;

            bloomPass.strength = THREE.MathUtils.lerp(visualBaseState.bloomStrength, 0.94, bloomFactor) + flashAmount * 0.08;
            bloomPass.radius = THREE.MathUtils.lerp(visualBaseState.bloomRadius, 0.8, Math.max(warpAmount * 0.68, portalDepth * 0.84));
            spaceLensPass.uniforms.uAberration.value = THREE.MathUtils.lerp(
                visualBaseState.chromaticAberration,
                0.0021,
                Math.max(warpAmount * 0.85, flashAmount * 0.72, darken * 0.38)
            );
            spaceLensPass.uniforms.uVignette.value = THREE.MathUtils.lerp(
                visualBaseState.vignetteStrength,
                0.46,
                Math.max(darken * 0.82, portalDepth * 0.58)
            );
            scene.environmentIntensity = THREE.MathUtils.lerp(
                visualBaseState.environmentIntensity,
                visualBaseState.environmentIntensity * 0.76,
                darken * 0.76
            );
        }

        function captureCoreMaterialBase() {
            const coreMaterial = shatterState.coreGroup?.userData?.core?.material;
            const shellMaterial = shatterState.coreGroup?.userData?.shell?.material;

            if (coreMaterial && !cinematicState.coreMaterialBase) {
                cinematicState.coreMaterialBase = {
                    transmission: coreMaterial.transmission ?? 0,
                    roughness: coreMaterial.roughness ?? 0.1,
                    envMapIntensity: coreMaterial.envMapIntensity ?? 1,
                    opacity: coreMaterial.opacity ?? 1,
                    thickness: coreMaterial.thickness ?? 1,
                    clearcoat: coreMaterial.clearcoat ?? 0,
                    emissiveIntensity: coreMaterial.emissiveIntensity ?? 1
                };
            }

            if (shellMaterial && !cinematicState.shellMaterialBase) {
                cinematicState.shellMaterialBase = {
                    transmission: shellMaterial.transmission ?? 0,
                    roughness: shellMaterial.roughness ?? 0.1,
                    envMapIntensity: shellMaterial.envMapIntensity ?? 1,
                    opacity: shellMaterial.opacity ?? 1,
                    thickness: shellMaterial.thickness ?? 1,
                    clearcoat: shellMaterial.clearcoat ?? 0
                };
            }
        }

        function tuneCoreCinematicMaterial(strength) {
            const amount = clamp01(strength);
            const coreMaterial = shatterState.coreGroup?.userData?.core?.material;
            const shellMaterial = shatterState.coreGroup?.userData?.shell?.material;

            captureCoreMaterialBase();

            if (coreMaterial && cinematicState.coreMaterialBase) {
                const base = cinematicState.coreMaterialBase;
                coreMaterial.transmission = THREE.MathUtils.lerp(base.transmission, 0.3, amount);
                coreMaterial.roughness = THREE.MathUtils.lerp(base.roughness, 0.34, amount);
                coreMaterial.envMapIntensity = THREE.MathUtils.lerp(base.envMapIntensity, 0.48, amount);
                coreMaterial.opacity = THREE.MathUtils.lerp(base.opacity, 0.88, amount);
                coreMaterial.thickness = THREE.MathUtils.lerp(base.thickness, 0.52, amount);
                coreMaterial.clearcoat = THREE.MathUtils.lerp(base.clearcoat, 0.24, amount);
            }

            if (shellMaterial && cinematicState.shellMaterialBase) {
                const base = cinematicState.shellMaterialBase;
                shellMaterial.transmission = THREE.MathUtils.lerp(base.transmission, 0.24, amount);
                shellMaterial.roughness = THREE.MathUtils.lerp(base.roughness, 0.38, amount);
                shellMaterial.envMapIntensity = THREE.MathUtils.lerp(base.envMapIntensity, 0.34, amount);
                shellMaterial.opacity = THREE.MathUtils.lerp(base.opacity, 0.2, amount);
                shellMaterial.thickness = THREE.MathUtils.lerp(base.thickness, 0.32, amount);
                shellMaterial.clearcoat = THREE.MathUtils.lerp(base.clearcoat, 0.18, amount);
            }
        }

        function restoreCoreCinematicMaterial() {
            const coreMaterial = shatterState.coreGroup?.userData?.core?.material;
            const shellMaterial = shatterState.coreGroup?.userData?.shell?.material;

            if (coreMaterial && cinematicState.coreMaterialBase) {
                const base = cinematicState.coreMaterialBase;
                coreMaterial.transmission = base.transmission;
                coreMaterial.roughness = base.roughness;
                coreMaterial.envMapIntensity = base.envMapIntensity;
                coreMaterial.opacity = base.opacity;
                coreMaterial.thickness = base.thickness;
                coreMaterial.clearcoat = base.clearcoat;
                coreMaterial.emissiveIntensity = base.emissiveIntensity;
            }

            if (shellMaterial && cinematicState.shellMaterialBase) {
                const base = cinematicState.shellMaterialBase;
                shellMaterial.transmission = base.transmission;
                shellMaterial.roughness = base.roughness;
                shellMaterial.envMapIntensity = base.envMapIntensity;
                shellMaterial.opacity = base.opacity;
                shellMaterial.thickness = base.thickness;
                shellMaterial.clearcoat = base.clearcoat;
            }
        }

        function finishCinematicTransition() {
            cinematicState.active = false;
            cinematicState.phase = 'idle';
            cinematicState.sceneDarken = 0;
            cinematicState.warp = 0;
            cinematicState.flash = 0;
            cinematicState.portalDepth = 0;
            cinematicState.loadingVeil = 0;
            cinematicState.loadingProgress = 0;
            cinematicState.energyPulse = 0;
            cinematicState.silhouette = 0;
            cinematicState.loadingReadyTimestamp = null;
            cinematicState.storeRedirectScheduled = false;
            setShipSilhouette(0);
            setShipTrailStrength(0, previousElapsedTime);
            shipModelMount.scale.setScalar(1);
            restoreCoreCinematicMaterial();

            document.body.classList.remove('is-cinematic-active', 'is-loading-screen');
            cinematicOverlay.classList.remove('visible');
            transitionLoading.classList.remove('visible');
            transitionLoading.setAttribute('aria-hidden', 'true');
            cinematicOverlay.style.opacity = '0';
            transitionLoading.style.opacity = '0';
            cinematicVignette.style.opacity = '0';
            cinematicFlash.style.opacity = '0';
            setLoadingProgress(0.08, 0);

            if (shatterState.coreGroup) {
                shatterState.coreGroup.scale.setScalar(cinematicState.baseCoreScale);
            }

            shipAnchor.visible = false;
            controls.enabled = true;
            controls.target.copy(cinematicState.controlsTargetStart);
            camera.position.copy(cinematicState.cameraStartPosition);
            camera.quaternion.copy(cinematicState.cameraStartQuaternion);
            camera.fov = cinematicState.cameraStartFov;
            camera.updateProjectionMatrix();

            renderer.toneMappingExposure = visualBaseState.toneMappingExposure;
            bloomPass.strength = visualBaseState.bloomStrength;
            bloomPass.radius = visualBaseState.bloomRadius;
            scene.environmentIntensity = visualBaseState.environmentIntensity;
            disableImmediateSphereLabelMode();
            applyPerformanceTier(RENDER_PROFILE.forceLowQuality);
            performanceState.slowFrameCounter = 0;
            performanceState.fastFrameCounter = 0;
            smaaPass.enabled = true;
            bloomPass.enabled = true;
            cinematicOverlay.style.setProperty('--core-focus-left', '50%');
            cinematicOverlay.style.setProperty('--core-focus-top', '50%');
            setCanvasCursor('default');

            controls.update();
            setStatus('Возврат на главный экран завершен.');
        }

        function enterLoadingScreen() {
            cinematicState.phase = 'loading';
            cinematicState.phaseStart = previousElapsedTime;
            cinematicState.sceneDarken = 0.02;
            cinematicState.warp = 0.08;
            cinematicState.flash = 0.12;
            cinematicState.portalDepth = 1;
            cinematicState.loadingVeil = 0.3;
            cinematicState.loadingProgress = 0.08;
            cinematicState.energyPulse = 1;
            cinematicState.silhouette = 1;
            cinematicState.loadingReadyTimestamp = null;
            cinematicState.storeRedirectScheduled = false;

            document.body.classList.add('is-loading-screen');
            transitionLoading.style.removeProperty('opacity');
            transitionLoading.classList.add('visible');
            transitionLoading.setAttribute('aria-hidden', 'false');
            shipAnchor.visible = false;
            setShipSilhouette(0);
            setShipTrailStrength(0, previousElapsedTime);

            setLoadingProgress(cinematicState.loadingProgress, previousElapsedTime);
            setStatus('TISH STORE загружается...');
        }

        function beginReturnToMainScreen() {
            if (!cinematicState.active || cinematicState.phase !== 'loading') return;

            cinematicState.phase = 'return';
            cinematicState.phaseStart = previousElapsedTime;
            cinematicState.loadingVeil = 0;
            cinematicState.loadingReadyTimestamp = null;
            cinematicState.storeRedirectScheduled = false;
            cinematicState.returnStartPosition.copy(camera.position);
            cinematicState.returnStartQuaternion.copy(camera.quaternion);
            cinematicState.returnStartCoreScale = shatterState.coreGroup?.scale?.x ?? cinematicState.baseCoreScale;

            document.body.classList.remove('is-loading-screen');
            transitionLoading.classList.remove('visible');
            transitionLoading.setAttribute('aria-hidden', 'true');
            setStatus('Плавный возврат к главной сцене...');
        }

        function startCoreCinematicTransition(source = 'ядро') {
            if (cinematicState.active || !shatterState.coreGroup) return;
            if (!shipState.root) {
                setShipModel(createFallbackShip({ THREE, scaleSegments }), []);
            }

            clearTransientShatterDebris();

            captureCoreMaterialBase();

            cinematicState.active = true;
            cinematicState.phase = 'click';
            cinematicState.phaseStart = previousElapsedTime;
            cinematicState.sceneDarken = 0.06;
            cinematicState.warp = 0.04;
            cinematicState.flash = 0.03;
            cinematicState.portalDepth = 0.18;
            cinematicState.loadingVeil = 0;
            cinematicState.loadingProgress = 0;
            cinematicState.energyPulse = 0;
            cinematicState.silhouette = 0;
            cinematicState.source = source;
            cinematicState.baseCoreScale = shatterState.coreGroup.scale.x || 0.82;
            cinematicState.transitionProfile = createCinematicTransitionProfile(source);
            cinematicState.focusLeft = 50;
            cinematicState.focusTop = 50;

            cinematicState.cameraStartPosition.copy(camera.position);
            cinematicState.cameraStartQuaternion.copy(camera.quaternion);
            cinematicState.cameraStartFov = camera.fov;
            cinematicState.controlsTargetStart.copy(controls.target);

            const corePosition = shatterState.coreGroup.getWorldPosition(tempVectorA);
            const cameraToCore = tempVectorB.copy(corePosition).sub(camera.position).normalize();
            const right = tempVectorC.copy(cameraToCore).cross(upAxis);
            if (right.lengthSq() < 1e-5) {
                right.set(1, 0, 0);
            } else {
                right.normalize();
            }

            cinematicState.shipStart
                .copy(camera.position)
                .addScaledVector(cameraToCore, 1.9)
                .addScaledVector(upAxis, -0.78)
                .addScaledVector(right, 0.02);

            cinematicState.shipEnd
                .copy(corePosition)
                .addScaledVector(cameraToCore, 1.26)
                .addScaledVector(upAxis, 0.06);

            shipAnchor.visible = true;
            setShipSilhouette(0);
            shipModelMount.scale.setScalar(1.16);
            setShipTrailStrength(0.56, previousElapsedTime);
            shipPivot.position.copy(cinematicState.shipStart);
            tempVectorD.copy(corePosition).sub(shipPivot.position).normalize();
            shipPivot.quaternion.copy(tempQuaternion.setFromUnitVectors(forwardAxis, tempVectorD));
            shipTrailPivot.position.copy(shipPivot.position).addScaledVector(upAxis, -0.02);
            shipTrailPivot.quaternion.copy(shipPivot.quaternion);

            if (shipState.engineLights[0]) shipState.engineLights[0].intensity = 1.98;
            if (shipState.engineLights[1]) shipState.engineLights[1].intensity = 1.82;
            if (shatterState.coreGroup.userData?.core?.material) {
                shatterState.coreGroup.userData.core.material.emissiveIntensity = 1.62;
            }

            controls.enabled = false;
            controls.autoRotate = false;

            cinematicOverlay.style.removeProperty('opacity');
            transitionLoading.style.removeProperty('opacity');
            cinematicOverlay.classList.add('visible');
            document.body.classList.add('is-cinematic-active');
            document.body.classList.remove('is-loading-screen');
            transitionLoading.classList.remove('visible');
            transitionLoading.setAttribute('aria-hidden', 'true');

            setStatus(`Ядро резонирует (${source})...`);
        }

        function enforceCameraShipClearance(shipForwardDirection, minDistance, verticalLift = 0) {
            const offset = tempVectorE.copy(camera.position).sub(shipPivot.position);
            const minDistanceSq = minDistance * minDistance;

            if (offset.lengthSq() >= minDistanceSq) {
                return;
            }

            if (offset.lengthSq() < 1e-6) {
                offset.copy(shipForwardDirection).multiplyScalar(-1);
            } else {
                offset.normalize();
            }

            camera.position
                .copy(shipPivot.position)
                .addScaledVector(offset, minDistance)
                .addScaledVector(upAxis, verticalLift);
        }

        function completeCinematicRedirect(source = 'финал кинематики') {
            if (cinematicState.storeRedirectScheduled) {
                return;
            }

            cinematicState.storeRedirectScheduled = true;
            cinematicState.active = false;
            shipAnchor.visible = false;
            document.body.classList.remove('is-cinematic-active', 'is-loading-screen');
            cinematicOverlay.classList.remove('visible');
            cinematicOverlay.style.opacity = '0';
            transitionLoading.classList.remove('visible');
            transitionLoading.setAttribute('aria-hidden', 'true');
            redirectToStoreLoading(source);
        }

        function updateCinematicTransition(elapsedTime, deltaTime) {
            if (!cinematicState.active || !shatterState.coreGroup) {
                return;
            }

            const stableDelta = THREE.MathUtils.clamp(deltaTime, 1 / 240, 1 / 30);

            const corePosition = shatterState.coreGroup.getWorldPosition(tempVectorA);
            const transitionProfile = cinematicState.transitionProfile || createCinematicTransitionProfile(cinematicState.source);
            const clickDuration = transitionProfile.clickDuration;
            const approachDuration = transitionProfile.approachDuration;
            const impactDuration = transitionProfile.impactDuration;
            const returnDuration = transitionProfile.returnDuration;

            if (cinematicState.phase === 'click') {
                const t = clamp01((elapsedTime - cinematicState.phaseStart) / clickDuration);
                const eased = easeInOutCubic(t);

                tempVectorB.copy(corePosition).sub(cinematicState.shipStart).normalize();
                shipPivot.position.copy(cinematicState.shipStart);
                shipPivot.position.y += Math.sin(elapsedTime * 6.2) * (1 - t) * transitionProfile.clickShipBobAmplitude;
                tempQuaternion.setFromUnitVectors(forwardAxis, tempVectorB);
                shipPivot.quaternion.slerp(tempQuaternion, 1 - Math.exp(-stableDelta * transitionProfile.clickQuatSmoothing));

                shipTrailPivot.position.copy(shipPivot.position).addScaledVector(upAxis, -0.02);
                shipTrailPivot.quaternion.copy(shipPivot.quaternion);
                shipModelMount.rotation.set(elapsedTime * 0.38, 0, Math.sin(elapsedTime * 4.2) * 0.018);
                shipModelMount.scale.setScalar(THREE.MathUtils.lerp(1.16, 1.11, eased));
                setShipTrailStrength(0.56 + Math.sin(elapsedTime * 8.4) * 0.06, elapsedTime);

                if (shipState.engineLights[0]) shipState.engineLights[0].intensity = 1.98 + Math.sin(elapsedTime * 8.4) * 0.18;
                if (shipState.engineLights[1]) shipState.engineLights[1].intensity = 1.82 + Math.cos(elapsedTime * 8) * 0.16;

                tempVectorC.copy(shipPivot.position).addScaledVector(tempVectorB, -2.25).addScaledVector(upAxis, 0.28);
                tempVectorD.copy(cinematicState.cameraStartPosition).lerp(tempVectorC, eased);
                camera.position.copy(tempVectorD);

                tempVectorC.copy(shipPivot.position).lerp(corePosition, 0.5);
                tempVectorD.copy(cinematicState.controlsTargetStart).lerp(tempVectorC, eased);
                camera.lookAt(tempVectorD);
                camera.fov = THREE.MathUtils.lerp(cinematicState.cameraStartFov, cinematicState.cameraStartFov - 0.9, eased);
                camera.updateProjectionMatrix();

                const pulse = 1 + Math.sin(elapsedTime * 12.8) * (0.055 + (1 - t) * 0.035);
                const clickScale = THREE.MathUtils.lerp(cinematicState.baseCoreScale * 1.02, cinematicState.baseCoreScale * 1.14, eased);
                shatterState.coreGroup.scale.setScalar(clickScale * pulse);
                tuneCoreCinematicMaterial(THREE.MathUtils.lerp(0.22, 0.34, eased));

                cinematicState.sceneDarken = THREE.MathUtils.lerp(0.01, 0.05, eased);
                cinematicState.warp = THREE.MathUtils.lerp(0.04, 0.18, eased);
                cinematicState.portalDepth = THREE.MathUtils.lerp(0.14, 0.3, eased);
                cinematicState.flash = 0.03 + Math.sin(elapsedTime * 10.8) * 0.008;
                cinematicState.loadingVeil = 0;
                cinematicState.energyPulse = t;
                cinematicState.silhouette = 0;
                setShipSilhouette(0);

                if (t >= 1) {
                    cinematicState.phase = 'approach';
                    cinematicState.phaseStart = elapsedTime;
                    cinematicState.energyPulse = 0;
                    setStatus('Полет к ядру запущен...');
                }
            } else if (cinematicState.phase === 'approach') {
                const t = clamp01((elapsedTime - cinematicState.phaseStart) / approachDuration);
                const flight = easeInOutCubic(clamp01((t - 0.02) / 0.98));

                shipPivot.position.copy(cinematicState.shipStart).lerp(cinematicState.shipEnd, flight);

                tempVectorB.copy(corePosition).sub(shipPivot.position).normalize();
                tempQuaternion.setFromUnitVectors(forwardAxis, tempVectorB);
                shipPivot.quaternion.slerp(tempQuaternion, 1 - Math.exp(-stableDelta * transitionProfile.approachQuatSmoothing));

                shipTrailPivot.position.copy(shipPivot.position).addScaledVector(upAxis, -0.02);
                shipTrailPivot.quaternion.copy(shipPivot.quaternion);
                shipModelMount.rotation.set(elapsedTime * 0.62, 0, 0);
                shipModelMount.scale.setScalar(THREE.MathUtils.lerp(1.11, 0.98, flight));
                shipState.engineLights[0]?.position.set(-0.16, 0, 0.36);
                shipState.engineLights[1]?.position.set(0.16, 0, 0.36);
                const approachSilhouette = clamp01((flight - 0.88) / 0.12) * 0.26;
                cinematicState.silhouette = approachSilhouette;
                setShipSilhouette(approachSilhouette);
                const approachEngineFade = 1 - approachSilhouette * 0.58;
                if (shipState.engineLights[0]) {
                    shipState.engineLights[0].intensity = (1.92 + Math.sin(elapsedTime * 10.4) * 0.34) * approachEngineFade;
                }
                if (shipState.engineLights[1]) {
                    shipState.engineLights[1].intensity = (1.76 + Math.cos(elapsedTime * 9.8) * 0.32) * approachEngineFade;
                }
                setShipTrailStrength(THREE.MathUtils.lerp(0.68, 0.96, flight), elapsedTime);

                tempVectorD.copy(tempVectorB).cross(upAxis);
                if (tempVectorD.lengthSq() > 1e-5) {
                    tempVectorD.normalize();
                } else {
                    tempVectorD.set(1, 0, 0);
                }

                const cameraDistance = THREE.MathUtils.lerp(2.7, 1.82, flight);
                const cameraHeight = THREE.MathUtils.lerp(0.3, 0.18, flight);
                tempVectorC
                    .copy(shipPivot.position)
                    .addScaledVector(tempVectorB, -cameraDistance)
                    .addScaledVector(upAxis, cameraHeight);

                camera.position.lerp(
                    tempVectorC,
                    1 - Math.exp(-stableDelta * (transitionProfile.approachCameraFollowBase + flight * transitionProfile.approachCameraFollowGain))
                );
                enforceCameraShipClearance(tempVectorB, THREE.MathUtils.lerp(1.62, 1.34, flight), 0.03);
                camera.lookAt(tempVectorA.copy(shipPivot.position).lerp(corePosition, 0.84));
                camera.fov = THREE.MathUtils.lerp(cinematicState.cameraStartFov - 0.8, cinematicState.cameraStartFov - 6.8, flight);
                camera.updateProjectionMatrix();

                const approachScale = THREE.MathUtils.lerp(cinematicState.baseCoreScale * 1.1, cinematicState.baseCoreScale * 2.05, flight);
                shatterState.coreGroup.scale.setScalar(approachScale);
                tuneCoreCinematicMaterial(THREE.MathUtils.lerp(0.32, 0.84, flight));

                cinematicState.sceneDarken = THREE.MathUtils.lerp(0.02, 0.07, flight);
                cinematicState.warp = THREE.MathUtils.lerp(0.14, 0.56, flight);
                cinematicState.portalDepth = THREE.MathUtils.lerp(0.24, 0.54, flight);
                cinematicState.flash = Math.max(0.03, 0.15 - flight * 0.08);
                cinematicState.loadingVeil = 0;
                cinematicState.energyPulse = clamp01((elapsedTime - cinematicState.phaseStart) / 0.78);

                if (t >= 1) {
                    cinematicState.phase = 'impact';
                    cinematicState.phaseStart = elapsedTime;
                    cinematicState.flash = 0.2;
                    cinematicState.energyPulse = 0;
                }
            } else if (cinematicState.phase === 'impact') {
                const t = clamp01((elapsedTime - cinematicState.phaseStart) / impactDuration);
                const eased = easeInOutCubic(t);

                tempVectorB.copy(corePosition).sub(shipPivot.position).normalize();
                shipPivot.position.addScaledVector(
                    tempVectorB,
                    stableDelta * (transitionProfile.impactShipPushBase + t * transitionProfile.impactShipPushGain)
                );
                tempQuaternion.setFromUnitVectors(forwardAxis, tempVectorB);
                shipPivot.quaternion.slerp(tempQuaternion, 1 - Math.exp(-stableDelta * transitionProfile.impactQuatSmoothing));

                shipTrailPivot.position.copy(shipPivot.position);
                shipTrailPivot.quaternion.copy(shipPivot.quaternion);
                shipModelMount.rotation.set(elapsedTime * 0.66, 0, Math.sin(elapsedTime * 6.4) * 0.03);
                shipModelMount.scale.setScalar(THREE.MathUtils.lerp(0.98, 0.88, eased));
                shipState.engineLights[0]?.position.set(-0.16, 0, 0.4 + Math.sin(elapsedTime * 9.4) * 0.012);
                shipState.engineLights[1]?.position.set(0.16, 0, 0.4 + Math.cos(elapsedTime * 8.8) * 0.012);
                const impactSilhouette = clamp01((t - 0.3) / 0.5);
                cinematicState.silhouette = impactSilhouette;
                setShipSilhouette(impactSilhouette);
                const impactEngineFade = 1 - impactSilhouette * 0.9;
                if (shipState.engineLights[0]) {
                    shipState.engineLights[0].intensity = (1.88 + Math.sin(elapsedTime * 10.2) * 0.2) * impactEngineFade;
                }
                if (shipState.engineLights[1]) {
                    shipState.engineLights[1].intensity = (1.76 + Math.cos(elapsedTime * 9.6) * 0.18) * impactEngineFade;
                }
                setShipTrailStrength(THREE.MathUtils.lerp(0.88, 0.36, eased) * impactEngineFade, elapsedTime);

                const cameraOffset = THREE.MathUtils.lerp(1.6, 1.22, eased);
                tempVectorC.copy(corePosition).addScaledVector(tempVectorB, -cameraOffset).addScaledVector(upAxis, 0.02 * (1 - eased));
                camera.position.lerp(tempVectorC, 1 - Math.exp(-stableDelta * transitionProfile.impactCameraFollow));
                enforceCameraShipClearance(tempVectorB, 1.22, 0.02);
                camera.lookAt(corePosition);
                camera.fov = THREE.MathUtils.lerp(cinematicState.cameraStartFov - 6.8, cinematicState.cameraStartFov - 8.2, eased);
                camera.updateProjectionMatrix();

                shatterState.coreGroup.scale.setScalar(THREE.MathUtils.lerp(cinematicState.baseCoreScale * 2.05, cinematicState.baseCoreScale * 2.85, eased));
                tuneCoreCinematicMaterial(THREE.MathUtils.lerp(0.84, 1, eased));

                cinematicState.sceneDarken = THREE.MathUtils.lerp(0.05, 0.08, eased);
                cinematicState.warp = THREE.MathUtils.lerp(0.56, 0.78, eased);
                cinematicState.portalDepth = THREE.MathUtils.lerp(0.54, 0.74, eased);
                cinematicState.energyPulse = clamp01((elapsedTime - cinematicState.phaseStart) / impactDuration);
                cinematicState.loadingVeil = 0;

                if (t < 0.72) {
                    cinematicState.flash = THREE.MathUtils.lerp(0.08, 0.2, eased);
                } else {
                    const terminal = easeOutCubic((t - 0.72) / 0.28);
                    cinematicState.flash = THREE.MathUtils.lerp(0.2, 0.28, terminal);
                }

                if (t >= 1) {
                    completeCinematicRedirect('финал ракеты');
                    return;
                }
            } else if (cinematicState.phase === 'loading') {
                const loadingTime = Math.max(0, elapsedTime - cinematicState.phaseStart);
                cinematicState.loadingProgress = clamp01(0.08 + loadingTime / 2.45);
                setLoadingProgress(cinematicState.loadingProgress, elapsedTime);

                cinematicState.sceneDarken = 0.02;
                cinematicState.warp = 0.07 + Math.sin(elapsedTime * 1.3) * 0.008;
                cinematicState.flash = Math.max(0.015, 0.09 - loadingTime * 0.09);
                cinematicState.portalDepth = 1;
                cinematicState.loadingVeil = 0;
                cinematicState.energyPulse = 1;
                cinematicState.silhouette = 1;
                tuneCoreCinematicMaterial(1);
                setShipSilhouette(1);
                setShipTrailStrength(0, elapsedTime);

                camera.fov = cinematicState.cameraStartFov - 4.6;
                camera.updateProjectionMatrix();

                if (cinematicState.loadingProgress >= 1) {
                    if (cinematicState.loadingReadyTimestamp === null) {
                        cinematicState.loadingReadyTimestamp = elapsedTime;
                        loadingProgressText.textContent = 'Готово. Переходим в TISH STORE...';
                        setStatus('Переход в TISH STORE...');
                    } else if (!cinematicState.storeRedirectScheduled && elapsedTime - cinematicState.loadingReadyTimestamp >= 0.42) {
                        cinematicState.storeRedirectScheduled = true;
                        redirectToStoreLoading('загрузка завершена');
                        return;
                    }
                }
            } else if (cinematicState.phase === 'return') {
                const t = clamp01((elapsedTime - cinematicState.phaseStart) / returnDuration);
                const eased = easeInOutCubic(t);

                camera.position.copy(cinematicState.returnStartPosition).lerp(cinematicState.cameraStartPosition, eased);
                camera.quaternion.copy(cinematicState.returnStartQuaternion).slerp(cinematicState.cameraStartQuaternion, eased);
                camera.fov = THREE.MathUtils.lerp(cinematicState.cameraStartFov - 9.8, cinematicState.cameraStartFov, eased);
                camera.updateProjectionMatrix();

                if (shatterState.coreGroup) {
                    shatterState.coreGroup.scale.setScalar(
                        THREE.MathUtils.lerp(cinematicState.returnStartCoreScale, cinematicState.baseCoreScale, eased)
                    );
                }

                tuneCoreCinematicMaterial(1 - eased);

                cinematicState.sceneDarken = (1 - eased) * 0.05;
                cinematicState.warp = (1 - eased) * 0.26;
                cinematicState.flash = (1 - eased) * 0.05;
                cinematicState.portalDepth = (1 - eased) * 0.36;
                cinematicState.loadingVeil = 0;
                cinematicState.energyPulse = 1;
                cinematicState.silhouette = 0;
                setShipSilhouette(0);
                setShipTrailStrength(0, elapsedTime);

                if (t >= 1) {
                    restoreCoreCinematicMaterial();
                    finishCinematicTransition();
                    return;
                }
            }

            setCinematicOverlayVisuals(cinematicState.sceneDarken, cinematicState.warp, cinematicState.flash);
            applyCinematicTone(cinematicState.sceneDarken, cinematicState.warp);
            if (!SIMPLE_CINEMATIC_MODE) {
                const shouldRenderSpeedCanvas = cinematicState.phase === 'click' || cinematicState.phase === 'approach' || cinematicState.phase === 'impact';
                updateCinematicSpeedCanvas(
                    elapsedTime,
                    stableDelta,
                    shouldRenderSpeedCanvas ? cinematicState.warp : 0,
                    shouldRenderSpeedCanvas ? cinematicState.flash : 0
                );
            }

            if (shatterState.coreGroup.userData?.core?.material) {
                const portalDepth = clamp01(cinematicState.portalDepth);
                const flash = clamp01(cinematicState.flash);
                const { core, shell, mist, ring, ringSecondary, ringTilt, innerVoid } = shatterState.coreGroup.userData;

                if (SIMPLE_CINEMATIC_MODE) {
                    core.material.emissiveIntensity = 1 + cinematicState.warp * 0.2 + flash * 0.1 + Math.sin(elapsedTime * 6.2) * 0.03;
                    core.scale.setScalar(1 + Math.sin(elapsedTime * (4.8 + portalDepth * 1.8)) * 0.04 * portalDepth);
                    shell.material.opacity = THREE.MathUtils.lerp(0.1, 0.18, portalDepth);
                    mist.material.opacity = THREE.MathUtils.lerp(0.08, 0.2, portalDepth);
                    innerVoid.material.opacity = THREE.MathUtils.lerp(0.62, 0.78, portalDepth);

                    ring.material.opacity = THREE.MathUtils.lerp(0.14, 0.28, portalDepth);
                    ringSecondary.material.opacity = THREE.MathUtils.lerp(0.12, 0.24, portalDepth);
                    ringTilt.material.opacity = THREE.MathUtils.lerp(0.08, 0.18, portalDepth);

                    ring.rotation.z += stableDelta * (0.9 + portalDepth * 0.9);
                    ringSecondary.rotation.z -= stableDelta * (1 + portalDepth * 0.8);
                    ringTilt.rotation.x += stableDelta * (0.4 + portalDepth * 0.5);
                    ringTilt.rotation.z += stableDelta * (0.55 + portalDepth * 0.5);
                    mist.rotation.y += stableDelta * (0.45 + portalDepth * 0.6);
                } else {
                    core.material.emissiveIntensity =
                        0.96
                        + cinematicState.warp * 0.36
                        + flash * 0.18
                        + Math.sin(elapsedTime * 8.4) * (0.05 + cinematicState.warp * 0.03);

                    core.scale.setScalar(1 + Math.sin(elapsedTime * (5.8 + portalDepth * 3.6)) * 0.08 * portalDepth);
                    shell.material.opacity = THREE.MathUtils.lerp(0.12, 0.22, portalDepth) + Math.sin(elapsedTime * 3.4) * 0.02;
                    mist.material.opacity = THREE.MathUtils.lerp(0.1, 0.34, portalDepth) + Math.sin(elapsedTime * 2.8) * 0.03;
                    innerVoid.material.opacity = THREE.MathUtils.lerp(0.6, 0.88, portalDepth);

                    ring.material.opacity = THREE.MathUtils.lerp(0.2, 0.48, portalDepth);
                    ringSecondary.material.opacity = THREE.MathUtils.lerp(0.18, 0.44, portalDepth);
                    ringTilt.material.opacity = THREE.MathUtils.lerp(0.12, 0.34, portalDepth);

                    ring.rotation.z += stableDelta * (1.6 + portalDepth * 1.8);
                    ringSecondary.rotation.z -= stableDelta * (1.9 + portalDepth * 1.6);
                    ringTilt.rotation.x += stableDelta * (0.62 + portalDepth * 1.02);
                    ringTilt.rotation.z += stableDelta * (1.04 + portalDepth * 0.76);
                    mist.rotation.y += stableDelta * (0.7 + portalDepth * 1.1);
                }
            }
        }

        returnMainButton.addEventListener('click', (event) => {
            event.preventDefault();
            beginReturnToMainScreen();
        });

        function setStatus(text) {
            modelStatus.textContent = text;
        }

        let pendingSectorNavigationTimer = null;

        function cancelPendingSectorNavigation() {
            if (pendingSectorNavigationTimer === null) return;
            window.clearTimeout(pendingSectorNavigationTimer);
            pendingSectorNavigationTimer = null;
        }

        function queueSectorNavigation(sectorInfo) {
            if (!sectorInfo) return;

            cancelPendingSectorNavigation();
            const clickAnimationDelay = crystalSectors.triggerClickAnimation(sectorInfo.key);
            const navigateDelay = Math.max(220, clickAnimationDelay || 0);

            setStatus(`Открываем сферу «${sectorInfo.label}»...`);
            pendingSectorNavigationTimer = window.setTimeout(() => {
                pendingSectorNavigationTimer = null;
                navigateFromSector(sectorInfo);
            }, navigateDelay);
        }

        function navigateToServices(source = 'кнопка') {
            if (window.location.hash === `#${servicesHash}`) {
                history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
            }
            window.location.hash = servicesHash;
            setStatus(`Переход к разделу услуг (${source})...`);
        }

        function redirectToStoreLoading(source = 'кнопка') {
            const currentUrl = new URL(window.location.href);
            const targetUrl = new URL(storeEntryPath, currentUrl);
            setStatus(`Переход в TISH STORE (${source})...`);
            window.location.assign(targetUrl.toString());
        }

        function navigateToMainSection(hash, source = 'кристалл') {
            if (!hash) return;

            const currentUrl = new URL(window.location.href);
            const inTestNewFolder = currentUrl.pathname.toLowerCase().includes('/test_new/');
            const targetBase = inTestNewFolder ? '../index.html' : './index.html';
            const targetUrl = new URL(targetBase, currentUrl);
            targetUrl.hash = hash;

            setStatus(`Переход к разделу #${hash} (${source})...`);
            window.location.assign(targetUrl.toString());
        }

        function navigateFromSector(sectorInfo) {
            if (!sectorInfo) return;
            const targetSection = mainSectionBySector[sectorInfo.key];
            if (targetSection) {
                navigateToMainSection(targetSection, `сфера «${sectorInfo.label}»`);
                return;
            }

            navigateToServices(`сфера «${sectorInfo.label}»`);
        }

        function startCoreCinematicFromCta(source = 'кнопка') {
            if (!sphereLabel.classList.contains('visible')) return;

            cancelPendingSectorNavigation();
            crystalSectors.cancelClickAnimation();

            if (cinematicState.active) return;

            if (!shatterState.coreGroup) {
                redirectToStoreLoading(`${source}, без кинематики`);
                return;
            }

            startCoreCinematicTransition(source);
        }

        sphereLabelRotator.addEventListener('pointerdown', (event) => {
            if (!sphereLabel.classList.contains('visible')) return;
            event.preventDefault();
            event.stopPropagation();
            startCoreCinematicFromCta('кнопка');
        });

        sphereLabelRotator.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            event.stopPropagation();
            startCoreCinematicFromCta('кнопка клавиатура');
        });

        subtitleRotatingController = createServiceRotatorController(
            sphereLabelRotator,
            ['программы', 'дизайн', 'монтаж', 'видео'],
            {
                animationDuration: 360,
                charStagger: 18,
                nextEnterDelay: 16,
                initialEmptyDuration: 0,
                holdDuration: 900,
                interWordGapDuration: 55,
                horizontalPadding: 6,
                minWidth: 40,
                maxWidth: 96,
                switchOvershoot: 6,
                emptyWidthText: 'программы'
            }
        );

        function disableImmediateSphereLabelMode() {
            sphereLabel.classList.remove('instant');
        }

        function hideSphereLabel() {
            sphereLabel.classList.remove('visible');
            subtitleRotatingController?.stop();
            sphereLabelSmoothInitialized = false;
            sphereLabelWasVisible = false;
        }

        function hideCrystalClickHint() {
            if (!crystalClickHint) return;
            crystalClickHint.classList.remove('visible');
            crystalClickHint.setAttribute('aria-hidden', 'true');
            crystalClickHintInitialized = false;
        }

        function updateCrystalClickHint(deltaTime, elapsedTime) {
            if (
                !crystalClickHint
                || startupPreloaderState.active
                || cinematicState.active
                || shatterState.triggered
                || !activeCrystal
                || elapsedTime < crystalClickHintRevealDelay
            ) {
                hideCrystalClickHint();
                return;
            }

            const hintPosition = crystalPivot.getWorldPosition(tempVectorA);
            hintPosition.y += 1.08;
            hintPosition.project(camera);

            if (!Number.isFinite(hintPosition.x) || !Number.isFinite(hintPosition.y) || hintPosition.z >= 1) {
                hideCrystalClickHint();
                return;
            }

            const { width: viewportWidth, height: viewportHeight } = getViewportSize();
            const screenX = (hintPosition.x * 0.5 + 0.5) * viewportWidth;
            const screenY = (-hintPosition.y * 0.5 + 0.5) * viewportHeight;
            const horizontalMargin = viewportWidth <= 720 ? 56 : 86;
            const topMargin = viewportHeight <= 720 ? 40 : 56;
            const bottomMargin = viewportHeight <= 720 ? 28 : 42;
            const clampedX = THREE.MathUtils.clamp(screenX, horizontalMargin, viewportWidth - horizontalMargin);
            const clampedY = THREE.MathUtils.clamp(screenY, topMargin, viewportHeight - bottomMargin);

            const followSmooth = 1 - Math.exp(-deltaTime * 10.5);
            if (!crystalClickHintInitialized) {
                crystalClickHintSmoothPosition.set(clampedX, clampedY);
                crystalClickHintInitialized = true;
            } else {
                crystalClickHintSmoothPosition.x += (clampedX - crystalClickHintSmoothPosition.x) * followSmooth;
                crystalClickHintSmoothPosition.y += (clampedY - crystalClickHintSmoothPosition.y) * followSmooth;
            }

            crystalClickHint.style.transform = `translate(${crystalClickHintSmoothPosition.x.toFixed(2)}px, ${crystalClickHintSmoothPosition.y.toFixed(2)}px) translate(-50%, -100%)`;
            crystalClickHint.classList.add('visible');
            crystalClickHint.setAttribute('aria-hidden', 'false');
        }

        function updateSphereLabel(deltaTime, elapsedTime) {
            if (cinematicState.active) {
                hideSphereLabel();
                disableImmediateSphereLabelMode();
                sphereLabel.classList.remove('core-reveal');
                return;
            }

            const labelAnchor = shatterState.coreGroup;
            if (!labelAnchor) {
                hideSphereLabel();
                disableImmediateSphereLabelMode();
                sphereLabel.classList.remove('core-reveal');
                return;
            }

            const revealTime = shatterState.labelRevealTime ?? Number.POSITIVE_INFINITY;
            if (elapsedTime < revealTime) {
                hideSphereLabel();
                disableImmediateSphereLabelMode();
                sphereLabel.classList.remove('core-reveal');
                return;
            }

            disableImmediateSphereLabelMode();
            if (!shatterState.labelRevealTriggered) {
                sphereLabel.classList.remove('core-reveal');
                void sphereLabel.offsetWidth;
                sphereLabel.classList.add('core-reveal');
                shatterState.labelRevealTriggered = true;
            }

            const labelPosition = labelAnchor.getWorldPosition(tempVectorA);
            const labelOffsetY = shatterState.coreGroup ? 0.76 : 0.98;
            labelPosition.y += labelOffsetY;
            labelPosition.project(camera);

            const { width: viewportWidth, height: viewportHeight } = getViewportSize();

            const screenX = (labelPosition.x * 0.5 + 0.5) * viewportWidth;
            const screenY = (-labelPosition.y * 0.5 + 0.5) * viewportHeight;
            const inFrontOfCamera = labelPosition.z < 1;

            if (!inFrontOfCamera) {
                hideSphereLabel();
                return;
            }

            const phoneViewport = MOBILE_MODE && viewportWidth <= 900;
            const horizontalMargin = phoneViewport
                ? (viewportWidth <= 420 ? 36 : 44)
                : (viewportWidth <= 720 ? 60 : 96);
            const topMargin = phoneViewport
                ? (viewportHeight <= 700 ? 34 : 42)
                : (viewportHeight <= 720 ? 48 : 64);
            const bottomMargin = phoneViewport
                ? (viewportHeight <= 700 ? 26 : 32)
                : (viewportHeight <= 720 ? 36 : 48);
            const clampedX = THREE.MathUtils.clamp(screenX, horizontalMargin, viewportWidth - horizontalMargin);
            const clampedY = THREE.MathUtils.clamp(screenY, topMargin, viewportHeight - bottomMargin);

            const followSmooth = 1 - Math.exp(-deltaTime * 12.5);
            if (!sphereLabelSmoothInitialized) {
                sphereLabelSmoothPosition.set(clampedX, clampedY);
                sphereLabelSmoothInitialized = true;
            } else {
                sphereLabelSmoothPosition.x += (clampedX - sphereLabelSmoothPosition.x) * followSmooth;
                sphereLabelSmoothPosition.y += (clampedY - sphereLabelSmoothPosition.y) * followSmooth;
            }

            sphereLabel.style.transform = `translate(${sphereLabelSmoothPosition.x.toFixed(2)}px, ${sphereLabelSmoothPosition.y.toFixed(2)}px) translate(-50%, -100%)`;
            sphereLabel.classList.add('visible');

            if (!sphereLabelWasVisible) {
                subtitleRotatingController?.restart();
            }

            sphereLabelWasVisible = true;
        }

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.035;
        controls.enablePan = false;
        controls.minDistance = 6.4;
        controls.maxDistance = 12.5;
        controls.minPolarAngle = Math.PI * 0.23;
        controls.maxPolarAngle = Math.PI * 0.8;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.22;

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let rendererRect = renderer.domElement.getBoundingClientRect();
        const pointerHoverState = {
            clientX: 0,
            clientY: 0,
            dirty: false,
            lastProcessedMs: 0,
            intervalMs: LOW_END_MODE ? 72 : 28,
            cursor: 'default'
        };

        function refreshRendererRect() {
            rendererRect = renderer.domElement.getBoundingClientRect();
        }

        function setCanvasCursor(nextCursor) {
            if (pointerHoverState.cursor === nextCursor) return;
            pointerHoverState.cursor = nextCursor;
            renderer.domElement.style.cursor = nextCursor;
        }

        const solarSystem = new THREE.Group();
        scene.add(solarSystem);

        const sunAnchor = new THREE.Group();
        sunAnchor.position.set(0, 0, -40);
        solarSystem.add(sunAnchor);

        const sun = new THREE.Mesh(
            new THREE.SphereGeometry(1.8, scaleSegments(48, 20), scaleSegments(48, 20)),
            new THREE.MeshStandardMaterial({
                color: 0xffe7a9,
                map: sunSurfaceTexture,
                emissive: 0xffa94c,
                emissiveMap: sunSurfaceTexture,
                emissiveIntensity: 2.05,
                roughness: 0.86,
                metalness: 0
            })
        );
        sunAnchor.add(sun);

        const sunGlow = new THREE.Mesh(
            new THREE.SphereGeometry(3.3, scaleSegments(48, 20), scaleSegments(48, 20)),
            new THREE.MeshBasicMaterial({
                color: 0xffbc73,
                alphaMap: sunCoronaTexture,
                transparent: true,
                opacity: 0.42,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false,
                depthTest: true
            })
        );
        sunAnchor.add(sunGlow);

        const sunCoronaInner = new THREE.Mesh(
            new THREE.SphereGeometry(4.1, scaleSegments(56, 24), scaleSegments(56, 24)),
            new THREE.MeshBasicMaterial({
                color: 0xffa75e,
                alphaMap: sunCoronaTexture,
                transparent: true,
                opacity: 0.14,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false,
                depthTest: true
            })
        );
        sunAnchor.add(sunCoronaInner);

        const sunHalo = new THREE.Mesh(
            new THREE.SphereGeometry(5.1, scaleSegments(40, 18), scaleSegments(40, 18)),
            new THREE.MeshBasicMaterial({
                color: 0xff9d52,
                alphaMap: sunCoronaTexture,
                transparent: true,
                opacity: 0.2,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false,
                depthTest: true
            })
        );
        sunAnchor.add(sunHalo);

        const sunCoronaOuter = new THREE.Mesh(
            new THREE.SphereGeometry(6.5, scaleSegments(40, 18), scaleSegments(40, 18)),
            new THREE.MeshBasicMaterial({
                color: 0xff9240,
                alphaMap: sunCoronaTexture,
                transparent: true,
                opacity: 0.09,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false,
                depthTest: true
            })
        );
        sunAnchor.add(sunCoronaOuter);

        const sunArc = new THREE.Mesh(
            new THREE.TorusGeometry(4.75, 0.055, scaleSegments(14, 8), scaleSegments(180, 56)),
            new THREE.MeshBasicMaterial({
                color: 0xffa75e,
                transparent: true,
                opacity: 0.18,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        sunArc.rotation.x = Math.PI * 0.5;
        sunAnchor.add(sunArc);

        function createDynamicStarLayer(options = {}) {
            const count = scaleCount(options.count ?? 320, 80);
            const innerRadius = options.innerRadius ?? 70;
            const outerRadius = options.outerRadius ?? 150;
            const size = options.size ?? 0.18;
            const twinkleSpeed = options.twinkleSpeed ?? 0.8;
            const driftSpeed = options.driftSpeed ?? 0.01;

            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            const baseColors = new Float32Array(count * 3);
            const phases = new Float32Array(count);

            const cA = new THREE.Color(options.colorA ?? 0xffffff);
            const cB = new THREE.Color(options.colorB ?? 0xb9d4ff);
            const center = sunAnchor.position.clone();

            for (let i = 0; i < count; i++) {
                const i3 = i * 3;
                const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const mix = Math.random();

                const x = center.x + radius * Math.sin(phi) * Math.cos(theta);
                const y = center.y + radius * Math.cos(phi) * 0.72;
                const z = center.z + radius * Math.sin(phi) * Math.sin(theta);
                positions[i3] = x;
                positions[i3 + 1] = y;
                positions[i3 + 2] = z;

                const color = cA.clone().lerp(cB, mix);
                const baseIntensity = 0.58 + Math.random() * 0.42;
                baseColors[i3] = color.r * baseIntensity;
                baseColors[i3 + 1] = color.g * baseIntensity;
                baseColors[i3 + 2] = color.b * baseIntensity;
                colors[i3] = baseColors[i3];
                colors[i3 + 1] = baseColors[i3 + 1];
                colors[i3 + 2] = baseColors[i3 + 2];

                phases[i] = Math.random() * Math.PI * 2;
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({
                size,
                sizeAttenuation: true,
                map: particleSprite,
                transparent: true,
                opacity: options.opacity ?? 0.82,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                alphaTest: 0.03,
                vertexColors: true
            });

            const points = new THREE.Points(geometry, material);
            scene.add(points);

            const baseOpacity = material.opacity;

            return {
                points,
                colorsAttribute: geometry.getAttribute('color'),
                baseColors,
                phases,
                twinkleSpeed,
                driftSpeed,
                baseOpacity
            };
        }

        const dynamicStarLayers = [
            createDynamicStarLayer({ count: 620, innerRadius: 50, outerRadius: 140, size: 0.11, twinkleSpeed: 1.12, driftSpeed: 0.013, colorA: 0xffffff, colorB: 0xcfe2ff, opacity: 0.88 }),
            createDynamicStarLayer({ count: 460, innerRadius: 130, outerRadius: 230, size: 0.16, twinkleSpeed: 0.7, driftSpeed: -0.008, colorA: 0xf9f1ff, colorB: 0xb1d0ff, opacity: 0.74 }),
            createDynamicStarLayer({ count: 320, innerRadius: 220, outerRadius: 360, size: 0.21, twinkleSpeed: 0.48, driftSpeed: 0.004, colorA: 0xf3e9ff, colorB: 0xaac6ff, opacity: 0.62 }),
            createDynamicStarLayer({ count: 520, innerRadius: 340, outerRadius: 520, size: 0.09, twinkleSpeed: 0.36, driftSpeed: -0.002, colorA: 0xeef5ff, colorB: 0x9ec2ff, opacity: 0.52 })
        ];

        function createNebulaCloud(options = {}) {
            const texture = createNebulaSpriteTexture(
                options.palette ?? ['118,146,255', '193,118,255', '255,145,192'],
                options.textureSize ?? 1536
            );
            const material = new THREE.SpriteMaterial({
                map: texture,
                color: options.tint ?? 0xffffff,
                transparent: true,
                opacity: options.opacity ?? 0.26,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true
            });

            const sprite = new THREE.Sprite(material);
            const position = options.position ?? new THREE.Vector3(0, 0, -190);
            const scaleX = options.scaleX ?? 420;
            const scaleY = options.scaleY ?? 240;
            sprite.position.copy(position);
            sprite.scale.set(scaleX, scaleY, 1);
            scene.add(sprite);

            return {
                sprite,
                basePosition: position.clone(),
                baseScaleX: scaleX,
                baseScaleY: scaleY,
                baseRotation: options.rotation ?? 0,
                baseOpacity: material.opacity,
                driftSpeed: options.driftSpeed ?? THREE.MathUtils.randFloat(0.03, 0.08),
                driftAmplitude: options.driftAmplitude ?? THREE.MathUtils.randFloat(1.4, 4.6),
                pulseSpeed: options.pulseSpeed ?? THREE.MathUtils.randFloat(0.22, 0.44),
                rotationSpeed: options.rotationSpeed ?? THREE.MathUtils.randFloat(-0.01, 0.01),
                phase: Math.random() * Math.PI * 2
            };
        }

        const nebulaLayers = [
            createNebulaCloud({
                position: new THREE.Vector3(-84, 24, -250),
                scaleX: 680,
                scaleY: 350,
                opacity: 0.16,
                tint: 0xb8a6ff,
                palette: ['122,152,255', '207,122,255', '255,140,194'],
                driftSpeed: 0.03,
                driftAmplitude: 6.2,
                rotation: 0.1,
                rotationSpeed: 0.003
            }),
            createNebulaCloud({
                position: new THREE.Vector3(92, -12, -286),
                scaleX: 740,
                scaleY: 390,
                opacity: 0.14,
                tint: 0x9fcbff,
                palette: ['114,154,255', '150,220,255', '198,142,255'],
                driftSpeed: 0.026,
                driftAmplitude: 7.6,
                rotation: -0.15,
                rotationSpeed: -0.002
            }),
            createNebulaCloud({
                position: new THREE.Vector3(-10, -32, -214),
                scaleX: 560,
                scaleY: 310,
                opacity: 0.13,
                tint: 0xe8b0ff,
                palette: ['198,122,255', '255,145,198', '145,174,255'],
                driftSpeed: 0.034,
                driftAmplitude: 4.8,
                rotation: 0.24,
                rotationSpeed: 0.002
            }),
            createNebulaCloud({
                position: new THREE.Vector3(-188, -4, -310),
                scaleX: 820,
                scaleY: 420,
                opacity: 0.11,
                tint: 0x9cbdff,
                palette: ['110,156,255', '186,122,255', '255,156,208'],
                driftSpeed: 0.022,
                driftAmplitude: 8.6,
                rotation: -0.07,
                rotationSpeed: -0.0017
            }),
            createNebulaCloud({
                position: new THREE.Vector3(196, 18, -328),
                scaleX: 840,
                scaleY: 410,
                opacity: 0.1,
                tint: 0xb9a9ff,
                palette: ['124,168,255', '196,132,255', '255,145,189'],
                driftSpeed: 0.02,
                driftAmplitude: 9.2,
                rotation: 0.18,
                rotationSpeed: 0.0015
            })
        ];

        function createGalaxySpriteTexture(options = {}) {
            const size = clampTextureSize(options.size ?? 1536, MOBILE_MODE ? 320 : 512);
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const center = size * 0.5;
            const tau = Math.PI * 2;

            ctx.clearRect(0, 0, size, size);
            ctx.globalCompositeOperation = 'screen';

            const halo = ctx.createRadialGradient(center, center, size * 0.02, center, center, size * 0.52);
            halo.addColorStop(0, 'rgba(255, 236, 220, 0.96)');
            halo.addColorStop(0.08, 'rgba(255, 184, 232, 0.74)');
            halo.addColorStop(0.2, 'rgba(172, 166, 255, 0.34)');
            halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = halo;
            ctx.fillRect(0, 0, size, size);

            const armCount = options.armCount ?? 4;
            const pointsPerArm = scaleCount(options.pointsPerArm ?? 660, 180);
            const maxRadius = size * 0.44;
            const palette = options.palette ?? ['240,213,255', '174,198,255', '255,186,224'];

            for (let arm = 0; arm < armCount; arm += 1) {
                const armOffset = (arm / armCount) * Math.PI * 2;
                for (let i = 0; i < pointsPerArm; i += 1) {
                    const t = i / pointsPerArm;
                    const spread = (Math.random() - 0.5) * (1 - t) * 0.52;
                    const angle = armOffset + t * Math.PI * 4.6 + spread;
                    const radius = maxRadius * Math.pow(t, 0.92) + Math.random() * size * 0.01;
                    const x = center + Math.cos(angle) * radius;
                    const y = center + Math.sin(angle) * radius;
                    const dotRadius = 0.3 + Math.random() * 1.5;
                    const alpha = (1 - t) * (0.14 + Math.random() * 0.2);
                    const color = palette[Math.floor(Math.random() * palette.length)];

                    ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
                    ctx.beginPath();
                    ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            for (let i = 0; i < Math.floor(size * 0.22 * RENDER_PROFILE.pointCountScale); i += 1) {
                const angle = Math.random() * tau;
                const distance = Math.pow(Math.random(), 0.86) * size * 0.48;
                const x = center + Math.cos(angle) * distance;
                const y = center + Math.sin(angle) * distance;
                const color = palette[Math.floor(Math.random() * palette.length)];
                const alpha = 0.01 + Math.random() * 0.06;
                const radius = 0.2 + Math.random() * 1.5;
                ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            const edgeMask = ctx.createRadialGradient(center, center, size * 0.2, center, center, size * 0.5);
            edgeMask.addColorStop(0, 'rgba(255,255,255,1)');
            edgeMask.addColorStop(0.78, 'rgba(255,255,255,0.96)');
            edgeMask.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.globalCompositeOperation = 'destination-in';
            ctx.fillStyle = edgeMask;
            ctx.fillRect(0, 0, size, size);
            ctx.globalCompositeOperation = 'source-over';

            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            return texture;
        }

        function createDistantGalaxy(options = {}) {
            const texture = createGalaxySpriteTexture({
                size: options.textureSize ?? (MOBILE_MODE ? 640 : 1024),
                armCount: options.armCount ?? 4,
                pointsPerArm: options.pointsPerArm ?? 460,
                palette: options.palette
            });
            const material = new THREE.SpriteMaterial({
                map: texture,
                color: options.tint ?? 0xffffff,
                transparent: true,
                opacity: options.opacity ?? 0.32,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true
            });

            const sprite = new THREE.Sprite(material);
            const position = options.position ?? new THREE.Vector3(0, 0, -168);
            const scale = options.scale ?? 82;
            sprite.position.copy(position);
            sprite.scale.set(scale, scale, 1);
            sprite.renderOrder = -5;
            scene.add(sprite);

            return {
                sprite,
                basePosition: position.clone(),
                baseScale: scale,
                baseOpacity: material.opacity,
                followCore: options.followCore ?? false,
                depth: options.depth ?? 28,
                depthDrift: options.depthDrift ?? 2.4,
                offsetX: options.offsetX ?? 0,
                offsetY: options.offsetY ?? 0,
                driftSpeed: options.driftSpeed ?? THREE.MathUtils.randFloat(0.018, 0.04),
                driftAmplitude: options.driftAmplitude ?? THREE.MathUtils.randFloat(1.8, 4.4),
                rotationSpeed: options.rotationSpeed ?? THREE.MathUtils.randFloat(-0.026, 0.026),
                pulseSpeed: options.pulseSpeed ?? THREE.MathUtils.randFloat(0.12, 0.3),
                phase: Math.random() * Math.PI * 2
            };
        }

        const distantGalaxies = [
            createDistantGalaxy({
                followCore: false,
                position: new THREE.Vector3(-268, 132, -540),
                scale: 124,
                opacity: 0.18,
                tint: 0xff8ed2,
                palette: ['255,192,236', '255,228,177', '203,183,255'],
                driftSpeed: 0.018,
                driftAmplitude: 1.8,
                rotationSpeed: 0.012
            }),
            createDistantGalaxy({
                followCore: false,
                position: new THREE.Vector3(282, 118, -560),
                scale: 116,
                opacity: 0.16,
                tint: 0x9ed3ff,
                palette: ['180,206,255', '160,178,255', '231,195,255'],
                driftSpeed: 0.016,
                driftAmplitude: 1.7,
                rotationSpeed: -0.01
            }),
            createDistantGalaxy({
                position: new THREE.Vector3(-96, -26, -232),
                scale: 92,
                opacity: 0.13,
                tint: 0xdca8ff,
                palette: ['242,198,255', '166,182,255', '255,172,208'],
                driftSpeed: 0.013,
                driftAmplitude: 4.6,
                rotationSpeed: 0.005
            }),
            createDistantGalaxy({
                position: new THREE.Vector3(102, 26, -248),
                scale: 86,
                opacity: 0.11,
                tint: 0xa9c9ff,
                palette: ['168,202,255', '189,167,255', '255,188,224'],
                driftSpeed: 0.012,
                driftAmplitude: 5.6,
                rotationSpeed: -0.004
            })
        ];

        function updateDistantGalaxies(elapsedTime, backgroundVisibility) {
            const corePosition = crystalPivot.getWorldPosition(tempVectorA);
            const viewDirection = tempVectorB.copy(corePosition).sub(camera.position);
            if (viewDirection.lengthSq() < 1e-5) {
                viewDirection.set(0, 0, -1);
            } else {
                viewDirection.normalize();
            }

            const viewRight = tempVectorC.copy(viewDirection).cross(upAxis);
            if (viewRight.lengthSq() < 1e-5) {
                viewRight.set(1, 0, 0);
            } else {
                viewRight.normalize();
            }
            const viewUp = tempVectorD.copy(viewRight).cross(viewDirection);
            if (viewUp.lengthSq() < 1e-5) {
                viewUp.copy(upAxis);
            } else {
                viewUp.normalize();
            }

            for (const galaxy of distantGalaxies) {
                const driftX = Math.sin(elapsedTime * galaxy.driftSpeed + galaxy.phase) * galaxy.driftAmplitude;
                const driftY = Math.cos(elapsedTime * galaxy.driftSpeed * 0.8 + galaxy.phase * 0.72) * (galaxy.driftAmplitude * 0.54);
                const pulse = 0.92 + Math.sin(elapsedTime * galaxy.pulseSpeed + galaxy.phase) * 0.08;

                if (galaxy.followCore) {
                    const depth = galaxy.depth + Math.sin(elapsedTime * 0.2 + galaxy.phase) * galaxy.depthDrift;
                    galaxy.sprite.position
                        .copy(corePosition)
                        .addScaledVector(viewDirection, depth)
                        .addScaledVector(viewRight, galaxy.offsetX + driftX * 0.55)
                        .addScaledVector(viewUp, galaxy.offsetY + driftY * 0.55);
                } else {
                    galaxy.sprite.position.x = galaxy.basePosition.x + driftX * 0.35;
                    galaxy.sprite.position.y = galaxy.basePosition.y + driftY * 0.35;
                }

                galaxy.sprite.material.rotation += galaxy.rotationSpeed * 0.003;
                galaxy.sprite.scale.setScalar(galaxy.baseScale * (0.96 + pulse * 0.07));
                galaxy.sprite.material.opacity = galaxy.baseOpacity * pulse * (0.32 + backgroundVisibility * 0.68);
            }
        }

        function createBlackHoleLensingTexture(size = 1024) {
            size = clampTextureSize(size, MOBILE_MODE ? 320 : 512);
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const center = size * 0.5;

            ctx.clearRect(0, 0, size, size);

            const glow = ctx.createRadialGradient(center, center, size * 0.08, center, center, size * 0.5);
            glow.addColorStop(0, 'rgba(255, 164, 214, 0.42)');
            glow.addColorStop(0.48, 'rgba(255, 114, 176, 0.16)');
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, size, size);

            const ring = ctx.createRadialGradient(center, center, size * 0.22, center, center, size * 0.42);
            ring.addColorStop(0, 'rgba(255, 164, 226, 0)');
            ring.addColorStop(0.56, 'rgba(255, 178, 124, 0.36)');
            ring.addColorStop(0.68, 'rgba(255, 104, 184, 0.52)');
            ring.addColorStop(0.82, 'rgba(255, 84, 164, 0.18)');
            ring.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = ring;
            ctx.fillRect(0, 0, size, size);

            ctx.strokeStyle = 'rgba(255, 176, 110, 0.3)';
            ctx.lineWidth = 1.6;
            for (let i = 0; i < 7; i += 1) {
                const radiusX = size * (0.2 + i * 0.026);
                const radiusY = radiusX * (0.32 + i * 0.02);
                ctx.beginPath();
                ctx.ellipse(center, center, radiusX, radiusY, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;
            return texture;
        }

        function createBlackHoleSystem(options = {}) {
            const group = new THREE.Group();
            const basePosition = options.position ?? new THREE.Vector3(8, 12, -178);
            const baseScale = options.baseScale ?? 1;
            group.position.copy(basePosition);
            group.scale.setScalar(baseScale);
            group.renderOrder = -4;
            scene.add(group);

            const singularity = new THREE.Mesh(
                new THREE.SphereGeometry(4.8, scaleSegments(64, 24), scaleSegments(64, 24)),
                new THREE.MeshBasicMaterial({
                    color: 0x050108,
                    transparent: true,
                    opacity: 0.99,
                    depthWrite: false
                })
            );
            group.add(singularity);

            const accretionDiskMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uIntensity: { value: 1 },
                    uColorA: { value: new THREE.Color(0xff8cbf) },
                    uColorB: { value: new THREE.Color(0xffdd98) },
                    uColorC: { value: new THREE.Color(0xff4f9e) }
                },
                vertexShader: `
                    varying vec2 vUv;

                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float uTime;
                    uniform float uIntensity;
                    uniform vec3 uColorA;
                    uniform vec3 uColorB;
                    uniform vec3 uColorC;

                    varying vec2 vUv;

                    void main() {
                        vec2 p = vUv - 0.5;
                        float radius = length(p) * 2.0;
                        float angle = atan(p.y, p.x);

                        float outer = 1.0 - smoothstep(0.86, 1.04, radius);
                        float inner = smoothstep(0.24, 0.4, radius);
                        float ringMask = outer * inner;

                        float swirlA = sin(angle * 15.0 - uTime * 2.6 + radius * 29.0);
                        float swirlB = sin(angle * 7.0 + uTime * 1.8 + radius * 15.0);
                        float band = smoothstep(0.1, 0.92, swirlA * 0.5 + 0.5);
                        float turbulence = swirlB * 0.5 + 0.5;
                        float streaks = smoothstep(0.24, 0.94, band * 0.72 + turbulence * 0.66);

                        vec3 warm = mix(uColorA, uColorB, clamp(radius * 1.12, 0.0, 1.0));
                        vec3 hot = mix(warm, uColorC, streaks * 0.56);

                        float edgeFade = 1.0 - smoothstep(0.94, 1.08, radius);
                        float alpha = ringMask * streaks * uIntensity * edgeFade;
                        vec3 color = hot * (0.56 + streaks * 1.22) * edgeFade;

                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide
            });

            const accretionDisk = new THREE.Mesh(
                new THREE.RingGeometry(6.2, 16.8, scaleSegments(220, 80), 1),
                accretionDiskMaterial
            );
            accretionDisk.rotation.x = Math.PI * 0.62;
            group.add(accretionDisk);

            const photonRing = new THREE.Mesh(
                new THREE.TorusGeometry(6.3, 0.24, scaleSegments(24, 10), scaleSegments(200, 72)),
                new THREE.MeshBasicMaterial({
                    color: 0xff8ec7,
                    transparent: true,
                    opacity: 0.45,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            photonRing.rotation.x = Math.PI * 0.62;
            group.add(photonRing);

            const lensRing = new THREE.Mesh(
                new THREE.TorusGeometry(11.8, 0.16, scaleSegments(16, 8), scaleSegments(180, 64)),
                new THREE.MeshBasicMaterial({
                    color: 0xff6fb6,
                    transparent: true,
                    opacity: 0.24,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            lensRing.rotation.x = Math.PI * 0.56;
            group.add(lensRing);

            const lensingHalo = new THREE.Sprite(
                new THREE.SpriteMaterial({
                    map: createBlackHoleLensingTexture(),
                    color: 0xff89cf,
                    transparent: true,
                    opacity: 0.42,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    depthTest: true
                })
            );
            lensingHalo.scale.set(58, 58, 1);
            group.add(lensingHalo);

            return {
                group,
                singularity,
                accretionDisk,
                accretionDiskMaterial,
                photonRing,
                lensRing,
                lensingHalo,
                basePosition,
                baseScale,
                followCore: options.followCore ?? false,
                depth: options.depth ?? 34,
                depthDrift: options.depthDrift ?? 2.2,
                offsetX: options.offsetX ?? 0,
                offsetY: options.offsetY ?? 0,
                phase: Math.random() * Math.PI * 2
            };
        }

        const blackHoleState = createBlackHoleSystem({
            followCore: false,
            baseScale: 2.0,
            position: new THREE.Vector3(236, -88, -548)
        });

        function updateBlackHole(elapsedTime, deltaTime, backgroundVisibility) {
            const state = blackHoleState;
            const pulse = 0.88 + Math.sin(elapsedTime * 1.34 + state.phase) * 0.12;
            const swayX = Math.sin(elapsedTime * 0.16 + state.phase * 0.74) * 0.9;
            const swayY = Math.cos(elapsedTime * 0.2 + state.phase * 0.36) * 0.6;

            if (state.followCore) {
                const corePosition = crystalPivot.getWorldPosition(tempVectorA);
                const viewDirection = tempVectorB.copy(corePosition).sub(camera.position);
                if (viewDirection.lengthSq() < 1e-5) {
                    viewDirection.set(0, 0, -1);
                } else {
                    viewDirection.normalize();
                }

                const viewRight = tempVectorC.copy(viewDirection).cross(upAxis);
                if (viewRight.lengthSq() < 1e-5) {
                    viewRight.set(1, 0, 0);
                } else {
                    viewRight.normalize();
                }
                tempVectorD.copy(viewRight).cross(viewDirection);
                if (tempVectorD.lengthSq() < 1e-5) {
                    tempVectorD.copy(upAxis);
                } else {
                    tempVectorD.normalize();
                }

                const depth = state.depth + Math.sin(elapsedTime * 0.14 + state.phase * 0.3) * state.depthDrift;
                state.group.position
                    .copy(corePosition)
                    .addScaledVector(viewDirection, depth)
                    .addScaledVector(viewRight, state.offsetX + swayX)
                    .addScaledVector(tempVectorD, state.offsetY + swayY);
            } else {
                state.group.position.x = state.basePosition.x + swayX * 0.45;
                state.group.position.y = state.basePosition.y + swayY * 0.45;
                state.group.position.z = state.basePosition.z + Math.sin(elapsedTime * 0.14) * 1.4;
            }

            state.accretionDiskMaterial.uniforms.uTime.value = elapsedTime;
            state.accretionDiskMaterial.uniforms.uIntensity.value = (0.74 + pulse * 0.52) * (0.18 + backgroundVisibility * 0.82);

            state.accretionDisk.rotation.z += deltaTime * 0.28;
            state.photonRing.rotation.z += deltaTime * 0.5;
            state.lensRing.rotation.z -= deltaTime * 0.3;
            state.lensingHalo.material.rotation += deltaTime * 0.06;

            const visibility = 0.22 + backgroundVisibility * 0.78;
            state.lensingHalo.material.opacity = (0.3 + pulse * 0.22) * visibility;
            state.lensingHalo.scale.setScalar(58 * (0.95 + pulse * 0.09));
            state.photonRing.material.opacity = (0.26 + pulse * 0.32) * visibility;
            state.lensRing.material.opacity = (0.12 + pulse * 0.16) * visibility;
            state.singularity.scale.setScalar(0.98 + Math.sin(elapsedTime * 0.58) * 0.03);
        }

        function createAmbientBackgroundShip() {
            const group = new THREE.Group();
            const hull = new THREE.Mesh(
                new THREE.ConeGeometry(0.06, 0.22, 8),
                new THREE.MeshBasicMaterial({
                    color: 0xd9ebff,
                    transparent: true,
                    opacity: 0.86,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            hull.rotation.z = -Math.PI * 0.5;

            const trail = new THREE.Mesh(
                new THREE.PlaneGeometry(0.86, 0.08),
                new THREE.MeshBasicMaterial({
                    map: cometTrailTexture,
                    transparent: true,
                    opacity: 0.34,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide
                })
            );
            trail.position.x = -0.34;

            group.add(hull, trail);
            group.visible = false;
            scene.add(group);

            return {
                group,
                hull,
                trail,
                active: false,
                velocity: new THREE.Vector3(),
                life: 0,
                maxLife: 0,
                pulsePhase: Math.random() * Math.PI * 2
            };
        }

        const ambientBackgroundTraffic = {
            pool: Array.from({ length: RENDER_PROFILE.ambientShipPool }, createAmbientBackgroundShip),
            spawnTimer: MOBILE_MODE ? 2.4 : 1.6
        };

        function spawnAmbientBackgroundShip() {
            const ship = ambientBackgroundTraffic.pool.find((item) => !item.active);
            if (!ship) return;

            const side = Math.random() < 0.5 ? -1 : 1;
            const start = new THREE.Vector3(
                side * (14 + Math.random() * 18),
                THREE.MathUtils.randFloatSpread(5.4),
                -36 - Math.random() * 122
            );
            const direction = new THREE.Vector3(
                -side * THREE.MathUtils.randFloat(0.78, 1.1),
                THREE.MathUtils.randFloatSpread(0.22),
                THREE.MathUtils.randFloat(-0.08, 0.18)
            ).normalize();

            ship.active = true;
            ship.life = 0;
            ship.maxLife = 3.2 + Math.random() * 3.8;
            ship.velocity.copy(direction).multiplyScalar(3.4 + Math.random() * 5.8);
            ship.group.position.copy(start);
            ship.group.quaternion.setFromUnitVectors(forwardAxis, direction);
            ship.group.scale.setScalar(0.74 + Math.random() * 0.92);
            ship.group.visible = true;
            ship.hull.material.opacity = 0.84;
            ship.trail.material.opacity = 0.34;
        }

        function updateAmbientBackgroundShips(elapsedTime, deltaTime, backgroundVisibility, speedScale = 1, allowSpawn = true) {
            if (allowSpawn) {
                ambientBackgroundTraffic.spawnTimer -= deltaTime;
                if (ambientBackgroundTraffic.spawnTimer <= 0) {
                    spawnAmbientBackgroundShip();
                    ambientBackgroundTraffic.spawnTimer = MOBILE_MODE
                        ? 2.8 + Math.random() * 3.8
                        : 1.4 + Math.random() * 2.6;
                }
            }

            for (const ship of ambientBackgroundTraffic.pool) {
                if (!ship.active) continue;

                ship.life += deltaTime * speedScale;
                if (ship.life >= ship.maxLife) {
                    ship.active = false;
                    ship.group.visible = false;
                    continue;
                }

                ship.group.position.addScaledVector(ship.velocity, deltaTime * speedScale);
                ship.group.quaternion.setFromUnitVectors(forwardAxis, tempVectorA.copy(ship.velocity).normalize());

                const lifeT = ship.life / ship.maxLife;
                const fadeIn = Math.min(1, lifeT / 0.12);
                const fadeOut = lifeT > 0.76 ? 1 - (lifeT - 0.76) / 0.24 : 1;
                const pulse = 0.9 + Math.sin(elapsedTime * 3.2 + ship.pulsePhase) * 0.1;
                const fade = Math.max(0, fadeIn * fadeOut * pulse);
                const visibility = 0.18 + backgroundVisibility * 0.82;

                ship.hull.material.opacity = 0.9 * fade * visibility;
                ship.trail.material.opacity = 0.36 * fade * visibility;
                ship.trail.scale.x = 0.88 + Math.sin(elapsedTime * 8.2 + ship.pulsePhase) * 0.09;
                ship.trail.scale.y = 0.86 + Math.cos(elapsedTime * 6.4 + ship.pulsePhase) * 0.08;
            }
        }

        function seedDustParticle(positions, velocities, index, innerRadius, outerRadius, velocityScale, origin) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const sinPhi = Math.sin(phi);
            const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
            const i3 = index * 3;

            positions[i3] = origin.x + Math.cos(theta) * sinPhi * radius;
            positions[i3 + 1] = origin.y + Math.cos(phi) * radius;
            positions[i3 + 2] = origin.z + Math.sin(theta) * sinPhi * radius;

            velocities[i3] = THREE.MathUtils.randFloatSpread(velocityScale);
            velocities[i3 + 1] = THREE.MathUtils.randFloatSpread(velocityScale * 0.7);
            velocities[i3 + 2] = THREE.MathUtils.randFloatSpread(velocityScale);
        }

        function createSpaceDustLayer(options = {}) {
            const count = scaleCount(options.count ?? 240, 80);
            const innerRadius = options.innerRadius ?? 8;
            const outerRadius = options.outerRadius ?? 38;
            const driftSpeed = options.driftSpeed ?? 0.8;
            const twinkleSpeed = options.twinkleSpeed ?? 0.9;
            const velocityScale = options.velocityScale ?? 0.05;
            const origin = options.origin ?? new THREE.Vector3(0, 0, -14);

            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);
            const baseColors = new Float32Array(count * 3);
            const velocities = new Float32Array(count * 3);
            const phases = new Float32Array(count);
            const sparkles = new Float32Array(count);

            const cA = new THREE.Color(options.colorA ?? 0xfff3e7);
            const cB = new THREE.Color(options.colorB ?? 0xb4d6ff);

            for (let i = 0; i < count; i += 1) {
                const i3 = i * 3;
                seedDustParticle(positions, velocities, i, innerRadius, outerRadius, velocityScale, origin);

                const color = cA.clone().lerp(cB, Math.random());
                const intensity = 0.45 + Math.random() * 0.55;
                baseColors[i3] = color.r * intensity;
                baseColors[i3 + 1] = color.g * intensity;
                baseColors[i3 + 2] = color.b * intensity;
                colors[i3] = baseColors[i3];
                colors[i3 + 1] = baseColors[i3 + 1];
                colors[i3 + 2] = baseColors[i3 + 2];

                phases[i] = Math.random() * Math.PI * 2;
                sparkles[i] = Math.random();
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const material = new THREE.PointsMaterial({
                size: options.size ?? 0.08,
                sizeAttenuation: true,
                map: particleSprite,
                transparent: true,
                opacity: options.opacity ?? 0.28,
                blending: THREE.NormalBlending,
                depthWrite: false,
                vertexColors: true
            });

            const points = new THREE.Points(geometry, material);
            scene.add(points);

            return {
                points,
                positionsAttribute: geometry.getAttribute('position'),
                colorsAttribute: geometry.getAttribute('color'),
                baseColors,
                velocities,
                phases,
                sparkles,
                origin: origin.clone(),
                innerRadiusSq: innerRadius * innerRadius,
                outerRadiusSq: outerRadius * outerRadius,
                twinkleSpeed,
                driftSpeed,
                swirlSpeed: options.swirlSpeed ?? THREE.MathUtils.randFloat(0.003, 0.013),
                pulseSpeed: options.pulseSpeed ?? THREE.MathUtils.randFloat(0.5, 1.2),
                phase: Math.random() * Math.PI * 2,
                velocityScale,
                baseOpacity: material.opacity
            };
        }

        const spaceDustLayers = [
            createSpaceDustLayer({
                count: 320,
                innerRadius: 8,
                outerRadius: 38,
                size: 0.072,
                opacity: 0.34,
                driftSpeed: 1,
                twinkleSpeed: 1.25,
                velocityScale: 0.06,
                origin: new THREE.Vector3(0, 0, -10),
                colorA: 0xfff6ea,
                colorB: 0xc8ddff
            }),
            createSpaceDustLayer({
                count: 220,
                innerRadius: 16,
                outerRadius: 62,
                size: 0.11,
                opacity: 0.22,
                driftSpeed: 0.62,
                twinkleSpeed: 0.84,
                velocityScale: 0.04,
                origin: new THREE.Vector3(0, 0, -26),
                colorA: 0xf3ebff,
                colorB: 0x9ecbff
            })
        ];

        function createAsteroidBelt(options = {}) {
            const count = scaleCount(options.count ?? 260, 90, 'instance');
            const innerRadius = options.innerRadius ?? 42;
            const outerRadius = options.outerRadius ?? 58;
            const thickness = options.thickness ?? 2.4;
            const minSize = options.minSize ?? 0.05;
            const maxSize = options.maxSize ?? 0.24;

            const geometry = new THREE.DodecahedronGeometry(1, 0);
            const material = new THREE.MeshBasicMaterial({
                color: options.color ?? 0xffffff,
                transparent: true,
                opacity: options.opacity ?? 0.82,
                depthWrite: false,
                toneMapped: false
            });

            const mesh = new THREE.InstancedMesh(geometry, material, count);
            mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
            const dummy = new THREE.Object3D();
            const tintA = new THREE.Color(options.colorA ?? 0xf8eaff);
            const tintB = new THREE.Color(options.colorB ?? 0xd9c7ff);
            const asteroidColor = new THREE.Color();

            for (let i = 0; i < count; i += 1) {
                const angle = Math.random() * Math.PI * 2;
                const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
                const height = THREE.MathUtils.randFloatSpread(thickness);
                const size = minSize + Math.random() * (maxSize - minSize);

                dummy.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
                dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                dummy.scale.set(
                    size * (0.76 + Math.random() * 0.56),
                    size * (0.74 + Math.random() * 0.54),
                    size * (0.76 + Math.random() * 0.56)
                );
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);

                asteroidColor
                    .copy(tintA)
                    .lerp(tintB, Math.random())
                    .multiplyScalar(1.1 + Math.random() * 0.32);
                mesh.setColorAt(i, asteroidColor);
            }

            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) {
                mesh.instanceColor.needsUpdate = true;
            }

            const group = new THREE.Group();
            group.position.copy(sunAnchor.position);
            group.rotation.set(options.tiltX ?? 0.4, options.phase ?? 0, options.tiltZ ?? 0.08);
            group.add(mesh);
            scene.add(group);

            return {
                group,
                mesh,
                baseTiltZ: group.rotation.z,
                wobbleSpeed: options.wobbleSpeed ?? THREE.MathUtils.randFloat(0.12, 0.22),
                wobblePhase: Math.random() * Math.PI * 2,
                rotationSpeed: options.rotationSpeed ?? 0.017,
                twinkleSpeed: options.twinkleSpeed ?? THREE.MathUtils.randFloat(0.52, 1.04),
                phase: Math.random() * Math.PI * 2,
                baseOpacity: material.opacity
            };
        }

        const asteroidBelts = [
            createAsteroidBelt({
                count: 360,
                innerRadius: 41,
                outerRadius: 56,
                thickness: 2.8,
                minSize: 0.045,
                maxSize: 0.24,
                opacity: 0.86,
                rotationSpeed: 0.017,
                tiltX: 0.42,
                tiltZ: 0.09,
                colorA: 0xfaefff,
                colorB: 0xdccfff
            }),
            createAsteroidBelt({
                count: 210,
                innerRadius: 56,
                outerRadius: 70,
                thickness: 3.4,
                minSize: 0.05,
                maxSize: 0.28,
                opacity: 0.72,
                rotationSpeed: -0.01,
                tiltX: 0.37,
                tiltZ: 0.04,
                colorA: 0xf0e6ff,
                colorB: 0xcbc0ea
            })
        ];

        function updateNebulaLayers(elapsedTime, backgroundVisibility) {
            for (const layer of nebulaLayers) {
                const driftX = Math.sin(elapsedTime * layer.driftSpeed + layer.phase) * layer.driftAmplitude;
                const driftY = Math.cos(elapsedTime * layer.driftSpeed * 0.74 + layer.phase * 0.62) * (layer.driftAmplitude * 0.45);
                const pulse = 0.9 + Math.sin(elapsedTime * layer.pulseSpeed + layer.phase) * 0.1;
                const parallaxX = camera.position.x * 0.42;
                const parallaxY = camera.position.y * 0.34;

                layer.sprite.position.x = layer.basePosition.x + driftX + parallaxX;
                layer.sprite.position.y = layer.basePosition.y + driftY + parallaxY;
                layer.sprite.material.rotation = layer.baseRotation + elapsedTime * layer.rotationSpeed;
                layer.sprite.scale.set(
                    layer.baseScaleX * (0.96 + pulse * 0.08),
                    layer.baseScaleY * (0.96 + pulse * 0.08),
                    1
                );
                layer.sprite.material.opacity = layer.baseOpacity * pulse * (0.26 + backgroundVisibility * 0.74);
            }
        }

        function updateSpaceDustLayers(elapsedTime, deltaTime, backgroundVisibility) {
            const simulationStride = performanceState.lowQuality
                ? (runtimePerfState.ultraLow
                    ? Math.max(RENDER_PROFILE.dustSimStrideLow + 1, RENDER_PROFILE.ultraLowBackgroundStride)
                    : RENDER_PROFILE.dustSimStrideLow)
                : 1;
            const colorStride = performanceState.lowQuality
                ? (runtimePerfState.ultraLow
                    ? Math.max(RENDER_PROFILE.dustColorStrideLow + 2, RENDER_PROFILE.ultraLowBackgroundStride * 2)
                    : RENDER_PROFILE.dustColorStrideLow)
                : 2;
            const shouldSimulate = !performanceState.lowQuality || performanceState.frameIndex % simulationStride === 0;
            const shouldUpdateDustColors = performanceState.frameIndex % colorStride === 0;

            for (const layer of spaceDustLayers) {
                const positions = layer.positionsAttribute.array;
                const colors = layer.colorsAttribute.array;
                const baseColors = layer.baseColors;
                const velocities = layer.velocities;
                const phases = layer.phases;
                const sparkles = layer.sparkles;

                if (shouldSimulate) {
                    for (let i = 0; i < phases.length; i += 1) {
                        const i3 = i * 3;
                        positions[i3] += velocities[i3] * deltaTime * layer.driftSpeed;
                        positions[i3 + 1] += velocities[i3 + 1] * deltaTime * layer.driftSpeed;
                        positions[i3 + 2] += velocities[i3 + 2] * deltaTime * layer.driftSpeed;

                        const relX = positions[i3] - layer.origin.x;
                        const relY = positions[i3 + 1] - layer.origin.y;
                        const relZ = positions[i3 + 2] - layer.origin.z;
                        const relDistanceSq = relX * relX + relY * relY + relZ * relZ;

                        if (relDistanceSq < layer.innerRadiusSq || relDistanceSq > layer.outerRadiusSq) {
                            seedDustParticle(
                                positions,
                                velocities,
                                i,
                                Math.sqrt(layer.innerRadiusSq),
                                Math.sqrt(layer.outerRadiusSq),
                                layer.velocityScale,
                                layer.origin
                            );
                        }
                    }

                    layer.positionsAttribute.needsUpdate = true;
                }

                if (shouldUpdateDustColors) {
                    for (let i = 0; i < phases.length; i += 1) {
                        const i3 = i * 3;
                        const sunDx = positions[i3] - sunAnchor.position.x;
                        const sunDy = positions[i3 + 1] - sunAnchor.position.y;
                        const sunDz = positions[i3 + 2] - sunAnchor.position.z;
                        const sunDistance = Math.sqrt(sunDx * sunDx + sunDy * sunDy + sunDz * sunDz);
                        const sunGlow = 1 - THREE.MathUtils.smoothstep(sunDistance, 18, 92);

                        const twinkle = 0.64 + Math.sin(elapsedTime * layer.twinkleSpeed + phases[i]) * 0.36;
                        const sparkle = twinkle * (0.58 + sunGlow * (0.5 + sparkles[i] * 0.9));

                        colors[i3] = baseColors[i3] * sparkle;
                        colors[i3 + 1] = baseColors[i3 + 1] * sparkle;
                        colors[i3 + 2] = baseColors[i3 + 2] * sparkle;
                    }

                    layer.colorsAttribute.needsUpdate = true;
                }

                const pulse = 0.9 + Math.sin(elapsedTime * layer.pulseSpeed + layer.phase) * 0.1;
                layer.points.material.opacity = layer.baseOpacity * pulse * (0.22 + backgroundVisibility * 0.78);
                layer.points.rotation.y += layer.swirlSpeed * deltaTime;
                layer.points.rotation.x += layer.swirlSpeed * 0.3 * deltaTime;
            }
        }

        function updateAsteroidBelts(elapsedTime, deltaTime, backgroundVisibility, speedScale = 1) {
            for (const belt of asteroidBelts) {
                belt.group.rotation.y += belt.rotationSpeed * deltaTime * speedScale;
                belt.group.rotation.z = belt.baseTiltZ + Math.sin(elapsedTime * belt.wobbleSpeed + belt.wobblePhase) * 0.017;
                const pulse = 0.9 + Math.sin(elapsedTime * belt.twinkleSpeed + belt.phase) * 0.1;
                belt.mesh.material.opacity = belt.baseOpacity * pulse * (0.42 + backgroundVisibility * 0.58);
            }
        }

        function createComet() {
            const group = new THREE.Group();

            const head = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, scaleSegments(10, 6), scaleSegments(10, 6)),
                new THREE.MeshBasicMaterial({
                    color: 0xfff3d0,
                    transparent: true,
                    opacity: 0.95,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );

            const trail = new THREE.Mesh(
                new THREE.PlaneGeometry(2.6, 0.36),
                new THREE.MeshBasicMaterial({
                    map: cometTrailTexture,
                    transparent: true,
                    opacity: 0.72,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide
                })
            );
            trail.position.x = -1.1;

            group.add(head, trail);
            group.visible = false;
            scene.add(group);

            return {
                group,
                head,
                trail,
                active: false,
                velocity: new THREE.Vector3(),
                life: 0,
                maxLife: 0
            };
        }

        const cometState = {
            pool: Array.from({ length: RENDER_PROFILE.cometPool }, createComet),
            spawnTimer: MOBILE_MODE ? 4.8 : 3.2
        };

        function spawnComet() {
            const comet = cometState.pool.find((item) => !item.active);
            if (!comet) return;

            const side = Math.random() < 0.5 ? -1 : 1;
            const start = new THREE.Vector3(
                sunAnchor.position.x + side * (48 + Math.random() * 26),
                sunAnchor.position.y + (Math.random() - 0.5) * 24,
                sunAnchor.position.z - (28 + Math.random() * 72)
            );

            const direction = new THREE.Vector3(
                -side * (0.94 + Math.random() * 0.4),
                (Math.random() - 0.5) * 0.16,
                0.15 + Math.random() * 0.22
            ).normalize();

            comet.active = true;
            comet.life = 0;
            comet.maxLife = 1.6 + Math.random() * 1.7;
            comet.velocity.copy(direction).multiplyScalar(15 + Math.random() * 12);
            comet.group.position.copy(start);
            comet.group.quaternion.setFromUnitVectors(forwardAxis, direction);
            comet.group.visible = true;
            comet.head.material.opacity = 0.9;
            comet.trail.material.opacity = 0.7;
        }

        const sunlight = new THREE.PointLight(0xffd394, 39, 420, 1.15);
        sunlight.position.copy(sunAnchor.position);
        solarSystem.add(sunlight);

        const sunState = {
            root: null,
            spinSpeed: 0.12
        };

        const planetPivots = [];
        function addPlanet(options) {
            const pivot = new THREE.Group();
            pivot.position.copy(sunAnchor.position);
            pivot.rotation.x = options.tiltOrbit || 0;
            pivot.rotation.y = options.orbitPhase || 0;
            solarSystem.add(pivot);

            const textureType = options.textureType || 'rocky';
            const colorMap = createPlanetTexture(textureType, 1536, options.textureStyle || {});
            const roughnessMap = createPlanetRoughnessTexture(1536);
            colorMap.repeat.set(options.textureRepeatX ?? 1, options.textureRepeatY ?? 1);
            colorMap.offset.set(options.textureOffsetX ?? 0, options.textureOffsetY ?? 0);
            roughnessMap.repeat.copy(colorMap.repeat);
            roughnessMap.offset.copy(colorMap.offset);

            const atmosphereColors = {
                rocky: 0xa6b6ff,
                dry: 0xffbf84,
                earthy: 0x86c9ff,
                gasWarm: 0xffbc84,
                gasCold: 0x8cc6ff,
                ice: 0xbde6ff,
                volcanic: 0xff8f62
            };
            const atmosphereColor = options.atmosphereColor || atmosphereColors[textureType] || 0xaec0ff;
            const atmosphereOpacity = options.atmosphereOpacity ?? 0.09;

            const planetMaterial = new THREE.MeshPhysicalMaterial({
                color: options.surfaceTint ?? 0xffffff,
                map: colorMap,
                roughnessMap,
                normalMap: roughnessMap,
                bumpMap: roughnessMap,
                bumpScale: options.bumpScale ?? 0.075,
                normalScale: options.normalScale || new THREE.Vector2(0.28, 0.28),
                roughness: options.roughness ?? 0.64,
                metalness: options.metalness ?? 0.015,
                emissive: options.emissive ?? 0x050608,
                emissiveIntensity: options.emissiveIntensity ?? 0.06,
                envMapIntensity: options.envMapIntensity ?? 0.9,
                clearcoat: options.clearcoat ?? 0.18,
                clearcoatRoughness: options.clearcoatRoughness ?? 0.58
            });

            // Keep planet detail visible on the night side so it doesn't look split in half.
            planetMaterial.emissiveMap = colorMap;
            planetMaterial.emissive.setHex(0xffffff);
            planetMaterial.emissiveIntensity = Math.max(planetMaterial.emissiveIntensity, options.baseSelfLight ?? 0.34);

            const planet = new THREE.Mesh(
                new THREE.SphereGeometry(options.radius, scaleSegments(56, 22), scaleSegments(56, 22)),
                planetMaterial
            );

            planet.position.set(options.orbitRadius, 0, 0);
            planet.rotation.z = options.tilt || 0;
            pivot.add(planet);

            const atmosphere = new THREE.Mesh(
                new THREE.SphereGeometry(options.radius * 1.085, scaleSegments(36, 14), scaleSegments(36, 14)),
                new THREE.MeshBasicMaterial({
                    color: atmosphereColor,
                    transparent: true,
                    opacity: atmosphereOpacity,
                    blending: THREE.AdditiveBlending,
                    side: THREE.BackSide,
                    depthWrite: false
                })
            );
            planet.add(atmosphere);

            let cloudLayer = null;
            if (options.clouds) {
                const cloudTexture = createPlanetCloudTexture({
                    size: options.clouds.size ?? 1024,
                    cloudCount: options.clouds.count ?? 170,
                    palette: options.clouds.palette
                });
                cloudTexture.repeat.set(options.clouds.repeatX ?? 1.1, options.clouds.repeatY ?? 1);

                cloudLayer = new THREE.Mesh(
                    new THREE.SphereGeometry(
                        options.radius * (options.clouds.radiusScale ?? 1.03),
                        scaleSegments(40, 16),
                        scaleSegments(40, 16)
                    ),
                    new THREE.MeshBasicMaterial({
                        map: cloudTexture,
                        color: options.clouds.tint ?? 0xffffff,
                        transparent: true,
                        opacity: options.clouds.opacity ?? 0.17,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false
                    })
                );
                cloudLayer.rotation.z = options.clouds.tilt ?? 0;
                cloudLayer.userData.baseOpacity = cloudLayer.material.opacity;
                planet.add(cloudLayer);
            }

            let ring = null;
            if (options.ring) {
                const ringTexture = createPlanetRingTexture({
                    colorA: options.ring.colorA ?? options.ring.color ?? 0xd8c5a4,
                    colorB: options.ring.colorB ?? 0x8d7e66,
                    opacityScale: options.ring.opacityScale ?? 1
                });

                ring = new THREE.Mesh(
                    new THREE.RingGeometry(options.ring.inner, options.ring.outer, scaleSegments(96, 36)),
                    new THREE.MeshStandardMaterial({
                        map: ringTexture,
                        alphaMap: ringTexture,
                        color: options.ring.color ?? 0xffffff,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: options.ring.opacity ?? 0.74,
                        roughness: 0.9,
                        metalness: 0,
                        depthWrite: false
                    })
                );
                ring.rotation.x = options.ring.tiltX ?? Math.PI / 2;
                ring.rotation.z = options.ring.tiltZ ?? 0;
                ring.userData.baseOpacity = ring.material.opacity;
                planet.add(ring);
            }

            planetPivots.push({
                pivot,
                planet,
                atmosphere,
                cloudLayer,
                ring,
                orbitSpeed: options.orbitSpeed,
                spinSpeed: options.spinSpeed,
                mapDriftX: options.mapDriftX ?? 0,
                cloudSpinSpeed: options.clouds?.spinSpeed ?? 0,
                ringSpinSpeed: options.ring?.spinSpeed ?? 0,
                atmospherePulse: options.atmospherePulse ?? 1,
                baseAtmosphereOpacity: atmosphereOpacity,
                emissivePulse: options.emissivePulse ?? 0,
                baseEmissiveIntensity: planetMaterial.emissiveIntensity
            });
        }

        function applyPhotoTextureToPlanet(planetRecord, textureUrl, options = {}) {
            if (!planetRecord?.planet?.material || !textureUrl) {
                return;
            }

            const completeStartupTask = registerStartupLoadTask();
            sceneTextureLoader.load(
                textureUrl,
                (photoTexture) => {
                    completeStartupTask();

                    const repeatX = options.repeatX ?? 1;
                    const repeatY = options.repeatY ?? 1;
                    const offsetX = options.offsetX ?? 0;
                    const offsetY = options.offsetY ?? 0;

                    photoTexture.colorSpace = THREE.SRGBColorSpace;
                    photoTexture.wrapS = THREE.RepeatWrapping;
                    photoTexture.wrapT = THREE.RepeatWrapping;
                    photoTexture.repeat.set(repeatX, repeatY);
                    photoTexture.offset.set(offsetX, offsetY);
                    photoTexture.anisotropy = maxSceneTextureAnisotropy;

                    const material = planetRecord.planet.material;
                    material.map = photoTexture;
                    material.emissiveMap = photoTexture;

                    if (material.roughnessMap) {
                        material.roughnessMap.repeat.set(repeatX, repeatY);
                        material.roughnessMap.offset.set(offsetX, offsetY);
                    }

                    if (Number.isFinite(options.mapDriftX)) {
                        planetRecord.mapDriftX = options.mapDriftX;
                    }

                    material.needsUpdate = true;
                },
                undefined,
                () => {
                    completeStartupTask();
                    console.warn('Не удалось загрузить фото-текстуру планеты:', textureUrl);
                }
            );
        }

        addPlanet({
            orbitRadius: 6.2,
            radius: 0.31,
            textureType: 'rocky',
            textureStyle: { seed: 11, craterCount: 124, stripeStrength: 0.09 },
            surfaceTint: 0xcdb49a,
            orbitSpeed: 0.24,
            spinSpeed: 0.012,
            roughness: 0.92,
            bumpScale: 0.11,
            tilt: 0.03,
            orbitPhase: 0.32,
            atmosphereOpacity: 0.032,
            emissive: 0x17110d,
            emissiveIntensity: 0.03
        });

        addPlanet({
            orbitRadius: 8.3,
            radius: 0.44,
            textureType: 'dry',
            textureStyle: { seed: 27, craterCount: 64, stripeStrength: 0.18 },
            surfaceTint: 0xffd094,
            orbitSpeed: 0.2,
            spinSpeed: 0.01,
            roughness: 0.8,
            tilt: 0.08,
            orbitPhase: 1.18,
            mapDriftX: 0.0024,
            clouds: {
                opacity: 0.1,
                count: 110,
                palette: ['255,233,204', '255,216,176'],
                spinSpeed: 0.0012,
                tint: 0xfff3dc,
                radiusScale: 1.025
            },
            emissive: 0x23160d,
            emissiveIntensity: 0.045,
            emissivePulse: 0.008
        });

        addPlanet({
            orbitRadius: 13.8,
            radius: 0.39,
            textureType: 'volcanic',
            textureStyle: { seed: 43, craterCount: 56, fissureCount: 34, stripeStrength: 0.2 },
            surfaceTint: 0xff9666,
            orbitSpeed: 0.13,
            spinSpeed: 0.018,
            roughness: 0.72,
            tilt: 0.17,
            orbitPhase: 2.74,
            atmosphereOpacity: 0.06,
            atmosphereColor: 0xff9a70,
            emissive: 0x4a1f12,
            emissiveIntensity: 0.1,
            emissivePulse: 0.014
        });

        addPlanet({
            orbitRadius: 18.5,
            radius: 0.98,
            textureType: 'earthy',
            textureStyle: {
                seed: 58,
                continentCount: 38,
                stripeStrength: 0.1,
                palette: ['#1e4f86', '#2f88b5', '#3dbf8e', '#1f3f70']
            },
            surfaceTint: 0xaedfff,
            orbitSpeed: 0.08,
            spinSpeed: 0.03,
            roughness: 0.7,
            tiltOrbit: 0.03,
            tilt: 0.06,
            orbitPhase: 4.12,
            mapDriftX: 0.0022,
            textureRepeatY: 1.08,
            clouds: {
                opacity: 0.19,
                count: 220,
                palette: ['245,251,255', '217,238,255'],
                spinSpeed: 0.0013,
                radiusScale: 1.04,
                tint: 0xdaf0ff
            },
            atmosphereOpacity: 0.15,
            atmosphereColor: 0x86ceff,
            emissive: 0x132742,
            emissiveIntensity: 0.045,
            emissivePulse: 0.007,
            clearcoat: 0.1,
            clearcoatRoughness: 0.72
        });

        addPlanet({
            orbitRadius: 24.5,
            radius: 0.86,
            textureType: 'gasCold',
            textureStyle: {
                seed: 76,
                bandFrequency: 23,
                stripeStrength: 0.33,
                stormCount: 2,
                palette: ['#425d96', '#5f85c4', '#8db0e4', '#4e6eab']
            },
            surfaceTint: 0xd5e4ff,
            orbitSpeed: 0.055,
            spinSpeed: 0.026,
            roughness: 0.68,
            tilt: 0.48,
            orbitPhase: 5.06,
            mapDriftX: 0.0031,
            textureRepeatY: 1.34,
            ring: {
                inner: 1.25,
                outer: 2.15,
                color: 0xd7d8f2,
                colorA: 0xd7e2ff,
                colorB: 0x8a93bf,
                tiltX: Math.PI * 0.54,
                tiltZ: 0.16,
                opacity: 0.72,
                spinSpeed: 0.0005,
                opacityScale: 0.92
            },
            clouds: {
                opacity: 0.1,
                count: 130,
                palette: ['222,238,255', '201,228,255'],
                spinSpeed: 0.001,
                radiusScale: 1.036,
                tint: 0xdfeeff
            },
            atmosphereOpacity: 0.13,
            atmosphereColor: 0xa9d4ff,
            emissive: 0x162442,
            emissiveIntensity: 0.042,
            clearcoat: 0.12,
            clearcoatRoughness: 0.68
        });

        addPlanet({
            orbitRadius: 30.8,
            radius: 0.72,
            textureType: 'ice',
            textureStyle: { seed: 93, crackCount: 42, stripeStrength: 0.16 },
            surfaceTint: 0xb9eeff,
            orbitSpeed: 0.038,
            spinSpeed: 0.03,
            roughness: 0.54,
            tilt: 0.4,
            orbitPhase: 0.94,
            atmosphereOpacity: 0.15,
            mapDriftX: -0.0016,
            clouds: {
                opacity: 0.08,
                count: 95,
                palette: ['225,243,255', '191,230,255'],
                spinSpeed: 0.0009,
                radiusScale: 1.028,
                tint: 0xcfefff
            },
            emissive: 0x102232,
            emissiveIntensity: 0.05,
            emissivePulse: 0.006
        });

        addPlanet({
            orbitRadius: 36.7,
            radius: 0.69,
            textureType: 'gasCold',
            textureStyle: {
                seed: 121,
                bandFrequency: 32,
                stripeStrength: 0.34,
                stormCount: 2,
                palette: ['#3f4f91', '#616cb8', '#8994df', '#5963ab']
            },
            surfaceTint: 0xb4baff,
            orbitSpeed: 0.03,
            spinSpeed: 0.028,
            roughness: 0.62,
            tilt: 0.52,
            orbitPhase: 3.64,
            mapDriftX: 0.0032,
            textureRepeatY: 1.45,
            atmosphereOpacity: 0.12,
            atmosphereColor: 0xb7c6ff,
            emissive: 0x1a1e46,
            emissiveIntensity: 0.058,
            emissivePulse: 0.009,
            clearcoat: 0.11,
            clearcoatRoughness: 0.7
        });

        function applyMainSitePhotoPlanetTextures() {
            const [portfolioMap, storeCardMap, sketchMap, portraitMap] = mainSitePhotoAssets.planetSurfaceMaps;

            applyPhotoTextureToPlanet(planetPivots[1], portfolioMap, {
                repeatX: 1.12,
                repeatY: 1.04,
                mapDriftX: 0.0018
            });

            applyPhotoTextureToPlanet(planetPivots[3], storeCardMap, {
                repeatX: 1,
                repeatY: 1.08,
                offsetX: 0.04,
                mapDriftX: 0.0016
            });

            applyPhotoTextureToPlanet(planetPivots[4], sketchMap, {
                repeatX: 1.16,
                repeatY: 1.12,
                mapDriftX: 0.0022
            });

            applyPhotoTextureToPlanet(planetPivots[6], portraitMap, {
                repeatX: 1.4,
                repeatY: 1.06,
                offsetX: 0.08,
                mapDriftX: -0.0012
            });
        }

        const earthOrbitState = {
            pivot: new THREE.Group(),
            mount: new THREE.Group(),
            root: null,
            moonPivot: null,
            moon: null,
            orbitSpeed: 0.16,
            spinSpeed: 0.022
        };
        earthOrbitState.pivot.position.copy(sunAnchor.position);
        earthOrbitState.mount.position.set(10.9, 0, 0);
        earthOrbitState.mount.rotation.z = 0.38;
        earthOrbitState.pivot.rotation.y = 2.22;
        earthOrbitState.pivot.add(earthOrbitState.mount);
        solarSystem.add(earthOrbitState.pivot);

        const {
            createCrystalMaterial,
            createCrystalGlowShell,
            attachCrystalGlowShell,
            createCrackShellMaterial,
            createGlassShardGeometry,
            createGlassCrackOverlay,
            createProceduralCrystal
        } = createCrystalFactories({
            THREE,
            ConvexGeometry,
            scaleSegments,
            crystalMicroTexture
        });

        function updateCrystalShells(elapsedTime, crackProgress) {
            const sunWorldPosition = sunAnchor.getWorldPosition(tempVectorA);

            activeCrystal?.traverse((node) => {
                if (!node.userData?.isCrystalShell) return;
                const shellWorldPosition = node.getWorldPosition(tempVectorB);
                const uniforms = node.material.uniforms;
                uniforms.uTime.value = elapsedTime;
                uniforms.uCrackProgress.value = crackProgress;
                uniforms.uSunDirection.value.copy(sunWorldPosition).sub(shellWorldPosition).normalize();
                uniforms.uGlowStrength.value = 0.95 + crackProgress * 0.55;
            });
        }

        function createOrbitEarthFallback() {
            const group = new THREE.Group();

            const planet = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, scaleSegments(48, 18), scaleSegments(48, 18)),
                new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    map: earthFallbackTexture,
                    roughnessMap: earthFallbackRoughness,
                    roughness: 0.8,
                    metalness: 0,
                    envMapIntensity: 0.9
                })
            );

            const cloudShell = new THREE.Mesh(
                new THREE.SphereGeometry(0.53, scaleSegments(48, 18), scaleSegments(48, 18)),
                new THREE.MeshPhysicalMaterial({
                    color: 0xd6eeff,
                    transparent: true,
                    opacity: 0.1,
                    roughness: 0.42,
                    metalness: 0,
                    clearcoat: 0.08,
                    transmission: 0.04
                })
            );

            group.add(planet, cloudShell);
            return group;
        }

        function attachMoonToEarth(root) {
            if (earthOrbitState.moonPivot) {
                earthOrbitState.moonPivot.parent?.remove(earthOrbitState.moonPivot);
            }

            const moonPivot = new THREE.Group();
            const moon = new THREE.Mesh(
                new THREE.SphereGeometry(0.17, scaleSegments(28, 12), scaleSegments(28, 12)),
                new THREE.MeshStandardMaterial({
                    color: 0xf7f4ed,
                    map: moonFallbackTexture,
                    roughnessMap: moonFallbackRoughness,
                    normalMap: moonFallbackRoughness,
                    normalScale: new THREE.Vector2(0.25, 0.25),
                    roughness: 0.9,
                    metalness: 0,
                    envMapIntensity: 0.82,
                    emissive: new THREE.Color(0x2e3350),
                    emissiveIntensity: 0.09
                })
            );
            moon.position.set(1.22, 0.03, 0.22);

            const moonGlow = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, scaleSegments(22, 10), scaleSegments(22, 10)),
                new THREE.MeshBasicMaterial({
                    color: 0xaec5ff,
                    transparent: true,
                    opacity: 0.16,
                    blending: THREE.AdditiveBlending,
                    side: THREE.BackSide,
                    depthWrite: false
                })
            );

            moon.add(moonGlow);
            moonPivot.add(moon);
            root.add(moonPivot);

            earthOrbitState.moonPivot = moonPivot;
            earthOrbitState.moon = moon;
        }

        function applyCrystalLookToModel(modelRoot) {
            modelRoot.traverse((node) => {
                if (!node.isMesh) return;
                if (node.geometry?.attributes?.position) node.geometry.computeVertexNormals();
                node.material = createCrystalMaterial({ flatShading: false, side: THREE.DoubleSide, roughness: 0.035, opacity: 0.62, thickness: 2.1 });
                attachCrystalGlowShell(node);
            });
        }

        function applyEarthLookToModel(modelRoot) {
            modelRoot.traverse((node) => {
                if (!node.isMesh) return;
                node.castShadow = true;
                node.receiveShadow = true;

                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach((material) => {
                    if (!material) return;
                    if ('color' in material) material.color = new THREE.Color(0xffffff);
                    if ('map' in material && !material.map) material.map = earthFallbackTexture;
                    if ('roughnessMap' in material && !material.roughnessMap) material.roughnessMap = earthFallbackRoughness;
                    if ('metalness' in material) material.metalness = 0;
                    if ('roughness' in material) material.roughness = Math.min(material.roughness ?? 1, 0.92);
                    if ('envMapIntensity' in material) material.envMapIntensity = Math.min(material.envMapIntensity ?? 1, 1.05);
                    if ('emissive' in material) {
                        material.emissive = new THREE.Color(0x000000);
                        material.emissiveIntensity = 0;
                    }
                    material.needsUpdate = true;
                });
            });
        }

        function normalizeModelTransform(modelRoot, options = {}) {
            const box = new THREE.Box3().setFromObject(modelRoot);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            box.getCenter(center);
            box.getSize(size);
            modelRoot.position.sub(center);
            const maxSize = Math.max(size.x, size.y, size.z) || 1;
            const targetHeight = options.targetHeight ?? 4.8;
            const scale = targetHeight / maxSize;
            modelRoot.scale.setScalar(scale);
            modelRoot.rotation.x = options.rotationX ?? 0;
            modelRoot.rotation.y = options.rotationY ?? 0.35;
            modelRoot.rotation.z = options.rotationZ ?? -0.04;
        }

        function normalizeOrbitEarthTransform(modelRoot) {
            const box = new THREE.Box3().setFromObject(modelRoot);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            box.getCenter(center);
            box.getSize(size);
            modelRoot.position.sub(center);

            const maxSize = Math.max(size.x, size.y, size.z) || 1;
            const targetSize = 1.0;
            modelRoot.scale.setScalar(targetSize / maxSize);
            modelRoot.rotation.y = 0.2;
            modelRoot.rotation.z = 0;
        }

        function setOrbitEarthModel(modelRoot) {
            if (earthOrbitState.root) {
                earthOrbitState.mount.remove(earthOrbitState.root);
                disposeObject3D(earthOrbitState.root);
            }

            applyEarthLookToModel(modelRoot);
            normalizeOrbitEarthTransform(modelRoot);
            earthOrbitState.mount.add(modelRoot);
            earthOrbitState.root = modelRoot;
            attachMoonToEarth(modelRoot);
        }

        const shipAnchor = new THREE.Group();
        const shipPivot = new THREE.Group();
        const shipModelMount = new THREE.Group();
        const shipTrailPivot = new THREE.Group();
        shipAnchor.visible = false;
        shipPivot.add(shipModelMount);
        shipAnchor.add(shipPivot, shipTrailPivot);
        scene.add(shipAnchor);

        const shipState = {
            root: null,
            mixer: null,
            actions: [],
            bodyOffsetY: 0,
            engineLights: [],
            engineTrails: [],
            baseRotation: new THREE.Euler(Math.PI, 0, -Math.PI * 0.5),
            materialBases: new WeakMap(),
            silhouette: 0
        };

        let shatterWarmupMesh = null;

        function normalizeShipTransform(modelRoot) {
            const box = new THREE.Box3().setFromObject(modelRoot);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            box.getCenter(center);
            box.getSize(size);
            modelRoot.position.sub(center);

            const maxSize = Math.max(size.x, size.y, size.z) || 1;
            const targetSize = 1.1;
            modelRoot.scale.setScalar(targetSize / maxSize);
            modelRoot.rotation.copy(shipState.baseRotation);

            const scaledSize = size.clone().multiplyScalar(targetSize / maxSize);
            shipState.bodyOffsetY = scaledSize.y * 0.04;
        }

        function normalizeSunTransform(modelRoot) {
            const box = new THREE.Box3().setFromObject(modelRoot);
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            box.getCenter(center);
            box.getSize(size);
            modelRoot.position.sub(center);

            const maxSize = Math.max(size.x, size.y, size.z) || 1;
            const targetSize = 4.6;
            modelRoot.scale.setScalar(targetSize / maxSize);
            modelRoot.rotation.y = -0.18;
            modelRoot.rotation.x = 0.08;
        }

        function enhanceSunLook(modelRoot) {
            modelRoot.traverse((node) => {
                if (!node.isMesh) return;
                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach((material) => {
                    if (!material) return;
                    if ('metalness' in material) material.metalness = Math.min(material.metalness ?? 0, 0.08);
                    if ('roughness' in material) material.roughness = Math.min(material.roughness ?? 1, 0.72);
                    if ('envMapIntensity' in material) material.envMapIntensity = Math.max(material.envMapIntensity ?? 1, 1.6);
                    if ('emissive' in material) {
                        material.emissive = new THREE.Color(0xffb347);
                        material.emissiveIntensity = Math.max(material.emissiveIntensity ?? 0, 1.15);
                    }
                    material.needsUpdate = true;
                });
            });
        }

        function captureShipMaterialBase(material) {
            if (!material || shipState.materialBases.has(material)) {
                return;
            }

            shipState.materialBases.set(material, {
                color: material.color?.clone?.() ?? null,
                emissive: material.emissive?.clone?.() ?? null,
                emissiveIntensity: typeof material.emissiveIntensity === 'number' ? material.emissiveIntensity : null,
                metalness: typeof material.metalness === 'number' ? material.metalness : null,
                roughness: typeof material.roughness === 'number' ? material.roughness : null,
                envMapIntensity: typeof material.envMapIntensity === 'number' ? material.envMapIntensity : null
            });
        }

        function setShipSilhouette(strength) {
            const amount = clamp01(strength);
            shipState.silhouette = amount;

            if (!shipState.root) {
                return;
            }

            shipState.root.traverse((node) => {
                if (!node.isMesh) return;
                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach((material) => {
                    if (!material) return;
                    captureShipMaterialBase(material);
                    const base = shipState.materialBases.get(material);
                    if (!base) return;

                    if (base.color && 'color' in material) {
                        material.color.copy(base.color).lerp(silhouetteBodyColor, amount);
                    }
                    if (base.emissive && 'emissive' in material) {
                        material.emissive.copy(base.emissive).lerp(silhouetteEmissiveColor, amount);
                    }
                    if (typeof base.emissiveIntensity === 'number' && 'emissiveIntensity' in material) {
                        material.emissiveIntensity = THREE.MathUtils.lerp(base.emissiveIntensity, 0.04, amount);
                    }
                    if (typeof base.metalness === 'number' && 'metalness' in material) {
                        material.metalness = THREE.MathUtils.lerp(base.metalness, 0.34, amount);
                    }
                    if (typeof base.roughness === 'number' && 'roughness' in material) {
                        material.roughness = THREE.MathUtils.lerp(base.roughness, 0.86, amount);
                    }
                    if (typeof base.envMapIntensity === 'number' && 'envMapIntensity' in material) {
                        material.envMapIntensity = THREE.MathUtils.lerp(base.envMapIntensity, 0.04, amount);
                    }
                });
            });
        }

        function enhanceShipLook(modelRoot) {
            shipState.materialBases = new WeakMap();
            shipState.silhouette = 0;
            modelRoot.traverse((node) => {
                if (!node.isMesh) return;
                node.castShadow = true;
                node.receiveShadow = true;
                const materials = Array.isArray(node.material) ? node.material : [node.material];
                materials.forEach((material) => {
                    if (!material) return;
                    if ('map' in material) material.map = null;
                    if ('emissiveMap' in material) material.emissiveMap = null;
                    if ('color' in material) material.color = new THREE.Color(0xdce5ff);
                    if ('metalness' in material) material.metalness = Math.max(material.metalness ?? 0, 0.24);
                    if ('roughness' in material) material.roughness = Math.min(material.roughness ?? 0.8, 0.34);
                    if ('envMapIntensity' in material) material.envMapIntensity = Math.max(material.envMapIntensity ?? 1, 2.1);
                    if ('emissive' in material) {
                        material.emissive = new THREE.Color(0x5276ff);
                        material.emissiveIntensity = Math.max(material.emissiveIntensity ?? 0, 0.72);
                    }
                    if ('clearcoat' in material) material.clearcoat = Math.max(material.clearcoat ?? 0, 0.85);
                    if ('clearcoatRoughness' in material) material.clearcoatRoughness = Math.min(material.clearcoatRoughness ?? 0.2, 0.08);
                    material.side = THREE.DoubleSide;
                    captureShipMaterialBase(material);
                    material.needsUpdate = true;
                });
            });
        }

        function attachShipEffects(modelRoot) {
            shipState.engineLights.forEach((light) => shipTrailPivot.remove(light));
            shipState.engineTrails.forEach((trail) => shipTrailPivot.remove(trail));
            shipState.engineLights = [];
            shipState.engineTrails = [];

            const engineLeft = new THREE.PointLight(0x9d7bff, 1.8, 2.8, 2);
            const engineRight = new THREE.PointLight(0x69d1ff, 1.45, 2.5, 2);
            engineLeft.position.set(-0.14, 0, 0.34);
            engineRight.position.set(0.14, 0, 0.34);
            shipTrailPivot.add(engineLeft, engineRight);
            shipState.engineLights.push(engineLeft, engineRight);

            if (SIMPLE_CINEMATIC_MODE) {
                return;
            }

            const trailGeometry = new THREE.PlaneGeometry(0.16, 0.76);
            const trailLeft = new THREE.Mesh(
                trailGeometry,
                new THREE.MeshBasicMaterial({
                    map: cometTrailTexture,
                    color: 0xc9a8ff,
                    transparent: true,
                    opacity: 0.7,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide
                })
            );
            const trailRight = new THREE.Mesh(
                trailGeometry.clone(),
                new THREE.MeshBasicMaterial({
                    map: cometTrailTexture,
                    color: 0x9edfff,
                    transparent: true,
                    opacity: 0.64,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide
                })
            );

            trailLeft.rotation.y = Math.PI * 0.5;
            trailRight.rotation.y = Math.PI * 0.5;
            trailLeft.position.set(-0.14, 0, 0.58);
            trailRight.position.set(0.14, 0, 0.58);

            shipTrailPivot.add(trailLeft, trailRight);
            shipState.engineTrails.push(trailLeft, trailRight);
        }

        function setShipTrailStrength(strength, elapsedTime = 0) {
            const amount = clamp01(strength);
            shipState.engineTrails.forEach((trail, index) => {
                if (!trail?.material) return;
                const flicker = 0.84 + Math.sin(elapsedTime * (10.2 + index * 1.3) + index * 1.7) * 0.16;
                const opacity = amount * (0.56 + index * 0.08) * flicker;
                trail.material.opacity = Math.max(0, opacity);
                trail.visible = opacity > 0.001;
                trail.scale.y = 0.42 + amount * 1.4 + Math.sin(elapsedTime * (8.5 + index)) * 0.08 * amount;
                trail.scale.x = 0.8 + amount * 0.54;
            });
        }

        function setShipModel(modelRoot, animations = []) {
            if (shipState.root) {
                shipModelMount.remove(shipState.root);
                disposeObject3D(shipState.root);
            }

            if (shipState.mixer) {
                shipState.actions.forEach((action) => action.stop());
            }

            enhanceShipLook(modelRoot);
            normalizeShipTransform(modelRoot);
            attachShipEffects(modelRoot);
            shipModelMount.add(modelRoot);
            shipState.root = modelRoot;
            setShipSilhouette(0);
            shipAnchor.visible = false;

            if (animations.length) {
                shipState.mixer = new THREE.AnimationMixer(modelRoot);
                shipState.actions = animations.map((clip) => {
                    const action = shipState.mixer.clipAction(clip);
                    action.play();
                    return action;
                });
            } else {
                shipState.mixer = null;
                shipState.actions = [];
            }
        }

        function setSunModel(modelRoot) {
            if (sunState.root) {
                sunAnchor.remove(sunState.root);
                disposeObject3D(sunState.root);
            }

            enhanceSunLook(modelRoot);
            normalizeSunTransform(modelRoot);
            sunAnchor.add(modelRoot);
            sunState.root = modelRoot;
            sun.visible = false;
        }

        function warmUpShatterResources() {
            if (!activeCrystal || shatterWarmupMesh) return;

            const firstMesh = shatterState.activeMeshes[0];
            if (!firstMesh?.geometry) return;

            shatterWarmupMesh = new THREE.Mesh(
                firstMesh.geometry.clone(),
                createCrackShellMaterial(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1), 0.9)
            );
            shatterWarmupMesh.position.set(9999, 9999, 9999);
            shatterWarmupMesh.frustumCulled = false;
            scene.add(shatterWarmupMesh);
            renderer.compile(scene, camera);
        }

        function loadShipByUrl(url) {
            const completeStartupTask = registerStartupLoadTask();
            gltfLoader.load(
                url,
                (gltf) => {
                    completeStartupTask();
                    const shipModel = gltf.scene || gltf.scenes?.[0];
                    if (!shipModel) return;
                    setShipModel(shipModel, []);
                },
                undefined,
                () => {
                    completeStartupTask();
                    setShipModel(createFallbackShip({ THREE, scaleSegments }), []);
                }
            );
        }

        function loadSunByUrl(url) {
            const completeStartupTask = registerStartupLoadTask();
            gltfLoader.load(
                url,
                (gltf) => {
                    completeStartupTask();
                    const sunModel = gltf.scene || gltf.scenes?.[0];
                    if (!sunModel) return;
                    setSunModel(sunModel);
                },
                undefined,
                () => {
                    completeStartupTask();
                }
            );
        }

        function loadOrbitEarthByUrl(url) {
            const completeStartupTask = registerStartupLoadTask();
            gltfLoader.load(
                url,
                (gltf) => {
                    completeStartupTask();
                    const earthModel = gltf.scene || gltf.scenes?.[0];
                    if (!earthModel) {
                        setOrbitEarthModel(createOrbitEarthFallback());
                        return;
                    }

                    setOrbitEarthModel(earthModel);
                },
                undefined,
                () => {
                    completeStartupTask();
                    setOrbitEarthModel(createOrbitEarthFallback());
                }
            );
        }

        const crystalPivot = new THREE.Group();
        crystalPivot.position.y = -0.1;
        scene.add(crystalPivot);

        const stableCrystalCenter = new THREE.Vector3();

        const shardGeometryPool = [
            createGlassShardGeometry(0.18, 0.05, 0.014),
            createGlassShardGeometry(0.23, 0.06, 0.016),
            createGlassShardGeometry(0.28, 0.075, 0.019),
            createGlassShardGeometry(0.34, 0.09, 0.023),
            createGlassShardGeometry(0.4, 0.1, 0.026)
        ];

        let activeCrystal = null;
        let previousElapsedTime = 0;

        const shatterState = {
            phase: 'idle',
            triggered: false,
            startTime: 0,
            crackDuration: 2.45,
            impactPointLocal: null,
            impactNormalLocal: null,
            impactPointWorld: null,
            impactNormalWorld: null,
            fragments: [],
            crackOverlay: null,
            dustPoints: null,
            dustData: null,
            coreGroup: null,
            coreAppearTime: null,
            labelRevealTime: null,
            labelRevealTriggered: false,
            activeMeshes: []
        };

        const crystalSectors = createCrystalSectorsSystem({
            THREE,
            crystalPivot,
            particleSprite,
            cometTrailTexture,
            MOBILE_MODE,
            scaleCount,
            scaleSegments
        });

        const viewportAdaptState = {
            compactness: 0
        };

        function computeViewportCompactness() {
            const { width, height } = getViewportSize();
            const aspect = width / height;
            const portrait = clamp01((0.95 - aspect) / 0.5);
            const narrow = clamp01((1000 - width) / 420);
            const short = clamp01((700 - height) / 230);
            return clamp01(Math.max(portrait, narrow * 0.86, short * 0.74));
        }

        function applyViewportSceneAdaptation({ allowCameraReset = true } = {}) {
            const compactness = computeViewportCompactness();
            viewportAdaptState.compactness = compactness;
            const { width: viewportWidth } = getViewportSize();
            const phoneViewport = MOBILE_MODE && viewportWidth <= 900;
            const mobileBaseCompaction = MOBILE_MODE ? 0.08 : 0;
            const phoneNarrowBoost = phoneViewport ? THREE.MathUtils.lerp(0.08, 0.14, compactness) : 0;
            const compactionTarget = compactness * 0.95 + mobileBaseCompaction + phoneNarrowBoost;
            crystalSectors.setLayoutCompaction(Math.min(phoneViewport ? 0.86 : 0.72, compactionTarget));

            if (!allowCameraReset || cinematicState.active) {
                return;
            }

            const targetDistance = phoneViewport ? 10.6 : (MOBILE_MODE ? 11.8 : 11.1);
            const targetHeightOffset = phoneViewport ? 0.2 : 0.17;
            const targetXOffset = phoneViewport ? 0.12 : 0.16;
            const distance = THREE.MathUtils.lerp(8.9, targetDistance, compactness);
            const heightOffset = THREE.MathUtils.lerp(0.24, targetHeightOffset, compactness);
            const xOffset = THREE.MathUtils.lerp(0.34, targetXOffset, compactness);
            camera.position.set(xOffset, heightOffset, distance);
            const targetFov = phoneViewport ? 49.5 : (MOBILE_MODE ? 54 : 50);
            camera.fov = THREE.MathUtils.lerp(44, targetFov, compactness);
            camera.updateProjectionMatrix();

            const targetMinDistance = phoneViewport ? 6.8 : (MOBILE_MODE ? 7.4 : 7.0);
            const targetMaxDistance = phoneViewport ? 13.4 : (MOBILE_MODE ? 15.2 : 14.1);
            controls.minDistance = THREE.MathUtils.lerp(6.4, targetMinDistance, compactness);
            controls.maxDistance = THREE.MathUtils.lerp(12.5, targetMaxDistance, compactness);
            controls.target.set(0, 0, 0);
            controls.update();
        }

        function collectActiveMeshes() {
            const meshes = [];
            activeCrystal?.traverse((node) => {
                if (node.isMesh && !node.userData?.isCrystalShell) meshes.push(node);
            });
            shatterState.activeMeshes = meshes;
        }

        function clearTransientShatterDebris() {
            if (shatterState.dustPoints) {
                scene.remove(shatterState.dustPoints);
                shatterState.dustPoints.geometry.dispose();
                shatterState.dustPoints.material.dispose();
                shatterState.dustPoints = null;
                shatterState.dustData = null;
            }

            for (let i = shatterState.fragments.length - 1; i >= 0; i--) {
                const fragment = shatterState.fragments[i];
                scene.remove(fragment.mesh);
                fragment.mesh.geometry.dispose();
                fragment.mesh.material.dispose();
            }

            shatterState.fragments = [];
        }

        function clearShatterArtifacts() {
            restoreCoreCinematicMaterial();
            cinematicState.coreMaterialBase = null;
            cinematicState.shellMaterialBase = null;
            disableImmediateSphereLabelMode();
            sphereLabel.classList.remove('core-reveal');

            if (shatterState.crackOverlay) {
                crystalPivot.remove(shatterState.crackOverlay);
                shatterState.crackOverlay.traverse((node) => {
                    if (node.isMesh) {
                        node.geometry?.dispose();
                        node.material?.dispose();
                    }
                });
                shatterState.crackOverlay = null;
            }

            clearTransientShatterDebris();

            if (shatterState.coreGroup) {
                crystalPivot.remove(shatterState.coreGroup);
                shatterState.coreGroup.traverse((node) => {
                    if (node.isMesh) {
                        node.geometry?.dispose();
                        if (Array.isArray(node.material)) {
                            node.material.forEach((m) => m?.dispose && m.dispose());
                        } else {
                            node.material?.dispose && node.material.dispose();
                        }
                    }
                });
                shatterState.coreGroup = null;
            }

            shatterState.phase = 'idle';
            shatterState.triggered = false;
            shatterState.startTime = 0;
            shatterState.impactPointLocal = null;
            shatterState.impactNormalLocal = null;
            shatterState.impactPointWorld = null;
            shatterState.impactNormalWorld = null;
            shatterState.coreAppearTime = null;
            shatterState.labelRevealTime = null;
            shatterState.labelRevealTriggered = false;
        }

        function createEnergyCore() {
            const coreGroup = new THREE.Group();

            const core = new THREE.Mesh(
                new THREE.SphereGeometry(0.38, scaleSegments(36, 14), scaleSegments(36, 14)),
                new THREE.MeshPhysicalMaterial({
                    color: 0xf2d8ff,
                    emissive: 0xb44cff,
                    emissiveIntensity: 1.3,
                    transmission: 0.86,
                    transparent: true,
                    opacity: 0.94,
                    roughness: 0.1,
                    ior: 1.6,
                    thickness: 1.1,
                    attenuationColor: 0xd661ff,
                    attenuationDistance: 1.45,
                    clearcoat: 0.82,
                    clearcoatRoughness: 0.08,
                    envMapIntensity: 0.45
                })
            );

            const shell = new THREE.Mesh(
                new THREE.SphereGeometry(0.62, scaleSegments(24, 10), scaleSegments(24, 10)),
                new THREE.MeshPhysicalMaterial({
                    color: 0xe6bdff,
                    transparent: true,
                    opacity: 0.2,
                    transmission: 0.82,
                    roughness: 0.2,
                    ior: 1.48,
                    thickness: 0.48,
                    attenuationColor: 0xd884ff,
                    attenuationDistance: 1.6,
                    clearcoat: 0.48,
                    clearcoatRoughness: 0.12,
                    envMapIntensity: 0.32,
                    side: THREE.BackSide
                })
            );

            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.82, 0.035, scaleSegments(16, 8), scaleSegments(80, 32)),
                new THREE.MeshBasicMaterial({
                    color: 0xf2a9ff,
                    transparent: true,
                    opacity: 0.26,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            ring.rotation.x = Math.PI * 0.5;

            const ringSecondary = new THREE.Mesh(
                new THREE.TorusGeometry(0.69, 0.026, scaleSegments(12, 8), scaleSegments(68, 28)),
                new THREE.MeshBasicMaterial({
                    color: 0xbe84ff,
                    transparent: true,
                    opacity: 0.24,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            ringSecondary.rotation.set(Math.PI * 0.62, 0.2, 0.34);

            const ringTilt = new THREE.Mesh(
                new THREE.TorusGeometry(0.94, 0.02, scaleSegments(10, 8), scaleSegments(72, 30)),
                new THREE.MeshBasicMaterial({
                    color: 0x96d3ff,
                    transparent: true,
                    opacity: 0.16,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            ringTilt.rotation.set(Math.PI * 0.24, 0.9, 0.1);

            const mist = new THREE.Mesh(
                new THREE.SphereGeometry(0.76, scaleSegments(26, 12), scaleSegments(26, 12)),
                new THREE.MeshBasicMaterial({
                    color: 0xbf7fff,
                    transparent: true,
                    opacity: 0.16,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide,
                    depthWrite: false
                })
            );

            const innerVoid = new THREE.Mesh(
                new THREE.SphereGeometry(0.17, scaleSegments(20, 10), scaleSegments(20, 10)),
                new THREE.MeshBasicMaterial({
                    color: 0x080514,
                    transparent: true,
                    opacity: 0.7,
                    blending: THREE.NormalBlending,
                    depthWrite: false
                })
            );

            coreGroup.add(core, shell, mist, ring, ringSecondary, ringTilt, innerVoid);
            coreGroup.userData = { core, shell, mist, ring, ringSecondary, ringTilt, innerVoid };
            return coreGroup;
        }

        function explodeCrystalNow() {
            const centerWorld = crystalPivot.getWorldPosition(tempVectorA.clone());
            const impactPointWorld = shatterState.impactPointWorld?.clone() || centerWorld.clone();
            const impactNormalWorld = shatterState.impactNormalWorld?.clone() || new THREE.Vector3(0.1, 0.25, 1).normalize();

            if (shatterState.crackOverlay) {
                crystalPivot.remove(shatterState.crackOverlay);
                shatterState.crackOverlay.traverse((node) => {
                    if (node.isMesh) {
                        node.geometry?.dispose();
                        node.material?.dispose();
                    } else if (node.isLineSegments) {
                        node.geometry?.dispose();
                        node.material?.dispose();
                    }
                });
                shatterState.crackOverlay = null;
            }

            const fragmentMaterialBase = createCrystalMaterial({ flatShading: true, opacity: 0.46, attenuationColor: 0xc260ff, thickness: 0.28, roughness: 0.08, transmission: 0.48 });
            const fragmentCount = 34;

            for (let i = 0; i < fragmentCount; i++) {
                const outward = new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.45,
                    Math.random() - 0.5
                ).normalize().lerp(impactNormalWorld, 0.38).normalize();
                const tangent = Math.abs(outward.y) > 0.86 ? tempVectorB.set(1, 0, 0) : tempVectorB.set(0, 1, 0);
                const bitangent = tempVectorC.copy(tangent).cross(outward).normalize();
                const sideAxis = tempVectorD.copy(outward).cross(bitangent).normalize();
                const geometry = shardGeometryPool[(Math.random() * shardGeometryPool.length) | 0].clone();

                const material = fragmentMaterialBase.clone();
                material.opacity = 0.18 + Math.random() * 0.22;

                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.copy(centerWorld)
                    .lerp(impactPointWorld, 0.32 + Math.random() * 0.34)
                    .addScaledVector(outward, 0.08 + Math.random() * 0.24)
                    .addScaledVector(bitangent, (Math.random() - 0.5) * 0.12)
                    .addScaledVector(sideAxis, (Math.random() - 0.5) * 0.12);
                mesh.quaternion.copy(tempQuaternion.setFromUnitVectors(upAxis, outward));
                mesh.rotateOnAxis(outward, (Math.random() - 0.5) * Math.PI * 2);

                const speed = 1.15 + Math.random() * 1.75;
                const velocity = outward.clone().multiplyScalar(speed)
                    .addScaledVector(bitangent, (Math.random() - 0.5) * 0.45)
                    .addScaledVector(sideAxis, (Math.random() - 0.5) * 0.45);
                const angular = new THREE.Vector3((Math.random() - 0.5) * 4.2, (Math.random() - 0.5) * 4.2, (Math.random() - 0.5) * 4.2);

                scene.add(mesh);
                shatterState.fragments.push({ mesh, velocity, angular, life: 1.4 + Math.random() * 1.3, age: 0 });
            }

            const dustCount = 300;
            const positions = new Float32Array(dustCount * 3);
            const colors = new Float32Array(dustCount * 3);
            const baseColors = new Float32Array(dustCount * 3);
            const velocities = new Float32Array(dustCount * 3);
            const ages = new Float32Array(dustCount);
            const lifetimes = new Float32Array(dustCount);

            const c1 = new THREE.Color(0xffb4f8);
            const c2 = new THREE.Color(0xd17aff);
            const c3 = new THREE.Color(0xffffff);

            for (let i = 0; i < dustCount; i++) {
                const i3 = i * 3;
                positions[i3] = centerWorld.x + (Math.random() - 0.5) * 0.8;
                positions[i3 + 1] = centerWorld.y + (Math.random() - 0.5) * 0.8;
                positions[i3 + 2] = centerWorld.z + (Math.random() - 0.5) * 0.8;

                const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
                const speed = 0.7 + Math.random() * 1.7;
                velocities[i3] = dir.x * speed;
                velocities[i3 + 1] = dir.y * speed;
                velocities[i3 + 2] = dir.z * speed;

                const mix = Math.random();
                const color = mix < 0.4 ? c1 : mix < 0.8 ? c2 : c3;
                colors[i3] = color.r;
                colors[i3 + 1] = color.g;
                colors[i3 + 2] = color.b;
                baseColors[i3] = color.r;
                baseColors[i3 + 1] = color.g;
                baseColors[i3 + 2] = color.b;

                ages[i] = 0;
                lifetimes[i] = 1.6 + Math.random() * 2.8;
            }

            const dustGeometry = new THREE.BufferGeometry();
            dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            dustGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

            const dustMaterial = new THREE.PointsMaterial({
                size: 0.06,
                sizeAttenuation: true,
                map: particleSprite,
                transparent: true,
                opacity: 0.82,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                vertexColors: true
            });

            const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
            scene.add(dustPoints);

            shatterState.dustPoints = dustPoints;
            shatterState.dustData = { positions, colors, baseColors, velocities, ages, lifetimes };

            const coreGroup = createEnergyCore();
            coreGroup.scale.setScalar(0.0001);
            crystalPivot.add(coreGroup);
            shatterState.coreGroup = coreGroup;
            shatterState.coreAppearTime = previousElapsedTime;
            shatterState.labelRevealTime = shatterState.coreAppearTime + sphereLabelCoreRevealDelay;
            shatterState.labelRevealTriggered = false;
            sphereLabel.classList.remove('visible', 'core-reveal');
            subtitleRotatingController?.stop();
            sphereLabelWasVisible = false;
            sphereLabelSmoothInitialized = false;
            shatterState.phase = 'exploding';
        }

        function setActiveCrystal(object) {
            clearShatterArtifacts();

            if (shatterWarmupMesh) {
                scene.remove(shatterWarmupMesh);
                shatterWarmupMesh.geometry.dispose();
                shatterWarmupMesh.material.dispose();
                shatterWarmupMesh = null;
            }

            if (activeCrystal) {
                crystalPivot.remove(activeCrystal);
                disposeObject3D(activeCrystal);
            }

            activeCrystal = object;
            activeCrystal.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            crystalPivot.add(activeCrystal);
            crystalSectors.syncWithCrystal(activeCrystal);
            applyViewportSceneAdaptation({ allowCameraReset: false });
            collectActiveMeshes();
            warmUpShatterResources();
        }

        function triggerCrystalShatter(intersection) {
            if (!shatterEnabled || shatterState.triggered || !activeCrystal) return;

            shatterState.triggered = true;
            shatterState.phase = 'cracking';
            shatterState.startTime = previousElapsedTime;
            controls.autoRotate = false;

            const impactPointWorld = intersection?.point?.clone() || crystalPivot.getWorldPosition(new THREE.Vector3());
            const impactNormalWorld = intersection?.face?.normal
                ? intersection.face.normal.clone().transformDirection(intersection.object.matrixWorld).normalize()
                : impactPointWorld.clone().sub(crystalPivot.getWorldPosition(new THREE.Vector3())).normalize();
            const pivotInverse = new THREE.Matrix4().copy(crystalPivot.matrixWorld).invert();

            shatterState.impactPointWorld = impactPointWorld;
            shatterState.impactNormalWorld = impactNormalWorld;
            shatterState.impactPointLocal = impactPointWorld.clone().applyMatrix4(pivotInverse);
            shatterState.impactNormalLocal = impactNormalWorld.clone().transformDirection(pivotInverse).normalize();
            shatterState.coreAppearTime = null;
            shatterState.labelRevealTime = null;
            shatterState.labelRevealTriggered = false;
            hideCrystalClickHint();

            const crystalBounds = new THREE.Box3().setFromObject(activeCrystal);
            const crystalSize = crystalBounds.getSize(new THREE.Vector3());
            const crackRadius = Math.max(crystalSize.x, crystalSize.y, crystalSize.z) * 0.3;

            const cracks = createGlassCrackOverlay(
                activeCrystal,
                shatterState.impactPointLocal,
                shatterState.impactNormalLocal,
                crackRadius
            );

            crystalPivot.add(cracks);
            shatterState.crackOverlay = cracks;
            disableImmediateSphereLabelMode();
            sphereLabel.classList.remove('visible', 'core-reveal');
            subtitleRotatingController?.stop();
            sphereLabelWasVisible = false;
            sphereLabelSmoothInitialized = false;

            setStatus('Кристалл трескается...');
        }

        function setRayFromPointerEvent(event) {
            if (!rendererRect || rendererRect.width <= 0 || rendererRect.height <= 0) {
                refreshRendererRect();
            }
            const rect = rendererRect;
            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(pointer, camera);
        }

        const pointerHoverProxyEvent = { clientX: 0, clientY: 0 };

        function processPointerHoverRaycast(nowMs = performance.now()) {
            if (startupPreloaderState.active) {
                crystalSectors.setHoveredSectorKey(null);
                setCanvasCursor('default');
                pointerHoverState.dirty = false;
                return;
            }

            if (cinematicState.active) {
                crystalSectors.setHoveredSectorKey(null);
                setCanvasCursor('default');
                pointerHoverState.dirty = false;
                return;
            }

            if (!pointerHoverState.dirty) return;

            const minInterval = performanceState.lowQuality ? pointerHoverState.intervalMs : 0;
            if (minInterval > 0 && (nowMs - pointerHoverState.lastProcessedMs) < minInterval) {
                return;
            }

            pointerHoverProxyEvent.clientX = pointerHoverState.clientX;
            pointerHoverProxyEvent.clientY = pointerHoverState.clientY;
            setRayFromPointerEvent(pointerHoverProxyEvent);

            const sectorIntersects = raycaster.intersectObjects(crystalSectors.getInteractiveObjects(), true);
            const hoveredSector = sectorIntersects.length
                ? crystalSectors.resolveSectorFromObject(sectorIntersects[0].object)
                : null;
            const overSector = !!hoveredSector;
            crystalSectors.setHoveredSectorKey(hoveredSector?.key ?? null);

            const overCore = !!shatterState.coreGroup && raycaster.intersectObject(shatterState.coreGroup, true).length > 0;
            const overCrystal = !shatterState.triggered && !!activeCrystal && raycaster.intersectObjects(shatterState.activeMeshes, true).length > 0;
            setCanvasCursor(overSector || overCore || overCrystal ? 'pointer' : 'default');

            pointerHoverState.lastProcessedMs = nowMs;
            pointerHoverState.dirty = false;
        }

        renderer.domElement.addEventListener('pointerdown', (event) => {
            if (startupPreloaderState.active) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            if (cinematicState.active) return;

            setRayFromPointerEvent(event);

            const sectorIntersects = raycaster.intersectObjects(crystalSectors.getInteractiveObjects(), true);
            if (sectorIntersects.length) {
                const sectorInfo = crystalSectors.resolveSectorFromObject(sectorIntersects[0].object);
                if (sectorInfo) {
                    event.preventDefault();
                    event.stopPropagation();
                    crystalSectors.setHoveredSectorKey(sectorInfo.key);
                    queueSectorNavigation(sectorInfo);
                    return;
                }
            }

            if (shatterState.coreGroup) {
                const coreIntersects = raycaster.intersectObject(shatterState.coreGroup, true);
                if (coreIntersects.length) {
                    event.preventDefault();
                    event.stopPropagation();
                    cancelPendingSectorNavigation();
                    crystalSectors.cancelClickAnimation();
                    startCoreCinematicTransition('ядро');
                    return;
                }
            }

            if (!shatterEnabled || !activeCrystal || shatterState.triggered) return;

            const intersects = raycaster.intersectObjects(shatterState.activeMeshes, true);
            if (intersects.length) {
                event.preventDefault();
                event.stopPropagation();
                cancelPendingSectorNavigation();
                crystalSectors.cancelClickAnimation();
                triggerCrystalShatter(intersects[0]);
            }
        }, { capture: true });

        renderer.domElement.addEventListener('pointermove', (event) => {
            if (startupPreloaderState.active) {
                crystalSectors.setHoveredSectorKey(null);
                setCanvasCursor('default');
                return;
            }

            if (cinematicState.active) {
                crystalSectors.setHoveredSectorKey(null);
                setCanvasCursor('default');
                return;
            }

            pointerHoverState.clientX = event.clientX;
            pointerHoverState.clientY = event.clientY;
            pointerHoverState.dirty = true;

            if (!performanceState.lowQuality) {
                processPointerHoverRaycast(performance.now());
            }
        }, { passive: true });

        renderer.domElement.addEventListener('pointerleave', () => {
            pointerHoverState.dirty = false;
            crystalSectors.setHoveredSectorKey(null);
            setCanvasCursor('default');
        }, { passive: true });

        function setProceduralCrystal() {
            setActiveCrystal(createProceduralCrystal());
            setStatus('Сейчас: процедурный кристалл. Загрузи GLB/GLTF, если хочешь использовать свою модель.');
        }

        const gltfLoader = new GLTFLoader();
        function loadModelByUrl(url, label, revokeUrlAfterLoad = false) {
            setStatus(`Загрузка модели: ${label}...`);
            const completeStartupTask = registerStartupLoadTask();
            gltfLoader.load(
                url,
                (gltf) => {
                    completeStartupTask();
                    if (revokeUrlAfterLoad) URL.revokeObjectURL(url);
                    const model = gltf.scene || gltf.scenes?.[0];
                    if (!model) {
                        setStatus('Модель загружена, но сцена пустая. Оставил текущий кристалл.');
                        return;
                    }

                    applyCrystalLookToModel(model);
                    normalizeModelTransform(model);

                    setActiveCrystal(model);
                    setStatus(`Сейчас: ${label}.`);
                },
                undefined,
                () => {
                    completeStartupTask();
                    if (revokeUrlAfterLoad) URL.revokeObjectURL(url);
                    setStatus(`Не удалось загрузить ${label}. Оставил текущий кристалл.`);
                }
            );
        }

        loadModelButton.addEventListener('click', () => modelFileInput.click());
        modelFileInput.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!/\.(glb|gltf)$/i.test(file.name)) {
                setStatus('Поддерживаются только файлы .glb или .gltf');
                return;
            }
            const objectUrl = URL.createObjectURL(file);
            loadModelByUrl(objectUrl, file.name, true);
            modelFileInput.value = '';
        });

        showStartupPreloader('initial');
        applyMainSitePhotoPlanetTextures();
        setProceduralCrystal();
        loadModelByUrl('./crystal.glb', 'crystal.glb (автозагрузка)', false);
        setOrbitEarthModel(createOrbitEarthFallback());
        loadOrbitEarthByUrl(new URL('./earth.glb', document.baseURI).href);
        loadShipByUrl(new URL('./Baked_Animations_Intergalactic_Spaceships_Version_2/%20GLB/Baked_Animations_Intergalactic_Spaceships_Version_2.glb', document.baseURI).href);
        loadSunByUrl(new URL('./the_sun.glb', document.baseURI).href);

        scene.add(new THREE.AmbientLight(0xd6ceff, 0.36));
        const hemiLight = new THREE.HemisphereLight(0xeaf6ff, 0x2e3b58, 1.08);
        scene.add(hemiLight);

        const keyLight = new THREE.DirectionalLight(0xffeed0, 2.3);
        keyLight.position.set(-4.2, 2.7, 4.8);
        scene.add(keyLight);

        const rimLight = new THREE.DirectionalLight(0x84b1ff, 3.8);
        rimLight.position.set(4.0, 2.2, -3.0);
        scene.add(rimLight);

        const fillLight = new THREE.PointLight(0xa9cbff, 13.2, 24);
        fillLight.position.set(-2.1, -0.7, 2.8);
        scene.add(fillLight);

        const sparkleLight = new THREE.PointLight(0xfff4d9, 1.78, 6.2);
        sparkleLight.position.set(0.9, 1.3, 1.95);
        scene.add(sparkleLight);

        const light1 = new THREE.PointLight(0xb865ff, 5.8, 12);
        const light2 = new THREE.PointLight(0xff9ad8, 5.1, 11);
        scene.add(light1, light2);

        const clock = new THREE.Clock();
        let lastRenderedFrameMs = performance.now();
        const weakDeviceFrameIntervalMs = MOBILE_MODE ? (1000 / 34) : (1000 / 40);

        function animate() {
            requestAnimationFrame(animate);

            const nowMs = performance.now();
            if (!startupPreloaderState.active && !cinematicState.active && LOW_END_MODE) {
                const minFrameInterval = performanceState.lowQuality
                    ? weakDeviceFrameIntervalMs
                    : weakDeviceFrameIntervalMs * 0.82;
                if ((nowMs - lastRenderedFrameMs) < minFrameInterval) {
                    processPointerHoverRaycast(nowMs);
                    return;
                }
            }
            lastRenderedFrameMs = nowMs;

            const elapsedTime = clock.getElapsedTime();
            const deltaTime = Math.min(0.033, Math.max(0.0001, elapsedTime - previousElapsedTime));
            previousElapsedTime = elapsedTime;
            spaceLensPass.uniforms.uTime.value = elapsedTime;
            performanceState.frameIndex += 1;
            updatePerformanceTier(deltaTime);
            updateRuntimePerf(deltaTime);
            processPointerHoverRaycast(nowMs);

            const desiredLensEnabled =
                cinematicState.active || !performanceState.lowQuality || !RENDER_PROFILE.disableLensPassInLow;
            if (spaceLensPass.enabled !== desiredLensEnabled) {
                spaceLensPass.enabled = desiredLensEnabled;
            }

            const desiredSmaaEnabled =
                RENDER_PROFILE.allowSmaa && !performanceState.lowQuality && (!cinematicState.active || SIMPLE_CINEMATIC_MODE);
            if (smaaPass.enabled !== desiredSmaaEnabled) {
                smaaPass.enabled = desiredSmaaEnabled;
            }

            const bloomCriticalPhase = cinematicState.active;
            const desiredBloomEnabled = bloomCriticalPhase
                || (RENDER_PROFILE.allowBloomIdle && (!performanceState.lowQuality || MOBILE_MODE));
            if (bloomPass.enabled !== desiredBloomEnabled) {
                bloomPass.enabled = desiredBloomEnabled;
            }

            const effectiveDarkenForLights = SIMPLE_CINEMATIC_MODE
                ? 0
                : cinematicState.sceneDarken;
            const backgroundVisibility = THREE.MathUtils.lerp(1, 0.08, effectiveDarkenForLights);
            const globalLightScale = 0.28 + backgroundVisibility * 0.72;
            hemiLight.intensity = 1.08 * globalLightScale;
            keyLight.intensity = 2.3 * globalLightScale;
            rimLight.intensity = 3.8 * globalLightScale;
            fillLight.intensity = 13.2 * globalLightScale;
            sparkleLight.intensity = 1.78 * globalLightScale;
            light1.intensity = 5.8 * globalLightScale;
            light2.intensity = 5.1 * globalLightScale;
            skyDome.rotation.y += deltaTime * (cinematicState.active ? 0.00045 : 0.0013);
            const backgroundStride = getEffectiveBackgroundStride(performanceState.lowQuality);
            const shouldUpdateBackgroundSystems = !performanceState.lowQuality
                || performanceState.frameIndex % backgroundStride === 0;
            if (shouldUpdateBackgroundSystems) {
                const backgroundDelta = performanceState.lowQuality
                    ? deltaTime * backgroundStride
                    : deltaTime;
                updateNebulaLayers(elapsedTime, backgroundVisibility);
                updateDistantGalaxies(elapsedTime, backgroundVisibility);
                updateBlackHole(elapsedTime, backgroundDelta, backgroundVisibility);
                updateSpaceDustLayers(elapsedTime, backgroundDelta, backgroundVisibility);
                updateAsteroidBelts(
                    elapsedTime,
                    backgroundDelta,
                    backgroundVisibility,
                    cinematicState.active ? 0.32 : 1
                );
                updateAmbientBackgroundShips(
                    elapsedTime,
                    backgroundDelta,
                    backgroundVisibility,
                    cinematicState.active ? 0.42 : 1,
                    !cinematicState.active
                );
            }

            if (!cinematicState.active) {
                sun.rotation.y += 0.0012;
                if (sunState.root) sunState.root.rotation.y += deltaTime * sunState.spinSpeed;
                sunSurfaceTexture.offset.x = (sunSurfaceTexture.offset.x + deltaTime * 0.007) % 1;
                sunSurfaceTexture.offset.y = (sunSurfaceTexture.offset.y + deltaTime * 0.003) % 1;
                const sunPulse = Math.sin(elapsedTime * 2.2);
                const sunFlarePulse = Math.sin(elapsedTime * 1.05 + 0.7);
                sun.material.emissiveIntensity = (1.42 + sunPulse * 0.1) * (0.28 + backgroundVisibility * 0.72);
                sunGlow.material.opacity = (0.28 + sunFlarePulse * 0.06) * (0.2 + backgroundVisibility * 0.8);
                sunHalo.material.opacity = (0.14 + Math.sin(elapsedTime * 1.2) * 0.04) * (0.2 + backgroundVisibility * 0.8);
                sunGlow.scale.setScalar(1 + sunFlarePulse * 0.045);
                sunHalo.scale.setScalar(1 + Math.sin(elapsedTime * 0.95) * 0.07);
                sunCoronaInner.material.opacity = (0.13 + Math.sin(elapsedTime * 1.6) * 0.05) * (0.16 + backgroundVisibility * 0.84);
                sunCoronaOuter.material.opacity = (0.08 + Math.sin(elapsedTime * 0.74 + 0.8) * 0.04) * (0.14 + backgroundVisibility * 0.86);
                sunCoronaOuter.rotation.y += deltaTime * 0.09;
                sunCoronaOuter.rotation.z += deltaTime * 0.05;
                sunArc.rotation.z += deltaTime * 0.22;
                sunArc.material.opacity = (0.12 + Math.sin(elapsedTime * 2.6) * 0.05) * (0.16 + backgroundVisibility * 0.84);

                for (const item of planetPivots) {
                    item.pivot.rotation.y += item.orbitSpeed * 0.0014;
                    item.planet.rotation.y += item.spinSpeed;

                    if (item.mapDriftX && item.planet.material.map) {
                        const nextOffsetX = item.planet.material.map.offset.x + item.mapDriftX * deltaTime;
                        item.planet.material.map.offset.x = nextOffsetX - Math.floor(nextOffsetX);
                        if (item.planet.material.roughnessMap) {
                            item.planet.material.roughnessMap.offset.x = item.planet.material.map.offset.x;
                        }
                    }

                    if (item.cloudLayer) {
                        item.cloudLayer.rotation.y += item.cloudSpinSpeed;
                        const cloudPulse = 0.02 + Math.sin(elapsedTime * 0.82 + item.orbitSpeed * 18) * 0.02;
                        item.cloudLayer.material.opacity = (item.cloudLayer.userData.baseOpacity + cloudPulse) * (0.24 + backgroundVisibility * 0.76);
                    }

                    if (item.ring) {
                        item.ring.rotation.z += item.ringSpinSpeed;
                        const ringPulse = Math.sin(elapsedTime * 0.56 + item.orbitSpeed * 12) * 0.06;
                        item.ring.material.opacity = (item.ring.userData.baseOpacity + ringPulse) * (0.22 + backgroundVisibility * 0.78);
                    }

                    if (item.atmosphere) {
                        item.atmosphere.material.opacity = (item.baseAtmosphereOpacity + Math.sin(elapsedTime * (0.78 + item.atmospherePulse * 0.35) + item.orbitSpeed * 15) * 0.026) * (0.2 + backgroundVisibility * 0.8);
                    }

                    if (item.emissivePulse > 0) {
                        item.planet.material.emissiveIntensity = Math.max(
                            0,
                            item.baseEmissiveIntensity + Math.sin(elapsedTime * 1.64 + item.orbitSpeed * 13) * item.emissivePulse
                        );
                    }
                }

                earthOrbitState.pivot.rotation.y += earthOrbitState.orbitSpeed * 0.0014;
                if (earthOrbitState.root) earthOrbitState.root.rotation.y += earthOrbitState.spinSpeed;
                if (earthOrbitState.moonPivot) {
                    earthOrbitState.moonPivot.rotation.y += deltaTime * 0.92;
                    earthOrbitState.moonPivot.rotation.z = Math.sin(elapsedTime * 0.36) * 0.08;
                }
                if (earthOrbitState.moon) {
                    earthOrbitState.moon.rotation.y += deltaTime * 0.48;
                }

                const shouldUpdateStarColors = performanceState.frameIndex % performanceState.starColorStride === 0;

                for (const layer of dynamicStarLayers) {
                    layer.points.rotation.y += layer.driftSpeed * deltaTime;
                    layer.points.rotation.x += layer.driftSpeed * 0.28 * deltaTime;

                    if (shouldUpdateStarColors) {
                        const colors = layer.colorsAttribute.array;
                        const baseColors = layer.baseColors;
                        const phases = layer.phases;
                        for (let i = 0; i < phases.length; i++) {
                            const i3 = i * 3;
                            const twinkle = 0.66 + Math.sin(elapsedTime * layer.twinkleSpeed + phases[i]) * 0.34;
                            colors[i3] = baseColors[i3] * twinkle;
                            colors[i3 + 1] = baseColors[i3 + 1] * twinkle;
                            colors[i3 + 2] = baseColors[i3 + 2] * twinkle;
                        }
                        layer.colorsAttribute.needsUpdate = true;
                    }

                    layer.points.material.opacity = layer.baseOpacity * (1 - cinematicState.sceneDarken * 0.96);
                }

                cometState.spawnTimer -= deltaTime;
                if (cometState.spawnTimer <= 0) {
                    spawnComet();
                    cometState.spawnTimer = MOBILE_MODE
                        ? 6 + Math.random() * 8
                        : 4 + Math.random() * 6;
                }

                for (const comet of cometState.pool) {
                    if (!comet.active) continue;

                    comet.life += deltaTime;
                    if (comet.life >= comet.maxLife) {
                        comet.active = false;
                        comet.group.visible = false;
                        continue;
                    }

                    comet.group.position.addScaledVector(comet.velocity, deltaTime);
                    comet.group.quaternion.setFromUnitVectors(forwardAxis, tempVectorA.copy(comet.velocity).normalize());

                    const lifeT = comet.life / comet.maxLife;
                    const fade = lifeT < 0.75 ? 1 : (1 - (lifeT - 0.75) / 0.25);
                    const cinematicFade = 1 - cinematicState.sceneDarken * 0.97;
                    comet.head.material.opacity = 0.9 * fade * cinematicFade;
                    comet.trail.material.opacity = 0.68 * fade * cinematicFade;
                    comet.trail.scale.x = 0.92 + Math.sin(elapsedTime * 10.5) * 0.06;
                    comet.trail.scale.y = 0.92 + Math.sin(elapsedTime * 7.2 + 0.8) * 0.08;
                }
            } else {
                for (const layer of dynamicStarLayers) {
                    layer.points.material.opacity = layer.baseOpacity * (1 - cinematicState.sceneDarken * 0.97);
                }

                for (const comet of cometState.pool) {
                    if (!comet.active) continue;
                    comet.active = false;
                    comet.group.visible = false;
                }
            }

            if (shipState.mixer) shipState.mixer.update(deltaTime);

            const idleMotionFactor = 1 - cinematicState.sceneDarken * 0.9;
            crystalPivot.position.y = -0.1 + Math.sin(elapsedTime * 0.8) * 0.06 * idleMotionFactor;
            crystalPivot.rotation.z = -0.06 + Math.sin(elapsedTime * 0.45) * 0.018 * idleMotionFactor;
            crystalPivot.rotation.y = Math.sin(elapsedTime * 0.26) * 0.045 * idleMotionFactor;

            const sectorsVisible = !cinematicState.active;
            const sectorUpdateStride = performanceState.lowQuality
                ? (runtimePerfState.ultraLow ? 3 : 2)
                : 1;
            if (!sectorsVisible || performanceState.frameIndex % sectorUpdateStride === 0) {
                const sectorDelta = performanceState.lowQuality
                    ? deltaTime * sectorUpdateStride
                    : deltaTime;
                crystalSectors.update(elapsedTime, sectorDelta, {
                    visible: sectorsVisible,
                    intensity: sectorsVisible ? (shatterState.triggered ? 0.96 : 1) : 0
                });
            }

            stableCrystalCenter.set(0, crystalPivot.position.y, 0);

            if (shipState.root && shipAnchor.visible && !cinematicState.active) {
                shipAnchor.position.copy(stableCrystalCenter);
                const orbitAngle = elapsedTime * 0.52 - 0.2;
                const bank = Math.sin(elapsedTime * 1.1) * 0.04;
                const orbitCenterX = 2.82;
                const orbitCenterZ = 1.78;
                const orbitRadiusX = 0.42;
                const orbitRadiusZ = 0.24;
                const orbitX = orbitCenterX + Math.cos(orbitAngle) * orbitRadiusX;
                const orbitY = 0.44 + Math.sin(elapsedTime * 1.35) * 0.025;
                const orbitZ = orbitCenterZ + Math.sin(orbitAngle) * orbitRadiusZ;
                shipPivot.position.set(orbitX, orbitY + shipState.bodyOffsetY, orbitZ);

                const tangentX = -Math.sin(orbitAngle) * orbitRadiusX;
                const tangentZ = Math.cos(orbitAngle) * orbitRadiusZ;
                const heading = Math.atan2(tangentZ, tangentX);
                shipPivot.rotation.set(0, heading, bank);
                shipModelMount.rotation.set(elapsedTime * 0.9, 0, 0);
                shipTrailPivot.position.copy(shipPivot.position).addScaledVector(upAxis, -0.02);
                shipTrailPivot.quaternion.copy(shipPivot.quaternion);

                shipState.engineLights[0]?.position.set(-0.16, 0, 0.34 + Math.sin(elapsedTime * 12) * 0.02);
                shipState.engineLights[1]?.position.set(0.16, 0, 0.34 + Math.cos(elapsedTime * 11) * 0.02);
                if (shipState.engineLights[0]) shipState.engineLights[0].intensity = 1.55 + Math.sin(elapsedTime * 9.5) * 0.35;
                if (shipState.engineLights[1]) shipState.engineLights[1].intensity = 1.3 + Math.cos(elapsedTime * 8.8) * 0.28;
            }

            let crackProgress = 0;

            if (shatterState.triggered) {
                const t = elapsedTime - shatterState.startTime;

                if (shatterState.phase === 'cracking') {
                    crackProgress = Math.min(1, t / shatterState.crackDuration);
                    const jitter = crackProgress * crackProgress;

                    crystalPivot.position.x = Math.sin(elapsedTime * 22) * 0.018 * jitter;
                    crystalPivot.position.z += Math.cos(elapsedTime * 19) * 0.0012 * jitter;
                    crystalPivot.rotation.x = Math.sin(elapsedTime * 14) * 0.028 * jitter;
                    if (shatterState.impactNormalLocal) {
                        activeCrystal.position.copy(shatterState.impactNormalLocal).multiplyScalar(-0.015 * jitter);
                    }

                    shatterState.activeMeshes.forEach((mesh) => {
                        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                        materials.forEach((m) => {
                            m.transparent = true;
                            m.opacity = Math.max(0.12, 0.56 - crackProgress * 0.42 + Math.sin(elapsedTime * 35) * 0.015 * jitter);
                        });
                    });

                    if (shatterState.crackOverlay) {
                        const { crackShells, burst, normal } = shatterState.crackOverlay.userData;
                        crackShells.forEach((shell) => {
                            shell.material.uniforms.uProgress.value = crackProgress;
                            shell.material.uniforms.uTime.value = elapsedTime;
                        });
                        burst.material.opacity = crackProgress * 0.42;
                        burst.scale.setScalar(0.18 + crackProgress * 1.65);
                        burst.position.addScaledVector(normal, deltaTime * 0.015);
                    }

                    if (crackProgress >= 1) {
                        explodeCrystalNow();
                        setStatus('Кристалл разрушен. Ядро стабилизируется...');
                    }
                }

                if (shatterState.phase === 'exploding') {
                    const explodeTime = Math.max(0, elapsedTime - (shatterState.startTime + shatterState.crackDuration));
                    const hideMain = Math.min(1, explodeTime / 0.54);
                    crackProgress = 1;

                    if (cinematicState.active) {
                        shatterState.activeMeshes.forEach((mesh) => {
                            mesh.visible = false;
                        });
                    } else {
                        shatterState.activeMeshes.forEach((mesh) => {
                            mesh.visible = hideMain < 0.98;
                            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                            materials.forEach((m) => {
                                m.transparent = true;
                                m.opacity = Math.max(0, (1 - hideMain) * 0.5);
                            });
                        });
                    }

                    if (shatterState.coreGroup && !cinematicState.active) {
                        const coreScale = Math.min(1, explodeTime / 0.7);
                        shatterState.coreGroup.scale.setScalar(coreScale * 0.82 + 0.02);
                        shatterState.coreGroup.rotation.y += deltaTime * 1.8;
                        shatterState.coreGroup.rotation.x += deltaTime * 0.62;
                        const { core, shell, mist, ring, ringSecondary, ringTilt, innerVoid } = shatterState.coreGroup.userData;
                        core.rotation.y += deltaTime * 2.4;
                        shell.rotation.y -= deltaTime * 0.8;
                        ring.rotation.z += deltaTime * 1.5;
                        ringSecondary.rotation.z -= deltaTime * 1.9;
                        ringSecondary.rotation.y += deltaTime * 0.4;
                        ringTilt.rotation.z += deltaTime * 1.1;
                        ringTilt.rotation.x += deltaTime * 0.36;
                        mist.rotation.y += deltaTime * 0.9;
                        mist.rotation.x -= deltaTime * 0.48;
                        const clickPulse = 1 + Math.sin(elapsedTime * 6.2) * 0.1;
                        core.scale.setScalar(clickPulse);
                        ring.scale.setScalar(1 + Math.sin(elapsedTime * 5.3) * 0.14);
                        ringSecondary.scale.setScalar(1 + Math.cos(elapsedTime * 4.2) * 0.12);
                        ringTilt.scale.setScalar(1 + Math.sin(elapsedTime * 3.8) * 0.1);
                        core.material.emissiveIntensity = 1.08 + Math.sin(elapsedTime * 6.4) * 0.14;
                        shell.material.opacity = 0.1 + Math.sin(elapsedTime * 4.2) * 0.024;
                        ring.material.opacity = 0.22 + Math.sin(elapsedTime * 5.1) * 0.06;
                        ringSecondary.material.opacity = 0.18 + Math.cos(elapsedTime * 4.8) * 0.05;
                        ringTilt.material.opacity = 0.14 + Math.sin(elapsedTime * 3.7) * 0.04;
                        mist.material.opacity = 0.12 + Math.sin(elapsedTime * 3.4) * 0.05;
                        innerVoid.material.opacity = 0.62 + Math.sin(elapsedTime * 2.6) * 0.08;
                    }

                    if (!cinematicState.active) {
                        for (let i = shatterState.fragments.length - 1; i >= 0; i--) {
                            const fragment = shatterState.fragments[i];
                            fragment.age += deltaTime;
                            fragment.velocity.y -= 0.9 * deltaTime;
                            fragment.velocity.multiplyScalar(0.994);
                            fragment.mesh.position.addScaledVector(fragment.velocity, deltaTime);
                            fragment.mesh.rotation.x += fragment.angular.x * deltaTime;
                            fragment.mesh.rotation.y += fragment.angular.y * deltaTime;
                            fragment.mesh.rotation.z += fragment.angular.z * deltaTime;
                            fragment.mesh.material.opacity = Math.max(0, 1 - fragment.age / fragment.life) * 0.5;

                            if (fragment.age >= fragment.life) {
                                scene.remove(fragment.mesh);
                                fragment.mesh.geometry.dispose();
                                fragment.mesh.material.dispose();
                                shatterState.fragments.splice(i, 1);
                            }
                        }

                        if (shatterState.dustPoints && shatterState.dustData) {
                            const { positions, colors, baseColors, velocities, ages, lifetimes } = shatterState.dustData;
                            let alive = 0;

                            for (let i = 0; i < ages.length; i++) {
                                const i3 = i * 3;
                                ages[i] += deltaTime;
                                const lifeT = Math.min(1, ages[i] / lifetimes[i]);

                                if (lifeT >= 1) {
                                    colors[i3] = 0;
                                    colors[i3 + 1] = 0;
                                    colors[i3 + 2] = 0;
                                    continue;
                                }

                                alive++;
                                velocities[i3] *= 0.992;
                                velocities[i3 + 1] *= 0.992;
                                velocities[i3 + 2] *= 0.992;
                                positions[i3] += velocities[i3] * deltaTime;
                                positions[i3 + 1] += velocities[i3 + 1] * deltaTime;
                                positions[i3 + 2] += velocities[i3 + 2] * deltaTime;

                                const fade = Math.pow(1 - lifeT, 1.45);
                                colors[i3] = baseColors[i3] * fade;
                                colors[i3 + 1] = baseColors[i3 + 1] * fade;
                                colors[i3 + 2] = baseColors[i3 + 2] * fade;
                            }

                            shatterState.dustPoints.geometry.attributes.position.needsUpdate = true;
                            shatterState.dustPoints.geometry.attributes.color.needsUpdate = true;

                            if (alive === 0) {
                                scene.remove(shatterState.dustPoints);
                                shatterState.dustPoints.geometry.dispose();
                                shatterState.dustPoints.material.dispose();
                                shatterState.dustPoints = null;
                                shatterState.dustData = null;
                            }
                        }
                    }
                }
            } else if (activeCrystal) {
                activeCrystal.position.set(0, 0, 0);
            }

            if (!cinematicState.active) {
                updateCrystalShells(elapsedTime, crackProgress);

                light1.position.x = Math.sin(elapsedTime * 0.4) * 2.7;
                light1.position.y = Math.cos(elapsedTime * 0.3) * 2.1;
                light1.position.z = Math.cos(elapsedTime * 0.24) * 2.3;

                light2.position.x = Math.cos(elapsedTime * 0.62) * 2.3;
                light2.position.y = Math.sin(elapsedTime * 0.5) * 1.9;
                light2.position.z = Math.sin(elapsedTime * 0.4) * 2.2;

                rimLight.position.x = Math.sin(elapsedTime * 0.18) * 4.2;
                rimLight.position.z = -3.2 + Math.cos(elapsedTime * 0.22) * 0.5;
                sparkleLight.position.x = 0.62 + Math.sin(elapsedTime * 0.9) * 0.22;
                sparkleLight.position.y = 1.22 + Math.cos(elapsedTime * 1.1) * 0.16;
                sparkleLight.position.z = 1.72 + Math.sin(elapsedTime * 0.8) * 0.2;
            }

            if (cinematicState.active) {
                updateCinematicTransition(elapsedTime, deltaTime);
            } else {
                setCinematicOverlayVisuals(0, 0, 0);
                applyCinematicTone(0, 0);
                if (!SIMPLE_CINEMATIC_MODE) {
                    updateCinematicSpeedCanvas(elapsedTime, deltaTime, 0, 0);
                }
            }

            if (!cinematicState.active) controls.update();
            const labelUpdateStride = performanceState.lowQuality
                ? (runtimePerfState.ultraLow ? RENDER_PROFILE.labelUpdateStrideLow + 1 : RENDER_PROFILE.labelUpdateStrideLow)
                : 1;
            if (performanceState.frameIndex % labelUpdateStride === 0) {
                updateSphereLabel(deltaTime, elapsedTime);
                updateCrystalClickHint(deltaTime, elapsedTime);
            }

            const useComposerRender = cinematicState.active || !performanceState.lowQuality || !RENDER_PROFILE.preferDirectRenderInLow;
            if (useComposerRender) {
                composer.render();
            } else {
                renderer.render(scene, camera);
            }

            if (startupPreloaderState.active) {
                startupPreloaderState.firstFrameRendered = true;
                updateStartupPreloader(nowMs);
            }
        }

        function handleViewportResize() {
            refreshViewportModeFlags();
            applyLowEndProfileOverrides();
            pointerHoverState.intervalMs = LOW_END_MODE ? 72 : 28;

            const { width, height } = getViewportSize();

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            spaceLensPass.uniforms.uAspect.value = width / Math.max(height, 1);
            performanceState.pixelRatio = getEffectivePixelRatio(performanceState.lowQuality);
            renderer.setPixelRatio(performanceState.pixelRatio);
            renderer.setSize(width, height);
            const composerScale = getEffectiveComposerScale(performanceState.lowQuality);
            composer.setSize(
                Math.max(1, Math.floor(width * composerScale)),
                Math.max(1, Math.floor(height * composerScale))
            );
            refreshRendererRect();
            resizeCinematicSpeedCanvas();
            subtitleRotatingController?.refresh();
            applyViewportSceneAdaptation();
            lastRenderedFrameMs = performance.now();
        }

        window.addEventListener('resize', handleViewportResize);
        window.visualViewport?.addEventListener('resize', handleViewportResize, { passive: true });

        window.addEventListener('scroll', refreshRendererRect, { passive: true });
        window.addEventListener('orientationchange', handleViewportResize, { passive: true });

        applyViewportSceneAdaptation();

        animate();


