import { useState, useEffect } from 'react'
import { useLenis } from 'lenis/react'
import { motion, AnimatePresence } from 'motion/react'
import GlassPanel from './GlassPanel'

const PIPELINE_TABS = ['Ingest', 'Clean', 'Transform', 'Analyze', 'Visualize']

export default function CodeToggle({ isOpen, onClose, tabs = PIPELINE_TABS, codeByTab = {} }) {
  const activeTabs = Object.keys(codeByTab).length > 0 ? Object.keys(codeByTab) : tabs
  const [activeTab, setActiveTab] = useState(activeTabs[0])
  const lenis = useLenis()

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Lock body scroll + stop Lenis when open
  useEffect(() => {
    if (isOpen) {
      lenis?.stop()
      document.body.style.overflow = 'hidden'
    } else {
      lenis?.start()
      document.body.style.overflow = ''
    }
    return () => {
      lenis?.start()
      document.body.style.overflow = ''
    }
  }, [isOpen, lenis])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 z-30 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Slide-out panel */}
          <motion.div
            className="fixed inset-y-0 right-0 z-40 w-full max-w-lg"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <GlassPanel className="flex h-full flex-col rounded-none rounded-l-xl pt-20">
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <h3 className="font-display text-sm font-semibold text-text-primary">
                  View Code
                </h3>
                <button
                  onClick={onClose}
                  className="text-text-muted transition-colors hover:text-text-primary"
                  aria-label="Close code panel"
                >
                  &times;
                </button>
              </div>

              <div className="flex gap-1 border-b border-border-subtle py-2">
                {activeTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-accent-blue/10 text-accent-blue'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain py-4">
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-text-secondary">
                  <code>
                    {codeByTab[activeTab] ||
                      `# ${activeTab} stage\n# Code will be added when project is built.`}
                  </code>
                </pre>
              </div>
            </GlassPanel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
