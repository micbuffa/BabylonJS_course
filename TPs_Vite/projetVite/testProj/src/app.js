import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import { Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, MeshBuilder, Texture, FreeCamera, FollowCamera, StandardMaterial, Color3 } from "@babylonjs/core";
class App {
    constructor() {
        let canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);
        let inputStates = {};
        let engine = new Engine(canvas, true);
        let scene = this.createScene(engine, canvas);
        this.modifySettings(engine, scene, canvas, inputStates);
        engine.runRenderLoop(() => {
            scene.render();
        });
    }
    createScene(engine, canvas) {
        let scene = new Scene(engine);
        let camera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
        camera.attachControl(canvas, true);
        let light1 = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
        let sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1 }, scene);
        let sphereMaterial = new StandardMaterial("sphereRed", scene);
        sphereMaterial.diffuseColor = new Color3(1, 0, 0);
        sphere.material = sphereMaterial;
        this.createGround(scene);
        let freeCamera = this.createFreeCamera(scene, canvas);
        return scene;
    }
    createFreeCamera(scene, canvas) {
        let camera = new FreeCamera("freeCamera", new Vector3(0, 50, 0), scene);
        camera.attachControl(canvas);
        camera.checkCollisions = true;
        camera.applyGravity = true;
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
        camera.radius = 40;
        camera.heightOffset = 14;
        camera.rotationOffset = 180;
        camera.cameraAcceleration = .1;
        camera.maxCameraSpeed = 5;
        return camera;
    }
    createGround(scene) {
        const groundOptions = { width: 2000, height: 2000, subdivisions: 20, minHeight: 0, maxHeight: 100, onReady: onGroundCreated };
        const ground = MeshBuilder.CreateGroundFromHeightMap("gdhm", 'images/hmap1.png', groundOptions, scene);
        function onGroundCreated() {
            const groundMaterial = new StandardMaterial("groundMaterial", scene);
            groundMaterial.diffuseTexture = new Texture("images/grass.jpg");
            ground.material = groundMaterial;
            ground.checkCollisions = true;
        }
        return ground;
    }
    modifySettings(engine, scene, canvas, inputStates) {
        scene.onPointerDown = () => {
            if (!scene.alreadyLocked) {
                console.log("requesting pointer lock");
                canvas.requestPointerLock();
            }
            else {
                console.log("Pointer already locked");
            }
        };
        window.addEventListener("resize", () => {
            console.log("resize");
            engine.resize();
        });
        window.addEventListener("keydown", (ev) => {
            if (ev.key === "I" || ev.key === "i") {
                if (scene.debugLayer.isVisible()) {
                    scene.debugLayer.hide();
                }
                else {
                    scene.debugLayer.show();
                }
            }
        });
        document.addEventListener("pointerlockchange", () => {
            let element = document.pointerLockElement || null;
            if (element) {
                scene.alreadyLocked = true;
            }
            else {
                scene.alreadyLocked = false;
            }
        });
        inputStates.left = false;
        inputStates.right = false;
        inputStates.up = false;
        inputStates.down = false;
        inputStates.space = false;
        window.addEventListener('keydown', (event) => {
            if ((event.key === "ArrowLeft") || (event.key === "q") || (event.key === "Q")) {
                inputStates.left = true;
            }
            else if ((event.key === "ArrowUp") || (event.key === "z") || (event.key === "Z")) {
                inputStates.up = true;
            }
            else if ((event.key === "ArrowRight") || (event.key === "d") || (event.key === "D")) {
                inputStates.right = true;
            }
            else if ((event.key === "ArrowDown") || (event.key === "s") || (event.key === "S")) {
                inputStates.down = true;
            }
            else if (event.key === " ") {
                inputStates.space = true;
            }
        }, false);
        window.addEventListener('keyup', (event) => {
            if ((event.key === "ArrowLeft") || (event.key === "q") || (event.key === "Q")) {
                inputStates.left = false;
            }
            else if ((event.key === "ArrowUp") || (event.key === "z") || (event.key === "Z")) {
                inputStates.up = false;
            }
            else if ((event.key === "ArrowRight") || (event.key === "d") || (event.key === "D")) {
                inputStates.right = false;
            }
            else if ((event.key === "ArrowDown") || (event.key === "s") || (event.key === "S")) {
                inputStates.down = false;
            }
            else if (event.key === " ") {
                inputStates.space = false;
            }
        }, false);
    }
}
new App();
