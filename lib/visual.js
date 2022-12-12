//import * as THREE from 'three'

// SCENE
let scene = new THREE.Scene();
scene.background = new THREE.TextureLoader().load('texture/sunset.jpg');

// CAMERA
const cam = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
cam.position.x += 0;
cam.position.y += 5;
cam.position.z += 5;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.setSize(window.innerWidth , window.innerHeight);
//renderer.setPixelRatio(window.devicePixelRatio);
//renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);


// CONTROLLER
// const orbitcontrol = new OrbitControls(cam, renderer.domElement);
// orbitcontrol.enableDamping = true;
// orbitcontrol.minDistance = 5;
// orbitcontrol.maxDistance = 15;
// orbitcontrol.enablePan = false;
// orbitcontrol.maxPolarAngle = Math.PI / 2-0.05;
// orbitcontrol.update();


// LIGHT
let light1 = new THREE.PointLight(0xffffff,1);
light1.position.set(0,3,2);
scene.add(light1);


// LAND / FLOOR


// CONTROL KEYS
document.addEventListener('keydown', (event) => {

}, false);


// ANIMATE

// adding resize capability
window.addEventListener("resize", function(){
    let width = window.innerWidth;
    let height = window.innerHeight;
    renderer.setSize(width , height);
    cam.aspect = width/height;
    cam.updateProjectionMatrix();
});

// MESH ROTATION



renderer.render(scene , cam);
