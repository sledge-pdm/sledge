import { createStore } from 'solid-js/store'

// project
export type RecentFile = {
  name: string
  path: string
}

export const [globalStore, setGlobalStore] = createStore({
  recentOpenedFiles: [
    {
      name: 'project.sledge',
      path: 'C:\\Users\\innsb\\Documents',
    },
  ],
})
