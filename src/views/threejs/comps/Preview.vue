<template>
  <div class="preview-wrapper" ref="$el">
    <!--      <v-card-title>作品预览</v-card-title>-->
    <div id="preview">
    </div>
    <div class="hot-point__list" :key="uniqueId">
      <div class="hot-point__item" v-for="(item, index) in hotPointList" :key="index" :style="hotLabelStyleArr[index]">
        <!--场景说明-->
        <div class="item__label" @click="pointLabelClickHandle(item)">
          {{ lodash.get(item, 'title.label') }}
        </div>
      </div>
    </div>

    <!--场景列表-->
    <div class="scene-list">
      <div class="scene-item" :class="{ 'is-active': index === activeIndex }" v-for="(item, index) in doc.scenes"
        :key="index" @click="changeSceneHandle(item, index)">
        <div class="scene-item__thumbnail">
          <img :src="item.url">
        </div>
        <div class="scene-item__label">
          {{ item.name }}
        </div>
      </div>
    </div>
    <!--  沙盘  -->
    <!--    <div class="sand-table">-->
    <!--      <div class="point"-->
    <!--           @mousedown="sandMouseDownHandle"-->
    <!--           :style="{transform:`rotate(${rotate}deg)`}">-->
    <!--        <div class="circle"></div>-->
    <!--        <div class="img">-->
    <!--          <img src="img/sand.png">-->
    <!--        </div>-->

    <!--      </div>-->
    <!--    </div>-->
    <div class="sand-table-box">
      <div class="marker-list">
        <div class="img">
          <img :src="doc.sandTable.url" draggable="false">
        </div>
        <div class="marker-item" v-for="(item, index) in doc.sandTable.markers" :key="index"
          :class="{ 'is-active': activeMarkerIndex === index }"
          :style="{ left: item.pos.x + 'px', top: item.pos.y + 'px' }" @click="markerClickHandle(index, item)">
          <div class="marker-item__outline">
            <div class="marker-item__circle" :style="{ transform: `rotate(${item.angle}deg)` }">
              <div class="marker-item__point" @mousedown.stop.prevent="pointMouseDownHandle($event, item, index)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'preview-dlg'
}
</script>
<script setup>
import { ref,computed, onMounted, onUnmounted, nextTick } from 'vue'
import lodash from 'lodash'
import * as THREE from 'three'
import {pointInSceneView, worldVector2Screen, TextureAnimator} from '../common.js'
import docJSON from '/public/json/doc.json'
import { textureLoaderHandle, calcSpriteScale } from '../config'
import fullViewClass from '../fullView';
// import {randomString} from '@/assets/js/utils.js'
import gsap from 'gsap';
let fullView
const props = defineProps({
  doc: {
    type: Object,
    default: () => {
      return docJSON
    }
  },
});

