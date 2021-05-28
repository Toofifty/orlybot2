---
inject: true
to: src/modules/<%= module %>/<%= module %>.controller.ts
after: import
skip_if: import <%= h.changeCase.pascal(module) %><%= Name %>Controller
---
import <%= h.changeCase.pascal(module) %><%= Name %>Controller from './<%= name %>.controller';