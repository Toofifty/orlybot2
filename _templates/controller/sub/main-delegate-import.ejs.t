---
inject: true
to: src/modules/<%= module %>/<%= module %>.controller.ts
after: import {
skip_if: delegate,
---
import { delegate } from 'core';