"use client"

import * as React from "react"
import Cropper from "react-easy-crop"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import getCroppedImg from "@/lib/crop-utils"

interface ImageCropperProps {
  image: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCropComplete: (croppedImage: Blob) => void
  aspect?: number
}

export function ImageCropper({
  image,
  open,
  onOpenChange,
  onCropComplete,
  aspect = 1,
}: ImageCropperProps) {
  const [crop, setCrop] = React.useState({ x: 0, y: 0 })
  const [zoom, setZoom] = React.useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<any>(null)

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop)
  }

  const onZoomChange = (zoom: number) => {
    setZoom(zoom)
  }

  const onCropCompleteInternal = React.useCallback(
    (_croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleConfirm = async () => {
    if (!image || !croppedAreaPixels) return
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels)
      onCropComplete(croppedBlob)
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[500px] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tight">Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="relative flex-1 bg-slate-100 m-6 rounded-3xl overflow-hidden border border-slate-200">
          {image && (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={onCropChange}
              onCropComplete={onCropCompleteInternal}
              onZoomChange={onZoomChange}
              cropShape="round"
              showGrid={false}
            />
          )}
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-indigo-600"
            />
          </div>
          
          <div className="flex gap-3">
             <Button 
               variant="outline" 
               className="flex-1 rounded-xl font-bold border-slate-200"
               onClick={() => onOpenChange(false)}
             >
               Cancel
             </Button>
             <Button 
               className="flex-1 rounded-xl font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20"
               onClick={handleConfirm}
             >
               Apply Crop
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
