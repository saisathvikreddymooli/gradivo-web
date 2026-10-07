import { useEffect, useState } from "react";
import "./HomeHeroArtwork.css";

const source = "/home-hands-hero.jpg";
const backgroundThreshold = 8;

type ArtworkLayers = { background: string; humanHand: string; robotHand: string };

function separateHands(image: HTMLImageElement): ArtworkLayers | null {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const pixelCount = width * height;
  const transparent = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const addBackgroundPixel = (index: number) => {
    if (transparent[index]) return;
    const pixel = index * 4;
    if (Math.max(pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]) > backgroundThreshold) return;
    transparent[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  // Flood-fill only near-black pixels connected to the image boundary.
  for (let x = 0; x < width; x += 1) {
    addBackgroundPixel(x);
    addBackgroundPixel((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    addBackgroundPixel(y * width);
    addBackgroundPixel(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % width;
    if (x > 0) addBackgroundPixel(index - 1);
    if (x < width - 1) addBackgroundPixel(index + 1);
    if (index >= width) addBackgroundPixel(index - width);
    if (index < pixelCount - width) addBackgroundPixel(index + width);
  }

  for (let index = 0; index < pixelCount; index += 1) {
    if (transparent[index]) pixels[index * 4 + 3] = 0;
  }

  // Label connected opaque regions so the original pixels for each hand can
  // move independently while every other part of the hero remains unchanged.
  const labels = new Int32Array(pixelCount);
  const componentSizes: number[] = [0];
  const componentXs: number[] = [0];
  const componentYs: number[] = [0];
  const componentQueue = new Int32Array(pixelCount);
  let componentCount = 0;
  const neighbors = [-width - 1, -width, -width + 1, -1, 1, width - 1, width, width + 1];
  for (let start = 0; start < pixelCount; start += 1) {
    if (labels[start] || pixels[start * 4 + 3] < 10) continue;
    componentCount += 1;
    let head = 0;
    let tail = 0;
    componentQueue[tail++] = start;
    labels[start] = componentCount;
    let sumX = 0;
    let sumY = 0;
    while (head < tail) {
      const index = componentQueue[head++];
      const x = index % width;
      const y = Math.floor(index / width);
      sumX += x;
      sumY += y;
      for (const offset of neighbors) {
        const next = index + offset;
        if (next < 0 || next >= pixelCount || labels[next] || pixels[next * 4 + 3] < 10) continue;
        const nx = next % width;
        if (Math.abs(nx - x) > 1) continue;
        labels[next] = componentCount;
        componentQueue[tail++] = next;
      }
    }
    componentSizes[componentCount] = tail;
    componentXs[componentCount] = sumX / tail;
    componentYs[componentCount] = sumY / tail;
  }

  const largestMatching = (match: (x: number, y: number) => boolean) => {
    let chosen = 0;
    for (let id = 1; id <= componentCount; id += 1) {
      if (componentSizes[id] > (componentSizes[chosen] || 0) && match(componentXs[id] / width, componentYs[id] / height)) chosen = id;
    }
    return chosen;
  };
  const humanId = largestMatching((x, y) => x < 0.52 && y < 0.58);
  const robotId = largestMatching((x, y) => x > 0.48 && y > 0.4);
  if (!humanId || !robotId || humanId === robotId) return null;

  const handCanvases = [document.createElement("canvas"), document.createElement("canvas")];
  handCanvases.forEach((layer) => { layer.width = width; layer.height = height; });
  const handContexts = handCanvases.map((layer) => layer.getContext("2d"));
  const humanPixels = handContexts[0]?.createImageData(width, height);
  const robotPixels = handContexts[1]?.createImageData(width, height);
  if (!humanPixels || !robotPixels) return null;
  for (let index = 0; index < pixelCount; index += 1) {
    const id = labels[index];
    const offset = index * 4;
    if (id === humanId) {
      humanPixels.data.set(pixels.subarray(offset, offset + 4), offset);
      pixels[offset + 3] = 0;
    } else if (id === robotId) {
      robotPixels.data.set(pixels.subarray(offset, offset + 4), offset);
      pixels[offset + 3] = 0;
    }
  }
  handContexts[0]!.putImageData(humanPixels, 0, 0);
  handContexts[1]!.putImageData(robotPixels, 0, 0);
  context.putImageData(imageData, 0, 0);
  return {
    background: canvas.toDataURL("image/png"),
    humanHand: handCanvases[0].toDataURL("image/png"),
    robotHand: handCanvases[1].toDataURL("image/png"),
  };
}

export default function HomeHeroArtwork() {
  const [layers, setLayers] = useState<ArtworkLayers | null>(null);

  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      const separatedLayers = separateHands(image);
      if (active && separatedLayers) setLayers(separatedLayers);
    };
    image.src = source;
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="home-hero-artwork" aria-hidden="true">
      <img className="home-hero-artwork-image" src={layers?.background ?? source} alt="" />
      {layers && <>
        <img className="home-hero-hand home-hero-human-hand" src={layers.humanHand} alt="" />
        <img className="home-hero-hand home-hero-robot-hand" src={layers.robotHand} alt="" />
      </>}
    </div>
  );
}
