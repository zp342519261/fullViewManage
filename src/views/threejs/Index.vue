<template>
  <div class="editor-3d" ref="$el">
    <div class="header">
      <div class="header-wrapper">
        <div class="sub-title">{{ doc.name }}</div>
        <div class="right">
          <el-button class="ma-2" @click="exportAction">导出
          </el-button>
          <el-button class="ma-2" @click="isShowPreviewDlg = true">预览
          </el-button>
        </div>
      </div>
    </div>
    <div class="content">
      <div class="left-sidebar">
        <ul class="menu-list">
          <li class="menu-item" v-for="(item, index) in menuNav" :key="index"
            :class="{ 'is-active': activeName === item.value }" @click="changeMenu(item)">
            <div class="menu-item__label">{{ item.label }}</div>
          </li>
        </ul>
      </div>
      <div class="stage">
        <div class="wrapper">
          <div class="view-area" id="container">
          </div>
          <div class="help-frame" v-if="$route.name === 'view'">
            <el-button class="btn" color="primary" small @click="setCameraPosHandle">把当前视觉设置为初始视角
            </el-button>
          </div>
          <!--热点列表-->
          <div class="hotSpot-list" :key="uniqueId" v-if="$route.name === 'hot' && !isLoading">
            <div class="hotStop-item" :class="{ 'is-active': item.id === lodash.get(activePoint, 'id') }"
              @mousedown="pointDownHandle($event, item)" v-for="(item, index) in hotSpots"
              :style="transformStyle(item.pos, item)" :key="index">
              <img :src="SYS_ICON_MAP1[item.iconPath] || item.iconPath">
              <!--      说明、注释渲染        -->
              <div class="point-item__label" v-if="lodash.get(item, 'title.show')">
                {{ item.title.label }}
              </div>
            </div>
          </div>
          <!-- 沙盘 -->
          <div class="sand-table-box" v-if="$route.name === 'sandTable'" id="sandTableBox">
            <div class="img">
              <img :src="doc.sandTable.url" draggable="false">
            </div>
            <div class="marker-list">
              <div class="marker-item" v-for="(item, index) in doc.sandTable.markers" :key="index"
                :class="{ 'is-active': activeMarkerIndex === index }"
                :style="{ left: item.pos.x + 'px', top: item.pos.y + 'px' }"
                @mousedown="markerItemDownHandle($event, item, index)">
                <div class="marker-item__outline">
                  <div class="marker-item__circle" :style="{ transform: `rotate(${item.angle}deg)` }">
                    <div class="marker-item__point" @mousedown.stop.prevent="pointMouseDownHandle($event, item, index)">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!--  场景列表  -->
        <div class="scene-list">
          <div class="scene-item" v-for="(item, index) in doc.scenes" :key="index"
            :class="{ 'is-active': index === activeIndex }" @click="changeSceneHandle(index)">
            <img :src="item.url" alt="">
            <div class="scene-item__name">{{ item.name }}</div>
          </div>
          <div class="scene-item plus">
            <div>添加场景</div>
          </div>
        </div>
      </div>
      <div class="right-sidebar">
        <div v-if="$route.name === 'view'">
          <div class="section">
            <div class="section-title">
              当前初始视觉
            </div>
            <div class="section-content">
              <div id="preview-thumbnail">

              </div>
            </div>
          </div>
          <div class="section">
            <div class="section-title">视觉范围设置</div>
            <el-form>
              <el-form-item label="初始视角">
                <el-input-number label="" :max="params.maxFov" :min="params.minFov" v-model="params.fov">
                </el-input-number>
              </el-form-item>
              <el-form-item label="视角范围">
                <el-slider :min="0.1" range :max="150" :step="0.1" v-model="fovRange"
                  @input="changeHandle($event, 'fov')"></el-slider>
              </el-form-item>
              <el-form-item label="水平视角限制">
                <el-slider :min="-180" range :max="180" :step="1"
                  v-model="azimuthAngleRange"
                  @input="changeHandle($event, 'horizontal')"></el-slider>
              </el-form-item>
              <el-form-item label="垂直视角限制">
                <el-slider :min="-90" range :max="90" :step="1" v-model="polarAngleRange"
                  @input="changeHandle($event, 'vertical')"></el-slider>
              </el-form-item>
            </el-form>
          </div>
        </div>
        <div v-else-if="$route.name === 'hot'">
          <HotSpot :list="hotSpots" :activePoint="activePoint" :doc="lodash.cloneDeep(doc)" @addPoint="addPointHandle"
            @change="changePointHandle" @cancel="cancelPointHandle" @delPoint="delPointHandle">
          </HotSpot>
        </div>
        <!-- 沙盘 -->
        <div v-else-if="$route.name === 'sandTable'">
          <SandTable :sand-table="doc.sandTable" :doc="doc" :activeIndex="activeMarkerIndex"
            @change="changeSandTableHandle" @changeIndex="changeMarkerIndexHandle"></SandTable>
        </div>
      </div>
    </div>
    <el-dialog v-if="isShowPreviewDlg" width="800px" :fullscreen="false" v-model="isShowPreviewDlg"
      :overlay-opacity="0.8" content-class="preview-dlg" @click:outside="isShowPreviewDlg = false">
      <PreviewDlg :doc="doc">
      </PreviewDlg>
    </el-dialog>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import lodash from 'lodash'
