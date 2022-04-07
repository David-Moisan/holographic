import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { BokehPass } from './passes/BokehPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import Guify from 'guify'

//Import shaders
import terrainVertexShader from './shaders/terrain/vertex.glsl'
import terrainFragmentShader from './shaders/terrain/fragment.glsl'
import terrainDepthVertexShader from './shaders/terrainDepth/vertex.glsl'
import terrainDepthFragmentShader from './shaders/terrainDepth/fragment.glsl'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//GUI
const gui = new Guify({
   align: 'right',
   theme: 'dark',
   width: '300',
   barMode: 'none',
})

const guiDummy = {}
//test: #130b4a
guiDummy.clearColor = '#080024'

/**
 * Sizes
 */
const sizes = {
   width: window.innerWidth,
   height: window.innerHeight,
   pixelRatio: Math.min(window.devicePixelRatio, 2),
}

window.addEventListener('resize', () => {
   // Update sizes
   sizes.width = window.innerWidth
   sizes.height = window.innerHeight
   sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

   // Update camera
   camera.aspect = sizes.width / sizes.height
   camera.updateProjectionMatrix()

   // Update renderer
   renderer.setSize(sizes.width, sizes.height)
   renderer.setPixelRatio(sizes.pixelRatio)

   // Update effect composer
   effectComposer.setSize(sizes.width, sizes.height)
   effectComposer.setPixelRatio(sizes.pixelRatio)

   // Update passes
   bokehPass.renderTargetDepth.width = sizes.width * sizes.pixelRatio
   bokehPass.renderTargetDepth.height = sizes.height * sizes.pixelRatio
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
   75,
   sizes.width / sizes.height,
   0.1,
   100
)
camera.position.x = 1
camera.position.y = 1
camera.position.z = 0
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Terrain
 */

gui.Register({
   type: 'folder',
   label: 'terrain',
   open: true,
})

const terrain = {}

//Texture
terrain.texture = {}
terrain.texture.linesCount = 5
terrain.texture.bigLineWidth = 0.08
terrain.texture.smallLineWidth = 0.01
terrain.texture.smallLineAlpha = 0.5
terrain.texture.width = 32
terrain.texture.height = 128
terrain.texture.canvas = document.createElement('canvas')
terrain.texture.canvas.width = terrain.texture.width
terrain.texture.canvas.height = terrain.texture.height
terrain.texture.canvas.style.position = 'fixed'
terrain.texture.canvas.style.top = 0
terrain.texture.canvas.style.left = 0
terrain.texture.canvas.style.zIndex = 1
document.body.append(terrain.texture.canvas)
terrain.texture.context = terrain.texture.canvas.getContext('2d')

terrain.texture.instance = new THREE.CanvasTexture(terrain.texture.canvas)
terrain.texture.instance.wrapS = THREE.RepeatWrapping
terrain.texture.instance.wrapT = THREE.RepeatWrapping
terrain.texture.instance.magFilter = THREE.NearestFilter

/**
 * Update terrain texture
 */
terrain.texture.update = () => {
   terrain.texture.context.clearRect(
      0,
      0,
      terrain.texture.width,
      terrain.texture.height
   )

   //Big Line
   const actualBigLineWidth = Math.round(
      terrain.texture.height * terrain.texture.bigLineWidth
   )
   terrain.texture.context.globalAlpha = 1
   //Test with this color: #4ECDC4
   terrain.texture.context.fillStyle = '#ffffff'
   terrain.texture.context.fillRect(
      0,
      0,
      terrain.texture.width,
      actualBigLineWidth
   )

   //Small Lines
   const actualSmallLineWidth = Math.round(
      terrain.texture.height * terrain.texture.smallLineWidth
   )
   const smallLinesCount = terrain.texture.linesCount - 1

   for (let i = 0; i < smallLinesCount; i++) {
      terrain.texture.context.globalAlpha = terrain.texture.smallLineAlpha
      terrain.texture.context.fillStyle = '#00ffff'
      terrain.texture.context.fillRect(
         0,
         actualBigLineWidth +
            Math.round(
               (terrain.texture.height - actualBigLineWidth) /
                  terrain.texture.linesCount
            ) *
               (i + 1),
         terrain.texture.width,
         actualSmallLineWidth
      )
   }

   //Update texture instance
   terrain.texture.instance.needsUpdate = true
}

terrain.texture.update()

//Geometry
terrain.geometry = new THREE.PlaneGeometry(1, 1, 1000, 1000)
terrain.geometry.rotateX(-Math.PI * 0.5)

//Uniforms
terrain.uniforms = {
   uTexture: { value: terrain.texture.instance },
   uElevation: { value: 2 },
   uElevationValey: { value: 0.4 },
   uElevationValleyFrequency: { value: 1.618 },
   uElevationGeneral: { value: 0.335 },
   uElevationGeneralFrequency: { value: 0.48 },
   uElevationDetails: { value: 0.134 },
   uElevationDetailsFrequency: { value: 1.817 },
   uTextureFrequency: { value: 16.26 },
   uTextureOffset: { value: 0.688 },
   uTime: { value: 0 },
   uHslHue: { value: 1.0 },
   uHslHueOffset: { value: 0.0 },
   uHslHueFrequency: { value: 4.0 },
   uHslTimeFrequency: { value: 0.05 },
   uHslLightness: { value: 0.75 },
   uHslLightnessVariation: { value: 0.13 },
   uHslLightnessFrequency: { value: 34.0 },
}

//Debug
gui.Register({
   folder: 'terrain',
   type: 'folder',
   label: 'terrainaterial',
   open: true,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uElevation,
   property: 'value',
   type: 'range',
   label: 'uElevation',
   min: 0,
   max: 5,
   step: 0.001,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uElevationValey,
   property: 'value',
   type: 'range',
   label: 'uElevationValey',
   min: 0,
   max: 1,
   step: 0.001,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uElevationValleyFrequency,
   property: 'value',
   type: 'range',
   label: 'uElevationValleyFrequency',
   min: 0,
   max: 10,
   step: 0.001,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uElevationGeneral,
   property: 'value',
   type: 'range',
   label: 'uElevationGeneral',
   min: 0,
   max: 1,
   step: 0.001,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uElevationGeneralFrequency,
   property: 'value',
   type: 'range',
   label: 'uElevationGeneralFrequency',
   min: 0,
   max: 10,
   step: 0.001,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uElevationDetails,
   property: 'value',
   type: 'range',
   label: 'uElevationDetails',
   min: 0,
   max: 1,
   step: 0.001,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uElevationDetailsFrequency,
   property: 'value',
   type: 'range',
   label: 'uElevationDetailsFrequency',
   min: 0,
   max: 10,
   step: 0.001,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uTextureFrequency,
   property: 'value',
   type: 'range',
   label: 'uTextureFrequency',
   min: 0.01,
   max: 50,
   step: 0.01,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uTextureOffset,
   property: 'value',
   type: 'range',
   label: 'uTextureOffset',
   min: 0,
   max: 1,
   step: 0.001,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uHslHue,
   property: 'value',
   type: 'range',
   label: 'uHslHue',
   min: 0,
   max: 5.0,
   step: 0.001,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uHslHueOffset,
   property: 'value',
   type: 'range',
   label: 'uHslHueOffset',
   min: 0,
   max: 1,
   step: 0.001,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uHslHueFrequency,
   property: 'value',
   type: 'range',
   label: 'uHslHueFrequency',
   min: 0,
   max: 100,
   step: 1,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uHslTimeFrequency,
   property: 'value',
   type: 'range',
   label: 'uHslTimeFrequency',
   min: 0,
   max: 0.2,
   step: 0.001,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uHslLightness,
   property: 'value',
   type: 'range',
   label: 'uHslLightness',
   min: 0,
   max: 1,
   step: 0.001,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uHslLightnessVariation,
   property: 'value',
   type: 'range',
   label: 'uHslLightnessVariation',
   min: 0,
   max: 1,
   step: 0.001,
})

gui.Register({
   folder: 'terrainaterial',
   object: terrain.uniforms.uHslLightnessFrequency,
   property: 'value',
   type: 'range',
   label: 'uHslLightnessFrequency',
   min: 1,
   max: 100,
   step: 0.01,
})

//Material
terrain.material = new THREE.ShaderMaterial({
   transparent: true,
   // blending: THREE.AdditiveBlending,
   side: THREE.DoubleSide,
   vertexShader: terrainVertexShader,
   fragmentShader: terrainFragmentShader,
   uniforms: terrain.uniforms,
})

// Depth material
const uniforms = THREE.UniformsUtils.merge([
   THREE.UniformsLib.common,
   THREE.UniformsLib.displacementmap,
])

// For merge as a same direction of depthMat and mat
for (const uniformKey in terrain.uniforms) {
   uniforms[uniformKey] = terrain.uniforms[uniformKey]
}

terrain.depthMaterial = new THREE.ShaderMaterial({
   uniforms: uniforms,
   vertexShader: terrainDepthVertexShader,
   fragmentShader: terrainDepthFragmentShader,
})

terrain.depthMaterial.depthPacking = THREE.RGBADepthPacking
terrain.depthMaterial.blending = THREE.NoBlending

//Mesh
terrain.mesh = new THREE.Mesh(terrain.geometry, terrain.material)
terrain.mesh.scale.set(10, 10, 10)
terrain.mesh.userData.depthMaterial = terrain.depthMaterial
scene.add(terrain.mesh)

/**
 * Debug
 */
gui.Register({
   folder: 'terrain',
   type: 'folder',
   label: 'terrainTexture',
   open: true,
})

gui.Register({
   folder: 'terrainTexture',
   object: terrain.texture,
   property: 'linesCount',
   type: 'range',
   label: 'linesCount',
   min: 1,
   max: 10,
   step: 1,
   onChange: terrain.texture.update,
})

gui.Register({
   folder: 'terrainTexture',
   object: terrain.texture,
   property: 'bigLineWidth',
   type: 'range',
   label: 'bigLineWidth',
   min: 0,
   max: 0.5,
   step: 0.001,
   onChange: terrain.texture.update,
})

gui.Register({
   folder: 'terrainTexture',
   object: terrain.texture,
   property: 'smallLineWidth',
   type: 'range',
   label: 'smallLineWidth',
   min: 0,
   max: 0.1,
   step: 0.001,
   onChange: terrain.texture.update,
})

gui.Register({
   folder: 'terrainTexture',
   object: terrain.texture,
   property: 'smallLineAlpha',
   type: 'range',
   label: 'smallLineAlpha',
   min: 0,
   max: 1,
   step: 0.01,
   onChange: terrain.texture.update,
})

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
   canvas: canvas,
   // antialias: true,
})
renderer.setClearColor(guiDummy.clearColor, 1)
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

