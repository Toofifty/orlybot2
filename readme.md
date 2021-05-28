# Orlybot 2.1.0

`orlybot` is a Slackbot written using Typescript/Node using the `@slack/web-api` and `@slack/rtm-api` packages.

# Getting started

Get started like any other project:

* Clone the repository
* Install dependencies with `yarn`
* Copy and populate `.env` from `.env.example`
* Run for development with `yarn bot`
* Build with `yarn build`

# Writing commands

## File generation

`hygen` can be used to generate common types of classes needed to develop commands. It's recommended to install `hygen` globally, however you can use it via `npx` in each command.

```bash
# install globally
yarn global add hygen
# use
hygen <generator> <action> [...args]

# or
npx hygen <generator> <action> [...args]
```

## Controllers

To generate a controller, use this `hygen` command

```bash
hygen controller new --name <module_name>
```

This will generate a controller and containing module inside the `src/modules/` directory. 

### Ungrouped commands

To add an ungrouped command, create a class method and use the `@cmd(keyword, description)` decorator to add metadata.

```ts
export default class ModuleController extends Controller {
    @cmd('keyword', 'This is the description')
    command() {
        console.log('ran command');
    }
}
```

This will register a command that can be triggered by sending `@orlybot` "keyword" in Slack. Any amount of ungrouped commands can be added to the controller. If the keyword is reused, only one command will be correctly registered.

### Grouped commands

Commands can also be grouped under an umbrella/module command. This is preferred to using ungrouped commands when the commands are tightly related.

To create a group on a controller, use the `@group(name)` decorator.

```ts
@group('mygroup')
export default class ModuleController extends Controller {}
```

You can now add sub-commands in the same way as the ungrouped commands above, using the `@cmd` decorator.

```ts
@group('mygroup')
export default class ModuleController extends Controller {
    @cmd('subcommand', 'This is the subcommand')
    command() {
        console.log('ran command');
    }
}
```
```sh
# Generated help text
mygroup
    subcommand - This is the subcommand
```

This will then be able to be triggered by sending `@orlybot` "mygroup subcommand".

#### Main command

If you'd like to attach a function to the group itself; i.e., the "main" command, you just need to use the `@maincmd(description)` decorator instead of `@cmd`.

```ts
@group('mygroup')
export default class ModuleController extends Controller {
    @maincmd('This is the main command')
    main() {
        console.log('ran main command');
    }
}
```
```sh
# Generated help text
mygroup - This is the main command
```

This will then be able to be triggered by sending `@orlybot` "mygroup".
All further decorators of this method will apply to the group's main command.

`@maincmd` cannot be used outside of a `@group`, and should only be used once per group. Subcommands can still be added alongside the main command, with `@cmd`.

### Dependency injection

Command methods will have their dependencies injected automatically, so you can easily specify what context you need for the command. Most likely, you'll need the `Message` object to reply to the user-

```ts
export default class ModuleController extends Controller {
    @cmd('hello', 'Say hello!')
    command(message: Message) {
        message.reply('Hello world');
    }
}
```

Three objects are available as singletons, and contain information about the message. These are `Message`, `Channel`, and `User`. You can `reply` to each of these, although it's recommended to reply only to the `Message` as it will automatically determine where the response should go (channel or IM).

You can also specify your own dependencies that may be needed for the module. You can inject any class just by typing one of the method's parameters. Commonly this is used to inject a `Store` or `Service`.

```ts
@group('game')
export default class GameController extends Controller {
    @cmd('start', 'Start the game')
    command(message: Message, store: GameStore, service: GameService) {
        store.game = await service.startGame();
        store.save();
        message.reply('Game started!');
    }
}
```

### Command arguments

Command arguments will also be injected into the command's method as strings. The naming and default values in the method signature are important - as these will be used to display argument help.

```ts
export default class ModuleController extends Controller {
    @cmd('hello', 'Say hello!')
    command(message: Message, name: string = 'world') {
        message.reply(`Hello ${name}!`);
    }
}
```
```sh
# Generated help text
hello [name="world"] - Say hello!
```

Using a default value like this (`'world'`) will not only display the value in the help text, but will also mark the argument as optional. If no default is specified, the argument will be required and the command will fail if it is not present. If you must allow for an optional argument with no default, set the parameter default to empty string `''`.

