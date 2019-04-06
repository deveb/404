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
    const GROUND_SIZE = 16
    const GROUND_TILES = [1, 2, 3, 4]

    let grounds = Array(GROUND_SIZE);
    let status = 'pushoff'
    let loop = null
    let score = 0
    let frame = 0
    let ollied = 0

    const setup = function () {
      let element = document.createElement('div');
      element.id=TITLE;
      element.innerHTML = `
       <div id="skater">
         <span class='offset'></span>
         <span class='pushoff'></span>
         <span id='score'></span>
       </div>
       <div id="grids">
         <span class="line"></span><span class="line"></span><span class="line"></span><span class="line"></span>
         <span class="line"></span><span class="line"></span><span class="line"></span><span class="line"></span>
         <span class="line"></span><span class="line"></span><span class="line"></span><span class="line"></span>
         <span class="line"></span><span class="line"></span><span class="line"></span><span class="line"></span>
       </div>`
      document.getElementsByTagName("main")[0].appendChild(element)
    }
    const sync = function() {
      let gridsElement = document.getElementById("grids");
      for (let x = 0; x < GROUND_SIZE; x++) {
        gridsElement.children[x].className = 'line ground_'+grounds[x]
      }
      let scoreElement = document.getElementById("score");
      scoreElement.innerHTML = score;
    }
    const next = function() {
      if (new Date().getTime() - ollied > 900 - 100) status = 'pushoff'
      if (grounds[0] === 'cone'){
          score += 1
      }
      for (let x = 1; x < GROUND_SIZE; x++) {
         grounds[x-1] = grounds[x]
      }
      if (grounds[GROUND_SIZE-3] === 'cone') {
        grounds[GROUND_SIZE-1] = GROUND_TILES.select()
      } else {
        grounds[GROUND_SIZE-1] = ['cone'].concat(GROUND_TILES).select()
      }
      if (grounds[1] === 'cone' && status === 'pushoff') {
        clearInterval(loop)
        module.retry(TITLE)
        let skaterElement = document.getElementById("skater");
        skaterElement.children[1].className = 'pause'
        return
      }
      sync()
    }
    const handleAnyInput = function () {
      const handle = function(event) {
        const now = new Date().getTime()
        if (status === 'ollie' || now - ollied < 900) return;
        status = 'ollie'
        ollied = now
        let skaterElement = document.getElementById("skater");
        skaterElement.children[1].className = 'ollie'
        setTimeout(function () {
          let skaterElement = document.getElementById("skater");
          skaterElement.children[1].className = 'pushoff'
          status = 'pushoff'
        }, 900)
      }
      document.addEventListener('keydown', handle);
      document.body.addEventListener('touchend', handle, false);

    }

    return {
      setup,
      initialize: function() {
        score = 0
        for (let x = 0; x < GROUND_SIZE; x++) {
          grounds[x] = GROUND_TILES.select()
        }
        sync()
        loop = setInterval(function() {
          if (frame % 30 === 0) next()
          frame += 1
        }, 10);
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
    retry
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
