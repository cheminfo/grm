'use strict';

import React from 'react';
import agent from 'superagent';

export default React.createClass({
    enable() {
        console.log('enable')
    },
    render() {
        var data = this.props.data;
        if (!this.props.local) {
            return (
                <div>
                    {data.name} - <a href="#" onClick={this.enable}>enable</a>
                </div>
            );
        } else {
            return (
                <div>
                    {data.name} - INFOS
                </div>
            );
        }
    }
});
