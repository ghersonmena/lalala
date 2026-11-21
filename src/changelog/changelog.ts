export type ChangeType = 'nuevo' | 'mejora' | 'arreglo'

export interface ChangelogEntry {
  version: string
  /** Fecha ISO (YYYY-MM-DD) */
  date: string
  items: { type: ChangeType; text: string }[]
}

/**
 * Historial de versiones, de la más nueva a la más vieja.
 * Al publicar cambios visibles: agrega una entrada arriba y sube "version" en package.json.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.1.0',
    date: '2026-11-20',
    items: [
      { type: 'nuevo', text: 'Primera versión: navegación entre Inicio, Biblioteca y Buscar.' },
      { type: 'nuevo', text: 'Tema claro, oscuro o automático según tu dispositivo.' },
      { type: 'nuevo', text: 'Al cambiar de tema, la luz o la oscuridad baja en un círculo desde la esquina superior.' },
      { type: 'nuevo', text: 'Cuatro colores de acento a elegir en Ajustes.' },
      { type: 'nuevo', text: 'Se puede instalar como app (PWA).' },
    ],
  },
]
