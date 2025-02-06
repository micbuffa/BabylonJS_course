import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, Texture, FreeCamera, FollowCamera, StandardMaterial, Color3, HavokPlugin, PhysicsAggregate, PhysicsShapeType, PhysicsMotionType, PBRMaterial, SceneLoader } from "@babylonjs/core";

import Tank from "./tank";
import Dude from "./Dude"

import HavokPhysics from "@babylonjs/havok";

class App {
    engine: Engine;
    scene: Scene; v
    canvas: HTMLCanvasElement;
    inputStates: {};
    freeCamera: FreeCamera;
    tank: Tank;
    hero: Dude;
    followCamera: FollowCamera;
    // Physics engine
    havokInstance;
    dudes: Dude[];

    constructor() {
        // create the canvas html element and attach it to the webpage
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.id = "gameCanvas";
        document.body.appendChild(this.canvas);

        this.inputStates = {};

        // initialize babylon scene and engine
        this.engine = new Engine(this.canvas, true);
    }

    async start() {
        await this.initGame()
        this.gameLoop();
        this.endGame();
    }

    //async getInitializedHavok() {
    //return await HavokPhysics();
    //}

    private async getInitializedHavok() {
        // locates the wasm file copied during build process
        const havok = await HavokPhysics({
            locateFile: (file) => {
                return "assets/HavokPhysics.wasm"
            }
        });
        return havok;
    }

    async initGame() {
        this.havokInstance = await this.getInitializedHavok();

        this.scene = this.createScene();

        this.modifySettings(this.scene, this.inputStates);
    }

    endGame() {

    }

