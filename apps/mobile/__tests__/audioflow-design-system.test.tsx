import React from 'react';
import { render, screen } from '@testing-library/react-native';

import {
  AudioFlowScreen,
  GlassPanel,
  PearlButton,
  PickerCard,
  audioFlowReferenceViews,
  audioFlowTokens,
} from '../components/audioflow';
import * as AudioFlow from '../components/audioflow';

describe('AudioFlow mobile design system', () => {
  it('exposes reusable tokens for the burgundy glass and pearl visual language', () => {
    expect(audioFlowTokens.color.background.heroBase).toBe('#6b4c4c');
    expect(audioFlowTokens.color.surface.glass).toBe('rgba(45, 30, 30, 0.45)');
    expect(audioFlowTokens.color.accent.pearl).toBe('#F0EAD6');
    expect(audioFlowTokens.spacing.marginMobile).toBe(20);
    expect(audioFlowTokens.radius.panel).toBe(24);
  });

  it('renders shared primitives with accessible children and selected states', () => {
    render(
      <AudioFlowScreen>
        <GlassPanel>
          <PearlButton label="Dalej" onPress={() => {}} />
          <PickerCard selected title="Automatycznie" body="OCR i audio bez dodatkowych kroków" />
        </GlassPanel>
      </AudioFlowScreen>,
    );

    expect(screen.getByText('Dalej')).toBeTruthy();
    expect(screen.getByText('Automatycznie')).toBeTruthy();
    expect(screen.getByText('OCR i audio bez dodatkowych kroków')).toBeTruthy();
  });

  it('documents reference view mapping for current and future mobile routes', () => {
    expect(audioFlowReferenceViews['/(app)/projects/new/index']).toBe('New Project.html');
    expect(audioFlowReferenceViews['/(app)/projects/new/images']).toBe('Add Photos.html');
    expect(audioFlowReferenceViews['/(app)']).toBe('Dashboard.html');
  });

  it('exposes reusable app shell primitives for header and footer menu', () => {
    expect(AudioFlow.AudioFlowAppHeader).toBeDefined();
    expect(AudioFlow.AudioFlowFooterMenu).toBeDefined();
    expect(AudioFlow.RoundIconButton).toBeDefined();
    expect(AudioFlow.AudioFlowLogo).toBeDefined();
  });

  it('exposes reusable form and project-list primitives', () => {
    expect(AudioFlow.AudioFlowTextField).toBeDefined();
    expect(AudioFlow.FormLink).toBeDefined();
    expect(AudioFlow.ProjectCard).toBeDefined();
    expect(AudioFlow.StatusPill).toBeDefined();
    expect(AudioFlow.FilterChip).toBeDefined();
  });
});