You can also use rest parameters to accept any amount of arguments, and this too will be reflected nicely in the help text.

```ts
export default class ModuleController extends Controller {
    @cmd('hello', 'Say hello to some users!')
    command(message: Message, ...users: string[]) {
        message.reply(`Hello ${users.map(user => mention(user)).join(', ')}!`);
    }
}
```
```sh
# Generated help text
hello <...users> - Say hello!
```

Although the help text indicates those arguments are required, they will not be automatically validated.

#### Validation

Arguments can be individually validated using the `@validate(class, ...methodNames)` decorator. See [Validators](#Validators) below.

```ts
import ModuleValidator from './module.validator';

export default class ModuleController extends Controller {
    @cmd('hello', 'Say hello to a planet!')
    command(
        message: Message, 
        @validate(ModuleValidator, 'nameIsAPlanet')
        name: string = 'world'
    ) {
        message.reply(`Hello ${name}!`);
    }
}
```

## Stores

Stores are used to persist data between restarts of the bot. Because of timeout issues with the Slack API, the main instance of the bot (`@mathobot`) is restarted on a cron every 2 hours. Therefore, it is important to write module data to disk so it can be restored.

To create a store for your module, simply run this `hygen` generator:
```bash
hygen store new --name <module_name>
```

This will scaffold a new store inside your module directory. By default, the data for each channel that interacts with the store is saved in a key formatted as `<module_name>:<channel.id>`. This can be changed if required.

### Defining data types & initial data

Before you can save data to your store, you need to declare the type of the data you wish to store. This can be done inside the `IModuleStore` interface that is exported at the top of the store file.

Note that you cannot use optional or `undefined` properties, here - use `null` if necessary.

```ts
export interface IModuleStore {
    usersGreeted: string[];
}
```

Once the store type is declared, you can define the initial data used to populate the store by assigning it to the `initial` property on the `ModuleStore` class. Here you will get type errors if you allow any of your store properties to be `undefined`.

```ts
@injectable()
class ModuleStore extends Store<IModuleStore> {
    initial = { usersGreeted: [] };
}
```

### Using the store

The store is now ready to be dependency injected into your command method. You can access and mutate data within your store just on the `ModuleStore` object itself, and `save()` it when your changes are made.

```ts
import ModuleStore from './module.store';

export default class ModuleController extends Controller {
    @cmd('hello', "Say hello to users that haven't been greeted yet")
    command(message: Message, store: ModuleStore, ...users: string[]) {
        const newUsers = users.filter(
            user => !store.usersGreeted.includes(user)
        );
        message.reply(`Hello ${newUsers.map(user => mention(user)).join(', ')}!`);
        store.usersGreeted = [...store.usersGreeted, ...newUsers];
        store.save();
    }
}
```

### Troubleshooting

At any time (as an admin) you can read the store of a module using the `debug db read <key>` command. For example, `debug db read module:$channel` will return `{ usersGreeted: [], _id: ..., _rev: ... }`.

If you have issues with bad data persisting in your store, you can force it to reset next time it loads. Just set the `forceReset` property on the store to `true` and restart the bot.

```ts
@injectable()
class ModuleStore extends Store<IModuleStore> {
    forceReset = true;
```

## Validators

Validators help remove verbose argument checking logic and package it away in a way that makes it easy to use and reuse.

To create a store for your module, simply run this `hygen` generator:
```bash
hygen validator new --name <module_name>
```

This will scaffold a new validator inside your module directory, with an example validator factory method.

Validator factory methods are simply class methods that return a `Validator` function. The validator factory methods can accept dependencies with DI via teh `@injectable()` decorator, so it's easy to validate arguments against an internal/external service, or a store.

The `Validator` function returned should accept the argument value, index, and context of other arguments provided. If the validation passes, the function should return `true`. If not, it should return a relevant error message, in a string. The function can be async if necessary.

Default argument values **are not** passed in to validators - these arguments will be `undefined`.

```ts
export default class ModuleValidator {
    nameIsAPlanet(): Validator {
        return name =>
            !name ||
            ['mercury', 'venus', 'earth', 'world'].includes(name) ||
            'Invalid planet';
    }

    @injectable()
    nameIsNotBlocked(store: ModuleStore): Validator {
        return name =>
            !store.blockedPlanets.includes(name) ||
            'Planet is blocked';
    }
}
```

The validators can then be used in the `@validate(class, ...methodNames)` decorator, which can accept multiple validation methods from a single class.

```ts
import ModuleValidator from './module.validator';

export default class ModuleController extends Controller {
    @cmd('hello', "Say hello to a planet (that isn't blocked)!")
    command(
        message: Message, 
        @validate(ModuleValidator, 'nameIsAPlanet', 'nameIsNotBlocked')
        name: string = 'world'
    ) {
        message.reply(`Hello ${name}!`);
    }
}
```

## Services

Services are simply used to extract "business" logic from your controller, in a way that allows you to reuse them. Service methods **are not** dependency injectable, also the class itself is.

To create a service for your module, simply run this `hygen` generator:
```bash
hygen service new --name <module_name>
```

This will scaffold a new service inside your module directory.

An example service method, to fetch a random word:

```ts
export default class ModuleService {
    async fetchRandomWord(): string {
        const [word] = await fetch('https://www.thegamegal.com/wordgenerator/generator.php')
            .then(res => res.json())
            .then(res => res.words);
        return word;
    }
}
```
```ts
import ModuleService from './module.service';

export default class ModuleController extends Controller {
    @cmd('word', 'Get a random word')
    async randomWord(message: Message, service: ModuleService) {
        message.reply(await service.fetchRandomWord());
    }
}
```

## Delegated (sub) controllers

You can also use a decorator to delegate sub commands to another controller - allowing you to more cleanly separate your code.

To create a new sub controller for your module, simply run this `hygen` generator:
```bash
hygen controller sub --module <module_name> --name <controller_name>
```

This will scaffold a new controller inside your module directory.

All you need to do to "register" this new controller as a sub command of your main controller is use the `@delegate(controller)` decorator.

```ts
import ModuleSubmoduleController from './submodule.controller';

@group('mygroup')
@delegate(ModuleSubmoduleController)
export default class ModuleController extends Controller {}
```
```ts
@group('mysubmodule')
export default class ModuleSubmoduleController extends Controller {
    @maincmd('Run the submodule command')
    main(message: Message) {
        message.reply('Hello submodule!');
    }
}
```
```sh
# Generated help text
mygroup
    mysubmodule - Run the submodule command
```

The sub controller will act as any other normal group command, though now it is nested under the parent's group keyword. You'll be able to execute the command with "mygroup mysubmodule".

## User object

The current user is available to dependency inject using the class `User`. This allows you to access Slack information about the user, as well as store workspace-wide metadata for them.

### Storing data on a user

To store metadata on the user, simply use the `meta` method to get or set data.

```ts
const gameWins = user.meta<number>('game_wins');

// pass new data as second parameter
const setGameWins = (wins: number) => {
    user.meta('game_wins', wins);
};

// or pass a function to update current metadata
const incrementGameWins = () => {
    user.meta<number>('game_wins', wins => wins + 1);
};
```

You can store any JSON-serializable type of data.

### Mentioning

The simplest way to mention a user is just to convert the object to string. This is especially helpful with string interpolation

```ts
message.reply(`Hello ${user}!`);
```

If you only have a user ID however, it makes sense to just use the `mention` utility function, rather than lookup the user to get the object.

```ts
message.reply(`Hello ${mention(userId)}!`);
```

### Finding other users

The static `User` class can also act as a repostory to load a user by ID/tag or to get all users that have previously interacted with the bot.

```ts
const user = await User.find('@ABC123456');
const allUsers = await User.all();
```

## Message object

```ts
// WIP
```

You can call one of the `reply` methods on the `Message` object to respond to a user message: `reply`, `replyEphemeral` and `replyPrivately`.

### `reply`

If the message is in a channel, the bot will post the new message into the same channel. Otherwise if the message was from an IM, it will be responded to privately.

```ts
message.reply(text, attachments?);
```

### `replyEphemeral`

Replies in a user-specific temporary message that can't be seen by other users. Works both in channels and IMs.

```ts
message.replyEphemeral(text);
```

### `replyPrivately`

Force a response via IM even if the original message was in a channel.

```ts
message.replyPrivately(text, attachments?);
```

