import { CommandController, main, alias, sub, keyword } from 'core/new';

@keyword('categories')
export default class TriviaCategories extends CommandController {
    @main('List available trivia categories')
    async main() {}

    @sub('Enable a trivia category for the channel')
    enable(category: string) {}

    @sub('Disable a trivia category for the channel')
    disable(category: string) {}
}
