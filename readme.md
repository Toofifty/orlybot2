# Orlybot 2.0.0

`orlybot` is a Slackbot written using Typescript/Node using the `@slack/web-api` and `@slack/rtm-api` packages.

## Getting started

Get started like any other project:

* Clone the repository
* Install dependencies with `yarn`
* Copy and populate `.env` from `.env.example`
* Run for development with `yarn bot`
* Build with `yarn build`

## Writing commands

Keyword commands can easily be added by making a new file or directory in `src/modules`, and importing it in `src/index.ts`.

In your new module, you need to import the command factory with:

```ts
import { Command } from 'core/commands';
```

and then you can use the factory to create commands, add descriptions, arguments and more.

```ts
Command.create('test', (message, args) => {
    // do something
})
    .desc('Test') // Add a help text description
    .arg({ name: 'test', def: 'default value', required: false }) // Add an argument
    .isPhrase() // enable phrase checking mode (so command can include spaces)
    .admin() // lock the command to only admin users
    .alias('t', 'tst') // add alias command(s) that will function exactly the same
    .hide() // hide the command from help text
    // add a sub command (note the use of Command.sub, not create)
    .nest(
        Command.sub('sub', message => { ... })
            .desc('Subcommand of test')
    );
```

## The `message` object and `args`

The `Message` object passed into the command callback contains the complete context of the command's execution - the user, channel, message text, and original arguments.

Correctly tokenized arguments are passed as the second parameter to the callback, and these can easily be destructured into individual parts with default values. `args` will always be an array of strings, so keep than in mind. Argument names don't have to match those given in the `.args()` chained method.

```ts
Command.create('roll', (message, [sides = '6'])) => {
    const max = Number(sides);
    // ...
})
    .arg({ name: 'sides', def: '6' });
```

### Responding to users

There are two super simple ways to respond to a message. First, you can just return a string from the function (`Promise<string>`s will also work):

```ts
Command.create('say', (_, args) => args.join(' '));
```

The bot will automatically `reply` with the returned string. If the command requires higher priviledges, the reply will be `ephemeral` (`reply` and `ephemeral` explained below).

You can also call one of the `reply` methods on the `message` object itself: `reply`, `replyEphemeral` and `replyPrivately`.


#### `reply`

If the message is in a channel, the bot will post the new message into the same channel. Otherwise if the message was from an IM, it will be responded to privately.

```ts
Command.create('say', (message, args) => {
    message.reply(args.join(' '));
});
```

#### `replyEphemeral`

Replies in a user-specific temporary message that can't be seen by other users. Works both in channels and IMs.

```ts
Command.create('say', (message, args) => {
    message.replyEphemeral(args.join(' '));
});
```

#### `replyPrivately`

Force a response via IM even if the original message was in a channel.

```ts
Command.create('say', (message, args) => {
    message.replyPrivately(args.join(' '));
});
```

### Finding users

## Storing data

### On a user

### In a document