gui.Register({
   type: 'folder',
   label: 'renderer',
   open: true,
})

gui.Register({
   folder: 'renderer',
   object: guiDummy,
   property: 'clearColor',
   type: 'color',
   label: 'clearColor',
   format: 'hex',
   onChange: () => {
      renderer.setClearColor(guiDummy.clearColor, 1)
   },
})

//Effect Composer
const renderTarget = new THREE.WebGLMultipleRenderTargets(800, 600, {
   minFilter: THREE.LinearFilter,
   magFilter: THREE.LinearFilter,
   format: THREE.RGBAFormat,
   encoding: THREE.sRGBEncoding,
})
const effectComposer = new EffectComposer(renderer)
effectComposer.setSize(sizes.width, sizes.height)
effectComposer.setPixelRatio(sizes.pixelRatio)

//Render Pass
const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

//Bokeh Pass
const bokehPass = new BokehPass(scene, camera, {
   focus: 1.0,
   aperture: 0.01,
   maxblur: 0.01,

   width: sizes.width * sizes.pixelRatio,
   height: sizes.height * sizes.pixelRatio,
})

// bokehPass.enabled = false
effectComposer.addPass(bokehPass)

//Debug
gui.Register({
   type: 'folder',
   label: 'bokehPass',
   open: true,
})

