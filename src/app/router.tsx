import { createBrowserRouter } from 'react-router'
import { HomeScreen } from '../features/home/HomeScreen'
import { LibraryScreen } from '../features/library/LibraryScreen'
import { SearchScreen } from '../features/search/SearchScreen'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { App } from './App'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'library', element: <LibraryScreen /> },
      { path: 'search', element: <SearchScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
      { path: '*', element: <HomeScreen /> },
    ],
  },
])
