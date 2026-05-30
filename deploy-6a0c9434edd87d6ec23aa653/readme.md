# Ndilo Hardbody Chickens

Static Netlify site for Ndilo Hardbody Chickens.

## Required image files
Place these in `/images`:
- `logo.png`
- `hero.jpg`
- `product.jpg`
- `packaged.jpg`

## Local run
```bash
cd /home/claude/ndilo-chickens
npm install
npx netlify dev
```

## Netlify deploy
1. Push this folder to GitHub, or drag-and-drop the folder to Netlify.
2. Publish directory: `.`
3. Functions directory: `netlify/functions`
4. Optional AI chat: add environment variable `OPENAI_API_KEY` in Netlify.

Without `OPENAI_API_KEY`, the chat still works as a safe fallback and pushes customers to WhatsApp.
