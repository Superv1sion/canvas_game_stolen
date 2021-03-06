
// A cross-browser requestAnimationFrame
// See https://hacks.mozilla.org/2011/08/animating-with-javascript-from-setinterval-to-requestanimationframe/
var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000);
        };
})();

// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
var moveToObject = {};
var loginData ={'Login': 'first', 'Password' : 'test'};
var items = [];
var itemsControl = {};
var coordinator = {isSent : 0};
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
document.body.addEventListener("click", setMove, false);
// The main game loop
var lastTime;
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    render();
    moveThere(moveToObject);
    lastTime = now;

    requestAnimFrame(main);

};

function getItems(){


            socket.emit('requestItems', {'SessionToken': loginData.SessionToken});


}

function sendOffset() {

    if(coordinator.isSent == 1 ){
        return;
    }
    console.log(moveToObject);
    console.log('send coordinates');
    //console.log({offsetX: moveToObject.x - player.pos[0], offsetY: moveToObject.y - player.pos[1],  SessionToken: loginData.SessionToken});
    socket.emit('sendOffset', {offsetX: moveToObject.endPointX - moveToObject.startPointX, offsetY: moveToObject.endPointY - moveToObject.startPointY,  SessionToken: loginData.SessionToken});
    //socket.emit('sendOffset', {newX: moveToObject.x, newY: moveToObject.y, oldX: player.pos[0], oldY: player.pos[1], SessionToken: loginData.SessionToken});

    coordinator.isSent= 1;
 //   console.log(coordinator);
}


function init() {
    terrainPattern = ctx.createPattern(resources.get('img/terrain.png'), 'repeat');

    var promise = new Promise((resolve, reject) => {

        socket.emit('login', loginData);
        socket.on('loginSuccess', function (data) {

            loginData.SessionToken = data.SessionToken;

            resolve();
        })
    });
    socket.on('getItems', function (data) {

        for (var i = 0; i < data.length; i++) {
            if( typeof itemsControl[data[i].ItemID] != 'undefined' ){
                continue;
            }
            data[i].x += player.pos[0];
            data[i].y += player.pos[1];
            itemsControl[data[i].ItemID] = '1';
            items.push(data[i]);
        }

    });
    socket.on('offsetProcessed', function (data) {
        getItems();
    })
    //document.getElementById('play-again').addEventListener('click', function() {
    //    reset();
    //});

    promise.then(function () {
        getItems();
        reset();
        lastTime = Date.now();
        main();
    })



}

resources.load([
    'img/sprites.png',
    'img/terrain.png'
]);
resources.onReady(init);

// Game state
var player = {
    pos: [0, 0],
    sprite: new Sprite('img/sprites.png', [0, 0], [39, 39], 16, [0])
};

var bullets = [];
var enemies = [];
var explosions = [];
var elements = [];

var lastFire = Date.now();
var gameTime = 0;
var isGameOver;
var terrainPattern;

var score = 0;
var scoreEl = document.getElementById('score');


// Speed in pixels per second
var playerSpeed = 10;
var bulletSpeed = 10;
var enemySpeed = 10;

// Update game objects

