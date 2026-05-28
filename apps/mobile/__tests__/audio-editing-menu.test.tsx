import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { AudioEditingMenu } from '../components/AudioEditingMenu';

const voices = [
  {
    id: 'v-1',
    elevenlabsVoiceId: 'voice-1',
    name: 'Anna',
    language: 'pl',
    plan: 'free' as const,
    previewUrl: null,
  },
  {
    id: 'v-2',
    elevenlabsVoiceId: 'voice-2',
    name: 'Bartek',
    language: 'pl',
    plan: 'free' as const,
    previewUrl: null,
  },
];

const presets = [
  {
    id: 'preset-1',
    name: 'Klasyczna',
    audioUrl: 'http://api.test/preset-1.mp3',
    durationMs: 4000,
  },
];

const expandVoice = () => fireEvent.press(screen.getByLabelText('Edytuj Lektor'));
const expandPreset = () => fireEvent.press(screen.getByLabelText('Edytuj Wstawka muzyczna'));

describe('AudioEditingMenu', () => {
  it('renders both accordions collapsed with summaries', () => {
    render(
      <AudioEditingMenu
        visible
        voices={voices}
        presets={presets}
        initialVoiceId="voice-1"
        initialInterstitialPreset={null}
        onCancel={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expect(screen.getByText('Lektor')).toBeTruthy();
    expect(screen.getByText('Wstawka muzyczna')).toBeTruthy();
    // Summaries show current selection while collapsed.
    expect(screen.getAllByText('Anna').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Brak wstawki').length).toBeGreaterThan(0);
    // Voice card for Bartek is hidden until section is expanded.
    expect(screen.queryByText('Bartek')).toBeNull();
  });

  it('expands voice section on tap and shows voice options', () => {
    render(
      <AudioEditingMenu
        visible
        voices={voices}
        presets={presets}
        initialVoiceId="voice-1"
        initialInterstitialPreset={null}
        onCancel={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expandVoice();
    expect(screen.getByText('Bartek')).toBeTruthy();
    expect(screen.getByTestId('audio-menu-voice-voice-2')).toBeTruthy();
  });

  it('expands preset section on tap and shows preset options', () => {
    render(
      <AudioEditingMenu
        visible
        voices={voices}
        presets={presets}
        initialVoiceId="voice-1"
        initialInterstitialPreset={null}
        onCancel={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expandPreset();
    expect(screen.getByText('Klasyczna')).toBeTruthy();
    expect(screen.getByTestId('audio-menu-preset-preset-1')).toBeTruthy();
  });

  it('shows empty state when expanded voice section has no voices', () => {
    render(
      <AudioEditingMenu
        visible
        voices={[]}
        presets={presets}
        initialVoiceId={null}
        initialInterstitialPreset={null}
        onCancel={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expandVoice();
    expect(screen.getByText('Brak głosów dla języka audiobooka.')).toBeTruthy();
  });

  it('save is disabled when nothing changed', () => {
    render(
      <AudioEditingMenu
        visible
        voices={voices}
        presets={presets}
        initialVoiceId="voice-1"
        initialInterstitialPreset={null}
        onCancel={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    const save = screen.getByTestId('audio-menu-save');
    expect(save.props.accessibilityState?.disabled).toBe(true);
  });

  it('save fires with only the changed fields (voice only)', () => {
    const onSave = jest.fn();
    render(
      <AudioEditingMenu
        visible
        voices={voices}
        presets={presets}
        initialVoiceId="voice-1"
        initialInterstitialPreset={null}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    expandVoice();
    fireEvent.press(screen.getByTestId('audio-menu-voice-voice-2'));
    fireEvent.press(screen.getByTestId('audio-menu-save'));

    expect(onSave).toHaveBeenCalledWith({ voiceId: 'voice-2' });
  });

  it('save fires with both fields when both change', () => {
    const onSave = jest.fn();
    render(
      <AudioEditingMenu
        visible
        voices={voices}
        presets={presets}
        initialVoiceId="voice-1"
        initialInterstitialPreset={null}
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    expandVoice();
    fireEvent.press(screen.getByTestId('audio-menu-voice-voice-2'));
    expandPreset();
    fireEvent.press(screen.getByTestId('audio-menu-preset-preset-1'));
    fireEvent.press(screen.getByTestId('audio-menu-save'));

    expect(onSave).toHaveBeenCalledWith({
      voiceId: 'voice-2',
      interstitialPreset: 'preset-1',
    });
  });

  it('save fires with interstitialPreset=null when user clears it', () => {
    const onSave = jest.fn();
    render(
      <AudioEditingMenu
        visible
        voices={voices}
        presets={presets}
        initialVoiceId="voice-1"
        initialInterstitialPreset="preset-1"
        onCancel={jest.fn()}
        onSave={onSave}
      />,
    );

    expandPreset();
    fireEvent.press(screen.getByTestId('audio-menu-preset-none'));
    fireEvent.press(screen.getByTestId('audio-menu-save'));

    expect(onSave).toHaveBeenCalledWith({ interstitialPreset: null });
  });

  it('cancel triggers onCancel without onSave', () => {
    const onCancel = jest.fn();
    const onSave = jest.fn();
    render(
      <AudioEditingMenu
        visible
        voices={voices}
        presets={presets}
        initialVoiceId="voice-1"
        initialInterstitialPreset={null}
        onCancel={onCancel}
        onSave={onSave}
      />,
    );

    expandVoice();
    fireEvent.press(screen.getByTestId('audio-menu-voice-voice-2'));
    fireEvent.press(screen.getByTestId('audio-menu-cancel'));

    expect(onCancel).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('tapping same section header collapses it', () => {
    render(
      <AudioEditingMenu
        visible
        voices={voices}
        presets={presets}
        initialVoiceId="voice-1"
        initialInterstitialPreset={null}
        onCancel={jest.fn()}
        onSave={jest.fn()}
      />,
    );

    expandVoice();
    expect(screen.getByText('Bartek')).toBeTruthy();
    expandVoice();
    expect(screen.queryByText('Bartek')).toBeNull();
  });
});
