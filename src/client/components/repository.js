'use strict';

import React from 'react';

export default React.createClass({
    render() {
        var data = this.props.data;
        if (!this.props.local) {
            return (
                <div>
                    {data.name} - not configured
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
