<template>
  <el-dialog width="600px" v-model="_visible" :overlay-opacity="0.8" title="选择场景" @close="closeHandle">
    <el-card>
      <div class="wrapper">
        <div class="scene-lit">
          <template v-for="(item, index) in doc.scenes">
            <div class="scene-item" :key="index" v-if="!checked.includes(item.id)"
              :class="{ 'is-active': selectedItem.id === item.id }" @click="clickItemHandle(item)">
              <div class="scene-item__img">
                <img :src="item.url" alt="">
              </div>
              <div class="scene-item__name">
                {{ item.name }}
              </div>
            </div>
          </template>
        </div>


      </div>
      <el-button @click="sureAction">
        确定
      </el-button>
    </el-card>
  </el-dialog>
</template>


<script>
export default {
  name: 'scene-dlg',
  props: {
    visible: {
      type: Boolean
    },
    doc: {
      type: Object,
      default: () => {
        return {
          scenes: []
        }
      }
    },
    sceneId: {
      type: String,
    },
    checked: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      selectedItem: {}
    }
  },
  computed: {
    _visible: {
      get() {
        return this.visible
      },
      set() {
        this.visible = this._visible
      }
    }
  },
  methods: {
    closeHandle() {
      console.log('closeHandle');
      this.$emit('close')
    },
    clickItemHandle(item) {
      this.selectedItem = item;
    },
    sureAction() {
      this.$emit('sure', this.selectedItem)
    }
  },
  created() {
    if (this.sceneId) {
      this.selectedItem = this.doc.scenes.find(item => {
        return item.id === this.sceneId
      })
    }
  }
}
</script>


<style scoped lang="scss">
.scene-lit {
  @include flex()
}

.scene-item {
  width: 80px;
  margin-right: 10px;
  cursor: pointer;


  &.is-active {
    .scene-item__img {
      border: 2px solid $--color-primary
    }
  }

  &__img {
    height: 80px;
    border: 2px solid transparent;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__name {
    text-align: center;
  }
}

.wrapper {
  padding: 20px;
}
</style>
