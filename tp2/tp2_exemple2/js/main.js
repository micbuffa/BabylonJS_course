import Dude from "./Dude.js";

let canvas;
let engine;
let scene;
// vars for handling inputs
let inputStates = {};

window.onload = startGame;

function startGame() {
    canvas = document.querySelector("#myCanvas");
    engine = new BABYLON.Engine(canvas, true);
    scene = createScene();

    // enable physics
    scene.enablePhysics();

    // modify some default settings (i.e pointer events to prevent cursor to go 
    // out of the game window)
    modifySettings();

    let tank = scene.getMeshByName("heroTank");

    engine.runRenderLoop(() => {
        let deltaTime = engine.getDeltaTime(); // remind you something ?

        tank.move();
        tank.fire(); // will fire only is space is pressed !

        moveHeroDude();
        moveOtherDudes();

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

    createHeroDude(scene);
 
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

        // for physic engine
        ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground,
            BABYLON.PhysicsImpostor.HeightmapImpostor, { mass: 0 }, scene);    
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

    camera.radius = 40; // how far from the object to follow
	camera.heightOffset = 14; // how high above the object to place the camera
	camera.rotationOffset = 180; // the viewing angle
	camera.cameraAcceleration = .1; // how fast to move
	camera.maxCameraSpeed = 5; // speed limit

    return camera;
}

let zMovement = 5;
function createTank(scene) {
    let tank = new BABYLON.MeshBuilder.CreateBox("heroTank", {height:1, depth:6, width:6}, scene);
    let tankMaterial = new BABYLON.StandardMaterial("tankMaterial", scene);
    tankMaterial.diffuseColor = new BABYLON.Color3.Red;
    tankMaterial.emissiveColor = new BABYLON.Color3.Blue;
    tank.material = tankMaterial;

    // By default the box/tank is in 0, 0, 0, let's change that...
    tank.position.y = 0.6;
    tank.speed = 1;
    tank.frontVector = new BABYLON.Vector3(0, 0, 1);

    tank.move = () => {
                //tank.position.z += -1; // speed should be in unit/s, and depends on
                                 // deltaTime !

        // if we want to move while taking into account collision detections
        // collision uses by default "ellipsoids"

        let yMovement = 0;
       
        if (tank.position.y > 2) {
            zMovement = 0;
            yMovement = -2;
        } 
        //tank.moveWithCollisions(new BABYLON.Vector3(0, yMovement, zMovement));

        if(inputStates.up) {
            //tank.moveWithCollisions(new BABYLON.Vector3(0, 0, 1*tank.speed));
            tank.moveWithCollisions(tank.frontVector.multiplyByFloats(tank.speed, tank.speed, tank.speed));
        }    
        if(inputStates.down) {
            //tank.moveWithCollisions(new BABYLON.Vector3(0, 0, -1*tank.speed));
            tank.moveWithCollisions(tank.frontVector.multiplyByFloats(-tank.speed, -tank.speed, -tank.speed));

        }    
        if(inputStates.left) {
            //tank.moveWithCollisions(new BABYLON.Vector3(-1*tank.speed, 0, 0));
            tank.rotation.y -= 0.02;
            tank.frontVector = new BABYLON.Vector3(Math.sin(tank.rotation.y), 0, Math.cos(tank.rotation.y));
        }    
        if(inputStates.right) {
            //tank.moveWithCollisions(new BABYLON.Vector3(1*tank.speed, 0, 0));
            tank.rotation.y += 0.02;
            tank.frontVector = new BABYLON.Vector3(Math.sin(tank.rotation.y), 0, Math.cos(tank.rotation.y));
        }

    }

    // to avoid firing too many cannonball rapidly
    tank.canFire = true;
    tank.fireAfter = 0.3; // in seconds

    tank.fire = function() {
        if(!inputStates.space) return;

        if(!this.canFire) return;

        // ok, we fire, let's put the above property to false
        this.canFire = false;

        
        // let's be able to fire again after a while
        setTimeout(() => {
            this.canFire = true;
        }, 1000 * this.fireAfter)

        // Create a canonball
        let cannonball = BABYLON.MeshBuilder.CreateSphere("cannonball", {diameter: 2, segments: 32}, scene);
        cannonball.material = new BABYLON.StandardMaterial("Fire", scene);
        cannonball.material.diffuseTexture = new BABYLON.Texture("images/Fire.jpg", scene)

        let pos = this.position;

        // position the cannonball above the tank
        cannonball.position = new BABYLON.Vector3(pos.x, pos.y+1, pos.z);

        // move cannonBall position from above the center of the tank to above a bit further than the frontVector end (5 meter s further)
        cannonball.position.addInPlace(this.frontVector.multiplyByFloats(5, 5, 5));

        // add physics to the cannonball, mass must be non null to see gravity apply
        cannonball.physicsImpostor = new BABYLON.PhysicsImpostor(cannonball,
            BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1 }, scene);    

        // the cannonball needs to be fired, so we need an impulse !
        // we apply it to the center of the sphere
        let powerOfFire = 100;
        let azimuth = 0.1;
        let aimForceVector = new BABYLON.Vector3(this.frontVector.x*powerOfFire, (this.frontVector.y+azimuth)*powerOfFire,this.frontVector.z*powerOfFire);
        
        cannonball.physicsImpostor.applyImpulse(aimForceVector,cannonball.getAbsolutePosition());

        // Make the cannonball disappear after 3s
        
        setTimeout(() => {
            cannonball.dispose();
        }, 3000);

    }
    return tank;
}

