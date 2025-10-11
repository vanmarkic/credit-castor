# Credit Castor - Calculateur Division

Calculateur pour achat en division immobilière en Wallonie, Belgique.

## 🚀 Static Site Generation with Astro

This project now uses **Astro** for optimal static site generation. Astro was chosen based on research of the best SSG solutions in 2025 because:

- ⚡ **Zero JavaScript by default** - Loads 0 KB JS compared to 87 KB for Next.js
- 🎯 **Perfect for static content** - Your calculator loads with instant hydration
- 🔧 **React component support** - Uses your existing React components
- 📦 **Built on Vite** - Fast HMR and efficient builds
- 🌐 **SEO optimized** - Pre-rendered HTML for better performance

## 📁 Project Structure

```
├── src/
│   ├── pages/
│   │   └── index.astro          # Main page (uses React component)
│   └── components/
│       ├── EnDivisionCorrect.tsx # Your React calculator component
│       └── index.css             # Tailwind styles
├── dist/                         # Static build output
├── astro.config.mjs              # Astro configuration
└── package.json
```

## 🛠️ Development

```bash
# Start development server
npm run dev

# Build for production (static site)
npm run build

# Preview production build
npm run preview
```

## 🌐 Deployment

The static build is in the `dist/` directory and can be deployed to:

- **Netlify**: Drag & drop the `dist/` folder
- **Vercel**: Connect your repo and set build command to `npm run build`
- **GitHub Pages**: Upload the `dist/` folder
- **Any static host**: Just upload the `dist/` folder

### Build Output

- `dist/index.html` - Pre-rendered HTML page
- `dist/_astro/` - Optimized JS/CSS assets (minified)

## 📊 Features

- ✅ Calculate property division costs
- ✅ Multiple participants support
- ✅ Loan calculations
- ✅ Excel export functionality
- ✅ Scenario optimization
- ✅ Fully responsive design

## 🔧 Alternative: Vite Build

If you prefer the original Vite setup:

```bash
npm run dev:vite    # Development
npm run build:vite  # Build
```

## 📈 Performance

- **Static HTML**: Pre-rendered for instant loading
- **Optimized CSS**: Tailwind with purging
- **Minified JS**: React hydration only when needed
- **Small bundle**: ~103 KB gzipped for interactive features

---

Built with Astro + React + Tailwind CSS
