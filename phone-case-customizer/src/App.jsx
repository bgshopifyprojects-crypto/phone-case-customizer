import { useState, useRef, useEffect } from 'react'
import './App.css'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'

function App() {
  // Get frame URL and theme color from liquid template data attributes
  const frameUrl = document.getElementById('phone-case-root')?.dataset?.frameUrl || '/phone-case-frame.png'
  const designsUrl = document.getElementById('phone-case-root')?.dataset?.designsUrl || '/assets/designs.json'
  const initialThemeColor = document.getElementById('phone-case-root')?.dataset?.themeColor || '#00a8e8'
  const productPrice = document.getElementById('phone-case-root')?.dataset?.productPrice || ''
  const productComparePrice = document.getElementById('phone-case-root')?.dataset?.productComparePrice || ''
  
  // State for theme color (can be updated from admin settings)
  const [themeColor, setThemeColor] = useState(initialThemeColor)
  
  // Fetch admin theme color settings on mount
  useEffect(() => {
    const settingsUrl = window.location.origin + '/apps/customizer/get-settings'
    
    fetch(settingsUrl)
      .then(response => response.json())
      .then(data => {
        if (data.themeColor) {
          console.log('Theme color loaded from admin settings:', data.themeColor)
          setThemeColor(data.themeColor)
        }
      })
      .catch(error => {
        console.log('Using default theme color from block settings', error)
      })
  }, [])
  
  // Extract base asset URL from frameUrl (e.g., "https://cdn.shopify.com/.../assets/")
  const baseAssetUrl = frameUrl.substring(0, frameUrl.lastIndexOf('/') + 1)
  
  // Apply theme color as CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', themeColor)
    
    // Generate lighter and darker variations
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null
    }
    
    const rgb = hexToRgb(themeColor)
    if (rgb) {
      // Lighter version for backgrounds (20% opacity)
      document.documentElement.style.setProperty('--theme-color-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`)
      // Even lighter for hover backgrounds (10% opacity)
      document.documentElement.style.setProperty('--theme-color-hover-bg', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`)
      // Darker version for hover states
      const darkerR = Math.max(0, rgb.r - 20)
      const darkerG = Math.max(0, rgb.g - 20)
      const darkerB = Math.max(0, rgb.b - 20)
      document.documentElement.style.setProperty('--theme-color-dark', `rgb(${darkerR}, ${darkerG}, ${darkerB})`)
    }
  }, [themeColor])
  const [uploadedImages, setUploadedImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [placedImages, setPlacedImages] = useState([])
  const [placedTexts, setPlacedTexts] = useState([])
  const [allLayers, setAllLayers] = useState([]) // Unified layer order
  const [activeImageId, setActiveImageId] = useState(null)
  const [activeTextId, setActiveTextId] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [activeTab, setActiveTab] = useState('images') // 'images', 'assets', 'text', 'qr', or 'layers'
  const [textInput, setTextInput] = useState('')
  const [qrInput, setQrInput] = useState('') // QR code input text
  const [qrColor, setQrColor] = useState('#000000') // QR code color
  const [qrBgColor, setQrBgColor] = useState('#FFFFFF') // QR background color
  const [activeQrColorPicker, setActiveQrColorPicker] = useState('qr') // 'qr' or 'bg' - which color is being edited
  const [imageSubTab, setImageSubTab] = useState('upload') // 'upload' or 'qr' for images tab
  const [history, setHistory] = useState([]) // History stack for undo/redo
  const [historyIndex, setHistoryIndex] = useState(-1) // Current position in history
  const [justFinishedManipulation, setJustFinishedManipulation] = useState(false)
  const [textEditMode, setTextEditMode] = useState('main') // 'main', 'font', 'color', 'format', 'edit', 'size'
  const [textColorTab, setTextColorTab] = useState('fill') // 'fill' or 'shadow' for text
  const [textColorHue, setTextColorHue] = useState(0)
  const [textColorSaturation, setTextColorSaturation] = useState(0)
  const [textColorLightness, setTextColorLightness] = useState(0)
  const [textOpacity, setTextOpacity] = useState(1)
  const [textShadowColor, setTextShadowColor] = useState('#000000')
  const [textShadowHue, setTextShadowHue] = useState(0)
  const [textShadowSaturation, setTextShadowSaturation] = useState(0)
  const [textShadowLightness, setTextShadowLightness] = useState(0)
  const [textLineHeight, setTextLineHeight] = useState(1)
  const [textLetterSpacing, setTextLetterSpacing] = useState(0)
  const [assetCategory, setAssetCategory] = useState('all')
  const [loadedAssets, setLoadedAssets] = useState([]) // Assets loaded from designs.json
  const [assetViewMode, setAssetViewMode] = useState('categories') // 'categories' or 'images'
  const [selectedCategory, setSelectedCategory] = useState(null) // Currently selected category
  const [searchQuery, setSearchQuery] = useState('') // Search query for filtering
  const [draggedLayerIndex, setDraggedLayerIndex] = useState(null)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false)
  const [isMultiTouch, setIsMultiTouch] = useState(false)
  const [imageEditMode, setImageEditMode] = useState('main') // 'main', 'color', 'transform', 'position', 'reset'
  const [imageColorTab, setImageColorTab] = useState('fill') // 'fill' or 'shadow'
  const [imageColor, setImageColor] = useState('#000000')
  const [imageOpacity, setImageOpacity] = useState(1)
  const [textColor, setTextColor] = useState('original') // Track text color filter
  const [shadowColor, setShadowColor] = useState('#faadad')
  const [shadowHue, setShadowHue] = useState(0)
  const [shadowSaturation, setShadowSaturation] = useState(100)
  const [shadowLightness, setShadowLightness] = useState(85)
  const [transformRotate, setTransformRotate] = useState(0)
  const [transformScaleX, setTransformScaleX] = useState(1)
  const [transformScaleY, setTransformScaleY] = useState(1)
  const [transformFlipX, setTransformFlipX] = useState(1)
  const [transformFlipY, setTransformFlipY] = useState(1)
  const [positionTab, setPositionTab] = useState('align') // 'align' or 'arrange'
  const [panelPosition, setPanelPosition] = useState({ x: null, y: null }) // null means use default CSS position
  const [isDraggingPanel, setIsDraggingPanel] = useState(false)
  const [panelDragStart, setPanelDragStart] = useState({ x: 0, y: 0 })
  const panelRef = useRef(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const initialTransformRef = useRef(null)
  const initialAngleRef = useRef(0)
  const multiTouchRef = useRef(null)
  const fileInputRef = useRef(null)
  const lastSavedStateRef = useRef(null) // Track last saved state to prevent duplicates
  const saveHistoryTimeoutRef = useRef(null) // Debounce history saves
  const placedImagesRef = useRef([]) // Keep current state in ref
  const placedTextsRef = useRef([]) // Keep current state in ref
  const allLayersRef = useRef([]) // Keep current state in ref
  const historyRef = useRef([]) // Keep history in ref
  const historyIndexRef = useRef(-1) // Keep history index in ref

  // Add window event listeners for continuous tracking
  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (isDraggingPanel) {
        setPanelPosition({
          x: e.clientX - panelDragStart.x,
          y: e.clientY - panelDragStart.y
        })
      } else if (isDragging && activeImageId) {
        setPlacedImages(prev => prev.map(img => 
          img.id === activeImageId
            ? {
                ...img,
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
              }
            : img
        ))
      } else if (isDragging && activeTextId) {
        setPlacedTexts(prev => prev.map(text => 
          text.id === activeTextId
            ? {
                ...text,
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
              }
            : text
        ))
      } else if (isResizing && activeImageId && initialTransformRef.current) {
        const centerX = dragStartRef.current.centerX
        const centerY = dragStartRef.current.centerY
        const initialDistance = dragStartRef.current.initialDistance

        const currentDistance = Math.sqrt(
          Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
        )

        const distanceRatio = currentDistance / initialDistance
        const newScale = Math.max(0.1, Math.min(3, initialTransformRef.current.scale * distanceRatio))

        setPlacedImages(prev => prev.map(img => 
          img.id === activeImageId
            ? { ...img, scale: newScale }
            : img
        ))
      } else if (isResizing && activeTextId && initialTransformRef.current) {
        const centerX = dragStartRef.current.centerX
        const centerY = dragStartRef.current.centerY
        const initialDistance = dragStartRef.current.initialDistance

        const currentDistance = Math.sqrt(
          Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
        )

        const distanceRatio = currentDistance / initialDistance
        const newScale = Math.max(0.1, Math.min(3, initialTransformRef.current.scale * distanceRatio))

        setPlacedTexts(prev => prev.map(text => 
          text.id === activeTextId
            ? { ...text, scale: newScale }
            : text
        ))
      } else if (isRotating && activeImageId && initialTransformRef.current) {
        const centerX = dragStartRef.current.centerX
        const centerY = dragStartRef.current.centerY
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
        const angleDelta = currentAngle - initialAngleRef.current
        const newRotation = initialTransformRef.current.rotation + angleDelta
        setPlacedImages(prev => prev.map(img => 
          img.id === activeImageId
            ? { ...img, rotation: newRotation }
            : img
        ))
      } else if (isRotating && activeTextId && initialTransformRef.current) {
        const centerX = dragStartRef.current.centerX
        const centerY = dragStartRef.current.centerY
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
        const angleDelta = currentAngle - initialAngleRef.current
        const newRotation = initialTransformRef.current.rotation + angleDelta
        setPlacedTexts(prev => prev.map(text => 
          text.id === activeTextId
            ? { ...text, rotation: newRotation }
            : text
        ))
      }
    }

    const handleWindowMouseUp = () => {
      const wasManipulating = isDragging || isResizing || isRotating || isDraggingPanel
      setIsDragging(false)
      setIsResizing(false)
      setIsRotating(false)
      setIsDraggingPanel(false)
      initialTransformRef.current = null
      
      if (wasManipulating) {
        setJustFinishedManipulation(true)
        setTimeout(() => setJustFinishedManipulation(false), 100)
        // Save to history after manipulation (debounced internally)
        saveToHistory()
      }
    }

    if (isDragging || isResizing || isRotating || isDraggingPanel) {
      window.addEventListener('mousemove', handleWindowMouseMove)
      window.addEventListener('mouseup', handleWindowMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
    }
  }, [isDragging, isResizing, isRotating, isDraggingPanel, activeImageId, activeTextId, panelDragStart])

  // Add touch event listeners for continuous tracking
  useEffect(() => {
    if (isDragging || isMultiTouch || isResizing || isRotating) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('touchend', handleTouchEnd)
      window.addEventListener('touchcancel', handleTouchEnd)
    }

    return () => {
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [isDragging, isMultiTouch, isResizing, isRotating, activeImageId, activeTextId, placedImages, placedTexts])

  // Sync refs with state for history tracking
  useEffect(() => {
    placedImagesRef.current = placedImages
  }, [placedImages])

  useEffect(() => {
    placedTextsRef.current = placedTexts
  }, [placedTexts])

  useEffect(() => {
    allLayersRef.current = allLayers
  }, [allLayers])

  useEffect(() => {
    historyRef.current = history
  }, [history])

  useEffect(() => {
    historyIndexRef.current = historyIndex
  }, [historyIndex])

  // Save initial empty state on mount
  useEffect(() => {
    if (history.length === 0) {
      const initialState = {
        placedImages: [],
        placedTexts: [],
        allLayers: []
      }
      historyRef.current = [initialState]
      historyIndexRef.current = 0
      setHistory([initialState])
      setHistoryIndex(0)
      lastSavedStateRef.current = JSON.stringify(initialState)
    }
  }, []) // Run only once on mount

  // Save to history when images or texts are added/removed (not on every change to avoid too many history entries)
  useEffect(() => {
    // Save when items are added (but not on initial mount since we handle that above)
    if (history.length > 0 && (placedImages.length > 0 || placedTexts.length > 0)) {
      saveToHistory()
    }
  }, [placedImages.length, placedTexts.length])

  // Sync image color/opacity state when active image changes
  useEffect(() => {
    if (activeImageId) {
      const activeImage = placedImages.find(img => img.id === activeImageId)
      if (activeImage) {
        setImageOpacity(activeImage.opacity !== undefined ? activeImage.opacity : 1)
        setTransformScaleX(activeImage.scaleX || 1)
        setTransformScaleY(activeImage.scaleY || 1)
        setTransformFlipX(activeImage.flipX || 1)
        setTransformFlipY(activeImage.flipY || 1)
        setTransformRotate(activeImage.transformRotate || 0)
        
        // Sync shadow color if it exists
        if (activeImage.shadowColor) {
          setShadowColor(activeImage.shadowColor)
          // Parse hex to HSL for the color picker
          const hex = activeImage.shadowColor
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
          if (result) {
            let r = parseInt(result[1], 16) / 255
            let g = parseInt(result[2], 16) / 255
            let b = parseInt(result[3], 16) / 255
            
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            let h, s, l = (max + min) / 2
            
            if (max === min) {
              h = s = 0
            } else {
              const d = max - min
              s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
                case g: h = ((b - r) / d + 2) / 6; break
                case b: h = ((r - g) / d + 4) / 6; break
              }
            }
            
            setShadowHue(Math.round(h * 360))
            setShadowSaturation(Math.round(s * 100))
            setShadowLightness(Math.round(l * 100))
          }
        }
      }
    }
  }, [activeImageId, placedImages])

  // Sync text color/opacity state when active text changes
  useEffect(() => {
    if (activeTextId) {
      const activeText = placedTexts.find(text => text.id === activeTextId)
      if (activeText) {
        setTextOpacity(activeText.opacity !== undefined ? activeText.opacity : 1)
        setTextLineHeight(activeText.lineHeight || 1)
        setTextLetterSpacing(activeText.letterSpacing || 0)
        
        // Sync text color
        if (activeText.color) {
          const hsl = hexToHsl(activeText.color)
          setTextColorHue(hsl.h)
          setTextColorSaturation(hsl.s)
          setTextColorLightness(hsl.l)
        }
        
        // Sync text shadow color if it exists
        if (activeText.textShadow) {
          // Extract color from textShadow string (e.g., "2px 2px 4px #000000")
          const colorMatch = activeText.textShadow.match(/#[0-9A-F]{6}/i)
          if (colorMatch) {
            const shadowColor = colorMatch[0]
            setTextShadowColor(shadowColor)
            const hsl = hexToHsl(shadowColor)
            setTextShadowHue(hsl.h)
            setTextShadowSaturation(hsl.s)
            setTextShadowLightness(hsl.l)
          }
        }
      }
    }
  }, [activeTextId])

  // Reset panel position when switching between panels or closing them
  useEffect(() => {
    setPanelPosition({ x: null, y: null })
  }, [activeImageId, activeTextId])

  // Load assets from designs.json
  useEffect(() => {
    fetch(designsUrl)
      .then(res => res.json())
      .then(data => {
        // Transform the data structure to flat array with category info
        const assets = []
        data.forEach(categoryGroup => {
          const categoryName = categoryGroup.title
          categoryGroup.designs.forEach((design, index) => {
            // Use the full URL from designs.json (GitHub raw URLs)
            assets.push({
              id: `${categoryName}-${index}`,
              category: categoryName,
              name: design.title,
              src: design.source,
              thumbnail: design.source
            })
          })
        })
        setLoadedAssets(assets)
      })
      .catch(err => console.error('Failed to load assets:', err))
  }, [designsUrl])

  // Helper functions for color conversion
  const hslToHex = (h, s, l) => {
    l /= 100
    const a = s * Math.min(l, 1 - l) / 100
    const f = n => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color).toString(16).padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  const hexToHsl = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return { h: 0, s: 0, l: 0 }
    
    let r = parseInt(result[1], 16) / 255
    let g = parseInt(result[2], 16) / 255
    let b = parseInt(result[3], 16) / 255
    
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2
    
    if (max === min) {
      h = s = 0
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    }
  }

  // Handle panel drag start
  const handlePanelDragStart = (e) => {
    e.stopPropagation()
    setIsDraggingPanel(true)
    
    // Get current panel position or use default
    const panel = panelRef.current
    if (panel) {
      const rect = panel.getBoundingClientRect()
      setPanelDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newImage = {
          id: Date.now() + Math.random(),
          src: event.target.result,
          name: file.name
        }
        setUploadedImages(prev => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })
    // Reset the file input value to allow re-uploading the same file
    e.target.value = ''
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )

    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newImage = {
          id: Date.now() + Math.random(),
          src: event.target.result,
          name: file.name
        }
        setUploadedImages(prev => [...prev, newImage])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageClick = (image) => {
    setSelectedImage(image)
    const newPlacedImage = {
      id: Date.now() + Math.random(),
      src: image.src,
      name: image.name,
      x: 60,
      y: 220,
      scale: 1,
      rotation: 0
    }
    setPlacedImages(prev => [...prev, newPlacedImage])
    setAllLayers(prev => [...prev, { id: newPlacedImage.id, type: 'image' }])
    setActiveImageId(newPlacedImage.id)
    setActiveTextId(null)  // Clear active text
  }

  const handleDeleteImage = (e, imageId) => {
    e.stopPropagation()
    setUploadedImages(prev => prev.filter(img => img.id !== imageId))
    if (selectedImage?.id === imageId) {
      setSelectedImage(null)
    }
  }

  const handleRemovePlacedImage = (e, placedImageId) => {
    e.stopPropagation()
    setPlacedImages(prev => prev.filter(img => img.id !== placedImageId))
    setAllLayers(prev => prev.filter(layer => layer.id !== placedImageId))
    if (activeImageId === placedImageId) {
      setActiveImageId(null)
    }
    // Save to history after deletion (debounced internally)
    saveToHistory()
  }

  const handleRemovePlacedText = (e, textId) => {
    e.stopPropagation()
    setPlacedTexts(prev => prev.filter(text => text.id !== textId))
    setAllLayers(prev => prev.filter(layer => layer.id !== textId))
    if (activeTextId === textId) {
      setActiveTextId(null)
    }
    // Save to history after deletion (debounced internally)
    saveToHistory()
  }

  const handleAddText = () => {
    if (!textInput.trim()) return
    
    const newText = {
      id: Date.now() + Math.random(),
      content: textInput,
      x: 160,  // Center of phone (320px / 2)
      y: 320,  // Center of phone (640px / 2)
      scale: 1,
      rotation: 0,
      fontSize: 24,
      color: '#000000',
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fontStyle: 'normal'
    }
    setPlacedTexts(prev => [...prev, newText])
    setAllLayers(prev => [...prev, { id: newText.id, type: 'text' }])
    setActiveTextId(newText.id)
    setActiveImageId(null)  // Clear active image
    setTextInput('')
    
    // Save to history after adding text (debounced internally)
    saveToHistory()
  }

  // Handle QR Code generation and placement
  const handleAddQR = async () => {
    if (!qrInput.trim()) return
    
    try {
      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(qrInput, {
        width: 200,
        margin: 1,
        color: {
          dark: qrColor,
          light: qrBgColor
        }
      })
      
      // Add QR code as an image
      const newImage = {
        id: Date.now() + Math.random(),
        src: qrDataUrl,
        name: 'QR Code',
        x: 60,  // Center position (160 - 100/2 = 110, adjusted to 60 for better centering)
        y: 220,  // Center position (320 - 100/2 = 270, adjusted to 220 for better centering)
        scale: 1,
        rotation: 0
      }
      
      setPlacedImages(prev => [...prev, newImage])
      setAllLayers(prev => [...prev, { id: newImage.id, type: 'image' }])
      setActiveImageId(newImage.id)
      setActiveTextId(null)
      setQrInput('') // Clear input after adding
      
      // Save to history after adding QR code (debounced internally)
      saveToHistory()
    } catch (error) {
      console.error('QR code generation error:', error)
      alert('QR kod oluşturulurken bir hata oluştu!')
    }
  }

  // Save current state to history with debouncing and duplicate prevention
  const saveToHistory = () => {
    // Clear any pending save
    if (saveHistoryTimeoutRef.current) {
      clearTimeout(saveHistoryTimeoutRef.current)
    }
    
    // Debounce the save to ensure state has fully updated
    saveHistoryTimeoutRef.current = setTimeout(() => {
      // Use refs to get the absolute latest state
      const currentState = {
        placedImages: JSON.parse(JSON.stringify(placedImagesRef.current)),
        placedTexts: JSON.parse(JSON.stringify(placedTextsRef.current)),
        allLayers: JSON.parse(JSON.stringify(allLayersRef.current))
      }
      
      const currentStateStr = JSON.stringify(currentState)
      
      // Check if state has actually changed from last saved state
      if (lastSavedStateRef.current === currentStateStr) {
        return // Don't save duplicate state
      }
      
      lastSavedStateRef.current = currentStateStr
      
      // Remove any history after current index (when user makes new action after undo)
      const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1)
      newHistory.push(currentState)
      
      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift()
        // Don't increment index if we removed the first item
      } else {
        historyIndexRef.current = historyIndexRef.current + 1
        setHistoryIndex(historyIndexRef.current)
      }
      
      historyRef.current = newHistory
      setHistory(newHistory)
    }, 100) // 100ms debounce to ensure state updates are captured
  }

  // Undo function
  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      const newIndex = historyIndexRef.current - 1
      const previousState = historyRef.current[newIndex]
      
      setPlacedImages(JSON.parse(JSON.stringify(previousState.placedImages)))
      setPlacedTexts(JSON.parse(JSON.stringify(previousState.placedTexts)))
      setAllLayers(JSON.parse(JSON.stringify(previousState.allLayers)))
      historyIndexRef.current = newIndex
      setHistoryIndex(newIndex)
      setActiveImageId(null)
      setActiveTextId(null)
      
      // Update last saved state ref to prevent duplicate saves
      lastSavedStateRef.current = JSON.stringify(previousState)
    }
  }

  // Redo function
  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      const newIndex = historyIndexRef.current + 1
      const nextState = historyRef.current[newIndex]
      
      setPlacedImages(JSON.parse(JSON.stringify(nextState.placedImages)))
      setPlacedTexts(JSON.parse(JSON.stringify(nextState.placedTexts)))
      setAllLayers(JSON.parse(JSON.stringify(nextState.allLayers)))
      historyIndexRef.current = newIndex
      setHistoryIndex(newIndex)
      setActiveImageId(null)
      setActiveTextId(null)
      
      // Update last saved state ref to prevent duplicate saves
      lastSavedStateRef.current = JSON.stringify(nextState)
    }
  }

  // Get unique categories from loaded assets
  const getCategories = () => {
    if (loadedAssets.length === 0) return []
    const categories = [...new Set(loadedAssets.map(asset => asset.category))]
    return categories.sort()
  }

  // Get category data with thumbnails for folder view
  const getCategoryData = () => {
    if (loadedAssets.length === 0) return []
    
    const categoryMap = {}
    loadedAssets.forEach(asset => {
      if (!categoryMap[asset.category]) {
        categoryMap[asset.category] = {
          name: asset.category,
          thumbnail: asset.thumbnail, // Use first image as thumbnail
          count: 0
        }
      }
      categoryMap[asset.category].count++
    })
    
    let categories = Object.values(categoryMap).sort((a, b) => a.name.localeCompare(b.name))
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      categories = categories.filter(cat => 
        cat.name.toLowerCase().includes(query)
      )
    }
    
    return categories
  }

  // Handle category folder click
  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName)
    setAssetViewMode('images')
    setSearchQuery('') // Clear search when entering category
  }

  // Handle back to categories
  const handleBackToCategories = () => {
    setAssetViewMode('categories')
    setSelectedCategory(null)
    setSearchQuery('') // Clear search when going back
  }

  // Get filtered assets based on selected category
  const getFilteredAssets = () => {
    if (assetViewMode === 'categories') return []
    if (!selectedCategory) return loadedAssets
    
    let filtered = loadedAssets.filter(asset => asset.category === selectedCategory)
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(asset => 
        asset.name.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }

  const handleAssetClick = (asset) => {
    // Use the actual image source
    const newPlacedImage = {
      id: Date.now() + Math.random(),
      src: asset.src,
      name: asset.name,
      x: 60,
      y: 220,
      scale: 1,
      rotation: 0
    }
    setPlacedImages(prev => [...prev, newPlacedImage])
    setAllLayers(prev => [...prev, { id: newPlacedImage.id, type: 'image' }])
    setActiveImageId(newPlacedImage.id)
    setActiveTextId(null)
  }

  // Get all layers (images and texts) in order
  const getAllLayers = () => {
    return allLayers.map(layer => {
      if (layer.type === 'image') {
        const img = placedImages.find(i => i.id === layer.id)
        return img ? {
          id: img.id,
          type: 'image',
          name: img.name,
          data: img
        } : null
      } else {
        const text = placedTexts.find(t => t.id === layer.id)
        return text ? {
          id: text.id,
          type: 'text',
          name: text.content.substring(0, 20) + (text.content.length > 20 ? '...' : ''),
          data: text
        } : null
      }
    }).filter(Boolean)
  }

  const handleLayerDragStart = (e, index) => {
    setDraggedLayerIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleLayerDragOver = (e, index) => {
    e.preventDefault()
    if (draggedLayerIndex === null || draggedLayerIndex === index) return
    
    const newLayers = [...allLayers]
    const draggedLayer = newLayers[draggedLayerIndex]
    
    // Remove dragged item and insert at new position
    newLayers.splice(draggedLayerIndex, 1)
    newLayers.splice(index, 0, draggedLayer)
    
    setAllLayers(newLayers)
    setDraggedLayerIndex(index)
  }

  const handleLayerDragEnd = () => {
    setDraggedLayerIndex(null)
  }

  const handleLayerClick = (layer) => {
    if (layer.type === 'image') {
      setActiveImageId(layer.id)
      setActiveTextId(null)
    } else {
      setActiveTextId(layer.id)
      setActiveImageId(null)
    }
  }

  const handleDeleteLayer = (e, layer) => {
    e.stopPropagation()
    if (layer.type === 'image') {
      setPlacedImages(prev => prev.filter(img => img.id !== layer.id))
      setAllLayers(prev => prev.filter(l => l.id !== layer.id))
      if (activeImageId === layer.id) {
        setActiveImageId(null)
      }
    } else {
      setPlacedTexts(prev => prev.filter(text => text.id !== layer.id))
      setAllLayers(prev => prev.filter(l => l.id !== layer.id))
      if (activeTextId === layer.id) {
        setActiveTextId(null)
      }
    }
    // Save to history after deletion (debounced internally)
    saveToHistory()
  }

  const handleDownload = async (format) => {
    try {
      // Get elements
      const phoneScreen = document.querySelector('.phone-screen')
      const phoneFrameImg = document.querySelector('.phone-case-frame img')
      
      if (!phoneScreen) {
        alert('Phone screen element not found')
        return
      }

      // Hide control buttons temporarily
      setActiveImageId(null)
      setActiveTextId(null)

      // Temporarily remove transform for accurate capture on mobile
      const originalTransform = phoneScreen.style.transform
      phoneScreen.style.transform = 'none'

      // Wait a bit for the UI to update
      await new Promise(resolve => setTimeout(resolve, 200))

      // Capture the phone screen with html2canvas
      const screenCanvas = await html2canvas(phoneScreen, {
        backgroundColor: '#ff8c69',
        scale: 2,
        width: 320,
        height: 640,
        logging: false,
        useCORS: true,
        allowTaint: true
      })

      // Restore transform
      phoneScreen.style.transform = originalTransform

      console.log('Screen canvas dimensions:', screenCanvas.width, 'x', screenCanvas.height)

      // Final dimensions: 600x1000 (frame size)
      const finalWidth = 600
      const finalHeight = 1000
      
      // Create final canvas
      const finalCanvas = document.createElement('canvas')
      finalCanvas.width = finalWidth
      finalCanvas.height = finalHeight
      const ctx = finalCanvas.getContext('2d')

      // Draw the screen capture scaled to 500x1000, centered horizontally
      const screenWidth = 500
      const screenHeight = 1000
      const xOffset = (finalWidth - screenWidth) / 2 // (600 - 500) / 2 = 50
      ctx.drawImage(screenCanvas, xOffset, 0, screenWidth, screenHeight)

      // Draw the frame on top at 600x1000 (original size)
      if (phoneFrameImg) {
        await new Promise((resolve, reject) => {
          const frameImg = new Image()
          frameImg.crossOrigin = 'anonymous'
          frameImg.onload = () => {
            ctx.drawImage(frameImg, 0, 0, finalWidth, finalHeight)
            resolve()
          }
          frameImg.onerror = reject
          frameImg.src = phoneFrameImg.src
        })
      }

      console.log('Final canvas dimensions:', finalCanvas.width, 'x', finalCanvas.height)

      if (format === 'jpg') {
        finalCanvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `phone-case-design.jpg`
          link.click()
          URL.revokeObjectURL(url)
        }, 'image/jpeg', 0.95)
      } else if (format === 'png') {
        finalCanvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `phone-case-design.png`
          link.click()
          URL.revokeObjectURL(url)
        }, 'image/png')
      } else if (format === 'svg') {
        // For SVG, we'll embed the PNG as a base64 image inside the SVG
        // This ensures it looks exactly like PNG/JPG
        const imgData = finalCanvas.toDataURL('image/png')
        
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="600" height="1000" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image width="600" height="1000" xlink:href="${imgData}"/>
</svg>`
        
        // Download SVG
        const blob = new Blob([svgContent], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'phone-case-design.svg'
        link.click()
        URL.revokeObjectURL(url)
      } else if (format === 'pdf') {
        const imgData = finalCanvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [finalWidth, finalHeight]
        })
        pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight)
        pdf.save('phone-case-design.pdf')
      }
      
      setShowDownloadModal(false)
    } catch (error) {
      console.error('Download error:', error)
      alert('Download failed. Please try again.')
    }
  }

  const handlePhoneScreenClick = (e) => {
    // Don't deactivate if we just finished a manipulation
    if (justFinishedManipulation) {
      return
    }
    
    // Deactivate if clicking on phone-section, phone-case, or phone-screen (not on images/text/buttons)
    const clickedElement = e.target.classList;
    const isControlButton = e.target.closest('.image-delete-btn, .image-rotate-handle, .image-resize-handle');
    
    if (isControlButton) {
      // Don't deactivate if clicking on control buttons
      return;
    }
    
    if (clickedElement.contains('phone-screen') || 
        clickedElement.contains('phone-case') || 
        clickedElement.contains('phone-section')) {
      setActiveImageId(null)
      setActiveTextId(null)
    }
  }

  const handleMouseDown = (e, imageId) => {
    e.stopPropagation()
    const placedImage = placedImages.find(img => img.id === imageId)
    if (!placedImage) return
    
    setActiveImageId(imageId)
    setActiveTextId(null)
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - placedImage.x,
      y: e.clientY - placedImage.y
    }
  }

  const handleTextMouseDown = (e, textId) => {
    e.stopPropagation()
    const placedText = placedTexts.find(text => text.id === textId)
    if (!placedText) return
    
    setActiveTextId(textId)
    setActiveImageId(null)
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - placedText.x,
      y: e.clientY - placedText.y
    }
  }

  const handleTextResizeStart = (e, textId) => {
    e.stopPropagation()
    setActiveTextId(textId)
    setActiveImageId(null)
    setIsResizing(true)

    const textWrapper = e.target.closest('.placed-text-wrapper')
    if (textWrapper) {
      const rect = textWrapper.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const initialDistance = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
      )

      const placedText = placedTexts.find(text => text.id === textId)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        centerX,
        centerY,
        initialDistance
      }
      initialTransformRef.current = { ...placedText }
    }
  }

  const handleTextRotateStart = (e, textId) => {
    e.stopPropagation()
    setActiveTextId(textId)
    setActiveImageId(null)
    setIsRotating(true)

    const textWrapper = e.target.closest('.placed-text-wrapper')
    if (textWrapper) {
      const rect = textWrapper.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const initialAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)

      const placedText = placedTexts.find(text => text.id === textId)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        centerX,
        centerY
      }
      initialAngleRef.current = initialAngle
      initialTransformRef.current = { ...placedText }
    }
  }

  const handleResizeStart = (e, imageId) => {
    e.stopPropagation()
    setActiveImageId(imageId)
    setActiveTextId(null)
    setIsResizing(true)

    // Get the image wrapper element to calculate center position
    const imageWrapper = e.target.closest('.placed-image-wrapper')
    if (imageWrapper) {
      const rect = imageWrapper.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate initial distance from center to mouse position
      const initialDistance = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
      )

      const placedImage = placedImages.find(img => img.id === imageId)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        centerX,
        centerY,
        initialDistance
      }
      initialTransformRef.current = { ...placedImage }
    }
  }

  const handleRotateStart = (e, imageId) => {
    e.stopPropagation()
    setActiveImageId(imageId)
    setActiveTextId(null)
    setIsRotating(true)

    // Get the image wrapper element to calculate center position
    const imageWrapper = e.target.closest('.placed-image-wrapper')
    if (imageWrapper) {
      const rect = imageWrapper.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Calculate initial angle from center to mouse position
      const initialAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)

      const placedImage = placedImages.find(img => img.id === imageId)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        centerX,
        centerY
      }
      initialAngleRef.current = initialAngle
      initialTransformRef.current = { ...placedImage }
    }
  }

  // ========== TOUCH GESTURE HANDLERS ==========
  
  // Handle touch start on images - supports single touch (drag) and multi-touch (pinch/rotate)
  const handleImageTouchStart = (e, imageId) => {
    e.stopPropagation()
    
    const placedImage = placedImages.find(img => img.id === imageId)
    if (!placedImage) return
    
    setActiveImageId(imageId)
    setActiveTextId(null)
    
    if (e.touches.length === 1) {
      // Single touch = drag
      const touch = e.touches[0]
      setIsDragging(true)
      dragStartRef.current = {
        x: touch.clientX - placedImage.x,
        y: touch.clientY - placedImage.y
      }
    } else if (e.touches.length === 2) {
      // Two touches = pinch + rotate
      e.preventDefault()
      
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      // Calculate initial distance (for pinch zoom)
      const initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      // Calculate initial angle (for rotation)
      const initialAngle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      ) * (180 / Math.PI)
      
      multiTouchRef.current = {
        initialDistance,
        initialAngle,
        initialScale: placedImage.scale,
        initialRotation: placedImage.rotation
      }
      setIsMultiTouch(true)
    }
  }

  // Handle touch start on text - supports single touch (drag) and multi-touch (pinch/rotate)
  const handleTextTouchStart = (e, textId) => {
    e.stopPropagation()
    
    const placedText = placedTexts.find(text => text.id === textId)
    if (!placedText) return
    
    setActiveTextId(textId)
    setActiveImageId(null)
    
    if (e.touches.length === 1) {
      // Single touch = drag
      const touch = e.touches[0]
      setIsDragging(true)
      dragStartRef.current = {
        x: touch.clientX - placedText.x,
        y: touch.clientY - placedText.y
      }
    } else if (e.touches.length === 2) {
      // Two touches = pinch + rotate
      e.preventDefault()
      
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      // Calculate initial distance (for pinch zoom)
      const initialDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      // Calculate initial angle (for rotation)
      const initialAngle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      ) * (180 / Math.PI)
      
      multiTouchRef.current = {
        initialDistance,
        initialAngle,
        initialScale: placedText.scale,
        initialRotation: placedText.rotation
      }
      setIsMultiTouch(true)
    }
  }

  // Handle touch move - processes drag, pinch, and rotate gestures
  const handleTouchMove = (e) => {
    if (e.touches.length === 1 && isDragging && (activeImageId || activeTextId)) {
      // Single finger drag
      const touch = e.touches[0]
      
      if (activeImageId) {
        setPlacedImages(prev => prev.map(img => 
          img.id === activeImageId
            ? {
                ...img,
                x: touch.clientX - dragStartRef.current.x,
                y: touch.clientY - dragStartRef.current.y
              }
            : img
        ))
      } else if (activeTextId) {
        setPlacedTexts(prev => prev.map(text => 
          text.id === activeTextId
            ? {
                ...text,
                x: touch.clientX - dragStartRef.current.x,
                y: touch.clientY - dragStartRef.current.y
              }
            : text
        ))
      }
    } else if (e.touches.length === 1 && isResizing && (activeImageId || activeTextId) && initialTransformRef.current) {
      // Single finger resize via handle
      const touch = e.touches[0]
      const centerX = dragStartRef.current.centerX
      const centerY = dragStartRef.current.centerY
      
      const currentDistance = Math.sqrt(
        Math.pow(touch.clientX - centerX, 2) + 
        Math.pow(touch.clientY - centerY, 2)
      )
      
      const scaleChange = currentDistance / dragStartRef.current.initialDistance
      const newScale = Math.max(0.1, Math.min(3, initialTransformRef.current.scale * scaleChange))
      
      if (activeImageId) {
        setPlacedImages(prev => prev.map(img => 
          img.id === activeImageId ? { ...img, scale: newScale } : img
        ))
      } else if (activeTextId) {
        setPlacedTexts(prev => prev.map(text => 
          text.id === activeTextId ? { ...text, scale: newScale } : text
        ))
      }
    } else if (e.touches.length === 1 && isRotating && (activeImageId || activeTextId) && initialTransformRef.current) {
      // Single finger rotate via handle
      const touch = e.touches[0]
      const centerX = dragStartRef.current.centerX
      const centerY = dragStartRef.current.centerY
      
      const currentAngle = Math.atan2(
        touch.clientY - centerY,
        touch.clientX - centerX
      ) * (180 / Math.PI)
      
      const rotationChange = currentAngle - initialAngleRef.current
      const newRotation = initialTransformRef.current.rotation + rotationChange
      
      if (activeImageId) {
        setPlacedImages(prev => prev.map(img => 
          img.id === activeImageId ? { ...img, rotation: newRotation } : img
        ))
      } else if (activeTextId) {
        setPlacedTexts(prev => prev.map(text => 
          text.id === activeTextId ? { ...text, rotation: newRotation } : text
        ))
      }
    } else if (e.touches.length === 2 && isMultiTouch && multiTouchRef.current) {
      // Two finger pinch + rotate
      e.preventDefault()
      
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      // Calculate current distance (for scale)
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      // Calculate current angle (for rotation)
      const currentAngle = Math.atan2(
        touch2.clientY - touch1.clientY,
        touch2.clientX - touch1.clientX
      ) * (180 / Math.PI)
      
      // Calculate scale change
      const scaleChange = currentDistance / multiTouchRef.current.initialDistance
      const newScale = Math.max(0.1, Math.min(3, 
        multiTouchRef.current.initialScale * scaleChange
      ))
      
      // Calculate rotation change
      const rotationChange = currentAngle - multiTouchRef.current.initialAngle
      const newRotation = multiTouchRef.current.initialRotation + rotationChange
      
      if (activeImageId) {
        setPlacedImages(prev => prev.map(img => 
          img.id === activeImageId
            ? { ...img, scale: newScale, rotation: newRotation }
            : img
        ))
      } else if (activeTextId) {
        setPlacedTexts(prev => prev.map(text => 
          text.id === activeTextId
            ? { ...text, scale: newScale, rotation: newRotation }
            : text
        ))
      }
    }
  }

  // Handle touch end - cleanup and state transitions
  const handleTouchEnd = (e) => {
    if (e.touches.length === 0) {
      // All fingers lifted
      const wasManipulating = isDragging || isMultiTouch || isResizing || isRotating
      setIsDragging(false)
      setIsMultiTouch(false)
      setIsResizing(false)
      setIsRotating(false)
      multiTouchRef.current = null
      
      if (wasManipulating) {
        setJustFinishedManipulation(true)
        setTimeout(() => setJustFinishedManipulation(false), 100)
        // Save to history after touch manipulation (debounced internally)
        saveToHistory()
      }
    } else if (e.touches.length === 1 && isMultiTouch) {
      // Went from 2 fingers to 1 finger - switch to drag mode
      setIsMultiTouch(false)
      multiTouchRef.current = null
      
      const touch = e.touches[0]
      
      if (activeImageId) {
        const placedImage = placedImages.find(img => img.id === activeImageId)
        if (placedImage) {
          setIsDragging(true)
          dragStartRef.current = {
            x: touch.clientX - placedImage.x,
            y: touch.clientY - placedImage.y
          }
        }
      } else if (activeTextId) {
        const placedText = placedTexts.find(text => text.id === activeTextId)
        if (placedText) {
          setIsDragging(true)
          dragStartRef.current = {
            x: touch.clientX - placedText.x,
            y: touch.clientY - placedText.y
          }
        }
      }
    }
  }

  // Touch handlers for resize/rotate handles (for precise control)
  const handleHandleTouchStart = (e, id, action, type) => {
    e.preventDefault()
    e.stopPropagation()
    
    const touch = e.touches[0]
    
    if (type === 'image') {
      setActiveImageId(id)
      setActiveTextId(null)
    } else {
      setActiveTextId(id)
      setActiveImageId(null)
    }
    
    if (action === 'resize') {
      setIsResizing(true)
      
      const wrapper = e.target.closest(type === 'image' ? '.placed-image-wrapper' : '.placed-text-wrapper')
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        
        const initialDistance = Math.sqrt(
          Math.pow(touch.clientX - centerX, 2) + 
          Math.pow(touch.clientY - centerY, 2)
        )
        
        const item = type === 'image' 
          ? placedImages.find(img => img.id === id)
          : placedTexts.find(text => text.id === id)
        
        dragStartRef.current = { centerX, centerY, initialDistance }
        initialTransformRef.current = { ...item }
      }
    } else if (action === 'rotate') {
      setIsRotating(true)
      
      const wrapper = e.target.closest(type === 'image' ? '.placed-image-wrapper' : '.placed-text-wrapper')
      if (wrapper) {
        const rect = wrapper.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        
        const initialAngle = Math.atan2(
          touch.clientY - centerY, 
          touch.clientX - centerX
        ) * (180 / Math.PI)
        
        const item = type === 'image' 
          ? placedImages.find(img => img.id === id)
          : placedTexts.find(text => text.id === id)
        
        dragStartRef.current = { centerX, centerY }
        initialAngleRef.current = initialAngle
        initialTransformRef.current = { ...item }
      }
    }
  }

  // ========== END TOUCH GESTURE HANDLERS ==========

  // Serialize the current design into JSON format for backend storage
  const serializeDesign = () => {
    return {
      images: placedImages.map(img => ({
        id: img.id,
        src: img.src, // base64 data URL
        name: img.name,
        x: img.x,
        y: img.y,
        scale: img.scale,
        rotation: img.rotation
      })),
      texts: placedTexts.map(text => ({
        id: text.id,
        content: text.content,
        x: text.x,
        y: text.y,
        scale: text.scale,
        rotation: text.rotation,
        fontSize: text.fontSize,
        color: text.color,
        fontFamily: text.fontFamily,
        fontWeight: text.fontWeight,
        fontStyle: text.fontStyle
      })),
      layers: allLayers.map(layer => ({
        id: layer.id,
        type: layer.type
      }))
    }
  }

  // Save design to backend and get design ID and image URL
  const saveDesignToBackend = async (designData) => {
    try {
      setIsSaving(true)
      setSaveError(null)

      // Step 1: Capture the design images using html2canvas
      const phoneScreen = document.querySelector('.phone-screen')
      const phoneFrameImg = document.querySelector('.phone-case-frame img')
      
      if (!phoneScreen) {
        throw new Error('Phone screen element not found')
      }

      // Hide control buttons temporarily
      const currentActiveImageId = activeImageId
      const currentActiveTextId = activeTextId
      setActiveImageId(null)
      setActiveTextId(null)

      // Temporarily remove transform for accurate capture on mobile
      const originalTransform = phoneScreen.style.transform
      phoneScreen.style.transform = 'none'

      // Wait for UI to update
      await new Promise(resolve => setTimeout(resolve, 200))

      // Capture the phone screen with html2canvas (with transparent background)
      const screenCanvas = await html2canvas(phoneScreen, {
        backgroundColor: null, // Transparent to capture design elements only
        scale: 2,
        width: 320,
        height: 640,
        logging: false,
        useCORS: true,
        allowTaint: true
      })

      // Restore transform and active states
      phoneScreen.style.transform = originalTransform
      setActiveImageId(currentActiveImageId)
      setActiveTextId(currentActiveTextId)

      console.log('Captured canvas dimensions:', screenCanvas.width, 'x', screenCanvas.height)

      // Final dimensions: 600x1000 (frame size)
      const finalWidth = 600
      const finalHeight = 1000
      const screenWidth = 500
      const screenHeight = 1000
      const xOffset = (finalWidth - screenWidth) / 2 // (600 - 500) / 2 = 50

      // IMAGE 1: Complete design (orange background + design elements + frame)
      const completeCanvas = document.createElement('canvas')
      completeCanvas.width = finalWidth
      completeCanvas.height = finalHeight
      const completeCtx = completeCanvas.getContext('2d')

      // Draw the screen capture scaled to 500x1000, centered horizontally
      completeCtx.drawImage(screenCanvas, xOffset, 0, screenWidth, screenHeight)

      // Draw the frame on top at 600x1000 (original size)
      if (phoneFrameImg) {
        await new Promise((resolve, reject) => {
          const frameImg = new Image()
          frameImg.crossOrigin = 'anonymous'
          frameImg.onload = () => {
            completeCtx.drawImage(frameImg, 0, 0, finalWidth, finalHeight)
            resolve()
          }
          frameImg.onerror = reject
          frameImg.src = phoneFrameImg.src
        })
      }

      // IMAGE 2: Empty phone case (orange background + frame, no design elements)
      const emptyCanvas = document.createElement('canvas')
      emptyCanvas.width = finalWidth
      emptyCanvas.height = finalHeight
      const emptyCtx = emptyCanvas.getContext('2d')

      // Draw orange background in the screen area
      emptyCtx.fillStyle = '#ff8c69'
      emptyCtx.fillRect(xOffset, 0, screenWidth, screenHeight)

      // Draw the frame on top
      if (phoneFrameImg) {
        await new Promise((resolve, reject) => {
          const frameImg = new Image()
          frameImg.crossOrigin = 'anonymous'
          frameImg.onload = () => {
            emptyCtx.drawImage(frameImg, 0, 0, finalWidth, finalHeight)
            resolve()
          }
          frameImg.onerror = reject
          frameImg.src = phoneFrameImg.src
        })
      }

      // IMAGE 3: Design only (transparent background, no frame, no orange)
      const designOnlyCanvas = document.createElement('canvas')
      designOnlyCanvas.width = finalWidth
      designOnlyCanvas.height = finalHeight
      const designOnlyCtx = designOnlyCanvas.getContext('2d')

      // Create a temporary canvas to extract only design elements (without orange background)
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = screenCanvas.width
      tempCanvas.height = screenCanvas.height
      const tempCtx = tempCanvas.getContext('2d')
      
      // Draw the screen canvas
      tempCtx.drawImage(screenCanvas, 0, 0)
      
      // Get image data and remove orange background
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      const data = imageData.data
      
      // Orange color RGB: #ff8c69 = (255, 140, 105)
      const orangeR = 255
      const orangeG = 140
      const orangeB = 105
      const tolerance = 30 // Color tolerance for matching
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        // Check if pixel is close to orange color
        if (Math.abs(r - orangeR) < tolerance && 
            Math.abs(g - orangeG) < tolerance && 
            Math.abs(b - orangeB) < tolerance) {
          // Make orange pixels transparent
          data[i + 3] = 0
        }
      }
      
      tempCtx.putImageData(imageData, 0, 0)
      
      // Draw the cleaned image (without orange) to the final canvas
      designOnlyCtx.drawImage(tempCanvas, xOffset, 0, screenWidth, screenHeight)

      // Convert all canvases to blobs
      const completeBlob = await new Promise((resolve) => {
        completeCanvas.toBlob(resolve, 'image/png')
      })

      const emptyBlob = await new Promise((resolve) => {
        emptyCanvas.toBlob(resolve, 'image/png')
      })

      const designOnlyBlob = await new Promise((resolve) => {
        designOnlyCanvas.toBlob(resolve, 'image/png')
      })

      // Step 2: Send all images and design data to backend
      const storeUrl = window.location.origin
      const proxyUrl = `${storeUrl}/apps/customizer/save-design`
      
      console.log('Using App Proxy URL:', proxyUrl)

      const formData = new FormData()
      formData.append('designData', JSON.stringify(designData))
      formData.append('designImage', completeBlob, 'design-complete.png')
      formData.append('emptyCase', emptyBlob, 'design-empty.png')
      formData.append('designOnly', designOnlyBlob, 'design-only.png')

      const response = await fetch(proxyUrl, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Failed to save design: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.error) {
        throw new Error(result.error)
      }

      return {
        designId: result.designId,
        imageUrl: result.imageUrl,
        emptyCaseUrl: result.emptyCaseUrl,
        designOnlyUrl: result.designOnlyUrl
      }
    } catch (error) {
      console.error('Error saving design:', error)
      setSaveError(error.message)
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Add to Cart button click
  const handleAddToCart = async () => {
    try {
      // Serialize the current design
      const designData = serializeDesign()

      // Save to backend and get design ID and all image URLs
      const { designId, imageUrl, emptyCaseUrl, designOnlyUrl } = await saveDesignToBackend(designData)

      // Dispatch custom event for the theme extension to handle cart add
      const event = new CustomEvent('customizer:addToCart', {
        detail: {
          designId,
          imageUrl,
          emptyCaseUrl,
          designOnlyUrl
        }
      })
      window.dispatchEvent(event)

    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Sepete eklenirken bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  // Handle Print button click
  const handlePrint = async () => {
    try {
      // Capture the phone screen area using html2canvas
      const phoneScreen = document.querySelector('.phone-screen')
      const phoneFrameImg = document.querySelector('.phone-case-frame img')
      
      if (!phoneScreen) {
        alert('Tasarım alanı bulunamadı!')
        return
      }

      // Temporarily remove transform for accurate capture on mobile
      const originalTransform = phoneScreen.style.transform
      phoneScreen.style.transform = 'none'

      const screenCanvas = await html2canvas(phoneScreen, {
        backgroundColor: null,
        scale: 2,
        width: 320,
        height: 640,
        logging: false,
        useCORS: true,
        allowTaint: true
      })

      // Restore transform
      phoneScreen.style.transform = originalTransform

      // Final dimensions: 600x1000 (frame size)
      const finalWidth = 600
      const finalHeight = 1000
      
      // Create final canvas
      const printCanvas = document.createElement('canvas')
      printCanvas.width = finalWidth
      printCanvas.height = finalHeight
      const ctx = printCanvas.getContext('2d')

      // Draw the screen capture scaled to 500x1000, centered horizontally
      const screenWidth = 500
      const screenHeight = 1000
      const xOffset = (finalWidth - screenWidth) / 2 // (600 - 500) / 2 = 50
      ctx.drawImage(screenCanvas, xOffset, 0, screenWidth, screenHeight)

      // Draw the frame on top at 600x1000 (original size)
      if (phoneFrameImg) {
        await new Promise((resolve, reject) => {
          const frameImg = new Image()
          frameImg.crossOrigin = 'anonymous'
          frameImg.onload = () => {
            ctx.drawImage(frameImg, 0, 0, finalWidth, finalHeight)
            resolve()
          }
          frameImg.onerror = reject
          frameImg.src = phoneFrameImg.src
        })
      }
      
      // Create a hidden iframe for printing
      const printFrame = document.createElement('iframe')
      printFrame.style.position = 'fixed'
      printFrame.style.right = '0'
      printFrame.style.bottom = '0'
      printFrame.style.width = '0'
      printFrame.style.height = '0'
      printFrame.style.border = 'none'
      document.body.appendChild(printFrame)
      
      const printDocument = printFrame.contentWindow.document
      printDocument.open()
      printDocument.write(`
        <html>
          <head>
            <title>Telefon Kılıfı Tasarımı</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              @media print {
                body {
                  padding: 0;
                }
                img {
                  max-width: 100%;
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <img src="${printCanvas.toDataURL('image/png')}" />
          </body>
        </html>
      `)
      printDocument.close()
      
      // Wait for image to load, then print
      printFrame.contentWindow.onload = () => {
        setTimeout(() => {
          printFrame.contentWindow.focus()
          printFrame.contentWindow.print()
          
          // Remove iframe after printing
          setTimeout(() => {
            document.body.removeChild(printFrame)
          }, 100)
        }, 250)
      }
      
    } catch (error) {
      console.error('Print error:', error)
      alert('Yazdırma sırasında bir hata oluştu!')
    }
  }

  // Handle Preview button click
  const handlePreview = async () => {
    try {
      // Capture the phone screen area using html2canvas
      const phoneScreen = document.querySelector('.phone-screen')
      const phoneFrameImg = document.querySelector('.phone-case-frame img')
      
      if (!phoneScreen) {
        alert('Tasarım alanı bulunamadı!')
        return
      }

      // Temporarily remove transform for accurate capture on mobile
      const originalTransform = phoneScreen.style.transform
      phoneScreen.style.transform = 'none'

      const screenCanvas = await html2canvas(phoneScreen, {
        backgroundColor: null,
        scale: 2,
        width: 320,
        height: 640,
        logging: false,
        useCORS: true,
        allowTaint: true
      })

      // Restore transform
      phoneScreen.style.transform = originalTransform

      // Final dimensions: 600x1000 (frame size)
      const finalWidth = 600
      const finalHeight = 1000
      
      // Create final canvas
      const previewCanvas = document.createElement('canvas')
      previewCanvas.width = finalWidth
      previewCanvas.height = finalHeight
      const ctx = previewCanvas.getContext('2d')

      // Draw the screen capture scaled to 500x1000, centered horizontally
      const screenWidth = 500
      const screenHeight = 1000
      const xOffset = (finalWidth - screenWidth) / 2 // (600 - 500) / 2 = 50
      ctx.drawImage(screenCanvas, xOffset, 0, screenWidth, screenHeight)

      // Draw the frame on top at 600x1000 (original size)
      if (phoneFrameImg) {
        await new Promise((resolve, reject) => {
          const frameImg = new Image()
          frameImg.crossOrigin = 'anonymous'
          frameImg.onload = () => {
            ctx.drawImage(frameImg, 0, 0, finalWidth, finalHeight)
            resolve()
          }
          frameImg.onerror = reject
          frameImg.src = phoneFrameImg.src
        })
      }
      
      // Set the preview image and show modal
      setPreviewImageUrl(previewCanvas.toDataURL('image/png'))
      setShowPreviewModal(true)
      
    } catch (error) {
      console.error('Preview error:', error)
      alert('Önizleme oluşturulurken bir hata oluştu!')
    }
  }

  return (
    <div className="phone-case-modal">
      <div className={`app ${isRotating ? 'rotating' : ''}`}>
      {/* Top Menu Bar */}
      <div className="top-menu">
        <button 
          className="download-btn" 
          onClick={() => setShowDownloadModal(true)}
          aria-label="Download design"
          title="Download"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>İndir</span>
        </button>
        
        <button 
          className="print-btn" 
          onClick={handlePrint}
          aria-label="Print design"
          title="Print"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="6 9 6 2 18 2 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="6" y="14" width="12" height="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Bastır</span>
        </button>
        
        <button 
          className="preview-btn" 
          onClick={handlePreview}
          aria-label="Preview design"
          title="Preview"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Ön İzleme</span>
        </button>
        
        {/* Spacer to center undo/redo buttons */}
        <div style={{ flex: 1 }}></div>
        
        {/* Undo/Redo Buttons */}
        <button 
          className="undo-btn" 
          onClick={handleUndo}
          disabled={historyIndex <= 0}
          aria-label="Undo"
          title="Geri Al"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 7v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        <button 
          className="redo-btn" 
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          aria-label="Redo"
          title="İleri Al"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 7v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 17a9 9 0 019-9 9 9 0 019 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        
        {/* Spacer to push remaining buttons to the right */}
        <div style={{ flex: 1 }}></div>
        
        <button 
          className="add-to-cart-btn" 
          onClick={handleAddToCart}
          disabled={isSaving}
          aria-label="Add to cart"
          title="Add to Cart"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
            <circle cx="20" cy="21" r="1" stroke="currentColor" strokeWidth="2"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="add-to-cart-text">
            <span className="cart-label">{isSaving ? 'Kaydediliyor...' : 'Sepete Ekle'}</span>
            {productPrice && !isSaving && (
              <span className="cart-price">
                {productComparePrice && productComparePrice !== productPrice && (
                  <span className="compare-price">{productComparePrice} </span>
                )}
                {productPrice}
              </span>
            )}
          </div>
        </button>
        
        <button 
          className="modal-close-button"
          onClick={() => {
            const modal = document.getElementById('phone-case-modal');
            if (modal) {
              modal.style.visibility = 'hidden';
              modal.style.opacity = '0';
              document.body.style.overflow = '';
            }
          }}
          aria-label="Close customizer"
        >
          ✕
        </button>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="modal-overlay" onClick={() => setShowDownloadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tasarımı İndir</h2>
              <button className="modal-close" onClick={() => setShowDownloadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-description">Dosya formatını seçin:</p>
              <div className="download-options">
                <button className="download-option-btn" onClick={() => handleDownload('jpg')}>
                  <div className="option-icon">📷</div>
                  <div className="option-info">
                    <div className="option-name">JPG</div>
                    <div className="option-desc">Yüksek kalite, küçük boyut</div>
                  </div>
                </button>
                <button className="download-option-btn" onClick={() => handleDownload('png')}>
                  <div className="option-icon">🖼️</div>
                  <div className="option-info">
                    <div className="option-name">PNG</div>
                    <div className="option-desc">Şeffaf arka plan desteği</div>
                  </div>
                </button>
                <button className="download-option-btn" onClick={() => handleDownload('svg')}>
                  <div className="option-icon">📐</div>
                  <div className="option-info">
                    <div className="option-name">SVG</div>
                    <div className="option-desc">Vektörel, ölçeklenebilir</div>
                  </div>
                </button>
                <button className="download-option-btn" onClick={() => handleDownload('pdf')}>
                  <div className="option-icon">📄</div>
                  <div className="option-info">
                    <div className="option-name">PDF</div>
                    <div className="option-desc">Baskıya hazır format</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="preview-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <button className="preview-modal-close" onClick={() => setShowPreviewModal(false)}>×</button>
          <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-image-container">
              {previewImageUrl && <img src={previewImageUrl} alt="Phone Case Preview" />}
            </div>
          </div>
        </div>
      )}

      <div className="app-content">
        {/* Sidebar Navigation */}
        <div className="sidebar">
        <div 
          className={`sidebar-icon ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('images');
            setUploadDrawerOpen(true);
          }}
          title="Resim Ekle"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
            <path d="M21 15L16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 15L8 12L3 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="sidebar-text">Resim Ekle</span>
        </div>
        <div 
          className={`sidebar-icon ${activeTab === 'assets' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('assets');
            setUploadDrawerOpen(true);
          }}
          title="Hazır Görseller"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
            <rect x="13" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
            <rect x="3" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
            <rect x="13" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span className="sidebar-text">Hazır Görseller</span>
        </div>
        <div 
          className={`sidebar-icon ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('text');
            setUploadDrawerOpen(true);
          }}
          title="Metin Ekle"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 7V4H20V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9 20H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="sidebar-text">Metin Ekle</span>
        </div>
        <div 
          className={`sidebar-icon ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('layers');
            setUploadDrawerOpen(true);
          }}
          title="Katmanları Yönet"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="sidebar-text">Katmanları Yönet</span>
        </div>
      </div>

      <div className="main-container">
        {/* Upload Drawer Toggle Button (Mobile Only) - Shows icon based on active tab */}
        <button 
          className="upload-drawer-toggle"
          onClick={() => setUploadDrawerOpen(!uploadDrawerOpen)}
          aria-label="Toggle upload panel"
        >
          {uploadDrawerOpen ? '✕' : (
            activeTab === 'images' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <path d="M21 15L16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 15L8 12L3 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : activeTab === 'assets' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="13" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="3" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="13" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            ) : activeTab === 'text' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7V4H20V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9 20H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : activeTab === 'layers' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : '📷'
          )}
        </button>
        
        {/* Backdrop for mobile drawer */}
        <div 
          className={`upload-drawer-backdrop ${uploadDrawerOpen ? 'open' : ''}`}
          onClick={() => setUploadDrawerOpen(false)}
          aria-label="Close drawer"
        />
        
        {/* Upload Section */}
        <div className={`upload-section ${uploadDrawerOpen ? 'open' : ''}`}>
          {/* Header with close button (sticky on mobile) */}
          <div className="upload-section-header">
            <button 
              className="upload-drawer-close"
              onClick={() => setUploadDrawerOpen(false)}
              aria-label="Close upload panel"
            >
              ✕
            </button>
          </div>
          
          {/* Content area with white background */}
          <div className="upload-section-content">
          {activeTab === 'images' ? (
            <>
              {/* Sub-tab Headers */}
              <div className="sub-tab-headers">
                <button
                  className={`sub-tab-header ${imageSubTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setImageSubTab('upload')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3-3m0 0l3 3m-3-3v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  className={`sub-tab-header ${imageSubTab === 'qr' ? 'active' : ''}`}
                  onClick={() => setImageSubTab('qr')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                    <rect x="14" y="14" width="3" height="3" fill="currentColor"/>
                    <rect x="18" y="14" width="3" height="3" fill="currentColor"/>
                    <rect x="14" y="18" width="3" height="3" fill="currentColor"/>
                    <rect x="18" y="18" width="3" height="3" fill="currentColor"/>
                  </svg>
                </button>
              </div>

              {/* Upload Sub-tab Content */}
              {imageSubTab === 'upload' ? (
                <>
                  <div 
                className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                />
                <button
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  RESİM EKLE
                </button>
                <p className="upload-hint">Resim yüklemek için tıklayın veya sürükleyin</p>
              </div>

              {/* Image Gallery */}
              {uploadedImages.length > 0 && (
                <div className="image-gallery">
                  <div className="gallery-grid">
                    {uploadedImages.map(image => (
                      <div
                        key={image.id}
                        className={`gallery-item ${selectedImage?.id === image.id ? 'selected' : ''}`}
                        onClick={() => handleImageClick(image)}
                      >
                        <img src={image.src} alt={image.name} />
                        <button
                          className="delete-thumb-btn"
                          onClick={(e) => handleDeleteImage(e, image.id)}
                          title="Delete image"
                        >
                        </button>
                        <div className="image-name">{image.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadedImages.length === 0 && (
                <div className="empty-state">
                  <p>Henüz resim yüklenmedi</p>
                </div>
              )}
                </>
              ) : (
                /* QR Sub-tab Content */
                <div className="qr-input-section">
                  <textarea
                    className="qr-input"
                    placeholder="Url veya yazı giriniz..."
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    rows="4"
                  />
                  
                  {/* Color Swatches */}
                  <div className="qr-color-swatches">
                    <button
                      className={`color-swatch ${activeQrColorPicker === 'qr' ? 'active' : ''}`}
                      style={{ background: qrColor }}
                      onClick={() => setActiveQrColorPicker('qr')}
                      title="QR Kod Rengi"
                    />
                    <button
                      className={`color-swatch ${activeQrColorPicker === 'bg' ? 'active' : ''}`}
                      style={{ background: qrBgColor }}
                      onClick={() => setActiveQrColorPicker('bg')}
                      title="Arka Plan Rengi"
                    />
                  </div>
                  
                  {/* Color Picker */}
                  <div className="qr-color-picker-container">
                    <input
                      type="color"
                      className="qr-color-picker"
                      value={activeQrColorPicker === 'qr' ? qrColor : qrBgColor}
                      onChange={(e) => {
                        if (activeQrColorPicker === 'qr') {
                          setQrColor(e.target.value)
                        } else {
                          setQrBgColor(e.target.value)
                        }
                      }}
                    />
                    <input
                      type="text"
                      className="qr-color-input"
                      value={activeQrColorPicker === 'qr' ? qrColor : qrBgColor}
                      onChange={(e) => {
                        const value = e.target.value
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                          if (activeQrColorPicker === 'qr') {
                            setQrColor(value)
                          } else {
                            setQrBgColor(value)
                          }
                        }
                      }}
                      placeholder="#000000"
                    />
                  </div>
                  
                  <button
                    className="add-qr-btn"
                    onClick={handleAddQR}
                    disabled={!qrInput.trim()}
                  >
                    QR KOD EKLE
                  </button>
                </div>
              )}
            </>
          ) : activeTab === 'assets' ? (
            <div className="assets-section">
              {assetViewMode === 'categories' ? (
                // Category folder view
                <>
                  <div className="section-header">
                    <h3>Kategoriler</h3>
                  </div>
                  
                  {/* Search Input */}
                  <div className="search-container">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button 
                        className="search-clear-btn"
                        onClick={() => setSearchQuery('')}
                        title="Temizle"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  <div className="assets-grid categories-grid">
                    {getCategoryData().length === 0 ? (
                      <div className="empty-state">
                        <p>{searchQuery ? 'Sonuç bulunamadı' : 'Yükleniyor...'}</p>
                      </div>
                    ) : (
                      getCategoryData().map(category => (
                        <div
                          key={category.name}
                          className="category-folder"
                          onClick={() => handleCategoryClick(category.name)}
                          title={`${category.name} (${category.count} resim)`}
                        >
                          <div className="category-thumbnail">
                            <img src={category.thumbnail} alt={category.name} />
                          </div>
                          <div className="category-name">{category.name}</div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                // Images view (when category is selected)
                <>
                  <div className="section-header">
                    <button className="back-btn" onClick={handleBackToCategories}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Geri
                    </button>
                    <h3>{selectedCategory}</h3>
                  </div>
                  
                  {/* Search Input */}
                  <div className="search-container">
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button 
                        className="search-clear-btn"
                        onClick={() => setSearchQuery('')}
                        title="Temizle"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  <div className="assets-grid">
                    {getFilteredAssets().length === 0 ? (
                      <div className="empty-state">
                        <p>{searchQuery ? 'Sonuç bulunamadı' : 'Yükleniyor...'}</p>
                      </div>
                    ) : (
                      getFilteredAssets().map(asset => (
                        <div
                          key={asset.id}
                          className="asset-item"
                          onClick={() => handleAssetClick(asset)}
                          title={asset.name}
                        >
                          <img src={asset.thumbnail} alt={asset.name} className="asset-thumbnail" />
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          ) : activeTab === 'text' ? (
            <div className="text-section">
              <div className="section-header">
                <h3>Metin Ekle</h3>
              </div>
              <div className="text-input-container">
                <textarea
                  className="text-input"
                  placeholder="Metninizi buraya yazın..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows="4"
                />
                <button
                  className="add-text-btn"
                  onClick={handleAddText}
                  disabled={!textInput.trim()}
                >
                  METİN EKLE
                </button>
              </div>
            </div>
          ) : activeTab === 'layers' ? (
            <div className="layers-section">
              {getAllLayers().length === 0 ? (
                <div className="empty-state">
                  <p>Henüz katman eklenmedi</p>
                </div>
              ) : (
                <div className="layers-list">
                  {getAllLayers().reverse().map((layer, index) => {
                    const actualIndex = getAllLayers().length - 1 - index
                    return (
                      <div
                        key={layer.id}
                        className={`layer-item ${(layer.type === 'image' && activeImageId === layer.id) || (layer.type === 'text' && activeTextId === layer.id) ? 'active' : ''}`}
                        draggable
                        onDragStart={(e) => handleLayerDragStart(e, actualIndex)}
                        onDragOver={(e) => handleLayerDragOver(e, actualIndex)}
                        onDragEnd={handleLayerDragEnd}
                        onClick={() => handleLayerClick(layer)}
                      >
                        <div className="layer-drag-handle">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 5h6M9 12h6M9 19h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div className="layer-preview">
                          {layer.type === 'image' ? (
                            <img src={layer.data.src} alt={layer.name} />
                          ) : (
                            <div className="layer-text-preview" style={{ fontFamily: layer.data.fontFamily }}>A</div>
                          )}
                        </div>
                        <div className="layer-info">
                          <div className="layer-name">{layer.name}</div>
                          <div className="layer-type">{layer.type === 'image' ? 'Resim' : 'Metin'}</div>
                        </div>
                        <button
                          className="layer-delete-btn"
                          onClick={(e) => handleDeleteLayer(e, layer)}
                          title="Sil"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-add-section">
              <textarea 
                className="text-input"
                placeholder="Metninizi buraya yazın..."
                rows="4"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <button 
                className="add-text-btn"
                onClick={handleAddText}
              >
                Metni Ekle
              </button>
            </div>
          )}
          </div>
        </div>

        {/* Phone Case Section */}
        <div className="phone-section" onClick={handlePhoneScreenClick}>
          <div className="phone-case">
            <div className="phone-screen">
              {getAllLayers().map(layer => (
                layer.type === 'image' ? (
                  <div
                    key={layer.id}
                    className={`placed-image-wrapper ${activeImageId === layer.id ? 'active' : ''}`}
                    style={{
                      left: `${layer.data.x}px`,
                      top: `${layer.data.y}px`,
                      transform: `scale(${layer.data.scale}) rotate(${(layer.data.rotation || 0) + (layer.data.transformRotate || 0)}deg)`,
                    }}
                  >
                    <img
                      src={layer.data.src}
                      alt="Placed on case"
                      className="placed-image"
                      onMouseDown={(e) => handleMouseDown(e, layer.id)}
                      onTouchStart={(e) => handleImageTouchStart(e, layer.id)}
                      draggable={false}
                      style={{ 
                        touchAction: 'none',
                        opacity: layer.data.opacity !== undefined ? layer.data.opacity : 1,
                        filter: (() => {
                          const filters = []
                          if (layer.data.filter && layer.data.filter !== 'none') {
                            filters.push(layer.data.filter)
                          }
                          if (layer.data.shadowColor) {
                            filters.push(`drop-shadow(2px 2px 4px ${layer.data.shadowColor})`)
                          }
                          return filters.length > 0 ? filters.join(' ') : 'none'
                        })(),
                        transform: `scaleX(${(layer.data.scaleX || 1) * (layer.data.flipX || 1)}) scaleY(${(layer.data.scaleY || 1) * (layer.data.flipY || 1)})`,
                        mixBlendMode: layer.data.mixBlendMode || 'normal'
                      }}
                    />
                    {activeImageId === layer.id && !isMultiTouch && (
                      <>
                        <button
                          className="image-delete-btn"
                          onClick={(e) => handleRemovePlacedImage(e, layer.id)}
                          title="Delete image"
                        >
                          ×
                        </button>
                        <div
                          className="image-rotate-handle"
                          onMouseDown={(e) => handleRotateStart(e, layer.id)}
                          onTouchStart={(e) => handleHandleTouchStart(e, layer.id, 'rotate', 'image')}
                          title="Rotate"
                        >
                          ⟳
                        </div>
                        <div
                          className="image-resize-handle"
                          onMouseDown={(e) => handleResizeStart(e, layer.id)}
                          onTouchStart={(e) => handleHandleTouchStart(e, layer.id, 'resize', 'image')}
                          title="Resize"
                        >
                          ⤡
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div
                    key={layer.id}
                    className={`placed-text-wrapper ${activeTextId === layer.id ? 'active' : ''}`}
                    style={{
                      left: `${layer.data.x}px`,
                      top: `${layer.data.y}px`,
                      transform: `translate(-50%, -50%) scale(${layer.data.scale}) rotate(${(layer.data.rotation || 0) + (layer.data.transformRotate || 0)}deg)`,
                    }}
                  >
                    <div
                      className="placed-text"
                      style={{
                        fontSize: `${layer.data.fontSize}px`,
                        color: layer.data.color,
                        fontFamily: layer.data.fontFamily,
                        fontWeight: layer.data.fontWeight,
                        fontStyle: layer.data.fontStyle,
                        touchAction: 'none',
                        opacity: layer.data.opacity !== undefined ? layer.data.opacity : 1,
                        textShadow: layer.data.textShadow || 'none',
                        lineHeight: layer.data.lineHeight || 1,
                        letterSpacing: `${layer.data.letterSpacing || 0}px`,
                        textDecoration: layer.data.textDecoration || 'none',
                        textTransform: layer.data.textTransform || 'none',
                        textAlign: layer.data.textAlign || 'left',
                        transform: `scaleX(${(layer.data.scaleX || 1) * (layer.data.flipX || 1)}) scaleY(${(layer.data.scaleY || 1) * (layer.data.flipY || 1)})`
                      }}
                      onMouseDown={(e) => handleTextMouseDown(e, layer.id)}
                      onTouchStart={(e) => handleTextTouchStart(e, layer.id)}
                    >
                      {layer.data.content.split('\n').map((line, index) => (
                        <div key={index}>{line || '\u00A0'}</div>
                      ))}
                    </div>
                    {activeTextId === layer.id && !isMultiTouch && (
                      <>
                        <button
                          className="image-delete-btn"
                          onClick={(e) => handleRemovePlacedText(e, layer.id)}
                          title="Delete text"
                        >
                          ×
                        </button>
                        <div
                          className="image-rotate-handle"
                          onMouseDown={(e) => handleTextRotateStart(e, layer.id)}
                          onTouchStart={(e) => handleHandleTouchStart(e, layer.id, 'rotate', 'text')}
                          title="Rotate"
                        >
                          ⟳
                        </div>
                        <div
                          className="image-resize-handle"
                          onMouseDown={(e) => handleTextResizeStart(e, layer.id)}
                          onTouchStart={(e) => handleHandleTouchStart(e, layer.id, 'resize', 'text')}
                          title="Resize"
                        >
                          ⤡
                        </div>
                      </>
                    )}
                  </div>
                )
              ))}
            </div>
            {/* Phone Case Frame Overlay */}
            <div className="phone-case-frame">
              <img src={frameUrl} alt="Phone case frame" />
            </div>
          </div>

          {/* Text Editing Panel */}
          {activeTextId && (
            <div 
              ref={panelRef}
              className="text-edit-panel"
              style={panelPosition.x !== null ? {
                position: 'fixed',
                left: `${panelPosition.x}px`,
                top: `${panelPosition.y}px`,
                transform: 'none',
                right: 'auto'
              } : {}}
            >
              {/* Panel Header */}
              <div className="panel-header">
                {/* Back Button - Only show in submenus (left side, hidden on mobile) */}
                {textEditMode !== 'main' && (
                  <button className="panel-back-btn desktop-only" onClick={() => setTextEditMode('main')} title="Geri">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                
                {/* Drag Handle - Center */}
                <div 
                  className="panel-drag-handle"
                  onMouseDown={handlePanelDragStart}
                  title="Paneli taşımak için sürükleyin"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="5" r="1" fill="currentColor"/>
                    <circle cx="9" cy="12" r="1" fill="currentColor"/>
                    <circle cx="9" cy="19" r="1" fill="currentColor"/>
                    <circle cx="15" cy="5" r="1" fill="currentColor"/>
                    <circle cx="15" cy="12" r="1" fill="currentColor"/>
                    <circle cx="15" cy="19" r="1" fill="currentColor"/>
                  </svg>
                  <span>Taşı</span>
                </div>
                
                {/* Right Button - Close (X) in main menu, Back (Geri) in submenus */}
                {textEditMode === 'main' ? (
                  <button 
                    className="panel-close-btn" 
                    onClick={() => setActiveTextId(null)}
                    title="Kapat"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ) : (
                  <button 
                    className="panel-back-btn-right" 
                    onClick={() => setTextEditMode('main')}
                    title="Geri"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Geri</span>
                  </button>
                )}
              </div>
              
              {textEditMode === 'main' && (
                <div className="text-edit-icons">
                  <button 
                    className="text-edit-icon-btn"
                    onClick={() => setTextEditMode('font')}
                    title="Yazı Tipi"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <text x="4" y="18" fontSize="16" fontWeight="bold" fill="currentColor">A</text>
                    </svg>
                    <span>Yazı Tipi</span>
                  </button>
                  
                  <button 
                    className="text-edit-icon-btn"
                    onClick={() => setTextEditMode('format')}
                    title="Format"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M5 4h14M5 12h14M5 20h14" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>Format</span>
                  </button>
                  
                  <button 
                    className="text-edit-icon-btn"
                    onClick={() => setTextEditMode('color')}
                    title="Renk"
                  >
                    <div className="color-preview" style={{ background: placedTexts.find(t => t.id === activeTextId)?.color }}></div>
                    <span>Renk</span>
                  </button>
                  
                  <button 
                    className="text-edit-icon-btn"
                    onClick={() => setTextEditMode('size')}
                    title="Boyut"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <text x="2" y="14" fontSize="12" fontWeight="bold" fill="currentColor">A</text>
                      <text x="12" y="18" fontSize="8" fontWeight="bold" fill="currentColor">A</text>
                    </svg>
                    <span>Boyut</span>
                  </button>
                  
                  <button 
                    className="text-edit-icon-btn"
                    onClick={() => setTextEditMode('edit')}
                    title="Metni Düzenle"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>Düzenle</span>
                  </button>
                  
                  <button 
                    className="text-edit-icon-btn"
                    onClick={() => setTextEditMode('transform')}
                    title="Dönüştür"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>Dönüştür</span>
                  </button>
                  
                  <button 
                    className="text-edit-icon-btn"
                    onClick={() => setTextEditMode('position')}
                    title="Pozisyon"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 8l4-4m0 0l4 4m-4-4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M20 16l-4 4m0 0l-4-4m4 4V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Pozisyon</span>
                  </button>
                  
                  <button 
                    className="text-edit-icon-btn"
                    onClick={() => {
                      // Reset text to original state - clear ALL modifications
                      if (activeTextId) {
                        setPlacedTexts(prev => prev.map(text => 
                          text.id === activeTextId
                            ? { 
                                ...text, 
                                x: 160, 
                                y: 320, 
                                scale: 1, 
                                rotation: 0,
                                transformRotate: 0,
                                scaleX: 1,
                                scaleY: 1,
                                flipX: 1,
                                flipY: 1,
                                opacity: 1,
                                textShadow: 'none',
                                lineHeight: 1,
                                letterSpacing: 0,
                                textDecoration: 'none',
                                textTransform: 'none',
                                textAlign: 'left'
                              }
                            : text
                        ))
                        // Reset UI state
                        setTextOpacity(1)
                        setTextLineHeight(1)
                        setTextLetterSpacing(0)
                      }
                    }}
                    title="Sıfırla"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Sıfırla</span>
                  </button>
                  
                  <button 
                    className="text-edit-icon-btn delete-btn"
                    onClick={(e) => handleRemovePlacedText(e, activeTextId)}
                    title="Kaldır"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2"/>
                      <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2"/>
                      <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <span>Kaldır</span>
                  </button>
                </div>
              )}
              
              {textEditMode === 'font' && (
                <div className="text-edit-detail">
                  <div className="detail-content">
                    <select
                      value={placedTexts.find(t => t.id === activeTextId)?.fontFamily || 'Arial'}
                      onChange={(e) => {
                        setPlacedTexts(prev => prev.map(text => 
                          text.id === activeTextId
                            ? { ...text, fontFamily: e.target.value }
                            : text
                        ))
                      }}
                      className="font-family-select-large"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Impact">Impact</option>
                      <option value="Comic Sans MS">Comic Sans MS</option>
                      <option value="Trebuchet MS">Trebuchet MS</option>
                      <option value="Palatino">Palatino</option>
                    </select>
                  </div>
                </div>
              )}
              
              {textEditMode === 'format' && (
                <div className="text-edit-detail">
                  <div className="detail-content">
                    {/* Text Style Buttons */}
                    <div className="format-buttons-grid">
                      <button
                        className={`format-btn-square ${placedTexts.find(t => t.id === activeTextId)?.fontWeight === 'bold' ? 'active' : ''}`}
                        onClick={() => {
                          setPlacedTexts(prev => prev.map(text => 
                            text.id === activeTextId
                              ? { ...text, fontWeight: text.fontWeight === 'bold' ? 'normal' : 'bold' }
                              : text
                          ))
                        }}
                        title="Kalın"
                      >
                        <strong style={{ fontSize: '1.5rem' }}>B</strong>
                      </button>
                      <button
                        className={`format-btn-square ${placedTexts.find(t => t.id === activeTextId)?.fontStyle === 'italic' ? 'active' : ''}`}
                        onClick={() => {
                          setPlacedTexts(prev => prev.map(text => 
                            text.id === activeTextId
                              ? { ...text, fontStyle: text.fontStyle === 'italic' ? 'normal' : 'italic' }
                              : text
                          ))
                        }}
                        title="İtalik"
                      >
                        <em style={{ fontSize: '1.5rem', fontStyle: 'italic' }}>I</em>
                      </button>
                      <button
                        className={`format-btn-square ${placedTexts.find(t => t.id === activeTextId)?.textDecoration === 'underline' ? 'active' : ''}`}
                        onClick={() => {
                          setPlacedTexts(prev => prev.map(text => 
                            text.id === activeTextId
                              ? { ...text, textDecoration: text.textDecoration === 'underline' ? 'none' : 'underline' }
                              : text
                          ))
                        }}
                        title="Altı Çizili"
                      >
                        <span style={{ fontSize: '1.5rem', textDecoration: 'underline' }}>U</span>
                      </button>
                      <button
                        className={`format-btn-square ${placedTexts.find(t => t.id === activeTextId)?.textTransform === 'uppercase' ? 'active' : ''}`}
                        onClick={() => {
                          setPlacedTexts(prev => prev.map(text => 
                            text.id === activeTextId
                              ? { 
                                  ...text, 
                                  textTransform: text.textTransform === 'uppercase' ? 'none' : 'uppercase' 
                                }
                              : text
                          ))
                        }}
                        title="Büyük/Küçük Harf"
                      >
                        <span style={{ fontSize: '1.2rem' }}>Aa</span>
                      </button>
                    </div>

                    {/* Text Alignment Buttons */}
                    <div className="format-buttons-grid" style={{ marginTop: '1rem' }}>
                      <button
                        className={`format-btn-square ${placedTexts.find(t => t.id === activeTextId)?.textAlign === 'left' ? 'active' : ''}`}
                        onClick={() => {
                          setPlacedTexts(prev => prev.map(text => 
                            text.id === activeTextId
                              ? { ...text, textAlign: 'left' }
                              : text
                          ))
                        }}
                        title="Sola Hizala"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <line x1="3" y1="12" x2="15" y2="12"/>
                          <line x1="3" y1="18" x2="18" y2="18"/>
                        </svg>
                      </button>
                      <button
                        className={`format-btn-square ${placedTexts.find(t => t.id === activeTextId)?.textAlign === 'center' ? 'active' : ''}`}
                        onClick={() => {
                          setPlacedTexts(prev => prev.map(text => 
                            text.id === activeTextId
                              ? { ...text, textAlign: 'center' }
                              : text
                          ))
                        }}
                        title="Ortala"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <line x1="6" y1="12" x2="18" y2="12"/>
                          <line x1="4" y1="18" x2="20" y2="18"/>
                        </svg>
                      </button>
                      <button
                        className={`format-btn-square ${placedTexts.find(t => t.id === activeTextId)?.textAlign === 'right' ? 'active' : ''}`}
                        onClick={() => {
                          setPlacedTexts(prev => prev.map(text => 
                            text.id === activeTextId
                              ? { ...text, textAlign: 'right' }
                              : text
                          ))
                        }}
                        title="Sağa Hizala"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <line x1="9" y1="12" x2="21" y2="12"/>
                          <line x1="6" y1="18" x2="21" y2="18"/>
                        </svg>
                      </button>
                      <button
                        className={`format-btn-square ${placedTexts.find(t => t.id === activeTextId)?.textAlign === 'justify' ? 'active' : ''}`}
                        onClick={() => {
                          setPlacedTexts(prev => prev.map(text => 
                            text.id === activeTextId
                              ? { ...text, textAlign: 'justify' }
                              : text
                          ))
                        }}
                        title="İki Yana Yasla"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <line x1="3" y1="12" x2="21" y2="12"/>
                          <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {textEditMode === 'color' && (
                <div className="text-edit-detail">
                  <div className="detail-content">
                    {/* Color Tabs */}
                    <div className="submenu-tabs">
                      <div 
                        className={textColorTab === 'fill' ? 'submenu-tab submenu-tab-active' : 'submenu-tab'}
                        onClick={() => setTextColorTab('fill')}
                      >
                        Renk
                      </div>
                      <div 
                        className={textColorTab === 'shadow' ? 'submenu-tab submenu-tab-active' : 'submenu-tab'}
                        onClick={() => setTextColorTab('shadow')}
                      >
                        Gölge
                      </div>
                    </div>
                    
                    {textColorTab === 'fill' && (
                      <>
                        <div className="shadow-color-picker">
                          <div 
                            className="color-picker-2d"
                            style={{
                              background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${textColorHue}, 100%, 50%))`
                            }}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              const x = e.clientX - rect.left
                              const y = e.clientY - rect.top
                              const s = Math.round((x / rect.width) * 100)
                              const l = Math.round(100 - (y / rect.height) * 100)
                              setTextColorSaturation(s)
                              setTextColorLightness(l)
                              const newColor = hslToHex(textColorHue, s, l)
                              if (activeTextId) {
                                setPlacedTexts(prev => prev.map(text => 
                                  text.id === activeTextId
                                    ? { ...text, color: newColor }
                                    : text
                                ))
                              }
                            }}
                          >
                            <div 
                              className="color-picker-cursor"
                              style={{
                                left: `${textColorSaturation}%`,
                                top: `${100 - textColorLightness}%`
                              }}
                            />
                          </div>
                          
                          <div className="hue-slider-container">
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={textColorHue}
                              className="hue-slider"
                              onChange={(e) => {
                                const newHue = parseInt(e.target.value)
                                setTextColorHue(newHue)
                                const newColor = hslToHex(newHue, textColorSaturation, textColorLightness)
                                if (activeTextId) {
                                  setPlacedTexts(prev => prev.map(text => 
                                    text.id === activeTextId
                                      ? { ...text, color: newColor }
                                      : text
                                  ))
                                }
                              }}
                            />
                          </div>
                          
                          <div className="hex-input-container">
                            <input
                              type="text"
                              value={placedTexts.find(t => t.id === activeTextId)?.color || '#000000'}
                              className="hex-input"
                              onChange={(e) => {
                                const value = e.target.value
                                if (/^#[0-9A-F]{6}$/i.test(value)) {
                                  const hsl = hexToHsl(value)
                                  setTextColorHue(hsl.h)
                                  setTextColorSaturation(hsl.s)
                                  setTextColorLightness(hsl.l)
                                  if (activeTextId) {
                                    setPlacedTexts(prev => prev.map(text => 
                                      text.id === activeTextId
                                        ? { ...text, color: value }
                                        : text
                                    ))
                                  }
                                }
                              }}
                            />
                            <button className="eyedropper-btn" title="Renk seçici">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2.586 16.726A2 2 0 0 0 2 18.138v3.862h3.862a2 2 0 0 0 1.414-.586l9.428-9.428L13.29 8.572l-10.704 8.154z"/>
                                <path d="M17.704 4.29l2.006 2.006a1 1 0 0 1 0 1.414l-1.414 1.414-3.42-3.42 1.414-1.414a1 1 0 0 1 1.414 0z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="opacity-control">
                          <label>Şeffaflık</label>
                          <div className="opacity-slider-wrapper">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={textOpacity}
                              className="opacity-slider"
                              onChange={(e) => {
                                const newOpacity = parseFloat(e.target.value)
                                setTextOpacity(newOpacity)
                                if (activeTextId) {
                                  setPlacedTexts(prev => prev.map(text => 
                                    text.id === activeTextId
                                      ? { ...text, opacity: newOpacity }
                                      : text
                                  ))
                                }
                              }}
                            />
                            <span className="opacity-value">{textOpacity.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {textColorTab === 'shadow' && (
                      <>
                        <div className="shadow-color-picker">
                          <div 
                            className="color-picker-2d"
                            style={{
                              background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${textShadowHue}, 100%, 50%))`
                            }}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              const x = e.clientX - rect.left
                              const y = e.clientY - rect.top
                              const s = Math.round((x / rect.width) * 100)
                              const l = Math.round(100 - (y / rect.height) * 100)
                              setTextShadowSaturation(s)
                              setTextShadowLightness(l)
                              const newColor = hslToHex(textShadowHue, s, l)
                              setTextShadowColor(newColor)
                              if (activeTextId) {
                                setPlacedTexts(prev => prev.map(text => 
                                  text.id === activeTextId
                                    ? { ...text, textShadow: `2px 2px 4px ${newColor}` }
                                    : text
                                ))
                              }
                            }}
                          >
                            <div 
                              className="color-picker-cursor"
                              style={{
                                left: `${textShadowSaturation}%`,
                                top: `${100 - textShadowLightness}%`
                              }}
                            />
                          </div>
                          
                          <div className="hue-slider-container">
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={textShadowHue}
                              className="hue-slider"
                              onChange={(e) => {
                                const newHue = parseInt(e.target.value)
                                setTextShadowHue(newHue)
                                const newColor = hslToHex(newHue, textShadowSaturation, textShadowLightness)
                                setTextShadowColor(newColor)
                                if (activeTextId) {
                                  setPlacedTexts(prev => prev.map(text => 
                                    text.id === activeTextId
                                      ? { ...text, textShadow: `2px 2px 4px ${newColor}` }
                                      : text
                                  ))
                                }
                              }}
                            />
                          </div>
                          
                          <div className="hex-input-container">
                            <input
                              type="text"
                              value={textShadowColor}
                              className="hex-input"
                              onChange={(e) => {
                                const value = e.target.value
                                setTextShadowColor(value)
                                if (/^#[0-9A-F]{6}$/i.test(value)) {
                                  const hsl = hexToHsl(value)
                                  setTextShadowHue(hsl.h)
                                  setTextShadowSaturation(hsl.s)
                                  setTextShadowLightness(hsl.l)
                                  if (activeTextId) {
                                    setPlacedTexts(prev => prev.map(text => 
                                      text.id === activeTextId
                                        ? { ...text, textShadow: `2px 2px 4px ${value}` }
                                        : text
                                    ))
                                  }
                                }
                              }}
                            />
                            <button className="eyedropper-btn" title="Renk seçici">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2.586 16.726A2 2 0 0 0 2 18.138v3.862h3.862a2 2 0 0 0 1.414-.586l9.428-9.428L13.29 8.572l-10.704 8.154z"/>
                                <path d="M17.704 4.29l2.006 2.006a1 1 0 0 1 0 1.414l-1.414 1.414-3.42-3.42 1.414-1.414a1 1 0 0 1 1.414 0z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {textEditMode === 'transform' && (
                <div className="text-edit-detail">
                  <div className="detail-content">
                    {/* Rotate Slider */}
                    <div className="transform-control">
                      <div className="transform-control-header">
                        <label>Çevir</label>
                        <span className="transform-value">{placedTexts.find(t => t.id === activeTextId)?.transformRotate || 0}</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={placedTexts.find(t => t.id === activeTextId)?.transformRotate || 0}
                        className="transform-slider"
                        onChange={(e) => {
                          const newRotate = parseInt(e.target.value)
                          if (activeTextId) {
                            setPlacedTexts(prev => prev.map(text => 
                              text.id === activeTextId
                                ? { ...text, transformRotate: newRotate }
                                : text
                            ))
                          }
                        }}
                      />
                    </div>

                    {/* Scale-X Slider */}
                    <div className="transform-control">
                      <div className="transform-control-header">
                        <label>Scale-X</label>
                        <span className="transform-value">{(placedTexts.find(t => t.id === activeTextId)?.scaleX || 1).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.01"
                        value={placedTexts.find(t => t.id === activeTextId)?.scaleX || 1}
                        className="transform-slider"
                        onChange={(e) => {
                          const newScaleX = parseFloat(e.target.value)
                          if (activeTextId) {
                            setPlacedTexts(prev => prev.map(text => 
                              text.id === activeTextId
                                ? { ...text, scaleX: newScaleX }
                                : text
                            ))
                          }
                        }}
                      />
                    </div>

                    {/* Scale-Y Slider */}
                    <div className="transform-control">
                      <div className="transform-control-header">
                        <label>Scale-Y</label>
                        <span className="transform-value">{(placedTexts.find(t => t.id === activeTextId)?.scaleY || 1).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.01"
                        value={placedTexts.find(t => t.id === activeTextId)?.scaleY || 1}
                        className="transform-slider"
                        onChange={(e) => {
                          const newScaleY = parseFloat(e.target.value)
                          if (activeTextId) {
                            setPlacedTexts(prev => prev.map(text => 
                              text.id === activeTextId
                                ? { ...text, scaleY: newScaleY }
                                : text
                            ))
                          }
                        }}
                      />
                    </div>

                    {/* Flip Buttons */}
                    <div className="flip-buttons">
                      <button 
                        className="flip-btn"
                        onClick={() => {
                          if (activeTextId) {
                            setPlacedTexts(prev => prev.map(text => 
                              text.id === activeTextId
                                ? { ...text, flipX: (text.flipX || 1) * -1 }
                                : text
                            ))
                          }
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3" />
                          <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
                          <path d="M12 20v2" />
                          <path d="M12 14v2" />
                          <path d="M12 8v2" />
                          <path d="M12 2v2" />
                        </svg>
                        Yatay Çevir
                      </button>
                      <button 
                        className="flip-btn"
                        onClick={() => {
                          if (activeTextId) {
                            setPlacedTexts(prev => prev.map(text => 
                              text.id === activeTextId
                                ? { ...text, flipY: (text.flipY || 1) * -1 }
                                : text
                            ))
                          }
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" />
                          <path d="M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
                          <path d="M20 12h2" />
                          <path d="M14 12h2" />
                          <path d="M8 12h2" />
                          <path d="M2 12h2" />
                        </svg>
                        Dikey Çevir
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {textEditMode === 'position' && (
                <div className="text-edit-detail">
                  <div className="detail-content">
                    {/* Position Tabs */}
                    <div className="submenu-tabs">
                      <div 
                        className={positionTab === 'align' ? 'submenu-tab submenu-tab-active' : 'submenu-tab'}
                        onClick={() => setPositionTab('align')}
                      >
                        Hizalama
                      </div>
                      <div 
                        className={positionTab === 'arrange' ? 'submenu-tab submenu-tab-active' : 'submenu-tab'}
                        onClick={() => setPositionTab('arrange')}
                      >
                        Düzenle
                      </div>
                    </div>

                    {positionTab === 'align' && (
                      <div className="alignment-grid">
                        {/* Top Align */}
                        <button 
                          className="align-btn"
                          onClick={() => {
                            if (activeTextId) {
                              setPlacedTexts(prev => prev.map(text => 
                                text.id === activeTextId
                                  ? { ...text, y: 50 }
                                  : text
                              ))
                            }
                          }}
                          title="Üste Hizala"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="4" y1="4" x2="20" y2="4" />
                            <rect x="8" y="8" width="8" height="12" />
                          </svg>
                        </button>

                        {/* Center Vertical */}
                        <button 
                          className="align-btn"
                          onClick={() => {
                            if (activeTextId) {
                              setPlacedTexts(prev => prev.map(text => 
                                text.id === activeTextId
                                  ? { ...text, y: 320 }
                                  : text
                              ))
                            }
                          }}
                          title="Dikey Ortala"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="4" y1="12" x2="20" y2="12" />
                            <rect x="8" y="6" width="8" height="12" />
                          </svg>
                        </button>

                        {/* Bottom Align */}
                        <button 
                          className="align-btn"
                          onClick={() => {
                            if (activeTextId) {
                              setPlacedTexts(prev => prev.map(text => 
                                text.id === activeTextId
                                  ? { ...text, y: 590 }
                                  : text
                              ))
                            }
                          }}
                          title="Alta Hizala"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="4" y1="20" x2="20" y2="20" />
                            <rect x="8" y="4" width="8" height="12" />
                          </svg>
                        </button>

                        {/* Left Align */}
                        <button 
                          className="align-btn"
                          onClick={() => {
                            if (activeTextId) {
                              setPlacedTexts(prev => prev.map(text => 
                                text.id === activeTextId
                                  ? { ...text, x: 50 }
                                  : text
                              ))
                            }
                          }}
                          title="Sola Hizala"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="4" y1="4" x2="4" y2="20" />
                            <rect x="8" y="8" width="12" height="8" />
                          </svg>
                        </button>

                        {/* Center Horizontal */}
                        <button 
                          className="align-btn"
                          onClick={() => {
                            if (activeTextId) {
                              setPlacedTexts(prev => prev.map(text => 
                                text.id === activeTextId
                                  ? { ...text, x: 160 }
                                  : text
                              ))
                            }
                          }}
                          title="Yatay Ortala"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="4" x2="12" y2="20" />
                            <rect x="6" y="8" width="12" height="8" />
                          </svg>
                        </button>

                        {/* Right Align */}
                        <button 
                          className="align-btn"
                          onClick={() => {
                            if (activeTextId) {
                              setPlacedTexts(prev => prev.map(text => 
                                text.id === activeTextId
                                  ? { ...text, x: 270 }
                                  : text
                              ))
                            }
                          }}
                          title="Sağa Hizala"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="20" y1="4" x2="20" y2="20" />
                            <rect x="4" y="8" width="12" height="8" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {positionTab === 'arrange' && (
                      <div className="arrange-buttons">
                        <button 
                          className="arrange-btn"
                          onClick={() => {
                            if (activeTextId) {
                              const currentIndex = allLayers.findIndex(l => l.id === activeTextId)
                              if (currentIndex < allLayers.length - 1) {
                                const newLayers = [...allLayers]
                                const temp = newLayers[currentIndex]
                                newLayers[currentIndex] = newLayers[currentIndex + 1]
                                newLayers[currentIndex + 1] = temp
                                setAllLayers(newLayers)
                              }
                            }
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                          Öne Getir
                        </button>
                        <button 
                          className="arrange-btn"
                          onClick={() => {
                            if (activeTextId) {
                              const currentIndex = allLayers.findIndex(l => l.id === activeTextId)
                              if (currentIndex > 0) {
                                const newLayers = [...allLayers]
                                const temp = newLayers[currentIndex]
                                newLayers[currentIndex] = newLayers[currentIndex - 1]
                                newLayers[currentIndex - 1] = temp
                                setAllLayers(newLayers)
                              }
                            }
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 11v6a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-6"/>
                            <polyline points="9 21 3 21 3 15"/>
                            <line x1="14" y1="10" x2="3" y2="21"/>
                          </svg>
                          Arkaya Gönder
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {textEditMode === 'edit' && (
                <div className="text-edit-detail">
                  <div className="detail-content">
                    <textarea
                      value={placedTexts.find(t => t.id === activeTextId)?.content || ''}
                      onChange={(e) => {
                        setPlacedTexts(prev => prev.map(text => 
                          text.id === activeTextId
                            ? { ...text, content: e.target.value }
                            : text
                        ))
                      }}
                      className="text-edit-textarea"
                      rows="1"
                      placeholder="Metninizi buraya yazın..."
                    />
                  </div>
                </div>
              )}
              
              {textEditMode === 'size' && (
                <div className="text-edit-detail">
                  <div className="detail-content">
                    {/* Font Size */}
                    <div className="size-control">
                      <div className="size-control-header">
                        <label>Yazı Boyutu</label>
                        <input
                          type="number"
                          min="12"
                          max="120"
                          value={placedTexts.find(t => t.id === activeTextId)?.fontSize || 24}
                          className="size-value-input"
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 24
                            setPlacedTexts(prev => prev.map(text => 
                              text.id === activeTextId
                                ? { ...text, fontSize: value }
                                : text
                            ))
                          }}
                        />
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="120"
                        value={placedTexts.find(t => t.id === activeTextId)?.fontSize || 24}
                        className="size-slider"
                        onChange={(e) => {
                          const value = parseInt(e.target.value)
                          setPlacedTexts(prev => prev.map(text => 
                            text.id === activeTextId
                              ? { ...text, fontSize: value }
                              : text
                          ))
                        }}
                      />
                    </div>

                    {/* Line Height */}
                    <div className="size-control">
                      <div className="size-control-header">
                        <label>Satır Aralığı</label>
                        <input
                          type="number"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={placedTexts.find(t => t.id === activeTextId)?.lineHeight || 1}
                          className="size-value-input"
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 1
                            setTextLineHeight(value)
                            setPlacedTexts(prev => prev.map(text => 
                              text.id === activeTextId
                                ? { ...text, lineHeight: value }
                                : text
                            ))
                          }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.01"
                        value={placedTexts.find(t => t.id === activeTextId)?.lineHeight || 1}
                        className="size-slider"
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          setTextLineHeight(value)
                          setPlacedTexts(prev => prev.map(text => 
                            text.id === activeTextId
                              ? { ...text, lineHeight: value }
                              : text
                          ))
                        }}
                      />
                    </div>

                    {/* Letter Spacing */}
                    <div className="size-control">
                      <div className="size-control-header">
                        <label>Harf Boşluğu</label>
                        <input
                          type="number"
                          min="-5"
                          max="20"
                          step="0.5"
                          value={placedTexts.find(t => t.id === activeTextId)?.letterSpacing || 0}
                          className="size-value-input"
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0
                            setTextLetterSpacing(value)
                            setPlacedTexts(prev => prev.map(text => 
                              text.id === activeTextId
                                ? { ...text, letterSpacing: value }
                                : text
                            ))
                          }}
                        />
                      </div>
                      <input
                        type="range"
                        min="-5"
                        max="20"
                        step="0.1"
                        value={placedTexts.find(t => t.id === activeTextId)?.letterSpacing || 0}
                        className="size-slider"
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          setTextLetterSpacing(value)
                          setPlacedTexts(prev => prev.map(text => 
                            text.id === activeTextId
                              ? { ...text, letterSpacing: value }
                              : text
                          ))
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Image Editing Panel */}
          {activeImageId && !isMultiTouch && (
            <div 
              ref={panelRef}
              className="image-edit-panel"
              style={panelPosition.x !== null ? {
                position: 'fixed',
                left: `${panelPosition.x}px`,
                top: `${panelPosition.y}px`,
                transform: 'none',
                right: 'auto'
              } : {}}
            >
              {/* Panel Header */}
              <div className="panel-header">
                {/* Back Button - Only show in submenus (left side, hidden on mobile) */}
                {imageEditMode !== 'main' && (
                  <button className="panel-back-btn desktop-only" onClick={() => setImageEditMode('main')} title="Geri">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                
                {/* Drag Handle - Center */}
                <div 
                  className="panel-drag-handle"
                  onMouseDown={handlePanelDragStart}
                  title="Paneli taşımak için sürükleyin"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="9" cy="5" r="1" fill="currentColor"/>
                    <circle cx="9" cy="12" r="1" fill="currentColor"/>
                    <circle cx="9" cy="19" r="1" fill="currentColor"/>
                    <circle cx="15" cy="5" r="1" fill="currentColor"/>
                    <circle cx="15" cy="12" r="1" fill="currentColor"/>
                    <circle cx="15" cy="19" r="1" fill="currentColor"/>
                  </svg>
                  <span>Taşı</span>
                </div>
                
                {/* Right Button - Close (X) in main menu, Back (Geri) in submenus */}
                {imageEditMode === 'main' ? (
                  <button 
                    className="panel-close-btn" 
                    onClick={() => setActiveImageId(null)}
                    title="Kapat"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ) : (
                  <button 
                    className="panel-back-btn-right" 
                    onClick={() => setImageEditMode('main')}
                    title="Geri"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Geri</span>
                  </button>
                )}
              </div>
              
              {imageEditMode === 'main' && (
                <div className="image-edit-icons">
                  <button 
                    className="image-edit-icon-btn"
                    onClick={() => setImageEditMode('color')}
                    title="Renk"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="6" fill="currentColor"/>
                    </svg>
                    <span>Renk</span>
                  </button>
                  
                  <button 
                    className="image-edit-icon-btn"
                    onClick={() => setImageEditMode('transform')}
                    title="Dönüştür"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M3 12h18M3 12l4-4m-4 4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M21 12l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Dönüştür</span>
                  </button>
                  
                  <button 
                    className="image-edit-icon-btn"
                    onClick={() => setImageEditMode('position')}
                    title="Pozisyon"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M4 8l4-4m0 0l4 4m-4-4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M20 16l-4 4m0 0l-4-4m4 4V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Pozisyon</span>
                  </button>
                  
                  <button 
                    className="image-edit-icon-btn"
                    onClick={() => {
                      // Reset image to original state - clear ALL modifications
                      setPlacedImages(prev => prev.map(img => 
                        img.id === activeImageId
                          ? { 
                              ...img, 
                              x: 60, 
                              y: 220, 
                              scale: 1, 
                              rotation: 0,
                              transformRotate: 0,
                              scaleX: 1,
                              scaleY: 1,
                              flipX: 1,
                              flipY: 1,
                              filter: 'none',
                              mixBlendMode: 'normal',
                              opacity: 1,
                              shadowColor: undefined
                            }
                          : img
                      ))
                      // Reset UI state
                      setImageColor('original')
                      setImageOpacity(1)
                      setTransformRotate(0)
                      setTransformScaleX(1)
                      setTransformScaleY(1)
                      setTransformFlipX(1)
                      setTransformFlipY(1)
                    }}
                    title="Sıfırla"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Sıfırla</span>
                  </button>
                  
                  <button 
                    className="image-edit-icon-btn delete-btn"
                    onClick={(e) => handleRemovePlacedImage(e, activeImageId)}
                    title="Kaldır"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Kaldır</span>
                  </button>
                </div>
              )}
              
              {imageEditMode === 'color' && (
                <div className="image-edit-detail">
                  <div className="detail-content">
                    <div className="submenu-tabs">
                      <div 
                        className={imageColorTab === 'fill' ? 'submenu-tab submenu-tab-active' : 'submenu-tab'}
                        onClick={() => setImageColorTab('fill')}
                      >
                        Doldur
                      </div>
                      <div 
                        className={imageColorTab === 'shadow' ? 'submenu-tab submenu-tab-active' : 'submenu-tab'}
                        onClick={() => setImageColorTab('shadow')}
                      >
                        Gölge
                      </div>
                    </div>
                    
                    {imageColorTab === 'fill' && (
                      <>
                        <div className="color-swatches">
                          {/* Original/Reset filter */}
                          <div 
                            className={`color-swatch ${imageColor === 'original' ? 'active' : ''}`}
                            style={{ 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              color: 'white'
                            }}
                            onClick={() => {
                              setImageColor('original')
                              if (activeImageId) {
                                setPlacedImages(prev => prev.map(img => 
                                  img.id === activeImageId
                                    ? { ...img, filter: `opacity(${imageOpacity})`, mixBlendMode: 'normal' }
                                    : img
                                ))
                              }
                            }}
                          >
                            ⟲
                          </div>
                          {/* White/Lighten filter */}
                          <div 
                            className={`color-swatch ${imageColor === '#FFFFFF' ? 'active' : ''}`}
                            style={{ background: '#FFFFFF', border: '2px solid #e0e0e0' }}
                            onClick={() => {
                              setImageColor('#FFFFFF')
                              if (activeImageId) {
                                setPlacedImages(prev => prev.map(img => 
                                  img.id === activeImageId
                                    ? { ...img, filter: `brightness(1.3) contrast(0.9) opacity(${imageOpacity})`, mixBlendMode: 'normal' }
                                    : img
                                ))
                              }
                            }}
                          ></div>
                          {/* Light gray/Screen filter */}
                          <div 
                            className={`color-swatch ${imageColor === '#CCCCCC' ? 'active' : ''}`}
                            style={{ background: '#CCCCCC' }}
                            onClick={() => {
                              setImageColor('#CCCCCC')
                              if (activeImageId) {
                                setPlacedImages(prev => prev.map(img => 
                                  img.id === activeImageId
                                    ? { ...img, filter: `saturate(0.5) opacity(${imageOpacity})`, mixBlendMode: 'luminosity' }
                                    : img
                                ))
                              }
                            }}
                          ></div>
                          {/* Medium gray/Multiply filter */}
                          <div 
                            className={`color-swatch ${imageColor === '#808080' ? 'active' : ''}`}
                            style={{ background: '#808080' }}
                            onClick={() => {
                              setImageColor('#808080')
                              if (activeImageId) {
                                setPlacedImages(prev => prev.map(img => 
                                  img.id === activeImageId
                                    ? { ...img, filter: `saturate(0) opacity(${imageOpacity})`, mixBlendMode: 'multiply' }
                                    : img
                                ))
                              }
                            }}
                          ></div>
                          {/* Dark gray filter */}
                          <div 
                            className={`color-swatch ${imageColor === '#404040' ? 'active' : ''}`}
                            style={{ background: '#404040' }}
                            onClick={() => {
                              setImageColor('#404040')
                              if (activeImageId) {
                                setPlacedImages(prev => prev.map(img => 
                                  img.id === activeImageId
                                    ? { ...img, filter: `brightness(0.6) saturate(0) opacity(${imageOpacity})`, mixBlendMode: 'multiply' }
                                    : img
                                ))
                              }
                            }}
                          ></div>
                          {/* Black/Silhouette filter */}
                          <div 
                            className={`color-swatch ${imageColor === '#000000' ? 'active' : ''}`}
                            style={{ background: '#000000' }}
                            onClick={() => {
                              setImageColor('#000000')
                              if (activeImageId) {
                                setPlacedImages(prev => prev.map(img => 
                                  img.id === activeImageId
                                    ? { ...img, filter: `brightness(0.3) saturate(0) opacity(${imageOpacity})`, mixBlendMode: 'darken' }
                                    : img
                                ))
                              }
                            }}
                          ></div>
                        </div>
                        <div className="opacity-control">
                          <label>Şeffaflık</label>
                          <div className="opacity-slider-wrapper">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={imageOpacity}
                              className="opacity-slider"
                              onChange={(e) => {
                                const newOpacity = parseFloat(e.target.value)
                                setImageOpacity(newOpacity)
                                if (activeImageId) {
                                  setPlacedImages(prev => prev.map(img => 
                                    img.id === activeImageId
                                      ? { ...img, opacity: newOpacity }
                                      : img
                                  ))
                                }
                              }}
                            />
                            <span className="opacity-value">{imageOpacity.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {imageColorTab === 'shadow' && (
                      <>
                        <div className="shadow-color-picker">
                          <div 
                            className="color-picker-2d"
                            style={{
                              background: `linear-gradient(to bottom, transparent, black), linear-gradient(to right, white, hsl(${shadowHue}, 100%, 50%))`
                            }}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              const x = e.clientX - rect.left
                              const y = e.clientY - rect.top
                              const s = Math.round((x / rect.width) * 100)
                              const l = Math.round(100 - (y / rect.height) * 100)
                              setShadowSaturation(s)
                              setShadowLightness(l)
                              const newColor = hslToHex(shadowHue, s, l)
                              setShadowColor(newColor)
                              if (activeImageId) {
                                setPlacedImages(prev => prev.map(img => 
                                  img.id === activeImageId
                                    ? { ...img, shadowColor: newColor }
                                    : img
                                ))
                              }
                            }}
                          >
                            <div 
                              className="color-picker-cursor"
                              style={{
                                left: `${shadowSaturation}%`,
                                top: `${100 - shadowLightness}%`
                              }}
                            />
                          </div>
                          
                          <div className="hue-slider-container">
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={shadowHue}
                              className="hue-slider"
                              onChange={(e) => {
                                const newHue = parseInt(e.target.value)
                                setShadowHue(newHue)
                                const newColor = hslToHex(newHue, shadowSaturation, shadowLightness)
                                setShadowColor(newColor)
                                if (activeImageId) {
                                  setPlacedImages(prev => prev.map(img => 
                                    img.id === activeImageId
                                      ? { ...img, shadowColor: newColor }
                                      : img
                                  ))
                                }
                              }}
                            />
                          </div>
                          
                          <div className="hex-input-container">
                            <input
                              type="text"
                              value={shadowColor}
                              className="hex-input"
                              onChange={(e) => {
                                const value = e.target.value
                                setShadowColor(value)
                                if (/^#[0-9A-F]{6}$/i.test(value)) {
                                  const hsl = hexToHsl(value)
                                  setShadowHue(hsl.h)
                                  setShadowSaturation(hsl.s)
                                  setShadowLightness(hsl.l)
                                  if (activeImageId) {
                                    setPlacedImages(prev => prev.map(img => 
                                      img.id === activeImageId
                                        ? { ...img, shadowColor: value }
                                        : img
                                    ))
                                  }
                                }
                              }}
                            />
                            <button className="eyedropper-btn" title="Renk seçici">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2.586 16.726A2 2 0 0 0 2 18.138v3.862h3.862a2 2 0 0 0 1.414-.586l9.428-9.428L13.29 8.572l-10.704 8.154z"/>
                                <path d="M17.704 4.29l2.006 2.006a1 1 0 0 1 0 1.414l-1.414 1.414-3.42-3.42 1.414-1.414a1 1 0 0 1 1.414 0z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {imageEditMode === 'transform' && (
                <div className="image-edit-detail">
                  <div className="detail-content">
                    {/* Rotate Slider */}
                    <div className="transform-control">
                      <div className="transform-control-header">
                        <label>Çevir</label>
                        <span className="transform-value">{transformRotate}</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={transformRotate}
                        className="transform-slider"
                        onChange={(e) => {
                          const newRotate = parseInt(e.target.value)
                          setTransformRotate(newRotate)
                          if (activeImageId) {
                            setPlacedImages(prev => prev.map(img => 
                              img.id === activeImageId
                                ? { ...img, transformRotate: newRotate }
                                : img
                            ))
                          }
                        }}
                      />
                    </div>

                    {/* Scale-X Slider */}
                    <div className="transform-control">
                      <div className="transform-control-header">
                        <label>Scale-X</label>
                        <span className="transform-value">{transformScaleX.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.01"
                        value={transformScaleX}
                        className="transform-slider"
                        onChange={(e) => {
                          const newScaleX = parseFloat(e.target.value)
                          setTransformScaleX(newScaleX)
                          if (activeImageId) {
                            setPlacedImages(prev => prev.map(img => 
                              img.id === activeImageId
                                ? { ...img, scaleX: newScaleX }
                                : img
                            ))
                          }
                        }}
                      />
                    </div>

                    {/* Scale-Y Slider */}
                    <div className="transform-control">
                      <div className="transform-control-header">
                        <label>Scale-Y</label>
                        <span className="transform-value">{transformScaleY.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.01"
                        value={transformScaleY}
                        className="transform-slider"
                        onChange={(e) => {
                          const newScaleY = parseFloat(e.target.value)
                          setTransformScaleY(newScaleY)
                          if (activeImageId) {
                            setPlacedImages(prev => prev.map(img => 
                              img.id === activeImageId
                                ? { ...img, scaleY: newScaleY }
                                : img
                            ))
                          }
                        }}
                      />
                    </div>

                    {/* Flip Buttons */}
                    <div className="flip-buttons">
                      <button 
                        className="flip-btn"
                        onClick={() => {
                          const newFlipX = transformFlipX * -1
                          setTransformFlipX(newFlipX)
                          if (activeImageId) {
                            setPlacedImages(prev => prev.map(img => 
                              img.id === activeImageId
                                ? { ...img, flipX: newFlipX }
                                : img
                            ))
                          }
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3" />
                          <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
                          <path d="M12 20v2" />
                          <path d="M12 14v2" />
                          <path d="M12 8v2" />
                          <path d="M12 2v2" />
                        </svg>
                        Yatay Çevir
                      </button>
                      <button 
                        className="flip-btn"
                        onClick={() => {
                          const newFlipY = transformFlipY * -1
                          setTransformFlipY(newFlipY)
                          if (activeImageId) {
                            setPlacedImages(prev => prev.map(img => 
                              img.id === activeImageId
                                ? { ...img, flipY: newFlipY }
                                : img
                            ))
                          }
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" />
                          <path d="M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
                          <path d="M20 12h2" />
                          <path d="M14 12h2" />
                          <path d="M8 12h2" />
                          <path d="M2 12h2" />
                        </svg>
                        Dikey Çevir
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {imageEditMode === 'position' && (
                <div className="image-edit-detail">
                  <div className="detail-content">
                    {/* Position Tabs */}
                    <div className="submenu-tabs">
                      <div 
                        className={positionTab === 'align' ? 'submenu-tab submenu-tab-active' : 'submenu-tab'}
                        onClick={() => setPositionTab('align')}
                      >
                        Hizalama
                      </div>
                      <div 
                        className={positionTab === 'arrange' ? 'submenu-tab submenu-tab-active' : 'submenu-tab'}
                        onClick={() => setPositionTab('arrange')}
                      >
                        Düzenle
                      </div>
                    </div>

                    {positionTab === 'align' && (
                      <div className="alignment-grid">
                        {/* Top Align */}
                        <button 
                          className="align-btn"
                          onClick={() => {
                            if (activeImageId) {
                              setPlacedImages(prev => prev.map(img => 
                                img.id === activeImageId
                                  ? { ...img, y: 20 }
                                  : img
                              ))
                            }
                          }}
                          title="Üste Hizala"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="4" y1="4" x2="20" y2="4" />
                            <rect x="8" y="8" width="8" height="12" />
                          </svg>
                        </button>

                        {/* Center Vertical */}
                        <button 
                          className="align-btn"
                          onClick={() => {
                            if (activeImageId) {
                              setPlacedImages(prev => prev.map(img => 
                                img.id === activeImageId
                                  ? { ...img, y: 320 - 100 }
                                  : img
                              ))
                            }
                          }}
                          title="Merkez Dikey"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="4" y1="12" x2="20" y2="12" />
                            <rect x="8" y="6" width="8" height="12" />
                          </svg>
                        </button>

                        {/* Bottom Align */}
                        <button 
                          className="align-btn"
                          onClick={() => {
                            if (activeImageId) {
                              setPlacedImages(prev => prev.map(img => 
                                img.id === activeImageId
                                  ? { ...img, y: 640 - 200 - 20 }
                                  : img
                              ))
                            }
                          }}
                          title="Alta Hizala"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="4" y1="20" x2="20" y2="20" />
                            <rect x="8" y="4" width="8" height="12" />
                          </svg>
                        </button>

                        {/* Left Align */}
                        <button 
                          className="align-btn"
                          onClick={() => {
                            if (activeImageId) {
                              setPlacedImages(prev => prev.map(img => 
                                img.id === activeImageId
                                  ? { ...img, x: 20 }
                                  : img
                              ))
                            }
                          }}
                          title="Sola Hizala"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="4" y1="4" x2="4" y2="20" />
                            <rect x="8" y="8" width="12" height="8" />
                          </svg>
                        </button>

                        {/* Center Horizontal */}
                        <button 
                          className="align-btn"
                          onClick={() => {
                            if (activeImageId) {
                              setPlacedImages(prev => prev.map(img => 
                                img.id === activeImageId
                                  ? { ...img, x: 160 - 100 }
                                  : img
                              ))
                            }
                          }}
                          title="Merkez Yatay"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="4" x2="12" y2="20" />
                            <rect x="6" y="8" width="12" height="8" />
                          </svg>
                        </button>

                        {/* Right Align */}
                        <button 
                          className="align-btn"
                          onClick={() => {
                            if (activeImageId) {
                              setPlacedImages(prev => prev.map(img => 
                                img.id === activeImageId
                                  ? { ...img, x: 320 - 200 - 20 }
                                  : img
                              ))
                            }
                          }}
                          title="Sağa Hizala"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="20" y1="4" x2="20" y2="20" />
                            <rect x="4" y="8" width="12" height="8" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {positionTab === 'arrange' && (
                      <div className="arrange-buttons">
                        {/* Bring Forward */}
                        <button 
                          className="arrange-btn"
                          onClick={() => {
                            if (activeImageId) {
                              setAllLayers(prev => {
                                const currentIndex = prev.findIndex(layer => layer.id === activeImageId)
                                if (currentIndex < prev.length - 1) {
                                  const newLayers = [...prev]
                                  const temp = newLayers[currentIndex]
                                  newLayers[currentIndex] = newLayers[currentIndex + 1]
                                  newLayers[currentIndex + 1] = temp
                                  return newLayers
                                }
                                return prev
                              })
                            }
                          }}
                          title="Yukarı Taşı"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="7" y="7" width="10" height="10" rx="2" />
                            <path d="M3 12h4m10 0h4M12 3v4m0 10v4" strokeLinecap="round" />
                          </svg>
                          Yukarı Taşı
                        </button>

                        {/* Send Backward */}
                        <button 
                          className="arrange-btn"
                          onClick={() => {
                            if (activeImageId) {
                              setAllLayers(prev => {
                                const currentIndex = prev.findIndex(layer => layer.id === activeImageId)
                                if (currentIndex > 0) {
                                  const newLayers = [...prev]
                                  const temp = newLayers[currentIndex]
                                  newLayers[currentIndex] = newLayers[currentIndex - 1]
                                  newLayers[currentIndex - 1] = temp
                                  return newLayers
                                }
                                return prev
                              })
                            }
                          }}
                          title="Aşağı Taşı"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="7" y="7" width="10" height="10" rx="2" />
                            <path d="M3 12h4m10 0h4M12 3v4m0 10v4" strokeLinecap="round" />
                          </svg>
                          Aşağı Taşı
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
      </div>
    </div>
  )
}

export default App
