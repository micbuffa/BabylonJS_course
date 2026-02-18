// Init Canvas / Engine / Scene
var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true, { stencil: false }, true);
var scene = createScene(engine, canvas);
var restart; 

// Global BabylonJS Variables
var dirLight, shadowGenerator;
var hdrTexture;
var hdrRotation = 0;
var hdrSkybox;
var carAggregate;

var sceneSize = 30;
var sphereMat1, sphereMat2, sphereMat3;
var min = -sceneSize/2 + 3;
var max = sceneSize/2 - 3; 
var decalMaterial;

// Physics HAVOK
var hk;


// Create Scene
function createScene(engine, canvas) {
    
    // Set Canvas & Engine //
    canvas = document.getElementById("renderCanvas");
    engine.clear(new BABYLON.Color3(0, 0, 0), true, true);
    var scene = new BABYLON.Scene(engine);  
    var toRender = function () {
        scene.render();
        if (restart) engine.stopRenderLoop();
    }
    engine.runRenderLoop(toRender);
    
    // Init Default Camera (Dispose after import model)
    scene.createDefaultCamera();

    // Directional Light //
    dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0,0,0), scene);
    dirLight.intensity = 2.0;
    dirLight.position = new BABYLON.Vector3(0,10,10);
    dirLight.direction = new BABYLON.Vector3(-4, -4, -5);
    dirLight.shadowMinZ = -10;
    dirLight.shadowMaxZ = 80;
    
    // Shadow Generator
    shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight, true);
    shadowGenerator.darkness = 0.45;
    shadowGenerator.bias = 0.001;
    shadowGenerator.usePercentageCloserFiltering = true;

    // Async Function Physics
    async function setPhysics() {
        // initialize plugin
        const havokInstance = await HavokPhysics();
        // pass the engine to the plugin
        hk = new BABYLON.HavokPlugin(true, havokInstance);
        // enable physics in the scene with a gravity
        scene.enablePhysics(new BABYLON.Vector3(0, -20, 0), hk);

        createSceneObjects();
        importModelAsync("car.glb");
    }
    setPhysics();
    
    return scene;
}

