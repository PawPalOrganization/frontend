import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ROUTES } from './constants/routes';

// Import pages
import Login from './pages/Login/Login';
import CreateAccount from './pages/Onboarding/CreateAccount';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Onboarding Routes */}
          <Route path={ROUTES.ONBOARDING} element={<div>Onboarding</div>} />
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.CREATE_ACCOUNT} element={<CreateAccount />} />
          <Route path={ROUTES.VALIDATION_CODE} element={<div>Validation Code</div>} />

        {/* Main App Routes */}
        <Route path={ROUTES.DASHBOARD} element={<div>Dashboard</div>} />
        <Route path={ROUTES.ADD_PET_PROFILE} element={<div>Add Pet Profile</div>} />
        <Route path={ROUTES.SHARE_PROFILE} element={<div>Share Profile</div>} />
        <Route path={ROUTES.HEALTH_CARD} element={<div>Health Card</div>} />
        <Route path={ROUTES.NUTRITION} element={<div>Nutrition</div>} />
        <Route path={ROUTES.ACTIVITIES} element={<div>Activities</div>} />

        {/* Add Pet Profile Steps */}
        <Route path={ROUTES.ADD_PET_BREED} element={<div>Breed Selection</div>} />
        <Route path={ROUTES.ADD_PET_NAME} element={<div>Name Step</div>} />
        <Route path={ROUTES.ADD_PET_SIZE} element={<div>Size Step</div>} />
        <Route path={ROUTES.ADD_PET_WEIGHT} element={<div>Weight Step</div>} />
        <Route path={ROUTES.ADD_PET_DATES} element={<div>Important Dates</div>} />
        <Route path={ROUTES.ADD_PET_CARETAKERS} element={<div>Caretakers</div>} />
      </Routes>
    </Router>
  </AuthProvider>
  );
}

export default App;
