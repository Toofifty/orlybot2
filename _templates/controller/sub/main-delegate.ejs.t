---
inject: true
to: src/modules/<%= module %>/<%= module %>.controller.ts
after: \@group
skip_if: \@delegate
---
@delegate(<%= h.changeCase.pascal(module) %><%= Name %>Controller)