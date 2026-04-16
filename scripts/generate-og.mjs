/**
 * Open Graph image generator for sidneygonzalez.ai
 *
 * Renders a 1200x630 social preview using the portfolio's design tokens
 * (Space Grotesk + Inter + JetBrains Mono, accent #0068FF, dark theme).
 *
 * Run:   node scripts/generate-og.mjs
 * Out:   public/og-image.png
 */

import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const OUT_PATH = path.join(PROJECT_ROOT, 'public', 'og-image.png')

async function loadGoogleFont(family, weight = 400) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@${weight}&display=swap`
  const css = await (
    await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    })
  ).text()
  const match = css.match(/src: url\((https:\/\/[^)]+)\) format\('(woff2|woff|truetype|opentype)'\)/)
  if (!match) {
    throw new Error(`Could not parse font URL for ${family} @${weight}`)
  }
  return (await fetch(match[1])).arrayBuffer()
}

async function main() {
  console.log('Loading fonts from Google Fonts…')

  const [
    spaceGrotesk600,
    inter400,
    inter500,
    jetBrainsMono500,
  ] = await Promise.all([
    loadGoogleFont('Space Grotesk', 600),
    loadGoogleFont('Inter', 400),
    loadGoogleFont('Inter', 500),
    loadGoogleFont('JetBrains Mono', 500),
  ])

  console.log('Rendering SVG…')

  const tree = {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        padding: 80,
        backgroundColor: '#0A0A0F',
        backgroundImage:
          'radial-gradient(circle at 90% 10%, rgba(30, 30, 46, 0.9), transparent 55%), radial-gradient(circle at 10% 95%, rgba(0, 104, 255, 0.12), transparent 50%)',
        fontFamily: 'Inter',
        position: 'relative',
      },
      children: [
        // Eyebrow
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: 28,
                    height: 1,
                    backgroundColor: '#334155',
                  },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    color: '#64748B',
                    fontFamily: 'JetBrains Mono',
                    fontWeight: 500,
                    fontSize: 16,
                    letterSpacing: '0.22em',
                  },
                  children: 'SIDNEY GONZALEZ',
                },
              },
            ],
          },
        },

        // Headline (pushed to middle via margin-top auto, explicit line breaks)
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              marginTop: 'auto',
              marginBottom: 56,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    color: '#E2E8F0',
                    fontFamily: 'Space Grotesk',
                    fontWeight: 600,
                    fontSize: 68,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  },
                  children: 'I build financial',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    color: '#E2E8F0',
                    fontFamily: 'Space Grotesk',
                    fontWeight: 600,
                    fontSize: 68,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  },
                  children: 'intelligence systems,',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    color: '#0068FF',
                    fontFamily: 'Space Grotesk',
                    fontWeight: 600,
                    fontSize: 68,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  },
                  children: 'not slide decks.',
                },
              },
            ],
          },
        },

        // Footer block
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: 64,
                    height: 2,
                    backgroundColor: '#0068FF',
                  },
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    color: '#94A3B8',
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    fontSize: 18,
                    letterSpacing: '0.01em',
                  },
                  children: 'Python · React · Pyodide · scikit-learn · Power BI · DAX',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#E2E8F0',
                    fontFamily: 'Space Grotesk',
                    fontWeight: 500,
                    fontSize: 22,
                  },
                  children: 'sidneygonzalez.ai  →',
                },
              },
            ],
          },
        },
      ],
    },
  }

  const svg = await satori(tree, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Space Grotesk', data: spaceGrotesk600, weight: 600, style: 'normal' },
      { name: 'Inter', data: inter400, weight: 400, style: 'normal' },
      { name: 'Inter', data: inter500, weight: 500, style: 'normal' },
      { name: 'JetBrains Mono', data: jetBrainsMono500, weight: 500, style: 'normal' },
    ],
  })

  console.log('Converting SVG → PNG…')
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  })
    .render()
    .asPng()

  await fs.writeFile(OUT_PATH, png)
  const stat = await fs.stat(OUT_PATH)
  console.log(`✓ Wrote ${OUT_PATH} (${(stat.size / 1024).toFixed(1)} KB)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
