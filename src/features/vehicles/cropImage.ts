import type { Area } from 'react-easy-crop'

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', () => reject(new Error('Failed to load image for cropping')))
    image.crossOrigin = 'anonymous'
    image.src = src
  })
}

/** Renders the selected crop region to a JPEG file for upload. */
export async function cropImageToFile(imageSrc: string, pixelCrop: Area, fileName = 'vehicle-photo.jpg') {
  const image = await loadImage(imageSrc)
  const canvas = document.createElement('canvas')
  const width = Math.max(1, Math.round(pixelCrop.width))
  const height = Math.max(1, Math.round(pixelCrop.height))
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not crop image')

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height,
  )

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result)
        else reject(new Error('Could not encode cropped image'))
      },
      'image/jpeg',
      0.92,
    )
  })

  return new File([blob], fileName, { type: 'image/jpeg' })
}
