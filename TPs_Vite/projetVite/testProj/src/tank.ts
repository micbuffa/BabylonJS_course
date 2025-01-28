import { Color3, Mesh, MeshBuilder, PhysicsAggregate, PhysicsShapeType, Quaternion, StandardMaterial, Vector3 } from "@babylonjs/core";
let TANK_SPEED = 30;
let TANK_ROTATION_SPEED = 1;
let JUMP_IMPULSE = 1;

export default class Tank {
    tankMesh: Mesh;
    speed: number;
    frontVector: Vector3;
    boxAggregate:BoxAggregate;
    speedX = 0;
    speedZ = 0;

    constructor(scene) {
        this.tankMesh = MeshBuilder.CreateBox("heroTank", {height:1, depth:6, width:6}, scene);
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
        this.boxAggregate = new PhysicsAggregate( this.tankMesh, PhysicsShapeType.BOX, { mass: 0.75, friction: 0.15, restitution: 0.3 }, scene);
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
        /*
        this.speedX = 0;
        this.speedZ = 0;

        console.log("Input states : " + inputStates.up + " " + inputStates.down + " " + inputStates.left + " " + inputStates.right);
        
        if (this.tankMesh.position.y > 2) {
        }

        if(inputStates.up) {
            this.speedZ = TANK_SPEED;
        } else if(inputStates.down) {
            this.speedZ = -TANK_SPEED;
        } else {
            this.speedZ = 0;
        } 

        if(inputStates.left) {
            this.speedX = -TANK_SPEED;
        } else if(inputStates.right) {
            this.speedX = +TANK_SPEED;         
        } else {
            this.speedX = 0;
        }

        if(inputStates.space) {
            this.boxAggregate.body.applyImpulse(new Vector3(0, JUMP_IMPULSE, 0), Vector3.Zero());
        }
        const speedVector = new Vector3(this.speedX, 0, this.speedZ);
        //speedVector.normalize();
        // change its magnitude to TANK_SPEED
        //speedVector.scaleInPlace(0.6);

        this.boxAggregate.body.applyForce(speedVector, Vector3.Zero());
        // get angle
        let angle = Math.atan2(speedVector.x, speedVector.z);
        // compute angular velocity 
        let angularVelocity = new Vector3(0, angle, 0);
        this.boxAggregate.body.setAngularVelocity(angularVelocity);

      
        // oarientate the mesh
        this.tankMesh.lookAt(speedVector.normalize());

        */
        

        
                //tank.position.z += -1; // speed should be in unit/s, and depends on
                                 // deltaTime !

        // if we want to move while taking into account collision detections
        // collision uses by default "ellipsoids"

        
        let yMovement = 0;
        let zMovement = 0;
       
        if (this.tankMesh.position.y > 2) {
            zMovement = 0;
            yMovement = -2;
        } 

        const body = this.boxAggregate.body;

        if(inputStates.up) {
            const forwardVector = this.tankMesh.forward.scale(TANK_SPEED);
            body.applyForce(forwardVector, this.tankMesh.getAbsolutePosition());
        }    
        if(inputStates.down) {
            //tank.moveWithCollisions(new BABYLON.Vector3(0, 0, -1*tank.speed));
            const backwardVector = this.tankMesh.forward.scale(-TANK_SPEED);
            body.applyForce(backwardVector, this.tankMesh.getAbsolutePosition());
        }    
        if(inputStates.left) {
            //tank.moveWithCollisions(new BABYLON.Vector3(-1*tank.speed, 0, 0));
           body.setAngularVelocity(new Vector3(0, -TANK_ROTATION_SPEED, 0)); 
        }    
        if(inputStates.right) {
            //tank.moveWithCollisions(new BABYLON.Vector3(1*tank.speed, 0, 0));
            body.setAngularVelocity(new Vector3(0, TANK_ROTATION_SPEED, 0)); 
        }
        if(inputStates.space) {
            this.boxAggregate.body.applyImpulse(new Vector3(0, JUMP_IMPULSE, 0), Vector3.Zero());
        }

        // change magnitude of front-vector to TANK_SPEED
        //this.frontVector.scaleInPlace(10);
        //let speedVector = new Vector3(0, 0, 2 )
        //this.boxAggregate.body.setLinearVelocity(speedVector);

    
    }
       
}