import PreviewDlg from './comps/Preview.vue'
import HotSpot from './comps/HotSpot.vue'
import SandTable from './comps/SandTable.vue';
import { ICON_MAP, SYS_ICON_MAP1 } from '@/assets/js/const.js'
import docJSON from '/public/json/doc.json'
import { randomString } from '@/assets/js/utils.js'
import { pointInSceneView, screenVector2World, worldVector2Screen } from './common.js'
import { menuNav , thumbnail } from './config'
import fullViewClass from './fullView';
const route = useRoute()
const router = useRouter()
let fullView
const $el = ref()
const doc = ref(docJSON)
const isShowPreviewDlg = ref(false)
const activeName = ref('')
const isLoading = ref(false)
const activeIndex = ref(0)
const activePoint = ref({})
const uniqueId = ref('')
// 每个场景的透视相机参数
const params = ref({})
const polarAngleRange = ref({})
const azimuthAngleRange = ref({})
const fovRange = ref({})
const activeMarkerIndex = ref(0)


const transformStyle = computed(() => {

  return (point, item) => {
    if (!point || !item || !fullView) return
    let pos = worldVector2Screen({
      x: point.x,
      y: point.y,
      z: point.z
    }, fullView.container, fullView.camera);
    const visible = pointInSceneView(point, fullView.camera)
    return {
      transform: `translateZ(0px) translate(${pos?.x}px,${pos?.y}px) translate(-${item.iconSize / 2}px,-${item.iconSize / 2}px)`,
      width: item.iconSize + 'px',
      height: item.iconSize + 'px',
      opacity: visible ? 1 : 0
    }
  }
})

const activeItem = computed(() => {
  return doc.value.scenes[activeIndex.value]
})
const hotSpots = computed(() => {
  return doc.value.scenes[activeIndex.value].hotSpots
})
// 添加热点：
const addPointHandle = (data) => {
  const rect = fullView.container.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const pos = screenVector2World({ x: centerX, y: centerY }, fullView.container, fullView.camera);
  const point = lodash.cloneDeep(data);
  point.pos = pos;
  doc.value.scenes[activeIndex.value].hotSpots.push(point);
  activePoint.value = point
}
// 选中的热点属性变化
const changePointHandle = (data) => {
  activePoint.value = lodash.cloneDeep(data);
  setActivePoint(data);
}
// 取消选中的热点
const cancelPointHandle = () => {
  activePoint.value = {};
}
// 删除热点
const delPointHandle = () => {
  const points = doc.value.scenes[activeIndex.value].hotSpots;
  const index = points.findIndex(item => {
    return item.id === activePoint.value.id
  })
  points.splice(index, 1)
  activePoint.value = {};
}
// 生成缩略图
const createThumbnail = () => {
  if (route.name !== 'view') return
  const dom = document.querySelector('#container');
  const thumbnailDom = document.querySelector('#preview-thumbnail');
  fullView.render()
  thumbnail(dom, thumbnailDom)
}

