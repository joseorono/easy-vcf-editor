# Easy VCF Editor

An offline-first, modern editor for vCard (`.vcf`) files. Create, edit, visualize, and convert contact files directly in your browser.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## ✨ Features

- **Interactive Form**: Easy-to-use interface powered by React Hook Form.
- **Multi-Version Support**: Full support for vCard versions 2.1, 3.0, and 4.0.
- **Live Preview**: See how your contact looks and inspect the raw VCF code in real-time.
- **Import & Export**:
  - Drag and drop `.vcf` files to edit them.
  - Export to `.vcf`, QR Code, or as an Image.
- **Offline-First**: Works completely offline. No data is sent to any server.
- **Progressive Web App (PWA)**: Installable on desktop and mobile devices.
- **Modern UI**: Built with Shadcn UI and Tailwind CSS, featuring dark mode support.
- **Privacy Focused**: Your contact data stays on your device.

## 🚀 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: [Jotai](https://jotai.org/) (minimal usage)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

## 🛠️ Development

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/joseorono/easy-vcf-editor.git
   cd easy-vcf-editor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 📦 Deployment

### Vercel (Recommended)

This project is optimized for deployment on Vercel.

1. Push your code to a GitHub repository.
2. Import the project in Vercel.
3. The default settings (Vite) will work automatically.

### GitHub Pages

1. Update `vite.config.ts` to set the `base` path if you are not deploying to a custom domain:
   ```ts
   export default defineConfig({
     base: '/easy-vcf-editor/', // Replace with your repo name
     // ...
   })
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Deploy the `dist` folder.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
