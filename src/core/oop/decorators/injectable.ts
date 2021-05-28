import { Meta } from '../meta';

/**
 * Use this to enable dependency injection on
 * classes without other decorators.
 */
export const injectable = () => (
    target: object,
    property?: string | symbol
) => {};
