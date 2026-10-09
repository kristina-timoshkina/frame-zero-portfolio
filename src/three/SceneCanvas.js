import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

function rememberOpacity(material, opacity = 1) {
  material.transparent = true;
  material.opacity = opacity;
  material.userData.baseOpacity = opacity;
  return material;
}

function createReelPlateGeometry() {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1.42, 0, Math.PI * 2, false);

  for (let index = 0; index < 5; index += 1) {
    const angle = index * (Math.PI * 2 / 5) - Math.PI / 2;
    const hole = new THREE.Path();
    hole.absarc(Math.cos(angle) * 0.78, Math.sin(angle) * 0.78, 0.34, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }

  const centerHole = new THREE.Path();
  centerHole.absarc(0, 0, 0.2, 0, Math.PI * 2, true);
  shape.holes.push(centerHole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.12,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.025,
    bevelSegments: 3,
    curveSegments: 56,
  });
  geometry.translate(0, 0, -0.06);
  geometry.computeVertexNormals();
  return geometry;
}

function createFilmStrip() {
  const group = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.12, -0.72, -0.02),
    new THREE.Vector3(1.42, -0.92, 0.08),
    new THREE.Vector3(1.38, -1.34, 0.26),
    new THREE.Vector3(1.16, -1.68, 0.48),
    new THREE.Vector3(0.74, -2.02, 0.78),
    new THREE.Vector3(0.15, -2.28, 0.92),
    new THREE.Vector3(-0.34, -2.52, 0.54),
  ], false, "centripetal");
  const frenet = curve.computeFrenetFrames(96, false);

  const crossSection = new THREE.Shape();
  crossSection.moveTo(-0.41, -0.025);
  crossSection.lineTo(0.41, -0.025);
  crossSection.lineTo(0.41, 0.025);
  crossSection.lineTo(-0.41, 0.025);
  crossSection.closePath();

  const stripMaterial = rememberOpacity(new THREE.MeshPhysicalMaterial({
    color: 0x3a5e75,
    emissive: 0x0b536d,
    emissiveIntensity: 1.08,
    metalness: 0.18,
    roughness: 0.38,
    clearcoat: 0.5,
    clearcoatRoughness: 0.22,
    side: THREE.DoubleSide,
  }), 0.96);
  const strip = new THREE.Mesh(new THREE.ExtrudeGeometry(crossSection, {
    steps: 96,
    bevelEnabled: false,
    extrudePath: curve,
  }), stripMaterial);
  group.add(strip);

  const railMaterial = rememberOpacity(new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x8eeaff).multiplyScalar(1.65),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), 0.78);
  for (const edge of [-1, 1]) {
    const railPoints = [];
    for (let index = 0; index <= 96; index += 1) {
      const t = index / 96;
      railPoints.push(curve.getPointAt(t).addScaledVector(frenet.normals[index], edge * 0.405));
    }
    const railCurve = new THREE.CatmullRomCurve3(railPoints, false, "centripetal");
    group.add(new THREE.Mesh(new THREE.TubeGeometry(railCurve, 96, 0.012, 6, false), railMaterial));
  }

  const frameMaterial = rememberOpacity(new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x9e8cff).multiplyScalar(1.18),
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  }), 0.42);
  const perforationMaterial = rememberOpacity(new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xc8f7ff).multiplyScalar(1.32),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  }), 0.86);

  const frameCount = 13;
  const perforationCount = frameCount * 4;
  const frames = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.17), frameMaterial, frameCount);
  const perforations = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.055, 0.035), perforationMaterial, perforationCount);
  frames.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  perforations.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const dummy = new THREE.Object3D();
  const basis = new THREE.Matrix4();
  const updateDetails = (time = 0) => {
    let perforationIndex = 0;
    for (let index = 0; index < frameCount; index += 1) {
      const t = 0.025 + ((index / frameCount + time * 0.055) % 1) * 0.94;
      const point = curve.getPointAt(t);
      const frameIndex = Math.min(96, Math.round(t * 96));
      const tangent = frenet.tangents[frameIndex];
      const normal = frenet.normals[frameIndex];
      const binormal = frenet.binormals[frameIndex];
      basis.makeBasis(normal, tangent, binormal);
      dummy.position.copy(point).addScaledVector(binormal, 0.032);
      dummy.quaternion.setFromRotationMatrix(basis);
      dummy.scale.set(index % 3 === 0 ? 1.04 : 0.92, 1, 1);
      dummy.updateMatrix();
      frames.setMatrixAt(index, dummy.matrix);

      for (const edge of [-1, 1]) {
        for (const step of [-0.055, 0.055]) {
          dummy.position.copy(point)
            .addScaledVector(normal, edge * 0.365)
            .addScaledVector(tangent, step)
            .addScaledVector(binormal, 0.035);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          perforations.setMatrixAt(perforationIndex, dummy.matrix);
          perforationIndex += 1;
        }
      }
    }
    frames.instanceMatrix.needsUpdate = true;
    perforations.instanceMatrix.needsUpdate = true;
  };

  updateDetails();
  frames.frustumCulled = false;
  perforations.frustumCulled = false;
  group.add(frames, perforations);
  group.userData.update = updateDetails;
  return group;
}

