import { Command } from 'core/commands';
import fetch from 'node-fetch';

Command.create('inspire me', () =>
    fetch('https://inspirobot.me/api?generate=true').then(res => res.text())
)
    .desc('Generate an inspiritational quote via Inspirobot')
    .alias('inspire');
