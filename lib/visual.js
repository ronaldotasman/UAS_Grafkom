

// RENDERER
let renderer = new THREE.WebGLRenderer();

// SCENE
let scene = new THREE.Scene();

// CAMERA
let cam = new THREE.PerspectiveCamera(
    45, window.innerWidth / window.innerHeight, 0.1, 1500 //1500 atau 1000 ?
); 
let camRotation = 0;
let camRotationSpeed = 0.001;
let camAutoRotation = true;

let orbitControl = new THREE.OrbitControls(cam);


// LIGHT
let light1 = new THREE.PointLight(0xffffff, 1, 0, 10, 2);


// TEXTURE
let textureLoad = new THREE.TextureLoader();


// PLANET PROTO


// GALAXY
let galaxyGeo = new THREE.SphereGeometry(100, 32, 32);
let galaxyMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide
});
let galaxy = new THREE.Mesh(galaxyGeo , galaxyMat);

// LOAD GALAXY TEXTURES
textureLoad.crossOrigin = true;
textureLoad.load('' , function(texture){
    galaxyMat.map = texture;
    scene.add(galaxy);
});



// SCENE CAMERA RENDERER CONFIG
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

cam.position.set(1,1,1);
orbitControl.enabled = !camAutoRotation;

scene.add(cam);
scene.add(light1);
//scene.add(); BELUM


// LIGHT CONFIG
light1.position.set(2,0,1);




function draw (){
    renderer.render(scene , cam);
    requestAnimationFrame(draw);
}

draw ();