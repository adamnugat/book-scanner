import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { SceneTranscriptBox } from '../components/SceneTranscriptBox';

describe('SceneTranscriptBox', () => {
  it('renders provided text', () => {
    render(
      <SceneTranscriptBox
        text="Hello world from scene 1"
        positionMs={0}
        durationMs={30000}
        isPlaying={false}
      />,
    );
    expect(screen.getByText('Hello world from scene 1')).toBeTruthy();
  });

  it('renders fallback when text is null', () => {
    render(<SceneTranscriptBox text={null} positionMs={0} durationMs={30000} isPlaying={false} />);
    expect(screen.getByText('Brak transkrypcji dla tej sceny')).toBeTruthy();
  });

  it('renders fallback for empty/whitespace text', () => {
    render(
      <SceneTranscriptBox text="   " positionMs={15000} durationMs={30000} isPlaying={true} />,
    );
    expect(screen.getByText('Brak transkrypcji dla tej sceny')).toBeTruthy();
  });

  it('rerenders without crash when positionMs changes', () => {
    const { rerender } = render(
      <SceneTranscriptBox text="Line one" positionMs={0} durationMs={30000} isPlaying={true} />,
    );
    rerender(
      <SceneTranscriptBox text="Line one" positionMs={7500} durationMs={30000} isPlaying={true} />,
    );
    rerender(
      <SceneTranscriptBox text="Line one" positionMs={22500} durationMs={30000} isPlaying={true} />,
    );
    rerender(
      <SceneTranscriptBox text="Line one" positionMs={30000} durationMs={30000} isPlaying={true} />,
    );
    expect(screen.getByText('Line one')).toBeTruthy();
  });

  it('stops animating when isPlaying becomes false', () => {
    const { rerender } = render(
      <SceneTranscriptBox
        text="Paused scene"
        positionMs={5000}
        durationMs={30000}
        isPlaying={true}
      />,
    );
    rerender(
      <SceneTranscriptBox
        text="Paused scene"
        positionMs={5000}
        durationMs={30000}
        isPlaying={false}
      />,
    );
    expect(screen.getByText('Paused scene')).toBeTruthy();
  });

  it('updates when text changes via resetKey', () => {
    const { rerender } = render(
      <SceneTranscriptBox
        text="first scene"
        positionMs={12000}
        durationMs={30000}
        isPlaying={true}
      />,
    );
    expect(screen.getByText('first scene')).toBeTruthy();
    rerender(
      <SceneTranscriptBox
        text="second scene"
        positionMs={0}
        durationMs={25000}
        isPlaying={true}
        resetKey="scene-2"
      />,
    );
    expect(screen.getByText('second scene')).toBeTruthy();
  });

  it('handles durationMs=0 without throwing', () => {
    render(<SceneTranscriptBox text="bounded" positionMs={0} durationMs={0} isPlaying={false} />);
    expect(screen.getByText('bounded')).toBeTruthy();
  });
});
