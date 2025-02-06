import { Mesh, MeshBuilder, PhysicsAggregate, PhysicsMotionType, PhysicsShapeType, Vector3 } from "@babylonjs/core";

export default class Dude {
    dudeMesh: Mesh;
    speed: number;
    // Capsule for physics engine
    transform: Mesh;
    capsuleAggregate: any;
    animation: any;
    
    constructor(dudeMesh, a, scene, speed) {
        this.dudeMesh = dudeMesh;
        this.animation = a;

        if(speed)
            this.speed = speed;
        else
            this.speed = 10;

        // in case, attach the instance to the mesh itself, in case we need to retrieve
        // it after a scene.getMeshByName that would return the Mesh
        // SEE IN RENDER LOOP !
        dudeMesh.Dude = this;

        // get Dude height
        // look at all dudeMesh children to compute the bounding box that contains all
        // dudeMesh children then, give the height of this bounding box
       // Loop through all children
         let children = dudeMesh.getChildren();
            let maxHeight = 0;
            let maxWidth = 0;
            for(let i = 0; i < children.length; i++) {
                let child = children[i];
                let childBBInfo = child.getBoundingInfo();
                let childHeight = childBBInfo.boundingBox.extendSize.y;
                let childWidth = childBBInfo.boundingBox.extendSize.z;
                if(childHeight > maxHeight) {
                    maxHeight = childHeight;
                }
                if(childWidth > maxWidth) {
                    maxWidth = childWidth;
                }
            }
        console.log("maxWidth = " + maxWidth);

        // create a capsule around the Dude, for the physics engine
        this.transform = MeshBuilder.CreateCapsule("dudeCapsule", {height: maxHeight/2, radius: maxWidth/2}, scene);
        this.transform.visibility = 0.2;
        this.transform.position = new Vector3(this.dudeMesh.position.x, this.dudeMesh.position.y+6, this.dudeMesh.position.z);

        this.capsuleAggregate = new PhysicsAggregate(this.transform, PhysicsShapeType.BOX, { mass: 0.1, restitution:0}, scene);
        this.capsuleAggregate.body.setMotionType(PhysicsMotionType.DYNAMIC);

        //On bloque les rotations avec cette méthode, à vérifier.
        this.capsuleAggregate.body.setMassProperties({
           inertia: new Vector3(0, 0, 0),
        });

        // We would like the capsule to react to shocks
        //this.capsuleAggregate.body.setLinearDamping(0.5);

        // If the capsuleAggregate is moved by the physics engine, the dudeCapsule mesh will follow
        // automatically (as we associated them in the PhysicsAggregate constructor)
        // Let's declare the dudeMesh as a child of the capsule, so that the dudeMesh will
        // follow the capsule
        this.dudeMesh.position = new Vector3(0, 0, 0);
        this.dudeMesh.parent = this.transform;
        this.dudeMesh.position.y = -maxHeight/4;
    }

    move(scene) {
                  // follow the tank
                  let tank = scene.getMeshByName("heroTank");
                  // let's compute the direction vector that goes from Dude to the tank
                  let direction = tank.position.subtract(this.transform.position);
                  let distance = direction.length(); // we take the vector that is not normalized, not the dir vector
                  //console.log(distance);
      
                  let dir = direction.normalize();

                  // lets move the dudeCapsule with the physics engine
                  // give a linear velocity
                    //this.capsuleAggregate.body.setLinearVelocity(dir.scale(10));
                  
                  // angle between Dude and tank, to set the new rotation.y of the Dude so that he will look towards the tank
                  // make a drawing in the X/Z plan to uderstand....
                  let alpha = Math.atan2(-dir.x, -dir.z);
                  this.dudeMesh.rotation.y = alpha;
      
                  // let make the Dude move towards the tank
                  if(distance > 30) {
                      this.animation.restart();   
                      //this.dudeMesh.moveWithCollisions(dir.multiplyByFloats(this.speed, this.speed, this.speed));
                      this.capsuleAggregate.body.setLinearVelocity(dir.scale(this.speed));
                      //this.dudeMesh.position.x = this.transform.position.x;
                      //this.dudeMesh.position.z = this.transform.position.z;
                    
                    }
                  else {
                    this.capsuleAggregate.body.setLinearVelocity(new Vector3(0, 0, 0));
                      this.animation.pause();
                  }   
                      
    }

    
}