import { readFile } from '@tauri-apps/plugin-fs';
import { Packr } from 'msgpackr';
import { packr } from '~/utils/msgpackr';
import { Project } from '../out/dump';

export async function readProjectFromPath(path: string): Promise<Project | null> {
  try {
    console.log('start time:', new Date().toISOString());
    const data = await readFile(path);
    const unpacked = packr.unpack(data) as Project;
    console.log('end time:', new Date().toISOString());
    return unpacked;
  } catch (error) {
    console.error('Failed to read project from path:', error);
    return null;
  }
}

export function readProjectDataFromWindow(): Project | null {
  // @ts-ignore
  const projectData = window.__PROJECT__;

  if (!projectData) {
    console.log('No project data found');
    return null;
  }

  // base64形式のmsgpackかチェック
  if (projectData.type === 'base64_msgpack') {
    console.log('Decoding base64 msgpack data...');

    try {
      // base64デコード
      const binaryString = atob(projectData.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log('Base64 decoded, size:', bytes.length, 'bytes');

      // msgpackrでデコード
      const packr = new Packr({ useRecords: true, mapsAsObjects: false });
      const decoded = packr.unpack(bytes) as Project;

      console.log('Project data decoded:', decoded);

      // メモリクリーンアップ
      // @ts-ignore
      delete window.__PROJECT__;

      return decoded;
    } catch (error) {
      console.error('Failed to decode msgpack data:', error);
      return null;
    }
  } else {
    // 従来形式（既に解析済み）
    console.log('Project data found:', {
      layers: projectData.layerListStore?.layers?.length,
      canvas_size: `${projectData.canvasStore?.canvas?.width}x${projectData.canvasStore?.canvas?.height}`,
    });

    // メモリクリーンアップ
    // @ts-ignore
    delete window.__PROJECT__;

    return projectData;
  }
}

export function importProjectFromWindow() {
  const startTime = performance.now();
  const projectData = readProjectDataFromWindow();
  const endTime = performance.now();
  // @ts-ignore
  const openPath = window.__PATH__;

  if (projectData) {
    console.log(`Project data loaded in ${endTime - startTime}ms`);
    console.log(`Project name: ${openPath.name}`);
    console.log(`Canvas size: ${projectData.canvasStore.canvas.width}x${projectData.canvasStore.canvas.height}`);
    console.log(`Layer count: ${projectData.layerListStore.layers.length}`);
    console.log(`Layer buffers: ${projectData.layerBuffers?.size || 0}`);
  }

  return projectData;
}
