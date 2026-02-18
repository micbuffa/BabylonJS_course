
// Define car movement speed
var moveForward = 0;
var moveDirection = 0;
var forceMagnitude = 10;
var rotationSpeed = 3;
var angularDamping = 40;
var decelerationFactor = 4;
var tireDecalTimer = 0;

var moveX, moveZ;
var joystickSensitivity = 10;
var pressed = false;
var leftJoystick;
var rightJoystick;


function keyMove(car) {

    setInterval(() => {
        tireDecalTimer++;
    }, 100);

    var inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        var frontVector = car.transformNode.getDirection(BABYLON.Axis.Z);

        if (moveForward == 1)
            car.body.setLinearVelocity(frontVector.scale(-decelerationFactor), car.transformNode.getAbsolutePosition());
        if (moveForward == -1)
            car.body.setLinearVelocity(frontVector.scale(decelerationFactor), car.transformNode.getAbsolutePosition());

        var rotationAxis = new BABYLON.Vector3(0, 0, 0);
        if (moveDirection == 0)
        car.body.setAngularVelocity(rotationAxis.scale(0));

        moveForward = 0;
        moveDirection = 0;
        tireDecalTimer = 0;
    }));

    // Update car position based on keyboard input
    scene.onAfterRenderObservable.add(function () {

        var velocityVector = new BABYLON.Vector3(0,0,0);
        car.body.getLinearVelocityToRef(velocityVector);
 
        if (inputMap["z"] || inputMap["ArrowUp"]) {
            var frontVector = car.transformNode.getDirection(BABYLON.Axis.Z).scale(-forceMagnitude);
            frontVector.y = velocityVector.y;
            car.body.setLinearVelocity(frontVector, car.transformNode.getAbsolutePosition());
            moveForward = 1;
        }
        if (inputMap["s"] || inputMap["ArrowDown"]) {
            var frontVector = car.transformNode.getDirection(BABYLON.Axis.Z).scale(forceMagnitude);
            frontVector.y = velocityVector.y;
            car.body.setLinearVelocity(frontVector, car.transformNode.getAbsolutePosition());
            moveForward = -1;
        }

        if (inputMap["q"] || inputMap["ArrowLeft"]) {
            if (moveForward != 0)
            {
                var rotationAxis = new BABYLON.Vector3(0, -1, 0);
                car.body.setAngularDamping(angularDamping);
                car.body.setAngularVelocity(rotationAxis.scale(rotationSpeed));
                if (tireDecalTimer > 10)
                {
                    tireDecal(car);
                }
            }
            moveDirection = 1;
        }
        if (inputMap["d"] || inputMap["ArrowRight"]) {
            if (moveForward != 0)
            {
                var rotationAxis = new BABYLON.Vector3(0, 1, 0);
                car.body.setAngularDamping(angularDamping);
                car.body.setAngularVelocity(rotationAxis.scale(rotationSpeed)); 
                if (tireDecalTimer > 10)
                {
                    tireDecal(car);
                }
            }
            moveDirection = -1;
        }
    });
    wheelAnimFunc();
}



