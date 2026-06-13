import { useEffect } from 'react'

// Per-route <title>, meta description, and canonical link. Set client-side on
// mount/change; each page reasserts its own values so navigating back to Home
// restores the site defaults.
//
// LIMITATION: these are JS-set. Social crawlers (and static-HTML bots) that
// don't execute JS see the index.html defaults, so /ai link-previews and
// canonicalizes as the generic site card. A true per-route OG + canonical
// needs a build-time prerender of /ai/index.html — tracked as a follow-up.
function upsertMeta(name, content) {
  let el = document.head.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export default function useDocumentMeta({ title, description, canonical }) {
  useEffect(() => {
    if (title) document.title = title
    if (description) upsertMeta('description', description)
    if (canonical) upsertCanonical(canonical)
  }, [title, description, canonical])
}
