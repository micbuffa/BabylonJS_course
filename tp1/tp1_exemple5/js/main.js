let canvas;
let engine;
let scene;

window.onload = startGame;

function startGame() {
    canvas = document.querySelector("#myCanvas");
    engine = new BABYLON.Engine(canvas, true);
    scene = createScene();

    // modify some default settings (i.e pointer events to prevent cursor to go 
    // out of the game window)
    modifySettings();

    let tank = scene.getMeshByName("heroTank");

    engine.runRenderLoop(() => {
        let deltaTime = engine.getDeltaTime(); // remind you something ?

        //tank.position.z += 1; // speed should be in unit/s, and depends on
                                 // deltaTime !

        // if we want to move while taking into account collision detections
        // collision uses by default "ellipsoids"
        tank.moveWithCollisions(new BABYLON.Vector3(0, 0, 1));
        scene.render();
    });
}

function createScene() {
    let scene = new BABYLON.Scene(engine);
    let ground = createGround(scene);
    let freeCamera = createFreeCamera(scene);

    let tank = createTank(scene);

    // second parameter is the target to follow
    let followCamera = createFollowCamera(scene, tank);
    scene.activeCamera = followCamera;

    createLights(scene);
 
   return scene;
}

function createGround(scene) {
    const groundOptions = { width:2000, height:2000, subdivisions:20, minHeight:0, maxHeight:100, onReady: onGroundCreated};
    //scene is optional and defaults to the current scene
    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("gdhm", 'images/hmap1.png', groundOptions, scene); 

    function onGroundCreated() {
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseTexture = new BABYLON.Texture("images/grass.jpg");
        ground.material = groundMaterial;
        // to be taken into account by collision detection
        ground.checkCollisions = true;
        //groundMaterial.wireframe=true;
    }
    return ground;
}

function createLights(scene) {
    // i.e sun light with all light rays parallels, the vector is the direction.
    let light0 = new BABYLON.DirectionalLight("dir0", new BABYLON.Vector3(-1, -1, 0), scene);

}

function createFreeCamera(scene) {
    let camera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 50, 0), scene);
    camera.attachControl(canvas);
    // prevent camera to cross ground
    camera.checkCollisions = true; 
    // avoid flying with the camera
    camera.applyGravity = true;

    // Add extra keys for camera movements
    // Need the ascii code of the extra key(s). We use a string method here to get the ascii code
    camera.keysUp.push('z'.charCodeAt(0));
    camera.keysDown.push('s'.charCodeAt(0));
    camera.keysLeft.push('q'.charCodeAt(0));
    camera.keysRight.push('d'.charCodeAt(0));
    camera.keysUp.push('Z'.charCodeAt(0));
    camera.keysDown.push('S'.charCodeAt(0));
    camera.keysLeft.push('Q'.charCodeAt(0));
    camera.keysRight.push('D'.charCodeAt(0));

    return camera;
}

function createFollowCamera(scene, target) {
    let camera = new BABYLON.FollowCamera("tankFollowCamera", target.position, scene, target);

    camera.radius = 100; // how far from the object to follow
	camera.heightOffset = 40; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = .1; // how fast to move
	camera.maxCameraSpeed = 5; // speed limit

    return camera;
}

function createTank(scene) {
    let tank = new BABYLON.MeshBuilder.CreateBox("heroTank", {height:2, depth:6, width:6}, scene);
    let tankMaterial = new BABYLON.StandardMaterial("tankMaterial", scene);
    tankMaterial.diffuseColor = new BABYLON.Color3.Red;
    tankMaterial.emissiveColor = new BABYLON.Color3.Blue;
    tank.material = tankMaterial;

    // By default the box/tank is in 0, 0, 0, let's change that...
    tank.position.y = 0.6;

    return tank;
}

window.addEventListener("resize", () => {
    engine.resize()
});

function modifySettings() {
    // as soon as we click on the game window, the mouse pointer is "locked"
    // you will have to press ESC to unlock it
    scene.onPointerDown = () => {
        if(!scene.alreadyLocked) {
            console.log("requesting pointer lock");
            canvas.requestPointerLock();
        } else {
            console.log("Pointer already locked");
        }
    }

    document.addEventListener("pointerlockchange", () => {
        let element = document.pointerLockElement || null;
        if(element) {
            // lets create a custom attribute
            scene.alreadyLocked = true;
        } else {
            scene.alreadyLocked = false;
        }
    })
}