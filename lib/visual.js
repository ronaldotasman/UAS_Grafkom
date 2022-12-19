
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
let planetProto = {
    sphere: function(size){
        let sphere = new THREE.SphereGeometry(size, 32, 32);
        return sphere;
    },
    material: function(options){
        let material = new THREE.MeshPhongMaterial();
        if (options){
            for (var property in options){
                material[property] = options[property];
            }
        }
        return material;
    },

    glowMat: function(intensity, fade, color){
        let glowMat = new THREE.ShaderMaterial({
            uniforms:{
                'c':{
                    type: 'f',
                    value: intensity
                },
                'p':{
                    type: 'f',
                    value: fade
                },
                glowColor:{
                    type:'c',
                    value: new THREE.Color(color)
                },
                viewVector:{
                    type:'v3',
                    value: cam.position
                }
            },

            vertexShader: `
                uniform vec3 viewVector;
                uniform float c;
                uniform float p;
                varying float intensity;
                void main() {
                vec3 vNormal = normalize( normalMatrix * normal );
                vec3 vNormel = normalize( normalMatrix * viewVector );
                intensity = pow( c - dot(vNormal, vNormel), p );
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }`,

            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() 
                {
                    vec3 glow = glowColor * intensity;
                    gl_FragColor = vec4( glow, 1.0 );
                }`,

            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        return glowMat;
    },

    texture: function(material, property, uri){
        let textureLoad = new THREE.TextureLoader();
        textureLoad.crossOrigin = true;
        textureLoad.load(
            uri, function (texture){
                material[property] = texture;
                material.needsUpdate = true;
            }
        );
    }
};

// CREATE PLANET & ATMOSPHERE
let createPlanet = function (options){
    // PLANET'S SURFACE
    let surfaceGeo = planetProto.sphere(options.surface.size);
    let surfaceMat = planetProto.material(options.surface.material);
    let surface = new THREE.Mesh(surfaceGeo, surfaceMat);

    // PLANET'S ATMOSPHERE
    let atmosphereGeo = planetProto.sphere(
        options.surface.size + options.atmosphere.size
    );
    let atmosphereMatDef = {
        side: THREE.DoubleSide, transparent: true
    };

    let atmosphereMatOptions = Object.assign(atmosphereMatDef, 
        options.atmosphere.material);
    let atmosphereMat = planetProto.material(atmosphereMatOptions);
    let atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);

    // PLANET'S ATMOSPHERIC GLOW
    let atmosphericGlowGeo = planetProto.sphere(
        options.surface.size + options.atmosphere.size + options.atmosphere.glow.size
    );
    let atmosphericGlowMat = planetProto.glowMat(
        options.atmosphere.glow.intensity, 
        options.atmosphere.glow.fade,
        options.atmosphere.glow.color 
    );
    let atmosphericGlow = new THREE.Mesh(atmosphericGlowGeo , atmosphericGlowMat);

    // PLANET'S SURFACE & ATMOSPHERE INTU A PLANET OBJECT
    let planet = new THREE.Object3D();
    surface.name = 'surface';
    atmosphere.name = 'atmosphere';
    atmosphericGlow.name = 'atmosphericGlow';
    planet.add(surface);
    planet.add(atmosphere);
    planet.add(atmosphericGlow);

    // LOAD THE SURFACE'S TEXTURES
    for (let texturePro in options.surface.textures){
        planetProto.texture(
            surfaceMat, texturePro,
            options.surface.textures[texturePro]
        );
    }

    // LOAD THE ATMOSPHERE'S TEXTURES
    for (let texturePro in options.atmosphere.textures){
        planetProto.texture(
            atmosphereMat, texturePro,
            options.atmosphere.textures[texturePro]
        );
    }
    return planet;
};

let earth = createPlanet({
    surface: {
        size: 0.5,
        material:{
            bumpScale: 0.05,
            specular: new THREE.Color('grey'),
            shininess: 10
        },
        textures: {
            map:'texture/globe.jpg',
            bumpMap: 'texture/bump_maps.jpg',
            specularMap: 'texture/rgb_maps.jpg'
        }
    },
    atmosphere: {
        size: 0.003,
        material: { opacity: 0.8},
        textures: {
            map: 'texture/cloud_maps.jpg',
            alphaMap: 'texture/cloud_maps.jpg'
        },
        glow: {
            size: 0.02,
            intensity: 0.7,
            fade: 7,
            color: 0x9C2E35
        }
    }
});

// MARKER PROTO
let markerProto = {
    latLongToVector3: function latLongToVector3(latitude, longitude, radius, height){
        var phi = latitude*Math.PI/180;
        var theta = (longitude-180) * Math.PI/180;

        var x = -(radius + height) * Math.cos(phi) * Math.cos(theta);
        var y = (radius + height) * Math.sin(phi);
        var z = (radius + height) * Math.cos(phi) * Math.sin(theta);

        return new THREE.Vector3(x,y,z);
    },

    marker: function marker(size, color, vector3Position){
        let markerGeo = new THREE.SphereGeometry(size);
        let markerMat = new THREE.MeshLambertMaterial({color: color});

        let markerMesh = new THREE.Mesh(markerGeo , markerMat);
        markerMesh.position.copy(vector3Position);

        return markerMesh;
    }
};

// PLACE MARKER
let placeMarker = function(object, options){
    let position = markerProto.latLongToVector3(
        options.latitude, options.longitude, options.radius, options.height);
    let marker = markerProto.marker(options.size, options.color, position);
    object.add(marker);
};

// PLACE MARKER AT ADDRESS
let placeMarkerAtAddress = function(address, color){
    let encodedLoc = address.replace(/\s/g, '+');
    let httpRequest = new XMLHttpRequest();

    httpRequest.open('GET', 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodedLoc);
    httpRequest.send(null);
    httpRequest.onreadystatechange = function(){
        if (httpRequest.readyState == 4 && httpRequest.status == 200){
            let result = JSON.parse(httpRequest.responseText);

            if (result.results.length > 0){
                let latitude = result.results[0].geometry.location.lat;
                let longitude = result.results[0].geometry.location.lng;

                placeMarker(earth.getObjectByName('surface'),{
                    latitude: latitude,
                    longitude: longitude,
                    radius: 0.5,
                    height: 0,
                    size: 0.01,
                    color: color
                });
            }
        }
    };
};


// GALAXY
let galaxyGeo = new THREE.SphereGeometry(100, 32, 32);
let galaxyMat = new THREE.MeshBasicMaterial({
    side: THREE.BackSide
});
let galaxy = new THREE.Mesh(galaxyGeo , galaxyMat);

// LOAD GALAXY TEXTURES
textureLoad.crossOrigin = true;
textureLoad.load('texture/back_space.jpg' , 
function(texture){
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
scene.add(galaxy);

// LIGHT CONFIG
light1.position.set(2,0,1);

// MESH CONFIG
earth.receiveShadow = true;
earth.castShadow = true;
earth.getObjectByName('surface').geometry.center();

// ON WINDOW RESIZE
window.addEventListener('resize' , function(){
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// MAIN RENDER FUNCTION
let render = function(){
    earth.getObjectByName('surface').rotation.y += 1/32*0.01;
    earth.getObjectByName('atmosphere').rotation.y += 1/16*0.01;
    if (camAutoRotation){
        camRotation += camRotationSpeed;
        cam.position.y = 0;
        cam.position.x = 2*Math.sin(camRotation);
        cam.position.z = 2*Math.cos(camRotation);
        cam.lookAt(earth.position);
    }
    requestAnimationFrame(render);
    renderer.render(scene,cam);
}

render();

