import type { PlaylistItemResponse } from '@book-scanner/shared';

export interface LocalJingle {
  name: string;
  label: string;
  icon: string;
  asset: number;
}

export const LOCAL_JINGLES: LocalJingle[] = [
  {
    name: 'local:page-turn-1',
    label: 'Przewracanie strony 1',
    icon: '🔔',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    asset: require('../assets/audio/page-turn-1.mp3'),
  },
  {
    name: 'local:page-turn-2',
    label: 'Przewracanie strony 2',
    icon: '🔔',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    asset: require('../assets/audio/page-turn-2.wav'),
  },
  {
    name: 'local:page-turn-3',
    label: 'Wstawka głosowa',
    icon: '🎙️',
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    asset: require('../assets/audio/page-turn-3.mp3'),
  },
];

export function getLocalJingle(name: string): LocalJingle | undefined {
  return LOCAL_JINGLES.find((j) => j.name === name);
}

export function buildPlaylistWithJingles(
  sceneItems: PlaylistItemResponse[],
  jingleUri: string,
): PlaylistItemResponse[] {
  const result: PlaylistItemResponse[] = [];
  for (let i = 0; i < sceneItems.length; i++) {
    result.push(sceneItems[i]);
    if (i < sceneItems.length - 1) {
      result.push({
        id: `local-jingle-${i}`,
        projectId: sceneItems[i].projectId,
        type: 'interstitial',
        referenceId: `local-jingle-${i}`,
        orderIndex: sceneItems[i].orderIndex + 0.5,
        audioUrl: jingleUri,
        durationMs: 0,
      });
    }
  }
  return result;
}
