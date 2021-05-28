---
inject: true
to: src/modules/<%= name %>/<%= name %>.controller.ts
after: import
skip_if: import <%= Name %>Validator
---
import <%= Name %>Validator from './<%= name %>.validator';