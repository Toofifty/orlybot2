---
to: src/modules/<%= name %>/<%= name %>.validator.ts
---
import { injectable } from 'core';
import { Validator } from 'core/oop/types';

export default class <%= Name %>Validator {
    @injectable()
    someArgIsValid(): Validator {
        return async arg => arg || 'Error message';
    }
}
