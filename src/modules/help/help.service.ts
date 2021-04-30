import { registry } from 'core';

export default class HelpService {
    getCommandKeywords() {
        return registry.all().map(({ keyword }) => keyword);
    }
}
