import { createBrowserRouter } from 'react-router'
import { HomeScreen } from '../features/home/HomeScreen'
import { LibraryScreen } from '../features/library/LibraryScreen'
import { LoginScreen } from '../features/login/LoginScreen'
import { SearchScreen } from '../features/search/SearchScreen'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { App } from './App'
import { RequireSession } from './RequireSession'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginScreen /> },
  {
    path: '/',
    element: (
      <RequireSession>
        <App />
      </RequireSession>
    ),
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'library', element: <LibraryScreen /> },
      { path: 'search', element: <SearchScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
      { path: '*', element: <HomeScreen /> },
    ],
  },
])
