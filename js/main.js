import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/RGBELoader.js";
import { DRACOLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/DRACOLoader.js";
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/ShaderPass.js';

// Global Default
let swingEnabled = false;
let swingSpeed = 0.5;
let returningToCenter = false;
let swingTime = 0;
let swingAngle = 0;
let currentAntialias = false;
let gridFadeTarget = 1;
let fadeSpeed = 0.05;
let hdrTexture = null;
let bloomComposer, finalComposer;
let bloomPass;

let bloomParams = {
  strength: 2.6,
  radius: 0.6,
  threshold: 0.0
};

// Scene setup
const scene = new THREE.Scene();
const clock = new THREE.Clock();
scene.environment = null;

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(5, 4, 5);
camera.lookAt(new THREE.Vector3(0, 2, 0));

let renderer;
let controls;

let composer;
const bloomLayer = new THREE.Layers();
bloomLayer.set(1);

const darkMaterial = new THREE.MeshBasicMaterial({
  color: "black",
  depthWrite: true,
  depthTest: true
});
const materials = {};

const AdditiveBlendShader = {
  uniforms: {
    'tDiffuse': { value: null }, // rendered normal scene
    'tAdd': { value: null }  // bloom result
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
    uniform sampler2D tAdd;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec4 bloom = texture2D(tAdd, vUv);
      gl_FragColor = vec4(mix(color.rgb, color.rgb + bloom.rgb, bloom.a), color.a);
    }
  `
};

function initRenderer(antialias = false) {
  const previousTarget = controls?.target?.clone();
  const shadowWasEnabled = renderer?.shadowMap?.enabled ?? false;

  if (renderer) {
    renderer.dispose();
    const oldCanvas = renderer.domElement;
    oldCanvas?.remove();
  }

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias });
  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = shadowWasEnabled;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;

  document.getElementById("container3D").appendChild(renderer.domElement);

  if (controls) {
    controls.dispose();
  }

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2.2;
  controls.minDistance = 5;
  controls.maxDistance = 20;
  controls.enablePan = false;

  if (previousTarget) {
    controls.target.copy(previousTarget);
  }

  updateEnvMap();
  controls.update();

  // ✅ Gunakan MSAA hanya jika antialiasing diaktifkan
  const size = new THREE.Vector2(window.innerWidth, window.innerHeight);
  const baseRenderTarget = antialias
    ? new THREE.WebGLMultisampleRenderTarget(size.x, size.y, {
      format: THREE.RGBAFormat,
      encoding: THREE.sRGBEncoding,
    })
    : new THREE.WebGLRenderTarget(size.x, size.y, {
      format: THREE.RGBAFormat,
      encoding: THREE.sRGBEncoding,
    });

  const renderScene = new RenderPass(scene, camera);
  bloomPass = new UnrealBloomPass(
    size,
    bloomParams.strength,
    bloomParams.radius,
    bloomParams.threshold
  );

  bloomComposer = new EffectComposer(renderer, baseRenderTarget);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);

  const finalPass = new ShaderPass(AdditiveBlendShader);
  finalPass.uniforms['tAdd'].value = bloomComposer.renderTarget2.texture;

  finalComposer = new EffectComposer(renderer, baseRenderTarget.clone());
  finalComposer.renderToScreen = true;
  finalComposer.addPass(new RenderPass(scene, camera));
  finalComposer.addPass(finalPass);
  
}


initRenderer(false);

setupBloomSliderControls();

const bloomToggles = document.querySelectorAll('.bloom-toggle');
let bloomEnabled = false;
bloomToggles.forEach(toggle => {
  toggle.checked = false;
  toggle.addEventListener('change', (e) => {
    bloomEnabled = e.target.checked;
    bloomToggles.forEach(t => t.checked = bloomEnabled);
  });
});



// Grid
const gridHelper = new THREE.GridHelper(30, 20);
gridHelper.material.transparent = true;
gridHelper.material.opacity = 1;
gridHelper.position.y = 0;
scene.add(gridHelper);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(512, 512);
directionalLight.shadow.bias = -0.002;
directionalLight.shadow.radius = 4;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 50;

scene.add(directionalLight);

const shadowQualityMap = {
  "Low": 512,
  "Medium": 1024,
  "High": 2048,
  "Ultra": 4096
};

let currentShadowQuality = "Low";


// HDRI environment
const pmremGenerator = new THREE.PMREMGenerator(renderer);
let envMapGlobal = null;

new RGBELoader()
  .setPath('./hdr/')
  .load('paul_lobe_haus_4k.hdr', (texture) => {
    hdrTexture = texture;

    const newPMREM = new THREE.PMREMGenerator(renderer);
    envMapGlobal = newPMREM.fromEquirectangular(hdrTexture).texture;

    // HANYA AKTIFKAN scene.environment jika toggle HDRI aktif
    if (hdriToggles && hdriToggles.checked) {
      scene.environment = envMapGlobal;
    } else {
      scene.environment = null; // pastikan nonaktif
    }

    // Kalau objek sudah ada, perbarui materialnya sesuai toggle
    if (object) {
      applyEnvMapToMaterials(object, hdriToggles && hdriToggles.checked ? envMapGlobal : null);
    }

    hdrTexture.dispose();
    newPMREM.dispose();
  });


// Load model
let object;

function normalizeModel(model, targetSize = 8) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxDim;
  model.scale.setScalar(scale);

  model.position.x -= center.x;
  model.position.z -= center.z;

  const newBox = new THREE.Box3().setFromObject(model);
  model.position.y -= newBox.min.y;
}

function applyEnvMapToMaterials(model, envMap, intensity = 0.3) {
  model.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.envMap = envMap;
      child.material.envMapIntensity = intensity;
      child.material.needsUpdate = true;
    }
  });
}

function applyGlassAndMetalMaterial(child) {
  if (!child.isMesh || !child.material) return;

  const matName = child.material.name?.toLowerCase() || "";

  const isGlass = matName.includes("glass") || matName.includes("kaca");
  const isMetal = matName.includes("metal") || child.material.metalness > 0;
  const isBloom = child.userData?.isBloom === true || matName === "bloom_effect";

  // ✅ Terapkan bloom layer hanya jika perlu
  if (isBloom) {
    child.userData.isBloom = true;
    child.layers.enable(1);

    if (!child.material.emissive || child.material.emissive.equals(new THREE.Color(0x000000))) {
      child.material.emissive = child.material.color.clone();
      child.material.emissiveIntensity = 1.0;
      child.material.needsUpdate = true;
    }
  }

  if (!isBloom) {
    child.material.transparent = false;
    child.material.depthWrite = true;
    child.material.depthTest = true;
    child.material.needsUpdate = true;
  }

  if (isGlass) {
    child.material = new THREE.MeshPhysicalMaterial({
      color: child.material.color || 0xffffff,
      metalness: 0,
      roughness: 0,
      transmission: 1.0,
      ior: 1.52,
      thickness: 0.01,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.15,
      transparent: true,      
      opacity: 1,
      side: THREE.DoubleSide,
      envMap: envMapGlobal,
      envMapIntensity: 1.0,
      depthWrite: false       
    });
  }

  else if (isMetal) {
    child.material.roughness = 0.1;
    child.material.metalness = 1.0;
    child.material.envMapIntensity = 0.3;
    child.material.needsUpdate = true;
  }
}

function setCameraFrontTop(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = maxDim * 1.0;

  const x = center.x;
  const y = center.y + distance * 0.6;
  const z = center.z + distance;

  camera.position.set(x, y, z);
  camera.lookAt(center);

  controls.target.copy(center);
  controls.update();
}

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/');
loader.setDRACOLoader(dracoLoader);

const objToRender = 'Mini Stadium';

window.addEventListener("DOMContentLoaded", () => {
  showLoader();

  setTimeout(() => {
    loader.load(`./models/${objToRender}/scene.glb`, (gltf) => {
      object = gltf.scene;
      normalizeModel(object, 9);

      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;

          const matName = child.material?.name?.toLowerCase() || "";
          if (matName.startsWith("bloom_effect")) {
            child.userData.isBloom = true;
          }
          applyGlassAndMetalMaterial(child);
        }
      });

      scene.add(object);
      setCameraFrontTop(object);
      updateMeshDataDisplay(object);

      const useEnvMap = (hdriToggles && hdriToggles.checked) ? envMapGlobal : null;
      applyEnvMapToMaterials(object, useEnvMap);

      directionalLight.target = object;
      scene.add(directionalLight.target);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.ShadowMaterial({ opacity: 0.25 })
      );

      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0.01;
      ground.receiveShadow = false;
      scene.add(ground);

      hideLoader();
    }, undefined, (error) => {
      console.error("Failed to load default model:", error);
      hideLoader();

      if (!navigator.onLine) {
        showErrorToast("No Internet Connection", "Failed to load the default model. You are currently offline.");
      } else {
        showErrorToast("Default Model Load Failed", "Could not load the default model. Please check if the model exists.");
      }
    });
  }, 5000);
});

const animationToggle = document.getElementById('animationToggle');
const levelSelector = document.querySelector('.vertical-level-selector');
const vCircles = levelSelector.querySelectorAll('.v-circle');
const vLines = levelSelector.querySelectorAll('.v-line');

// === ANIMASI SWING ===
function swingModel(deltaTime) {
  if (!swingEnabled || !object || returningToCenter) return;

  const angleLimit = Math.PI / 8; // batas kiri-kanan max
  swingTime += deltaTime * swingSpeed;

  const angle = Math.sin(swingTime) * angleLimit;
  object.rotation.y = angle;
}

document.querySelectorAll('.vertical-level-selector').forEach(wrapper => {
  const defaultLevel = wrapper.dataset.default;
  const circles = wrapper.querySelectorAll('.v-circle');
  const lines = wrapper.querySelectorAll('.v-line');

  function updateLevelUI(level) {
    document.querySelectorAll('.vertical-level-selector').forEach(otherWrapper => {
      const otherCircles = otherWrapper.querySelectorAll('.v-circle');
      const otherLines = otherWrapper.querySelectorAll('.v-line');

      let activeIndex = -1;
      otherCircles.forEach((c, i) => {
        const isActive = c.dataset.level === level;
        c.classList.toggle('active-level-speed', isActive);
        if (isActive) activeIndex = i;
      });

      otherLines.forEach((line, i) => {
        line.style.transform = i < activeIndex ? 'scaleX(1)' : 'scaleX(0)';
      });
    });

    // ✅ Tambahkan logika swingSpeed di sini:
    swingSpeed = parseFloat(level);
  }

  circles.forEach((circle) => {
    circle.addEventListener('click', () => {
      const level = circle.dataset.level;
      updateLevelUI(level);
    });

    if (circle.dataset.level === defaultLevel) {
      setTimeout(() => circle.click(), 10);
    }
  });
});


// Animation
function animate() {
  requestAnimationFrame(animate);
  const deltaTime = clock.getDelta();
  controls.update();
  swingModel(deltaTime);
  returnToCenter();

  if (gridHelper.material.opacity !== gridFadeTarget) {
    const diff = gridFadeTarget - gridHelper.material.opacity;
    const delta = Math.sign(diff) * fadeSpeed;
    gridHelper.material.opacity = THREE.MathUtils.clamp(
      gridHelper.material.opacity + delta,
      0, 1
    );
    if (gridHelper.material.opacity <= 0) {
      gridHelper.visible = false;
    }
  }

  if (bloomEnabled) {
    darkenNonBloomed(scene);
    camera.layers.set(1);
    bloomComposer.render();
    camera.layers.set(0);
    restoreMaterials(scene);
    finalComposer.render();
  } else {
    renderer.render(scene, camera);
  }
}

animate();

// Resize handler
window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  bloomComposer.setSize(width, height);
  finalComposer.setSize(width, height);
});

// === TOGGLE ANIMASI ===
const animationToggles = document.querySelectorAll('.animation-toggle');
animationToggles.forEach(toggle => {
  toggle.checked = false;
  toggle.addEventListener('change', (e) => {
    swingEnabled = e.target.checked;
    animationToggles.forEach(t => t.checked = swingEnabled);
    if (!swingEnabled && object) {
      returningToCenter = true;
      swingTime = 0;
    }
  });
});

// === PILIH LEVEL KECEPATAN ===
vCircles.forEach((circle, index) => {
  circle.addEventListener('click', () => {
    // 1. Set nilai kecepatan
    swingSpeed = parseFloat(circle.dataset.level);

    // 2. Update kelas aktif
    vCircles.forEach(c => c.classList.remove('active-level-speed'));
    circle.classList.add('active-level-speed');

    // 3. Aktifkan garis progress
    vLines.forEach((line, i) => {
      if (i < index) {
        line.style.transform = 'scaleX(1)';
      } else {
        line.style.transform = 'scaleX(0)';
      }
    });
  });

  // Set default saat load
  if (circle.dataset.level === levelSelector.dataset.default) {
    circle.click(); // trigger klik default
  }
});

function returnToCenter() {
  if (!object || !returningToCenter) return;

  const currentY = object.rotation.y;
  const lerpSpeed = 0.05; // kecepatan kembali (semakin kecil = makin halus)
  const newY = THREE.MathUtils.lerp(currentY, 0, lerpSpeed);

  object.rotation.y = newY;

  // Jika sudah sangat dekat ke 0, hentikan
  if (Math.abs(newY) < 0.001) {
    object.rotation.y = 0;
    swingAngle = 0;
    returningToCenter = false;
  }
}


const shadowToggles = document.querySelectorAll('.shadow-toggle');
shadowToggles.forEach(toggle => {
  toggle.checked = false;
  toggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    shadowToggles.forEach(t => t.checked = enabled);
    renderer.shadowMap.enabled = enabled;
    directionalLight.castShadow = enabled;

    if (enabled) {
      const res = shadowQualityMap[currentShadowQuality];
      directionalLight.shadow.mapSize.set(res, res);
      directionalLight.shadow.map?.dispose();
      directionalLight.shadow.map = null;
      directionalLight.shadow.camera.updateProjectionMatrix();
      renderer.shadowMap.needsUpdate = true;
      renderer.compile(scene, camera);

      object?.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    } else {
      object?.traverse(child => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
    }
  });
});

document.querySelectorAll('.vertical-level-shadow').forEach(wrapper => {
  const defaultShadow = wrapper.dataset.default;
  const circles = wrapper.querySelectorAll('.v-circle-shadow');
  const lines = wrapper.querySelectorAll('.v-line-shadow');

  function updateShadowUI(level) {
    document.querySelectorAll('.vertical-level-shadow').forEach(otherWrapper => {
      const otherCircles = otherWrapper.querySelectorAll('.v-circle-shadow');
      const otherLines = otherWrapper.querySelectorAll('.v-line-shadow');

      let activeIndex = -1;
      otherCircles.forEach((c, i) => {
        const isActive = c.dataset.level === level;
        c.classList.toggle('active-level-shadow', isActive);
        if (isActive) activeIndex = i;
      });

      otherLines.forEach((line, i) => {
        // Hanya nyalakan line sebelum index aktif
        line.style.transform = i < activeIndex ? 'scaleX(1)' : 'scaleX(0)';
      });
    });
  }

  circles.forEach((circle) => {
    circle.addEventListener('click', () => {
      const level = circle.dataset.level;
      currentShadowQuality = level;
      updateShadowUI(level);

      // Terapkan kualitas shadow jika aktif
      if (renderer?.shadowMap?.enabled) {
        const res = shadowQualityMap[level];
        directionalLight.shadow.mapSize.set(res, res);
        directionalLight.shadow.map?.dispose();
        directionalLight.shadow.map = null;
        directionalLight.shadow.camera.updateProjectionMatrix();
        renderer.shadowMap.needsUpdate = true;
        renderer.compile(scene, camera);
      }
    });

    if (circle.dataset.level === defaultShadow) {
      setTimeout(() => circle.click(), 10);
    }
  });
});

const modelCards = document.querySelectorAll('.card.group-1');
const loaderWrapper = document.querySelector('.loader-wrapper');
let isModelLoading = false;

function showLoader() {
  loaderWrapper.classList.add('active');
}

function hideLoader() {
  loaderWrapper.classList.remove('active');
}

function removeCurrentModel() {
  if (object) {
    scene.remove(object);
    object.traverse(child => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    object = null;
  }
}

function loadNewModel(modelName) {
  isModelLoading = true;
  showLoader();
  removeCurrentModel();

  bloomToggles.checked = false;
  bloomEnabled = false;

  aaToggles.checked = false;
  currentAntialias = false;
  initRenderer(false);

  resetSettingsToDefault(); // Tidak lagi menyentuh renderer

  setTimeout(() => {
    const newLoader = new GLTFLoader();
    const newDracoLoader = new DRACOLoader();
    newDracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.3/');
    newLoader.setDRACOLoader(newDracoLoader);

    newLoader.load(`./models/${modelName}/scene.glb`, (gltf) => {
      object = gltf.scene;
      normalizeModel(object, 9);

      object.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = renderer.shadowMap.enabled;
          child.receiveShadow = renderer.shadowMap.enabled;

          // 🌟 Tandai bloom layer jika material name cocok
          const matName = child.material?.name?.toLowerCase() || "";
          if (matName.startsWith("bloom_effect")) {
            child.userData.isBloom = true;
          }

          applyGlassAndMetalMaterial(child); // <- akan membaca userData.isBloom dan aktifkan efeknya
        }
      });

      scene.add(object);
      setCameraFrontTop(object);
      updateMeshDataDisplay(object);
      updateTitleWithAnimation(modelName);

      // 🌍 HDRI
      const useEnvMap = hdriToggles.checked ? envMapGlobal : null;
      applyEnvMapToMaterials(object, useEnvMap);

      directionalLight.target = object;
      scene.add(directionalLight.target);

      // 🪨 Ground
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.ShadowMaterial({ opacity: 0.25 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0.01;
      ground.receiveShadow = false;
      scene.add(ground);

      // ✅ Pastikan bloom layer diaktifkan ulang
      if (bloomEnabled) {
        object.traverse((child) => {
          if (child.isMesh && child.userData?.isBloom) {
            child.layers.enable(1);
          }
        });
      }

      hideLoader();
      isModelLoading = false;
    }, undefined, (error) => {
      console.error("Failed to load model:", error);
      hideLoader();

      if (!navigator.onLine) {
        showErrorToast("No Internet Connection", "Please check your network and try again.");
      } else {
        showErrorToast("Model Load Failed", `The model "${modelName}" is not available.`);
      }
    });
  }, 5000);
}

function updateMeshDataDisplay(model) {
  let totalVertices = 0;
  let totalTriangles = 0;
  let meshCount = 0;

  model.traverse((child) => {
    if (child.isMesh && child.geometry) {
      meshCount++;
      const geometry = child.geometry;
      geometry.computeBoundingBox();
      geometry.computeVertexNormals();

      const position = geometry.attributes.position;
      const index = geometry.index;

      if (position) {
        totalVertices += position.count;
        if (index) {
          totalTriangles += index.count / 3;
        } else {
          totalTriangles += position.count / 3;
        }
      }
    }
  });

  const totalAll = totalTriangles + totalVertices + meshCount;

  const cardMeshContainers = document.querySelectorAll('.card-mesh');

  cardMeshContainers.forEach(container => {
    const totalCountEl = container.querySelector('.total-count');
    const legendItems = container.querySelectorAll('.legend-item');

    if (totalCountEl) {
      totalCountEl.textContent = totalAll.toLocaleString();
    }

    if (legendItems.length >= 3) {
      legendItems[0].querySelector('.value').textContent = totalTriangles.toLocaleString();
      legendItems[1].querySelector('.value').textContent = totalVertices.toLocaleString();
      legendItems[2].querySelector('.value').textContent = meshCount.toLocaleString();
    }

    const maxValue = Math.max(totalTriangles, totalVertices, meshCount);
    const minWidth = 20;

    const calcWidth = (val) => maxValue === 0 ? minWidth : Math.max((val / maxValue) * 100, minWidth);

    const progressTriangles = container.querySelector('.progress-triangles');
    const progressVertices = container.querySelector('.progress-vertices');
    const progressMeshes = container.querySelector('.progress-meshes');

    if (progressTriangles) progressTriangles.style.width = `${calcWidth(totalTriangles)}%`;
    if (progressVertices) progressVertices.style.width = `${calcWidth(totalVertices)}%`;
    if (progressMeshes) progressMeshes.style.width = `${calcWidth(meshCount)}%`;
  });
}

modelCards.forEach(card => {
  card.addEventListener('click', () => {
    if (isModelLoading) return;

    const modelName = card.dataset.model;

    // Sinkronkan class active-model untuk semua card dengan model yang sama
    document.querySelectorAll('.card.group-1').forEach(c => {
      const isActive = c.dataset.model === modelName;
      c.classList.toggle('active-model', isActive);
    });

    loadNewModel(modelName);
  });
});


const aaToggles = document.querySelectorAll('.aa-toggle');
aaToggles.forEach(toggle => {
  toggle.checked = false;
  toggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    currentAntialias = enabled;
    aaToggles.forEach(t => t.checked = enabled);
    initRenderer(enabled);
  });
});

// === TOGGLE GRID HELPER DENGAN FADE IN/OUT ===
gridHelper.material.transparent = true;
gridHelper.material.opacity = 1;
gridHelper.visible = true;

const gridToggles = document.querySelectorAll('.grid-toggle');
gridToggles.forEach(toggle => {
  toggle.checked = true;
  toggle.addEventListener('change', (e) => {
    const show = e.target.checked;
    gridHelper.visible = true;
    gridFadeTarget = show ? 1 : 0;
    gridToggles.forEach(t => t.checked = show);
  });
});

const hdriToggles = document.querySelectorAll('.hdri-toggle');
hdriToggles.forEach(toggle => {
  toggle.checked = false;
  toggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    hdriToggles.forEach(t => t.checked = enabled);
    scene.environment = enabled ? envMapGlobal : null;
    if (object) applyEnvMapToMaterials(object, enabled ? envMapGlobal : null, 0.3);
  });
});

function updateEnvMap() {
  if (!hdrTexture || !renderer) return;

  const newPMREM = new THREE.PMREMGenerator(renderer);
  const envMap = newPMREM.fromEquirectangular(hdrTexture).texture;
  envMapGlobal = envMap;

  const enabled = Array.from(hdriToggles || []).some(t => t.checked);

  scene.environment = enabled ? envMapGlobal : null;
  if (object) {
    applyEnvMapToMaterials(object, enabled ? envMapGlobal : null);
  }

  hdrTexture.dispose();
  newPMREM.dispose();
}


function resetSettingsToDefault() {

  resetToggle('.aa-toggle', false);

  // 1. Reset parameter bloom ke default
  bloomParams = {
    strength: 2.6,
    radius: 0.6,
    threshold: 0.0
  };

  // 2. Set nilai efek bloom ke objek bloomPass (jika sudah ada)
  if (bloomPass) {
    bloomPass.strength = bloomParams.strength;
    bloomPass.radius = bloomParams.radius;
    bloomPass.threshold = bloomParams.threshold;
  }

  // 3. Reset semua slider & tampilannya
  ['strength', 'radius', 'threshold'].forEach(key => {
    const val = bloomParams[key];
    document.querySelectorAll(`.bloom-${key}`).forEach(slider => {
      slider.value = val;
      updateSliderBackground(slider);
      const display = slider.closest('.bloom-card')?.querySelector('.bloom-value');
      if (display) display.textContent = val.toFixed(2);
    });
  });

  // 4. Matikan semua bloom toggle
  resetToggle('.bloom-toggle', false);
  bloomEnabled = false;


  setupBloomSliderControls();

  // Reset Shadow
  resetToggle('.shadow-toggle', false);
  renderer.shadowMap.enabled = false;
  directionalLight.castShadow = false;

  // Reset Shadow Resolution ke "Low"
  currentShadowQuality = "Low";
  const shadowWrapper = document.querySelector('.vertical-level-shadow');
  const defaultShadow = shadowWrapper.dataset.default;
  const allShadowCircles = document.querySelectorAll('.v-circle-shadow');
  const allShadowLines = document.querySelectorAll('.v-line-shadow');

  allShadowCircles.forEach((circle, index) => {
    const level = circle.dataset.level;
    if (level === defaultShadow) {
      circle.classList.add('active-level-shadow');
    } else {
      circle.classList.remove('active-level-shadow');
    }
  });

  // Reset semua garis jadi 0
  allShadowLines.forEach(line => {
    if (line) line.style.transform = 'scaleX(0)';
  });


  // Reset Animation
  resetToggle('.animation-toggle', false);
  swingEnabled = false;
  returningToCenter = true;
  swingTime = 0;

  // Reset Animation Speed ke default
  const speedWrapper = document.querySelector('.vertical-level-selector');
  const defaultSpeed = speedWrapper.dataset.default;
  const allSpeedCircles = document.querySelectorAll('.v-circle');
  const allSpeedLines = document.querySelectorAll('.v-line');

  allSpeedCircles.forEach((circle, index) => {
    const level = circle.dataset.level;
    if (level === defaultSpeed) {
      circle.classList.add('active-level-speed');
      swingSpeed = parseFloat(level);
    } else {
      circle.classList.remove('active-level-speed');
    }
  });

  // Reset semua garis jadi 0
  allSpeedLines.forEach(line => {
    if (line) line.style.transform = 'scaleX(0)';
  });


  // Reset HDRI toggle
  resetToggle('.hdri-toggle', false);
  scene.environment = null;

  // Reset Grid toggle
  resetToggle('.grid-toggle', true);
  gridHelper.visible = true;
  gridFadeTarget = 1;

  if (object) applyEnvMapToMaterials(object, null);
}

function showErrorToast(message1 = "Error Message", message2 = "3D model belum tersedia.") {
  const toast = document.getElementById('errorToast');
  const text1 = toast.querySelector('.text-1');
  const text2 = toast.querySelector('.text-2');

  text1.textContent = message1;
  text2.textContent = message2;

  toast.classList.add('active-toast');

  // Sembunyikan otomatis setelah 4 detik
  setTimeout(() => {
    toast.classList.remove('active-toast');
  }, 10000);
}

function updateTitleWithAnimation(newTitle) {
  const titleEls = document.querySelectorAll('.model-title');
  if (!titleEls.length) return;

  titleEls.forEach(titleEl => {
    titleEl.style.transition = 'opacity 0.5s';
    titleEl.style.opacity = 0;
  });

  setTimeout(() => {
    titleEls.forEach(titleEl => {
      titleEl.textContent = newTitle;
      titleEl.style.opacity = 1;
    });
  }, 500);
}


function updateSliderBackground(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const percent = ((val - min) / (max - min)) * 100;

  let activeColor = '#4ee59e'; // default
  let backgroundColor = '#1e2a3a'; // default

  // Cek konteks slider
  if (slider.closest('.panel-setting-info')) {
    activeColor = '#4ee59e'; // warna untuk panel-setting-info
    backgroundColor = '#1e2a3a';
  } else if (slider.closest('.card-wrapper')) {
    activeColor = '#4ee59e'; // warna untuk card-wrapper
    backgroundColor = '#3b4b5d';
  }

  slider.style.background = `linear-gradient(to right, ${activeColor} ${percent}%, ${backgroundColor} ${percent}%)`;
}


function setupBloomSliderControls() {
  const strengthSliders = document.querySelectorAll('.bloom-strength');
  const radiusSliders = document.querySelectorAll('.bloom-radius');
  const thresholdSliders = document.querySelectorAll('.bloom-threshold');
  const strengthDisplays = document.querySelectorAll('.bloom-strength');
  const radiusDisplays = document.querySelectorAll('.bloom-radius');
  const thresholdDisplays = document.querySelectorAll('.bloom-threshold');

  function syncSliderGroup(sliders, paramKey, passKey) {
    sliders.forEach(slider => {
      slider.value = bloomParams[paramKey];
      updateSliderBackground(slider);

      // Temukan elemen <span class="bloom-value"> di dalam parent .bloom-card
      const card = slider.closest('.bloom-card');
      const display = card?.querySelector('.bloom-value');

      slider.addEventListener('input', e => {
        const val = parseFloat(e.target.value);
        bloomParams[paramKey] = val;
        bloomPass[passKey] = val;

        sliders.forEach(s => {
          s.value = val;
          updateSliderBackground(s);
        });

        // Update value jika ditemukan
        document.querySelectorAll(`.bloom-${paramKey}`).forEach(otherSlider => {
          const otherCard = otherSlider.closest('.bloom-card');
          const otherDisplay = otherCard?.querySelector('.bloom-value');
          if (otherDisplay) otherDisplay.textContent = val.toFixed(2);
        });
      });
    });
  }

  syncSliderGroup(strengthSliders, 'strength', 'strength', strengthDisplays);
  syncSliderGroup(radiusSliders, 'radius', 'radius', radiusDisplays);
  syncSliderGroup(thresholdSliders, 'threshold', 'threshold', thresholdDisplays);
}

function darkenNonBloomed(obj) {
  obj.traverse((child) => {
    if (child.isMesh && bloomLayer.test(child.layers) === false) {
      materials[child.uuid] = child.material;
      child.material = darkMaterial;
    }
  });
}

function restoreMaterials(obj) {
  obj.traverse((child) => {
    if (child.isMesh && materials[child.uuid]) {
      child.material = materials[child.uuid];
      delete materials[child.uuid];
    }
  });
}

function resetToggle(selector, value = false) {
  const toggles = document.querySelectorAll(selector);
  toggles.forEach(t => {
    if (t) t.checked = value;
  });
}
