import { X } from 'lucide-react'

interface ImageModalProps {
  src: string
  alt: string
  onClose: () => void
}

export function ImageModal({ src, alt, onClose }: ImageModalProps) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}