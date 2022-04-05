uniform float uTime;
varying float vElevation;

#pragma glslify: getElevation = require('../partials/getElevation.glsl')

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float elevation = getElevation(modelPosition.xz + vec2(uTime * 0.03, uTime * 0.1));

    modelPosition.y += elevation;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;
    gl_Position = projectionPosition;

    //Varyings
    vElevation = elevation;
}
