export default class Dude {
  constructor(dudeMesh, id, speed, scaling, scene) {
    this.dudeMesh = dudeMesh;
    this.id = id;
    this.scene = scene;
    this.scaling = scaling;
    this.health = 3; // three shots to kill the dude !

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

  move(scene) {
    // as move can be called even before the bbox is ready.
    if (!this.bounder) return;

    // let's put the dude at the BBox position. in the rest of this
    // method, we will not move the dude but the BBox instead
    this.dudeMesh.position = new BABYLON.Vector3(
      this.bounder.position.x,
      this.bounder.position.y,
      this.bounder.position.z
    );

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
    // 1st possibility, just change some parameters of the particleSystem for this big explosion !
    console.log(this.bounder);
    this.setParticleSystemToFinalExplosion();

    Dude.particleSystem.start();
    setTimeout(() => {
      Dude.particleSystem.stop();
      this.createParticleSystem()
      this.setParticleSystemDefaultValues(); // reset to original values
    }, 300);

    // 2nd possibility : use the particuleHelper
    //BABYLON.ParticleHelper.BaseAssetsUrl = "particles";

    // Need to add the textures to an explosion folder at root of the project.
    // take assets from https://github.com/BabylonJS/Assets
    /*
    BABYLON.ParticleHelper.CreateAsync("explosion", this.scene).then((set) => {
      set.systems.forEach(s => {
        s.emitter = this.bounder.position;

          s.disposeOnStop = true;
      });
      set.start();
    });
  */

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
    bounder.scaling.y = (max._y - min._y) * this.scaling * 2;
    bounder.scaling.z = (max._z - min._z) * this.scaling * 3;

    //bounder.isVisible = false;

    return bounder;
  }

  createParticleSystem() {
    // Create a particle system
    var particleSystem = new BABYLON.ParticleSystem("particles", 2000, this.scene);

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
      this.bounder.position.y + 6,
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
