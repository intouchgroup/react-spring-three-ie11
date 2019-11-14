import "core-js/stable";
import React from 'react';
import { render } from 'react-dom';
import { Anim } from './Anim';
import { Spring } from './Spring';

const App = () => (
    <div>
        <Spring />
        <Anim />
    </div>
);

render(<App />, document.getElementById('app'));