const $el = ref()
// 热点
let poiObjects = []
// 热点原始数据
const hotPointList = ref([])
const uniqueId = ref('')
const activeIndex = ref(0)
const needUpdate = ref([])
const hotLabelStyleArr = ref([])
const rotate = ref(0)
const targetPosition = ref(new THREE.Vector3(0, 0, 0))
const activeMarkerIndex = ref(0)
const clock = ref()
const timer = ref(null)
const transformStyle = computed(()=> {
  return (point, item) => {
    let pos = worldVector2Screen({
      x: point.x,
      y: point.y,
      z: point.z
    }, fullView.container, fullView.camera);

    console.log('transformStyle pos:', pos)
    const visible = pointInSceneView(point, fullView.camera)
    return {
      transform: `translateZ(0px) translate(${pos.x}px,${pos.y}px) translate(-${item.iconSize / 2}px,-${item.iconSize / 2}px)`,
      width: item.iconSize + 'px',
      height: item.iconSize + 'px',
      opacity: visible ? 1 : 0
    }
  }
})
    const hotLabelStyles = ()=> {
      const arr = [];
      hotPointList.value.forEach(item => {
        const visible = pointInSceneView(item.pos, fullView.camera)
        console.log('hotLabelStyles visible：', visible)
        if (visible) {
          let pos = worldVector2Screen({
            x: item.pos.x,
            y: item.pos.y,
            z: item.pos.z
          }, fullView.container, fullView.camera);
          arr.push({
            transform: `translateZ(0px) translate(${pos.x}px,${pos.y}px) translate(-${item.iconSize / 2}px,-${item.iconSize / 2}px)`,
            width: item.iconSize + 'px',
            height: item.iconSize + 'px',
            visibility: 'visible'
          })
        } else {
          arr.push({
            width: item.iconSize + 'px',
            height: item.iconSize + 'px',
            visibility: 'hidden',
            transform: `translateZ(0px) translate(-999999px,-999999px) translate(-${item.iconSize / 2}px,-${item.iconSize / 2}px)`,
          })
        }

      })
      hotLabelStyleArr.value = arr;
    }
    // 角度转弧度
    const degToRad = (deg) =>{
      return Math.PI / 180 * deg
    }
    // 通过场景Id在沙盘点位列表中，寻找沙盘点位
    const findSandTableMarker = (sceneId)=> {
      const markers = props.doc.sandTable.markers;
      const index = markers.findIndex(item => {
        return item.sceneId === sceneId
      })
      return index
    }
    /**
     *
     *  切换场景
     *  @param data 场景数据对象
     *  @param index 当前场景的索引值
     *
     */
    const changeSceneHandle = async (data, index) => {
      if (activeIndex.value === index) return
      activeIndex.value = index;
      activeMarkerIndex.value =findSandTableMarker(data.id)
      // 清空场景的元素（热点）
      fullView.scene.children = fullView.scene.children.filter(item => {
        return item.type !== 'Sprite'
      })

      hotPointList.value = []
      if (data.sphere) {
        data.sphere.opacity = 0;
        data.sphere.transparent = true;
        fullView.sphere.material = data.sphere;
      } else {
        await fullView.initContent(data.url)
      }

      gsap.to(data.sphere, {
        transparent: false,
        opacity: 1,
        duration: 1.5,
        onComplete: async () => {
          // 重新渲染热点
          poiObjects = await renderPointList(fullView.scene, data.hotSpots);
          hotLabelStyles()
        }
      });
      // 相机位置
      const cameraPos = data.cameraPos;
      fullView.camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
      setFullViewParams(data.params)
      // 更新摄像机投影矩阵。在任何参数被改变以后必须被调用
      fullView.camera.updateProjectionMatrix();
      // important:通过参数更新相机位置，必须调用controls的update才会生效
      fullView.controls.update();
    }

    /** 渲染热点
     * @param scene:场景
     * @param item: 热点对象
     */
    const renderHotPoint=async(scene, item) =>{
      const pointTexture = await textureLoaderHandle(item.iconPath)
      let annie = null
      if (item.gif) {
        annie = new TextureAnimator(
            pointTexture,
            item.texture.horizontalNum,
            item.texture.verticalNum,
            item.texture.numTiles,
            item.texture.duration)
      }
      const material = new THREE.SpriteMaterial(
          {
            map: pointTexture,
            // 关闭大小跟随相机距离变化的特性
            sizeAttenuation: !!item.sizeAttenuation,
          });
      material.rotation = degToRad(0)
      const sprite = new THREE.Sprite(material);
      const {scaleX, scaleY} = calcSpriteScale(item, fullView.camera.fov, fullView.container)
      sprite.scale.set(scaleX, scaleY);

      // 位置信息
      const position = item.pos
      sprite.position.set(position.x, position.y, position.z)
      sprite.detail = item
      fullView.scene.add(sprite);
      return {sprite, annie}
    }
    // 渲染热点列表(点击范围)
    const  renderPointList = async(scene, hotPoints) =>{
      hotPointList.value = hotPoints;
      let poiObjects = [];
      let _needUpdate = [];
      for (let i = 0; i < hotPoints.length; i++) {
        const item = hotPoints[i];
        const {sprite, annie} = await renderHotPoint(scene, item)
        poiObjects.push(sprite);
        if (annie) {
          _needUpdate.push(annie)
        }
      }
      needUpdate.value = _needUpdate;
      return poiObjects
    }
    // 寻找目标场景
    const findTargetScene = (id)=>{
      let i = -1;
      const target = props.doc.scenes.find((item, index) => {
        if (item.id === id) {
          i = index;
        }
        return item.id === id
      })
      return {scene: target, index: i}
    }

    const initCamera = (data)=> {
      fullView.camera.position.set(data.cameraPos.x, data.cameraPos.y, data.cameraPos.z)
      fullView.camera.fov = data.params.fov
    }

    const  init =async (data = props.doc.scenes[0]) =>{
      clock.value = new THREE.Clock();
      const container = document.getElementById('preview');
      fullView = new fullViewClass(container)
      rotate.value = lodash.get(props.doc, 'sandTable.markers[0].angle') || 0;
      initCamera(data);
      fullView.controls.update()
      fullView.render()

      // 等待内容渲染完成，才去渲染热点
      fullView.initContent(data.url)
      fullView.onMouseWheelCb = hotLabelStyles
      setFullViewParams(data.params)
      // 渲染热点
      const points = data.hotSpots
      poiObjects = await renderPointList(fullView.scene, points)
      // ??:解决热点文字显示隐藏问题，问题暂时未定位出来
      setTimeout(() => {
        hotLabelStyles();
      })

      render();

      fullView.controls.addEventListener('change', () => {
        console.log('getAzimuthalAngle ():', fullView.controls.getAzimuthalAngle() * 180 / Math.PI)
        const angleX = fullView.controls.getAzimuthalAngle() * 180 / Math.PI;
        rotate.value = angleX;

        // TODO:这里待优化
        const marker = props.doc.sandTable.markers[activeMarkerIndex.value];
        if (marker) {
          const {scene} = findTargetScene(marker.sceneId);
          marker.angle += (angleX - scene.angleX);
          marker.angle = marker.angle % 360;
          scene.angleX = angleX
        }


        hotLabelStyles();
      });
    }
    const render = () => {
      fullView.renderer.render(fullView.scene, fullView.camera);
      updateHandle()
      timer.value = requestAnimationFrame(render);
    }
    // 点击热点的文字说明
    const  pointLabelClickHandle = async(detail)=> {
      switch (detail.hotType) {
        case 'scene': {
          // 切换场景
          const {scene, index} = findTargetScene(detail.value);
          if (scene) {
            changeSceneHandle(scene, index)
          }
        }
          break;
        default:
          break;
      }
    }
    // 点击热点回调
    const  pointClickHandle = async(event)=>{
      event.preventDefault();
      // 光线投射Raycaster
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      // https://www.it1352.com/1990090.html
      // 鼠标坐标问题
      const canvasPos = fullView.container.getBoundingClientRect();
      const mouseX = event.clientX - canvasPos.left;
      const mouseY = event.clientY - canvasPos.top;
      mouse.x = (mouseX / fullView.container.clientWidth) * 2 - 1;
      mouse.y = -(mouseY / fullView.container.clientHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, fullView.camera)

      const intersects = raycaster.intersectObjects(poiObjects);

      console.log('intersects:', intersects);

      if (intersects.length > 0) {
        console.log('点击了热点', intersects[0])
        const detail = intersects[0].object.detail;

        pointLabelClickHandle(detail)
      }
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
    const resizeHandle = ()=> {
      const width = fullView.container.clientWidth;
      const height = fullView.container.clientHeight;
      fullView.renderer.setSize(width, height);
      //窗口宽高比
      fullView.camera.aspect = width / height;
      fullView.camera.updateProjectionMatrix();
      // uniqueId.value = randomString();
      hotLabelStyles()
    }
    const updateHandle = () =>{
      const delta = clock.value.getDelta();
      needUpdate.value.forEach(item => {
        item.update(1000 * delta);
      })
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
      fullView.controls.update();
      return {x, y, z}
    }
    // const sandMouseDownHandle = () =>{
    //   const dom = this.$el.querySelector('.point');
    //   const domRect = dom.getBoundingClientRect();
    //   const centerPos = {
    //     x: domRect.width / 2 + domRect.x,
    //     y: domRect.height / 2 + domRect.y,
    //   }
    //   let mouseMove = (e) => {
    //     const curMouse = {
    //       x: e.clientX,
    //       y: e.clientY,
    //     }
    //     // https://blog.csdn.net/wjlhanhan/article/details/109668342
    //     const radians = Math.atan2(curMouse.x - centerPos.x, curMouse.y - centerPos.y);
    //     let angle = (radians * (180 / Math.PI) * -1) + 180
    //     // 沙盘旋转角度转化到相机
    //     this.rotate2cameraPos(angle)
    //   }

    //   let mouseUp = () => {
    //     console.log('mouseUp')
    //     document.body.removeEventListener('mousemove', mouseMove)
    //     document.body.removeEventListener('mouseup', mouseUp)
    //   }

    //   document.body.addEventListener('mousemove', mouseMove)
    //   document.body.addEventListener('mouseup', mouseUp)
    // }
    const markerClickHandle = (i, item)=> {
      if (activeMarkerIndex.value === i) {
        return
      }
      // this.activeMarkerIndex = i;
      const {scene, index} = findTargetScene(item.sceneId);
      changeSceneHandle(scene, index);
    }
    // 沙盘上的点移动
    const pointMouseDownHandle = (e, item, index)=> {
      const nodeList = $el.value.querySelectorAll('.marker-item');
      const dom = nodeList[index].querySelector('.marker-item__outline');
      const domRect = dom.getBoundingClientRect();

      const centerPos = {
        x: domRect.width / 2 + domRect.x,
        y: domRect.height / 2 + domRect.y,
      }
      let mouseMove = (e) => {
        e.preventDefault()
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
        rotate2cameraPos(angle);

      }

      let mouseUp = () => {
        console.log('mouseUp')
        document.body.removeEventListener('mousemove', mouseMove)
        document.body.removeEventListener('mouseup', mouseUp)
      }

      document.body.addEventListener('mousemove', mouseMove)
      document.body.addEventListener('mouseup', mouseUp)

    }
  onMounted(()=> {
    nextTick(async () => {
      await init();
      fullView.container.addEventListener('click', pointClickHandle, false)
      window.addEventListener('resize', resizeHandle)
    })
  })
  onUnmounted(() =>{
    cancelAnimationFrame(timer.value)
  })
</script>

<style scoped lang="scss">
.preview-dlg {
  #preview {
    height: 400px;
  }
}

