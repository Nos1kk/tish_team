export function createCinematicSpeedParticle(THREE, maxDistance) {
    return {
        angle: Math.random() * Math.PI * 2,
        distance: THREE.MathUtils.randFloat(0, maxDistance),
        speed: THREE.MathUtils.randFloat(0.48, 1.34),
        width: THREE.MathUtils.randFloat(0.62, 1.86),
        length: THREE.MathUtils.randFloat(26, 86),
        phase: Math.random() * Math.PI * 2,
        tint: THREE.MathUtils.randFloat(-0.52, 0.52)
    };
}

export function resetCinematicSpeedParticle(THREE, particle, maxDistance, nearCenter = false) {
    particle.angle = Math.random() * Math.PI * 2;
    particle.distance = nearCenter
        ? THREE.MathUtils.randFloat(6, maxDistance * 0.14)
        : THREE.MathUtils.randFloat(0, maxDistance);
    particle.speed = THREE.MathUtils.randFloat(0.48, 1.34);
    particle.width = THREE.MathUtils.randFloat(0.62, 1.86);
    particle.length = THREE.MathUtils.randFloat(26, 86);
    particle.phase = Math.random() * Math.PI * 2;
    particle.tint = THREE.MathUtils.randFloat(-0.52, 0.52);
}
