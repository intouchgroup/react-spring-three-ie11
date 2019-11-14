import React, { useState } from 'react';
import { animated, useSpring } from 'react-spring/web.cjs';

const style1 = { opacity: 0, backgroundColor: 'red' };
const style2 = { opacity: 1, backgroundColor: 'green' };

export const Spring = () => {
    const [state, setState] = useState(false);
    const springProps = useSpring({
        from: style1,
        to: state ? style1 : style2,
        config: { tension: 100 },
    });

    const handleClick = () => setState(oldState => !oldState);

    return (
        <div>
            <button onClick={handleClick}>
                Click Me
            </button>
            <animated.div style={springProps}>
                Spring
            </animated.div>
        </div>
    );
};