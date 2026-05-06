export function createFallbackShip({ THREE, scaleSegments }) {
    const group = new THREE.Group();

    const hullMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xd9e5ff,
        emissive: 0x2f3a86,
        emissiveIntensity: 0.34,
        roughness: 0.19,
        metalness: 0.82,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 2.3
    });
    const accentMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x8ea2ff,
        emissive: 0x5565d8,
        emissiveIntensity: 0.42,
        roughness: 0.28,
        metalness: 0.58,
        clearcoat: 0.9,
        clearcoatRoughness: 0.08
    });

    const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.62, 8, 16), hullMaterial);
    fuselage.rotation.z = Math.PI * 0.5;

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.34, 18), hullMaterial);
    nose.rotation.z = -Math.PI * 0.5;
    nose.position.set(0.56, 0, 0);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 16), accentMaterial);
    tail.rotation.z = Math.PI * 0.5;
    tail.position.set(-0.56, 0, 0);

    const cockpit = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 22, 22),
        new THREE.MeshPhysicalMaterial({
            color: 0xbfd8ff,
            transmission: 0.74,
            transparent: true,
            opacity: 0.82,
            roughness: 0.05,
            thickness: 0.36,
            clearcoat: 1,
            clearcoatRoughness: 0.03
        })
    );
    cockpit.scale.set(1, 0.58, 0.72);
    cockpit.position.set(0.14, 0.085, 0);

    const wingGeometry = new THREE.BoxGeometry(0.6, 0.024, 0.24);
    const wingTop = new THREE.Mesh(wingGeometry, accentMaterial);
    wingTop.position.set(-0.08, 0.13, 0);
    wingTop.rotation.z = -0.14;
    const wingBottom = wingTop.clone();
    wingBottom.position.y = -0.13;
    wingBottom.rotation.z = 0.14;

    const finGeometry = new THREE.BoxGeometry(0.22, 0.06, 0.02);
    const finTop = new THREE.Mesh(finGeometry, accentMaterial);
    finTop.position.set(-0.24, 0.22, 0);
    finTop.rotation.z = -0.42;
    const finBottom = finTop.clone();
    finBottom.position.y = -0.22;
    finBottom.rotation.z = 0.42;

    const engineMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x6f7fdb,
        emissive: 0x9f7dff,
        emissiveIntensity: 0.52,
        roughness: 0.26,
        metalness: 0.7,
        clearcoat: 0.9
    });
    const nozzleLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.06, 0.2, 16), engineMaterial);
    nozzleLeft.rotation.z = Math.PI * 0.5;
    nozzleLeft.position.set(-0.62, 0, -0.14);
    const nozzleRight = nozzleLeft.clone();
    nozzleRight.position.z = 0.14;

    const engineCoreLeft = new THREE.Mesh(
        new THREE.SphereGeometry(0.033, 14, 14),
        new THREE.MeshBasicMaterial({ color: 0xd4b9ff, transparent: true, opacity: 0.95 })
    );
    engineCoreLeft.position.set(-0.72, 0, -0.14);
    const engineCoreRight = engineCoreLeft.clone();
    engineCoreRight.position.z = 0.14;

    group.add(
        fuselage,
        nose,
        tail,
        cockpit,
        wingTop,
        wingBottom,
        finTop,
        finBottom,
        nozzleLeft,
        nozzleRight,
        engineCoreLeft,
        engineCoreRight
    );
    return group;
}