function createFilmReel() {
  const artifact = new THREE.Group();
  const spool = new THREE.Group();
  const plateGeometry = createReelPlateGeometry();
  const metal = rememberOpacity(new THREE.MeshPhysicalMaterial({
    color: 0x71849c,
    metalness: 0.88,
    roughness: 0.24,
    clearcoat: 0.9,
    clearcoatRoughness: 0.13,
    emissive: 0x071520,
    emissiveIntensity: 0.45,
    side: THREE.DoubleSide,
  }), 0.95);
  const darkMetal = rememberOpacity(new THREE.MeshPhysicalMaterial({
    color: 0x172435,
    metalness: 0.82,
    roughness: 0.3,
    clearcoat: 0.72,
    clearcoatRoughness: 0.2,
    emissive: 0x06111c,
    emissiveIntensity: 0.55,
  }), 0.98);
  const edgeLight = rememberOpacity(new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x8eeaff).multiplyScalar(1.85),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), 0.94);
  const auraLight = rememberOpacity(new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x6bdcff).multiplyScalar(1.55),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), 0.32);
  const coralLight = rememberOpacity(new THREE.MeshBasicMaterial({
    color: new THREE.Color(0xff796e).multiplyScalar(1.35),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }), 0.34);
  const filmRollMaterial = rememberOpacity(new THREE.MeshPhysicalMaterial({
    color: 0x18394b,
    emissive: 0x0a4056,
    emissiveIntensity: 0.78,
    metalness: 0.28,
    roughness: 0.42,
    clearcoat: 0.42,
    clearcoatRoughness: 0.28,
  }), 0.98);

  const front = new THREE.Mesh(plateGeometry, metal);
  const rear = new THREE.Mesh(plateGeometry, darkMetal);
  front.position.z = 0.3;
  rear.position.z = -0.3;

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.72, 64, 1, false), darkMetal);
  hub.rotation.x = Math.PI / 2;
  const filmRoll = new THREE.Mesh(new THREE.CylinderGeometry(1.16, 1.16, 0.5, 96, 1, false), filmRollMaterial);
  filmRoll.rotation.x = Math.PI / 2;
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.84, 48, 1, false), metal);
  axle.rotation.x = Math.PI / 2;

  const outerFront = new THREE.Mesh(new THREE.TorusGeometry(1.39, 0.035, 10, 96), edgeLight);
  const outerRear = new THREE.Mesh(new THREE.TorusGeometry(1.39, 0.028, 10, 96), edgeLight);
  const hubRing = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 10, 64), edgeLight);
  const cyanAura = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.055, 10, 96), auraLight);
  const cyanAuraOuter = new THREE.Mesh(new THREE.TorusGeometry(1.57, 0.022, 8, 96), auraLight);
  const coralRim = new THREE.Mesh(new THREE.TorusGeometry(1.43, 0.032, 10, 96), coralLight);
  outerFront.position.z = 0.38;
  outerRear.position.z = -0.38;
  hubRing.position.z = 0.39;
  cyanAura.position.z = 0.36;
  cyanAuraOuter.position.z = 0.34;
  coralRim.position.z = -0.4;
  cyanAuraOuter.material = auraLight.clone();
  cyanAuraOuter.material.userData.baseOpacity = 0.16;
  cyanAuraOuter.material.opacity = 0.16;

  spool.add(rear, filmRoll, hub, axle, front, coralRim, outerRear, outerFront, cyanAura, cyanAuraOuter, hubRing);
  const strip = createFilmStrip();
  artifact.add(spool, strip);
  artifact.userData.spool = spool;
  artifact.userData.strip = strip;
  artifact.userData.fadeMaterials = [metal, darkMetal, filmRoll.material, edgeLight, auraLight, cyanAuraOuter.material, coralLight, ...new Set(strip.children.map((child) => child.material))];
  return artifact;
}

