import React, { useRef, useEffect } from 'react';
import {
	Scene,
	Color,
	Fog,
	Mesh,
	ShaderMaterial,
	PerspectiveCamera,
	WebGLRenderer,
	PlaneBufferGeometry,
	TextureLoader,
	RepeatWrapping,
	Texture,
} from 'three';

const cacheImage = new Image();
cacheImage.src = '/assets/images/wave-texture.png';

const waveFragment = `
varying vec2 vUv;
uniform float time;
uniform float maxWaveHeight;
uniform sampler2D texture;
varying float noise;
uniform vec3 fogColor;
uniform float fogNear;
uniform float fogFar;

varying vec3 vNormal;

void main() {
    //vec3 newPosition = position;

    // colour is RGBA: u, v, 0, 1
    //gl_FragColor = vec4( vec3( vUv, 0.625 ), 1. );
    //gl_FragColor = vec4( vec3( vUv, sin(time)), 1. );

    vec3 light = vec3(0.0,0.0,0.0);// vec3(0.125, 0.3764, 0.451);

    vec3 light2 = vec3(0.0,0.0,0.0);

    // ensure it's normalized
    light = normalize(light);
    light2 = normalize(light2);

    // calculate the dot product of
    // the light to the vertex normal
    float dProd = max(0.0, dot(vNormal, light));

    float dProd2 = max(0.0, dot(vNormal, light2));

    gl_FragColor = texture2D(texture, (vUv * 100.0));

    #ifdef USE_FOG

        #ifdef USE_LOGDEPTHBUF_EXT
            float depth = gl_FragDepthEXT / gl_FragCoord.w;
        #else
            float depth = gl_FragCoord.z / gl_FragCoord.w;
        #endif

        float fogFactor = smoothstep( fogNear, fogFar, depth );
        float shadowFactor = smoothstep( 100.0, 250.0, gl_FragCoord.z / gl_FragCoord.w );
        float lightFactor = smoothstep( 0.0, 150.0, (gl_FragCoord.z) / gl_FragCoord.w);

        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
        gl_FragColor.rgb = mix( gl_FragColor.rgb, vec3(dProd,dProd,dProd), shadowFactor );
        gl_FragColor.rgb = mix( vec3(dProd,dProd,dProd), gl_FragColor.rgb, lightFactor );

    #endif

    //gl_FragColor = vec4(dProd, dProd, dProd, 1.0);
}
`;

const waveVertex = `
//
// GLSL textureless classic 3D noise "cnoise",
// with an RSL-style periodic variant "pnoise".
// Author:  Stefan Gustavson (stefan.gustavson@liu.se)
// Version: 2011-10-11
//
// Many thanks to Ian McEwan of Ashima Arts for the
// ideas for permutation and gradient selection.
//
// Copyright (c) 2011 Stefan Gustavson. All rights reserved.
// Distributed under the MIT license. See LICENSE file.
// https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float cnoise(vec3 P) {
    vec3 Pi0 = floor(P); // Integer part for indexing
    vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
}

// Classic Perlin noise, periodic variant
float pnoise(vec3 P, vec3 rep) {
    vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
    vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P); // Fractional part for interpolation
    vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
}

float turbulence( vec3 p ) {
    float w = 100.0;
    float t = -.5;

    for (float f = 1.0 ; f <= 10.0 ; f++ ){
        float power = pow( 2.0, f );
        t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
    }

    return t;
}

varying vec2 vUv;
uniform float time;
uniform float maxWaveHeight;
uniform float frequency;
uniform float waveWidth;
//varying float noise;

varying vec3 vNormal;

void main() {
    
    vUv = uv;
    vec3 n = position;

    // Base wave
    n.z = sin(n.y / (-1.0 * waveWidth) + (time * frequency)) * maxWaveHeight;

    // Add bumps
    n.z -= sin(n.x) * cos(n.y / waveWidth -  frequency) * maxWaveHeight;

    // Make the wave arc upwards
    n.z += sin(n.x / (-1.0 * waveWidth) + frequency) * maxWaveHeight * 2.0;

    // Skew front/back slightly
    n.x += cos(n.y / (-2.0 * waveWidth) + (time*frequency)) * maxWaveHeight;

    // Gentle left/right drift
    n.y += sin(n.x / (-1.0 * waveWidth) + (time * frequency)) * maxWaveHeight;

    float angle = (time + n.x)*frequency;

    vec3 objectNormal = normalize(vec3(-maxWaveHeight * frequency * cos(angle),0.0,1.0));
    vNormal = normalMatrix * objectNormal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4( n, 1.0 );
}
`;

