const fontSize = 24
const aFrame = 1000 / 24

function randInt (max: number) {
  return Math.floor(Math.random() * max)
}

function shuffle (arr: any[]) {
  const length = arr.length
  const result = arr.slice(0)
  let temp = result[0]
  for (let i = length - 1; i > 0; i--) {
    const rand = randInt(i + 1)
    temp = result[i]
    result[i] = result[rand]
    result[rand] = temp
  }

  return result
}

interface Word {
  alpha: number
  color: '#cefbe4' | '#54d13c' | '#43c728'
  text: string
}

interface Line {
  x: number
  y: number
  fixed: boolean
  activeIndex: number
  words: Word[]
}

const allWords: Word[] = '0123456789qwertyuiopasdfghjklzxcvbnm'.split('').map(str => {
  return {
    alpha: 1,
    color: '#cefbe4',
    text: str
  }
})
let wordPerLine = allWords.length
let cloud: Line[] = []

function drawLine (context: CanvasRenderingContext2D, line: Line) {
  const { x, y, fixed, words } = line
  words.forEach((word, index) => {
    context.fillStyle = word.color
    context.globalAlpha = word.alpha
    context.fillText(word.text, x, fontSize * index + y)
  })
}
function getCanvasClear (context: CanvasRenderingContext2D, width: number, height: number) {
  return () => {
    context.fillStyle = '#000'
    context.clearRect(0, 0, width, height)
    context.fillRect(0, 0, width, height)
  }
}
function drawFrame (context: CanvasRenderingContext2D, cloud: Line[], clearCanvas: () => void) {
  cloud = cloud.map(line => {
    if (line.activeIndex >= wordPerLine) {
      line.activeIndex = 0
    } else {
      line.activeIndex += 1
    }
    const secondHighlight = line.activeIndex - 1
    line.words.forEach((word, index) => {
      if (index === secondHighlight) {
        word.color = '#cefbe4'
      } else if (index === line.activeIndex) {
        word.color = '#54d13c'
      } else {
        word.color = '#43c728'
      }
    })
    return line
  })

  clearCanvas()
  cloud.forEach(line => drawLine(context, line))

  setTimeout(() => drawFrame(context, cloud, clearCanvas), aFrame)
}

function rain (canvas: HTMLCanvasElement) {
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight

  wordPerLine = Math.floor(canvas.height / fontSize) + 1

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error("not support canvas")
  }

  const clearFunc = getCanvasClear(context, canvas.width, canvas.height)
  context.globalAlpha = 1
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.shadowOffsetX = context.shadowOffsetY = 0
  context.shadowBlur = 2
  context.shadowColor = '#94f475'
  context.fillStyle = '#cefbe4'
  context.textBaseline = 'top'
  context.font = `${fontSize}px MatrixCode`

  let offset = 0
  const width = canvas.width

  while (offset < width) {
    cloud.push({
      x: offset,
      y: randInt(60),
      activeIndex: randInt(10),
      fixed: Math.random() > 0.7,
      words: shuffle(allWords)
    })

    offset += fontSize
  }

  drawFrame(context, cloud, clearFunc)
}

export default rain
