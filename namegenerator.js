/* jshint node: true */
'use strict';

var _ = require('lodash');

function randomWord(len)
{
  var lowercase = "abcdefghijklmnopqrstuvwxyz";
  var retval = '';
  for (var i=0; i < len; i++) {
    retval += lowercase.charAt(Math.floor(Math.random() * lowercase.length));  	
  }
  return retval;
}

// Generate a random lowercase name of one to four parts deliminated by underscores
// one word is randomized and verified to not be in the reserved list
var generateRandomName = function() {
 var reservedWords =  [ 'about', 'above', 'absolute', 'across', 'adv', 'after', 'against', 'ajax', 'align', 'aligned', 'along', 'among', 'animation', 'array', 'as', 'at', 'back', 'background', 'before', 'behind', 'below', 'beneath', 'beside', 'besides', 'between', 'beyond', 'big', 'blob', 'block', 'border', 'bot', 'bottom', 'box', 'bright', 'browser', 'but', 'button', 'by', 'check', 'child', 'circle', 'close', 'code', 'color', 'commit', 'compare', 'compose', 'composer', 'cursor', 'dark', 'decor', 'decoration', 'disable', 'disabled', 'discussion', 'display', 'down', 'dropdown', 'dull', 'during', 'edit', 'email', 'empty', 'enable', 'enabled', 'error', 'except', 'exclude', 'explorer', 'face', 'file', 'first', 'flash', 'follow', 'font', 'footer', 'for', 'foreground', 'frame', 'from', 'front', 'full', 'giant', 'global', 'gradient', 'head', 'header', 'hidden', 'horizontal', 'hover', 'icon', 'ignored', 'image', 'in', 'info', 'input', 'inside', 'into', 'invis', 'invisible', 'img', 'image', 'important', 'is', 'item', 'key', 'left', 'light', 'like', 'line', 'linear', 'link', 'list', 'load', 'loader', 'local', 'lock', 'locked', 'mail', 'main', 'margin', 'max', 'menu', 'merge', 'meta', 'mid', 'middle', 'min', 'mini', 'minus', 'mega', 'modified', 'mouse', 'mouseover', 'moz', 'mozilla', 'name', 'nav', 'near', 'nest', 'none', 'of', 'off', 'on', 'onto', 'opacity', 'opaque', 'open', 'opposite', 'out', 'outside', 'over', 'padding', 'parent', 'past', 'per', 'plus', 'pointer', 'post', 'pre', 'press', 'pressed', 'preview', 'progress', 'px', 'radial', 'radius', 'rectangle', 'regarding', 'rel', 'relative', 'repeat', 'request', 'res', 'resolution', 'result', 'retval', 'review', 'right', 'round', 'save', 'screen', 'search', 'second', 'select', 'selected', 'sharp', 'side', 'since', 'size', 'small', 'smooth', 'solid', 'sort', 'sorted', 'span', 'square', 'status', 'sunken', 'tab', 'table', 'text', 'textarea', 'td', 'td', 'than', 'third', 'thread', 'through', 'time', 'timeline', 'tiny', 'to', 'topic', 'tool', 'top', 'touch', 'toward', 'towards', 'tr', 'translate', 'transparent', 'trim', 'trimmed', 'truncate', 'truncated', 'under', 'underneath', 'unlike', 'until', 'up', 'upon', 'url', 'value', 'vertical', 'via', 'visit', 'visited', 'webkit', 'weight', 'width', 'with', 'within', 'without', 'white', 'black', 'red', 'orange', 'green', 'cyan', 'blue', 'yellow', 'purple', 'violet', 'gray', 'grey', 'silver', 'gold', 'popup', 'popunder', 'print', 'center', 'type', 'sheet', 'html', 'inline', 'offset', 'internal', 'external', 'div', 'upper', 'lower', 'space', 'spacing', 'shadow', 'transform', 'unicode', 'variant' ];
  var parts = Math.floor((Math.random() * 4) + 1); // 1 to 4 parts in a name
  var isRandom = Math.floor((Math.random() * parts) + 1);
  var name = '';
  for (var i=1; i<=parts; i++) {
  	var add;
  	if (i === isRandom) {
  		do {
  			var randomLength = Math.floor(Math.random() * 11);
  			if (randomLength < 6) randomLength += 5; // 5 to 10 length
	  		add = randomWord(randomLength);
  		}
  		while (_.contains(reservedWords, add)); // try again if random word is a reserved word
  	}
  	else {
  		add = reservedWords[Math.floor(Math.random() * reservedWords.length)];
  	}
  	if (i === 1) {
  		name += add;
  	}
  	else {
  		name += '_' + add;
  	}
  }
  return name;
};

module.exports = {
  generateRandomName: generateRandomName
};