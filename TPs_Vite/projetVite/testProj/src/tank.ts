import { ActionManager, Color3, ExecuteCodeAction, Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Quaternion, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
let TANK_SPEED = 30;
let TANK_ROTATION_SPEED = 1;
let JUMP_IMPULSE = 1;

export default class Tank {
    tankMesh: Mesh;
    speed: number;
    frontVector: Vector3;
    boxAggregate: PhysicsAggregate;
    speedX = 0;
    speedZ = 0;
    // for firing cannonballs
    canFire: boolean = true;
    fireAfter: number = 0.3;

    constructor(scene) {
        this.tankMesh = MeshBuilder.CreateBox("heroTank", { height: 1, depth: 6, width: 6 }, scene);
        let tankMaterial = new StandardMaterial("tankMaterial", scene);
        tankMaterial.diffuseColor = new Color3(1, 0, 0);
        tankMaterial.emissiveColor = new Color3(0, 0, 1);
        this.tankMesh.material = tankMaterial;

        // By default the box/tank is in 0, 0, 0, let's change that...
        this.tankMesh.position.y = 0.6;
        this.speed = 10;
        this.frontVector = new Vector3(0, 0, 1);

        // a way to add a property to a given mesh, that is not in the Model
        (this.tankMesh as any).Tank = this;

        // PHYSICS
        this.boxAggregate = new PhysicsAggregate(this.tankMesh, PhysicsShapeType.BOX, { mass: 0.75, friction: 0.75, restitution: 0.3 }, scene);
        this.boxAggregate.body.setMassProperties({
            inertia: new Vector3(0, 0, 0),
            centerOfMass: new Vector3(0, 1 / 2, 0),
            mass: 1,
            inertiaOrientation: new Quaternion(0, 0, 0, 1)
        });
        this.boxAggregate.body.setLinearDamping(0.8);
        this.boxAggregate.body.setAngularDamping(10.0);
    }

    move(inputStates) {

        const body = this.boxAggregate.body;

        if (inputStates.up) {
            const forwardVector = this.tankMesh.forward.scale(TANK_SPEED);
            body.applyForce(forwardVector, this.tankMesh.getAbsolutePosition());
        }
        if (inputStates.down) {
            //tank.moveWithCollisions(new BABYLON.Vector3(0, 0, -1*tank.speed));
            const backwardVector = this.tankMesh.forward.scale(-TANK_SPEED);
            body.applyForce(backwardVector, this.tankMesh.getAbsolutePosition());
        }
        if (inputStates.left) {
            //tank.moveWithCollisions(new BABYLON.Vector3(-1*tank.speed, 0, 0));
            body.setAngularVelocity(new Vector3(0, -TANK_ROTATION_SPEED, 0));
        }
        if (inputStates.right) {
            //tank.moveWithCollisions(new BABYLON.Vector3(1*tank.speed, 0, 0));
            body.setAngularVelocity(new Vector3(0, TANK_ROTATION_SPEED, 0));
        }
        if (inputStates.space) {
            this.boxAggregate.body.applyImpulse(new Vector3(0, JUMP_IMPULSE, 0), Vector3.Zero());
        }

        // adjust the front vector depending on the new orientation of the tank mesh
        this.frontVector = new Vector3(0, 0, 1);
        let mat = this.tankMesh.getWorldMatrix();
        this.frontVector = Vector3.TransformNormal(this.frontVector, mat);

    }

    fire(inputStates, scene, dudes) {
        if (!inputStates.keyF) return;

        if (!this.canFire) return;

        // ok, we fire, let's put the above property to false
        this.canFire = false;

        // let's be able to fire again after a while
        setTimeout(() => {
            this.canFire = true;
        }, 1000 * this.fireAfter)

        // Create a canonball
        let cannonball = MeshBuilder.CreateSphere("cannonball", { diameter: 2, segments: 32 }, scene);
        cannonball.material = new StandardMaterial("Fire", scene);
        (cannonball.material as StandardMaterial).diffuseTexture = new Texture("images/Fire.jpg", scene)

        let pos = this.tankMesh.position;

        // position the cannonball above the tank
        cannonball.position = new Vector3(pos.x, pos.y + 1, pos.z);

        // move cannonBall position from above the center of the tank to above a bit further than the frontVector end (5 meter s further)
        cannonball.position.addInPlace(this.frontVector.multiplyByFloats(5, 5, 5));

        // create an aggregate for the cannonball
        let cannonballAggregate = new PhysicsAggregate(cannonball, PhysicsShapeType.SPHERE, { mass: 1, restitution: 0.9 }, scene);

        // the cannonball needs to be fired, so we need an impulse !
        // we apply it to the center of the sphere
        let powerOfFire = 100;
        let azimuth = 0.1;
        let aimForceVector = new Vector3(this.frontVector.x * powerOfFire, (this.frontVector.y + azimuth) * powerOfFire, this.frontVector.z * powerOfFire);

        // apply the impulse
        cannonballAggregate.body.applyImpulse(aimForceVector, cannonball.getAbsolutePosition());

        cannonball.actionManager = new ActionManager(scene);

        // register an action for when the cannonball intesects a dude, so we need to iterate on each dude
        // iterate on each dude using a for loop from end of array to 0
        /*
        for (let i = dudes.length - 1; i >= 0; i--) {
            let dude = dudes[i];

            cannonball.actionManager.registerAction(new ExecuteCodeAction(
                {
                    trigger: ActionManager.OnIntersectionEnterTrigger,
                    parameter: dude.transform
                },
                // dude is the mesh, Dude is the instance if Dude class that has a bbox as a property named bounder                             // see Dude class, line 16 ! dudeMesh.Dude = this;
                () => {
                    console.log("HIT dude number ! " + i + " length = " + dudes.length);
                    dude.transform.dispose();
                    dude.dudeMesh.dispose();
                    dudes.splice(dudes.indexOf(dude), 1);
                    //cannonball.dispose(); // don't work properly why ? Need for a closure ?
                    // see http://mainline.i3s.unice.fr/JavaScriptSlides/1Bases.html#85
                }
            ));
        };
        */

        //copy the dudes array
        let dudesCopy = [...dudes];


         dudes.forEach((dude, index) => {
             
             cannonball.actionManager.registerAction(new ExecuteCodeAction(
                 {
                     trigger : ActionManager.OnIntersectionEnterTrigger,
                     parameter : dude.transform
                 }, 
                 // dude.dudeMesh is the mesh, transform is the instance of the capsule mesh
                 () => {
                     console.log("HIT dude number ! " + index + " length = " + dudes.length);

                     dude.transform.dispose();
                     dude.dudeMesh.dispose();
                     dudes.splice(dudes.indexOf(dude), 1);

                     //cannonball.dispose(); // don't work properly why ? Need for a closure ?
                     // see http://mainline.i3s.unice.fr/JavaScriptSlides/1Bases.html#85
                 }
             ));
         });
         

        // Make the cannonball disappear after 3s
        setTimeout(() => {
            cannonball.dispose();
        }, 3000);

    }

}