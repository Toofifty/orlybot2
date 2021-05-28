---
to: src/modules/<%= name %>/<%= name %>.store.ts
---
import { Store, Channel, injectable } from 'core';

export interface I<%= Name %>Store {}

interface <%= Name %>Store extends I<%= Name %>Store {}

@injectable()
class <%= Name %>Store extends Store<I<%= Name %>Store> {
    initial = {};

    constructor(channel: Channel) {
        super(`<%= name %>:${channel.id}`);
    }
}

export default <%= Name %>Store;