const init = async () => {
  isLoading.value = true;
  fullView = new fullViewClass(container)
  fullView.container = document.getElementById('container');
  const data = doc.value.scenes[0];
  initCamera(data);
  await fullView.initContent(data.url)
  setFullViewParams(params.value)
  fullView.render();
  isLoading.value = false;
}

const changeHandle = (v, key) => {
  switch (key) {
    case 'horizontal':
      params.value.minAzimuthAngle = v[0];
      params.value.maxAzimuthAngle = v[1];
      break;
    case 'vertical':
      params.value.minPolarAngle = v[0];
      params.value.maxPolarAngle = v[1];
      break;
    case 'fov':
      params.value.minFov = v[0];
      params.value.maxFov = v[1];
      break;
    default:
      break;
  }
}
// 设置当前视觉
const setCameraPosHandle = () => {
  doc.value.scenes[activeIndex.value].cameraPos = lodash.cloneDeep(fullView.camera.position);
  // 获取水平角度
  doc.value.scenes[activeIndex.value].angleX = fullView.controls.getAzimuthalAngle() * 180 / Math.PI;
  doc.value.scenes[activeIndex.value].params.fov = fullView.camera.fov
  createThumbnail()
}
// 切换左侧菜单
const changeMenu = (item) => {
  activeName.value = item.value;
  router.push({
    name: item.value
  })
}

// 判断是点击还是拖拽
const pointDownHandle = (e, item) => {
  e.preventDefault();
  let isDragging = false;
  const setDragTrue = () => {
    isDragging = true;
  }

  let timer = setTimeout(setDragTrue, 200)

  const target = e.currentTarget;
  let transform = target.style.transform;
  const reg = /translate\((-?\d+(?:\.\d*)?)px, (-?\d+(?:\.\d*)?)px\)/;
  transform = transform.match(reg);

  let translateX = parseInt(transform[1]);
  let translateY = parseInt(transform[2]);


  let startPos = {
    x: e.clientX,
    y: e.clientY
  }

  const mouseMoveHandle = (e) => {
    isDragging = true;

    const diffX = e.clientX - startPos.x;
    const diffY = e.clientY - startPos.y;
    translateX += diffX;
    translateY += diffY;

    startPos = {
      x: e.clientX,
      y: e.clientY
    }
    target.style.transform = `translateZ(0px) translate(${translateX}px,${translateY}px) translate(-40px,-40px)`
  }

  const mouseUpHandle = () => {
    if (!isDragging) {
      clearTimeout(timer);
      clickPointHandle(item);
      console.log('mouse up');
    } else {
      isDragging = false;
      console.log('drag over');
      const pos = screenVector2World({
        x: translateX,
        y: translateY
      }, fullView.container, fullView.camera)
      item.pos = {
        x: pos.x,
        y: pos.y,
        z: pos.z,
      };
    }
    document.body.removeEventListener('mousemove', mouseMoveHandle)
    document.body.removeEventListener('mouseup', mouseUpHandle)
  }
  document.body.addEventListener('mousemove', mouseMoveHandle)
  document.body.addEventListener('mouseup', mouseUpHandle)
}
const findSandMarkerIndex = (sceneId) => {
  const sandTable = doc.value.sandTable.markers;
  console.log('sandTable:', sandTable)
  return sandTable.findIndex(item => {
    return item.sceneId === sceneId
  })

}
// 切换场景
const changeSceneHandle = async (index) => {
  const scene = doc.value.scenes[index];
  if (route.name === 'sandTable') {
    activeMarkerIndex.value = findSandMarkerIndex(scene.id)
    console.log('activeMarkerIndex:', activeMarkerIndex);
  }

  activeIndex.value = index;
  params.value = scene.params;
  setParams(params.value)
  // 选中的热点置空
  activePoint.value = {};
  // TODO:当前的场景重新渲染 + 生成缩略图
  await fullView.initContent(activeItem.value.url)

  setFullViewParams(params.value)

  // 相机位置
  const cameraPos = activeItem.value.cameraPos;
  fullView.camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
  // important:通过参数更新相机位置，必须调用controls的update才会生效
  fullView.controls.update();

  fullView.render()

  createThumbnail();
}

