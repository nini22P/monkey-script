const div = document.getElementsByClassName('product-actions-body')[0]
const button = document.createElement('a')
button.textContent = 'Go to gog-game.to'
button.target = '_blank'
button.className = 'button button--big'
button.style.marginTop = '1rem'
button.href = `https://gog-games.to/game/${window.location.pathname.split('/game/')[1]}`
div.appendChild(button)
