import { observable } from 'mobx'
import { Folder, WordcloudId } from 'services/api/types'

export const dashboardUiState = observable({
  folder: 'all' as Folder | 'all' | 'no folder',
  selection: new Set<WordcloudId>(),
})
