<template>
  <div class="editor-3d" ref="$el">
    <div class="header">
      <div class="header-wrapper">
        <div class="sub-title">{{ fullViewStore.name }}</div>
        <div class="right">
          <el-button class="ma-2" @click="onExportModeClick">导出
          </el-button>
          <el-button class="ma-2" :loading="exportLoading" @click="isShowPreviewDlg = true">预览
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
            <div class="hotStop-item" :class="{ 'is-active': item.id === currentHot?.id }"
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
              <img :src="fullViewStore.sandTable.url" draggable="false">
            </div>
            <div class="marker-list">
              <div class="marker-item" v-for="(item, index) in fullViewStore.sandTable.markers" :key="index"
                :class="{ 'is-active': fullViewStore.currentMarkerId === item.id }"
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
          <div class="scene-item" v-for="(item, index) in fullViewStore.scenes" :key="index"
            :class="{ 'is-active': fullViewStore.currentScenesId === item.id }" @click="changeSceneHandle(item.id)">
            <div class="scene-item__del" @click.stop="delScene(index)">X</div>
            <img :src="item.url" alt="">
            <div class="scene-item__name">{{ item.name }}</div>
          </div>
          <div class="scene-item plus" @click="isShowAddSceneDlg = true">
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
            <el-form v-if="currentScene?.params">
              <el-form-item label="初始视角">
                <el-input-number label="" :max="currentScene.params?.fovRange?.[1] || 180"
                  :min="currentScene.params?.fovRange?.[0] || 0.1" v-model="currentScene.params.fov">
                </el-input-number>
              </el-form-item>
              <el-form-item label="视角范围">
                <el-slider :min="0.1" range :max="150" :step="0.1" v-model="currentScene.params.fovRange"
                  @input="changeHandle($event, 'fov')"></el-slider>
              </el-form-item>
              <el-form-item label="水平视角限制">
                <el-slider :min="-180" range :max="180" :step="1" v-model="currentScene.params.azimuthAngleRange"
                  @input="changeHandle($event, 'horizontal')"></el-slider>
              </el-form-item>
              <el-form-item label="垂直视角限制">
                <el-slider :min="-90" range :max="90" :step="1" v-model="currentScene.params.polarAngleRange"
                  @input="changeHandle($event, 'vertical')"></el-slider>
              </el-form-item>
            </el-form>
          </div>
        </div>
        <div v-else-if="$route.name === 'hot'">
          <HotSpot @addPoint="addPointHandle" @cancel="cancelPointHandle" @delPoint="delPointHandle">
          </HotSpot>
        </div>
        <!-- 沙盘 -->
        <div v-else-if="$route.name === 'sandTable'">
          <SandTable @change="changeSandTableHandle" @changeIndex="changeMarkerIndexHandle"></SandTable>
        </div>
      </div>
    </div>
    <el-dialog center v-if="isShowPreviewDlg" fullscreen width="80%" :fullscreen="false" v-model="isShowPreviewDlg"
      :overlay-opacity="0.8" content-class="preview-dlg" @click:outside="isShowPreviewDlg = false">
      <PreviewDlg :doc="fullViewStore">
      </PreviewDlg>
    </el-dialog>
    <el-dialog width="800px" :fullscreen="false" v-model="isShowAddSceneDlg" :overlay-opacity="0.8"
      content-class="preview-dlg" @click:outside="isShowAddSceneDlg = false">
      <AddScene @change="addScene" @cancel="isShowAddSceneDlg = false" />
    </el-dialog>
    <el-progress v-if="progress > 0" :percentage="progress" :show-text="false" style="margin-top: 5px;"></el-progress>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import lodash from 'lodash'
import PreviewDlg from './comps/Preview.vue'
import HotSpot from './comps/HotSpot.vue'
import SandTable from './comps/SandTable.vue';
import AddScene from './comps/AddScene.vue';
import { ICON_MAP, SYS_ICON_MAP1 } from '@/assets/js/const.js'
import { useFullView } from '@/store/fullView'
import { randomString } from '@/assets/js/utils.js'
import { pointInSceneView, screenVector2World, worldVector2Screen } from './common.js'
import { menuNav , thumbnail, generatePackage } from './config'
import fullViewClass from './fullView';
const route = useRoute()
const router = useRouter()
const fullViewStore = useFullView()
let fullView
const $el = ref()
const isShowPreviewDlg = ref(false)
const activeName = ref('')
const isLoading = ref(false)
const uniqueId = ref('')
const isShowAddSceneDlg = ref(false)
const exportLoading = ref(false)
const progress = ref('')

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