const setParams = (params) => {
  polarAngleRange.value = [params.minPolarAngle,params.maxPolarAngle]
  azimuthAngleRange.value = [params.minAzimuthAngle,params.maxAzimuthAngle]
  fovRange.value = [params.minFov,params.maxFov]
}
const setFullViewParams = (params) => {
  fullView.camera.fov = params.fov;
  fullView.minFov = params.minFov;
  fullView.maxFov = params.maxFov;
  fullView.minAzimuthAngle.set(params.minAzimuthAngle || -180)
  fullView.maxAzimuthAngle.set(params.maxAzimuthAngle || 180)
  fullView.minPolarAngle.set(params.minPolarAngle || -90)
  fullView.maxPolarAngle.set(params.maxPolarAngle || 90)
}
watch(() => params.value.minAzimuthAngle, (val) => {
  if(fullView) {
    fullView.minAzimuthAngle.set(val)
  }
})
watch(() => params.value.maxAzimuthAngle, (val) => {
  if(fullView) {
    fullView.maxAzimuthAngle.set(val)
  }
})
watch(() => params.value.minPolarAngle, (val) => {
  if(fullView) {
    fullView.minPolarAngle.set(val)
  }
})
watch(() => params.value.maxPolarAngle, (val) => {
  if(fullView) {
    fullView.maxPolarAngle.set(val)
  }
})
watch(() => params.value.minFov, (val) => {
  if(fullView) {
    fullView.minFov = val
    fullView.camera.fov = val
    fullView.render()
  }
})
watch(() => params.value.maxFov, (val) => {
  if(fullView) {
    fullView.maxFov = val
    fullView.camera.fov = val
    fullView.render()
  }
})
watch(() => params.value.fov, (val) => {
  if(fullView) {
    fullView.camera.fov = val
    fullView.render()
  }
})

// 设置选中的热点
const setActivePoint = (data) => {
  console.log("🚀 ~ file: Index.vue:441 ~ setActivePoint ~ data", data)
  const points = doc.value.scenes[activeIndex.value].hotSpots;
  const index = points.findIndex(item => {
    return item.id === data.id
  })
  points.splice(index, 1, data)
}

const clickPointHandle = (item) => {
  activePoint.value = item;
}

const exportAction = () => {
  console.log('exportAction doc.value:', JSON.stringify(doc.value))
}

