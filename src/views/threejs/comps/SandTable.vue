<template>
  <div class="sand-table">
    <div class="v-title">电子沙盘</div>


    <el-input label="图片地址" placeholder="请输入图片地址" v-model="sandTable.url" @change="changeHandle">
    </el-input>


    <div class="mt-2">
      <el-button @click="addMakerHandle">添加标记点
      </el-button>

      <div class="marker-list mt-2">
        <div class="marker-item" v-for="(item, index) in sandTable.markers" :key="index"
          :class="{ 'is-active': item.id === fullViewStore.currentMarkerId }" @click="clickMarkerHandle(index, item)">
          <span><span class="circle"></span>
            {{ item.name }}</span>
          <div class="marker-item__del" @click="delMarkerHandle(index)">
            删除
          </div>
        </div>
      </div>
    </div>

    <SceneDlg v-if="isShowSceneDlg" :visible="isShowSceneDlg" :doc="fullViewStore" :scene-id="sandTable.value"
      :checked="checkedSceneIds" @close="isShowSceneDlg = false" @sure="sureHandle">
    </SceneDlg>
  </div>
</template>

<script setup>
import {computed,ref} from 'vue'
import lodash from 'lodash'
import { useFullView } from '@/store/fullView'
import { randomString } from '@/assets/js/utils.js'
import SceneDlg from './Scene.vue'

const emit = defineEmits(["change", 'changeIndex'])
const fullViewStore = useFullView()
const isShowSceneDlg = ref(false)
const sandTable = computed(() => {
  return fullViewStore.sandTable
})
const checkedSceneIds = computed(() => {
  return sandTable.value.markers?.map(item => item.sceneId)
})
const changeHandle = () => {
  emit('change', sandTable.value)
}
// 添加标记点
const addMakerHandle = () =>{
  isShowSceneDlg.value = true;
}
const sureAddMarker = (data)=> {
    // 弹窗：场景列表
    const dom = document.getElementById('sandTableBox');
    const rect = dom.getBoundingClientRect();
    sandTable.value.markers.push({
      id: randomString(),
      pos: {
        x: rect.width / 2,
        y: rect.height / 2
      }, // 位置
      angle: 0, // 角度
      sceneId: data.id,
      name: data.name,
    })
  }
const sureHandle = (data) => {
  isShowSceneDlg.value = false;
  console.log('sureHandle', data);
  if (data && data.id) {
    sureAddMarker(data);
  }
}

const clickMarkerHandle = (index, item) =>{
  fullViewStore.currentMarkerId = item.id
  emit('changeIndex', item)
}
// 删除点位
const delMarkerHandle = (index) => {
  const sandTableClone = lodash.cloneDeep(sandTable.value);
  sandTableClone.markers.splice(index, 1)
  emit('change', sandTableClone)
}
</script>

<style scoped lang="scss">
.v-title {
  font-size: 16px;
  padding: 10px 5px;
}

.marker-item {
  padding: 10px;
  cursor: pointer;
  @include flex(space-between, center);

  &.is-active {
    .circle {
      background-color: $--color-primary;
    }
  }

  &:hover {
    background-color: #fafafa;

    .marker-item__del {
      opacity: 1;
    }
  }

  .circle {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #eee;
    display: inline-block;
  }

  &__del {
    opacity: 0;
  }
}
</style>
