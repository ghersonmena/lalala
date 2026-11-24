import { createBrowserRouter } from 'react-router'
import { HomeScreen } from '../features/home/HomeScreen'
import { LibraryScreen } from '../features/library/LibraryScreen'
import { LoginScreen } from '../features/login/LoginScreen'
import { SearchScreen } from '../features/search/SearchScreen'
import { App } from './App'
import { setupNavTransitions } from './navTransitions'
import { RequireSession } from './RequireSession'

// Las pantallas secundarias se cargan bajo demanda (paquete inicial más ligero).
const lists = () => import('../features/library/listScreens')
const collections = () => import('../features/home/collectionScreens')

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
      { path: 'library/albums', lazy: async () => ({ Component: (await lists()).AlbumsScreen }) },
      { path: 'library/artists', lazy: async () => ({ Component: (await lists()).ArtistsScreen }) },
      { path: 'library/songs', lazy: async () => ({ Component: (await lists()).SongsScreen }) },
      { path: 'library/playlists', lazy: async () => ({ Component: (await lists()).PlaylistsScreen }) },
      { path: 'library/genres', lazy: async () => ({ Component: (await lists()).GenresScreen }) },
      { path: 'library/downloads', lazy: async () => ({ Component: (await lists()).DownloadsScreen }) },
      { path: 'recent/added', lazy: async () => ({ Component: (await lists()).RecentlyAddedScreen }) },
      { path: 'recent/played', lazy: async () => ({ Component: (await lists()).RecentlyPlayedScreen }) },
      { path: 'genre/:id', lazy: async () => ({ Component: (await lists()).GenreScreen }) },
      {
        path: 'album/:id',
        lazy: async () => ({ Component: (await import('../features/album/AlbumScreen')).AlbumScreen }),
      },
      {
        path: 'artist/:id',
        lazy: async () => ({ Component: (await import('../features/artist/ArtistScreen')).ArtistScreen }),
      },
      {
        path: 'playlist/:id',
        lazy: async () => ({ Component: (await import('../features/library/PlaylistScreen')).PlaylistScreen }),
      },
      { path: 'mix', lazy: async () => ({ Component: (await collections()).MixScreen }) },
      { path: 'favorites', lazy: async () => ({ Component: (await collections()).FavoritesScreen }) },
      {
        path: 'settings',
        lazy: async () => ({ Component: (await import('../features/settings/SettingsScreen')).SettingsScreen }),
      },
      { path: '*', element: <HomeScreen /> },
    ],
  },
])

setupNavTransitions(router)
