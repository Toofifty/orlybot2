import { Controller, group, injectable, injectableMethod } from 'core/oop';
import { Service } from 'typedi';

@Service()
class TestCls {
    thing() {}
}

@group('joke')
@injectable
@Service()
export default class JokesController extends Controller {
    constructor(test: TestCls) {
        super();
    }

    @injectableMethod
    public testMethod(test: Controller) {}
}
