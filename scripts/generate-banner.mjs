/**
 * LinkedIn banner image generator (also usable as Twitter/X header).
 *
 * Dimensions: 1584 × 396 (LinkedIn cover photo spec).
 * Coordinates with og-image.png via shared theme tokens so the profile
 * reads as a single brand system, not two disconnected assets.
 *
 * Composition notes:
 *   - The left ~240px is partially obscured by the profile headshot on
 *     LinkedIn desktop, and mobile crops roughly the center 60%. All
 *     meaningful content sits centered so it survives both contexts.
 *
 * Run:   node scripts/generate-banner.mjs
 * Out:   public/linkedin-banner.png
 */

import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const OUT_PATH = path.join(PROJECT_ROOT, 'public', 'linkedin-banner.png')

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
  console.log('Loading fonts…')

  const [
    spaceGrotesk500,
    spaceGrotesk600,
    inter400,
    jetBrainsMono500,
  ] = await Promise.all([
    loadGoogleFont('Space Grotesk', 500),
    loadGoogleFont('Space Grotesk', 600),
    loadGoogleFont('Inter', 400),
    loadGoogleFont('JetBrains Mono', 500),
  ])

  console.log('Rendering SVG…')

  const stages = ['Ingest', 'Clean', 'Transform', 'Analyze', 'Decide']

  const tree = {
    type: 'div',
    props: {
      style: {
        width: 1584,
        height: 396,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 440,
        paddingRight: 80,
        backgroundColor: '#0A0A0F',
        backgroundImage:
          'radial-gradient(circle at 85% 20%, rgba(30, 30, 46, 0.95), transparent 50%), radial-gradient(circle at 15% 90%, rgba(0, 104, 255, 0.14), transparent 55%)',
        fontFamily: 'Inter',
        color: '#E2E8F0',
      },
      children: [
        // Eyebrow
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 32,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: 32,
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
                    fontSize: 14,
                    letterSpacing: '0.24em',
                  },
                  children: 'FINANCIAL INTELLIGENCE SYSTEMS',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    width: 32,
                    height: 1,
                    backgroundColor: '#334155',
                  },
                },
              },
            ],
          },
        },

        // Pipeline row (Ingest → Clean → Transform → Analyze → Decide)
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 20,
            },
            children: stages.flatMap((stage, i) => {
              const stageNode = {
                type: 'div',
                props: {
                  style: {
                    color: '#E2E8F0',
                    fontFamily: 'Space Grotesk',
                    fontWeight: 600,
                    fontSize: 34,
                    letterSpacing: '-0.01em',
                  },
                  children: stage,
                },
              }
              if (i === stages.length - 1) return [stageNode]
              const arrowNode = {
                type: 'div',
                props: {
                  style: {
                    color: '#0068FF',
                    fontFamily: 'Space Grotesk',
                    fontWeight: 500,
                    fontSize: 30,
                  },
                  children: '→',
                },
              }
              return [stageNode, arrowNode]
            }),
          },
        },

        // Divider
        {
          type: 'div',
          props: {
            style: {
              width: 56,
              height: 2,
              backgroundColor: '#0068FF',
              marginTop: 36,
              marginBottom: 20,
            },
          },
        },

        // URL
        {
          type: 'div',
          props: {
            style: {
              color: '#94A3B8',
              fontFamily: 'Space Grotesk',
              fontWeight: 500,
              fontSize: 20,
              letterSpacing: '0.01em',
            },
            children: 'sidneygonzalez.ai',
          },
        },
      ],
    },
  }

  const svg = await satori(tree, {
    width: 1584,
    height: 396,
    fonts: [
      { name: 'Space Grotesk', data: spaceGrotesk500, weight: 500, style: 'normal' },
      { name: 'Space Grotesk', data: spaceGrotesk600, weight: 600, style: 'normal' },
      { name: 'Inter', data: inter400, weight: 400, style: 'normal' },
      { name: 'JetBrains Mono', data: jetBrainsMono500, weight: 500, style: 'normal' },
    ],
  })

  console.log('Converting SVG → PNG…')
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1584 },
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