function createSceneObjects() {
 
    // Decal Material
    decalMaterial = new BABYLON.PBRMaterial("decalMaterial", scene);
    decalMaterial.albedoTexture = new BABYLON.Texture("./resources/textures/squiz.png");
    decalMaterial.albedoTexture.hasAlpha = true;
    decalMaterial.useAlphaFromAlbedoTexture = true;
    decalMaterial.roughness = 1;
    decalMaterial.alphaCutOff  = 0.01;
    decalMaterial.emissiveTexture = decalMaterial.albedoTexture;
    decalMaterial.emissiveIntensity = 0;
    decalMaterial.emissiveColor = new BABYLON.Color3.White;
    decalMaterial.transparencyMode = 3;
    decalMaterial.environmentIntensity = 0.7;
    decalMaterial.alpha = 0.6;

    // Ground Material
    var groundMat = new BABYLON.PBRMaterial("groundMaterial", scene);
    groundMat.albedoColor = new BABYLON.Color3(1,1,1);
    groundMat.albedoTexture = new BABYLON.Texture("./resources/textures/floor1.jpg", scene);
    groundMat.albedoTexture.uScale = 8
    groundMat.albedoTexture.vScale = 12;
    groundMat.roughness = 0.6;
    groundMat.metallic = 0;

    // Wall Material
    var wallMat = new BABYLON.PBRMaterial("wallMat", scene);
    wallMat.albedoColor = new BABYLON.Color3(0.95,0.95,0.95);
    wallMat.albedoTexture = new BABYLON.Texture("./resources/textures/wood1.jpg", scene);
    wallMat.albedoTexture.uScale = 0.5;
    wallMat.albedoTexture.vScale = 0.5;
    wallMat.roughness = 0.85;
    wallMat.metallic = 0;

    // Sphere Material
    sphereMat1 = new BABYLON.PBRMaterial("sphereMat1", scene);
    sphereMat1.albedoColor = new BABYLON.Color3(0.8,0.5,0.5);
    sphereMat1.roughness = 0.4;
    sphereMat1.metallic = 1;

    sphereMat2 = new BABYLON.PBRMaterial("sphereMat2", scene);
    sphereMat2.albedoColor = new BABYLON.Color3(0.5,0.8,0.5);
    sphereMat2.roughness = 0.4;
    sphereMat2.metallic = 1;

    sphereMat3 = new BABYLON.PBRMaterial("sphereMat3", scene);
    sphereMat3.albedoColor = new BABYLON.Color3(0.5,0.5,0.8);
    sphereMat3.roughness = 0.4;
    sphereMat3.metallic = 1;
    
    // Ground 
    var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: sceneSize, height: sceneSize}, scene);
    ground.isPickable = true;
    ground.material = groundMat;
    ground.receiveShadows = true;
    ground.checkCollisions = true;

    // Walls 
    var wall1 = BABYLON.MeshBuilder.CreateBox("wall", {size: 0.2, height: 1, width: sceneSize+0.2}, scene);
    wall1.position.y = 0.5;
    wall1.position.z = -sceneSize/2;
    wall1.material = wallMat;
    var wall2 = BABYLON.MeshBuilder.CreateBox("wall", {size: 0.2, height: 1, width: sceneSize+0.2}, scene);
    wall2.position.z = sceneSize/2;
    wall2.position.y = 0.5;
    wall2.material = wallMat;
    var wall3 = BABYLON.MeshBuilder.CreateBox("wall", {size: sceneSize+0.2, height: 1, width: 0.2}, scene);
    wall3.position.x = sceneSize/2;
    wall3.position.y = 0.5;
    wall3.position.z = 0;
    wall3.material = wallMat;
    var wall4 = BABYLON.MeshBuilder.CreateBox("wall", {size: sceneSize+0.2, height: 1, width: 0.2}, scene);
    wall4.position.x = -sceneSize/2;
    wall4.position.y = 0.5;
    wall4.position.z = 0;
    wall4.material = wallMat;


    // Pillars
    for (let index = 0; index < 10; index++) {
        var staticBox = BABYLON.MeshBuilder.CreateBox("wall", {size: 0.7, height: 2, width: 0.7}, scene);
        staticBox.position.y = 1;
        staticBox.position.x = -5;
        staticBox.position.z = -5;
        staticBox.material = wallMat;
        staticBox.material = wallMat;

        var rndX = Math.floor(Math.random() * (max - min + 1) + min);
        var rndZ = Math.floor(Math.random() * (max - min + 1) + min);
        var rndY = Math.floor(Math.random() *7) + 8;

        if (rndX == 0)
         rndX = Math.floor(Math.random() * (max - min + 1) + min);
        if (rndY == 0)
         rndY = Math.floor(Math.random() * (max - min + 1) + min);

        staticBox.position.x = rndX;
        staticBox.position.z = rndZ;
        staticBox.position.y = 1;
        const staticBoxAggregate = new BABYLON.PhysicsAggregate(staticBox, BABYLON.PhysicsShapeType.BOX, { mass: 0 }, scene);
    }

    // Physics Objects
    const groundAggregate = new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, { mass: 0 }, scene);
    const wallAgg1 = new BABYLON.PhysicsAggregate(wall1, BABYLON.PhysicsShapeType.BOX, { mass: 0}, scene);
    const wallAgg2 = new BABYLON.PhysicsAggregate(wall2, BABYLON.PhysicsShapeType.BOX, { mass: 0}, scene);
    const wallAgg3 = new BABYLON.PhysicsAggregate(wall3, BABYLON.PhysicsShapeType.BOX, { mass: 0}, scene);
    const wallAgg4 = new BABYLON.PhysicsAggregate(wall4, BABYLON.PhysicsShapeType.BOX, { mass: 0}, scene);

    // Dispose Objects outside from game
    var meshesArray = [];
    scene.registerBeforeRender(()=> {
        scene.meshes.forEach((mesh)=>{
            if (mesh.name.includes("sphere") && mesh.position.y < -1)
            {
                mesh.dispose();
            }
        });
        meshesArray = scene.getActiveMeshes();
    });

    // STATS 
    var statsDiv = document.getElementById("stats-text");
    setInterval(() => {
        statsDiv.innerHTML = "<b>" + Math.round(engine.getFps()) + " FPS <br> " + meshesArray.length + " Active Meshes</b> ";
    }, 100);

    //  scene.debugLayer.show({embedMode: true}).then(function () {
    // });
}

