export function createCrystalSectorsSystem({
    THREE,
    crystalPivot,
    particleSprite,
    cometTrailTexture,
    MOBILE_MODE,
    scaleCount,
    scaleSegments
}) {
    const AXIS_X = new THREE.Vector3(1, 0, 0);
    const WORLD_UP = new THREE.Vector3(0, 1, 0);

    const root = new THREE.Group();
    root.name = 'crystal-sectors-root';
    crystalPivot.add(root);

    let crystalRadius = 1.35;
    let visibility = 1;
    let targetVisibility = 1;
    let hoveredSectorKey = null;
    let clickedSectorKey = null;
    let clickAnimationProgress = 1;
    const clickAnimationDuration = MOBILE_MODE ? 0.56 : 0.72;
    let layoutCompaction = 0;

    function easeOutCubic(t) {
        const clamped = THREE.MathUtils.clamp(t, 0, 1);
        return 1 - Math.pow(1 - clamped, 3);
    }

    const centerGroup = new THREE.Group();
    root.add(centerGroup);

    const centerGlowTexture = createRadialTexture(512, [
        [0.0, 'rgba(255,255,255,0.96)'],
        [0.18, 'rgba(199,168,255,0.92)'],
        [0.45, 'rgba(146,179,255,0.42)'],
        [1.0, 'rgba(130,164,255,0)']
    ]);

    const centerGlow = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: centerGlowTexture,
            transparent: true,
            opacity: 0.34,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true,
            color: 0xe6d5ff
        })
    );
    centerGroup.add(centerGlow);

    const centerHalo = new THREE.Mesh(
        new THREE.TorusGeometry(0.82, 0.02, scaleSegments(10, 8), scaleSegments(96, 40)),
        new THREE.MeshBasicMaterial({
            color: 0xcaaeff,
            transparent: true,
            opacity: 0.28,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    centerHalo.rotation.x = Math.PI * 0.5;
    centerGroup.add(centerHalo);

    const centerHaloSecondary = new THREE.Mesh(
        new THREE.TorusGeometry(1.0, 0.015, scaleSegments(10, 8), scaleSegments(72, 30)),
        new THREE.MeshBasicMaterial({
            color: 0x98c9ff,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    centerHaloSecondary.rotation.set(Math.PI * 0.32, Math.PI * 0.28, 0.2);
    centerGroup.add(centerHaloSecondary);

    const centerHaloThin = new THREE.Mesh(
        new THREE.TorusGeometry(1.22, 0.01, scaleSegments(8, 8), scaleSegments(64, 24)),
        new THREE.MeshBasicMaterial({
            color: 0x8ed9ff,
            transparent: true,
            opacity: 0.14,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
    );
    centerHaloThin.rotation.set(Math.PI * 0.58, Math.PI * 0.12, -0.16);
    centerGroup.add(centerHaloThin);

    const centerDustCount = scaleCount(MOBILE_MODE ? 110 : 180, 70);
    const centerDustPositions = new Float32Array(centerDustCount * 3);
    const centerDustColors = new Float32Array(centerDustCount * 3);
    const centerDustData = new Array(centerDustCount);

    const centerDustGeometry = new THREE.BufferGeometry();
    centerDustGeometry.setAttribute('position', new THREE.BufferAttribute(centerDustPositions, 3));
    centerDustGeometry.setAttribute('color', new THREE.BufferAttribute(centerDustColors, 3));

    const centerDustMaterial = new THREE.PointsMaterial({
        size: MOBILE_MODE ? 0.028 : 0.036,
        sizeAttenuation: true,
        map: particleSprite,
        transparent: true,
        opacity: 0.54,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true
    });

    const centerDust = new THREE.Points(centerDustGeometry, centerDustMaterial);
    centerGroup.add(centerDust);

    for (let i = 0; i < centerDustCount; i += 1) {
        const i3 = i * 3;
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.32 + Math.random() * 0.82;
        const height = (Math.random() - 0.5) * 0.6;
        centerDustPositions[i3] = Math.cos(angle) * radius;
        centerDustPositions[i3 + 1] = height;
        centerDustPositions[i3 + 2] = Math.sin(angle) * radius;

        const mix = Math.random();
        const c = new THREE.Color(0xd6c5ff).lerp(new THREE.Color(0x9ed4ff), mix);
        centerDustColors[i3] = c.r;
        centerDustColors[i3 + 1] = c.g;
        centerDustColors[i3 + 2] = c.b;

        centerDustData[i] = {
            angle,
            radius,
            height,
            speed: 0.28 + Math.random() * 0.75,
            wave: Math.random() * Math.PI * 2
        };
    }

    const shardGeometry = new THREE.OctahedronGeometry(0.045, 0);
    const workGeometries = [
        new THREE.BoxGeometry(0.06, 0.06, 0.06),
        new THREE.OctahedronGeometry(0.05, 0),
        new THREE.TetrahedronGeometry(0.055, 0)
    ];

    const sectorConfigs = [
        {
            key: 'home',
            direction: new THREE.Vector3(-1, 0.48, -0.32),
            color: 0x8fc8ff,
            accent: 0xbbe2ff,
            label: 'КТО МЫ',
            labelOffsetY: 0.16,
            lengthOffset: 1.32,
            lengthScale: 1.1,
            width: 0.2,
            streamCount: MOBILE_MODE ? 24 : 38,
            symbolType: 'home'
        },
        {
            key: 'portfolio',
            direction: new THREE.Vector3(1, 0.5, -0.3),
            color: 0xd9afff,
            accent: 0xf1d2ff,
            label: 'ПОРТФОЛИО',
            labelOffsetY: 0.16,
            lengthOffset: 1.4,
            lengthScale: 1.14,
            width: 0.2,
            streamCount: MOBILE_MODE ? 26 : 42,
            symbolType: 'portfolio'
        },
        {
            key: 'works',
            direction: new THREE.Vector3(-1, -0.52, -0.26),
            color: 0x97ebff,
            accent: 0xbaf6ff,
            label: 'НАШИ РАБОТЫ',
            labelOffsetY: -0.16,
            lengthOffset: 1.36,
            lengthScale: 1.16,
            width: 0.2,
            streamCount: MOBILE_MODE ? 26 : 44,
            symbolType: 'works'
        },
        {
            key: 'contact',
            direction: new THREE.Vector3(1, -0.5, -0.24),
            color: 0xff9edd,
            accent: 0xffcaea,
            label: 'СВЯЗАТЬСЯ',
            labelOffsetY: -0.16,
            lengthOffset: 1.48,
            lengthScale: 1.2,
            width: 0.2,
            streamCount: MOBILE_MODE ? 22 : 36,
            symbolType: 'contact'
        }
    ];

    const sectors = sectorConfigs.map((config, index) => createSector(config, index));

    const tempBox = new THREE.Box3();
    const tempSize = new THREE.Vector3();

    syncWithCrystal(null);

    function createSector(config, index) {
        const group = new THREE.Group();
        group.name = `crystal-sector-${config.key}`;
        root.add(group);

        const beamTexture = createBeamTexture(config.color, config.accent);
        const beamMaterial = new THREE.MeshBasicMaterial({
            map: beamTexture,
            color: config.color,
            transparent: true,
            opacity: 0.34,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const beam = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), beamMaterial);
        beam.position.x = 0.5;
        group.add(beam);

        const ribbonTexture = createRibbonTexture(config.color, config.accent);
        const beamRibMaterial = new THREE.MeshBasicMaterial({
            map: ribbonTexture,
            color: config.accent,
            transparent: true,
            opacity: 0.24,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const beamRib = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), beamRibMaterial);
        beamRib.position.x = 0.5;
        beamRib.position.z = 0.015;
        group.add(beamRib);

        const linePositions = new Float32Array([0, 0, 0, 1, 0, 0]);
        const conduitGeometry = new THREE.BufferGeometry();
        conduitGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

        const conduitMaterial = new THREE.LineBasicMaterial({
            color: config.accent,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const conduit = new THREE.Line(conduitGeometry, conduitMaterial);
        group.add(conduit);

        const endpoint = new THREE.Group();
        endpoint.position.x = 1;
        group.add(endpoint);

        const endpointRing = new THREE.Mesh(
            new THREE.RingGeometry(0.2, 0.42, scaleSegments(48, 20)),
            new THREE.MeshBasicMaterial({
                color: config.accent,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        endpointRing.rotation.y = Math.PI * 0.5;
        endpoint.add(endpointRing);

        const endpointRingSecondary = new THREE.Mesh(
            new THREE.RingGeometry(0.32, 0.5, scaleSegments(40, 16)),
            new THREE.MeshBasicMaterial({
                color: config.color,
                transparent: true,
                opacity: 0.28,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        endpointRingSecondary.rotation.y = Math.PI * 0.5;
        endpoint.add(endpointRingSecondary);

        const endpointCore = new THREE.Mesh(
            new THREE.CircleGeometry(0.145, scaleSegments(44, 20)),
            new THREE.MeshBasicMaterial({
                color: config.accent,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        endpointCore.rotation.y = Math.PI * 0.5;
        endpoint.add(endpointCore);

        const clickWaveRing = new THREE.Mesh(
            new THREE.RingGeometry(0.28, 0.34, scaleSegments(40, 18)),
            new THREE.MeshBasicMaterial({
                color: config.accent,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false
            })
        );
        clickWaveRing.rotation.y = Math.PI * 0.5;
        clickWaveRing.scale.setScalar(0.84);
        endpoint.add(clickWaveRing);

        const endpointHitArea = new THREE.Mesh(
            new THREE.SphereGeometry(0.62, scaleSegments(18, 12), scaleSegments(16, 10)),
            new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                depthWrite: false,
                depthTest: false
            })
        );
        endpointHitArea.userData.crystalSectorKey = config.key;
        endpointHitArea.userData.crystalSectorLabel = config.label;
        endpointHitArea.userData.isCrystalSectorTarget = true;
        endpoint.add(endpointHitArea);

        const symbolTexture = createSymbolTexture(config.symbolType, config.accent);
        const symbol = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: symbolTexture,
                transparent: true,
                opacity: 0.62,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: false,
                color: 0xffffff
            })
        );
        symbol.position.set(0, 0.36, 0);
        symbol.scale.set(1.08, 0.56, 1);
        endpoint.add(symbol);

        const endpointAuraTexture = createRadialTexture(384, [
            [0.0, 'rgba(255,255,255,1)'],
            [0.22, 'rgba(255,255,255,0.54)'],
            [0.64, 'rgba(255,255,255,0.14)'],
            [1.0, 'rgba(255,255,255,0)']
        ]);
        const endpointAura = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: endpointAuraTexture,
                color: config.color,
                transparent: true,
                opacity: 0.2,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: true
            })
        );
        endpointAura.scale.set(1.2, 1.2, 1);
        endpoint.add(endpointAura);

        const labelTexture = createLabelTexture(config.label, config.accent, config.color);
        const label = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: labelTexture,
                transparent: true,
                opacity: 0.88,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: false,
                color: 0xffffff
            })
        );
        label.position.set(0.42, config.labelOffsetY ?? 0.16, 0.06);
        label.scale.set(1.7, 0.46, 1);
        group.add(label);

        const clickHintTexture = createClickHintTexture('НАЖМИ');
        const clickHint = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: clickHintTexture,
                transparent: true,
                opacity: 0.58,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: false,
                color: config.accent
            })
        );
        clickHint.position.set(0, -0.48, 0.02);
        clickHint.scale.set(0.62, 0.22, 1);
        endpoint.add(clickHint);

        const flowArrowTexture = createChevronTexture(config.color, config.accent);
        const flowArrowCount = 0;
        const flowArrows = [];
        for (let i = 0; i < flowArrowCount; i += 1) {
            const flowArrow = new THREE.Mesh(
                new THREE.PlaneGeometry(0.18, 0.12),
                new THREE.MeshBasicMaterial({
                    map: flowArrowTexture,
                    transparent: true,
                    opacity: 0.12,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    color: 0xffffff
                })
            );
            group.add(flowArrow);
            flowArrows.push({
                mesh: flowArrow,
                progress: Math.random(),
                speed: 0.18 + Math.random() * 0.36,
                phase: Math.random() * Math.PI * 2
            });
        }

        const streamCount = scaleCount(config.streamCount, 18);
        const streamPositions = new Float32Array(streamCount * 3);
        const streamColors = new Float32Array(streamCount * 3);
        const streamData = new Array(streamCount);
        const streamColor = new THREE.Color(config.color);

        const streamGeometry = new THREE.BufferGeometry();
        streamGeometry.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
        streamGeometry.setAttribute('color', new THREE.BufferAttribute(streamColors, 3));

        const streamMaterial = new THREE.PointsMaterial({
            size: MOBILE_MODE ? 0.035 : 0.045,
            sizeAttenuation: true,
            map: particleSprite,
            transparent: true,
            opacity: 0.56,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });

        const streamPoints = new THREE.Points(streamGeometry, streamMaterial);
        group.add(streamPoints);

        for (let i = 0; i < streamCount; i += 1) {
            const i3 = i * 3;
            streamPositions[i3] = Math.random();
            streamPositions[i3 + 1] = 0;
            streamPositions[i3 + 2] = 0;

            const brightness = 0.68 + Math.random() * 0.32;
            streamColors[i3] = streamColor.r * brightness;
            streamColors[i3 + 1] = streamColor.g * brightness;
            streamColors[i3 + 2] = streamColor.b * brightness;

            streamData[i] = {
                progress: Math.random(),
                speed: 0.28 + Math.random() * 0.68,
                spread: 0.04 + Math.random() * 0.2,
                phase: Math.random() * Math.PI * 2
            };
        }

        const extra = createSectorExtra(config, group, endpoint, index);

        return {
            config,
            group,
            direction: config.direction.clone().normalize(),
            length: 1,
            beam,
            beamMaterial,
            beamTexture,
            beamRib,
            beamRibMaterial,
            conduit,
            conduitLinePositions: linePositions,
            conduitGeometry,
            endpoint,
            endpointRing,
            endpointRingSecondary,
            endpointCore,
            clickWaveRing,
            endpointHitArea,
            endpointAura,
            symbol,
            label,
            clickHint,
            streamPositions,
            streamGeometry,
            streamMaterial,
            streamData,
            flowArrows,
            baseWidth: 0,
            auraBaseScale: 1,
            hoverMix: 0,
            extra
        };
    }

    function createSectorExtra(config, group, endpoint, index) {
        if (config.key === 'home') {
            const panelTexture = createSymbolTexture('home', config.accent, true);
            const panel = new THREE.Mesh(
                new THREE.PlaneGeometry(0.75, 0.42),
                new THREE.MeshBasicMaterial({
                    map: panelTexture,
                    transparent: true,
                    opacity: 0.28,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    color: 0xe6f4ff
                })
            );
            panel.rotation.y = Math.PI * 0.5;
            panel.position.set(0.18, 0.04, 0);
            endpoint.add(panel);

            const fragments = [];
            for (let i = 0; i < (MOBILE_MODE ? 6 : 10); i += 1) {
                const material = new THREE.MeshBasicMaterial({
                    color: i % 2 === 0 ? 0xb6dcff : 0xe3f2ff,
                    transparent: true,
                    opacity: 0.5,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const mesh = new THREE.Mesh(shardGeometry, material);
                group.add(mesh);
                fragments.push({
                    mesh,
                    baseX: 0.45 + Math.random() * 0.5,
                    orbit: 0.08 + Math.random() * 0.28,
                    phase: Math.random() * Math.PI * 2,
                    speed: 1.1 + Math.random() * 1.7,
                    roll: 0.8 + Math.random() * 2.1
                });
            }

            return { type: 'home', panel, fragments };
        }

        if (config.key === 'portfolio') {
            const cardTexture = createCardTexture(config.accent);
            const cards = [];
            for (let i = 0; i < (MOBILE_MODE ? 4 : 7); i += 1) {
                const material = new THREE.MeshBasicMaterial({
                    map: cardTexture,
                    transparent: true,
                    opacity: 0.44,
                    blending: THREE.AdditiveBlending,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    color: i % 2 === 0 ? 0xf1ddff : 0xc8b8ff
                });

                const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.22), material);
                group.add(mesh);
                cards.push({
                    mesh,
                    progress: Math.random(),
                    speed: 0.2 + Math.random() * 0.5,
                    offsetY: (Math.random() - 0.5) * 0.3,
                    offsetZ: (Math.random() - 0.5) * 0.26,
                    phase: Math.random() * Math.PI * 2
                });
            }

            return { type: 'portfolio', cards };
        }

        if (config.key === 'works') {
            const objects = [];
            for (let i = 0; i < (MOBILE_MODE ? 5 : 9); i += 1) {
                const geometry = workGeometries[i % workGeometries.length];
                const material = new THREE.MeshBasicMaterial({
                    color: i % 2 === 0 ? 0xa1ffff : 0x8fd6ff,
                    transparent: true,
                    opacity: 0.5,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const mesh = new THREE.Mesh(geometry, material);
                group.add(mesh);
                objects.push({
                    mesh,
                    angle: Math.random() * Math.PI * 2,
                    radius: 0.1 + Math.random() * 0.36,
                    baseX: 0.62 + Math.random() * 0.42,
                    speed: 0.8 + Math.random() * 1.8,
                    tilt: (Math.random() - 0.5) * 0.6
                });
            }

            return { type: 'works', objects };
        }

        const pulses = [];
        for (let i = 0; i < (MOBILE_MODE ? 4 : 6); i += 1) {
            const material = new THREE.MeshBasicMaterial({
                color: 0xffccf0,
                transparent: true,
                opacity: 0.7,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), material);
            group.add(mesh);
            pulses.push({
                mesh,
                progress: Math.random(),
                speed: 0.4 + Math.random() * 0.7,
                phase: Math.random() * Math.PI * 2
            });
        }

        const signalRingA = new THREE.Mesh(
            new THREE.TorusGeometry(0.24, 0.012, 8, 48),
            new THREE.MeshBasicMaterial({
                color: 0xffb4e9,
                transparent: true,
                opacity: 0.42,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        signalRingA.rotation.y = Math.PI * 0.5;
        endpoint.add(signalRingA);

        const signalRingB = new THREE.Mesh(
            new THREE.TorusGeometry(0.34, 0.009, 8, 48),
            new THREE.MeshBasicMaterial({
                color: 0xffd7f2,
                transparent: true,
                opacity: 0.24,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        signalRingB.rotation.y = Math.PI * 0.5;
        endpoint.add(signalRingB);

        return { type: 'contact', pulses, signalRingA, signalRingB };
    }

    function createBeamTexture(baseColorHex, accentColorHex) {
        const sizeX = 512;
        const sizeY = 64;
        const canvas = document.createElement('canvas');
        canvas.width = sizeX;
        canvas.height = sizeY;
        const ctx = canvas.getContext('2d');

        const base = new THREE.Color(baseColorHex);
        const accent = new THREE.Color(accentColorHex);
        const baseRgb = `${Math.round(base.r * 255)},${Math.round(base.g * 255)},${Math.round(base.b * 255)}`;
        const accentRgb = `${Math.round(accent.r * 255)},${Math.round(accent.g * 255)},${Math.round(accent.b * 255)}`;

        const body = ctx.createLinearGradient(0, 0, sizeX, 0);
        body.addColorStop(0, `rgba(${accentRgb},0.96)`);
        body.addColorStop(0.18, `rgba(${baseRgb},0.72)`);
        body.addColorStop(0.55, `rgba(${baseRgb},0.28)`);
        body.addColorStop(0.9, `rgba(${baseRgb},0.08)`);
        body.addColorStop(1, `rgba(${baseRgb},0)`);
        ctx.fillStyle = body;
        ctx.fillRect(0, 0, sizeX, sizeY);

        const centerLine = ctx.createLinearGradient(0, 0, sizeX, 0);
        centerLine.addColorStop(0, `rgba(${accentRgb},0.92)`);
        centerLine.addColorStop(0.4, `rgba(${accentRgb},0.4)`);
        centerLine.addColorStop(1, `rgba(${accentRgb},0)`);
        ctx.fillStyle = centerLine;
        ctx.fillRect(0, sizeY * 0.42, sizeX, sizeY * 0.16);

        for (let i = 0; i < 10; i += 1) {
            const x = 58 + i * 42;
            const alpha = 0.1 + (i % 4) * 0.04;
            const rx = 5 + (i % 3) * 2;
            const ry = 4 + (i % 2) * 1.5;
            ctx.fillStyle = `rgba(${accentRgb},${alpha})`;
            ctx.beginPath();
            ctx.ellipse(x, sizeY * 0.5, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        const edgeMask = ctx.createLinearGradient(0, 0, 0, sizeY);
        edgeMask.addColorStop(0, 'rgba(255,255,255,0)');
        edgeMask.addColorStop(0.2, 'rgba(255,255,255,1)');
        edgeMask.addColorStop(0.8, 'rgba(255,255,255,1)');
        edgeMask.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = edgeMask;
        ctx.fillRect(0, 0, sizeX, sizeY);
        ctx.globalCompositeOperation = 'source-over';

        const headGlow = ctx.createRadialGradient(0, sizeY * 0.5, 2, 0, sizeY * 0.5, sizeY * 0.95);
        headGlow.addColorStop(0, `rgba(${accentRgb},0.92)`);
        headGlow.addColorStop(1, `rgba(${accentRgb},0)`);
        ctx.fillStyle = headGlow;
        ctx.fillRect(0, 0, sizeX * 0.42, sizeY);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1.5, 1);
        return texture;
    }

    function createRibbonTexture(baseColorHex, accentColorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        const base = new THREE.Color(baseColorHex);
        const accent = new THREE.Color(accentColorHex);
        const baseRgb = `${Math.round(base.r * 255)},${Math.round(base.g * 255)},${Math.round(base.b * 255)}`;
        const accentRgb = `${Math.round(accent.r * 255)},${Math.round(accent.g * 255)},${Math.round(accent.b * 255)}`;

        const streak = ctx.createLinearGradient(0, 0, canvas.width, 0);
        streak.addColorStop(0, `rgba(${accentRgb},0.78)`);
        streak.addColorStop(0.22, `rgba(${baseRgb},0.34)`);
        streak.addColorStop(0.78, `rgba(${baseRgb},0.12)`);
        streak.addColorStop(1, `rgba(${baseRgb},0)`);
        ctx.fillStyle = streak;
        ctx.fillRect(0, canvas.height * 0.38, canvas.width, canvas.height * 0.24);

        for (let i = 0; i < 9; i += 1) {
            const x = 24 + i * 52;
            const a = 0.2 + (i % 3) * 0.08;
            ctx.fillStyle = `rgba(${accentRgb},${a})`;
            ctx.beginPath();
            ctx.ellipse(x, canvas.height * 0.5, 9 + (i % 2) * 4, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        const soft = ctx.createLinearGradient(0, 0, 0, canvas.height);
        soft.addColorStop(0, 'rgba(255,255,255,0)');
        soft.addColorStop(0.35, 'rgba(255,255,255,1)');
        soft.addColorStop(0.65, 'rgba(255,255,255,1)');
        soft.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = soft;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1.8, 1);
        return texture;
    }

    function createCardTexture(colorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');

        const color = new THREE.Color(colorHex);
        const rgb = `${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)}`;

        const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bg.addColorStop(0, `rgba(${rgb},0.56)`);
        bg.addColorStop(1, `rgba(${rgb},0.08)`);
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = `rgba(${rgb},0.92)`;
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        for (let i = 0; i < 3; i += 1) {
            const y = 34 + i * 36;
            ctx.fillStyle = `rgba(255,255,255,${0.56 - i * 0.12})`;
            ctx.fillRect(26, y, canvas.width - 52 - i * 22, 8);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    function createChevronTexture(baseColorHex, accentColorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 220;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');

        const base = new THREE.Color(baseColorHex);
        const accent = new THREE.Color(accentColorHex);
        const baseRgb = `${Math.round(base.r * 255)},${Math.round(base.g * 255)},${Math.round(base.b * 255)}`;
        const accentRgb = `${Math.round(accent.r * 255)},${Math.round(accent.g * 255)},${Math.round(accent.b * 255)}`;

        const body = ctx.createLinearGradient(0, 0, canvas.width, 0);
        body.addColorStop(0, `rgba(${accentRgb},0)`);
        body.addColorStop(0.2, `rgba(${accentRgb},0.78)`);
        body.addColorStop(0.7, `rgba(${baseRgb},0.34)`);
        body.addColorStop(1, `rgba(${baseRgb},0)`);

        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.52, canvas.height * 0.5, canvas.width * 0.42, canvas.height * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${accentRgb},0.82)`;
        ctx.beginPath();
        ctx.ellipse(canvas.width * 0.24, canvas.height * 0.5, canvas.width * 0.1, canvas.height * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        const soft = ctx.createLinearGradient(0, 0, 0, canvas.height);
        soft.addColorStop(0, 'rgba(255,255,255,0)');
        soft.addColorStop(0.26, 'rgba(255,255,255,1)');
        soft.addColorStop(0.74, 'rgba(255,255,255,1)');
        soft.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.fillStyle = soft;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    function createClickHintTexture(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 192;
        const ctx = canvas.getContext('2d');

        const bg = ctx.createLinearGradient(0, 0, canvas.width, 0);
        bg.addColorStop(0, 'rgba(255,255,255,0)');
        bg.addColorStop(0.2, 'rgba(255,255,255,0.34)');
        bg.addColorStop(0.8, 'rgba(255,255,255,0.34)');
        bg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = bg;
        drawRoundedRect(ctx, 80, 52, canvas.width - 160, canvas.height - 104, 32);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.86)';
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.font = '800 68px "Sora", "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.strokeStyle = 'rgba(10, 12, 30, 0.86)';
        ctx.lineWidth = 10;
        ctx.strokeText(text, canvas.width * 0.5, canvas.height * 0.52);

        ctx.fillStyle = 'rgba(240, 248, 255, 0.98)';
        ctx.fillText(text, canvas.width * 0.5, canvas.height * 0.52);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    function createLabelTexture(text, accentHex, colorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const accent = new THREE.Color(accentHex);
        const base = new THREE.Color(colorHex);
        const accentRgb = `${Math.round(accent.r * 255)},${Math.round(accent.g * 255)},${Math.round(accent.b * 255)}`;
        const baseRgb = `${Math.round(base.r * 255)},${Math.round(base.g * 255)},${Math.round(base.b * 255)}`;

        const bg = ctx.createLinearGradient(0, 0, canvas.width, 0);
        bg.addColorStop(0, `rgba(${accentRgb},0)`);
        bg.addColorStop(0.2, `rgba(${baseRgb},0.38)`);
        bg.addColorStop(0.8, `rgba(${baseRgb},0.38)`);
        bg.addColorStop(1, `rgba(${accentRgb},0)`);
        ctx.fillStyle = bg;
        drawRoundedRect(ctx, 90, 66, canvas.width - 180, canvas.height - 132, 46);
        ctx.fill();

        ctx.strokeStyle = `rgba(${accentRgb},0.96)`;
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.font = '900 92px "Sora", "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';

        ctx.strokeStyle = 'rgba(10, 12, 34, 0.92)';
        ctx.lineWidth = 15;
        ctx.strokeText(text, canvas.width * 0.5, canvas.height * 0.5 + 2);

        ctx.fillStyle = 'rgba(250, 253, 255, 1)';
        ctx.fillText(text, canvas.width * 0.5, canvas.height * 0.5 + 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    function createSymbolTexture(type, colorHex, panelMode = false) {
        const width = panelMode ? 384 : 256;
        const height = panelMode ? 192 : 128;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        const color = new THREE.Color(colorHex);
        const rgb = `${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)}`;

        ctx.clearRect(0, 0, width, height);

        const glow = ctx.createRadialGradient(width * 0.5, height * 0.5, 2, width * 0.5, height * 0.5, width * 0.5);
        glow.addColorStop(0, `rgba(${rgb},0.62)`);
        glow.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = `rgba(${rgb},0.96)`;
        ctx.fillStyle = `rgba(${rgb},0.18)`;
        ctx.lineWidth = panelMode ? 4 : 3;
        drawRoundedRect(ctx, 10, 10, width - 20, height - 20, panelMode ? 16 : 12);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.99)';
        ctx.lineWidth = panelMode ? 7 : 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (type === 'home') {
            ctx.beginPath();
            ctx.moveTo(width * 0.33, height * 0.58);
            ctx.lineTo(width * 0.5, height * 0.34);
            ctx.lineTo(width * 0.67, height * 0.58);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(width * 0.38, height * 0.56);
            ctx.lineTo(width * 0.38, height * 0.74);
            ctx.lineTo(width * 0.62, height * 0.74);
            ctx.lineTo(width * 0.62, height * 0.56);
            ctx.stroke();
        } else if (type === 'portfolio') {
            ctx.strokeRect(width * 0.27, height * 0.34, width * 0.3, height * 0.28);
            ctx.strokeRect(width * 0.39, height * 0.43, width * 0.3, height * 0.28);
            ctx.beginPath();
            ctx.moveTo(width * 0.32, height * 0.48);
            ctx.lineTo(width * 0.52, height * 0.48);
            ctx.moveTo(width * 0.44, height * 0.57);
            ctx.lineTo(width * 0.64, height * 0.57);
            ctx.stroke();
        } else if (type === 'works') {
            ctx.beginPath();
            ctx.arc(width * 0.34, height * 0.5, height * 0.1, 0, Math.PI * 2);
            ctx.arc(width * 0.5, height * 0.35, height * 0.08, 0, Math.PI * 2);
            ctx.arc(width * 0.66, height * 0.55, height * 0.1, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(width * 0.34, height * 0.5);
            ctx.lineTo(width * 0.5, height * 0.35);
            ctx.lineTo(width * 0.66, height * 0.55);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(width * 0.47, height * 0.52, height * 0.16, Math.PI * 0.1, Math.PI * 1.7);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(width * 0.56, height * 0.52, height * 0.26, Math.PI * 0.18, Math.PI * 1.64);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(width * 0.65, height * 0.52, height * 0.36, Math.PI * 0.24, Math.PI * 1.58);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(width * 0.38, height * 0.52, height * 0.03, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    function drawRoundedRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width * 0.5, height * 0.5);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function createRadialTexture(size, stops) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5);
        for (const [offset, color] of stops) {
            gradient.addColorStop(offset, color);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    function syncWithCrystal(crystalRoot) {
        if (crystalRoot) {
            tempBox.setFromObject(crystalRoot);
            tempBox.getSize(tempSize);
            const largestSide = Math.max(tempSize.x, tempSize.y, tempSize.z) || 1;
            crystalRadius = THREE.MathUtils.clamp(largestSide * 0.42, 0.86, 2.9);
        }

        centerGlow.scale.setScalar(crystalRadius * 2.9);
        centerHalo.scale.setScalar(crystalRadius * 0.98);
        centerHaloSecondary.scale.setScalar(crystalRadius * 1.04);
        centerHaloThin.scale.setScalar(crystalRadius * 1.12);

        for (const sector of sectors) {
            applySectorLayout(sector);
        }
    }

    function applySectorLayout(sector) {
        const { config } = sector;
        const compact = layoutCompaction;
        const lengthScale = 1 - compact * 0.28;
        const widthScale = 1 - compact * 0.14;
        const startOffset = crystalRadius * (0.62 - compact * 0.08);
        const rawLength = (config.lengthOffset + crystalRadius * config.lengthScale) * lengthScale;
        const minLength = (MOBILE_MODE ? 1.8 : 2.15) * (1 - compact * 0.12);
        const maxLength = (MOBILE_MODE ? 2.4 : 2.75) * (1 - compact * 0.2);
        const length = THREE.MathUtils.clamp(rawLength, minLength, maxLength);
        const width = (config.width + crystalRadius * 0.045) * widthScale;

        sector.length = length;
        sector.baseWidth = width;
        sector.group.position.copy(sector.direction).multiplyScalar(startOffset);
        sector.group.quaternion.setFromUnitVectors(AXIS_X, sector.direction);

        sector.beam.position.x = length * 0.5;
        sector.beam.scale.set(length, width, 1);

        sector.beamRib.position.x = length * 0.52;
        sector.beamRib.scale.set(length * 0.94, width * 0.5, 1);

        sector.endpoint.position.x = length;

        if (sector.label) {
            const labelScaleX = (1.06 + crystalRadius * 0.25) * (1 - compact * 0.2);
            const labelScaleY = (0.33 + crystalRadius * 0.08) * (1 - compact * 0.16);
            sector.label.scale.set(labelScaleX, labelScaleY, 1);
            sector.label.position.x = length * THREE.MathUtils.lerp(0.44, 0.36, compact);
            sector.label.position.y = (sector.config.labelOffsetY ?? 0.16) * (0.86 + crystalRadius * 0.08) * (1 - compact * 0.08);
        }

        if (sector.symbol) {
            sector.symbol.scale.set(
                (0.98 + crystalRadius * 0.22) * (1 - compact * 0.12),
                (0.52 + crystalRadius * 0.12) * (1 - compact * 0.12),
                1
            );
        }

        if (sector.clickHint) {
            sector.clickHint.scale.set(
                (0.62 + crystalRadius * 0.11) * (1 - compact * 0.14),
                (0.24 + crystalRadius * 0.05) * (1 - compact * 0.12),
                1
            );
        }

        if (sector.endpointAura) {
            const auraScale = (0.72 + crystalRadius * 0.62) * (1 - compact * 0.16);
            sector.endpointAura.scale.set(auraScale, auraScale, 1);
            sector.auraBaseScale = auraScale;
        }

        sector.conduitLinePositions[3] = length;
        sector.conduitLinePositions[4] = 0;
        sector.conduitLinePositions[5] = 0;
        sector.conduitGeometry.attributes.position.needsUpdate = true;
    }

    function update(elapsedTime, deltaTime, options = {}) {
        targetVisibility = options.visible === false ? 0 : 1;
        const approachSpeed = targetVisibility < visibility ? 8.4 : 4.6;
        visibility += (targetVisibility - visibility) * Math.min(1, deltaTime * approachSpeed);

        const intensity = THREE.MathUtils.clamp(options.intensity ?? 1, 0, 1.4);
        const alpha = visibility * intensity;

        root.visible = alpha > 0.002;
        if (!root.visible) {
            return;
        }

        if (clickedSectorKey) {
            clickAnimationProgress = Math.min(1, clickAnimationProgress + deltaTime / clickAnimationDuration);
            if (clickAnimationProgress >= 1) {
                clickedSectorKey = null;
            }
        }

        const clickActive = !!clickedSectorKey;
        const clickT = clickActive ? clickAnimationProgress : 1;
        const clickWave = clickActive ? Math.sin(clickT * Math.PI) : 0;
        const clickFade = clickActive ? 1 - clickT : 0;

        centerGlow.material.opacity = 0.34 * alpha;
        centerHalo.material.opacity = 0.28 * alpha;
        centerHaloSecondary.material.opacity = 0.2 * alpha;
        centerHaloThin.material.opacity = 0.14 * alpha;

        centerHalo.rotation.z += deltaTime * 0.36;
        centerHaloSecondary.rotation.z -= deltaTime * 0.28;
        centerHaloThin.rotation.y += deltaTime * 0.18;

        for (let i = 0; i < centerDustData.length; i += 1) {
            const data = centerDustData[i];
            const i3 = i * 3;
            const angle = data.angle + elapsedTime * data.speed;
            const radiusJitter = 1 + Math.sin(elapsedTime * 1.4 + data.wave) * 0.08;
            centerDustPositions[i3] = Math.cos(angle) * data.radius * radiusJitter;
            centerDustPositions[i3 + 1] = data.height + Math.sin(elapsedTime * 2.2 + data.wave) * 0.04;
            centerDustPositions[i3 + 2] = Math.sin(angle) * data.radius * radiusJitter;
        }
        centerDustGeometry.attributes.position.needsUpdate = true;
        centerDustMaterial.opacity = 0.54 * alpha;

        for (let sectorIndex = 0; sectorIndex < sectors.length; sectorIndex += 1) {
            const sector = sectors[sectorIndex];
            const hoverTarget = hoveredSectorKey === sector.config.key ? 1 : 0;
            sector.hoverMix += (hoverTarget - sector.hoverMix) * Math.min(1, deltaTime * 11);
            const isClickedSector = clickActive && clickedSectorKey === sector.config.key;
            const clickBoost = isClickedSector ? clickWave * (0.9 + clickFade * 0.35) : 0;
            const focusMix = clickActive ? (isClickedSector ? 1 : 1 - clickFade * 0.58) : 1;
            const sectorPulse = 0.82 + Math.sin(elapsedTime * (1.4 + sectorIndex * 0.18)) * 0.18;
            const sectorAlpha = alpha * sectorPulse * Math.max(0.2, focusMix);
            const hoverBoost = THREE.MathUtils.clamp(sector.hoverMix + clickBoost * 0.58, 0, 1.8);
            const widthPulse = 0.96 + Math.sin(elapsedTime * (2 + sectorIndex * 0.42)) * 0.06;

            sector.beamMaterial.opacity = (0.34 + clickBoost * 0.42) * sectorAlpha;
            sector.beamRibMaterial.opacity = (0.24 + clickBoost * 0.32) * sectorAlpha;
            sector.beam.scale.y = sector.baseWidth * widthPulse * (1 + clickBoost * 0.52);
            sector.beamRib.scale.y = sector.baseWidth * 0.42 * (0.94 + Math.sin(elapsedTime * (2.3 + sectorIndex * 0.2)) * 0.06) * (1 + clickBoost * 0.42);
            sector.beamTexture.offset.x = (elapsedTime * (0.14 + sectorIndex * 0.03)) % 1;
            sector.beamRibMaterial.map.offset.x = (elapsedTime * (0.22 + sectorIndex * 0.04)) % 1;
            sector.conduit.material.opacity = (0.36 + clickBoost * 0.28) * sectorAlpha;
            sector.endpoint.position.x = sector.length + clickBoost * (0.16 + sectorIndex * 0.015);

            sector.endpointRing.material.opacity = (0.34 + hoverBoost * 0.28 + clickBoost * 0.3) * sectorAlpha;
            sector.endpointRingSecondary.material.opacity = (0.2 + hoverBoost * 0.22 + clickBoost * 0.26) * sectorAlpha;
            sector.endpointRing.scale.setScalar(1 + hoverBoost * 0.18 + clickBoost * 0.44);
            sector.endpointRingSecondary.scale.setScalar(1 + hoverBoost * 0.1 + clickBoost * 0.3);
            if (sector.endpointCore) {
                sector.endpointCore.material.opacity = (0.42 + hoverBoost * 0.36 + clickBoost * 0.28) * sectorAlpha;
                const corePulse = 0.94 + Math.sin(elapsedTime * (3 + sectorIndex * 0.4)) * 0.08;
                sector.endpointCore.scale.setScalar(corePulse + hoverBoost * 0.2 + clickBoost * 0.28);
            }
            if (sector.clickWaveRing) {
                const clickExpand = 0.84 + easeOutCubic(clickWave) * 1.36;
                sector.clickWaveRing.scale.setScalar(clickExpand);
                sector.clickWaveRing.material.opacity = (0.04 + clickWave * 0.62) * sectorAlpha;
            }
            sector.endpointRing.rotation.z += deltaTime * (0.8 + sectorIndex * 0.22);
            sector.endpointRingSecondary.rotation.z -= deltaTime * (0.54 + sectorIndex * 0.14);
            sector.symbol.material.opacity = (0.62 + hoverBoost * 0.28 + clickBoost * 0.24) * sectorAlpha;
            const symbolScaleX = 0.98 + crystalRadius * 0.22;
            const symbolScaleY = 0.52 + crystalRadius * 0.12;
            sector.symbol.scale.set(symbolScaleX * (1 + clickBoost * 0.2), symbolScaleY * (1 + clickBoost * 0.14), 1);
            if (sector.label) {
                sector.label.material.opacity = (0.94 + hoverBoost * 0.2 + clickBoost * 0.22) * sectorAlpha;
                sector.label.position.y = (sector.config.labelOffsetY ?? 0.16) * (0.86 + crystalRadius * 0.08)
                    + Math.sin(elapsedTime * 1.6 + sectorIndex) * 0.026
                    + clickBoost * 0.034;
                sector.label.scale.set(
                    (1.06 + crystalRadius * 0.25) * (1 + clickBoost * 0.08),
                    (0.33 + crystalRadius * 0.08) * (1 + clickBoost * 0.13),
                    1
                );
            }
            if (sector.clickHint) {
                const hintPulse = 0.84 + Math.sin(elapsedTime * 3.8 + sectorIndex * 0.7) * 0.16;
                sector.clickHint.material.opacity = (0.38 + hintPulse * 0.18 + hoverBoost * 0.24 + clickBoost * 0.2) * sectorAlpha;
                sector.clickHint.position.y = -0.52 + Math.sin(elapsedTime * 2 + sectorIndex * 0.9) * 0.02 - clickBoost * 0.03;
                sector.clickHint.scale.setScalar((0.74 + hintPulse * 0.08 + hoverBoost * 0.1 + clickBoost * 0.14) * (0.86 + crystalRadius * 0.08));
                sector.clickHint.scale.y *= 0.34;
            }
            if (sector.endpointAura) {
                const auraPulse = 0.92 + Math.sin(elapsedTime * (2.1 + sectorIndex * 0.35)) * 0.08;
                sector.endpointAura.material.opacity = (0.22 + hoverBoost * 0.22 + clickBoost * 0.3) * sectorAlpha;
                sector.endpointAura.scale.setScalar(sector.auraBaseScale * (auraPulse + hoverBoost * 0.14) * (1 + clickBoost * 0.82));
            }

            updateSectorStream(sector, elapsedTime, deltaTime, sectorAlpha);
            updateSectorArrows(sector, elapsedTime, deltaTime, sectorAlpha);
            updateSectorExtra(sector, elapsedTime, deltaTime, sectorAlpha, clickBoost);
        }
    }

    function updateSectorArrows(sector, elapsedTime, deltaTime, sectorAlpha) {
        if (!sector.flowArrows || !sector.flowArrows.length) {
            return;
        }

        for (const arrow of sector.flowArrows) {
            arrow.progress += deltaTime * arrow.speed;
            if (arrow.progress > 1) {
                arrow.progress -= 1;
            }

            const x = 0.16 + arrow.progress * (sector.length * 0.86);
            const wobble = Math.sin(elapsedTime * 4.4 + arrow.phase + arrow.progress * 10) * 0.022;
            const fadeIn = Math.min(1, arrow.progress / 0.22);
            const fadeOut = Math.min(1, (1 - arrow.progress) / 0.26);
            const fade = Math.min(fadeIn, fadeOut);

            arrow.mesh.position.set(x, wobble, 0.01);
            arrow.mesh.rotation.z = wobble * 1.8;
            arrow.mesh.material.opacity = (0.04 + fade * 0.15) * sectorAlpha;
            const s = 0.76 + Math.sin(elapsedTime * 7.2 + arrow.phase) * 0.08;
            arrow.mesh.scale.set(s * 0.8, s * 0.72, 1);
        }
    }

    function updateSectorStream(sector, elapsedTime, deltaTime, sectorAlpha) {
        const { streamData, streamPositions, streamGeometry, length } = sector;

        for (let i = 0; i < streamData.length; i += 1) {
            const i3 = i * 3;
            const data = streamData[i];
            data.progress += deltaTime * data.speed;
            if (data.progress > 1) data.progress -= 1;

            const localX = 0.18 + data.progress * length;
            const wobbleY = Math.sin(elapsedTime * 2.6 + data.phase + data.progress * 8) * data.spread;
            const wobbleZ = Math.cos(elapsedTime * 2.2 + data.phase * 1.4 + data.progress * 6) * data.spread * 0.72;

            streamPositions[i3] = localX;
            streamPositions[i3 + 1] = wobbleY;
            streamPositions[i3 + 2] = wobbleZ;
        }

        streamGeometry.attributes.position.needsUpdate = true;
        sector.streamMaterial.opacity = 0.56 * sectorAlpha;
    }

    function updateSectorExtra(sector, elapsedTime, deltaTime, sectorAlpha, clickBoost = 0) {
        const { extra, length } = sector;
        if (!extra) return;

        if (extra.type === 'home') {
            extra.panel.material.opacity = (0.22 + clickBoost * 0.34) * sectorAlpha + Math.sin(elapsedTime * 2.8) * 0.04 * sectorAlpha;
            extra.panel.position.y = 0.05 + Math.sin(elapsedTime * 1.7) * 0.02 + clickBoost * 0.06;
            extra.panel.scale.setScalar(1 + clickBoost * 0.18);

            for (const fragment of extra.fragments) {
                const orbitTime = elapsedTime * fragment.speed * (1 + clickBoost * 1.6) + fragment.phase;
                const orbitRadius = fragment.orbit * (1 + clickBoost * 0.84);
                const burstOffset = Math.sin(fragment.phase * 1.7 + elapsedTime * 9.2) * clickBoost * 0.08;
                fragment.mesh.position.set(
                    fragment.baseX * length + clickBoost * 0.14 + burstOffset,
                    Math.cos(orbitTime) * orbitRadius,
                    Math.sin(orbitTime * 1.2) * orbitRadius * 0.76
                );
                const rollSpeed = fragment.roll * (1 + clickBoost * 2.1);
                fragment.mesh.rotation.x += deltaTime * rollSpeed;
                fragment.mesh.rotation.y += deltaTime * rollSpeed * 0.72;
                fragment.mesh.material.opacity = (0.46 + clickBoost * 0.24) * sectorAlpha;
                fragment.mesh.scale.setScalar(1 + clickBoost * 0.22);
            }
            return;
        }

        if (extra.type === 'portfolio') {
            for (const card of extra.cards) {
                card.progress += deltaTime * card.speed * (1 + clickBoost * 1.6);
                if (card.progress > 1) card.progress -= 1;

                const fanDir = card.offsetY >= 0 ? 1 : -1;
                const x = length * (0.2 + card.progress * 0.76) + clickBoost * length * 0.06;
                const y = card.offsetY + Math.sin(elapsedTime * 2.4 + card.phase) * 0.08 + fanDir * clickBoost * 0.18;
                const z = card.offsetZ + Math.cos(elapsedTime * 2.1 + card.phase) * 0.09 + Math.sin(card.phase * 1.3) * clickBoost * 0.14;
                card.mesh.position.set(x, y, z);
                card.mesh.rotation.y = Math.sin(elapsedTime * 1.8 + card.phase) * 0.22 + fanDir * clickBoost * 0.42;
                card.mesh.rotation.z = Math.cos(elapsedTime * 2.1 + card.phase) * 0.14 + fanDir * clickBoost * 0.28;
                card.mesh.material.opacity = (0.3 + Math.sin(elapsedTime * 4 + card.phase) * 0.08 + clickBoost * 0.24) * sectorAlpha;
                card.mesh.scale.setScalar(1 + clickBoost * 0.16);
            }
            return;
        }

        if (extra.type === 'works') {
            for (const item of extra.objects) {
                item.angle += deltaTime * item.speed * (1 + clickBoost * 3.2);
                const orbitRadius = item.radius * (1 + clickBoost * 0.7);
                const x = length * item.baseX;
                const y = Math.cos(item.angle) * orbitRadius;
                const z = Math.sin(item.angle * 1.2) * orbitRadius * 0.78;
                item.mesh.position.set(x, y, z);
                item.mesh.rotation.x += deltaTime * (item.speed * 0.7) * (1 + clickBoost * 2.2);
                item.mesh.rotation.y += deltaTime * (item.speed * 1.1) * (1 + clickBoost * 2.4);
                item.mesh.rotation.z += deltaTime * (item.speed * 0.8 + item.tilt) * (1 + clickBoost * 2.1);
                item.mesh.material.opacity = (0.48 + clickBoost * 0.24) * sectorAlpha;
                item.mesh.scale.setScalar(1 + clickBoost * 0.2);
            }
            return;
        }

        for (const pulse of extra.pulses) {
            pulse.progress += deltaTime * pulse.speed * (1 + clickBoost * 2.8);
            if (pulse.progress > 1) pulse.progress -= 1;

            const x = 0.2 + pulse.progress * length;
            const pulseWave = Math.sin(elapsedTime * 8 + pulse.phase) * 0.06;
            pulse.mesh.position.set(x, pulseWave, 0);
            const s = 0.65 + Math.sin(elapsedTime * 5 + pulse.phase) * 0.2 + clickBoost * 0.3;
            pulse.mesh.scale.setScalar(s);
            pulse.mesh.material.opacity = (0.36 + (1 - pulse.progress) * 0.46 + clickBoost * 0.3) * sectorAlpha;
        }

        const signalPulse = 0.82 + Math.sin(elapsedTime * 4.2) * 0.18;
        extra.signalRingA.scale.setScalar(0.92 + signalPulse * 0.24 + clickBoost * 0.54);
        extra.signalRingB.scale.setScalar(1 + signalPulse * 0.42 + clickBoost * 0.72);
        extra.signalRingA.material.opacity = (0.34 + clickBoost * 0.28) * sectorAlpha;
        extra.signalRingB.material.opacity = (0.2 + clickBoost * 0.32) * sectorAlpha;
        extra.signalRingA.rotation.z += deltaTime * (1.4 + clickBoost * 3.2);
        extra.signalRingB.rotation.z -= deltaTime * (1.8 + clickBoost * 3.8);
    }

    return {
        syncWithCrystal,
        update,
        triggerClickAnimation(key) {
            const hasSector = sectors.some((sector) => sector.config.key === key);
            if (!hasSector) return 0;
            clickedSectorKey = key;
            clickAnimationProgress = 0;
            hoveredSectorKey = key;
            return Math.round(clickAnimationDuration * 1000);
        },
        cancelClickAnimation() {
            clickedSectorKey = null;
            clickAnimationProgress = 1;
        },
        setLayoutCompaction(compaction = 0) {
            layoutCompaction = THREE.MathUtils.clamp(compaction, 0, MOBILE_MODE ? 0.86 : 0.72);
            for (const sector of sectors) {
                applySectorLayout(sector);
            }
        },
        getInteractiveObjects() {
            return sectors.map((sector) => sector.endpointHitArea).filter(Boolean);
        },
        resolveSectorFromObject(object) {
            let node = object;
            while (node) {
                const key = node.userData?.crystalSectorKey;
                if (key) {
                    const sector = sectors.find((item) => item.config.key === key);
                    return sector ? { key: sector.config.key, label: sector.config.label } : null;
                }
                node = node.parent;
            }
            return null;
        },
        setHoveredSectorKey(key) {
            hoveredSectorKey = key;
        }
    };
}
