import html2canvas from "html2canvas";
import JSZip from 'jszip';

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
export const iconTypes = [{
    label: '系统图标',
    value: 'sys'
  },
  {
    label: '自定义图标',
    value: 'custom'
  }
]
export const hotTypes = [{
    label: '全景切换',
    value: 'scene'
  },
  {
    label: '超链接',
    value: 'link'
  },
  {
    label: '图片热点',
    value: 'img'
  },
  {
    label: '视频热点',
    value: 'video'
  },
  {
    label: '图文热点',
    value: 'list'
  },
  {
    label: '环物热点',
    value: 'around'
  },
  {
    label: '文章热点',
    value: 'article'
  }
]
export const sysIcons = [{
    key: 'forward',
    url: 'img/new_spotd1_gif.png',
    spriteUrl: 'img/arrow1.png',
    gif: true,
    "texture": {
      "horizontalNum": 1,
      "verticalNum": 25,
      "numTiles": 25,
      "duration": 50
    },
  },
  {
    key: 'left',
    url: 'img/new_spotd2_gif.png',
    spriteUrl: 'img/arrow2.png',
    gif: true,
    "texture": {
      "horizontalNum": 1,
      "verticalNum": 25,
      "numTiles": 25,
      "duration": 50
    },
  },
  {
    url: 'img/new_spotd1.png',
    spriteUrl: 'img/new_spotd1.png',
    gif: false
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
export const calcSpriteScale = (icon, fov = 90, container) => {
  //  LScaleY = PX * (2 * tan(fov / 2)) / canvasHeight // (高度)
  //  PX = L/(2*tan(fov/2))*canvasHeight => LScaleX =px* 2*tan(fov/2) / canvasHeight
  const scaleY = icon.iconSize * 2 * Math.tan(fov / 2 * Math.PI / 180) / container.clientHeight
  const scaleX = icon.iconSize * 2 * Math.tan(fov / 2 * Math.PI / 180) / container.clientHeight
  console.log('calcSpriteScale:', scaleX, scaleY)
  return {
    scaleX,
    scaleY
  }
}

export function getBase64Image(imgUrl) {
  const img = new Image();
  img.src = imgUrl;

  return new Promise((resolve) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;

      canvas.height = img.height;

      const ctx = canvas.getContext("2d");

      ctx.drawImage(img, 0, 0, img.width, img.height);

      const dataURL = canvas.toDataURL();

      resolve(dataURL);
    }
  })

}

/**
 * 生成压缩包
 * 数据放在 data.json ， 资源类文件都放在 assets 文件夹下
 * @param {string} dataJson templet字符串
 * @param {Assets[]} assets 资源数组
 * @param {OtherAssets[]=} others 其他文件，这些文件将放在根目录下
 * @return {Promise<Blob>} 压缩包的Blob
 */
export async function generatePackage(dataJson, assets) {
  const zip = new JSZip();

  zip.file('index.json', JSON.stringify(dataJson));

  if (assets) {
    const assetsFolder = zip.folder('assets');
    for (const item of assets) {
      const dataURL =await getBase64Image(item.data)
      assetsFolder.file(item.fileID, dataURL.split(',')?.[1], {
        base64: true
      });
    }
  }

  const result = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 1
    }
  });

  return result;
}