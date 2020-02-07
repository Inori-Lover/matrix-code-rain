/**
 * 怎样做出rain的效果
 *
 * 1. 一个弹幕池
 * 2. 通过随机填充空白字符的形式形成断句
 * 3. 填充字符后检查长度是否已经超过，如果已经超过就是用splice裁剪数组，避免无谓的渲染
 * 4. 填充字符后需要将y轴的偏移减去字符高度
 */
import produce from 'immer'

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
  return Math.random() * 3 + 2
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

const fontSize = 24
const emptyRange = 0.2

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
let minEmptyLength = 0
let minSentenceLength = 0
let pool: Line[] = []

function getCanvasClear (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  // 这里未使用debonce等限流手段，因为感觉比起绘制作业，这里作业的成本太低了无需特意处理
  return () => {
    context.globalAlpha = 1

    context.font = `${fontSize}px MatrixCode`
    context.fillStyle = '#000'
    context.shadowOffsetX = context.shadowOffsetY = 0
    context.shadowBlur = 2

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
}

function getCanvasResize (canvas: HTMLCanvasElement): () => void {
  return () => {
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    wordPerLine = Math.floor(canvas.height / fontSize) + 1
    minEmptyLength = Math.floor(wordPerLine * emptyRange)
    minSentenceLength = Math.floor(wordPerLine * (1 - emptyRange))

    pool = preparePool(canvas, pool)
  }
}

function preparePool<T extends typeof pool> (canvas: HTMLCanvasElement, data: T): T {
  const lastEle = data[data.length - 1]
  let offset = !lastEle ? 0 : lastEle.x
  const width = canvas.width

  let line: Line
  const push = (data: Line[]) => { data.push(line) }

  while (offset < width) {
    const isEmpty = Math.random() < emptyRange
    line = {
      x: offset,
      y: 0,
      speed: randSpeed(),
      lastEmptyCount: isEmpty ? 1 : 0,
      words: [emptyEle]
    }

    data = produce(data, push)

    offset += fontSize
  }

  return data
}

function drawLine (context: CanvasRenderingContext2D, line: Line) {
  const { x, y, words } = line
  words.forEach((word, index) => {
    context.fillStyle = word.color
    context.globalAlpha = word.alpha
    context.fillText(word.text, x, fontSize * index + y)
  })
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
      if (Math.random() < 0.8) {
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
  const resizer = getCanvasResize(canvas)
  window.addEventListener('resize', resizer)

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error("not support canvas")
  }

  // 设置画布属性
  const clearFunc = getCanvasClear(context, canvas)
  context.shadowColor = '#94f475'
  context.textBaseline = 'top'

  resizer()

  drawFrame(context, pool, clearFunc)
}

export default rain
