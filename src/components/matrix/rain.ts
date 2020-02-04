function drawLine (x: number, fixed: boolean, content: string) {
  //
}

function drawFrame () {
  //
}

function rain (canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error("not support canvas")
  }

  // context.globalAlpha = 0
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.shadowOffsetX = context.shadowOffsetY = 0
  context.shadowBlur = 8
  context.shadowColor = '#94f475'
  context.fillStyle = '#cefbe4'
  context.textBaseline = 'top'
  // context.textAlign = 'center'
  context.font = '14px MatrixCode'
  // context.fillText('0123456789qwertyuiopasdfghjklzxcvbnm', 10, 10)
  context.fillText('className', 0, 40)
}

export default rain
