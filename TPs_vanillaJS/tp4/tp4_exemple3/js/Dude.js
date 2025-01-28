export default class Dude {
  constructor(dudeMesh, id, speed, scaling, scene) {
    this.dudeMesh = dudeMesh;
    this.id = id;
    this.scene = scene;
    this.scaling = scaling;
    this.health = 3; // three shots to kill the dude !
    this.frontVector = new BABYLON.Vector3(0, 0, -1); // at start dude is facing camera looking to -Z

    if (speed) this.speed = speed;
    else this.speed = 1;

    // in case, attach the instance to the mesh itself, in case we need to retrieve
    // it after a scene.getMeshByName that would return the Mesh
    // SEE IN RENDER LOOP !
    dudeMesh.Dude = this;

    // scaling
    this.dudeMesh.scaling = new BABYLON.Vector3(0.2, 0.2, 0.2);

    // FOR COLLISIONS, let's associate a BoundingBox to the Dude

    // singleton, static property, computed only for the first dude we constructed
    // for others, we will reuse this property.
    if (Dude.boundingBoxParameters == undefined) {
      Dude.boundingBoxParameters = this.calculateBoundingBoxParameters();
    }

    this.bounder = this.createBoundingBox();
    this.bounder.dudeMesh = this.dudeMesh;

    // Particle system for the Dude, to show when he is hit by cannonball or laser

    // singleton, static property, computed only for the first dude we constructed
    // for others, we will reuse this property.
    if (Dude.particleSystem == undefined) {
      Dude.particleSystem = this.createParticleSystem();
      this.setParticleSystemDefaultValues();
    }
  }

  followTank(scene) {
    // as move can be called even before the bbox is ready.
    if (!this.bounder) return;

    // let's put the dude at the BBox position. in the rest of this
    // method, we will not move the dude but the BBox instead
    this.dudeMesh.position = new BABYLON.Vector3(
      this.bounder.position.x,
      this.bounder.position.y,
      this.bounder.position.z
    );

    // adjust y position dependingOn Ground height
    this.followGround();

    // follow the tank
    let tank = scene.getMeshByName("heroTank");
    // let's compute the direction vector that goes from Dude to the tank
    let direction = tank.position.subtract(this.dudeMesh.position);
    let distance = direction.length(); // we take the vector that is not normalized, not the dir vector
    //console.log(distance);

    let dir = direction.normalize();
    // angle between Dude and tank, to set the new rotation.y of the Dude so that he will look towards the tank
    // make a drawing in the X/Z plan to uderstand....
    let alpha = Math.atan2(-dir.x, -dir.z);
    // If I uncomment this, there are collisions. This is strange ?
    //this.bounder.rotation.y = alpha;

    this.dudeMesh.rotation.y = alpha;

    // let make the Dude move towards the tank
    // first let's move the bounding box mesh
    if (distance > 30) {
      //a.restart();
      // Move the bounding box instead of the dude....
      this.bounder.moveWithCollisions(
        dir.multiplyByFloats(this.speed, this.speed, this.speed)
      );
    } else {
      //a.pause();
    }
  }

  moveFPS(scene) {
    // just called with the original dude....

    // if no bounding box return;
    if (!this.bounder) return;

    // if active camera is not on dude, it cannot be controlled...
    if ((scene.activeCamera !== scene.followCameraDude) && (scene.activeCamera !== scene.freeCameraDude)) {
      // if active camera is not following the dude, this latter is immobile.
      // let's pause his animation...
      //this.dudeMesh.animation.pause();
      return;
    }

    // active camera is on the dude. restart animation if he's moving forward or backward
    if (scene.inputStates.up || scene.inputStates.down) {
      this.dudeMesh.animation.restart();
    } else {
      this.dudeMesh.animation.pause();
    }

    // Movements using arrows or zqsd...
    // TODO : We can certainly separate the two following cases in two methods
    // or at least factorize the code....
    // many similar operations are executed in follow camera and free camera mode 
    // such as : adjust XY pos, compute ground height, compute height of bounding box etc.
    if (scene.activeCamera === scene.followCameraDude) {
      // like with followTank(), dude takes bounding box position, as we choosed to move the bbox
      this.dudeMesh.position.x = this.bounder.position.x;
      this.dudeMesh.position.z = this.bounder.position.z;

      // adjust y position dependingOn Ground height
      let groundHeight = this.followGround();

      var direction = this.frontVector;
      var dir = direction.normalize();
      var alpha = Math.atan2(-1 * dir.x, -1 * dir.z);
      this.dudeMesh.rotation.y = alpha;

      if (scene.inputStates.up) {
        this.bounder.moveWithCollisions(
          this.frontVector.multiplyByFloats(this.speed, this.speed, this.speed)
        );
      }

      if (scene.inputStates.down) {
        this.bounder.moveWithCollisions(
          this.frontVector.multiplyByFloats(-this.speed, -this.speed, -this.speed)
        );
      }

      if (scene.inputStates.left) {
        var alpha = this.dudeMesh.rotation.y;
        alpha -= 0.02;
        this.frontVector = new BABYLON.Vector3(-Math.sin(alpha), 0, -Math.cos(alpha));
      }
      if (scene.inputStates.right) {
        var alpha = this.dudeMesh.rotation.y;
        alpha += 0.02;
        this.frontVector = new BABYLON.Vector3(-Math.sin(alpha), 0, -Math.cos(alpha));
      }

      // Ok, we're moving the Dude, so let's move also the free camera on its head
      scene.freeCameraDude.position.x = this.bounder.position.x;
      scene.freeCameraDude.position.z = this.bounder.position.z;
      let bboxHeight = this.getBoundingBoxHeightScaled();
      scene.freeCameraDude.position.y = groundHeight + bboxHeight + 0.2;
      // change also the target where the free camera is looking at
      let targetPoint = new BABYLON.Vector3(this.frontVector.x, this.frontVector.y, this.frontVector.z);
      scene.freeCameraDude.setTarget(scene.freeCameraDude.position.add(targetPoint));
      
    } else if(scene.activeCamera === scene.freeCameraDude) {
       // like with followTank(), dude takes bounding box position, as we choosed to move the bbox
       this.dudeMesh.position.x = this.bounder.position.x;
       this.dudeMesh.position.z = this.bounder.position.z;

       // IN THIS MODE, ZQSD moves the camera and the mouse change its orientation
       // WE ARE GOING TO MOVE THE BOUNDER, and rotate the Dude, by
       // copying the cam position and orientation to bounder + rotate dude

      // adjust y position depending on ground height
      let groundHeight = this.followGround();

      // set the cam position on top of the bounding box + 0.2, also add ground height
      let bboxHeight = this.getBoundingBoxHeightScaled();
      scene.freeCameraDude.position.y = groundHeight + bboxHeight + 0.2;

      // where is the camera looking at ?
      // we need the front vector for computing th dude rotation y angle

      // 1 - let's compute the vector going from camera position to camera target
      let cameraFront = scene.freeCameraDude.getTarget().subtract(scene.freeCameraDude.position);
      cameraFront.normalize();
      this.frontVector = cameraFront;

      // 2 - compute alpha, same as follow camera
      let dir = this.frontVector;
      var alpha = Math.atan2(-1 * dir.x, -1 * dir.z);
      this.dudeMesh.rotation.y = alpha;

      // move the bounding box to the camera pos (remember : the camera is the moving object here!)
      this.bounder.position.x = scene.freeCameraDude.position.x;
      this.bounder.position.z = scene.freeCameraDude.position.z;

      // Also position the followCameraDude ? This would avoid making it 
      // "fly to the new Dude pos" if he has been moved using the freeCamera.
      scene.followCameraDude.x = scene.freeCameraDude.position.x;
      scene.followCameraDude.z = scene.freeCameraDude.position.z;
    }
  }

  followGround() {
    // adjusts y position depending on ground height...

    // create a ray that starts above the dude, and goes down vertically
    let origin = new BABYLON.Vector3(this.dudeMesh.position.x, 1000, this.dudeMesh.position.z);
    let direction = new BABYLON.Vector3(0, -1, 0);
    let ray = new BABYLON.Ray(origin, direction, 10000);

    // compute intersection point with the ground
    let pickInfo = this.scene.pickWithRay(ray, (mesh) => { return (mesh.name === "gdhm"); });

    let groundHeight = pickInfo.pickedPoint.y;
    this.dudeMesh.position.y = groundHeight;

    /*
    let bbInfo = Dude.boundingBoxParameters;

    let max = bbInfo.boundingBox.maximum;
    let min = bbInfo.boundingBox.minimum;

    // Not perfect, but kinda of works...
    // Looks like collisions are computed on a box that has half the size... ?
    //bounder.scaling.y = (max._y - min._y) * this.scaling * 2;

    let lengthY = (max._y - min._y);

   this.bounder.position.y = groundHeight + (max._y - min._y) * this.scaling/2
   */
    let bboxHeightScaled = this.getBoundingBoxHeightScaled();
    this.bounder.position.y = groundHeight + bboxHeightScaled / 2;
    return groundHeight;
  }

  fireGun() {
    // play the sound
    this.scene.assets.gunSound.play();

    // the crosshair is always at the center of the screen with the "FPS view"
    // we set with the FreeCameraDude
    // let's check which mesh is intersected by a ray the passes perpendicularly
    // through the crosshair at center of the screen

    // 1 - get the location of the screen center
    let width = this.scene.getEngine().getRenderWidth();
    let height = this.scene.getEngine().getRenderHeight();
    let pickInfos = this.scene.multiPick(width/2, height/2);

    // 2 - find the closest hit mesh that is not yourself
    for(let i=0; i < pickInfos.length; i++) {
      // with pickInfo we can get the closest mesh or even the impact 3D point located "behind"
      // the crosshair. Let's see how we used pickInfo with the tank laser, the code should be
      // similar here....
      let mesh = pickInfos[i].pickedMesh;
      let impactPoint = pickInfos[i].pickedPoint;

      // we dont't want a collision with our own bounding box (bounder-1)
      if ((mesh.name.startsWith("bounder") && mesh.name !== "bounder-1")) {
        console.log(mesh.name)
        // we hit a dude
        let bounder = mesh;
        let dude = bounder.dudeMesh.Dude;
        // let's decrease the dude health, pass him the hit point
        dude.decreaseHealth(impactPoint);
        break; // we don't want to test other collisions...
      } else if (mesh.name.startsWith("heroTank")) {
        console.log("We hit the tank !");
        break;
      }
    }
   
  }

  getBoundingBoxHeightScaled() {
    let bbInfo = Dude.boundingBoxParameters;

    let max = bbInfo.boundingBox.maximum;
    let min = bbInfo.boundingBox.minimum;

    let lengthY = (max._y - min._y) * this.scaling;
    return lengthY;
  }

  decreaseHealth(hitPoint) {
    // locate particle system at hit point
    Dude.particleSystem.emitter = hitPoint;
    // start particle system
    Dude.particleSystem.start();

    // make it stop after 300ms
    setTimeout(() => {
      Dude.particleSystem.stop();
    }, 300);

    this.health--;

    if (this.health <= 0) {
      this.gotKilled();
    }
  }

  gotKilled() {
    // Make some sounds !
    this.scene.assets.dieSound.setPosition(this.bounder.position);
    this.scene.assets.dieSound.setPlaybackRate(0.8 + (Math.random() - 0.8));
    this.scene.assets.dieSound.play();

    this.scene.assets.explosion.setPosition(this.bounder.position);
    this.scene.assets.explosion.play();

    // 1st possibility, just change some parameters of the particleSystem for this big explosion !
    //console.log(this.bounder);
    /*
    this.setParticleSystemToFinalExplosion();

  

    Dude.particleSystem.start();
    setTimeout(() => {
      Dude.particleSystem.stop();
      this.createParticleSystem()
      this.setParticleSystemDefaultValues(); // reset to original values
    }, 300);
*/
    // 2nd possibility : use the particuleHelper
    //BABYLON.ParticleHelper.BaseAssetsUrl = "particles";

    // Need to add the textures to an explosion folder at root of the project.
    // take assets from https://github.com/BabylonJS/Assets


    BABYLON.ParticleHelper.CreateAsync("explosion", this.scene).then((set) => {
      set.systems.forEach((s) => {
        s.emitter = this.bounder.position; // bug in ParticleHelper : y pos taken into account only by parts of the particles systems. ?
        console.log(s.emitter)

        s.disposeOnStop = true;
      });
      set.start();
    });

    this.dudeMesh.dispose();
    this.bounder.dispose();
  }

  calculateBoundingBoxParameters() {
    // Compute BoundingBoxInfo for the Dude, for this we visit all children meshes
    let childrenMeshes = this.dudeMesh.getChildren();
    let bbInfo = this.totalBoundingInfo(childrenMeshes);

    return bbInfo;
  }

  // Taken from BabylonJS Playground example : https://www.babylonjs-playground.com/#QVIDL9#1
  totalBoundingInfo(meshes) {
    var boundingInfo = meshes[0].getBoundingInfo();
    var min = boundingInfo.minimum.add(meshes[0].position);
    var max = boundingInfo.maximum.add(meshes[0].position);
    for (var i = 1; i < meshes.length; i++) {
      boundingInfo = meshes[i].getBoundingInfo();
      min = BABYLON.Vector3.Minimize(
        min,
        boundingInfo.minimum.add(meshes[i].position)
      );
      max = BABYLON.Vector3.Maximize(
        max,
        boundingInfo.maximum.add(meshes[i].position)
      );
    }
    return new BABYLON.BoundingInfo(min, max);
  }

  createBoundingBox() {
    // Create a box as BoundingBox of the Dude
    let bounder = new BABYLON.Mesh.CreateBox(
      "bounder" + this.id.toString(),
      1,
      this.scene
    );
    let bounderMaterial = new BABYLON.StandardMaterial(
      "bounderMaterial",
      this.scene
    );
    bounderMaterial.alpha = 0.4;
    bounder.material = bounderMaterial;
    bounder.checkCollisions = true;

    bounder.position = this.dudeMesh.position.clone();

    let bbInfo = Dude.boundingBoxParameters;

    let max = bbInfo.boundingBox.maximum;
    let min = bbInfo.boundingBox.minimum;

    // Not perfect, but kinda of works...
    // Looks like collisions are computed on a box that has half the size... ?
    bounder.scaling.x = (max._x - min._x) * this.scaling;
    bounder.scaling.y = (max._y - min._y) * this.scaling;
    bounder.scaling.z = (max._z - min._z) * this.scaling * 3;
    //bounder.isVisible = false;

    bounder.position.y += (max._y - min._y) * this.scaling / 2;

    return bounder;
  }

  createParticleSystem() {
    // Create a particle system
    var particleSystem = new BABYLON.ParticleSystem(
      "particles",
      2000,
      this.scene
    );

    //Texture of each particle
    particleSystem.particleTexture = new BABYLON.Texture(
      "images/flare.png",
      this.scene
    );
    return particleSystem;
  }

  setParticleSystemDefaultValues() {
    let particleSystem = Dude.particleSystem;

    // Where the particles come from. Will be changed dynacally to the hit point.
    particleSystem.emitter = new BABYLON.Vector3(0, 0, 0); // the starting object, the emitter

    // Colors of all particles RGBA
    particleSystem.color1 = new BABYLON.Color4(1, 0, 0, 1.0);
    particleSystem.color2 = new BABYLON.Color4(1, 0, 0, 1.0);
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);

    particleSystem.emitRate = 100;

    // Set the gravity of all particles
    particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);

    // Direction of each particle after it has been emitted
    particleSystem.direction1 = new BABYLON.Vector3(0, -1, 0);
    particleSystem.direction2 = new BABYLON.Vector3(0, -1, 0);

    particleSystem.minEmitPower = 6;
    particleSystem.maxEmitPower = 10;

    // Size of each particle (random between...
    particleSystem.minSize = 0.4;
    particleSystem.maxSize = 0.8;
  }

  setParticleSystemToFinalExplosion() {
    let particleSystem = Dude.particleSystem;
    particleSystem.emitter = new BABYLON.Vector3(
      this.bounder.position.x,
      this.bounder.position.y,
      this.bounder.position.z
    );
    console.log(this.bounder);
    particleSystem.emitRate = 300;

    particleSystem.minEmitPower = 12;
    particleSystem.maxEmitPower = 20;

    // Size of each particle (random between...
    particleSystem.minSize = 0.5;
    particleSystem.maxSize = 2.5;

    // Life time of each particle (random between...
    particleSystem.minLifeTime = 0.3;
    particleSystem.maxLifeTime = 1.5;

    particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);

    particleSystem.createSphereEmitter(2);
  }
}
