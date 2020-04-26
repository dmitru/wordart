import { observable } from 'mobx'
import { RootStore } from 'root-store'

type LeftPanelTab = 'templates' | 'shapes' | 'words' | 'style'

export class EditorPageStore {
  rootStore: RootStore
  constructor(rootStore: RootStore) {
    this.rootStore = rootStore
  }

  @observable activeLeftTab: LeftPanelTab = 'shapes'
  @observable shape: ShapeConfig = shapes[0]

  getShapes = (): ShapeConfig[] => shapes
}

type ShapeConfig = {
  id: string
  url: string
  title: string
}
const shapes: ShapeConfig[] = [
  {
    id: 'cat',
    title: 'Cat',
    url: '/images/cat.png',
  },
  {
    id: 'beatles',
    title: 'Beatles',
    url: '/images/beatles.jpg',
  },
  {
    id: 'number-six',
    title: 'Number Six',
    url: '/images/number_six.png',
  },
  {
    id: 'darth-vader',
    title: 'Darth Vader',
    url: '/images/darth_vader.jpg',
  },
]
