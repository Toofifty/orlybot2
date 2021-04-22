import { Controller, register } from 'core/oop';
import { group, cmd, phrase } from 'core/oop/decorators';
import Message from 'core/model/message';
import { sleep, choose } from 'core/util';
import { JokesService } from './jokes.service';

@group('joke')
export default class JokesController extends Controller {
    @cmd('hmm', 'Tell me a joke')
    public async joke(service: JokesService, message: Message) {
        const { setup, punchline } = await service.fetchJoke();
        message.reply(setup);
        await sleep(5000);
        message.reply(punchline);
    }

    @cmd('good bot', 'Thank me')
    @phrase
    public async goodBot(message: Message) {
        message.reply(
            choose(['Thanks :heart:', 'Cheers!', ':heart_eyes:', 'Thanks!'])
        );
    }
}

register(JokesController);