function setMove(e) {

    xDiff = Math.abs(player.pos[0] - moveToObject.x);
    yDiff = Math.abs(player.pos[1] - moveToObject.y);

    if(xDiff > 1 || yDiff > 1){

        moveToObject.endPointX = moveToObject.startPointX + (moveToObject.offsetX - (moveToObject.x - player.pos[0]));
        moveToObject.endPointY = moveToObject.startPointY + (moveToObject.offsetY - (moveToObject.y - player.pos[1]));

        sendOffset();
    }

    moveToObject.startPointX = player.pos[0];
    moveToObject.startPointY = player.pos[1];
    moveToObject.x=e.clientX;
    moveToObject.y=e.clientY;


    moveToObject.offsetX =moveToObject.x-moveToObject.startPointX;
    moveToObject.offsetY =moveToObject.y-moveToObject.startPointY;

    moveToObject.endPointX =moveToObject.x;
    moveToObject.endPointY =moveToObject.y;
    coordinator.isSent= 0;

}
function moveThere(e) {

    var step = playerSpeed;


    moveTo = {x: e.x, y: e.y};
    moveFrom = {x: player.pos[0], y: player.pos[1]};
    xDiff = Math.abs(moveFrom.x - moveTo.x);
    yDiff = Math.abs(moveFrom.y - moveTo.y);
    var xKoef = 1;
    var yKeof = 1;
    if (xDiff > yDiff){
        yKeof = yDiff/xDiff;
    }
    if (yDiff > xDiff){

        xKeof = xDiff/yDiff;

    }
    //console.log(Math.abs(moveFrom.x - moveTo.x));
    if ( Math.abs(moveFrom.x - moveTo.x)>10 || Math.abs(moveFrom.y - moveTo.y)>10){


            xStep = determineSign(moveFrom.x, moveTo.x, step);
            //console.log(step);

            moveAll(xStep*xKoef, 0);
            moveToObject.x +=xStep*xKoef;



            yStep = determineSign(moveFrom.y, moveTo.y, step);
            //console.log(yStep);
            moveAll(0, yStep*yKeof);
            moveToObject.y +=yStep*yKeof;


    }else if ( Math.abs(moveFrom.x - moveTo.x)>1 || Math.abs(moveFrom.y - moveTo.y)>1 ){

        step = 1;
        //if(Math.abs(moveFrom.x - moveTo.x)>30){

            xStep = determineSign(moveFrom.x, moveTo.x, step);
            //console.log(step);

            moveAll(xStep*xKoef, 0);
            moveToObject.x +=xStep*xKoef;

        //}

        //if(Math.abs(moveFrom.y - moveTo.y)>30){
            yStep = determineSign(moveFrom.y, moveTo.y, step);
            //console.log(yStep);
            moveAll(0, yStep*yKeof);
            moveToObject.y +=yStep*yKeof;
        //}
    }
    if ( Math.abs(moveFrom.x - moveTo.x) <=1 || Math.abs(moveFrom.y - moveTo.y) <=1 ){
        sendOffset();
    }
   // console.log(moveFrom);
   // console.log(moveTo);
}
function determineSign(a, b, val){
    if(a>b){
        return val;
    }else{
        return -val;
    }

}
function update(dt) {
    gameTime += dt;

    handleInput(dt);
    updateEntities(dt);

    // It gets harder over time by adding enemies using this
    // equation: 1-.993^gameTime
    //if(1){ //Math.random() < 1 - Math.pow(0.993, gameTime)) {
    //    enemies.push({
    //        pos: [canvas.width,
    //              Math.random() * (canvas.height - 39)],
    //        sprite: new Sprite('img/sprites.png', [0, 78], [80, 39],
    //                           6, [0, 1, 2, 3, 2, 1])
    //    });
    //}

    checkCollisions();

    scoreEl.innerHTML = score;
};


