let canvas;
let engine;
let scene;

window.onload = startGame;

function startGame() {
    canvas = document.querySelector("#myCanvas");
    engine = new BABYLON.Engine(canvas, true);
    scene = createScene();

    engine.runRenderLoop(() => {
    
        scene.render();
    });
}

function createScene() {
    let scene = new BABYLON.Scene(engine);
    // ambiant color of the scene = green (like a green sun!)
    scene.ambiantColor = new BABYLON.Color3(0, 1, 0);

    // a plane
    let ground = BABYLON.MeshBuilder.CreateGround("myGround", {width: 60, height: 60, segments:50}, scene);
    let mirrorMaterial = new BABYLON.StandardMaterial("mirrorMaterial", scene);
    
    mirrorMaterial.diffuseColor = new BABYLON.Color3(0.4, 1, 0.4);
    // no reflection on the ground, specular color = black...
    mirrorMaterial.specularColor = new BABYLON.Color3.Black;

    // 1024 = size of the dynamically generated mirror texture
    mirrorMaterial.reflectionTexture = new BABYLON.MirrorTexture("mirror", 1024, scene, true);
    // Plane ax + by +cz + d = 0
    // first 3 params = normal vector to the plane + offset from the origin
    // try to change last parameter to say -10, or try to set first one to say 0.5
    mirrorMaterial.reflectionTexture.mirrorPlane = new BABYLON.Plane(0, -1.0, 0, -2.0);
    // "strength / opacity of the reflection"
    mirrorMaterial.reflectionTexture.level = 1; // between 0 and 1
    ground.material = mirrorMaterial;
    
    // Create some objects 
    // params = number of horizontal "stripes", diameter...
    //let sphere = BABYLON.MeshBuilder.CreateSphere("mySphere", {diameter: 2, segments: 32}, scene);
    let spheres = [];
    let sphereMaterials = [];

    for(let i = 0; i < 10; i++) {
        spheres[i] = BABYLON.MeshBuilder.CreateSphere("mySphere" +i, {diameter: 2, segments: 32}, scene);
        spheres[i].position.x += 3*i -9;
        spheres[i].position.y = 2;

        sphereMaterials[i] = new BABYLON.StandardMaterial("sphereMaterial" + i, scene);
        spheres[i].material = sphereMaterials[i];

        mirrorMaterial.reflectionTexture.renderList.push(spheres[i]);
    }

    sphereMaterials[0].ambiantColor = new BABYLON.Color3(0, 0.5, 0);
    sphereMaterials[0].diffuseColor = new BABYLON.Color3(5, 0, 0);
    sphereMaterials[0].specularColor = new BABYLON.Color3(0, 0, 0);
   
    sphereMaterials[1].ambiantColor = new BABYLON.Color3(0, 0.5, 0);
    sphereMaterials[1].diffuseColor = new BABYLON.Color3(5, 0, 1);
    sphereMaterials[1].specularColor = new BABYLON.Color3(0, 0, 3);
    // concentration of specular reflection, higher = smaller reflection spot
    sphereMaterials[1].specularPower = 32;

    sphereMaterials[2].ambiantColor = new BABYLON.Color3(0, 0.5, 0);
    sphereMaterials[2].diffuseColor = new BABYLON.Color3(0, 0, 0);
    // as if the sphere was illuminated from inside
    sphereMaterials[2].emissiveColor = new BABYLON.Color3(0, 0, 1);

    sphereMaterials[3].diffuseTexture = new BABYLON.Texture("images/lightning.jpg", scene);
    // as if the sphere was illuminated from inside in Green
    sphereMaterials[3].emissiveColor = new BABYLON.Color3.Green

    sphereMaterials[4].diffuseTexture = new BABYLON.Texture("images/lightning.jpg", scene);
    sphereMaterials[4].emissiveColor = new BABYLON.Color3.Yellow

    sphereMaterials[5].diffuseTexture = new BABYLON.Texture("images/lightning.jpg", scene);
    sphereMaterials[5].emissiveColor = new BABYLON.Color3.Red;
    sphereMaterials[5].diffuseTexture.uScale *= 4;

    
    sphereMaterials[6].ambientColor = new BABYLON.Color3(0, .8, 0);
    sphereMaterials[6].diffuseColor = new BABYLON.Color3(1, 0, 0);
    // alpha property means "alpha channel" = transparency
    sphereMaterials[6].alpha = 0.2;

    sphereMaterials[7].diffuseTexture = new BABYLON.Texture("images/coins.png", scene);
    // With .png textures that have some transparent pixels, we can
    // have the texture "see through" if we set the hasAlpha property to true
    sphereMaterials[7].diffuseTexture.hasAlpha = true;
    sphereMaterials[7].emissiveColor = new BABYLON.Color3.Red;

    sphereMaterials[8].ambientColor = new BABYLON.Color3(0, .3, 0);
    sphereMaterials[8].bumpTexture = new BABYLON.Texture("images/normal_map.jpg", scene);
    sphereMaterials[8].bumpTexture.level = 15.0;

    sphereMaterials[9].diffuseTexture = new BABYLON.VideoTexture("video", ["videos/michel.mp4"],scene);
    sphereMaterials[9].diffuseTexture.vScale *= -1;


    let camera = new BABYLON.FreeCamera("myCamera", new BABYLON.Vector3(0, 1, -30), scene);
   // This targets the camera to scene origin
   //camera.setTarget(BABYLON.Vector3.Zero());
   camera.attachControl(canvas);

    // lights
    var light = new BABYLON.PointLight("myPointLight", new BABYLON.Vector3(0, 3, 0), scene);
    light.intensity = .5;
    light.diffuse = new BABYLON.Color3(1, .5, .5);

    var light2 = new BABYLON.PointLight("myPointLight2", new BABYLON.Vector3(0, 3, -10), scene);
    light2.intensity = .5;
    light2.diffuse = new BABYLON.Color3.Green;

    
    let counter = 0;

    scene.registerBeforeRender(() => {
        for(let i = 0; i < spheres.length; i++) {
            spheres[i].position.z = 2*i + Math.sin((i*counter)/2);
            counter += 0.005;

            //sphereMaterials[i].wireframe = true

        }

        sphereMaterials[4].diffuseTexture.uOffset += 0.005;
        sphereMaterials[5].diffuseTexture.uScale += 0.03;
    })

    return scene;
}

window.addEventListener("resize", () => {
    engine.resize()
})