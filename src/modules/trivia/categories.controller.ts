import {
    Controller,
    group,
    cmd,
    Message,
    maincmd,
    aliases,
    validate,
} from 'core';
import TriviaService from './trivia.service';
import TriviaStore from './trivia.store';
import { Category } from './types';
import TriviaValidator from './trivia.validator';

@group('categories')
export default class TriviaCategoriesController extends Controller {
    @maincmd('List all available trivia categories')
    @aliases('c')
    async list(message: Message, service: TriviaService, store: TriviaStore) {
        const allCategories = await service.fetchCategories();
        const fmt = (list: Category[]) =>
            list.map(({ name }) => `\`${name}\``).join(', ');
        message.reply(
            `Available trivia categories:\n${fmt(allCategories)}${
                store.enabledCategories.length > 0
                    ? `\nEnabled:\n${fmt(
                          allCategories.filter(cat =>
                              store.enabledCategories.includes(cat.id)
                          )
                      )}`
                    : ''
            }`
        );
    }

    @cmd('disable', 'Disable a trivia category for the channel')
    @aliases('remove', 'del')
    async disable(
        message: Message,
        service: TriviaService,
        store: TriviaStore,
        @validate(TriviaValidator, 'validCategory', 'categoryIsEnabled')
        category: string
    ) {
        const target = (await service.fetchCategory(category))!;
        store.enabledCategories = store.enabledCategories.filter(
            catId => catId !== target.id
        );
        store.save();

        message.reply(`Disabled category *${target.name}*`);
    }

    @cmd('enable', 'Enable a trivia category for the channel')
    @aliases('add')
    async enable(
        message: Message,
        service: TriviaService,
        store: TriviaStore,
        @validate(TriviaValidator, 'validCategory', 'categoryIsDisabled')
        category: string
    ) {
        const target = (await service.fetchCategory(category))!;
        store.enabledCategories.push(target.id);
        store.save();

        message.reply(`Enabled category *${target.name}*`);
    }
}