function handleInput(dt) {
    if(input.isDown('DOWN') || input.isDown('s')) {
        //player.pos[1] += playerSpeed * dt;
        moveAll(0, -playerSpeed);
    }

    if(input.isDown('UP') || input.isDown('w')) {
        //player.pos[1] -= playerSpeed * dt;
        moveAll(0, playerSpeed);
    }

    if(input.isDown('LEFT') || input.isDown('a')) {
        moveAll(playerSpeed, 0);
        //player.pos[0] -= playerSpeed * dt;
    }

    if(input.isDown('RIGHT') || input.isDown('d')) {
        moveAll(-playerSpeed, 0);
        //player.pos[0] += playerSpeed * dt;
    }

    if(input.isDown('SPACE') &&
       !isGameOver &&
       Date.now() - lastFire > 10) {
        var x = player.pos[0] + player.sprite.size[0] / 2;
        var y = player.pos[1] + player.sprite.size[1] / 2;


        lastFire = Date.now();
    }
}
function moveAll(x, y){
    //console.log('move everything by ' + x + " x");
    //console.log('move everything by ' + y + " y");
    for(var i=0; i<elements.length; i++) {
        elements[i].pos[0] += x;
        elements[i].pos[1] += y;
    }
    for(var i=0; i<explosions.length; i++) {
        explosions[i].pos[0] += x;
        explosions[i].pos[1] += y;
    }

}
function updateEntities(dt) {
    // Update the player sprite animation
    player.sprite.update(dt);

    while(items.length > 0){
        var item = items.shift();

            elements.push({
                pos: [item.x,
                    item.y],
                sprite: new Sprite('img/sprites.png', [0, 78], [80, 39],
                    6, [0, 1, 2, 3, 2, 1])
            })

    }

    // Update all the bullets
    for(var i=0; i<bullets.length; i++) {
        var bullet = bullets[i];

        switch(bullet.dir) {
        case 'up': bullet.pos[1] -= bulletSpeed * dt; break;
        case 'down': bullet.pos[1] += bulletSpeed * dt; break;
        default:
            bullet.pos[0] += bulletSpeed * dt;
            bullet.pos[1] += Math.sin(bullet.pos[0])*10;

        }

        // Remove the bullet if it goes offscreen
        if(bullet.pos[1] < 0 || bullet.pos[1] > canvas.height ||
           bullet.pos[0] > canvas.width) {
            bullets.splice(i, 1);
            i--;
        }
    }

   // Update all the enemies

      //enemies[i].pos[0] -= enemySpeed * dt;

     // elements[i].sprite.update(dt);
     // // Remove if offscreen
     // if(elements[i].pos[0] + elements[i].sprite.size[0] < 0) {
     // //    enemies.splice(i, 1);
     // //    i--;
     // }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Update all the explosions
    for(var i=0; i<explosions.length; i++) {
        explosions[i].sprite.update(dt);

        // Remove if animation is done
        if(explosions[i].sprite.done) {
            explosions.splice(i, 1);
            i--;
        }
    }
}

// Collisions

function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
             b <= y2 || y > b2);
}

function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
                    pos[0] + size[0], pos[1] + size[1],
                    pos2[0], pos2[1],
                    pos2[0] + size2[0], pos2[1] + size2[1]);
}

function checkCollisions() {
    checkPlayerBounds();
    
    // Run collision detection for all enemies and bullets
    for(var i=0; i<elements.length; i++) {
        var pos = elements[i].pos;
        var size = elements[i].sprite.size;

            if(boxCollides(pos, size, player.pos, player.sprite.size)) {
                // Remove the enemy
                elements.splice(i, 1);
                i--;

                // Add score


                // Add an explosion
                explosions.push({
                    pos: pos,
                    sprite: new Sprite('img/sprites.png',
                                       [0, 117],
                                       [39, 39],
                                       16,
                                       [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                                       null,
                                       true)
                });

                // Remove the bullet and stop this iteration

                break;
            }



    }
}

function checkPlayerBounds() {
    // Check bounds
    if(player.pos[0] < 0) {
        player.pos[0] = 0;
    }
    else if(player.pos[0] > canvas.width - player.sprite.size[0]) {
        player.pos[0] = canvas.width - player.sprite.size[0];
    }

    if(player.pos[1] < 0) {
        player.pos[1] = 0;
    }
    else if(player.pos[1] > canvas.height - player.sprite.size[1]) {
        player.pos[1] = canvas.height - player.sprite.size[1];
    }
}

// Draw everything
function render() {
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    // Render the player if the game isn't over
    if(!isGameOver) {
        renderEntity(player);
    }

    renderEntities(bullets);
    renderEntities(enemies);
    renderEntities(explosions);
    renderEntities(elements);
};

function renderEntities(list) {
    for(var i=0; i<list.length; i++) {
        renderEntity(list[i]);
    }    
}

function renderEntity(entity) {
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(ctx);
    ctx.restore();
}

// Game over
function gameOver() {
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';
    isGameOver = true;
}

// Reset game to original state
function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    isGameOver = false;
    gameTime = 0;
    score = 0;

    enemies = [];
    bullets = [];

    player.pos = [canvas.width /2, canvas.height / 2];
};
