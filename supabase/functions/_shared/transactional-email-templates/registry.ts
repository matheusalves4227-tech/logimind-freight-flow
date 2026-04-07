/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as b2bProposal } from './b2b-proposal.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'b2b-proposal': b2bProposal,
}
