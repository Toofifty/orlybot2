---
inject: true
to: src/modules/<%= name %>/<%= name %>.controller.ts
after: import
skip_if: import <%= Name %>Store
---
import <%= Name %>Store from './<%= name %>.store';