const initializeAnimation = (settings) => {
	const { canvasElementRef, cssHexColorString, maxWaveHeight, frequency, waveWidth, doAntialias, doTransition } = settings;

	if (!canvasElementRef.current) {
		return () => undefined;
	}

	const scene = new Scene();
	scene.background = new Color(cssHexColorString);
	scene.fog = new Fog(Number(`0x${cssHexColorString.substring(1, cssHexColorString.length)}`), 10, 500);

    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 400;

	const camera = new PerspectiveCamera(60, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 1000);
	camera.position.set(0, 0, maxWaveHeight * 2.5);
	camera.rotation.y = 50 * Math.PI / 180;
	camera.rotation.z = Math.PI / 2;

	const sceneRenderer = new WebGLRenderer({ canvas: canvasElementRef.current, antialias: doAntialias });
	sceneRenderer.setPixelRatio(window.devicePixelRatio);
	sceneRenderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);

	const planeGeometry = new PlaneBufferGeometry(1000, 1000, 150, 150);
	const texture = new TextureLoader().load(cacheImage.src);
	texture.wrapS = RepeatWrapping;

	const { color: fogColor, near: fogNear, far: fogFar } = scene.fog;
	const planeMaterial = new ShaderMaterial({
		fog: true,
		flatShading: true,
		vertexShader: waveVertex,
		fragmentShader: waveFragment,
		uniforms: {
			time: { type: 'f', value: 0.0 },
			maxWaveHeight: { type: 'f', value: maxWaveHeight },
			frequency: { type: 'f', value: frequency },
			waveWidth: { type: 'f', value: waveWidth },
			texture: { type: 't', value: texture },
			fogColor: { type: 'c', value: fogColor },
			fogNear: { type: 'f', value: fogNear },
			fogFar: { type: 'f', value: fogFar },
		},
	});
	const plane = new Mesh(planeGeometry, planeMaterial);
	plane.position.set(160, 0, -1 * maxWaveHeight);

	scene.add(plane);

	const renderAnimation = () => {
		const time = window.performance.now() * 0.001;

		planeMaterial.uniforms.time.value = time;

		if (doTransition) {
			planeMaterial.uniforms.maxHeight.value = Math.min(maxWaveHeight, time * 10);
		}

		if (sceneRenderer) {
			sceneRenderer.render(scene, camera);

			return requestAnimationFrame(renderAnimation);
		}
	};

	const animationId = renderAnimation();

	const destroyScene = () => {
		cancelAnimationFrame(animationId);
		sceneRenderer = null;
		camera = null;
		scene.remove(plane);
		scene.dispose();
		plane = null;
		planeGeometry.dispose();
		planeMaterial.dispose();
	};

	return destroyScene;
};


export const Anim = () => {
    const canvasElementRef = useRef(null);
    useEffect(() => {
		const destroyScene = initializeAnimation({
			canvasElementRef: canvasElementRef,
			cssHexColorString: '#293284',
			maxWaveHeight: 17.5,
			frequency: 0.15,
			waveWidth: 50.0,
			doAntialias: false,
			doTransition: false,
		});

		return () => destroyScene();
	}, []);

    return (
        <canvas ref={canvasElementRef} />
    );
};