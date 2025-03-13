import { useState } from 'react';
import { createStore } from 'reusable';

export const showProposalsHook = createStore(() => useState(true));