// Drop Spheres
function dropSpheres() {
    if (leftJoystick && leftJoystick.pressed && leftJoystick.pressed)
    return;

    for (let index = 0; index < 100; index++) {

        var randomShape = Math.floor(Math.random() * 2) + 1;
        var scale = Math.random() * 0.1 + 0.6;

        var sphere;
        if (randomShape == 1)
            sphere = BABYLON.MeshBuilder.CreateGoldberg("sphere", {size: scale}, scene);
        else if (randomShape == 2)
            sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {size: scale}, scene);

        var randomMat = Math.floor(Math.random() * 3) + 1;
        if (randomMat == 1)
            sphere.material = sphereMat1;
        else if (randomMat == 2)
            sphere.material = sphereMat2;
        else if (randomMat == 3)
            sphere.material = sphereMat3;

        var rndX = Math.floor(Math.random() * (max - min + 1) + min);
        var rndZ = Math.floor(Math.random() * (max - min + 1) + min);
        var rndY = Math.floor(Math.random() *7) + 8;
        sphere.position.x = rndX;
        sphere.position.z = rndZ;
        sphere.position.y = rndY;

        var sphereAgg; 
        if (randomShape == 1)
            sphereAgg = new BABYLON.PhysicsAggregate(sphere, BABYLON.PhysicsShapeType.MESH, { mass: 100, restitution: 0.6 }, scene);
        else if (randomShape == 2)
            sphereAgg = new BABYLON.PhysicsAggregate(sphere, BABYLON.PhysicsShapeType.SPHERE, { mass: 40, restitution: 0.6 }, scene);

    }

    setLighting();
    setShadows();
    setTimeout(() => {
        canvas.focus();
    }, 200);
}

// Clear Scene
function clearScene() {
    var spheresToRemove = [];
    scene.meshes.forEach(function(mesh) {
      if (mesh.name === "sphere") {
        spheresToRemove.push(mesh);
      }
    });
    
    // Clear Meshes using While
    while (spheresToRemove.length > 0) {
      var mesh = spheresToRemove.pop();
      mesh.dispose();
    }

    setTimeout(() => {
        canvas.focus();
    }, 200);
}


var onFloor = false;

