'use strict';

import React from 'react';
import agent from 'superagent';

export default React.createClass({
    render() {
        return (
            <h2>
                Hello {this.props.name} !
            </h2>
        );
    }
});
