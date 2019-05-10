Array.prototype.select = function(){
  return this[Math.floor(Math.random()*this.length)];
}
Array.prototype.copy2D = function(){
  array = []
  for (let i = 0; i < this.length; i++){
    array.push(this[i].slice())
  }
  return array
}

const NotFoundGames = (function() {
  const TwoOFourEight = (function() {
    const TITLE = 'TwoOFourEight'
    const TILE_SIZE = 4
    const EMERGENCE_TILES = [2, 4]

    let tiles = [...Array(TILE_SIZE)].map(e => Array(TILE_SIZE));
    let snapshots = {}
    let turn = -1

    const setup = function () {
      let element = document.createElement('div');
      element.id=TITLE;
      element.innerHTML = `
       <div id="tiles">
         <span class="tile"></span><span class="tile"></span><span class="tile"></span><span class="tile"></span>
         <span class="tile"></span><span class="tile"></span><span class="tile"></span><span class="tile"></span>
         <span class="tile"></span><span class="tile"></span><span class="tile"></span><span class="tile"></span>
         <span class="tile"></span><span class="tile"></span><span class="tile"></span><span class="tile"></span>
       </div>
       <div id="grids">
         <span class="line"></span><span class="line"></span><span class="line"></span><span class="line"></span>
         <span class="line"></span><span class="line"></span><span class="line"></span><span class="line"></span>
         <span class="line"></span><span class="line"></span><span class="line"></span><span class="line"></span>
         <span class="line"></span><span class="line"></span><span class="line"></span><span class="line"></span>
       </div>`

      if (module.config.debug) {
        let retry = document.createElement('button');
        retry.innerHTML = 'retry';
        retry.addEventListener("click", function(){
          NotFoundGames.TwoOFourEight.initialize()
        });
        let fill = document.createElement('button');
        fill.innerHTML = 'fill';
        fill.addEventListener("click", function(){
          NotFoundGames.TwoOFourEight._fill()
        });

        let undo = document.createElement('button');
        undo.innerHTML = 'undo';
        undo.addEventListener("click", function(){
          NotFoundGames.TwoOFourEight._undo()
        });
        let redo = document.createElement('button');
        redo.innerHTML = 'redo';
        redo.addEventListener("click", function(){
          NotFoundGames.TwoOFourEight._redo()
        });
        let debug = document.createElement("div");
        debug.id = 'debug'
        debug.appendChild(retry)
        debug.appendChild(fill)
        debug.appendChild(undo)
        debug.appendChild(redo)
        element.appendChild(debug)
      }

      document.getElementsByTagName("main")[0].appendChild(element)
    }
    const sync = function() {
      let tilesElement = document.getElementById("tiles");
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          flatIndex = y * TILE_SIZE + x
          if (tiles[y][x]) {
              tilesElement.children[flatIndex].innerHTML = tiles[y][x]
              tilesElement.children[flatIndex].className = 'tile n'+tiles[y][x]
          } else {
              tilesElement.children[flatIndex].innerHTML = ''
              tilesElement.children[flatIndex].className = 'tile empty'
          }
        }
      }
    }
    const sweep = (function () {
      const _sweep = function (direction, delta) {
        let moved = 0, added = 0
        const setup = function (i, j) {
          let x, y, prev
          if (direction == 'horizontal') {
            y = i
            x = delta > 0 ? j : TILE_SIZE - j - 1
            prev = x - delta
          } else{
            y = delta > 0 ? j : TILE_SIZE - j - 1
            x = i
            prev = y - delta
          }
          return {x, y, prev}
        }
        const change = function (target, source) {
          const { x, y } = source
          // add
          if(tiles[y][x] == tiles[target.y][target.x] && added==0) {
            tiles[target.y][target.x] += tiles[y][x]
            tiles[y][x] = null
            added +=1
            moved +=1
          // move
          } else if (!tiles[target.y][target.x]) {
            tiles[target.y][target.x] = tiles[y][x]
            tiles[y][x] = null
            moved +=1
          }
        }
        return (function() {
          moved = 0
          for (let i = 0; i < TILE_SIZE; i++) {
            added = 0
            for (let j = 1; j < TILE_SIZE; j++) {
              let { x, y, prev } = setup(i, j)
              if (!tiles[y][x]) continue;
              while (0 <= prev && prev < TILE_SIZE) {
                if (direction == 'horizontal') {
                  change({y, x:prev}, {x, y})
                  x -= delta
                } else {
                  change({y: prev, x}, {x, y})
                  y -= delta
                }
                prev -= delta
              }
            }
          }
          return moved
        })
      }
      return {
        left: _sweep(direction='horizontal', delta=1),
        right: _sweep(direction='horizontal', delta=-1),
        top: _sweep(direction='vertical', delta=1),
        down: _sweep(direction='vertical', delta=-1)
      }
    })()
    const handleKeyDown = function () {
      // left, down, top, right
      const HJKL = [72, 74, 75, 76]
      const ASWD = [65, 83, 87, 68]
      const ARROW = [37, 40, 38, 39]
      document.addEventListener('keydown', function(event) {
        let moved = 0
        if ([HJKL[0], ASWD[0], ARROW[0]].includes(event.keyCode)) {
          moved = sweep.left()
          sync()
        } else if ([HJKL[1], ASWD[1], ARROW[1]].includes(event.keyCode)) {
          moved = sweep.down()
          sync()
        } else if ([HJKL[2], ASWD[2], ARROW[2]].includes(event.keyCode)) {
          moved = sweep.top()
          sync()
        } else if ([HJKL[3], ASWD[3], ARROW[3]].includes(event.keyCode)) {
          moved = sweep.right()
          sync()
        }
        if (moved > 0) {
          setTimeout(next, 100)
        }
      });
    }

    const handleGesture = function () {
      // gist from https://gist.github.com/SleepWalker/da5636b1abcbaff48c4d
      let touchstartX = 0;
      let touchstartY = 0;
      let touchendX = 0;
      let touchendY = 0;

      const gestureZone = document.body;

      gestureZone.addEventListener('touchstart', function(event) {
        touchstartX = event.changedTouches[0].screenX;
        touchstartY = event.changedTouches[0].screenY;
      }, false);

      gestureZone.addEventListener('touchend', function(event) {
        touchendX = event.changedTouches[0].screenX;
        touchendY = event.changedTouches[0].screenY;
        handleGesture();
      }, false);

      function handleGesture() {
        let moved = 0
        const offset = {
          left: touchstartX - touchendX,
          right: touchendX - touchstartX,
          top: touchstartY - touchendY,
          down: touchendY - touchstartY
        }
        const maxOffset = Math.max(offset.left, offset.right, offset.top, offset.down)
        if (maxOffset < 15 || touchendY === touchstartY && touchendX === touchstartX) {
           // console.log('Tap');
        } else if (offset.left === maxOffset) {
          moved = sweep.left()
          sync()
        } else if (offset.right === maxOffset) {
          moved = sweep.right()
          sync()
        } else if (offset.top === maxOffset) {
          moved = sweep.top()
          sync()
        } else if (offset.down === maxOffset) {
          moved = sweep.down()
          sync()
        }
        if (moved > 0) {
          setTimeout(next, 100)
        }
      }
    }

    const next = function(){
      emergence(1);
      sync();
      takeASnapshot();
      if(!movable()){
        module.retry(TITLE)
      }
    }
    const movable = function () {
      for (let y = 0; y < TILE_SIZE; y++) {
        for (let x = 0; x < TILE_SIZE; x++) {
          if (!tiles[y][x]) return true;
          if (x< TILE_SIZE-1 && tiles[y][x] == tiles[y][x+1]) return true;
          if (y< TILE_SIZE-1 && tiles[y][x] == tiles[y+1][x]) return true;
        }
      }
      return false
    }
    const takeASnapshot = function () {
      turn += 1
      snapshots[turn] = tiles.copy2D()
    }
    const emergence = function(size) {
      // EMERGENCE_TILES 중에서 랜덤하게 size 개 배치
      while (size) {
        let selected = Math.floor(Math.random() * TILE_SIZE*TILE_SIZE)
        if (!tiles[Math.floor(selected/TILE_SIZE)][selected%TILE_SIZE]) {
          tiles[Math.floor(selected/TILE_SIZE)][selected%TILE_SIZE] = EMERGENCE_TILES.select()
          size -=1
        }
      }
    }
    return {
      setup,
      initialize: function() {
        // 타일 초기화
        tiles = [...Array(TILE_SIZE)].map(e => Array(TILE_SIZE));
        emergence(2)
        sync()
        takeASnapshot();
        handleKeyDown();
        handleGesture();
      },
      _fill: function () {
        tiles = [[null,4,8,16],[32,64,128,256],[512,1024,2048,4096],[8192,16384,32768, 65536]]
        sync()
      },
      _undo: function () {
        if (!snapshots[turn-1]) return
        turn -=1
        tiles = snapshots[turn].copy2D()
        sync()
      },
      _redo: function () {
        if (!snapshots[turn+1]) return
        turn +=1
        tiles = snapshots[turn].copy2D()
        sync()
      }
    };
  })();

  const SkateJump = (function() {
    const TITLE = 'SkateJump'
    const FRAME_RATE = 50

    const GROUND_SIZE = 20
    const GROUND_TILES = [new Image(), new Image(), new Image(), new Image(), new Image()]
    GROUND_TILES[0].src = '/404/images/ground_0.png'
    GROUND_TILES[1].src = '/404/images/ground_1.png'
    GROUND_TILES[2].src = '/404/images/ground_2.png'
    GROUND_TILES[3].src = '/404/images/ground_3.png'
    GROUND_TILES[4].src = '/404/images/ground_4.png'
    const CONE = new Image();
    CONE.src = '/404/images/cone.png';


    let player = null;
    let grounds = Array();
    let groundCTX = null
    let gameLoop = null
    let frame = 0
    let status = 'pushoff'
    let startAt = 0


    var Skater = (function (positionX, positionY) {
      var frame = 0
      var original = {width: 300, height: 480}
      var display = {width: 100, height: 160}
      var action = null
      var state = 'idle'
      var sprite = {
        pushoff: new Image(),
        ollie: new Image()
      }

      var skater = document.getElementById("skater");
      skater.style="display: block; margin-top:-250px; filter: invert(100%);min-height:250px;"
      skater.width  = window.innerWidth;
      skater.height = '250';
      var ctx = skater.getContext("2d");

      var clearAction = function () {
          frame = 0
          clearInterval(action)
      }
      var idle = function () {
        clearAction()
        state = 'idle'
        ctx.clearRect(positionX, positionY, display.width, display.height);
        ctx.drawImage(sprite['pushoff'],
                      0, 0, original.width, original.height,
                      positionX, positionY, display.width,display.height);
      }
      return {
        load: function() {
          sprite.ollie.src = '/404/images/ollie.png';
          sprite.pushoff.src = '/404/images/pushoff.png';
          sprite.pushoff.onload = function(){
            ctx.drawImage(sprite.pushoff,
                          0, 0, original.width, original.height,
                          positionX, positionY, display.width, display.height);
          }
        },
        pushoff: function () {
          if (state === 'ollie') return
          clearAction()
          state = 'pushoff'
          action = setInterval(function() {
            frame = ++frame % 4; 
            x = frame * original.width;
            ctx.clearRect(positionX, positionY, display.width, display.height);
            ctx.drawImage(sprite['pushoff'],
                          x, 0, original.width, original.height,
                          positionX, positionY, display.width,display.height);
            if (frame === 0) idle()
          }, 150)
        },
        ollie: function () {
          const frameTo = {
            time: [70,90,250,110,80],
            marginY: [0, -10, -15, -10, 0]
          }
          if (state === 'ollie') return
          clearAction()
          state = 'ollie'

          action = function() {
              frame = ++frame % 5
              x = frame * original.width;
              ctx.clearRect(positionX, positionY - 15, display.width, display.height + 15);
              ctx.drawImage(sprite['ollie'],
                            x, 0, original.width, original.height,
                            positionX, positionY + frameTo.marginY[frame-1], display.width,display.height);
            if (frame === 0) idle()
            else setTimeout(action, frameTo.time[frame-1]);
          }
          setTimeout(action, 0);
        },
        state: function () {
          return state
        }
      }
    })

    const setup = function () {
      let element = document.createElement('div');
      element.id=TITLE;
      element.innerHTML = `
        <canvas id="ground"></canvas>
        <canvas id="skater"></canvas>
      `
      document.getElementsByTagName("main")[0].appendChild(element)

      var ground = document.getElementById("ground");
      ground.width  = window.innerWidth;
      ground.height = '250';
      ground.style="display: block; filter: invert(100%);"
      groundCTX = ground.getContext("2d");

      player = Skater(29, 50)
      player.load()
    }
    const handleAnyInput = function () {
      const handle = function(event) {
        player.ollie()
      }
      document.addEventListener('keydown', handle);
      document.body.addEventListener('touchstart', handle, false);

    }
    const sync = function(frame) {
      for (var i =0; i< grounds.length; i++) {
          groundCTX.clearRect(50* i, 150, 50, 80);
        if (grounds[i] === CONE){
          groundCTX.drawImage(CONE, 0, 0, 150, 250, 50* i - (50/FRAME_RATE*frame), 135, 48, 80);
        } else {
          groundCTX.drawImage(grounds[i], 0, 0, 150, 75, 50* i - (50/FRAME_RATE*frame), 197, 50, 25);
        }
      }
    }
    const next = function() {
      frame = ++frame % FRAME_RATE;
      if (frame === 0)  {
        let sprite = [CONE].concat(GROUND_TILES).select()
        if (grounds[GROUND_SIZE-1] === CONE || grounds[GROUND_SIZE-2] === CONE) {
          sprite = GROUND_TILES.select()
        }
        grounds.push(sprite)
        grounds.shift()

      }
      const score = Math.floor((new Date().getTime() - startAt)/100)

      groundCTX.clearRect(ground.width - 70, 0, 70, 50);
      groundCTX.font = '20px Consolas, monaco, monospace';
      groundCTX.fillText(String(score).padStart(5, '0'), ground.width - 70, 30);
      let timestamp = new Date().getTime()
      if (timestamp % 3000 <= 5 ||
          (750 <= timestamp % 6000 && timestamp % 6000 <= 755) ) {
        player.pushoff()
      }
      // Game over condition
      if (grounds[2] === CONE && player.state() !== 'ollie') {
        clearInterval(gameLoop)
        module.retry(TITLE)
      } else{
        sync(frame)
      }
    }

    return {
      setup,
      initialize: function() {
        startAt = new Date().getTime()
        for (let x = 0; x < GROUND_SIZE; x++) {
          grounds[x] = GROUND_TILES.select()
        }

        sync(0)
        gameLoop = setInterval(next, 200/FRAME_RATE)
        handleAnyInput()
      }
    }
  })();
  const retry = function(title) {
    let retry = document.createElement('div');
    retry.id='retry';
    retry.innerHTML = '<p>Do you wanna <button>retry</button>?</p>'
    let button = retry.getElementsByTagName("button")[0];
    button.addEventListener("click", function(){
      NotFoundGames[title].initialize()
      document.getElementById("retry").remove()
    });
    document.getElementById(title).appendChild(retry)
  }
  let module = {
    config: {debug: false},
    games: [TwoOFourEight, SkateJump],
    retry,
    TwoOFourEight, SkateJump
  }
  return {
    set_config: function (config) {
      module.config = config
    },
    select: function () {
      return module.games.select()
    },
    TwoOFourEight,
    SkateJump
  };
})();
