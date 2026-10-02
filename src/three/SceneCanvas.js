import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

const vertexShader = `
  uniform float uTime;
  uniform vec2 uPointer;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vWave;

  void main() {
    float waveA = sin(position.y * 3.1 + uTime * 0.72);
    float waveB = sin(position.x * 4.4 - uTime * 0.51);
    float waveC = cos(position.z * 3.7 + uTime * 0.38);
    float pointerWave = sin((position.x + uPointer.x) * 2.6 + (position.y - uPointer.y) * 2.0);
    float displacement = (waveA + waveB + waveC) * 0.055 + pointerWave * 0.025;
    vec3 displaced = position + normal * displacement;

    vNormal = normalize(normalMatrix * normal);
    vWorldPosition = (modelMatrix * vec4(displaced, 1.0)).xyz;
    vWave = displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vWave;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(0.0, dot(viewDirection, normalize(vNormal))), 2.5);
    float shimmer = sin(vWorldPosition.y * 4.0 + uTime * 0.55) * 0.5 + 0.5;

    vec3 midnight = vec3(0.055, 0.035, 0.16);
    vec3 violet = vec3(0.39, 0.25, 1.0);
    vec3 cyan = vec3(0.36, 0.89, 1.0);
    vec3 coral = vec3(1.0, 0.34, 0.42);

    vec3 color = mix(midnight, violet, smoothstep(-0.16, 0.16, vWave));
    color = mix(color, cyan, fresnel * 0.92);
    color += coral * pow(shimmer, 7.0) * 0.12;

    float alpha = 0.72 + fresnel * 0.26;
    gl_FragColor = vec4(color, alpha * uOpacity);
  }
`;

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
    size: 0.025,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.72,
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
    this.timer = new THREE.Timer();
    this.timer.connect(document);
    this.frameId = null;
    this.isVisible = !document.hidden;

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
      antialias: false,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.46, 0.52, 0.58);
    this.composer.addPass(this.bloom);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    const segments = window.innerWidth < 900 ? 38 : 64;
    this.coreGeometry = new THREE.IcosahedronGeometry(1.48, segments > 40 ? 5 : 4);
    this.coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 1 },
        uPointer: { value: this.pointer },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.core = new THREE.Mesh(this.coreGeometry, this.coreMaterial);
    this.group.add(this.core);

    this.inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.12, 3),
      new THREE.MeshBasicMaterial({
        color: 0x21104f,
        transparent: true,
        opacity: 0.72,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.group.add(this.inner);

    this.particles = createParticleField(window.innerWidth < 900 ? 430 : 920, 2.4);
    this.group.add(this.particles);

    this.halo = new THREE.Mesh(
      new THREE.RingGeometry(1.95, 1.98, 128),
      new THREE.MeshBasicMaterial({
        color: 0x6fe4ff,
        transparent: true,
        opacity: 0.17,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.halo.rotation.x = Math.PI * 0.44;
    this.halo.rotation.y = Math.PI * 0.12;
    this.group.add(this.halo);

    this.setResponsivePosition();
    this.bindEvents();
    const initialScene = document.documentElement.dataset.activeScene || "hero";
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
      if (this.isVisible && !this.motionQuery.matches && !this.frameId) {
        this.timer.reset();
        this.animate();
      }
    };
    this.onMotionChange = () => {
      if (this.motionQuery.matches) {
        if (this.frameId) cancelAnimationFrame(this.frameId);
        this.frameId = null;
        this.renderStill();
      } else if (!this.frameId) {
        this.animate();
      }
    };
    this.onSceneChange = (event) => {
      const scene = event.detail?.scene;
      this.sceneFadeTarget = scene === "hero" ? 1 : scene === "final" ? 0.42 : scene === "author" ? 0.02 : 0.008;
      if (scene !== "hero" && this.sceneFade > 0.04) {
        this.sceneFade = 0.04;
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
    this.motionQuery.addEventListener?.("change", this.onMotionChange);
  }

  setResponsivePosition() {
    if (!this.group) return;
    const compact = window.innerWidth < 900;
    this.group.position.set(compact ? 0.8 : 2.65, compact ? 1.35 : 0.45, -0.2);
    this.group.scale.setScalar(compact ? 0.72 : 1);
  }

  resize() {
    if (!this.renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(window.devicePixelRatio, width < 900 ? 1.25 : 1.65);
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
    this.coreMaterial.uniforms.uTime.value = 0.8;
    this.composer.render();
  }

  applySceneFade() {
    this.coreMaterial.uniforms.uOpacity.value = this.sceneFade;
    this.inner.material.opacity = 0.72 * this.sceneFade;
    this.particles.material.opacity = 0.72 * Math.max(this.sceneFade, 0.012);
    this.halo.material.opacity = 0.17 * this.sceneFade;
  }

  animate = () => {
    if (!this.isVisible || this.motionQuery.matches) {
      this.frameId = null;
      return;
    }

    this.timer.update();
    const delta = Math.min(this.timer.getDelta(), 0.05);
    const elapsed = this.timer.getElapsed();
    const smoothing = 1 - Math.exp(-delta * 3.2);
    this.pointer.lerp(this.pointerTarget, smoothing);
    this.sceneFade += (this.sceneFadeTarget - this.sceneFade) * smoothing;
    this.applySceneFade();

    this.coreMaterial.uniforms.uTime.value = elapsed;
    this.group.rotation.y += (this.pointer.x * 0.2 - this.group.rotation.y) * smoothing;
    this.group.rotation.x += (-this.pointer.y * 0.12 - this.group.rotation.x) * smoothing;
    this.core.rotation.z = elapsed * 0.035;
    this.inner.rotation.y = -elapsed * 0.09;
    this.particles.rotation.y = elapsed * 0.022;
    this.particles.rotation.z = Math.sin(elapsed * 0.16) * 0.08;
    this.halo.rotation.z = elapsed * 0.045;

    this.composer.render();
    this.frameId = requestAnimationFrame(this.animate);
  };

  dispose() {
    if (this.frameId) cancelAnimationFrame(this.frameId);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("framezero:scenechange", this.onSceneChange);
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
