import { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { resolveVehiclePhotoUrl } from './vehiclesApi'

type VehiclePhotoProps = {
  photoPath: string | null | undefined
  nickname: string
  /** Max height while preserving the image's natural aspect ratio. */
  maxHeight?: number | string
  width?: number | string
}

export function VehiclePhoto({
  photoPath,
  nickname,
  maxHeight = 360,
  width = '100%',
}: VehiclePhotoProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setPhotoUrl(null)

    resolveVehiclePhotoUrl(photoPath)
      .then((url) => {
        if (isMounted) setPhotoUrl(url)
      })
      .catch(() => {
        if (isMounted) setPhotoUrl(null)
      })

    return () => {
      isMounted = false
    }
  }, [photoPath])

  if (!photoUrl) return null

  return (
    <Box
      sx={{
        width,
        maxHeight,
        borderRadius: 1,
        bgcolor: 'action.hover',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        component="img"
        src={photoUrl}
        alt={nickname}
        sx={{
          display: 'block',
          width: '100%',
          height: 'auto',
          maxHeight,
          objectFit: 'contain',
        }}
      />
    </Box>
  )
}

/** Fixed-frame thumbnail that letterboxes instead of cropping or stretching. */
export function VehiclePhotoThumb({
  src,
  alt,
  width = 120,
  height = 90,
}: {
  src: string
  alt: string
  width?: number
  height?: number
}) {
  return (
    <Box
      sx={{
        width,
        height,
        flexShrink: 0,
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'action.hover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </Box>
  )
}
