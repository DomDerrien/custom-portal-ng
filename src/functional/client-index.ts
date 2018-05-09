import intern from 'intern';
import { Remote } from 'intern/lib/executors/Node';
import Command from '@theintern/leadfoot/Command';
import pollUntil, { Poller } from '@theintern/leadfoot/helpers/pollUntil';

import { findElement } from './utils';

const { suite, test } = intern.getInterface('tdd');

suite(__filename.substring(__filename.indexOf('/functional/') + '/functional/'.length), (): void => {

    test('Load main page and check the <portal-shell/> presence', ({ remote }: { remote: Remote }): Command<void, any> => {
        return remote
            .get('http://localhost:8082/')
            .then(pollUntil(<Poller>findElement, ['portal-shell'], 5000, 250))
            .then((): Command<void, any> => remote)
            ;
    });

    test('Load a random page and check the <portal-shell/> presence', ({ remote }: { remote: Remote }): Command<void, any> => {
        return remote
            .get('http://localhost:8082/wherever/for/whatever/reason')
            .then(pollUntil(<Poller>findElement, ['portal-shell'], 5000, 250))
            .then((): Command<void, any> => remote)
            ;
    });
});