gui.Register({
   folder: 'bokehPass',
   object: bokehPass,
   property: 'enabled',
   type: 'checkbox',
   label: 'enabled',
})

gui.Register({
   folder: 'bokehPass',
   object: bokehPass.materialBokeh.uniforms.focus,
   property: 'value',
   type: 'range',
   label: 'focus',
   min: 0,
   max: 10,
   step: 0.01,
})

gui.Register({
   folder: 'bokehPass',
   object: bokehPass.materialBokeh.uniforms.aperture,
   property: 'value',
   type: 'range',
   label: 'aperture',
   min: 0.0002,
   max: 0.1,
   step: 0.0001,
})

gui.Register({
   folder: 'bokehPass',
   object: bokehPass.materialBokeh.uniforms.maxblur,
   property: 'value',
   type: 'range',
   label: 'maxblur',
   min: 0,
   max: 0.02,
   step: 0.0001,
})

/**
 * Animate
 */
const clock = new THREE.Clock()
let lastElapsedTime = 0

const tick = () => {
   const elapsedTime = clock.getElapsedTime()
   const deltaTime = elapsedTime - lastElapsedTime
   lastElapsedTime = elapsedTime

   //Update terrain
   terrain.uniforms.uTime.value = elapsedTime

   // Update controls
   controls.update()

   // Render
   // renderer.render(scene, camera)
   effectComposer.render()

   // Call tick again on the next frame
   window.requestAnimationFrame(tick)
}

tick()
