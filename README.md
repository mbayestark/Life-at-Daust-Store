# 🦅 Life at DAUST Store

The official campus merchandise store for the **Dakar American University of Science and Technology (DAUST)**. This project is a high-performance, full-stack e-commerce application designed to provide students and staff with a premium shopping experience for university essentials.

![Project Preview](https://img.shields.io/badge/DAUST-Merchandise-FF6B00?style=for-the-badge&logoScale=1.2)
![Status](https://img.shields.io/badge/Status-Feature_Complete-green?style=for-the-badge)

## ✨ Core Features

### 🛒 Modern Storefront
- **Premium UX:** Institutional aesthetic with glassmorphism, responsive layouts, and smooth micro-animations (AOS).
- **Product Catalog:** Real-time synchronization with Convex backend, featuring categorized collections.
- **Shopping Cart:** Persistent cart management with color and size selection via React Context.
- **Secure Checkout:** Multi-step validation flow with direct persistence to the university's order database.
- **Robustness:** Global error handling and skeleton loading states for high-perceived performance.

### 🛡️ Administrative Suite (/admin)
- **Protected Access:** Secure Staff/Admin portal with session-based authentication.
- **Live Analytics:** Real-time dashboard tracking revenue, order volume, and fulfillment rates.
- **Inventory Control:** Complete CRUD system for product management, including cloud image uploads.
- **Order Fulfillment:** Comprehensive tracking system to manage shipments and update order statuses.

## 🛠 Tech Stack

- **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Backend:** [Convex](https://www.convex.dev/) (Serverless Database & Functions)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management:** React Context API
- **Icons:** [Lucide React](https://lucide.dev/)
- **Testing:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **Animations:** [AOS](https://michalsnik.github.io/aos/)

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (Latest LTS)
- NPM or PNPM

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/mbayestark/Life-at-Daust-Store.git

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_CONVEX_URL=your_convex_deployment_url
```

### 4. Running the Project
```bash
# Start the development server
npm run dev

# Start Convex (in a separate terminal)
npx convex dev
```

## 🧪 Testing

The project includes a comprehensive suite of unit and integration tests to ensure reliability.

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Check coverage
npm run test:coverage
```

## 📁 Project Structure

```text
├── convex/             # Backend operations (Schema, Product CRUD, Orders)
├── src/
│   ├── components/     # UI components (Atomic and Complex)
│   ├── context/        # Cart and Admin state management
│   ├── data/           # Static collections and navigation config
│   ├── pages/          # View components and Admin routes
│   └── test/           # Test utilities and integration flows
├── PROJECT_CONTEXT.md  # Detailed architectural technical reference
└── README.md           # This file
```

## 🔒 Administrative Access
The Admin Panel is located at `/admin`. 
Access requires an administrative password (session-persisted).

---
*Created for the DAUST community. Proudly DAUSTIAN.* 🇸🇳

