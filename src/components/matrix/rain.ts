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

class Rain {
  /** 全部可能出现的字符 */
  private readonly allWords: Word[] = '0123456789qwertyuiopasdfghjklzxcvbnm'.split('').map(str => {
    return {
      alpha: 1,
      color: '#43c728',
      text: str
    }
  })
  /** 空白占位元素 */
  private readonly emptyEle = produce(this.allWords[0], word => {
    word.alpha = 0
  })
  /** 每列最多放多少字符 */
  private wordPerLine = this.allWords.length
  /** 最小空白长度 */
  private minEmptyLength = 0
  /** 最小句子长度 */
  private minSentenceLength = 0
  /** 滚动池 */
  private pool: Line[] = []
  /** 画布话柄 */
  private context: CanvasRenderingContext2D

  constructor (
    /** 画布 */
    private readonly canvas: HTMLCanvasElement,
    /** 字符大小 */
    private readonly fontSize = 24,
    /** 空白方位 */
    private readonly emptyRange = 0.2,
  ) {
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error("not support canvas")
    }

    this.context = context

    context.shadowColor = '#94f475'
    context.textBaseline = 'top'

    window.addEventListener('resize', this.resize.bind(this))
    this.resize()

    this.drawFrame()
  }

  /** 清空画布 */
  private clear () {
    this.context.globalAlpha = 1

    this.context.font = `${this.fontSize}px MatrixCode`
    this.context.fillStyle = '#000'
    this.context.shadowOffsetX = this.context.shadowOffsetY = 0
    this.context.shadowBlur = 2

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /** 监听画布大小变化 */
  private resize () {
    this.canvas.width = this.canvas.clientWidth
    this.canvas.height = this.canvas.clientHeight

    this.wordPerLine = Math.floor(this.canvas.height / this.fontSize) + 1
    this.minEmptyLength = Math.floor(this.wordPerLine * this.emptyRange)
    this.minSentenceLength = Math.floor(this.wordPerLine * (1 - this.emptyRange))

    this.pool = this.preparePool(this.canvas, this.pool)
  }

  /** 补全弹幕池 */
  private preparePool<T extends Line[]> (canvas: HTMLCanvasElement, data: T): T {
    const lastEle = data[data.length - 1]
    let offset = !lastEle ? 0 : lastEle.x
    const width = canvas.width

    let line: Line
    const push = (data: Line[]) => { data.push(line) }

    while (offset < width) {
      const isEmpty = Math.random() < this.emptyRange
      line = {
        x: offset,
        y: 0,
        speed: randSpeed(),
        lastEmptyCount: isEmpty ? 1 : 0,
        words: [this.emptyEle]
      }

      data = produce(data, push)

      offset += this.fontSize
    }

    return data
  }

  /** 列绘制 */
  private drawLine (line: Line) {
    const { x, y, words } = line
    words.forEach((word, index) => {
      this.context.fillStyle = word.color
      this.context.globalAlpha = word.alpha
      this.context.fillText(word.text, x, this.fontSize * index + y)
    })
  }

  /** 帧绘制 */
  private drawFrame () {
    this.pool = produce(this.pool, pool => {
      pool.forEach(line => {
        /**
         * 填充原则：
         * 1. line的 y轴起点必须 大于 -fontSize, 否则不填充
         * 2. 假设第一个是空白，则不少于 minEmptyLength 个空格才可以填充
         * 3. 假设第一个不是空白，按照 emptyRange 来决定填充
         * 4. 如果可以填充，填充对象是一个长度不小于 wordPerLine * (1 - emptyRange) 的句子
         */

        line.y += line.speed
        const rand = randInt(line.words.length)
        line.words[rand].text = randWord(this.allWords).text

         if (line.y < -this.fontSize) {
           return
         }

        const shouldEmpty = Math.random() < this.emptyRange
        if (
          (line.lastEmptyCount > 0 && randInt(line.lastEmptyCount) < this.minEmptyLength) ||
          (line.lastEmptyCount === 0 && shouldEmpty)
        ) {
          line.lastEmptyCount += 1
          line.words.unshift(this.emptyEle)
          line.y -= this.fontSize
        } else {
          line.lastEmptyCount = 0
          const sentence = produce(randSentence(this.allWords, this.minSentenceLength, this.wordPerLine / 1.4), sentence => {
            sentence[sentence.length - 1].color = '#cefbe4'
          })
          line.y -= sentence.length * this.fontSize
          line.words = sentence.concat(line.words)
        }

        if (line.words.length > this.wordPerLine * 3) {
          line.words = line.words.slice(0, this.wordPerLine * 2)
        }
      })
    })

    this.clear()
    this.pool.forEach(line => this.drawLine(line))

    requestAnimationFrame(this.drawFrame.bind(this))
  }
}

export default Rain