const initCamera = (data) => {
  fullView.camera.position.set(data.cameraPos.x, data.cameraPos.y, data.cameraPos.z)
  fullView.controls.update()
}
// 沙盘数据修改
const changeSandTableHandle = (data) => {
  doc.value.sandTable = data;
}
// 寻找目标场景
const findTargetScene = (id) => {
  let i = -1;
  const target = doc.value.scenes.find((item, index) => {
    if (item.id === id) {
      i = index;
    }
    return item.id === id
  })
  return { scene: target, index: i }
}
const markerItemDownHandle = (e, item, i) => {
  let startX = e.clientX;
  let startY = e.clientY;

  const mouseMove = (e) => {
    const x = e.clientX;
    const y = e.clientY;

    const diffX = x - startX;
    const diffY = y - startY;


    // TODO:边界条件判断
    item.pos.x += diffX;
    item.pos.y += diffY;

    startX = e.clientX;
    startY = e.clientY;
  }
  const moveUp = () => {
    if (activeMarkerIndex.value !== i) {
      activeMarkerIndex.value = i;
      // 切换场景
      const { index } = findTargetScene(item.sceneId);
      changeSceneHandle(index);
    }
    document.body.removeEventListener('mousemove', mouseMove)
    document.body.removeEventListener('mouseup', moveUp)
  }
  document.body.addEventListener('mousemove', mouseMove)
  document.body.addEventListener('mouseup', moveUp)
}
// 拖拽旋转
const pointMouseDownHandle = (e, item, index) => {
  const nodeList = $el.value.querySelectorAll('.marker-item');
  const dom = nodeList[index].querySelector('.marker-item__outline');
  const domRect = dom.getBoundingClientRect();

  const centerPos = {
    x: domRect.width / 2 + domRect.x,
    y: domRect.height / 2 + domRect.y,
  }
  let mouseMove = (e) => {
    const curMouse = {
      x: e.clientX,
      y: e.clientY,
    }
    // https://blog.csdn.net/wjlhanhan/article/details/109668342
    const radians = Math.atan2(curMouse.x - centerPos.x, curMouse.y - centerPos.y);
    let angle = (radians * (180 / Math.PI) * -1) + 180
    // 沙盘旋转角度转化到相机
    console.log('angle:', angle)
    item.angle = angle;


    doc.value.sandTable.markers[index].angle = angle;

    rotate2cameraPos(angle)
  }

  let mouseUp = () => {
    console.log('mouseup')
    document.body.removeEventListener('mousemove', mouseMove)
    document.body.removeEventListener('mouseup', mouseUp)
  }

  document.body.addEventListener('mousemove', mouseMove)
  document.body.addEventListener('mouseup', mouseUp)
}
// 已知水平角度，转化成相机的坐标
// https://www.wjceo.com/blog/threejs2/2018-12-05/181.html
const rotate2cameraPos = (angle) => {
  // 距离
  const r = fullView.controls.object.position.distanceTo(fullView.controls.target);
  // 垂直方向角度（y轴）
  const phi = fullView.controls.getPolarAngle();
  // 水平方向的角度（x轴）
  const theta = angle * Math.PI / 180;
  const x = r * Math.cos(phi - Math.PI / 2) * Math.sin(theta) + fullView.controls.target.x;
  const y = r * Math.sin(phi + Math.PI / 2) + fullView.controls.target.y;
  const z = r * Math.cos(phi - Math.PI / 2) * Math.cos(theta) + fullView.controls.target.z;
  fullView.controls.object.position.set(x, y, z);
  fullView.controls.object.lookAt(fullView.controls.target);
  console.log('x:', x, 'y:', y, 'z:', z)
  doc.value.scenes[activeIndex.value].cameraPos = { x, y, z }
  fullView.controls.update();
}

const changeMarkerIndexHandle = (i, item) => {
  activeMarkerIndex.value = i;
  //  切换场景
  const { index } = findTargetScene(item.sceneId);
  changeSceneHandle(index)
}
onMounted(() => {
  activeName.value = route.name;
  params.value = doc.value.scenes[activeIndex.value].params
  setParams(params.value)
  nextTick(async () => {
    await init();

    const controlChangeHandle = () => {
      uniqueId.value = randomString()
      fullView.render();
      // 获取水平的角度
      const angleX = fullView.controls.getAzimuthalAngle() * 180 / Math.PI;
      console.table([{
        maxPolarAngle: fullView.controls.maxPolarAngle,
        minPolarAngle: fullView.controls.minPolarAngle,
        maxAzimuthAngle: fullView.controls.maxAzimuthAngle,
        minAzimuthAngle: fullView.controls.minAzimuthAngle,
      }])


      if (activeMarkerIndex.value === -1) return
      const marker = doc.value.sandTable.markers[activeMarkerIndex.value];
      const { scene } = findTargetScene(marker.sceneId);
      marker.angle += scene.angleX
      marker.angle = marker.angle % 360;
      // scene.angleX = angleX
    }
    fullView.controls.addEventListener('change', controlChangeHandle);
    window.addEventListener('resize', fullView.resizeHandle);
    // 生成场景缩略图
    createThumbnail();
  })
})
</script>


<style scoped lang="scss">
.editor-3d {
  height: 100vh;
  overflow: hidden;
}

.header {
  height: 40px;
  border-bottom: 1px solid #eee;

  .header-wrapper {
    text-align: center;
    max-width: 1920px;
    line-height: 40px;
  }

  .sub-title {
    display: inline-block;
  }

  .right {
    float: right;

  }
}


