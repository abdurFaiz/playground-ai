import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './index.css';

gsap.registerPlugin(ScrollTrigger);


function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // --- Lenis Smooth Scrolling ---
    const lenis = new Lenis({
      autoRaf: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    // --- GSAP Scroll Animations ---
    const radarSectionParams = {
      scrollTrigger: {
        trigger: ".radar-section",
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      y: 50,
      duration: 1,
      ease: "power3.out"
    };

    gsap.from(".radar-text", radarSectionParams);
    gsap.from(".capabilities-section h2", {
      scrollTrigger: {
        trigger: ".capabilities-section",
        start: "top 80%",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      x: -50,
      duration: 1,
      ease: "power3.out"
    });
    gsap.from(".capabilities-card", {
      scrollTrigger: {
        trigger: ".capabilities-section",
        start: "top 70%",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      y: 50,
      duration: 0.8,
      stagger: 0.2,
      ease: "power2.out"
    });
    gsap.from(".feature-row", {
      scrollTrigger: {
        trigger: ".features-list-section",
        start: "top 75%",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      x: 30,
      duration: 0.8,
      stagger: 0.15,
      ease: "power2.out"
    });

    // --- Loading Overlay Animation Setup ---
    const tl = gsap.timeline();
    tl.to("#loader", {
      opacity: 0,
      duration: 0.8,
      onComplete: () => {
        const loader = document.getElementById("loader");
        if (loader) loader.style.display = "none";
      }
    })
      .to(".nav-item", { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out" }, "-=1")
      .fromTo(".hero-reveal", { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.1, ease: "power4.out" }, "-=0.8");

    // --- Glitch Effect setup ---
    const glitchTargets = document.querySelectorAll('.glitch-target');
    let lX = 0, lY = 0, lT = 0;
    const handleMouseMoveGlitch = (e: MouseEvent) => {
      const now = Date.now(), dt = now - lT;
      if (dt > 30) {
        const dx = e.clientX - lX, dy = e.clientY - lY, s = Math.sqrt(dx * dx + dy * dy) / dt;
        if (s > 2.5) {
          glitchTargets.forEach(el => {
            if (!el.classList.contains('glitch-active')) {
              el.classList.add('glitch-active');
              setTimeout(() => el.classList.remove('glitch-active'), 250);
            }
          });
        }
        lX = e.clientX; lY = e.clientY; lT = now;
      }
    };
    document.addEventListener('mousemove', handleMouseMoveGlitch);

    // --- Configuration for NexOS Theme ---
    const config = {
      colors: {
        bg: 0x000000,
        primary: 0xf97316, // Tailwind Lime-400
        secondary: 0xef4444, // Tailwind Lime-350
        wireframe: 0x0f172a
      }
    };

    // --- Scene Setup ---
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.colors.bg);
    scene.fog = new THREE.FogExp2(config.colors.bg, 0.035);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      powerPreference: "high-performance",
      alpha: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // --- Objects Container ---
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // --- 1. The Core (Solid) ---
    const geometryCore = new THREE.IcosahedronGeometry(2, 10);
    const materialCore = new THREE.MeshPhysicalMaterial({
      color: 0x000000,
      metalness: 0.8,
      roughness: 0.2,
      transmission: 0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      emissive: config.colors.primary,
      emissiveIntensity: 0.1
    });
    const sphereCore = new THREE.Mesh(geometryCore, materialCore);
    mainGroup.add(sphereCore);

    // --- 2. The Wireframe ---
    const geometryWire = new THREE.IcosahedronGeometry(2.2, 2);
    const materialWire = new THREE.MeshBasicMaterial({
      color: config.colors.primary,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const sphereWire = new THREE.Mesh(geometryWire, materialWire);
    mainGroup.add(sphereWire);

    // --- 3. Ambient Particles (Floating Data) ---
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 12;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.04,
      color: config.colors.primary,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // --- 4. The Explosion System (Hidden initially) ---
    const explosionCount = 5000;
    const explosionGeo = new THREE.BufferGeometry();

    const initialPos = new Float32Array(explosionCount * 3);
    const targetPos = new Float32Array(explosionCount * 3);
    const currentPos = new Float32Array(explosionCount * 3);

    for (let i = 0; i < explosionCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / explosionCount);
      const theta = Math.sqrt(explosionCount * Math.PI) * phi;
      const r = 2.0;

      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      initialPos[i * 3] = x;
      initialPos[i * 3 + 1] = y;
      initialPos[i * 3 + 2] = z;

      currentPos[i * 3] = x;
      currentPos[i * 3 + 1] = y;
      currentPos[i * 3 + 2] = z;

      const dir = new THREE.Vector3(x, y, z).normalize();
      const dist = 5.0 + Math.random() * 20.0;

      targetPos[i * 3] = dir.x * dist;
      targetPos[i * 3 + 1] = dir.y * dist;
      targetPos[i * 3 + 2] = dir.z * dist;
    }

    explosionGeo.setAttribute('position', new THREE.BufferAttribute(currentPos, 3));

    const explosionMaterial = new THREE.PointsMaterial({
      size: 0.15,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const explosionSystem = new THREE.Points(explosionGeo, explosionMaterial);
    explosionSystem.visible = false;
    mainGroup.add(explosionSystem);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const light1 = new THREE.PointLight(config.colors.primary, 400);
    light1.position.set(4, 2, 4);
    scene.add(light1);

    const light2 = new THREE.PointLight(config.colors.secondary, 400);
    light2.position.set(-4, -2, 2);
    scene.add(light2);

    // --- Glowing Orbs on the wireframe (Shiny objects) ---
    const createGlowingOrb = (color: number, size: number, x: number, y: number, z: number) => {
      const orbGroup = new THREE.Group();
      orbGroup.position.set(x, y, z);

      const orbGeo = new THREE.SphereGeometry(size, 32, 32);
      const orbMat = new THREE.MeshBasicMaterial({ color: color });
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);

      // Reduced intensity so the bloom doesn't wash out the screen
      const orbLight = new THREE.PointLight(color, 80, 5);

      orbGroup.add(orbMesh);
      orbGroup.add(orbLight);

      // Store reference to light and mesh for easy animation
      orbGroup.userData = { light: orbLight, mesh: orbMesh };
      return orbGroup;
    };

    const shinyOrb1 = createGlowingOrb(config.colors.secondary, 0.1, 1.2, -0.2, 1.8);
    const shinyOrb2 = createGlowingOrb(config.colors.primary, 0.08, -1.0, 1.2, 1.6);
    mainGroup.add(shinyOrb1);
    mainGroup.add(shinyOrb2);

    // --- Post Processing ---
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.85);
    bloomPass.strength = 0.8;
    bloomPass.radius = 0.5;
    bloomPass.threshold = 0.2;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    // Add entry animations for objects
    tl.fromTo(sphereCore.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 1.5, ease: "elastic.out(1, 0.7)" }, "-=0.5")
      .fromTo(sphereWire.scale, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1, duration: 1.5, ease: "elastic.out(1, 0.7)" }, "<");

    // --- Interactions & Animation State ---
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let isHovered = false;
    let isAnimating = false;
    const animState = { progress: 0 };

    function updateExplosion() {
      const positions = explosionGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < explosionCount; i++) {
        const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;

        positions[ix] = initialPos[ix] + (targetPos[ix] - initialPos[ix]) * animState.progress;
        positions[iy] = initialPos[iy] + (targetPos[iy] - initialPos[iy]) * animState.progress;
        positions[iz] = initialPos[iz] + (targetPos[iz] - initialPos[iz]) * animState.progress;

        if (animState.progress > 0.01) {
          const angle = animState.progress * 0.5;
          const x = positions[ix];
          const z = positions[iz];
          positions[ix] = x * Math.cos(angle) - z * Math.sin(angle);
          positions[iz] = x * Math.sin(angle) + z * Math.cos(angle);
        }
      }
      explosionGeo.attributes.position.needsUpdate = true;
    }

    const handlePointerMove = (event: PointerEvent) => {
      mouseX = (event.clientX - windowHalfX);
      mouseY = (event.clientY - windowHalfY);

      // HUD Update
      const xVal = (event.clientX / window.innerWidth).toFixed(2);
      const yVal = (event.clientY / window.innerHeight).toFixed(2);
      const coords = document.getElementById('coords');
      if (coords) coords.innerText = `${xVal}.${yVal}.00`;

      // Raycaster
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(mainGroup.children, true);

      if (intersects.length > 0) {
        if (!isHovered) {
          document.body.style.cursor = 'pointer';
          gsap.to(sphereWire.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.5 });
          gsap.to(sphereCore.material as any, { emissiveIntensity: 0.2, duration: 0.3 });
          isHovered = true;
        }
      } else {
        if (isHovered) {
          document.body.style.cursor = 'default';
          gsap.to(sphereWire.scale, { x: 1, y: 1, z: 1, duration: 0.5 });
          gsap.to(sphereCore.material as any, { emissiveIntensity: 0.1, duration: 0.3 });
          isHovered = false;
        }
      }
    };
    window.addEventListener('pointermove', handlePointerMove);

    const handlePointerDown = () => {
      if (isHovered && !isAnimating) {
        isAnimating = true;
        const statusLight = document.getElementById('status-light');
        const statusText = document.getElementById('status-text');

        if (statusLight && statusText) {
          statusLight.classList.remove('bg-orange-500');
          statusLight.classList.add('bg-white');
          statusText.innerText = "Status: Re-Indexing";
          statusText.classList.remove('text-orange-500/80');
          statusText.classList.add('text-white');
        }

        // Balloon pop: Instantly scale down core components and kill lights
        gsap.to([sphereCore.scale, sphereWire.scale, shinyOrb1.scale, shinyOrb2.scale], {
          x: 0, y: 0, z: 0,
          duration: 0.3,
          ease: "expo.out",
          onComplete: () => {
            sphereCore.visible = false;
            sphereWire.visible = false;
            shinyOrb1.visible = false;
            shinyOrb2.visible = false;
          }
        });

        gsap.to([shinyOrb1.userData.light, shinyOrb2.userData.light], {
          intensity: 0,
          duration: 0.2
        });

        explosionSystem.visible = true;
        explosionMaterial.opacity = 1;

        gsap.to(animState, {
          progress: 1,
          duration: 1.5,
          ease: "power2.out", // Smooth explosion spread
          onUpdate: () => {
            updateExplosion();
            explosionMaterial.opacity = 1 - animState.progress;

            // Pulse the colors during explosion
            if (animState.progress < 0.5) {
              explosionMaterial.color.setHex(config.colors.secondary);
            } else {
              explosionMaterial.color.setHex(config.colors.primary);
            }
          },
          onComplete: () => {
            // Regrowth sequence
            animState.progress = 0;
            updateExplosion();
            explosionSystem.visible = false;

            sphereCore.visible = true;
            sphereWire.visible = true;
            shinyOrb1.visible = true;
            shinyOrb2.visible = true;

            gsap.to([sphereCore.scale, sphereWire.scale, shinyOrb1.scale, shinyOrb2.scale], {
              x: 1, y: 1, z: 1,
              duration: 2.5,
              ease: "elastic.out(1, 0.5)",
            });

            gsap.to([shinyOrb1.userData.light, shinyOrb2.userData.light], {
              intensity: 80,
              duration: 1.5,
              delay: 0.2,
              onComplete: () => {
                isAnimating = false;

                if (statusLight && statusText) {
                  statusLight.classList.add('bg-orange-500');
                  statusLight.classList.remove('bg-white');
                  statusText.innerText = "Status: Operational";
                  statusText.classList.add('text-orange-500/80');
                  statusText.classList.remove('text-white');
                }
              }
            });
          }
        });
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);

    // --- Animation Loop ---
    const clock = new THREE.Clock();
    let reqId: number;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      targetX = mouseX * 0.001;
      targetY = mouseY * 0.001;

      if (!isAnimating || animState.progress < 0.5) {
        mainGroup.rotation.y += 0.002;
        mainGroup.rotation.x += 0.001;
      }

      mainGroup.rotation.y += 0.05 * (targetX - mainGroup.rotation.y);
      mainGroup.rotation.x += 0.05 * (targetY - mainGroup.rotation.x);

      // Make the 3D object move follow the cursor translation directly
      const floatTargetX = mouseX * 0.005;
      const floatTargetY = mouseY * 0.005;
      mainGroup.position.x += 0.05 * (floatTargetX - mainGroup.position.x);
      mainGroup.position.y += 0.05 * (-floatTargetY - mainGroup.position.y);

      if (!isAnimating) {
        const scale = 1 + Math.sin(elapsedTime * 2) * 0.02;
        sphereWire.scale.set(scale, scale, scale);
      }

      light1.position.x = Math.sin(elapsedTime * 0.7) * 4;
      light1.position.y = Math.cos(elapsedTime * 0.5) * 4;
      light2.position.x = Math.cos(elapsedTime * 0.3) * 5;
      light2.position.z = Math.sin(elapsedTime * 0.5) * 5;

      particlesMesh.rotation.y = elapsedTime * 0.05;
      particlesMesh.rotation.x = -mouseY * 0.0002;

      composer.render();
      reqId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mousemove', handleMouseMoveGlitch);
      cancelAnimationFrame(reqId);

      // cleanup renderer
      renderer.dispose();
      composer.dispose();

      sphereCore.geometry.dispose();
      (sphereCore.material as THREE.Material).dispose();
      sphereWire.geometry.dispose();
      (sphereWire.material as THREE.Material).dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      explosionGeo.dispose();
      explosionMaterial.dispose();
      lenis.destroy();
    };
  }, []);

  return (
    <>
      {/* Loading Overlay */}
      <div id="loader" className="fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-1000">
        <div className="flex flex-col items-center gap-4">
          <div className="h-px w-24 bg-neutral-800 overflow-hidden relative">
            <div className="absolute inset-0 bg-orange-500 w-full -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 font-mono">
            Awakening AI Core
          </p>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes shimmer { 100% { transform: translateX(100%); } }
        `}} />
      </div>

      {/* 3D Hero Container */}
      <div className="relative h-screen w-full overflow-hidden">
        {/* Canvas Background (Absolute to Hero) */}
        <div className="absolute inset-0 z-0">
          <canvas ref={canvasRef} id="webgl-canvas" className="w-full h-full outline-none cursor-grab active:cursor-grabbing" data-engine="three.js r160"></canvas>
        </div>

        {/* Hero UI Overlay */}
        <div className="relative z-10 flex flex-col h-full pointer-events-none">
          {/* Navigation */}
          <header className="w-full px-6 py-6 flex justify-between items-center pointer-events-auto opacity-0 nav-item">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-black/50 backdrop-blur-md group-hover:border-orange-500/50 transition-colors duration-300">
                <iconify-icon icon="solar:widget-5-linear" className="text-orange-500 text-xl transition-transform group-hover:rotate-90"></iconify-icon>
              </div>
              <span className="text-lg font-medium tracking-tight text-white group-hover:text-orange-500 transition-colors glitch-target">
                NexOS
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1 glass-panel p-1 rounded-full">
              <a href="#" className="px-5 py-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors text-xs font-medium uppercase tracking-wider">Discover Skills</a>
              <a href="#" className="px-5 py-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors text-xs font-medium uppercase tracking-wider">Connect Apps</a>
              <a href="#" className="px-5 py-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors text-xs font-medium uppercase tracking-wider">Agent Memory</a>
            </nav>

            <button className="group flex items-center gap-2 px-4 py-2 border border-white/10 rounded-full bg-black/20 backdrop-blur-sm hover:border-orange-500/30 hover:bg-orange-500/10 transition-all duration-300">
              <span className="text-xs font-medium text-white group-hover:text-orange-400">Enter Workspace</span>
              <iconify-icon icon="solar:arrow-right-linear" width="16" className="text-orange-500 group-hover:translate-x-0.5 transition-transform"></iconify-icon>
            </button>
          </header>

          {/* Hero Main Content */}
          <main className="flex-grow flex flex-col justify-center px-6 md:px-12 lg:px-24 pointer-events-none">
            <div className="max-w-5xl space-y-8">
              {/* Status Line */}
              <div className="overflow-hidden">
                <div className="hero-reveal flex items-center gap-3">
                  <span id="status-light" className="flex h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)] transition-colors duration-300"></span>
                  <p id="status-text" className="text-xs md:text-sm uppercase tracking-[0.2em] text-orange-500/80 font-medium font-mono transition-colors duration-300">
                    AI Agents: Ready & Listening
                  </p>
                </div>
              </div>

              {/* Headlines */}
              <div className="space-y-0">
                <div className="overflow-hidden">
                  <h1 className="hero-reveal text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight leading-[0.95] text-white glitch-target mix-blend-difference">
                    Your AI Workforce,
                  </h1>
                </div>
                <div className="overflow-hidden">
                  <h1 className="hero-reveal text-5xl md:text-7xl lg:text-8xl font-serif italic font-light tracking-tight leading-[0.95] text-orange-400/90 glitch-target">
                    Awakened.
                  </h1>
                </div>
              </div>

              {/* Description */}
              <div className="overflow-hidden max-w-xl">
                <p className="hero-reveal text-sm md:text-lg text-zinc-400 leading-relaxed font-light">
                  We took the raw, untamed power of OpenClaw and wrapped it in a beautifully simple interface. Now anyone can build, train, and deploy autonomous AI agents—no coding required.
                  <span className="text-orange-500/70 text-xs block mt-2 font-mono uppercase tracking-widest opacity-80">&gt; Click the core to wake them up</span>
                </p>
              </div>

              {/* Buttons */}
              <div className="overflow-hidden pt-6">
                <div className="hero-reveal flex flex-wrap pointer-events-auto pt-4 pr-1 pb-4 pl-1 gap-x-4 gap-y-4">
                  {/* Main Action: Install NexOS */}
                  <div className="btn-wrapper">
                    <button className="btn" type="button" aria-label="Start Building Free">
                      <div className="txt-wrapper">
                        <div className="txt-1 flex whitespace-nowrap">
                          <span className="btn-letter">S</span><span className="btn-letter">t</span><span className="btn-letter">a</span><span className="btn-letter">r</span><span className="btn-letter">t</span>
                          <span className="btn-letter" style={{ width: '4px' }}></span>
                          <span className="btn-letter">B</span><span className="btn-letter">u</span><span className="btn-letter">i</span><span className="btn-letter">l</span><span className="btn-letter">d</span><span className="btn-letter">i</span><span className="btn-letter">n</span><span className="btn-letter">g</span>
                        </div>
                      </div>
                      <svg className="btn-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                  </div>

                  {/* Secondary Action: View Documentation */}
                  <button className="group inline-flex overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(249,115,22,0.2)] h-[54px] rounded-full pt-[1px] pr-[1px] pb-[1px] pl-[1px] relative items-center justify-center">
                    <span className="animate-[spin_4s_linear_infinite] transition-opacity duration-300 group-hover:opacity-100 opacity-0 absolute top-[-150%] left-[-150%] w-[400%] h-[400%] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#a3e635_100%)]"></span>
                    <span className="absolute inset-0 rounded-full bg-white/10 transition-opacity duration-300 group-hover:opacity-0"></span>

                    <span className="flex items-center justify-center gap-2 transition-colors duration-300 group-hover:text-orange-400 text-sm font-medium text-white tracking-tight bg-zinc-950 w-full h-full rounded-full pr-8 pl-8 relative shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <span className="relative z-10">See How It Works</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 text-zinc-400 group-hover:text-orange-400 transition-colors">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <line x1="10" y1="9" x2="8" y2="9"></line>
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </main>

          {/* Bottom Stats */}
          <footer className="pointer-events-auto nav-item flex justify-between items-end w-full px-6 pb-8 opacity-0">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Vector Coords</span>
              <span id="coords" className="text-xs font-mono text-orange-500">0.52.0.24.00</span>
            </div>

            <div className="hidden md:flex gap-4">
              <iconify-icon icon="simple-icons:telegram" className="text-zinc-600 hover:text-[#26A5E4] transition-colors text-xl"></iconify-icon>
              <iconify-icon icon="simple-icons:discord" className="text-zinc-600 hover:text-[#5865F2] transition-colors text-xl"></iconify-icon>
              <iconify-icon icon="simple-icons:python" className="text-zinc-600 hover:text-[#3776AB] transition-colors text-xl"></iconify-icon>
            </div>
          </footer>
        </div>

        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-[5] pointer-events-none"></div>
      </div>

      {/* Radar / Features Section */}
      <section className="py-32 relative overflow-hidden bg-black radar-section">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16 relative z-10 radar-text">
          <h2 className="text-3xl md:text-5xl font-medium text-white tracking-tight mb-6">
            Give Your AI a <span className="font-serif italic text-orange-400">Brain</span>
          </h2>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Stop wrestling with code just to make your AI smart. We built an operating system that gives your agents real memory, simple controls, and the ability to learn instantly.
          </p>
        </div>

        {/* Radar Visualization */}
        <div className="aspect-square md:aspect-[1.5/1] flex w-full max-w-2xl mr-auto ml-auto relative items-center justify-center">

          {/* Sonar Ripple Effects */}
          <div className="absolute w-[80%] h-[80%] rounded-full border border-white/5 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-30"></div>
          <div className="absolute w-[60%] h-[60%] rounded-full border border-white/10 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-20" style={{ animationDelay: '1s' }}></div>

          {/* Concentric Circles (Breathing) */}
          <div className="absolute w-[80%] h-[80%] rounded-full border border-white/5 animate-pulse"></div>
          <div className="absolute w-[60%] h-[60%] rounded-full border border-white/10 animate-pulse" style={{ animationDelay: '500ms' }}></div>
          <div className="absolute w-[40%] h-[40%] rounded-full border border-white/20 animate-pulse" style={{ animationDelay: '1000ms' }}></div>

          {/* Center Core */}
          <div className="relative z-10 flex flex-col items-center justify-center w-32 h-32 rounded-full bg-zinc-900 border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500 mb-1"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"></path></svg>
            <span className="text-xs font-medium text-white tracking-tight">NexOS Core</span>
          </div>

          {/* Orbiting Nodes */}
          {/* Node 1: Unified Messaging */}
          <div className="absolute top-[15%] left-[20%] flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-orange-500/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-orange-500 transition-colors"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <span className="text-xs text-zinc-500 group-hover:text-white transition-colors">Talks Everywhere</span>
          </div>

          {/* Node 2: Super Memory */}
          <div className="absolute bottom-[20%] right-[20%] flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-orange-500/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-orange-500 transition-colors"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>
            </div>
            <span className="text-xs text-zinc-500 group-hover:text-white transition-colors">Never Forgets</span>
          </div>

          {/* Node 3: Skill Injection */}
          <div className="absolute top-[20%] right-[25%] flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-orange-500/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-orange-500 transition-colors"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </div>
            <span className="text-xs text-zinc-500 group-hover:text-white transition-colors">Learns Instantly</span>
          </div>

          {/* Node 4: Easy Config */}
          <div className="absolute bottom-[15%] left-[25%] flex flex-col items-center gap-2 group cursor-pointer hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center group-hover:border-orange-500/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 group-hover:text-orange-500 transition-colors"><path d="M21 4h-2"></path><path d="M15 4H3"></path><path d="M18 12H3"></path><path d="M8 20H3"></path><path d="M21 12h-1"></path><path d="M21 20h-9"></path><circle cx="17" cy="4" r="2"></circle><circle cx="19" cy="12" r="2"></circle><circle cx="10" cy="20" r="2"></circle></svg>
            </div>
            <span className="text-xs text-zinc-500 group-hover:text-white transition-colors">Visual Controls</span>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-24 bg-zinc-950 border-t border-white/5 capabilities-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <h2 className="text-4xl md:text-6xl font-medium text-white tracking-tight">
              More Than Just <br /> <span className="font-serif italic font-light text-zinc-500">Chatbots</span>
            </h2>
            <button className="hidden md:block border border-white/20 text-white px-6 py-2 rounded-full text-sm hover:bg-white/10 transition-colors">
              Explore Capabilities
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer bg-zinc-900 border border-white/5 hover:border-orange-500/30 transition-colors duration-500 capabilities-card">
              <div className="bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent opacity-50 bg-[url(https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/b01267d3-c696-41dd-9a95-17c8c4481d9a_1600w.webp)] bg-cover bg-center absolute top-0 right-0 bottom-0 left-0"></div>
              <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                <div className="flex items-center gap-2 mb-2 text-orange-500">
                  <iconify-icon icon="solar:brain-bold-duotone"></iconify-icon>
                  <span className="text-xs uppercase tracking-wider font-bold">Long-Term Memory</span>
                </div>
                <h3 className="text-3xl text-white font-medium mb-1">Total Recall</h3>
                <p className="text-zinc-400 text-sm">Your AI remembers every conversation, preference, and detail. It builds context over time, acting like a true digital partner instead of a forgetful script.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer bg-zinc-900 border border-white/5 hover:border-orange-500/30 transition-colors duration-500 capabilities-card">
              <div className="bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-50 bg-[url(https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/a1c0957e-20e3-4106-b8ed-cd23c34ed15e_1600w.webp)] bg-cover bg-center absolute top-0 right-0 bottom-0 left-0"></div>
              <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                <div className="flex items-center gap-2 mb-2 text-orange-500">
                  <iconify-icon icon="solar:chat-round-bold-duotone"></iconify-icon>
                  <span className="text-xs uppercase tracking-wider font-bold">Central Command</span>
                </div>
                <h3 className="text-3xl text-white font-medium mb-1">One Inbox for All</h3>
                <p className="text-zinc-400 text-sm">Whether your bots live on Telegram, Discord, or Slack, you control them from one elegant dashboard. Read, reply, and monitor everything in one place.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Quote */}
      <section className="text-center bg-black pt-32 pr-6 pb-32 pl-6">
        <p className="text-3xl md:text-5xl font-medium text-white max-w-4xl mx-auto leading-tight tracking-tight">
          "Think of OpenClaw as a powerful engine.<br />
          <span className="font-serif italic text-zinc-500">We just handed you the keys and the steering wheel.</span>"
        </p>
        <p className="mt-4 text-lg text-zinc-500">Give your AI eyes, ears, memory, and a beautiful interface to interact with the world.</p>

        <div className="mt-12 flex justify-center">
          <button className="border border-white/20 text-white px-6 py-2 rounded-full text-sm hover:bg-white/10 transition-colors">
            Explore the Platform
          </button>
        </div>
      </section>

      <section className="border-y border-white/5 pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-zinc-600 text-sm font-medium mb-12 uppercase tracking-widest">Your agents work everywhere you do</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <iconify-icon icon="simple-icons:telegram" width="40" className="text-white hover:text-[#26A5E4]"></iconify-icon>
            <iconify-icon icon="simple-icons:discord" width="40" className="text-white hover:text-[#5865F2]"></iconify-icon>
            <iconify-icon icon="simple-icons:slack" width="40" className="text-white hover:text-[#4A154B]"></iconify-icon>
            <iconify-icon icon="simple-icons:whatsapp" width="40" className="text-white hover:text-[#25D366]"></iconify-icon>
            <iconify-icon icon="simple-icons:signal" width="40" className="text-white hover:text-[#3A76F0]"></iconify-icon>
          </div>
        </div>
      </section>

      {/* Features List */}
      <section className="py-32 bg-black features-list-section">
        <div className="max-w-5xl mx-auto px-6 bg-zinc-900/50 rounded-3xl p-10 md:p-20 border border-white/10">
          <h3 className="text-center text-3xl font-medium text-white mb-16">How we make the <span className="font-serif italic text-zinc-400">impossible, easy</span>.</h3>

          <div className="space-y-0 divide-y divide-white/10">
            {/* Row 1 */}
            <div className="group py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer feature-row">
              <div className="flex items-start gap-4">
                <span className="text-xs font-mono text-zinc-600 mt-1">01</span>
                <h4 className="text-xl text-white font-medium group-hover:text-orange-500 transition-colors">Teach Them Instantly</h4>
              </div>
              <p className="text-sm text-zinc-500 max-w-sm">Want your AI to search the web or read PDFs? Just click 'Add Skill'. No complicated installations, just instant new abilities.</p>
            </div>

            {/* Row 2 */}
            <div className="group py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer feature-row">
              <div className="flex items-start gap-4">
                <span className="text-xs font-mono text-zinc-600 mt-1">02</span>
                <h4 className="text-xl text-white font-medium group-hover:text-orange-500 transition-colors">Flawless Memory</h4>
              </div>
              <p className="text-sm text-zinc-500 max-w-sm">We handle the complex matching behind the scenes. Your agents remember past chats effortlessly, creating incredibly personalized experiences.</p>
            </div>

            {/* Row 3 */}
            <div className="group py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer feature-row">
              <div className="flex items-start gap-4">
                <span className="text-xs font-mono text-zinc-600 mt-1">03</span>
                <h4 className="text-xl text-white font-medium group-hover:text-orange-500 transition-colors">Visual Control Panel</h4>
              </div>
              <p className="text-sm text-zinc-500 max-w-sm">Ditch the dark terminal screens. Adjust settings, manage limits, and tweak your AI's personality using simple, beautiful sliders and text boxes.</p>
            </div>

            {/* Row 4 */}
            <div className="group py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer feature-row">
              <div className="flex items-start gap-4">
                <span className="text-xs font-mono text-zinc-600 mt-1">04</span>
                <h4 className="text-xl text-white font-medium group-hover:text-orange-500 transition-colors">Deploy Everywhere</h4>
              </div>
              <p className="text-sm text-zinc-500 max-w-sm">Train your agent once, and let it talk to your customers on Telegram, handle support on Slack, and chat on Discord—all at the same time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-32 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-30"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h4 className="text-sm font-medium text-zinc-500 mb-8 uppercase tracking-widest">Stories from our <span className="font-serif italic text-white lowercase">builders</span>.</h4>

          <div className="mb-10">
            <p className="text-xs font-bold text-white tracking-wider">THE COMMUNITY</p>
          </div>

          <blockquote className="text-2xl md:text-3xl text-zinc-300 font-serif italic leading-relaxed mb-12">
            "I wanted to build an AI support team but the technical barrier was too high. With this OS, I built agents, gave them company knowledge, and deployed them to WhatsApp in an afternoon. It feels like magic."
          </blockquote>

          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-medium">MT</span>
            </div>
            <div className="text-center">
              <div className="text-white text-sm font-medium">Marcus T.</div>
              <div className="text-zinc-600 text-xs">Founder</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-20 px-4 md:px-6 bg-black">
        {/* Animated Gradient Border Wrapper */}
        <div className="max-w-7xl mx-auto p-[1px] rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 bg-[length:200%_auto] hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-shadow duration-500">

          {/* Inner Dark Content Container */}
          <div className="bg-zinc-950 rounded-[23px] p-16 md:p-24 text-center relative overflow-hidden group h-full w-full">

            {/* Subtle Inner Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>

            <div className="relative z-10 flex flex-col items-center">
              <iconify-icon icon="solar:rocket-broken" className="text-orange-500 text-5xl mb-6 group-hover:-translate-y-2 transition-transform duration-500"></iconify-icon>

              <h2 className="text-4xl md:text-6xl font-medium text-white mb-6 tracking-tight">
                Ready to build your first <br />
                autonomous <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">agent?</span>
              </h2>

              <button className="mt-4 bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 px-8 py-3 rounded-full text-sm font-bold shadow-lg hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] hover:-translate-y-1 transition-all">
                Get Started for Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Custom NexOS Tech Footer */}
      <footer className="relative w-full h-[600px] bg-[#0c0c0e] border-t border-white/5 flex items-center justify-center overflow-hidden z-10">

        {/* Massive Background Typography */}
        <div className="absolute -bottom-10 left-0 right-0 flex justify-center pointer-events-none select-none">
          <span className="text-[22vw] font-bold text-[#141416] leading-none tracking-tighter mix-blend-color-dodge">
            NexOS
          </span>
        </div>

   

        {/* Center Content */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-1 mt-[-100px]">
          <p className="text-zinc-500 text-sm font-medium tracking-widest uppercase">© 2026</p>
          <p className="text-zinc-400 text-base font-medium">NexOS Corporation.</p>
          <p className="text-zinc-500 text-sm hover:text-white transition-colors cursor-pointer mt-1 font-serif italic">
            Let the Agents handle it.
          </p>
        </div>

        {/* Footer Navigation (Absolute Bottom Layer) */}
        <div className="absolute bottom-6 w-full px-10 flex justify-between items-center z-20">
          <div className="flex gap-6">
            <a href="#" className="text-xs text-zinc-600 hover:text-orange-500 transition-colors uppercase tracking-widest font-mono">Twitter</a>
            <a href="#" className="text-xs text-zinc-600 hover:text-orange-500 transition-colors uppercase tracking-widest font-mono">GitHub</a>
            <a href="#" className="text-xs text-zinc-600 hover:text-orange-500 transition-colors uppercase tracking-widest font-mono">Discord</a>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-zinc-600 hover:text-orange-500 transition-colors uppercase tracking-widest font-mono">Privacy</a>
            <a href="#" className="text-xs text-zinc-600 hover:text-orange-500 transition-colors uppercase tracking-widest font-mono">Terms</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