const currentScene = computed(() => {
  return fullViewStore.currentScene
})
const currentHot = computed(() => {
  return fullViewStore.currentHot
})
const hotSpots = computed(() => {
  return currentScene.value?.hotSpots
})
const currentMarker = computed(() => {
  return fullViewStore.currentMarker
})

const addScene = (data) => {
  const sceneId = randomString()
  fullViewStore.scenes.push({
    id: sceneId,
    name: data.name,
    url: data.url,
    params: {
      fovRange: [0.1, 150],
      azimuthAngleRange: [-180, 180],
      polarAngleRange: [-90, 90],
      fov: 70,
    },
    hotSpots: [],
    cameraPos: {
      x:0,
      y:0,
      z:0.00000001
    },
    angleX: 0
  })
  changeSceneHandle(sceneId)
  isShowAddSceneDlg.value = false
}
// 添加热点：
const addPointHandle = (data) => {
  const rect = fullView.container.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const pos = screenVector2World({ x: centerX, y: centerY }, fullView.container, fullView.camera);
  const point = lodash.cloneDeep(data);
  point.pos = pos;
  hotSpots.value.push(point);
  fullViewStore.currentHotId = point.id
}

const cancelPointHandle = () => {
  fullViewStore.currentHotId = ''
}
// 删除热点
const delPointHandle = () => {
  const index = hotSpots.value.findIndex(item => {
    return item.id === fullViewStore.currentHotId
  })
  hotSpots.value.splice(index, 1)
  fullViewStore.currentHotId = ''
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
  if(currentScene.value) {
    console.log("🚀 ~ file: Index.vue:224 ~ init ~ currentScene.value", currentScene.value)
    initCamera(currentScene.value.cameraPos);
    await fullView.initContent(currentScene.value.url)
    setFullViewParams(currentScene.value.params)
  }
  fullView.render();
  isLoading.value = false;
}

const changeHandle = (v, key) => {
  switch (key) {
    case 'horizontal':
      fullView?.minAzimuthAngle.set(v[0])
      fullView?.maxAzimuthAngle.set(v[1])
      break;
    case 'vertical':
      fullView?.minPolarAngle.set(v[0])
      fullView?.maxPolarAngle.set(v[1])
      break;
    // case 'fov':
    //   fullView.minFov.set(v[0])
    //   fullView.maxFov.set(v[1])
    //   break;
    default:
      break;
  }
}
// 设置当前视觉
const setCameraPosHandle = () => {
  currentScene.value.cameraPos = lodash.cloneDeep(fullView.camera.position);
  // 获取水平角度
  currentScene.value.angleX = fullView.controls.getAzimuthalAngle() * 180 / Math.PI;
  currentScene.value.params.fov = fullView.camera.fov
  createThumbnail()
}
// 切换左侧菜单
const changeMenu = (item) => {
  activeName.value = item.value;
  router.push({
    name: item.value
  })
}

//删除场景
const delScene = (index) => {
  fullViewStore.scenes.splice(index, 1)
  const currentScenesId = fullViewStore.scenes[index]?.id || fullViewStore.scenes[index-1]?.id || ''
  currentScenesId && (changeSceneHandle(currentScenesId))
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
  return fullViewStore.sandTable?.markers?.find(item => {
    return item.sceneId === sceneId
  })

}
// 切换场景
const changeSceneHandle = async (sceneId) => {
  fullViewStore.currentScenesId = sceneId

  if (route.name === 'sandTable') {
    fullViewStore.currentMarkerId = findSandMarkerIndex(sceneId)?.id
  }

  // 选中的热点置空
  fullViewStore.currentHotId = ''
  // TODO:当前的场景重新渲染 + 生成缩略图
  const cameraPos = currentScene.value.cameraPos;
  initCamera(cameraPos)
  await fullView.initContent(currentScene.value.url)

  setFullViewParams(currentScene.value.params)

  fullView.render()

  createThumbnail();
}

const setFullViewParams = (params) => {
  fullView.camera.fov = params.fov;
  fullView.minFov = params.fovRange?.[0];
  fullView.maxFov = params.fovRange?.[1];
  fullView.minAzimuthAngle.set(params.azimuthAngleRange?.[0] || -180)
  fullView.maxAzimuthAngle.set(params.azimuthAngleRange?.[1] || 180)
  fullView.minPolarAngle.set(params.polarAngleRange?.[0] || -90)
  fullView.maxPolarAngle.set(params.polarAngleRange?.[1] || 90)
}

