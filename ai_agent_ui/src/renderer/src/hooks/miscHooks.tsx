import { useState } from 'react';
import { createStore } from 'reusable';

export const showProposalsHook = createStore(() => useState<boolean>(false));