.content {
  width: 100%;
  height: calc(100vh - 40px);
  @include flex(space-between);

  .left-sidebar {
    width: 50px;
    height: 100%;
    border-right: 1px solid #eee;
    flex: none;
  }

  .stage {
    flex: auto;
    height: 100%;
    //padding: 20px;
    position: relative;
    @include flex();
    flex-direction: column;

    .view-area {
      width: 100%;
      height: 100%;
    }

    .help-frame {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 75%;
      height: 74%;
      background: url('/img/view_frame.png') no-repeat;
      background-size: contain;
      background-position: center;
      pointer-events: none;

      .btn {
        position: absolute;
        bottom: 5px;
        left: 50%;
        transform: translate(-50%, 0);
        pointer-events: auto;
      }
    }

    .hotSpot-list {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      user-select: none;
      pointer-events: none;
    }

    .hotStop-item {
      position: absolute;

      border-radius: 5px;
      cursor: pointer;
      width: 80px;
      height: 80px;
      transform-origin: 50% 50%;
      pointer-events: auto;
      background-color: rgba(0, 0, 0, 0.1);

      &.is-active {
        border: 3px solid orange;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .point-item__label {
        background-color: rgba(0, 0, 0, 0.5);
        color: #fff;
        padding: 10px;
        border-radius: 5px;
        position: absolute;
        top: 0;
        left: 50%;
        transform: translate(-50%, -50%);
        word-break: keep-all;
      }
    }
  }

  .wrapper {
    flex: auto;
    width: 100%;
    height: 100%;
    position: relative;
  }

  .scene-list {
    width: 100%;
    height: 100px;
    @include flex();

    .scene-item {
      position: relative;
      width: 80px;
      height: 80px;
      border: 1px solid #eee;
      border-radius: 3px;
      margin-top: 10px;
      margin-right: 10px;
      cursor: pointer;

      &.is-active {
        border: 2px solid $--color-primary;
      }


      &.plus {
        @include flex(center, center);
        flex-direction: column;
        cursor: pointer;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      &__name {
        position: absolute;
        width: 100%;
        height: 30px;
        left: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        color: #fff;
        text-align: center;
        padding-top: 5px;
      }
    }
  }

  .right-sidebar {
    width: 230px;
    height: 100%;
    border-left: 1px solid #eee;
    flex: none;
    padding: 0 5px;
  }
}

.section {
  &-title {
    font-size: 16px;
    font-weight: bold;
    margin: 10px 0;
  }
}

#preview-thumbnail {
  width: 100%;
  height: 120px;

  ::v-deep canvas {
    width: 100% !important;
    height: 100% !important;
  }
}

.menu-list,
.menu-list .menu-item {
  margin: 0;
  padding: 0;
  list-style: none;
}

.menu-item {
  cursor: pointer;
  @include flex(center, center);
  flex-direction: column;
  padding: 5px 0 !important;

  &.is-active {
    background-color: #5e35b1 !important;

    .menu-item__icon i,
    .menu-item__label {
      color: #fff;
    }
  }

  &__icon {
    i {
      font-size: 18px;
    }
  }

  &__label {
    font-size: 12px;
    color: #666;
  }
}

.sand-table-box {
  width: 200px;
  position: absolute;
  right: 10px;
  top: 10px;

  .img {
    width: 100%;
    height: 100%;
  }

  img {
    width: 100%;
    -webkit-user-drag: none;
    user-drag: none;
    user-select: none;
  }
}

.marker-item {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: blue;
  border: 2px solid #fff;

  &.is-active {
    background-color: orange;

    .marker-item__outline {
      display: block;
    }
  }

  &__outline {
    width: 30px;
    height: 30px;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border: 1px solid orange;
    border-radius: 50%;
    display: none;
  }

  &__circle {
    position: absolute;
    width: 2px;
    height: 15px;
    left: 50%;
    top: 0;
    background-color: transparent;
    transform-origin: 0 15px;
  }

  &__point {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: red;
    border-radius: 50%;
    top: 0%;
    left: 50%;
    transform: translate(-50%, -50%);
    cursor: ew-resize;
  }
}
</style>

