import { useState } from 'react'
import { FiEye } from 'react-icons/fi'
import './ImageViewer.css'

const ImageViewer = ({ src, alt = 'Image', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)

  if (!src) return null

  const handleOpen = () => {
    setIsOpen(true)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <>
      <div className={`image-viewer-wrapper ${className}`} onClick={handleOpen}>
        <img src={src} alt={alt} className="image-viewer-thumbnail" />
        <div className="image-viewer-overlay">
          <FiEye className="image-viewer-icon" />
        </div>
      </div>

      {isOpen && (
        <div className="image-viewer-modal" onClick={handleClose}>
          <div className="image-viewer-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-viewer-close" onClick={handleClose}>
              ×
            </button>
            <img src={src} alt={alt} className="image-viewer-full" />
          </div>
        </div>
      )}
    </>
  )
}

export default ImageViewer

