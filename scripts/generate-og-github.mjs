/**
 * GitHub social preview image for the sidneygonzalez.ai repo.
 *
 * Dimensions: 1280 x 640 (GitHub's recommended social preview size).
 * Purpose: When the repo URL is shared (or pulled into LinkedIn's
 * Featured section), this is the card that displays.
 *
 * Positioning differs from og-image.png:
 *   - og-image.png targets recruiters/business viewers — the "not
 *     slide decks" business tagline.
 *   - og-github.png targets engineers/technical viewers — the
 *     "financial analyst who codes" unicorn framing plus the stack
 *     that makes the repo actually interesting.
 *
 * Run:   node scripts/generate-og-github.mjs
 * Out:   public/og-github.png
 */

import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')
const OUT_PATH = path.join(PROJECT_ROOT, 'public', 'og-github.png')

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
    inter500,
    jetBrainsMono500,
  ] = await Promise.all([
    loadGoogleFont('Space Grotesk', 500),
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
        width: 1280,
        height: 640,
        display: 'flex',
        flexDirection: 'column',
        padding: 72,
        backgroundColor: '#0A0A0F',
        backgroundImage:
          'radial-gradient(circle at 88% 12%, rgba(30, 30, 46, 0.9), transparent 55%), radial-gradient(circle at 10% 95%, rgba(0, 104, 255, 0.14), transparent 50%)',
        fontFamily: 'Inter',
        position: 'relative',
      },
      children: [
        // Repo identifier eyebrow (mimics GitHub's own repo header style)
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 14,
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
                    letterSpacing: '0.18em',
                  },
                  children: 'OWNER-LAB / SIDNEYGONZALEZ.AI',
                },
              },
            ],
          },
        },

        // Headline (pushed to middle)
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              marginTop: 'auto',
              marginBottom: 32,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    color: '#E2E8F0',
                    fontFamily: 'Space Grotesk',
                    fontWeight: 600,
                    fontSize: 80,
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                  },
                  children: 'Financial analyst',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 20,
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          color: '#E2E8F0',
                          fontFamily: 'Space Grotesk',
                          fontWeight: 600,
                          fontSize: 80,
                          lineHeight: 1.05,
                          letterSpacing: '-0.02em',
                        },
                        children: 'who',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          color: '#0068FF',
                          fontFamily: 'Space Grotesk',
                          fontWeight: 600,
                          fontSize: 80,
                          lineHeight: 1.05,
                          letterSpacing: '-0.02em',
                        },
                        children: 'codes.',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },

        // Subtitle
        {
          type: 'div',
          props: {
            style: {
              color: '#94A3B8',
              fontFamily: 'Inter',
              fontWeight: 400,
              fontSize: 20,
              lineHeight: 1.4,
              maxWidth: 900,
              marginBottom: 28,
            },
            children:
              'Three financial intelligence systems running live Python in the browser. No backend.',
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
              marginBottom: 20,
            },
          },
        },

        // Stack
        {
          type: 'div',
          props: {
            style: {
              color: '#94A3B8',
              fontFamily: 'JetBrains Mono',
              fontWeight: 500,
              fontSize: 17,
              letterSpacing: '0.02em',
            },
            children: 'React · Vite · Pyodide · pandas · scikit-learn · Recharts · Nivo',
          },
        },
      ],
    },
  }

  const svg = await satori(tree, {
    width: 1280,
    height: 640,
    fonts: [
      { name: 'Space Grotesk', data: spaceGrotesk500, weight: 500, style: 'normal' },
      { name: 'Space Grotesk', data: spaceGrotesk600, weight: 600, style: 'normal' },
      { name: 'Inter', data: inter400, weight: 400, style: 'normal' },
      { name: 'Inter', data: inter500, weight: 500, style: 'normal' },
      { name: 'JetBrains Mono', data: jetBrainsMono500, weight: 500, style: 'normal' },
    ],
  })

  console.log('Converting SVG → PNG…')
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1280 },
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