    gameLoop() {
        const divFps = document.getElementById("fps");

        // run the main render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();


            // MOVE ALL DUDES
            if (this.dudes) {
                for (let i = 0; i < this.dudes.length; i++) {
                    this.dudes[i].move(this.scene);
                }
            }

            this.tank.move(this.inputStates);
            this.tank.fire(this.inputStates, this.scene, this.dudes);

            divFps.innerHTML = this.engine.getFps().toFixed() + " fps";

        });
    }

    createScene() {
        let scene = new Scene(this.engine);

        // initialize the plugin using the HavokPlugin constructor
        const hk = new HavokPlugin(true, this.havokInstance);
        // enable physics in the scene with a gravity
        scene.enablePhysics(new Vector3(0, -9.81, 0), hk);

        let camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
        camera.attachControl(this.canvas, true);
        let light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        let sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
        // make the sphere red
        let sphereMaterial = new StandardMaterial("sphereRed", scene);
        sphereMaterial.diffuseColor = new Color3(1, 0, 0);
        sphere.material = sphereMaterial;

        this.createGround(scene);
        this.createTank(scene);

        this.createHeroDude(scene);

        // Use free camera for the moment
        //this.freeCamera = this.createFreeCamera(scene, this.canvas);
        //scene.activeCamera = this.freeCamera;

        this.followCamera = this.createFollowCamera(scene, this.tank.tankMesh);
        scene.activeCamera = this.followCamera;

        // Une box gérée par le moteur physique
        let boxDebug = MeshBuilder.CreateBox("boxDebug", { width: 5, depth: 5, height: 5 });
        boxDebug.position = new Vector3(10, 30, 5);

        // Create a box shape and the associated body. Size will be determined automatically.
        const boxAggregate = new PhysicsAggregate(boxDebug, PhysicsShapeType.BOX, { mass: .25, friction: 0.75, restitution: 0.3 }, scene);


        this.createBoxes(300, this.scene);
        // TRY TO CREATE MORE BOXES !!!!    

        return scene;
    }

    createBoxes(nb, scene) {

        // Create three materials for the boxes
        let materials = [];
        let mat1 = new PBRMaterial("mat1", scene);
        mat1.albedoColor = new Color3(0.8, 0.5, 0.5);
        mat1.roughness = 0.4;
        mat1.metallic = 1;
        materials.push(mat1);


        let mat2 = new PBRMaterial("mat2", scene);
        mat2.albedoColor = new Color3(0.5, 0.8, 0.5);
        mat2.roughness = 0.4;
        mat2.metallic = 1;
        materials.push(mat2);

        let mat3 = new PBRMaterial("mat3", scene);
        mat3.albedoColor = new Color3(0.5, 0.5, 0.8);
        mat3.roughness = 0.4;
        mat3.metallic = 1;
        materials.push(mat3);

        for (let i = 0; i < nb; i++) {
            let typeOfMesh = Math.floor(Math.random() * 5);
            let indexMaterial = Math.floor(Math.random() * 3);

            switch (typeOfMesh) {
                case 0:
                    // BOX
                    // create w, h, d with integer random values between 1 and 5
                    const w = Math.floor(Math.random() * 5) + 1;
                    const h = Math.floor(Math.random() * 5) + 1;
                    const d = Math.floor(Math.random() * 5) + 1;

                    let box = MeshBuilder.CreateBox("box" + i, { width: w, depth: d, height: h }, this.scene);
                    box.material = materials[indexMaterial];
                    box.position = new Vector3(10, 30, 5);
                    //box.checkCollisions = true;
                    // Create a static box shape.
                    const boxAggregate = new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: .25, friction: 0.75, restitution: 0.3 }, scene);
                    break;
                case 1:
                    // sphere
                    // create diameter with integer random values between 1 and 5
                    const diameter = Math.floor(Math.random() * 5) + 1;
                    let sphere = MeshBuilder.CreateSphere("sphere" + i, { diameter: diameter }, this.scene);
                    sphere.material = materials[indexMaterial];
                    sphere.position = new Vector3(10, 30, 5);
                    // Create a static sphere shape.
                    const sphereAggregate = new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, { mass: .25, friction: 0.75, restitution: 0.3 }, scene);
                    break;
                case 2:
                    // cylinder
                    // create diameter with integer random values between 1 and 5
                    const diam = Math.floor(Math.random() * 5) + 1;
                    // height is 2 times the diameter
                    const height = diam * 2;
                    let cylinder = MeshBuilder.CreateCylinder("cylinder" + i, { diameter: diam, height: height }, this.scene);
                    cylinder.material = materials[indexMaterial];
                    cylinder.position = new Vector3(10, 30, 5);
                    // Create a static cylinder shape.
                    const cylinderAggregate = new PhysicsAggregate(cylinder, PhysicsShapeType.CYLINDER, { mass: .25, friction: 0.75, restitution: 0.3 }, scene);
                    break;
                case 3:
                    // torus
                    // create diameter with integer random values between 1 and 5
                    const diam1 = Math.floor(Math.random() * 5) + 1;
                    // thickness is 1/2 the diameter
                    const thickness = diam1 / 2;
                    let torus = MeshBuilder.CreateTorus("torus" + i, { diameter: diam1, thickness: thickness }, this.scene);
                    torus.material = materials[indexMaterial];
                    torus.position = new Vector3(10, 30, 5);
                    // Create a static torus shape.
                    const torusAggregate = new PhysicsAggregate(torus, PhysicsShapeType.CONVEX_HULL, { mass: .25, friction: 0.75, restitution: 0.3 }, scene);
                    break;
                case 4:
                    // Create GOLDBERG
                    // create diameter with integer random values between 1 and 5
                    const diam2 = Math.floor(Math.random() * 5) + 1;

                    let goldberg = MeshBuilder.CreateGoldberg("goldberg" + i, { size: diam2 }, this.scene);
                    goldberg.material = materials[indexMaterial];
                    goldberg.position = new Vector3(10, 30, 5);
                    // Create an aggregate
                    const goldbergAggregate = new PhysicsAggregate(goldberg, PhysicsShapeType.CONVEX_HULL, { mass: .25, friction: 0.75, restitution: 0.3 }, scene);
                    break;
            }

        }
    }

    createTank(scene) {
        this.tank = new Tank(scene);
    }

    createHeroDude(scene) {
        // load the Dude 3D animated model
        // name, folder, skeleton name 
        SceneLoader.ImportMesh("him", "models/Dude/", "Dude.babylon", scene, (newMeshes, particleSystems, skeletons) => {
            let heroDude = newMeshes[0];
            heroDude.position = new Vector3(0, 0, 5);  // The original dude
            // make it smaller 
            heroDude.scaling = new Vector3(0.2, 0.2, 0.2);
            //heroDude.speed = 0.1;

            // give it a name so that we can query the scene to get it by name
            heroDude.name = "heroDude";

            let dudeSpeed = 10;
            let animationSpeed = dudeSpeed / 10;
            // there might be more than one skeleton in an imported animated model. Try console.log(skeletons.length)
            // here we've got only 1. 
            // animation parameters are skeleton, starting frame, ending frame,  a boolean that indicate if we're gonna 
            // loop the animation, speed, 
            let a = scene.beginAnimation(skeletons[0], 0, 120, true, animationSpeed);

            this.hero = new Dude(heroDude, a, scene, 20);

            // Make clones
            // make clones
            this.dudes = [];
            this.dudes.push(this.hero);
            for (let i = 0; i < 10; i++) {
                let dudeMeshClone = this.doClone(heroDude, skeletons, i);
                a = scene.beginAnimation(dudeMeshClone.skeleton, 0, 120, true, animationSpeed);

                // Create instance with move method etc.
                 this.dudes.push(new Dude(dudeMeshClone, a, scene, dudeSpeed));
                // remember that the instances are attached to the meshes
                // and the meshes have a property "Dude" that IS the instance
                // see render loop then....
            }

        });
    }

     doClone(originalMesh, skeletons, id) {
        let myClone;
        let xrand = Math.floor(Math.random()*500 - 250);
        let zrand = Math.floor(Math.random()*500 - 250);
    
        myClone = originalMesh.clone("clone_" + id);
        myClone.position = new Vector3(xrand, 0, zrand);
    
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


    createFreeCamera(scene, canvas) {
        let camera = new FreeCamera("freeCamera", new Vector3(0, 50, 0), scene);
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

    createFollowCamera(scene, target) {
        let camera = new FollowCamera("tankFollowCamera", target.position, scene, target);

        camera.radius = 40; // how far from the object to follow
        camera.heightOffset = 14; // how high above the object to place the camera
        camera.rotationOffset = 180; // the viewing angle
        camera.cameraAcceleration = .1; // how fast to move
        camera.maxCameraSpeed = 5; // speed limit

        return camera;
    }

    createGround(scene) {
        const groundOptions = { width: 2000, height: 2000, subdivisions: 20, minHeight: 0, maxHeight: 100, onReady: onGroundCreated };
        //scene is optional and defaults to the current scene
        const ground = MeshBuilder.CreateGroundFromHeightMap("gdhm", 'images/hmap1.png', groundOptions, scene);

        function onGroundCreated() {
            const groundMaterial = new StandardMaterial("groundMaterial", scene);
            groundMaterial.diffuseTexture = new Texture("images/grass.jpg");
            ground.material = groundMaterial;
            // to be taken into account by collision detection
            ground.checkCollisions = true;
            //groundMaterial.wireframe=true;

            // Create a static box shape.
            const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.MESH, { mass: 0, friction: 0.7, restitution: 0.2 }, scene);
            groundAggregate.body.setMotionType(PhysicsMotionType.STATIC);

        }
        return ground;
    }

    modifySettings(scene, inputStates) {
        // as soon as we click on the game window, the mouse pointer is "locked"
        // you will have to press ESC to unlock it
        this.scene.onPointerDown = () => {
            if (!scene.alreadyLocked) {
                console.log("requesting pointer lock");
                this.canvas.requestPointerLock();
            } else {
                console.log("Pointer already locked");
            }
        }

        window.addEventListener("resize", () => {
            console.log("resize");
            this.engine.resize()
        });

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.key === "I" || ev.key === "i") {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                } else {
                    scene.debugLayer.show();
                }
            }
        });

        document.addEventListener("pointerlockchange", () => {
            let element = document.pointerLockElement || null;
            if (element) {
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
            if ((event.key === "ArrowLeft") || (event.key === "q") || (event.key === "Q")) {
                inputStates.left = true;
            } else if ((event.key === "ArrowUp") || (event.key === "z") || (event.key === "Z")) {
                inputStates.up = true;
            } else if ((event.key === "ArrowRight") || (event.key === "d") || (event.key === "D")) {
                inputStates.right = true;
            } else if ((event.key === "ArrowDown") || (event.key === "s") || (event.key === "S")) {
                inputStates.down = true;
            } else if (event.key === " ") {
                inputStates.space = true;
            } else if (event.key === "f") {
                inputStates.keyF = true;
            }
        }, false);

        //if the key will be released, change the states object 
        window.addEventListener('keyup', (event) => {
            if ((event.key === "ArrowLeft") || (event.key === "q") || (event.key === "Q")) {
                inputStates.left = false;
            } else if ((event.key === "ArrowUp") || (event.key === "z") || (event.key === "Z")) {
                inputStates.up = false;
            } else if ((event.key === "ArrowRight") || (event.key === "d") || (event.key === "D")) {
                inputStates.right = false;
            } else if ((event.key === "ArrowDown") || (event.key === "s") || (event.key === "S")) {
                inputStates.down = false;
            } else if (event.key === " ") {
                inputStates.space = false;
            } else if (event.key === "f") {
                inputStates.keyF = false;
            }

        }, false);
    }
}


const gameEngine = new App();
gameEngine.start();