// Load Models Async Function //
function importModelAsync(model) {
    Promise.all([

        BABYLON.SceneLoader.ImportMeshAsync(null, "./resources/models/" , model, scene).then(function (result) {

            var car = result.meshes;
            car[0].scaling = new BABYLON.Vector3(0.2,0.2,0.2);
            

            var bodyMaterial = scene.getMaterialByName("Body");
            bodyMaterial.albedoColor = new BABYLON.Color3(0.9,0.1,0.1);

            var carPhysicsRoot = new BABYLON.MeshBuilder.CreateBox("box", {size: 2.5, height: 0.57, width: 1.2}, scene);
            carPhysicsRoot.addChild(car[0]);
            carPhysicsRoot.visibility = 0;
            carPhysicsRoot.position.y = 2;
            carPhysicsRoot.isPickable = false;

            car[1].isPickable = false;
            car[1].actionManager = new BABYLON.ActionManager(scene);
            car[1].actionManager
            .registerAction(
                new BABYLON.InterpolateValueAction(
                    BABYLON.ActionManager.OnPickTrigger,
                        bodyMaterial,
                        'albedoColor',
                        new BABYLON.Color3.Random(),
                        2000,
                        undefined,
                        undefined,
                        function(){
                            this.value = BABYLON.Color3.Random();
                        }
                )
            );

            carAggregate = new BABYLON.PhysicsAggregate(carPhysicsRoot, BABYLON.PhysicsShapeType.BOX, { mass: 100, restitution:0.01}, scene);
            carAggregate.setCollisionCallbackEnabled = true;
            carAggregate.body.setCollisionCallbackEnabled(true);
            carAggregate.body.setMassProperties({
                mass: 100,
                inertia: new BABYLON.Vector3(0,0,0),
                centerOfMass: new BABYLON.Vector3(0,-1,0)
            });

            // Check if onFloor
            var ground = scene.getMeshByName("ground");
            function predicate(mesh) {
                if (mesh == ground) {
                    return true;
                }
                return false;
            }

            scene.registerBeforeRender(()=> {
                var ray = new BABYLON.Ray(carAggregate.transformNode.position, new BABYLON.Vector3(0,-1,0), 1);
                const hit = scene.pickWithRay(ray, predicate);
                if (hit.pickedMesh){
                    onFloor = true;
                } else {
                    onFloor = false;
                }
                // console.log("onFloor: " + onFloor);
            });


            var shakeTimer = 0;
            
            setInterval(() => {
                shakeTimer++;
            }, 1000);

            const observable = carAggregate.body.getCollisionObservable();
            observable.add((collisionEvent) => {
                // Process collisions for the player
                // console.log("Collide " + collisionEvent.collidedAgainst.transformNode.name);
                
                if (collisionEvent.collidedAgainst.transformNode.name.includes("ground"))
                {
                    onFloor = true;
                }

                if (collisionEvent.collidedAgainst.transformNode.name.includes("sphere"))
                {
                    burst(collisionEvent.collidedAgainst.transformNode, "./resources/textures/smoke.png");
                }

                if (collisionEvent.collidedAgainst.transformNode.name.includes("wall"))
                {
                    if (shakeTimer > 2)
                    {

                    }
                    var randomDir = new BABYLON.Vector3(Math.random() - 0.8, -20, Math.random() - 0.8);
                    randomDir.normalize();
                    shakeTimer = 0;
                }
            });

            scene.registerBeforeRender(()=> {
                if (carAggregate.transformNode.position.y < -1)
                {
                    restart = true;
                    location.reload();
                }
            });

            createArcRotateCameraWithTarget(car[1]);
        }),

    ]).then(() => {
        console.log("ALL Loaded");
        setLighting();    
        setReflections();
        setShadows();
        setTimeout(() => {
            hideLoadingView();    
            keyMove(carAggregate);   
        }, 3000);

    });
}

// Create Arc Rotate Camera With Target
function createArcRotateCameraWithTarget(target) {
    scene.activeCamera.dispose();
    var camera = new BABYLON.ArcRotateCamera("camera", BABYLON.Tools.ToRadians(90), BABYLON.Tools.ToRadians(65), 10, BABYLON.Vector3.Zero(), scene);
    camera.setTarget(target, true, false, false);
    camera.radius = 30;
    camera.alpha = 1;
    camera.beta = 0.8;
    camera.allowUpsideDown = false;
    camera.panningSensibility = 0;
    camera.allowUpsideDown = false;
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 50;
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.panningSensibility = 0;
    camera.cameraAcceleration = .1; // how fast to move
    camera.maxCameraSpeed = 2; // speed limit
    camera.pinchDeltaPercentage = 0.00060;
    camera.wheelPrecision = 20;
    scene.activeCamera = camera;
    camera.useBouncingBehavior = false;
    camera.useAutoRotationBehavior = false;
    camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
    camera.attachControl(canvas, true);
}