function createHeroDude(scene) {
   // load the Dude 3D animated model
    // name, folder, skeleton name 
    BABYLON.SceneLoader.ImportMesh("him", "models/Dude/", "Dude.babylon", scene,  (newMeshes, particleSystems, skeletons) => {
        let heroDude = newMeshes[0];
        heroDude.position = new BABYLON.Vector3(0, 0, 5);  // The original dude
        // make it smaller 
        //heroDude.speed = 0.1;

        // give it a name so that we can query the scene to get it by name
        heroDude.name = "heroDude";

        // there might be more than one skeleton in an imported animated model. Try console.log(skeletons.length)
        // here we've got only 1. 
        // animation parameters are skeleton, starting frame, ending frame,  a boolean that indicate if we're gonna 
        // loop the animation, speed, 
        let a = scene.beginAnimation(skeletons[0], 0, 120, true, 1);

        // params = id, speed, scaling, scene
        let hero = new Dude(heroDude, -1, 0.1, 0.2, scene);

        // make clones
        scene.dudes = [];
        for(let i = 0; i < 10; i++) {
            scene.dudes[i] = doClone(heroDude, skeletons, i);
            scene.beginAnimation(scene.dudes[i].skeleton, 0, 120, true, 1);

            // Create instance with move method etc.
            // params = speed, scaling, scene
            var temp = new Dude(scene.dudes[i], i, 0.3, 0.2, scene);
            // remember that the instances are attached to the meshes
            // and the meshes have a property "Dude" that IS the instance
            // see render loop then....
        }
         

    });
}


function doClone(originalMesh, skeletons, id) {
    let myClone;
    let xrand = Math.floor(Math.random()*500 - 250);
    let zrand = Math.floor(Math.random()*500 - 250);

    myClone = originalMesh.clone("clone_" + id);
    myClone.position = new BABYLON.Vector3(xrand, 0, zrand);

    if(!skeletons) return myClone;

    // The mesh has at least one skeleton
    if(!originalMesh.getChildren()) {
        myClone.skeleton = skeletons[0].clone("clone_" + id + "_skeleton");
        return myClone;
    } else {
        if(skeletons.length === 1) {
            // the skeleton controls/animates all children, like in the Dude model
            let clonedSkeleton = skeletons[0].clone("clone_" + id + "_skeleton");
            myClone.skeleton = clonedSkeleton;
            let nbChildren = myClone.getChildren().length;

            for(let i = 0; i < nbChildren;  i++) {
                myClone.getChildren()[i].skeleton = clonedSkeleton
            }
            return myClone;
        } else if(skeletons.length === originalMesh.getChildren().length) {
            // each child has its own skeleton
            for(let i = 0; i < myClone.getChildren().length;  i++) {
                myClone.getChildren()[i].skeleton = skeletons[i].clone("clone_" + id + "_skeleton_" + i);
            }
            return myClone;
        }
    }

    return myClone;
}

function moveHeroDude() {
    let heroDude = scene.getMeshByName("heroDude");
    if(heroDude)
        heroDude.Dude.move(scene);
}

function moveOtherDudes() {
    if(scene.dudes) {
        for(var i = 0 ; i < scene.dudes.length ; i++) {
            scene.dudes[i].Dude.move(scene);
        }
    }    
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

    // key listeners for the tank
    inputStates.left = false;
    inputStates.right = false;
    inputStates.up = false;
    inputStates.down = false;
    inputStates.space = false;
    
    //add the listener to the main, window object, and update the states
    window.addEventListener('keydown', (event) => {
        if ((event.key === "ArrowLeft") || (event.key === "q")|| (event.key === "Q")) {
           inputStates.left = true;
        } else if ((event.key === "ArrowUp") || (event.key === "z")|| (event.key === "Z")){
           inputStates.up = true;
        } else if ((event.key === "ArrowRight") || (event.key === "d")|| (event.key === "D")){
           inputStates.right = true;
        } else if ((event.key === "ArrowDown")|| (event.key === "s")|| (event.key === "S")) {
           inputStates.down = true;
        }  else if (event.key === " ") {
           inputStates.space = true;
        }
    }, false);

    //if the key will be released, change the states object 
    window.addEventListener('keyup', (event) => {
        if ((event.key === "ArrowLeft") || (event.key === "q")|| (event.key === "Q")) {
           inputStates.left = false;
        } else if ((event.key === "ArrowUp") || (event.key === "z")|| (event.key === "Z")){
           inputStates.up = false;
        } else if ((event.key === "ArrowRight") || (event.key === "d")|| (event.key === "D")){
           inputStates.right = false;
        } else if ((event.key === "ArrowDown")|| (event.key === "s")|| (event.key === "S")) {
           inputStates.down = false;
        }  else if (event.key === " ") {
           inputStates.space = false;
        }
    }, false);
}

