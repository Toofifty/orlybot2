import { Validator } from 'core/commands/types';
import User, { USER_TAG_REGEX } from 'core/model/user';
import { validators } from 'core/new';

const CategoryEnabled: Validator = () => true;

export default validators({
    ValidDifficulty: arg =>
        ['easy', 'medium', 'hard'].includes(arg) || 'Invalid difficulty',

    UserExists: arg =>
        (USER_TAG_REGEX.test(arg) && !!User.find(arg)) ||
        `Could not find user ${arg}`,

    ValidCategory: args => true,

    CategoryEnabled,

    CategoryNotEnabled: (...args) =>
        CategoryEnabled(...args) ? 'That category is already enabled.' : true,
});
