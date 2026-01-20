# Paw Buddy - Project Structure

## Overview
Pet management application built with React + Vite + Bootstrap

## Folder Structure

```
src/
├── components/
│   ├── common/              # Reusable UI components
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   └── Button.module.css
│   │   ├── Input/
│   │   │   ├── Input.jsx
│   │   │   └── Input.module.css
│   │   ├── Modal/
│   │   │   └── Modal.jsx
│   │   ├── Card/
│   │   │   └── Card.jsx
│   │   ├── Avatar/
│   │   │   └── Avatar.jsx
│   │   ├── Slider/
│   │   │   └── Slider.jsx
│   │   ├── SelectionCard/
│   │   │   └── SelectionCard.jsx
│   │   ├── EmptyState/
│   │   │   └── EmptyState.jsx
│   │   └── QRCode/
│   │       └── QRCode.jsx
│   │
│   ├── layout/              # Layout components
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Sidebar.module.css
│   │   ├── Header/
│   │   │   ├── Header.jsx
│   │   │   └── Header.module.css
│   │   ├── MainLayout/
│   │   │   └── MainLayout.jsx
│   │   └── ProfileSwitcher/
│   │       └── ProfileSwitcher.jsx
│   │
│   └── features/            # Feature-specific components
│       ├── PetProfile/
│       │   ├── PetProfileCard.jsx
│       │   └── PetProfileCarousel.jsx
│       ├── HealthCard/
│       │   ├── HealthInfo.jsx
│       │   ├── VaccineList.jsx
│       │   └── InsuranceCard.jsx
│       ├── Nutrition/
│       │   ├── MealTracker.jsx
│       │   └── RecipeCard.jsx
│       └── Activities/
│           ├── WalkTracker.jsx
│           └── ActivityMap.jsx
│
├── pages/                   # Page components (route level)
│   ├── Onboarding/
│   │   ├── Onboarding.jsx
│   │   └── CreateAccount.jsx
│   ├── Login/
│   │   └── Login.jsx
│   ├── ValidationCode/
│   │   └── ValidationCode.jsx
│   ├── Dashboard/
│   │   └── Dashboard.jsx
│   ├── AddPetProfile/
│   │   ├── AddPetProfile.jsx
│   │   ├── steps/
│   │   │   ├── BreedSelection.jsx
│   │   │   ├── NameStep.jsx
│   │   │   ├── SizeStep.jsx
│   │   │   ├── WeightStep.jsx
│   │   │   ├── ImportantDates.jsx
│   │   │   └── Caretakers.jsx
│   ├── ShareProfile/
│   │   └── ShareProfile.jsx
│   ├── HealthCard/
│   │   └── HealthCard.jsx
│   ├── Nutrition/
│   │   └── Nutrition.jsx
│   └── Activities/
│       └── Activities.jsx
│
├── hooks/                   # Custom React hooks
│   ├── usePetProfile.js
│   ├── useAuth.js
│   └── useForm.js
│
├── context/                 # React Context providers
│   ├── AuthContext.jsx
│   ├── PetContext.jsx
│   └── ThemeContext.jsx
│
├── services/                # API services
│   ├── api.js
│   ├── petService.js
│   └── authService.js
│
├── utils/                   # Utility functions
│   ├── validators.js
│   ├── formatters.js
│   └── helpers.js
│
├── assets/                  # Static assets
│   ├── images/
│   │   └── dog-placeholder.png
│   └── icons/
│       └── logo.svg
│
├── styles/                  # Global styles
│   ├── variables.css
│   ├── global.css
│   └── theme.css
│
└── constants/               # Constants and configuration
    ├── routes.js
    ├── colors.js
    └── config.js
```

## Design System

### Colors
- **Primary Blue:** #0D9AFF
- **Dark Sidebar:** #1A1D2E
- **Background:** #F5F5F5
- **Text Primary:** #2C3E50
- **Text Secondary:** #7F8C8D
- **Success:** #27AE60
- **Warning:** #F39C12
- **Danger:** #E74C3C

### Typography
- Font Family: System fonts (Bootstrap default)
- Headings: Bold, larger sizes
- Body: Regular weight

### Spacing
- Base unit: 8px (Bootstrap uses rem)
- Consistent padding/margins using Bootstrap utilities

## Key Features

1. **Multi-Pet Management:** Users can manage multiple pet profiles
2. **Health Tracking:** Vaccines, insurance, medical records
3. **Nutrition:** Meal planning and tracking
4. **Activities:** Walk tracking with maps
5. **Profile Sharing:** QR code generation for sharing
6. **Onboarding:** Multi-step user registration

## Tech Stack
- React 19.2.0
- Vite 7.2.4
- Bootstrap 5
- React Router DOM
- React Bootstrap

## Getting Started

```bash
npm install
npm run dev
```
