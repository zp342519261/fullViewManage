import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  MeshBasicMaterial,
  Mesh,
  SphereGeometry
} from 'three'
import {
  OrbitControls
} from 'three/examples/jsm/controls/OrbitControls'
import {
  textureLoaderHandle
} from './config'
export default class fullView {
  constructor(container) {
    /**创建场景 */
    this.scene = new Scene();

    /**创建渲染器 */
    this.renderer = new WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(this.renderer.domElement)

    this.container = container

    /**创建相机 */
    this.camera = new PerspectiveCamera(90, container.width / container.height, 0.1, 100);
    this.camera.aspect = container.clientWidth / container.clientHeight
    this.camera.position.set(0, 0, 0)

    /**最小和最大视角 */
    this.minFov = 0.1
    /**最小和最大视角 */
    this.maxFov = 180
    const that = this

    /**水平视角限制 */
    this.minAzimuthAngle = {
      get() {
        return this.value
      },
      value: -Infinity,
      set(val) {
        this.value = val
        if (that.controls) {
          if (val == -180 && that.maxAzimuthAngle.value == 180) {
            that.controls.minAzimuthAngle = -Infinity
          } else {
            that.controls.maxAzimuthAngle = Math.PI * that.maxAzimuthAngle.value / 180
            that.controls.minAzimuthAngle = Math.PI * val / 180
          }
        }
      }
    }; // radians
    /**水平视角限制 */
    this.maxAzimuthAngle = {
      get() {
        return this.value
      },
      value: Infinity,
      set(val) {
        this.value = val
        if (that.controls) {
          if (val == 180 && that.minAzimuthAngle.value == -180) {
            that.controls.maxAzimuthAngle = Infinity
          } else {
            that.controls.minAzimuthAngle = Math.PI * that.minAzimuthAngle.value / 180
            that.controls.maxAzimuthAngle = Math.PI * val / 180
          }
        }
      }
    }; // radians

    /**垂直视角限制 */
    this.minPolarAngle = {
      get() {
        return this.value
      },
      value: 0,
      set(val) {
        this.value = val
        if (that.controls) {
          that.controls.minPolarAngle = Math.PI * (val + 90) / 180
        }
      }
    }; // radians
    /**垂直视角限制 */
    this.maxPolarAngle = {
      get() {
        return this.value
      },
      value: Math.PI,
      set(val) {
        this.value = val
        if (that.controls) {
          that.controls.maxPolarAngle = Math.PI * (val + 90) / 180
        }
      }
    }; // radians

    /**创建控制器 */
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableZoom = false
    this.renderer.domElement.addEventListener('wheel', this.onMouseWheel.bind(this), {
      passive: false
    });
    this.render()
  }

  onMouseWheel(event) {
    console.log("🚀 ~ file: fullView.js:46 ~ fullView ~ onMouseWheel ~ event", event)
    event.preventDefault();
    if (event.deltaY < 0 && this.camera.fov > this.minFov) {
      this.camera.fov--;
    } else if (event.deltaY > 0 && this.camera.fov < this.maxFov) {
      this.camera.fov++;
    }
    this.controls.update()
    console.log("🚀 ~ file: fullView.js:52 ~ fullView ~ onMouseWheel ~ this.camera.fov", this.camera.fov, this.minFov, this.maxFov)
    this.render()
  }
  async initContent(url) {
    console.log("🚀 ~ file: fullView.js:125 ~ fullView ~ initContent ~ url", url,this.contentTextureUrl)
    if (url !== this.contentTextureUrl) {
      this.contentTextureUrl = url
      const texture = await textureLoaderHandle(url)
      const sphereMaterial = new MeshBasicMaterial({
        map: texture,
        // transparent: true,
        // opacity: 0,
      });
      if (this.sphere) {
        this.sphere.material = sphereMaterial
        console.log("🚀 ~ file: fullView.js:134 ~ fullView ~ initContent ~ sphereMaterial", sphereMaterial)
      } else {
        const sphereGeometry = new SphereGeometry(1, 50, 50);
        // 贴图内翻
        sphereGeometry.scale(1, 1, -1);
        this.sphere = new Mesh(sphereGeometry, sphereMaterial);
        this.scene.add(this.sphere)
      }
    }
  }
  resizeHandle() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.renderer?.setSize(width, height);
    //窗口宽高比
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  render() {
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera)
  }
}