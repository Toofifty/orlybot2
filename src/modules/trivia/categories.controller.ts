import { Controller, group, cmd } from 'core';

@group('categories')
export default class TriviaCategoriesController extends Controller {
    @cmd('list', 'List all available trivia categories')
    async list() {}
}
