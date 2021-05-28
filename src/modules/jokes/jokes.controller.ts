import { Controller, register } from 'core/oop';
import { cmd } from 'core/oop/decorators';
import Message from 'core/model/message';
import { sleep } from 'core/util';
import { JokesService } from './jokes.service';

export default class JokesController extends Controller {
    @cmd('joke', 'Tell me a joke')
    public async joke(service: JokesService, message: Message) {
        const { setup, punchline } = await service.fetchJoke();
        message.reply(setup);
        await sleep(5000);
        message.reply(punchline);
    }

    @cmd('dadjoke', 'Tell me a dad joke')
    public async dadJoke(service: JokesService, message: Message) {
        const { joke } = await service.fetchDadJoke();
        message.reply(joke);
    }
}
