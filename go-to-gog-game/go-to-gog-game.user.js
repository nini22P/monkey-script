// ==UserScript==
// @name         Go to gog-game
// @namespace    https://github.com/nini22P/monkey-script/tree/main/go-to-gog-game
// @version      2024-06-18
// @description  Go to gog-game | 跳转到 gog-game
// @author       22
// @match        https://www.gog.com/*/game/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gog.com
// @grant        none
// @license MIT
// @downloadURL  https://github.com/nini22P/monkey-script/raw/refs/heads/main/go-to-gog-game/go-to-gog-game.user.js
// @updateURL    https://github.com/nini22P/monkey-script/raw/refs/heads/main/go-to-gog-game/go-to-gog-game.user.js
// ==/UserScript==

(function () {
  'use strict';
  const div = document.getElementsByClassName('product-actions-body')[0]
  const button = document.createElement('a')
  button.textContent = 'Go to gog-game.to'
  button.target = '_blank'
  button.className = 'button button--big'
  button.style.marginTop = '1rem'
  button.href = `https://gog-games.to/game/${window.location.pathname.split('/game/')[1]}`
  div.appendChild(button)
})();