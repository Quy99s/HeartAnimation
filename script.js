import * as THREE from "https://cdn.skypack.dev/three@0.136.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.136.0/examples/jsm/controls/OrbitControls";

console.clear();

let scene = new THREE.Scene();
scene.background = new THREE.Color(0x160016);
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
//camera.position.set(0, 4, 21);
camera.position.set(-50, 12, 100).setLength(165);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
window.addEventListener("resize", event => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
})

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;

let gu = {
  time: { value: 0 }
}
let sizes = [];
let shift = [];
let speed = [];
let position1 = [];
let position2 = [];


let pushShift = () => {
  shift.push(
    Math.random() * Math.PI,
    Math.random() * Math.PI * 2,
    (Math.random() * 0.9 + 0.1) * Math.PI * 0.1,
    Math.random() * 0.9 + 0.1
  );
}


for (let i = 0; i < 500000; i++) {
  position1.push(new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(100));
  speed.push(Math.random() * 10 + 5);
}


position2 = new Array(50000).fill().map(p => {
  sizes.push(Math.random() * 1.5 + 0.5);
  pushShift();
  return new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * 0.5 + 60);
})

// for (let i = 0; i < 100000; i++) {
//   let r = 10, R = 55;
//   let rand = Math.pow(Math.random(), 1.5);
//   let radius = Math.sqrt(R * R * rand + (1 - rand) * r * r);
//   position2.push(new THREE.Vector3().setFromCylindricalCoords(radius, Math.random() * 2 * Math.PI, (Math.random() - 0.5) * 4));
//   sizes.push(Math.random() * 1.5 + 0.5);
//   pushShift();
// }


let g = new THREE.BufferGeometry().setFromPoints(position1);
g.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
g.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));
g.setAttribute("speed", new THREE.Float32BufferAttribute(new Float32Array(speed), 1));
g.center();

let g2 = new THREE.BufferGeometry().setFromPoints(position2);
g2.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
g2.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));
g2.setAttribute("speed", new THREE.Float32BufferAttribute(new Float32Array(speed), 1));
g2.center();

let m1 =   new THREE.ShaderMaterial({
  uniforms: {
    time: {
      value: 0
    },
    size: {
      value: 0.5
    },

  },
  vertexShader: `
    #define PI 3.1415926  

    uniform float time;
    uniform float size;

    attribute float speed;

    varying vec3 vC;
    varying float vDiscard;
    `
    + `
    // http://www.iquilezles.org/www/articles/distfunctions/distfunctions.htm

    float sdSphere( vec3 p, float s )
    {
      return length(p)-s;
    }
    
    // honestly stolen from here https://www.shadertoy.com/view/MlGGDh
    mat3 rotationMatrix(vec3 m,float a) {
        m = normalize(m);
        float c = cos(a),s=sin(a);
        return mat3(
          c+(1.-c)*m.x*m.x,     (1.-c)*m.x*m.y-s*m.z, (1.-c)*m.x*m.z+s*m.y,
          (1.-c)*m.x*m.y+s*m.z, c+(1.-c)*m.y*m.y,     (1.-c)*m.y*m.z-s*m.x,
          (1.-c)*m.x*m.z-s*m.y, (1.-c)*m.y*m.z+s*m.x, c+(1.-c)*m.z*m.z);
    }
    
    mat3 rotate(vec3 val){
      mat3 matX = rotationMatrix(vec3(1, 0, 0), val.x);
      mat3 matY = rotationMatrix(vec3(0, 1, 0), val.y);
      mat3 matZ = rotationMatrix(vec3(0, 0, 1), val.z);
      return matX * matY * matZ;
    }
` +
    `
    void main(){
      vec3 pos = position;
     
      float start = position.y - -50.;
      float way = speed * time;
      float totalWay = start + way;
      float modulo = mod(totalWay, 100.);
      pos.y = modulo - 50.;
      
      vec3 vPos = pos;

      vPos *= rotate(vec3(0, time, 0));
      
      // heart https://www.youtube.com/watch?v=aNR4n0i2ZlM
      vec3 h = vPos / 2.5;
      h.y = 4. + 1.2 * h.y - abs(h.x) * sqrt(max((20. - abs(h.x)) / 15., 0.));
      h.z = h.z * (2. - h.y / 15.);
      float r = 15. + 3. * pow(0.5 + 0.5 * sin(2. * PI * time + h.y / 25.), 4.);
      float heart = sdSphere(h, r);        

      bool boolDiscard = heart > 0.0 || heart < -2.;
      
      vec3 c = vec3(1, 0, 0); // colour of the heart
      if (heart > -0.125) c = vec3(1);

      vC = c;
      vDiscard = boolDiscard == true ? 1. : 0.;

      vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
      gl_PointSize = size * ( 300.0 / -mvPosition.z );
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    //uniform sampler2D texture;

    varying vec3 vC;
    varying float vDiscard;
   
    void main(){

      if ( vDiscard > 0.5 ) {discard;}
      if (length(gl_PointCoord - 0.5) > 0.5) {discard;}
      gl_FragColor = vec4( vC, 1.0);
      //gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
    }
  `,

})

let m2= new THREE.PointsMaterial({
  size: 0.125,
  transparent: true,
  depthTest: false,
  blending: THREE.AdditiveBlending,
  onBeforeCompile: shader => {
    shader.uniforms.time = gu.time;
    shader.vertexShader = `
      uniform float time;
      attribute float sizes;
      attribute vec4 shift;
      varying vec3 vColor;
      ${shader.vertexShader}
    `.replace(
      `gl_PointSize = size;`,
      `gl_PointSize = size * sizes;`
    ).replace(
      `#include <color_vertex>`,
      `#include <color_vertex>
        float d = length(abs(position) / vec3(40., 10., 40));
        d = clamp(d, 0., 1.);
        vColor = mix(vec3(227., 155., 0.), vec3(100., 50., 255.), d) / 255.;
      `
    ).replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
        float t = time;
        float moveT = mod(shift.x + shift.z * t, PI2);
        float moveS = mod(shift.y + shift.z * t, PI2);
        transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.w;
      `
    );
    console.log(shader.vertexShader);
    shader.fragmentShader = `
      varying vec3 vColor;
      ${shader.fragmentShader}
    `.replace(
      `#include <clipping_planes_fragment>`,
      `#include <clipping_planes_fragment>
        float d = length(gl_PointCoord.xy - 0.5);
        //if (d > 0.5) discard;
      `
    ).replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `vec4 diffuseColor = vec4( vColor, smoothstep(0.5, 0.1, d)/* * 0.5 + 0.5*/ );`
    );
    console.log(shader.fragmentShader);
  }
});



let p1 = new THREE.Points(g, m1);
p1.rotation.order = "ZYX";
p1.rotation.z = 0.2;
scene.add(p1)

let p2 = new THREE.Points(g2, m2);
p2.rotation.order = "ZYX";
p2.rotation.z = 0.2;
scene.add(p2)


let clock = new THREE.Clock();
var time = 0;

renderer.setAnimationLoop(() => {
  controls.update();


  if (resize(renderer)) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  time += clock.getDelta();
  scene.rotation.y = time * 0.25;
  p1.material.uniforms.time.value = time;

  let t = clock.getElapsedTime() * 0.5;
  gu.time.value = t * Math.PI;
  p2.rotation.y = t * 0.05;

  renderer.render(scene, camera);
});

function resize(renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}