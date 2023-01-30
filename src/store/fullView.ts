import { defineStore } from 'pinia'
export const useFullView = defineStore('fullView', {
  state: () => ({
    id: '',
    name: '',
    /**场景列表 */
    scenes: [],
    /**沙盘 */
    sandTable: {
      /**沙盘图片地址 */
      url: 'img/sandTable.png',
      /**沙盘marker点 列表*/
      markers: []
    },
    currentScenesId: '',
    currentHotId: '',
    currentMarkerId: ''
  }),
  getters: {
    /**当前选中的场景 */
    currentScene(state) {
      return state.scenes.find(item => item.id === state.currentScenesId)
    },
    /**当前选中的热点 */
    currentHot(state) {
      return this.currentScene?.hotSpots?.find(item => item.id === state.currentHotId)
    },
    /**当前选中的沙盘marker点位 */
    currentMarker(state) {
      return this.sandTable?.markers?.find(item => item.id === state.currentMarkerId)
    },
    /**获取场景 */
    getScene(state) {
      return (sceneId) => {
        return state.scenes.find(item => item.id === sceneId)
      }
    }
  }
})
