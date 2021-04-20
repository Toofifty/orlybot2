import { Validator } from 'core/commands/types';
import { validators } from 'core/new';

const CategoryEnabled: Validator = () => true;

export default validators({
    ValidDifficulty: arg =>
        ['easy', 'medium', 'hard'].includes(arg) || 'Invalid difficulty',

    ValidCategory: args => true,

    CategoryEnabled,

    CategoryNotEnabled: (...args) =>
        CategoryEnabled(...args) ? 'That category is already enabled.' : true,
});
