Goals

1.  Don't repeat argument/state validation logic
2.  Allow delegation of sub commands to different modules
    -   Including redirects and aliases
3.  Disallow command metadata from being spread around the chain
4.  Further split metadata from command functionality
5.  Extract discrete actions
6.  Mutate data without boilerplate

Solutions

1. Command and argument validators
2. Delegate via decorator options to another class
3. Organise all metadata into decorators
4. ???
5. Create services for single-step actions
6. Create a saveable model from the store data
    1. Saves and auto refreshes itself
    2. Magic getters
    3. Relationships?

Commands

-   Register with smth like `registry.add('trivia', Trivia);`
-   Can decorators register the commands?
    -   If not - add a class decorator and use that to iterate methods
-   Command args - need to be know before hand
    -   Might need to add name to decs, in case it can't be taken from normal dec call

```tsx
```

Context

-   Stored on the command (this.ctx)?
-   Object containing:
    -   Message
        -   Reply/etc are here
    -   User
    -   Store
-   Alternatively all stored on the command?
    -   this.message,
    -   this.user,
    -   this.store

Validators

-   State and argument validators
-   Both async and passed the context

```tsx
```

Services

-   static

```tsx
// Usage
    @main({ aliases: ['list'] })
    async main() {
        const categories = await TriviaService.fetchCategories();
    }
```

Stores

-   No maps?
-   Add dynamic getters/setters with Object.defineProperty
    -   Merge types somehow
-   Auto convert objects from/to models
-   Auto convert arrays from/to collections
-   Models/collections have parent contexts
    -   On save, actually updates db via parent
    -   Parent is reloaded?
    -   Invalidate all children? i.e. only in dev?
-   Store is a top-level model
    -   Either different type or void parent

```tsx
interface Model<TParent, TData> {
    fresh: () => Promise<Model>;
    refresh: () => Promise<void>;
    save: () => Promise<void>;
}
```

```tsx
// Usage (array) [1]
const store = createStore(ctx);
// ...
const players = store.players;

players.forEach(player => {
    player.score = 0;
    player.save();
});

players.add({
    score: 0,
    id: ctx.user.id,
});
players.save();

// Usage (primitive) [1]
const createdAt = store.createdAt;
store.createdAt = +new Date();
store.save();

// Usage (object) [1]
const game = store.game;
game.tiles.pop();
game.save();

// Usage (array) [2]
const store = createStore(ctx);
// ...
const players = store.model('players', store.players);

players.forEach(player => {
    player.score = 0;
});
players.save();

players.add({
    score: 0,
    id: ctx.user.id,
});
players.save();

players.debug();

// Usage (object) [2]
const game = store.model('game', store.game);
game.tiles.pop();
game.save();

// Usage (array) [3]
const store = createStore(ctx);
// ...
const players = store.model('players', store.data.players);

players.forEach(player => {
    player.score = 0;
});
players.save();

players.add({
    score: 0,
    id: ctx.user.id,
});
players.save();

players.debug();
```
