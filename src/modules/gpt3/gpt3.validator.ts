import { injectable } from 'core';
import { Validator } from 'core/oop/types';

export default class Gpt3Validator {
    @injectable()
    someArgIsValid(): Validator {
        return async arg => arg || 'Error message';
    }
}