.preview-wrapper {
  position: relative;
  overflow: hidden;
}

#preview {
  width: 100%;
  min-height: 80vh;
}

.hot-point__list {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  user-select: none;
  pointer-events: none;
}

.hot-point__item {
  position: absolute;
  visibility: hidden;

  .item__label {
    pointer-events: auto;
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
    padding: 10px;
    border-radius: 5px;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
    word-break: keep-all;
    cursor: pointer;
  }
}

.scene-list {
  position: absolute;
  width: 100%;
  bottom: 20px;
  left: 50%;
  transform: translate(-50%, 0);
  @include flex(center);
  background-color: rgba(0, 0, 0, 0.3);
}

.scene-item {
  position: relative;
  width: 60px;
  height: 60px;
  margin-right: 15px;
  border: 2px solid #fff;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__thumbnail {
    height: 100%;
  }

  &__label {
    position: absolute;
    bottom: 0;
    width: 100%;
    padding: 3px;
    left: 0;
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
    text-align: center;
  }

  &.is-active {
    border-color: $--color-primary;
  }
}

.sand-table {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 200px;
  height: 200px;
  border: 1px solid orange;
  @include flex(center, center);

  .point {
    width: 128px;
    height: 128px;
    //@include flex(center, center);
    position: relative;
    //border: 1px solid orange;

    .img {
      @include flex(center, center);

      img {
        width: 64px;
        height: 64px;
        -webkit-user-drag: none;
      }
    }

    .circle {
      width: 20px;
      height: 20px;
      background-color: red;
      border-radius: 50%;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
    }
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
    user-drag: none;
    -webkit-user-drag: none;
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
