# Hakomi Practice Timer

A React-based web application for planning and timing Hakomi therapy practice sessions. Features include flexible timing modes, round management, break time configuration, and a built-in countdown timer for individual practice rounds.

## Features

- **Dual Timing Modes**: 
  - "During" mode: Set session duration directly
  - "Until" mode: Set end time with automatic start time calculation
- **Session Planning**: Configure rounds, break times, and landing preparation time
- **Smart Calculations**: Automatic time per round calculation with break and landing time considerations
- **Live Timer**: Built-in countdown timer for practice rounds
- **Responsive Design**: Works on desktop and mobile devices
- **Theme Support**: Light and dark mode compatible

## Development Setup

### Prerequisites
- Node.js (version 18 or higher)
- npm (comes with Node.js)

### Installation
```bash
# Clone the repository
git clone https://github.com/oilandrust/hakomi-practice-timer.git
cd hakomi-practice-timer

# Install dependencies
npm install
```

### Development Server
```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5173/hakomi-practice-timer/
```

### Building for Production
```bash
# Build the project
npm run build

# The built files will be in the `dist/` folder
```

## Deployment

### GitHub Pages (Automatic)
The app is automatically deployed to GitHub Pages via GitHub Actions:

1. **Push to main branch**: Changes are automatically built and deployed
2. **Manual deployment**: Push to trigger the workflow
3. **Access**: Available at `https://oilandrust.github.io/hakomi-practice-timer/`

### Manual Deployment
```bash
# Build the project
npm run build

# Deploy the `dist/` folder to your web server
```

## Project Structure

```
hakomi-practice-timer/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Application styles
│   └── main.jsx         # Application entry point
├── public/               # Static assets
├── dist/                 # Production build output
├── .github/workflows/    # GitHub Actions deployment
└── package.json          # Dependencies and scripts
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Pico CSS** - Minimal CSS framework
- **GitHub Actions** - CI/CD and deployment
- **GitHub Pages** - Hosting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).
w