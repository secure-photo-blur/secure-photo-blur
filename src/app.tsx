import { useCallback, useRef, useState } from 'preact/hooks'
import { Landing } from './components/landing'
import { Editor } from './components/editor'
import { loadImage } from './engine/image-loader'
import { cleanupImageBitmap } from './engine/memory-cleanup'
import type { ImageEditState, LoadedImage, QueueItem } from './types'

export function App() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep a ref to queue for use inside async functions
  const queueRef = useRef(queue)
  queueRef.current = queue

  async function loadItem(items: QueueItem[], index: number): Promise<QueueItem[]> {
    const item = items[index]
    if (!item || item.loaded) return items
    setLoading(true)
    setError(null)
    try {
      const img = await loadImage(item.file)
      const updated = [...items]
      updated[index] = { ...updated[index], loaded: img, error: null }
      return updated
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load image'
      setError(msg)
      const updated = [...items]
      updated[index] = { ...updated[index], error: msg }
      return updated
    } finally {
      setLoading(false)
    }
  }

  function cleanupDistantBitmaps(items: QueueItem[], activeIndex: number) {
    for (let i = 0; i < items.length; i++) {
      if (Math.abs(i - activeIndex) > 1 && items[i].loaded) {
        cleanupImageBitmap(items[i].loaded!.bitmap)
        items[i] = { ...items[i], loaded: null }
      }
    }
    return items
  }

  async function handleFilesSelected(files: File[]) {
    const items: QueueItem[] = files.map(file => ({
      file,
      loaded: null,
      editState: null,
      error: null,
    }))
    const loaded = await loadItem(items, 0)
    const cleaned = cleanupDistantBitmaps(loaded, 0)
    setQueue(cleaned)
    setCurrentIndex(0)
  }

  async function handleNavigate(direction: 'prev' | 'next') {
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (nextIndex < 0 || nextIndex >= queue.length) return

    let items = [...queue]

    // Load target if needed
    if (!items[nextIndex].loaded) {
      items = await loadItem(items, nextIndex)
      if (items[nextIndex].error) {
        setQueue(items)
        return
      }
    }

    const cleaned = cleanupDistantBitmaps(items, nextIndex)
    setQueue(cleaned)
    setCurrentIndex(nextIndex)
  }

  const handleSaveEditState = useCallback((state: ImageEditState) => {
    setQueue(prev => {
      const updated = [...prev]
      const idx = currentIndex
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], editState: state }
      }
      return updated
    })
  }, [currentIndex])

  async function handleExportDone() {
    // Mark current as exported
    setQueue(prev => {
      const updated = [...prev]
      if (updated[currentIndex]?.editState) {
        updated[currentIndex] = {
          ...updated[currentIndex],
          editState: { ...updated[currentIndex].editState!, exported: true },
        }
      }
      return updated
    })

    // Advance to next if available
    const nextIndex = currentIndex + 1
    if (nextIndex < queue.length) {
      await handleNavigate('next')
    }
  }

  function handleReset() {
    // Cleanup all bitmaps
    for (const item of queue) {
      if (item.loaded) cleanupImageBitmap(item.loaded.bitmap)
    }
    setQueue([])
    setCurrentIndex(0)
    setError(null)
  }

  async function handleNewImage(img: LoadedImage) {
    // In multi-mode: append to queue and navigate to it
    if (queue.length > 1) {
      const newItem: QueueItem = {
        file: new File([], img.fileName),
        loaded: img,
        editState: null,
        error: null,
      }
      const newIndex = queue.length
      const items = cleanupDistantBitmaps([...queue, newItem], newIndex)
      setQueue(items)
      setCurrentIndex(newIndex)
    } else {
      // Single-mode: replace current
      const newItem: QueueItem = {
        file: new File([], img.fileName),
        loaded: img,
        editState: null,
        error: null,
      }
      setQueue([newItem])
      setCurrentIndex(0)
    }
  }

  async function handleAddFilesFromEditor(files: File[]) {
    const newItems: QueueItem[] = files.map(file => ({
      file,
      loaded: null,
      editState: null,
      error: null,
    }))
    const newQueue = [...queue, ...newItems]
    setQueue(newQueue)
  }

  const currentItem = queue[currentIndex] ?? null
  const currentImage = currentItem?.loaded ?? null

  return (
    <>
      {currentImage ? (
        <Editor
          key={currentIndex}
          image={currentImage}
          onReset={handleReset}
          onNewImage={handleNewImage}
          initialEditState={currentItem?.editState}
          onEditStateChange={handleSaveEditState}
          queuePosition={queue.length > 1 ? { current: currentIndex + 1, total: queue.length } : null}
          onNavigate={handleNavigate}
          onExportDone={handleExportDone}
        />
      ) : (
        <Landing
          onFilesSelected={handleFilesSelected}
          loading={loading}
          error={error}
        />
      )}
    </>
  )
}
