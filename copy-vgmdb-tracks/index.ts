const createCopyButton = (tracklistIndex: number, discIndex: number): HTMLButtonElement => {
  const button = document.createElement('button')
  button.innerText = 'COPY'
  button.style.margin = '0 10px'
  button.style.color = '#CEFFFF'
  button.style.background = 'transparent'
  button.style.border = '1px solid #CEFFFF'
  button.style.cursor = 'pointer'
  button.style.transition = 'background 0.3s, color 0.3s'

  button.onmouseover = () => {
    button.style.background = '#CEFFFF'
    button.style.color = '#000000'
  }

  button.onmouseout = () => {
    button.style.background = 'transparent'
    button.style.color = '#CEFFFF'
  }

  button.onmousedown = () => {
    button.style.transform = 'scale(0.95)'
  }

  button.onmouseup = () => {
    button.style.transform = 'scale(1)'
  }

  button.onclick = () => {
    const tracklistElement = document.querySelectorAll('.tl')[tracklistIndex].querySelectorAll('table')[discIndex]
    const rows = tracklistElement.querySelectorAll('tr')
    let tracklistText: string[] = []

    rows.forEach(row => {
      const trackNameCell = row.querySelector<HTMLTableCellElement>('td:nth-child(2)')
      if (trackNameCell) {
        if (trackNameCell.innerText.trim().length === 0) return
        if (['A-Side', 'B-Side'].includes(trackNameCell.innerText.trim())) return
        tracklistText = [...tracklistText, trackNameCell.innerText.trim()]
      }
    })

    navigator.clipboard.writeText(tracklistText.join('\n'))
  }

  return button
}

const tracklists = document.querySelectorAll('.tl')

tracklists.forEach((tracklist, tracklistIndex) => {
  const discs = tracklist.querySelectorAll('span b')
  discs.forEach((title, discIndex) => {
    if (title) {
      const copyButton = createCopyButton(tracklistIndex, discIndex)
      title.appendChild(copyButton)
    }
  })
})
