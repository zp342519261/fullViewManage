<template>
  <el-form ref="form" :model="sizeForm" label-width="auto" :size="size">
    <el-form-item label="场景名称">
      <el-input v-model="sceneForm.name" />
    </el-form-item>
    <el-form-item label="场景图片">
      <!-- <el-upload action="#" ref="uploadRef" accept="image/*" :on-change="changeHandle" list-type="picture-card"
        :auto-upload="false" :limit="1">
        <el-icon>
          <Plus />
        </el-icon>
      </el-upload> -->
      <el-input v-model="sceneForm.url" />
    </el-form-item>
  </el-form>

  <div>
    <el-button @click="cancel">取消</el-button>
    <el-button @click="confirm">确认</el-button>
  </div>
  <el-dialog v-model="dialogVisible" width="80vw">
    <img w-full style="width: 100%" :src="dialogImageUrl" alt="Preview Image" />
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({})
const emit = defineEmits(["change", 'cancel'])

const sceneForm = ref({
  name: '',
  url: '/3d/images/scene.jpeg'
})
const dialogImageUrl = ref('')
const dialogVisible = ref(false)
const disabled = ref(false)

const changeHandle = (uploadFile) => {
  console.log("🚀 ~ file: addScene.vue:35 ~ changeHandle ~ uploadFile", uploadFile)
  sceneForm.value.url = uploadFile.url
}
const handleRemove = (file) => {
  console.log(file)
}
const confirm = () => {
  emit('change', sceneForm.value)
}
const cancel = () => {
  emit('cancel')
}
const handlePictureCardPreview = (file) => {
  dialogImageUrl.value = file.url
  dialogVisible.value = true
}


</script>

<style lang='scss' scoped>

</style>