// Environment Lighting
function setLighting() {
    hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("./resources/env/environment_19.env", scene);
    hdrTexture.rotationY = BABYLON.Tools.ToRadians(hdrRotation);
    hdrSkybox = BABYLON.MeshBuilder.CreateBox("skybox", {size: 1024}, scene);
    var hdrSkyboxMaterial = new BABYLON.PBRMaterial("skybox", scene);
    hdrSkyboxMaterial.backFaceCulling = false;
    hdrSkyboxMaterial.reflectionTexture = hdrTexture.clone();
    hdrSkyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    hdrSkyboxMaterial.microSurface = 0.6;
    hdrSkyboxMaterial.disableLighting = true;
    hdrSkybox.material = hdrSkyboxMaterial;
    hdrSkybox.infiniteDistance = true;
}

// Set Shadows
function setShadows() {
    scene.meshes.forEach(function(mesh) {
        if (mesh.name != "skybox" 
        && mesh.name != "ground")
        {
            shadowGenerator.addShadowCaster(mesh);
        }
    });
}

// Set Reflections
function setReflections() {
    scene.materials.forEach(function (material) {
        if (material.name != "skybox") {
            material.reflectionTexture = hdrTexture;
            material.reflectionTexture.level = 0.6;
            material.disableLighting = false;
        }
    });
}


// Set Sparks Particles  
function burst(car, spritePNG) {
    // Particle System
    var position = car.position;
    var particleSystem = new BABYLON.ParticleHelper.CreateDefault(position, 100);
    particleSystem.particleTexture = new BABYLON.Texture(spritePNG, window.scene);
    particleSystem.createSphereEmitter(0.5);
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 1;
    particleSystem.addLifeTimeGradient(0, 1, 4);
    particleSystem.addLifeTimeGradient(1, 1, 2);
    particleSystem.emitRate = 5000;
    particleSystem.minEmitPower = 3;
    particleSystem.maxEmitPower = 8;
    particleSystem.minSize = 0.2;
    particleSystem.maxSize = 0.8;
    particleSystem.addColorGradient(0.0, new BABYLON.Color4(
        0.5 + 0.5 * Math.random(), 
        0.5 + 0.5 * Math.random(), 
        0.5 + 0.5 * Math.random(), 
        0.2));
    particleSystem.addColorGradient(1.0, new BABYLON.Color4(
        0.5 + 0.5 * Math.random(), 
        0.5 + 0.5 * Math.random(), 
        0.5 + 0.5 * Math.random(), 
        0));
    particleSystem.addSizeGradient(0.0, 0.3);
    particleSystem.addSizeGradient(0.2, 0.2);
    particleSystem.addSizeGradient(1.0, 0.001);
    particleSystem.targetStopDuration = 0.4;
    particleSystem.disposeOnStop = true;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    particleSystem.start();
}


// Set Sparks Particles  
function tireDecal(car) {
    if (!onFloor)
        return;
    var randians = car.transformNode.rotation.y;
    var degrees = BABYLON.Tools.ToDegrees(randians);
    var decalSizeRandom = 0.4 + Math.random() * 0.9;
    var decalSize = new BABYLON.Vector3(decalSizeRandom, decalSizeRandom, decalSizeRandom*4);
    var ground = scene.getMeshByName("ground");
    var decal = BABYLON.MeshBuilder.CreateDecal("decal", ground, new BABYLON.Vector3(car.transformNode.position.x, 0, car.transformNode.position.z), decalSize, degrees);
    decal.material = decalMaterial;

    var decalAlphaRandom = 0.4 + Math.random() * 0.6;
    decal.visibility = decalAlphaRandom;

    decal.position = new BABYLON.Vector3(car.transformNode.position.x, 0.01, car.transformNode.position.z); 
    var frontVector = car.transformNode.getDirection(BABYLON.Axis.Z);

    decal.rotation.y += frontVector.z + Math.PI;
    decal.scaling = decalSize;
    
    setInterval(() => {
        decal.dispose();
    }, 1000);
}

// Hide Loading View
function hideLoadingView() {
    document.getElementById("loadingDiv").style.display = "none";
}

// Resize Window
window.addEventListener("resize", function () {
    engine.resize();
});