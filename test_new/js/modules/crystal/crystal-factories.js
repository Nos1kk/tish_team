export function createCrystalFactories({
    THREE,
    ConvexGeometry,
    scaleSegments,
    crystalMicroTexture
}) {
    function createCrystalMaterial(overrides = {}) {
        return new THREE.MeshPhysicalMaterial({
            color: 0xf2e3ff,
            transparent: true,
            opacity: 0.74,
            transmission: 0.82,
            metalness: 0,
            roughness: 0.035,
            roughnessMap: crystalMicroTexture,
            bumpMap: crystalMicroTexture,
            bumpScale: 0.006,
            ior: 1.46,
            thickness: 1.38,
            attenuationColor: 0xca81ff,
            attenuationDistance: 1.92,
            specularIntensity: 0.9,
            specularColor: new THREE.Color(0xffffff),
            clearcoat: 1,
            clearcoatRoughness: 0.035,
            iridescence: 0.08,
            envMapIntensity: 2.06,
            flatShading: false,
            side: THREE.DoubleSide,
            ...overrides
        });
    }
    
    function createCrystalGlowShell(geometry) {
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uSunDirection: { value: new THREE.Vector3(0, 0, -1) },
                uGlowColor: { value: new THREE.Color(0xffd9a8) },
                uCrackColor: { value: new THREE.Color(0xffa4e8) },
                uTime: { value: 0 },
                uGlowStrength: { value: 1 },
                uCrackProgress: { value: 0 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                varying vec3 vWorldNormal;
                varying vec3 vViewDirection;
    
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    vWorldNormal = normalize(mat3(modelMatrix) * normal);
                    vViewDirection = normalize(cameraPosition - worldPosition.xyz);
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uSunDirection;
                uniform vec3 uGlowColor;
                uniform vec3 uCrackColor;
                uniform float uTime;
                uniform float uGlowStrength;
                uniform float uCrackProgress;
    
                varying vec3 vWorldPosition;
                varying vec3 vWorldNormal;
                varying vec3 vViewDirection;
    
                void main() {
                    vec3 normal = normalize(vWorldNormal);
                    vec3 viewDir = normalize(vViewDirection);
                    vec3 sunDir = normalize(uSunDirection);
    
                    float sunFacing = max(dot(normal, sunDir), 0.0);
                    float rim = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.6);
                    float shimmer = 0.72 + 0.28 * sin(uTime * 3.1 + dot(vWorldPosition, vec3(5.0, 2.4, 3.7)) * 2.0);
                    float innerScatter = pow(sunFacing, 2.35) * (0.44 + rim * 1.35) * shimmer;
                    float crackGlow = smoothstep(0.1, 1.0, uCrackProgress) * (0.18 + rim * 0.36);
                    vec3 color = uGlowColor * innerScatter * uGlowStrength + uCrackColor * crackGlow;
                    float alpha = min(0.82, innerScatter * 0.34 * uGlowStrength + rim * 0.05 + crackGlow * 0.2);
    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
    
        const shell = new THREE.Mesh(geometry.clone(), material);
        shell.scale.setScalar(1.014);
        shell.renderOrder = 4;
        shell.userData.isCrystalShell = true;
        return shell;
    }
    
    function attachCrystalGlowShell(mesh) {
        const shell = createCrystalGlowShell(mesh.geometry);
        mesh.add(shell);
        return shell;
    }
    
    function createCrackShellMaterial(impactPoint, impactNormal, crackRadius) {
        const helperAxis = Math.abs(impactNormal.y) > 0.82
            ? new THREE.Vector3(1, 0, 0)
            : new THREE.Vector3(0, 1, 0);
        const tangentA = helperAxis.clone().cross(impactNormal).normalize();
        const tangentB = impactNormal.clone().cross(tangentA).normalize();
    
        return new THREE.ShaderMaterial({
            uniforms: {
                uImpactPoint: { value: impactPoint.clone() },
                uImpactNormal: { value: impactNormal.clone() },
                uTangentA: { value: tangentA },
                uTangentB: { value: tangentB },
                uCrackRadius: { value: crackRadius },
                uProgress: { value: 0 },
                uTime: { value: 0 }
            },
            vertexShader: `
                varying vec3 vLocalPosition;
                varying vec3 vLocalNormal;
                varying vec3 vWorldPosition;
    
                void main() {
                    vLocalPosition = position;
                    vLocalNormal = normalize(normal);
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uImpactPoint;
                uniform vec3 uImpactNormal;
                uniform vec3 uTangentA;
                uniform vec3 uTangentB;
                uniform float uCrackRadius;
                uniform float uProgress;
                uniform float uTime;
    
                varying vec3 vLocalPosition;
                varying vec3 vLocalNormal;
                varying vec3 vWorldPosition;
    
                const float PI = 3.141592653589793;
                const float TAU = 6.283185307179586;
    
                float hash(float value) {
                    return fract(sin(value * 127.1) * 43758.5453123);
                }
    
                void main() {
                    vec3 rel = vLocalPosition - uImpactPoint;
                    vec2 crackPlane = vec2(dot(rel, uTangentA), dot(rel, uTangentB));
                    float radial = length(crackPlane);
                    float frontMask = smoothstep(-0.28, 0.18, dot(normalize(vLocalNormal), normalize(uImpactNormal)));
                    float radiusLimit = mix(0.06, uCrackRadius, clamp(uProgress, 0.0, 1.0));
                    float radiusMask = 1.0 - smoothstep(radiusLimit, radiusLimit + 0.18, radial);
    
                    float crack = 0.0;
                    float glow = 0.0;
    
                    for (int i = 0; i < 18; i++) {
                        float fi = float(i);
                        float seed = fi * 19.173;
                        float branchAngle = fi / 18.0 * TAU + (hash(seed) - 0.5) * 0.42;
                        vec2 branchDir = vec2(cos(branchAngle), sin(branchAngle));
                        float along = dot(crackPlane, branchDir);
                        float across = abs(branchDir.x * crackPlane.y - branchDir.y * crackPlane.x);
                        float branchLength = uCrackRadius * (0.34 + hash(seed + 0.73) * 0.76) * clamp(uProgress * 1.12, 0.0, 1.0);
                        float wiggle = sin(along * 18.0 + fi * 1.7 + sin(along * 5.4 + fi) * 1.3 + uTime * 1.8) * 0.018;
                        float lineWidth = mix(0.02, 0.006, clamp(uProgress, 0.0, 1.0));
                        float line = 1.0 - smoothstep(lineWidth, lineWidth + 0.014, across + abs(wiggle));
                        float lengthMask = smoothstep(0.01, 0.1, along) * (1.0 - smoothstep(branchLength, branchLength + 0.08, along));
                        float taper = 1.0 - smoothstep(0.0, max(branchLength, 0.001), along);
                        float branch = line * lengthMask;
                        crack = max(crack, branch);
                        glow = max(glow, branch * (0.34 + taper * 0.8));
    
                        if (i < 10) {
                            float forkAngle = branchAngle + (hash(seed + 2.4) > 0.5 ? 1.0 : -1.0) * (0.35 + hash(seed + 4.8) * 0.4);
                            vec2 forkDir = vec2(cos(forkAngle), sin(forkAngle));
                            float forkAlong = dot(crackPlane, forkDir);
                            float forkAcross = abs(forkDir.x * crackPlane.y - forkDir.y * crackPlane.x);
                            float forkStart = branchLength * (0.22 + hash(seed + 7.3) * 0.4);
                            float forkLength = branchLength * (0.24 + hash(seed + 8.1) * 0.28);
                            float forkWiggle = sin(forkAlong * 20.0 + fi * 3.1 + uTime * 2.2) * 0.012;
                            float forkLine = 1.0 - smoothstep(lineWidth * 0.8, lineWidth * 0.8 + 0.012, forkAcross + abs(forkWiggle));
                            float forkMask = smoothstep(forkStart, forkStart + 0.05, forkAlong) * (1.0 - smoothstep(forkStart + forkLength, forkStart + forkLength + 0.06, forkAlong));
                            float fork = forkLine * forkMask;
                            crack = max(crack, fork * 0.92);
                            glow = max(glow, fork * 0.68);
                        }
                    }
    
                    float impactBurst = (1.0 - smoothstep(0.0, 0.16 + uProgress * 0.12, radial)) * (0.35 + uProgress * 0.6);
                    float pulse = 0.82 + 0.18 * sin(uTime * 24.0 + radial * 18.0);
                    vec3 color = mix(vec3(1.0, 0.78, 0.95), vec3(1.0, 0.5, 0.9), clamp(radial / max(uCrackRadius, 0.001), 0.0, 1.0));
                    float alpha = (crack * pulse + glow * 0.18 + impactBurst) * frontMask * radiusMask * clamp(uProgress * 1.2, 0.0, 1.0);
    
                    if (alpha < 0.01) discard;
                    gl_FragColor = vec4(color, min(0.95, alpha));
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
    }
    
    function createGlassShardGeometry(length, width, thickness) {
        const halfWidth = width * 0.5;
        const halfThickness = thickness * 0.5;
        const points = [
            new THREE.Vector3(0, length * 0.52, 0),
            new THREE.Vector3(-halfWidth, length * 0.14, -halfThickness),
            new THREE.Vector3(halfWidth, length * 0.08, -halfThickness * 0.5),
            new THREE.Vector3(halfWidth * 0.8, -length * 0.36, halfThickness),
            new THREE.Vector3(-halfWidth * 0.74, -length * 0.44, halfThickness * 0.65),
            new THREE.Vector3(0, -length * 0.54, 0)
        ];
        return new ConvexGeometry(points);
    }
    
    function createGlassCrackOverlay(root, impactPoint, impactNormal, crystalRadius) {
        const overlay = new THREE.Group();
    
        const crackShells = [];
        root.traverse((node) => {
            if (!node.isMesh || node.userData?.isCrystalShell) return;
            const crackShell = new THREE.Mesh(
                node.geometry.clone(),
                createCrackShellMaterial(impactPoint, impactNormal, crystalRadius)
            );
            crackShell.position.copy(node.position);
            crackShell.rotation.copy(node.rotation);
            crackShell.scale.copy(node.scale).multiplyScalar(1.004);
            crackShell.renderOrder = 5;
            overlay.add(crackShell);
            crackShells.push(crackShell);
        });
    
        const burst = new THREE.Mesh(
            new THREE.IcosahedronGeometry(Math.max(0.055, crystalRadius * 0.05), 1),
            new THREE.MeshBasicMaterial({
                color: 0xffd8ef,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        burst.position.copy(impactPoint).addScaledVector(impactNormal, 0.045);
        burst.scale.setScalar(0.2);
        burst.renderOrder = 5;
        overlay.add(burst);
    
        overlay.userData = { crackShells, burst, normal: impactNormal.clone() };
        return overlay;
    }
    
    function createProceduralCrystal() {
        const points = [];
        points.push(new THREE.Vector3(0.04, 2.38, -0.08));
        points.push(new THREE.Vector3(0.14, -2.52, 0.11));
    
        const layers = [
            { y: 1.58, radius: 0.35, count: 5, twist: 0.24, jag: 0.17 },
            { y: 0.95, radius: 0.66, count: 6, twist: 0.1, jag: 0.2 },
            { y: 0.15, radius: 0.9, count: 7, twist: -0.08, jag: 0.27 },
            { y: -0.95, radius: 0.62, count: 5, twist: 0.22, jag: 0.21 },
            { y: -1.78, radius: 0.36, count: 4, twist: 0.44, jag: 0.2 }
        ];
    
        layers.forEach((layer, layerIndex) => {
            for (let i = 0; i < layer.count; i++) {
                const angle = (i / layer.count) * Math.PI * 2 + layer.twist;
                const pulseA = Math.sin(i * 2.37 + layerIndex * 0.9);
                const pulseB = Math.cos(i * 1.63 - layerIndex * 0.7);
                const radiusX = layer.radius * (1 + pulseA * layer.jag * 0.82);
                const radiusZ = layer.radius * (0.88 + pulseB * layer.jag * 0.76);
                points.push(new THREE.Vector3(Math.cos(angle) * radiusX, layer.y + pulseB * 0.07, Math.sin(angle) * radiusZ));
            }
        });
    
        const geometry = new ConvexGeometry(points);
        geometry.scale(0.96, 0.96, 0.76);
        geometry.rotateY(0.42);
        geometry.rotateZ(-0.09);
        geometry.computeVertexNormals();
    
        const outer = new THREE.Mesh(geometry, createCrystalMaterial());
        attachCrystalGlowShell(outer);
        const core = new THREE.Mesh(geometry, createCrystalMaterial({
            color: 0xc68cff,
            opacity: 0.12,
            thickness: 0.6,
            attenuationDistance: 5.4,
            clearcoat: 0.2,
            roughness: 0.12,
            side: THREE.BackSide
        }));
        core.scale.setScalar(0.94);
        core.rotation.y = 0.14;
    
        const group = new THREE.Group();
        group.add(outer, core);
        return group;
    }
    

    return {
        createCrystalMaterial,
        createCrystalGlowShell,
        attachCrystalGlowShell,
        createCrackShellMaterial,
        createGlassShardGeometry,
        createGlassCrackOverlay,
        createProceduralCrystal
    };
}