function createParticleField(count, radius) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const cyan = new THREE.Color(0x71e6ff);
  const violet = new THREE.Color(0x7868ff);
  const coral = new THREE.Color(0xff796e);

  for (let index = 0; index < count; index += 1) {
    const r = radius * (0.7 + Math.random() * 1.4);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const offset = index * 3;
    positions[offset] = r * Math.sin(phi) * Math.cos(theta);
    positions[offset + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[offset + 2] = r * Math.cos(phi);

    const color = index % 13 === 0 ? coral : index % 3 === 0 ? cyan : violet;
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.032,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  return new THREE.Points(geometry, material);
}

export class SceneCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.pointer = new THREE.Vector2();
    this.pointerTarget = new THREE.Vector2();
    this.sceneFade = 1;
    this.sceneFadeTarget = 1;
    this.burst = 0;
    this.timer = new THREE.Timer();
    this.timer.connect(document);
    this.frameId = null;
    this.isVisible = !document.hidden;
    this.mediaSuspended = document.documentElement.dataset.mediaActive === "true";

    try {
      this.init();
    } catch (error) {
      console.warn("FRAME ZERO: WebGL fallback enabled.", error);
      document.documentElement.classList.add("no-webgl");
    }
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    this.camera.position.set(0, 0, 8.8);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.composer = new EffectComposer(this.renderer);
    this.composer.renderTarget1.samples = 4;
    this.composer.renderTarget2.samples = 4;
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.58, 0.46, 0.58);
    this.composer.addPass(this.bloom);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.ambientLight = new THREE.HemisphereLight(0x9deeff, 0x130a25, 1.35);
    this.keyLight = new THREE.PointLight(0x87eaff, 34, 10, 2);
    this.rimLight = new THREE.PointLight(0xff796e, 23, 9, 2);
    this.keyLight.position.set(3.8, 2.5, 4.5);
    this.rimLight.position.set(-2.4, -2.8, 3.2);
    this.scene.add(this.ambientLight, this.keyLight, this.rimLight);

    this.reel = createFilmReel();
    this.reel.rotation.set(-0.2, -0.5, 0.08);
    this.group.add(this.reel);

    this.particles = createParticleField(window.innerWidth < 900 ? 540 : 1050, 3.2);
    this.group.add(this.particles);

    this.setResponsivePosition();
    this.bindEvents();
    const hashScene = window.location.hash.slice(1);
    const initialScene = hashScene || document.documentElement.dataset.activeScene || "hero";
    this.onSceneChange({ detail: { scene: initialScene } });
    this.resize();

    if (this.motionQuery.matches) this.renderStill();
    else this.animate();
  }

  bindEvents() {
    this.onPointerMove = (event) => {
      this.pointerTarget.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
      );
    };
    this.onResize = () => this.resize();
    this.onVisibility = () => {
      this.isVisible = !document.hidden;
      if (this.isVisible) this.startAnimation();
      else this.stopAnimation();
    };
    this.onMotionChange = () => {
      if (this.motionQuery.matches) {
        this.stopAnimation();
        this.renderStill();
      } else {
        this.startAnimation();
      }
    };
    this.onMediaActivity = (event) => {
      this.mediaSuspended = event.detail?.active === true;
      if (this.mediaSuspended) this.stopAnimation();
      else this.startAnimation();
    };
    this.onBurst = (event) => {
      this.burst = Math.max(this.burst, event.detail?.strength || 0.5);
    };
    this.onSceneChange = (event) => {
      const scene = event.detail?.scene;
      this.sceneFadeTarget = scene === "hero" ? 1 : scene === "manifesto" ? 0.035 : scene === "final" ? 0.38 : scene === "author" ? 0.025 : 0;
      const immediateCap = scene === "manifesto" ? 0.035 : scene === "final" ? 0.38 : scene === "author" ? 0.025 : 0;
      if (scene !== "hero" && this.sceneFade > immediateCap) {
        this.sceneFade = immediateCap;
        this.applySceneFade();
      }
      if (this.motionQuery.matches) {
        this.sceneFade = this.sceneFadeTarget;
        this.applySceneFade();
        this.renderStill();
      }
    };

    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("resize", this.onResize, { passive: true });
    document.addEventListener("visibilitychange", this.onVisibility);
    window.addEventListener("framezero:scenechange", this.onSceneChange);
    window.addEventListener("framezero:burst", this.onBurst);
    window.addEventListener("framezero:mediaactivity", this.onMediaActivity);
    this.motionQuery.addEventListener?.("change", this.onMotionChange);
  }

  startAnimation() {
    if (!this.isVisible || this.motionQuery.matches || this.mediaSuspended || this.frameId) return;
    this.timer.reset();
    this.animate();
  }

  stopAnimation() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.frameId = null;
  }

  setResponsivePosition() {
    if (!this.group) return;
    const compact = window.innerWidth < 700;
    const tablet = window.innerWidth >= 700 && window.innerWidth < 1100;
    this.group.position.set(compact ? 1.7 : tablet ? 1.7 : 2.75, compact ? 1.65 : tablet ? 0.6 : 0.38, -0.2);
    this.group.scale.setScalar(compact ? 0.42 : tablet ? 0.82 : 1);
  }

  resize() {
    if (!this.renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, width < 900 ? 1.5 : 1.65);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(width, height);
    this.setResponsivePosition();
    if (this.motionQuery.matches) this.renderStill();
  }

  renderStill() {
    if (!this.composer) return;
    this.reel.rotation.set(-0.2, -0.5, 0.08);
    this.reel.userData.spool.rotation.z = 0.24;
    this.composer.render();
  }

  applySceneFade() {
    this.reel.userData.fadeMaterials.forEach((material) => {
      material.opacity = material.userData.baseOpacity * this.sceneFade;
    });
    this.particles.material.opacity = 0.9 * Math.max(this.sceneFade, 0.11);
  }

  animate = () => {
    if (!this.isVisible || this.motionQuery.matches || this.mediaSuspended) {
      this.frameId = null;
      return;
    }

    this.timer.update();
    const delta = Math.min(this.timer.getDelta(), 0.05);
    const elapsed = this.timer.getElapsed();
    const smoothing = 1 - Math.exp(-delta * 3.2);
    this.pointer.lerp(this.pointerTarget, smoothing);
    this.sceneFade += (this.sceneFadeTarget - this.sceneFade) * smoothing;
    this.burst += (0 - this.burst) * (1 - Math.exp(-delta * 4.6));
    this.applySceneFade();

    this.group.rotation.y += (this.pointer.x * 0.2 - this.group.rotation.y) * smoothing;
    this.group.rotation.x += (-this.pointer.y * 0.12 - this.group.rotation.x) * smoothing;
    this.reel.rotation.z = 0.08 + Math.sin(elapsed * 0.32) * 0.055 + this.burst * 0.12;
    this.reel.rotation.y = -0.5 + elapsed * 0.18 + this.pointer.x * 0.13;
    this.reel.rotation.x = -0.2 + Math.cos(elapsed * 0.21) * 0.1 - this.pointer.y * 0.08;
    const reelScale = 1 + Math.sin(elapsed * 0.72) * 0.012 + this.burst * 0.065;
    this.reel.scale.setScalar(reelScale);
    this.reel.userData.spool.rotation.z = elapsed * 0.3 + this.burst * 0.52;
    this.reel.userData.strip.userData.update(elapsed);
    this.reel.userData.strip.rotation.z = Math.sin(elapsed * 0.58) * 0.035;
    this.reel.userData.strip.rotation.x = Math.sin(elapsed * 0.42) * 0.026;
    this.particles.rotation.y = elapsed * 0.022;
    this.particles.rotation.z = Math.sin(elapsed * 0.16) * 0.08;
    this.composer.render();
    this.frameId = requestAnimationFrame(this.animate);
  };

  dispose() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("framezero:scenechange", this.onSceneChange);
    window.removeEventListener("framezero:burst", this.onBurst);
    window.removeEventListener("framezero:mediaactivity", this.onMediaActivity);
    this.motionQuery.removeEventListener?.("change", this.onMotionChange);
    this.scene?.traverse((object) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material?.dispose?.();
    });
    this.composer?.dispose?.();
    this.renderer?.dispose();
    this.timer?.dispose();
  }
}
