import { observable } from 'mobx'
import { Folder, WordcloudId } from 'services/api/types'

export const dashboardUiState = observable({
  folder: null as Folder | null,
  selection: new Set<WordcloudId>(),
})
