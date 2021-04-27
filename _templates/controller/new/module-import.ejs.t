---
inject: true
to: src/index.ts
before: register
skip_if: import <%= Name %>Controller
---
import <%= Name %>Controller from 'modules/<%= name %>';