// Virtual Joystick Actions //
function joystickMove_1(car) {
    
    setInterval(() => {
        tireDecalTimer++;
    }, 100);

    leftJoystick = new BABYLON.VirtualJoystick(true);
    rightJoystick = new BABYLON.VirtualJoystick(false);
    leftJoystick.setJoystickColor("#b3dbbf");
    rightJoystick.setJoystickColor("#b1dbbf");
    BABYLON.VirtualJoystick.Canvas.style.zIndex = "4";

    scene.onBeforeRenderObservable.add(() => {
        
        if (leftJoystick.pressed) {
            var frontVector = car.transformNode.getDirection(BABYLON.Axis.Z).scale(leftJoystick.deltaPosition.y*joystickSensitivity);

            var velocityVector = new BABYLON.Vector3(0,0,0);
            car.body.getLinearVelocityToRef(velocityVector);

            if (leftJoystick.deltaPosition.y > 0) {
                moveForward = 1;
                frontVector.y = velocityVector.y;
                car.body.setLinearVelocity(frontVector.scale(-1), car.transformNode.getAbsolutePosition());
            }
            if (leftJoystick.deltaPosition.y < 0) {
                moveForward = -1;
                frontVector.y = velocityVector.y;
                car.body.setLinearVelocity(frontVector.scale(-1), car.transformNode.getAbsolutePosition());
            }

        }  else {

            var frontVector = car.transformNode.getDirection(BABYLON.Axis.Z);

            if (moveForward == 1)
                car.body.setLinearVelocity(frontVector.scale(-decelerationFactor), car.transformNode.getAbsolutePosition());
            if (moveForward == -1)
                car.body.setLinearVelocity(frontVector.scale(decelerationFactor), car.transformNode.getAbsolutePosition());

            if (leftJoystick.deltaPosition.y == 0)
            {
                var rotationAxis = new BABYLON.Vector3(0, 0, 0); // el eje de rotaciÃ³n
                car.body.setAngularVelocity(rotationAxis.scale(0));
            }
            leftJoystick.deltaPosition.y = 0;
            moveForward = 0;
        }
        
        if (rightJoystick.pressed) {

            if (rightJoystick.deltaPosition.x > 0) {
                var rotationAxis = new BABYLON.Vector3(0, 1, 0);
                car.body.setAngularDamping(angularDamping);
                car.body.setAngularVelocity(rotationAxis.scale(0.4)); 
                moveDirection = -1;

            } else if (rightJoystick.deltaPosition.x < 0) {
                var rotationAxis = new BABYLON.Vector3(0, -1, 0);
                car.body.setAngularDamping(angularDamping);
                car.body.setAngularVelocity(rotationAxis.scale(0.4)); 
                moveDirection = 1;
            } 

            if (leftJoystick.pressed)
            {
                if (rightJoystick.deltaPosition.x > 0) {
                    var rotationAxis = new BABYLON.Vector3(0, 1, 0);
                    car.body.setAngularDamping(angularDamping);
                    car.body.setAngularVelocity(rotationAxis.scale(rotationSpeed)); 
                    if (tireDecalTimer > 12)
                    {
                        tireDecal(car);
                    }
                    moveDirection = -1;
                } else if (rightJoystick.deltaPosition.x < 0) {
                    var rotationAxis = new BABYLON.Vector3(0, -1, 0);
                    car.body.setAngularDamping(angularDamping);
                    car.body.setAngularVelocity(rotationAxis.scale(rotationSpeed)); 
                    if (tireDecalTimer > 12)
                    {
                        tireDecal(car);
                    }
                    moveDirection = 1;
                } 
            }
        }

        if (!rightJoystick.pressed)
        {
            tireDecalTimer = 0;
            moveDirection = 0;
        }
    });

    wheelAnimFunc();
}


// Wheel Animation
function wheelAnimFunc() {
    var wheel_front_1 = scene.getNodeByName("Wheel_Front_1");
    var wheel_front_2 = scene.getNodeByName("Wheel_Front_2");
    var wheel_back_1 = scene.getNodeByName("Wheel_Back_1");
    var wheel_back_2 = scene.getNodeByName("Wheel_Back_2");
    var wheelAnim = 0;
    
    scene.registerBeforeRender(()=>{

        if (moveForward == -1)
        {
            wheel_front_1.rotation = new BABYLON.Vector3(wheelAnim,wheel_front_1.rotation.y,wheel_front_1.rotation.z);
            wheel_front_2.rotation = new BABYLON.Vector3(wheelAnim,wheel_front_2.rotation.y,wheel_front_2.rotation.z);
            wheel_back_1.rotation = new BABYLON.Vector3(wheelAnim,wheel_back_1.rotation.y,wheel_back_1.rotation.z);
            wheel_back_2.rotation = new BABYLON.Vector3(wheelAnim,wheel_back_2.rotation.y,wheel_back_2.rotation.z);

        } else if (moveForward == 1) {
            wheel_front_1.rotation = new BABYLON.Vector3(-wheelAnim,wheel_front_1.rotation.y,wheel_front_1.rotation.z);
            wheel_front_2.rotation = new BABYLON.Vector3(-wheelAnim,wheel_front_2.rotation.y,wheel_front_2.rotation.z);
            wheel_back_1.rotation = new BABYLON.Vector3(-wheelAnim,wheel_back_1.rotation.y,wheel_back_1.rotation.z);
            wheel_back_2.rotation = new BABYLON.Vector3(-wheelAnim,wheel_back_2.rotation.y,wheel_back_2.rotation.z);
        } 

        if (moveDirection == -1) 
        {
            wheel_front_1.rotation = new BABYLON.Vector3(wheel_front_1.rotation.x,Math.PI/7,wheel_front_1.rotation.z);
            wheel_front_2.rotation = new BABYLON.Vector3(wheel_front_1.rotation.x,Math.PI/7,wheel_front_1.rotation.z);
        } else if (moveDirection == 1) {
            wheel_front_1.rotation = new BABYLON.Vector3(wheel_front_1.rotation.x,-Math.PI/7,wheel_front_1.rotation.z);
            wheel_front_2.rotation = new BABYLON.Vector3(wheel_front_1.rotation.x,-Math.PI/7,wheel_front_1.rotation.z);
        } else if (moveDirection == 0) {
            wheel_front_1.rotation = new BABYLON.Vector3(wheel_front_1.rotation.x,0,wheel_front_1.rotation.z);
            wheel_front_2.rotation = new BABYLON.Vector3(wheel_front_1.rotation.x,0,wheel_front_1.rotation.z);
        }

        wheelAnim += 1;
    });
}