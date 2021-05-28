---
inject: true
to: src/modules/<%= name %>/<%= name %>.controller.ts
after: import
skip_if: import <%= Name %>Service
---
import <%= Name %>Service from './<%= name %>.service';