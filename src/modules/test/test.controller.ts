import { Controller, group } from 'core';
import TestSubController from './sub.controller';

import { delegate } from 'core';


@group('test')
@delegate(TestSubController)

export default class TestController extends Controller {

}