watch(() => currentScene.value?.params?.fovRange[0], (val) => {
  if(fullView) {
    fullView.minFov = val
    fullView.camera.fov = val
    fullView.render()
  }
})
watch(() => currentScene.value?.params?.fovRange[1], (val) => {
  if(fullView) {
    fullView.maxFov = val
    fullView.camera.fov = val
    fullView.render()
  }
})
watch(() => currentScene.value?.params?.fov, (val) => {
  if(fullView) {
    fullView.camera.fov = val
    fullView.render()
  }
})


const clickPointHandle = (item) => {
  fullViewStore.currentHotId = item.id;
}

const exportAction = () => {
  // console.log('exportAction doc.value:', JSON.stringify(fullViewStore.value))
}

const initCamera = (cameraPos) => {
  // 相机位置
  // important:通过参数更新相机位置，必须调用controls的update才会生效
  fullView.camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
  fullView.controls.update()
}
// 沙盘数据修改
const changeSandTableHandle = (data) => {
  fullViewStore.sandTable = data;
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
    if (fullViewStore.currentMarkerId !== item.id) {
      fullViewStore.currentMarkerId = item.i;
      // 切换场景
      changeSceneHandle(item.sceneId);
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


    // doc.value.sandTable.markers[index].angle = angle;

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
  currentScene.value.cameraPos = { x, y, z }
  fullView.controls.update();
}

const changeMarkerIndexHandle = (item) => {
  //  切换场景
  changeSceneHandle(item.sceneId)
}

const onExportModeClick = ()=> {
      if (typeof Blob !== 'function') {
        this.$msgbox({
          type: 'error',
          message: '浏览器不支持 Blob 请更新浏览器'
        });
        return;
      }

      (async() => {
        try {
          const exportObj = {
            id: fullViewStore.id,
            name: fullViewStore.name,
            scenes: lodash.cloneDeep(fullViewStore.scenes),
            sandTable: lodash.cloneDeep(fullViewStore.sandTable)
          }
          progress.value = 2;
          exportLoading.value = true;

          const assetsUrl = []
          function addAssets(data) {
            if(!assetsUrl.some(item => {item.data === data.data})) {
              assetsUrl.push(data)
            }
          }
          // 获取资源id
          exportObj.scenes?.forEach(scene => {
            const sceneUrlId = randomString()
            const sceneUrl = `${sceneUrlId}.${scene.url.split('.')?.[1]}`
            addAssets({
              fileID: sceneUrl,
              data: scene.url
            })
            scene.url = sceneUrl
            scene?.hotSpots?.forEach(hotSpot => {
              const hotUrlId = randomString()
              const hotUrl = `${hotUrlId}.${hotSpot.iconPath.split('.')?.[1]}`
              addAssets({
                fileID: hotUrl,
                data: hotSpot.iconPath
              })
              hotSpot.iconPath = hotUrl
            })
          })

          progress.value = 23;
          const sandTableUrlId = randomString()
          const sandTableUrl = `${sandTableUrlId}.${exportObj.sandTable.url.split('.')?.[1]}`
          addAssets({
            fileID: sandTableUrl,
            data: exportObj.sandTable.url
          })
          exportObj.sandTable.url = sandTableUrl
          progress.value = 30;
          // 生成的压缩包 blob
          const blob = await generatePackage(exportObj, assetsUrl);

          progress.value = 99;

          // 生成链接
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `全景.zip`;
          // 模拟点击下载
          link.click();
        } catch (e) {
          console.error(e);
        } finally {
          exportLoading.value = false;
          progress.value = 0;
        }
      })();
    }
onMounted(() => {
  activeName.value = route.name;
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


      if (!fullViewStore.currentMarkerId) return
      currentMarker.value.angle += (angleX - currentScene.value.angleX)
      currentMarker.value.angle = currentMarker.value.angle % 360;
      currentScene.value.angleX = angleX
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
      &:hover {
        .scene-item__del {
          display: flex;
        }
      }
      &__del {
        position: absolute;
        right: 0;
        top: 0;
        color: #fff;
        border-radius: 50%;
        background-color: #00000088;
        width: 20px;
        height: 20px;
        font-size: 10px;
        @include flex(center, center);
        display: none;
        &:hover {
          color: skyblue
        }
      }

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

