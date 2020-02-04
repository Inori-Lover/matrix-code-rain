import React, { NamedExoticComponent, memo, useEffect, useRef, useMemo, useState, useCallback } from 'react'
import nanoid from 'nanoid/non-secure'
import classnames from 'clsx'
import fontfaceonload from 'fontfaceonload'

import rain from './rain'
import styles from './index.module.scss'

interface Props {
  className?: string
}
const Matrix: NamedExoticComponent<Props> = memo(({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasID = useMemo(() => nanoid(), [])
  const [fontReady, setFontReady] = useState(false)

  useEffect(() => {
    fontfaceonload('MatrixCode', {
      success: () => {
        setFontReady(true)
      }
    })
  }, [setFontReady])

  useEffect(() => {
    if (!fontReady) {
      return
    }

    const canvasNode = canvasRef.current
    if (!canvasNode) {
      console.error(new Error('dont support canvas'))
      return
    }

    try {
      rain(canvasNode)
    } catch (e) {
      console.error(e)
    }

  }, [fontReady])

  return (
    <>
      <div className={classnames(fontReady && styles.canvas)}>className</div>
      <canvas
        className={classnames(
          className,
          styles.canvas,
        )}
        id={canvasID}
        key={canvasID}
        ref={canvasRef}
      />
    </>
  )
})

export { Matrix }
export default Matrix
