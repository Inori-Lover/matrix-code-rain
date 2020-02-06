/**
 * 怎样做出rain的效果
 *
 * 1. 一个弹幕池
 * 2. 通过随机填充空白字符的形式形成断句
 * 3. 填充字符后检查长度是否已经超过，如果已经超过就是用splice裁剪数组，避免无谓的渲染
 * 4. 填充字符后需要将y轴的偏移减去字符高度
 */
import produce from 'immer'

const fontSize = 24
const emptyRange = 0.2

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

function randSpeed () {
  return Math.random() * 3 + 1
}

function randInt (max: number, min = 0) {
  min = Math.floor(min)
  max = Math.floor(max - min)
  return Math.floor(Math.random() * max) + min
}

function randWord<T extends any> (arr: T[]): T {
  return arr[randInt(arr.length - 1)]
}

function randSentence<T extends any> (arr: T[], min: number, max: number): T[] {
  const length = randInt(max, min)


  return shuffle(arr).slice(0, length)
}

interface Word {
  alpha: number
  color: '#cefbe4' | '#54d13c' | '#43c728'
  text: string
}

interface Line {
  x: number
  y: number
  speed: number
  lastEmptyCount: number
  words: Word[]
}

const allWords: Word[] = '0123456789qwertyuiopasdfghjklzxcvbnm'.split('').map(str => {
  return {
    alpha: 1,
    color: '#43c728',
    text: str
  }
})
const emptyEle = produce(allWords[0], word => {
  word.alpha = 0
})
let wordPerLine = allWords.length
const minEmptyLength = Math.floor(wordPerLine * emptyRange)
const minSentenceLength = Math.floor(wordPerLine * (1 - emptyRange))
let pool: Line[] = []

function drawLine (context: CanvasRenderingContext2D, line: Line) {
  const { x, y, words } = line
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
  cloud = produce(cloud, cloud => {
    cloud.forEach(line => {
      /**
       * 填充原则：
       * 1. line的 y轴起点必须 大于 -fontSize, 否则不填充
       * 2. 假设第一个是空白，则不少于 minEmptyLength 个空格才可以填充
       * 3. 假设第一个不是空白，按照 emptyRange 来决定填充
       * 4. 如果可以填充，填充对象是一个长度不小于 wordPerLine * (1 - emptyRange) 的句子
       */

      line.y += line.speed
      if (randInt(10) > 5) {
        const rand = randInt(line.words.length)
        line.words[rand].text = randWord(allWords).text
      }

       if (line.y < -fontSize) {
         return
       }

      const shouldEmpty = Math.random() < emptyRange
      if (
        (line.lastEmptyCount > 0 && randInt(line.lastEmptyCount) < minEmptyLength) ||
        (line.lastEmptyCount === 0 && shouldEmpty)
      ) {
        line.lastEmptyCount += 1
        line.words.unshift(emptyEle)
        line.y -= fontSize
      } else {
        line.lastEmptyCount = 0
        const sentence = produce(randSentence(allWords, minSentenceLength, wordPerLine / 1.4), sentence => {
          sentence[sentence.length - 1].color = '#cefbe4'
        })
        line.y -= sentence.length * fontSize
        line.words = sentence.concat(line.words)
      }

      if (line.words.length > wordPerLine * 3) {
        line.words = line.words.slice(0, wordPerLine * 2)
      }
    })
  })

  clearCanvas()
  cloud.forEach(line => drawLine(context, line))

  requestAnimationFrame(() => drawFrame(context, cloud, clearCanvas))
}

function rain (canvas: HTMLCanvasElement) {
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight

  wordPerLine = Math.floor(canvas.height / fontSize) + 1

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error("not support canvas")
  }

  // 设置画布属性
  const clearFunc = getCanvasClear(context, canvas.width, canvas.height)
  context.globalAlpha = 1
  context.shadowOffsetX = context.shadowOffsetY = 0
  context.shadowBlur = 2
  context.shadowColor = '#94f475'
  context.fillStyle = '#cefbe4'
  context.textBaseline = 'top'
  context.font = `${fontSize}px MatrixCode`

  // 填充初始数据
  let offset = 0
  const width = canvas.width

  let line
  while (offset < width) {
    const isEmpty = Math.random() < emptyRange
    line = {
      x: offset,
      y: 0,
      speed: randSpeed(),
      lastEmptyCount: isEmpty ? 1 : 0,
      words: [emptyEle]
    }

    pool.push(line)

    offset += fontSize
  }

  drawFrame(context, pool, clearFunc)
}

export default rain
