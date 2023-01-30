import html2canvas from "html2canvas";
import {
  TextureLoader
} from 'three'
export const menuNav = [{
    label: '基础',
    value: 'basic',
  },
  {
    label: '视角',
    value: 'view',
  },
  {
    label: '热点',
    value: 'hot',
  },
  {
    label: '沙盘',
    value: 'sandTable',
  }
]
/**生成略缩图 */
export const thumbnail = (dom, thumbnailDom) => {
  html2canvas(dom, {
    useCORS: true,
    allowTaint: false,
  }).then(canvas => {
    thumbnailDom.innerHTML = ''
    thumbnailDom.appendChild(canvas);
  })
}
/**图片资源加载 */
export const textureLoaderHandle = (url) => {
  return new Promise((resolve) => {
    const pointTexture = new TextureLoader().load(url, () => {
      resolve(pointTexture)
    });
  })
}
/**角度转弧度*/
export const degToRad = (deg) => {
  return Math.PI / 180 * deg
}
// 计算Sprite的缩放
// https://segmentfault.com/a/1190000041644858
// TODO: 这里还需要计算一个tan(fov/2)的值，默认90为1
export const calcSpriteScale = (icon, fov = 90, container) =>{
  //  LScaleY = PX * (2 * tan(fov / 2)) / canvasHeight // (高度)
  //  PX = L/(2*tan(fov/2))*canvasHeight => LScaleX =px* 2*tan(fov/2) / canvasHeight
  const scaleY = icon.iconSize * 2 * Math.tan(fov / 2 * Math.PI / 180) / container.clientHeight
  const scaleX = icon.iconSize * 2 * Math.tan(fov / 2 * Math.PI / 180) / container.clientHeight
  console.log('calcSpriteScale:', scaleX, scaleY)
  return {scaleX, scaleY}
}