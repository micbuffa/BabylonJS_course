import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, Texture, FreeCamera, FollowCamera, StandardMaterial, Color3, HavokPlugin, PhysicsAggregate, PhysicsShapeType, PhysicsMotionType } from "@babylonjs/core";



import Tank from "./tank";
import HavokPhysics from "@babylonjs/havok";

class App {
    engine: Engine;
    scene: Scene;v
    canvas: HTMLCanvasElement;
    inputStates: {};
    freeCamera: FreeCamera;
    tank: Tank;
    followCamera: FollowCamera;
    // Physics engine
    havokInstance;

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

        this.tank.move(this.inputStates);

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

        // Use free camera for the moment
        //this.freeCamera = this.createFreeCamera(scene, this.canvas);
        //scene.activeCamera = this.freeCamera;

        this.followCamera = this.createFollowCamera(scene, this.tank.tankMesh);
        scene.activeCamera = this.followCamera;

        // Une box gérée par le moteur physique
        let boxDebug = MeshBuilder.CreateBox("boxDebug", { width: 5, depth:5, height: 5 });
        boxDebug.position = new Vector3(10, 30, 5);
        
        // Create a sphboxere shape and the associated body. Size will be determined automatically.
        const boxAggregate = new PhysicsAggregate(boxDebug, PhysicsShapeType.BOX, { mass: .25, friction: 0.05, restitution: 0.3 }, scene);


        // TRY TO CREATE MORE BOXES !!!!    

        return scene;
    }

    
    createTank(scene) {
        this.tank = new Tank(scene);
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
            }
        }, false);
    }
}


const gameEngine = new App();
gameEngine.start();

