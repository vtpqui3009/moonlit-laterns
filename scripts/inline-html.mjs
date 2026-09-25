// Inlines the `build:single` output (one JS + one CSS file) into a single
// self-contained HTML page: dist-single/gui-em.html. Handy for hosts that
// accept only one file, or to send the page as a file.
import fs from 'node:fs'
import path from 'node:path'

const dir = 'dist-single'
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8')

html = html.replace(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/, (_, src) => {
  const js = fs.readFileSync(path.join(dir, src), 'utf8').replace(/<\/script/gi, '<\\/script')
  return `<script type="module">${js}</script>`
})
html = html.replace(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/, (_, href) => {
  return `<style>${fs.readFileSync(path.join(dir, href), 'utf8')}</style>`
})
html = html.replace(/\s*<link rel="modulepreload"[^>]*>/g, '')
if (/src="\.\/assets|href="\.\/assets/.test(html)) throw new Error('some assets were not inlined')

const out = path.join(dir, 'gui-em.html')
fs.writeFileSync(out, html)
console.log(`${out}: ${(fs.statSync(out).size / 1024 / 1024).toFixed(2)} MB`)
