import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import GlassPanel from './GlassPanel'

const PIPELINE_TABS = ['Ingest', 'Clean', 'Transform', 'Analyze', 'Visualize']

export default function CodeToggle({ isOpen, onClose, tabs = PIPELINE_TABS, codeByTab = {} }) {
  const [activeTab, setActiveTab] = useState(tabs[0])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-y-0 right-0 z-40 w-full max-w-lg"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <GlassPanel className="flex h-full flex-col rounded-none rounded-l-xl">
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
              {tabs.map((tab) => (
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

            <div className="flex-1 overflow-auto py-4">
              <pre className="font-mono text-xs leading-relaxed text-text-secondary">
                <code>
                  {codeByTab[activeTab] ||
                    `# ${activeTab} stage\n# Code will be added when project is built.`}
                </code>
              </pre>
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
