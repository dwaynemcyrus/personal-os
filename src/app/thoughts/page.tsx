'use client';

import { useEffect } from 'react';
import { RootView } from '../_components/RootView';
import { useNavigationActions, useNavigationState } from '@/components/providers';

export default function ThoughtsPage() {
  const { context } = useNavigationState();
  const { switchContext, pushLayer } = useNavigationActions();

  useEffect(() => {
    if (context === 'thoughts') return;
    switchContext('thoughts');
    pushLayer({ view: 'thoughts-menu' });
    pushLayer({ view: 'thoughts-list' });
  }, [context, pushLayer, switchContext]);

  return <RootView />;
}
