import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  ShaderMaterial,
  Vector3
} from 'three';
import hexRgb from 'hex-rgb';
import isHex from 'is-hexcolor';
import {
  getParticleVertexShader,
  getParticleFragmentShader
} from '../shaders/ParticleShaders';

export default ({
  particles,
  dimension,
  devicePixelRatio,
  direction,
  size,
  r,
  velocity
}) => {
  const {
    boundingBox,
    count,
    positions,
    colors,
    colorMode,
    color,
    shape,
    transparency,
    minSize,
    maxSize,
    visible
  } = particles;
  // Add particles to geometry
  // Maintain two arrays
  // particlePositions contains x,y,z coords for each particle
  // particlesData contains a random x,y,z velocity vector for each particle
  const pointCloudGeometry = new BufferGeometry();
  const particlePositions = new Float32Array(count * 3);
  const particleSizes = new Float32Array(count);
  const particleColors = new Float32Array(count * 3);
  const particlesData = [];

  let xBounds;
  let yBounds;
  let zBounds;
  if (boundingBox === 'canvas') {
    // Adjust size of particle field contstraints based on
    // whether field is 2D or 3D
    xBounds = dimension === '2D' ? size.width : size.width;
    yBounds = dimension === '2D' ? size.height : size.height * 1.5;
    zBounds = dimension === '2D' ? 0 : size.width;
  }
  if (boundingBox === 'cube') {
    xBounds = r;
    yBounds = r;
    zBounds = dimension === '2D' ? 0 : r;
  }

  if (positions) {
    for (let i = 0; i < count; i += 1) {
      particlePositions[i * 3] = positions[i].x;
      particlePositions[i * 3 + 1] = positions[i].y;
      particlePositions[i * 3 + 2] = positions[i].z;
    }
  } else {
    for (let i = 0; i < count; i += 1) {
      // Calculate possible (x, y, z) location of particle
      // within the size of the canvas or cube size
      const x = Math.random() * xBounds - xBounds / 2;
      const y = Math.random() * yBounds - yBounds / 2;
      const z = Math.random() * zBounds - zBounds / 2;
      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;
    }
  }

  for (let i = 0; i < count; i += 1) {
    // Choose size of each particle
    particleSizes[i] = Math.random() * (maxSize - minSize) + minSize;

    // Calculates a random number between given range
    const getVelocityMultiplier = (min, max) =>
      Math.random() * (max - min) + min;

    const { xMin, xMax, yMin, yMax, zMin, zMax } = direction;

    particlesData.push({
      velocity: new Vector3(
        getVelocityMultiplier(xMin, xMax) * velocity,
        getVelocityMultiplier(yMin, yMax) * velocity,
        getVelocityMultiplier(zMin, zMax) * velocity
      ),
      numConnections: 0
    });
  }

  if (colors) {
    for (let i = 0; i < count; i += 1) {
      if (isHex(colors[i])) {
        const { red, green, blue } = hexRgb(colors[i]);
        particleColors[i * 3] = (red / 255).toFixed(2);
        particleColors[i * 3 + 1] = (green / 255).toFixed(2);
        particleColors[i * 3 + 2] = (blue / 255).toFixed(2);
      } else {
        particleColors[i * 3] = 1;
        particleColors[i * 3 + 1] = 1;
        particleColors[i * 3 + 2] = 1;
      }
    }
  }

  pointCloudGeometry.setDrawRange(0, count);
  pointCloudGeometry.setAttribute(
    'position',
    new BufferAttribute(particlePositions, 3).setUsage(DynamicDrawUsage)
  );
  pointCloudGeometry.setAttribute(
    'size',
    new BufferAttribute(particleSizes, 1).setUsage(DynamicDrawUsage)
  );
  pointCloudGeometry.setAttribute(
    'color',
    new BufferAttribute(particleColors, 3).setUsage(DynamicDrawUsage)
  );

  // Material for particle, use shaders to morph shape and color
  const pointMaterial = new ShaderMaterial({
    vertexShader: getParticleVertexShader({
      colorMode,
      color,
      devicePixelRatio
    }),
    fragmentShader: getParticleFragmentShader({
      particleShape: shape,
      transparency
    }),
    transparent: transparency < 1,
    blending: AdditiveBlending,
    visible
  });

  // The x,y,z bounds of possible particle positions
  // needed for Animate function
  const bounds = {
    xBounds,
    yBounds,
    zBounds
  };

  return [
    pointCloudGeometry,
    pointMaterial,
    particlesData,
    particlePositions,
    particleColors,
    bounds
  ];
};
