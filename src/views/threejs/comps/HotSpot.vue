<template>
  <div>
    <el-button class="ma-2" tile color="indigo" dark @click="addPointHandle">添加热点
    </el-button>
    <!-- 当前场景热点 -->
    <div class="list">

    </div>


    <div transition="slide-x-reverse-transition" v-if="fullViewStore.currentHotId" class="right-panel" height="100vh" :right="true"
      :hide-overlay="true" @input="toggleDrawerHandle">
      <div class="pa-4">
        <div class="header">
          <div class="header-title">添加热点
          </div>
          <div class="header-close">
            <el-button small text @click="closeDrawHandle">关闭
            </el-button>
          </div>
        </div>
        <div class="body">
          <el-form>
            <el-form-item label="图标">
              <el-select v-model="fullViewStore.currentHot.iconType" @change="changeIconTypeHandle">
                <el-option v-for="item in iconTypes" :key="item.value" :label="item.label"
                  :value="item.value"></el-option>
              </el-select>
              <!-- 系统图表列表-->
              <div class="sys-icon-list" v-show="fullViewStore.currentHot.iconType === 'sys'">
                <div class="icon-item" v-for="(item, index) in sysIcons"
                  :class="{ 'is-active': fullViewStore.currentHot.iconPath === item.spriteUrl }" :key="index"
                  @click="changeIconHandle(item)">
                  <img :src="item.url">
                </div>
              </div>
              <el-input v-show="fullViewStore.currentHot.iconType === 'custom'" label="图标地址" v-model="fullViewStore.currentHot.iconPath"
                placeholder="请输入图标链接">
              </el-input>
              <div>图标大小</div>
              <el-slider v-model="fullViewStore.currentHot.iconSize" :min="10" :max="100"></el-slider>
            </el-form-item>



            <el-form-item label="热点类型">
              <el-select :items="hotTypes" item-text="label" item-value="value" v-model="fullViewStore.currentHot.hotType">
                <el-option v-for="item in hotTypes" :key="item.value" :label="item.label" :value="item.value">
                </el-option>
              </el-select>
              <div>
                选择目标全景
                <el-button @click="isShowSceneDlg = true">选择场景
                </el-button>
                <div class="selected-scene" v-if="selectScene?.id">
                  <div class="selected-scene__img">
                    <img :src="selectScene.url" alt="">
                  </div>
                  <div class="selected-scene__name">
                    {{ selectScene.name }}
                  </div>
                </div>
              </div>
            </el-form-item>


            <div class="form-item">
              <div class="form-item__label">
                <span>标题</span>
                <el-checkbox label="显示" v-model="fullViewStore.currentHot.title.show">
                </el-checkbox>
              </div>
              <div class="form-item__value">
                <el-input v-model="fullViewStore.currentHot.title.label" placeholder="请输入标题">
                </el-input>
              </div>
            </div>


          </el-form>
        </div>
        <div class="footer">
          <el-button @click="delPointHandle()">删除</el-button>
        </div>
      </div>
    </div>
    <SceneDlg v-if="isShowSceneDlg" :visible="isShowSceneDlg" :doc="fullViewStore" :scene-id="fullViewStore.currentHot.value"
      @close="isShowSceneDlg = false" @sure="sureHandle">
    </SceneDlg>
  </div>
</template>

<script setup>
import {ref, computed,watch} from 'vue'
import lodash from 'lodash'
import { useFullView } from '@/store/fullView'
import {randomString} from '@/assets/js/utils.js'
import {SYS_ICON_MAP} from '@/assets/js/const.js'
import {iconTypes, hotTypes,sysIcons} from '../config'
import SceneDlg from './Scene.vue'

const emit = defineEmits(["change", 'cancel', 'addPoint', 'delPoint'])

const fullViewStore = useFullView()
const isShowSceneDlg = ref(false)

const selectScene = computed(() => {
  return fullViewStore.getScene(fullViewStore.currentHot?.value)
})
const changeIconHandle = (item) => {
  fullViewStore.currentHot.iconPath = SYS_ICON_MAP[item.url]
  fullViewStore.currentHot.gif = item.gif
  fullViewStore.currentHot.texture = item.texture
}
const changeIconTypeHandle = () => {
  if (fullViewStore.currentHot.iconType) {
    fullViewStore.currentHot.gif = false
  }
}
const addPointHandle = () => {
      if(!fullViewStore.currentScene) {
        return
      }
      emit('addPoint', {
        id: randomString(),
        iconType: 'sys',
        iconPath: '/img/arrow1.png',
        iconSize: 80,
        hotType: 'scene',
        gif: true,
        "texture": {
          "horizontalNum": 1,
          "verticalNum": 25,
          "numTiles": 25,
          "duration": 50
        },
        pos: {
          x: 0,
          y: 0,
          z: -0.2
        },
        title: {
          label: '',
          show: true
        }
      })
    }
const toggleDrawerHandle = (v) => {
  console.log('toggleDrawerHandle:', v)
}
const sureHandle = (data) => {
  fullViewStore.currentHot.value = data.id;
  isShowSceneDlg.value = false;
}
 // 取消选中的热点
const closeDrawHandle = () => {
  emit('cancel')
}
// 删除热点
const delPointHandle = () => {
  emit('delPoint');
}
</script>


<style scoped lang="scss">
.header {
  @include flex(space-between, center);

  &-title {
    font-size: 16px;
  }
}

.sys-icon-list {
  @include flex();
  flex-wrap: wrap;
}

.icon-item {
  width: 35px;
  height: 35px;
  margin: 0 2px 15px;
  cursor: pointer;
  border-radius: 2px;

  &.is-active {
    border: 2px solid #5e35b1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.selected-scene {
  margin-top: 10px;
  border: 1px solid #eee;

  &__name {
    padding: 0 10px;
  }

  img {
    width: 100%;
  }
}

.form-item {
  &__label {
    @include flex(space-between, center);
  }
}

.right-panel {
  height: 100vh;
  overflow-y: auto;
  position: absolute;
  top: 0;
  background-color: #fff;
}
</style>
