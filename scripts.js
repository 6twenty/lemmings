// May need to go back to dynamically adjusting the dimensions of the sprite as well as
// controlling the background position strictly, so that the direction of movement
// places the lemming flush against the leading edge.
// When changing the action, any changes to the dimensions should be relative to an anchor
// determined by the direction of movement (eg bottom right corner). This will allow the
// dimensions to be changed without affecting any adjacent elements.

var Lemming = {};

$(document).ready(function(){
  
  // Keep track of all the lemmings in the DOM
  Lemming.lemmings = [];
  
  // Helper to count the lemmings in the DOM (for namespacing only)
  Lemming.counter = 0;
  
  // Define defaults
  Lemming.options = {
    speed: 100,
    selector: '.collidable'
  }
  
  // Define corrected dimensions for each animation [width, height]
  // This is so that the background position can be adjusted when collisions are detected
  // so that the graphic is flush against the collided side
  Lemming.dimensions = {
    walk: [12,20],
    fall: [12,20],
    clim: [18,22]
  }
  
  // Launch a new lemming into the page and auto-start the animation & movement
  Lemming.launch = function() {
    var lemming = new Lemming.instance();
    lemming.start();
    return lemming;
  }
  
  // Returns an actual lemming instance, inserted into the DOM
  Lemming.instance = function() {
    
    var l = this;
    Lemming.lemmings.push(l);
    
    // Increment counter
    // This is solely to ensure sprite elements are named with a unique ID
    Lemming.counter = Lemming.counter + 1;
    
    // Init sprite DOM element
    var sprite = document.createElement('div');
    
    // Define the window bounds
    l.windowBounds = function() {
      return {
        left: $(window).width(),
        top: $(window).height()
      }
    }
    
    // Collect the collidable elements
    l.collidables = function() {
      return $(Lemming.options.selector);
    }
    
    // Init initial properties
    // [name_of_gif, number_of_frames]
    l.gif = ['walk_r', 8];
    
    // Config sprite
    sprite.id = 'lemming_' + Lemming.counter;
    sprite.className = 'lemming';
    sprite.style.backgroundPosition = 'left bottom';
    l.sprite = $(sprite);
    
    // Background image & positioning
    // The offset is adjusted when a collision is detected
    l.offset = -10;
    l.backgroundPosition = -10;
    // Convert the position (array) into CSS
    l.getBackgroundPosition = function() {
      return [(l.backgroundPosition - ((32 - l.sprite.width()) / 2)) + 'px', 'bottom'].join(' ');
    }
    
    // Change the background image
    l.setMovement = function(name, frames) {
      l.gif = [name, frames];
      l.sprite.get(0).style.backgroundImage = 'url(gifs/lemming_' + name + '.gif)';
      l.action = name;
    }
    
    // Init initial movements
    l.setMovement('walk_r', 8);
    l.moving = false;
    l.climbing = false;
    
    // Insert sprite into page
    $('body').append(sprite);
    
    // Set the initial direction of movement and initial page position
    l.direction = 'r';
    l.sprite.offset({ left: ($(window).width() / 2) + (l.sprite.width() / 2), top: 0 }); // top center
    
    // Animate action (not directional speed but frame rate)
    l.animate = function() {
      var frameCounter = 1;
      l.animation = setInterval(function(){        
        if (frameCounter >= l.gif[1]) {
          l.backgroundPosition = (0 + l.offset); frameCounter = 0;
        } else {
          l.backgroundPosition = ((l.backgroundPosition - 32));
        }
            
        l.sprite.get(0).style.backgroundPosition = l.getBackgroundPosition();
        
        frameCounter = frameCounter + 1;
      }, Lemming.options.speed);
    }
    
    // Init collisions
    l.adjacents = {
      top: false,
      right: false,
      bottom: false,
      left: false
    }
    
    // Helper to quickly check if we're in free fall (no adjacent elements)
    l.adjacents.any = function() {
      return (l.adjacents.top || l.adjacents.right || l.adjacents.bottom || l.adjacents.left);
    }
    
    // Calculate collisions
    // This is run every time the position is changed in order to determine the next action
    l.calculateCollisions = function() {
      var top     = false;
      var right   = false;
      var bottom  = false;
      var left    = false;
      
      var spriteBounds = {
        top: l.sprite.offset().top,
        right: l.sprite.offset().left + l.sprite.width(),
        bottom: l.sprite.offset().top + l.sprite.height(),
        left: l.sprite.offset().left
      }

      // Measure against the window first
      top     = spriteBounds.top == 0;
      right   = (spriteBounds.right) == l.windowBounds().left;
      bottom  = (spriteBounds.bottom) == l.windowBounds().top;
      left    = spriteBounds.left == 0;

      // Then measure against the collidable elements
      l.collidables().each(function(){
        // Bounds of the collidable
        var objectBounds = {
          top: $(this).offset().top,
          right: $(this).offset().left + $(this).width(),
          bottom: $(this).offset().top + $(this).height(),
          left: $(this).offset().left
        }

        if ((spriteBounds.top == objectBounds.bottom) && (spriteBounds.right > objectBounds.left) && (spriteBounds.left < objectBounds.right)) { top    = $(this); }
        if ((spriteBounds.right == objectBounds.left) && (spriteBounds.bottom > objectBounds.top) && (spriteBounds.top < objectBounds.bottom)) { right  = $(this); }
        if ((spriteBounds.bottom == objectBounds.top) && (spriteBounds.right > objectBounds.left) && (spriteBounds.left < objectBounds.right)) { bottom = $(this); }
        if ((spriteBounds.left == objectBounds.right) && (spriteBounds.bottom > objectBounds.top) && (spriteBounds.top < objectBounds.bottom)) { left   = $(this); }
      });

      l.adjacents.top = top;
      l.adjacents.right = right;
      l.adjacents.bottom = bottom;
      l.adjacents.left = left;
    }
    
    // Tell the lemming which action to perform and direction to move
    l.move = function(action) {
      l.climbing = false;
      if (action == 'walk_r' || action == 'walk_l') {
        l.setMovement(action, 8);
        l.movement = setTimeout(function(){
          l.sprite.offset({ left: l.sprite.offset().left + (l.direction == 'r' ? 1 : -1) });
          if (l.moving) { l.go(); }
        }, 50);
      } else if (action == 'fall_r' || action == 'fall_l') {
        l.setMovement(action, 4);
        l.movement = setTimeout(function(){
          l.sprite.offset({ top: l.sprite.offset().top + 1 });
          if (l.moving) { l.go(); }
        }, 15);
      } else if (action == 'climb_r' || action == 'climb_l') {
        l.climbing = true;
        l.setMovement(action, 8);
        l.movement = setTimeout(function(){
          l.sprite.offset({ top: l.sprite.offset().top - 1 });
          if (l.moving) { l.go(); }
        }, 75);
      }
    }
    
    // Stop and reset ALL animation/movement
    l.stop = function() {
      l.moving = false;
      if (l.movement) { setTimeout(l.movement); delete l.movement; }
      if (l.animation) { clearInterval(l.animation); delete l.animation; }
      l.backgroundPosition = 0;
      l.sprite.get(0).style.backgroundPosition = l.getBackgroundPosition();
    }
    
    // Begin moving
    l.go = function() {
      l.moving = true;
      l.calculateCollisions();
      
      if (l.adjacents.bottom && !l.adjacents.left && l.adjacents.right && l.direction == 'r') {
        if (l.offset == ((32 - Lemming.dimensions[l.action.slice(0,4)][0]) / 2)) {
          l.move('climb_' + l.direction);
        } else {
          setTimeout(function(){
            l.offset = l.offset + 1; l.backgroundPosition = l.backgroundPosition + 1; l.go();
          }, (Lemming.options.speed / 2));
        }
      } else if (!l.adjacents.bottom && (l.adjacents.right || l.adjacents.left) && l.adjacents.top) {
        l.direction = (l.direction == 'r' ? 'l' : 'r');
        l.move('fall_' + l.direction);
      } else if (l.adjacents.right && l.direction == 'r') {
        l.move('climb_' + l.direction);
      } else if (l.adjacents.left && l.direction == 'l') {
        l.move('climb_' + l.direction);
      } else if (!l.adjacents.bottom && l.climbing && l.direction == 'l') {
        l.backgroundPosition = (l.backgroundPosition + (32 - Lemming.dimensions.walk[0]));
        l.offset = ((32 - Lemming.dimensions.walk[0]) / 2);
        l.move('walk_' + l.direction);
      } else if (!l.adjacents.bottom && l.climbing && l.direction == 'r') {
        var adjustment = (32 - Lemming.dimensions.walk[0]);
        l.backgroundPosition = (l.backgroundPosition - adjustment);
        // l.sprite.offset({ left: l.sprite.offset().left + adjustment });
        l.offset = -(adjustment / 2);
        l.move('walk_' + l.direction);
      } else if (!l.adjacents.bottom) {
        l.move('fall_' + l.direction);
      } else if (l.adjacents.bottom && !l.adjacents.left && l.direction == 'l') {
        l.move('walk_' + l.direction);
      } else if (l.adjacents.bottom && !l.adjacents.right && l.direction == 'r' ) {
        l.move('walk_' + l.direction);
      } else if (!l.adjacents.any()) {
        l.move('fall_' + l.direction);
      } else {
        throw "WTF!";
      }
    }
    
    // Change direction
    l.reverse = function() {
      l.stop(); l.direction = (l.direction == 'r' ? 'l' : 'r');
      setTimeout(function(){
        l.start();
      }, 100);
    }
    
    // Trigger the animation and movement
    l.start = function() {
      l.animate(); l.go();
    }
    
    // Delete an individual lemming
    l.destroy = function() {
      Lemming.lemmings.splice(l);
      l.sprite.remove();
      return true;
    }

  }
  
});