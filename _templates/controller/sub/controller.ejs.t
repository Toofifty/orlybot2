---
to: src/modules/<%= module %>/<%= name %>.controller.ts
---
import { Controller, group } from 'core';

@group('<%= name %>')
export default class <%= h.changeCase.pascal(module) %><%= Name %>Controller extends Controller {

}
